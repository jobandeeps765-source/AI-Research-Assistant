import asyncio
import json
import re
import urllib.request
from app.config import get_settings

settings = get_settings()

GEMINI_MODEL = settings.GEMINI_MODEL
API_BASE = "https://generativelanguage.googleapis.com/v1beta"

RESEARCH_PROMPT = """You are an expert research strategist and analyst.
Analyze the following research topic thoroughly.
Provide comprehensive research findings including:
- Key facts and definitions
- Important statistics and data points
- Expert opinions and viewpoints
- Real-world examples and case studies
- Current trends and recent developments
- Challenges and limitations
- Future prospects

Topic: {topic}

Provide detailed research findings. Be specific with numbers, dates, and examples."""

WRITER_PROMPT = """You are a skilled writer who explains things in a way that anyone can understand.
Transform the research below into a clear, easy-to-read report.

RULES:
- Write like you're explaining to a smart friend, not a professor
- Use simple, everyday language — avoid jargon and technical terms
- Use short paragraphs and sentences
- Use real-world analogies and relatable examples
- Start with a single # title (the topic name)
- Use ## for main sections, ### for subsections
- Use bullet points (-) and bold text (**text**) where appropriate
- Each section must have enough content to be useful (not just one line)
- Make it feel like a well-written blog post, not a corporate paper

Write EXACTLY these sections in this order:

## Executive Summary
A quick overview — what this report covers and why it matters, in plain English.

## Introduction
Set the stage. What is this topic? Why should anyone care? Give context.

## Key Findings
Use ### subsections for each major point. Share interesting facts, numbers, and examples. Keep it engaging.

## Analysis & Discussion
What do these findings mean? What are the different perspectives? What's the bigger picture?

## Conclusion
Wrap it up. What are the main takeaways?

## Recommendations
Numbered list of practical things people can actually do with this information.

---

Research:
{findings}

Write the full report now. Make it clear, engaging, and at least 1500 words. Write like a human, not a textbook."""


RETRYABLE_STATUS_CODES = {429, 500, 502, 503}
MAX_ATTEMPTS = 6


def _backoff(attempt: int, delay=None, e=None) -> float:
    import time
    if delay is not None:
        return delay + 1
    if e is not None:
        try:
            retry_after = e.headers.get("Retry-After")
            if retry_after is not None:
                return float(retry_after)
        except Exception:
            pass
    base = 2 ** attempt
    return base + time.monotonic() % 1


def _parse_error(e):
    """Return (message, retry_delay_seconds_or_None) from a Gemini HTTPError."""
    try:
        body = json.loads(e.read().decode("utf-8", errors="replace"))
        msg = body.get("error", {}).get("message", "").strip()
    except Exception:
        msg = ""
    if not msg:
        msg = str(e)
    delay = None
    m = re.search(r"retry in ([\d.]+)", msg, re.IGNORECASE)
    if m:
        delay = float(m.group(1))
    return msg, delay


def call_gemini(prompt: str) -> str:
    """Call Gemini with retries on transient errors (429/500/502/503)."""
    import time
    url = f"{API_BASE}/models/{GEMINI_MODEL}:generateContent?key={settings.GEMINI_API_KEY}"
    payload = json.dumps({
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.7},
    }).encode()

    for attempt in range(MAX_ATTEMPTS):
        try:
            req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})
            resp = urllib.request.urlopen(req, timeout=180)
            data = json.loads(resp.read())
            try:
                return data["candidates"][0]["content"]["parts"][0]["text"]
            except (KeyError, IndexError):
                raise RuntimeError(
                    f"Gemini returned no text content: {json.dumps(data)[:500]}"
                )
        except urllib.error.HTTPError as e:
            detail, delay = _parse_error(e)
            if e.code in RETRYABLE_STATUS_CODES and attempt < MAX_ATTEMPTS - 1:
                time.sleep(_backoff(attempt, delay, e))
                continue
            raise RuntimeError(f"Gemini API error {e.code}: {detail}")
        except (TimeoutError, OSError) as e:
            if attempt < MAX_ATTEMPTS - 1:
                time.sleep(_backoff(attempt, e=e))
                continue
            raise


def _call_gemini(prompt: str) -> str:
    return call_gemini(prompt)


def _run_crew_sync(topic: str) -> str:
    findings = _call_gemini(RESEARCH_PROMPT.format(topic=topic))
    report = _call_gemini(WRITER_PROMPT.format(findings=findings))
    return report


async def run_research_crew(topic: str) -> str:
    result = await asyncio.to_thread(_run_crew_sync, topic)
    return result

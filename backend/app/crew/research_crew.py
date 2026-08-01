import asyncio
import json
import re
import urllib.request
from app.config import get_settings

settings = get_settings()

GEMINI_MODEL = settings.GEMINI_MODEL
API_BASE = "https://generativelanguage.googleapis.com/v1beta"

RESEARCH_PROMPT = """You are a research assistant who gathers simple, plain-English notes about a topic.

For the topic below, gather short, clear notes:
- What it is (in simple words)
- A few key facts and numbers
- 2-3 real-world examples
- Main pros and cons or challenges
- What might happen next

Keep every point short and simple. No jargon. Use bullet points.

Topic: {topic}
"""

WRITER_PROMPT = """You are a friendly writer who explains things simply, like you're talking to a friend.

Turn the notes below into a SHORT, easy-to-read report.

RULES:
- Plain, everyday words only. No jargon, no big words, no fancy phrasing.
- Keep it SHORT: about 300 words (maximum 400 words).
- Short sentences. Short paragraphs (1-3 sentences).
- Start with a single # title (the topic name).
- Use ONLY these sections:
  ## What's it about
  ## Key points
  ## Bottom line
- Use bullet points (-) and bold (**text**) where useful.
- Do not add any other sections. Do not repeat the same point twice.

Notes:
{findings}

Write the short, simple report now."""


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

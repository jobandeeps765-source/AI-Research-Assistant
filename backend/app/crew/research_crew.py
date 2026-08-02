import asyncio
import json
import re
import urllib.request
from app.config import get_settings

settings = get_settings()

GEMINI_MODEL = settings.GEMINI_MODEL
API_BASE = "https://generativelanguage.googleapis.com/v1beta"

RESEARCH_PROMPT = """You are a thorough research assistant who gathers detailed, factual notes about a topic.

For the topic below, gather comprehensive notes:
- Clear definition: what it is, its purpose, and how it works (explained properly, not vague)
- Background and context: where it came from and why it matters
- Key facts, figures, and statistics (with concrete numbers where possible)
- Advantages: list each benefit with a short explanation of why it helps
- Disadvantages: list each drawback or limitation with a short explanation
- Real-life uses: the actual industries, sectors, and situations where it is applied
- 3-5 concrete real-world examples with enough detail to be useful
- Current trends and what might happen next

Be accurate and specific. Avoid vague filler. Use bullet points under each heading.

Topic: {topic}
"""

WRITER_PROMPT_PART1 = """You are a professional technical writer producing an accurate, detailed research report.

You are writing PART 1 of a long report. Write the opening sections of the report. Write at least 1200 words. Do not stop early.

Write these sections, in this order:
- Start with a single # title (the topic name).
- ## Introduction and Definition — about 450 words. Explain what the topic is, its background, how it works, and why it matters.
- ## Advantages — about 750 words. Describe every key benefit; expand each one into its own paragraph or bolded point with a full explanation.

RULES:
- Write in full paragraphs. Never use one-line bullet points — expand every point into several sentences of explanation, detail, and reasoning.
- Be accurate, factual, and specific. Do not pad with repetition or filler.
- Use subheadings (###) inside sections to organize related points.
- Professional but clear language.
- Do NOT write the disadvantages, uses, or conclusion yet. Do NOT include a "Key points" or "Summary" section.

Notes:
{findings}

Write PART 1 now: title, Introduction and Definition, and Advantages. Write at least 1200 words."""


WRITER_PROMPT_PART2 = """You are a professional technical writer producing an accurate, detailed research report.

You are writing PART 2 of the report titled "{topic}". Continue the same report from where PART 1 left off. Write at least 1300 words. Do not stop early. Do not repeat the title, introduction, or advantages.

Write these sections, in this order:
- ## Disadvantages — about 750 words. Describe every drawback, limitation, and challenge, expanding each one with a full explanation.
- ## Real-Life Uses and Examples — about 900 words. Explain where and how it is actually applied in the real world, and give 3-5 concrete examples, each described in detail.
- ## Conclusion — about 350 words. Summarize the main points and state what may happen next.

RULES:
- Write in full paragraphs. Never use one-line bullet points — expand every point into several sentences of explanation, detail, and reasoning.
- Be accurate, factual, and specific. Do not pad with repetition or filler.
- Use subheadings (###) inside sections to organize related points.
- Professional but clear language.
- Do NOT include a "Key points" or "Summary" section.

Notes:
{findings}

Write PART 2 now: Disadvantages, Real-Life Uses and Examples, and Conclusion. Write at least 1300 words."""


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
        "generationConfig": {"temperature": 0.7, "maxOutputTokens": 8192},
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
    part1 = _call_gemini(WRITER_PROMPT_PART1.format(findings=findings))
    part2 = _call_gemini(WRITER_PROMPT_PART2.format(findings=findings, topic=topic))
    return part1.strip() + "\n\n" + part2.strip()


async def run_research_crew(topic: str) -> str:
    result = await asyncio.to_thread(_run_crew_sync, topic)
    return result

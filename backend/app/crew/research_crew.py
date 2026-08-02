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
- Advantages: list EACH benefit separately, with a short explanation of why it helps. Gather as many distinct benefits as you can.
- Disadvantages: list EACH drawback or limitation separately, with a short explanation. Gather as many distinct drawbacks as you can, and make sure they are different points from the advantages.
- Real-life uses: the actual industries, sectors, and situations where it is applied
- 3-5 concrete real-world examples with enough detail to be useful
- Current trends and what might happen next

CRITICAL RULES:
- Every advantage must be a different point from every disadvantage. Never list the same point as both an advantage and a disadvantage.
- Make sure the real-life uses and examples are different from the advantages/disadvantages — they show application, not pros/cons.
- Be accurate and specific. Avoid vague filler. Use bullet points under each heading.

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

ANTI-REPETITION RULES (most important):
- Every sentence must introduce NEW information. Never restate an idea already mentioned in an earlier section.
- Each point may appear only once in the entire report.
- The Introduction gives background and definition. The Advantages section must only present positive benefits that were NOT mentioned in the Introduction.

Notes:
{findings}

Write PART 1 now: title, Introduction and Definition, and Advantages. Write at least 1200 words. Make every point unique — do not repeat anything."""


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

ANTI-REPETITION RULES (most important):
- Every sentence must introduce NEW information. Never restate an idea already covered in PART 1 (title, Introduction, Advantages).
- Each point may appear only once in the entire report.
- The Disadvantages section must present only negative aspects — never re-use a benefit from the Advantages section as a disadvantage, and never repeat a definition point from the Introduction.
- The Real-Life Uses and Examples section must show real-world applications only — do not repeat pros or cons here.
- The Conclusion summarizes, but must phrase it in fresh words, not copy sentences from earlier sections.

Notes:
{findings}

Write PART 2 now: Disadvantages, Real-Life Uses and Examples, and Conclusion. Write at least 1300 words. Make every point unique — do not repeat anything."""


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
        "generationConfig": {"temperature": 0.85, "maxOutputTokens": 8192},
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


ANSWER_PROMPT = """You are a knowledgeable AI assistant, just like ChatGPT or Gemini.

Below is a set of questions. Answer them the natural way ChatGPT or Gemini would — flowing, friendly, and conversational.

Guidelines:
- Answer EVERY question, one after another, in the same order they appear.
- Do NOT use a rigid template like "Q1. [question] **Answer:** [answer]". Write naturally instead.
- For each question, write a short bold heading (the question, reworded naturally) and then a complete, detailed answer in normal paragraphs.
- Every answer must be thorough: explain the concept clearly, include steps or examples where helpful, and cover all parts of the question.
- Keep the original order of the questions so it reads like a continuous Q&A session.
- Sound natural and human, not like a form or exam sheet. Avoid repeating the question verbatim and then copying it again.

Questions:
{document}
"""


def _split_document(text: str, max_chars: int = 4000) -> list[str]:
    """Split a document into chunks, trying to keep question blocks intact."""
    lines = text.splitlines()
    chunks: list[str] = []
    current = ""
    for line in lines:
        if len(current) + len(line) + 1 > max_chars and current.strip():
            chunks.append(current)
            current = ""
        current += line + "\n"
    if current.strip():
        chunks.append(current)
    return chunks


Q_VERBS = (
    r"(?:w\.a\.p|wap|what|why|how|when|where|which|state|explain|define|list|"
    r"mention|write|name|describe|differentiate|compare|create|give|enlist|"
    r"comment|elaborate|build|show|find|prove|derive|solve|calculate|sketch|"
    r"outline|fill|answer|note|evaluate|discuss|identify|justify|trace)"
)


def _split_questions(text: str, questions_per_batch: int = 5, max_chars: int = 8000) -> list[str]:
    """Split a document into question batches so no question is split in half.

    Handles many formats: '1. Question', '1 Question', 'Q1 Question', 'Q.1 Question'.
    Each batch keeps the original question numbers so answers stay in order.
    """
    pattern = re.compile(
        r"(?<!\d)(?:(?:Question\s+|Q\.?\s*)?\d+[.)]?\s+)(?=" + Q_VERBS + r"\b)",
        re.IGNORECASE,
    )
    matches = list(pattern.finditer(text))
    if len(matches) < 2:
        return _split_document(text, max_chars)

    blocks: list[str] = []
    for i, m in enumerate(matches):
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        block = text[m.start():end].strip()
        if block:
            blocks.append(block)

    batches: list[str] = []
    current = ""
    count = 0
    for b in blocks:
        if (count >= questions_per_batch) or (current and len(current) + len(b) > max_chars):
            batches.append(current)
            current = ""
            count = 0
        current += b + "\n"
        count += 1
    if current.strip():
        batches.append(current)
    return batches


def _run_qa_sync(document: str) -> str:
    parts = _split_questions(document)
    answers = [_call_gemini(ANSWER_PROMPT.format(document=part)) for part in parts]
    return "\n\n".join(a.strip() for a in answers)


async def run_qa_crew(document: str) -> str:
    result = await asyncio.to_thread(_run_qa_sync, document)
    return result

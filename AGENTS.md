# AGENTS.md

This file describes the AI agents and pipeline used in this project.

---

## AI Pipeline Architecture

The project uses a **custom 2-step Gemini pipeline** (not the formal CrewAI `Agent`/`Task`/`Crew` classes). The backend calls Google Gemini (`gemini-3.1-flash-lite` by default) directly via its REST API, with two sequential prompts.

> **Note:** `backend/app/agents/research_agents.py` and `backend/app/tasks/research_tasks.py` define unused CrewAI Agent/Task classes from an earlier design. The live code in `backend/app/crew/research_crew.py` bypasses them entirely.

---

### Step 1: Research

| Property | Value |
|----------|-------|
| **Role** | Research Strategist |
| **Prompt** | `RESEARCH_PROMPT` in `backend/app/crew/research_crew.py:11` |
| **Goal** | Analyze the topic and produce comprehensive research findings |
| **Output** | Raw research text (facts, stats, examples, trends) |

**Prompt includes:**
- Key facts and definitions
- Important statistics and data points
- Expert opinions and viewpoints
- Real-world examples and case studies
- Current trends and recent developments
- Challenges and limitations
- Future prospects

---

### Step 2: Writer

| Property | Value |
|----------|-------|
| **Role** | Technical Writer |
| **Prompt** | `WRITER_PROMPT` in `backend/app/crew/research_crew.py:26` |
| **Goal** | Transform research findings into a clear, engaging Markdown report |
| **Output** | Professional Markdown report (1500+ words) |

**Report structure:**
1. **Executive Summary** — Quick overview in plain English
2. **Introduction** — Context and why the topic matters
3. **Key Findings** — Detailed analysis with `###` subsections
4. **Analysis & Discussion** — Bigger picture and different perspectives
5. **Conclusion** — Main takeaways
6. **Recommendations** — Practical numbered suggestions

**Writing rules:**
- Simple, everyday language (no jargon)
- Short paragraphs and sentences
- Real-world analogies and relatable examples
- Blog-post style, not academic

---

### Pipeline Orchestration

| Property | Value |
|----------|-------|
| **File** | `backend/app/crew/research_crew.py` |
| **Entry Point** | `run_research_crew(topic)` |
| **LLM** | Google Gemini (`temperature: 0.7`) |
| **API** | Direct REST: `POST /v1beta/models/gemini-3.1-flash-lite:generateContent` |
| **Execution** | `asyncio.to_thread()` — non-blocking for FastAPI |
| **Retry** | 4 attempts with exponential backoff on HTTP 429 |

**Flow:**
```
User Topic
    │
    ▼
Gemini (Research prompt) ──→ Research Findings
    │
    ▼
Gemini (Writer prompt) ──→ Final Markdown Report
```

---

### Frontend Pipeline Visualization

Even though the backend runs 2 steps, the frontend (`frontend/src/pages/Research.jsx`) simulates a **3-step animated pipeline** for UX:

| Step | Label | Description |
|------|-------|-------------|
| 1 | Planning | "Planner Agent is analyzing your topic..." |
| 2 | Researching | "Research Agent is gathering information..." |
| 3 | Writing | "Writer Agent is composing the report..." |

Each step pulses for ~15 seconds before advancing, giving the user a sense of progress.

---

### Follow-Up Questions

After a report is generated, users can ask follow-up questions via `POST /api/research/followup`. The backend sends the original topic, full report, and the user's question to Gemini in a single prompt and returns the answer.

---

### PDF Analysis

Uploaded PDFs are processed by PyMuPDF (`fitz`) for text extraction, then the extracted text is passed through the same 2-step Gemini pipeline. Results are stored with `source_type: "pdf"` and the `original_filename`.

---

### LLM Configuration

| Setting | Value |
|---------|-------|
| **Provider** | Google Gemini |
| **Model** | `gemini-3.1-flash-lite` (configurable via `GEMINI_MODEL`) |
| **Temperature** | 0.7 |
| **API** | REST (`urllib`) |
| **Config File** | `backend/app/config.py` (env: `GEMINI_API_KEY`) |

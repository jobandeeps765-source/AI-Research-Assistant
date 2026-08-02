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
| **Role** | Research Assistant |
| **Prompt** | `RESEARCH_PROMPT` in `backend/app/crew/research_crew.py:12` |
| **Goal** | Gather detailed, factual notes about the topic |
| **Output** | Structured notes covering definition, facts, advantages, disadvantages, real-life uses and examples |

**Prompt includes:**
- Clear definition and background
- Key facts, figures, and statistics
- Advantages with explanations
- Disadvantages with explanations
- Real-life uses and 3-5 concrete examples
- Current trends and what might happen next

---

### Step 2: Writer

| Property | Value |
|----------|-------|
| **Role** | Professional Technical Writer |
| **Prompt** | `WRITER_PROMPT_PART1` / `WRITER_PROMPT_PART2` in `backend/app/crew/research_crew.py` |
| **Goal** | Turn notes into a full, detailed report |
| **Output** | Long Markdown report (2500+ words), written in two parts and merged |

**Report structure:**
1. **Introduction and Definition** (part 1)
2. **Advantages** (part 1)
3. **Disadvantages** (part 2)
4. **Real-Life Uses and Examples** (part 2)
5. **Conclusion** (part 2)

**Writing rules:**
- 2500+ words total (part 1 ~1200, part 2 ~1300)
- Full paragraphs with detailed explanations
- Accurate, factual, and specific
- Subheadings where useful
- No "Key points" or "Summary" section

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

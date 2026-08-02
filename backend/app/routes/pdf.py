from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File
import re
from app.database import get_database
from app.utils.dependencies import get_current_user
from bson import ObjectId
from datetime import datetime

router = APIRouter(prefix="/api/pdf", tags=["PDF Analysis"])

MAX_FILE_SIZE = 10 * 1024 * 1024
ALLOWED_TYPES = ["application/pdf"]


def extract_text_from_pdf(file_bytes: bytes) -> str:
    import fitz
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    text = ""
    for page in doc:
        text += page.get_text()
    doc.close()
    return text.strip()


def _looks_like_question_paper(text: str) -> bool:
    """Heuristically detect whether a PDF contains questions to be answered."""
    t = text.lower()
    markers = [
        "answer the following",
        "answer any",
        "answer all",
        "solve the following",
        "short answer",
        "long answer",
        "multiple choice",
        "fill in the blanks",
        "true or false",
        "section a",
        "section b",
        "question no",
        "max. marks",
        "marks:",
        "write short notes",
    ]
    score = 0
    if t.count("?") >= 3:
        score += 2
    for m in markers:
        if m in t:
            score += 1
    numbered = len(
        re.findall(r"(?:^|\n)\s*(?:Q\d+|Question\s*\d+|\d+[.)])\s+\S", text, re.IGNORECASE)
    )
    if numbered >= 3:
        score += 2
    return score >= 3


@router.post("/analyze")
async def analyze_pdf(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    """Upload a PDF and generate a research report (or answer its questions if it is a question paper)."""
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are allowed",
        )

    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size must be under 10MB",
        )

    pdf_text = extract_text_from_pdf(file_bytes)
    if len(pdf_text.strip()) < 50:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not extract enough text from the PDF. It may be image-based.",
        )

    truncated_text = pdf_text[:30000]

    db = get_database()

    if _looks_like_question_paper(truncated_text):
        from app.crew.research_crew import run_qa_crew

        try:
            report = await run_qa_crew(truncated_text)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"PDF Q&A analysis failed: {str(e)}",
            )

        doc = {
            "_id": str(ObjectId()),
            "user_id": current_user["_id"],
            "topic": f"PDF Q&A: {file.filename}",
            "report": report,
            "favorited": False,
            "source_type": "pdf",
            "original_filename": file.filename,
            "created_at": datetime.utcnow(),
        }

        await db.research_history.insert_one(doc)

        return {
            "id": doc["_id"],
            "user_id": doc["user_id"],
            "topic": doc["topic"],
            "report": doc["report"],
            "created_at": str(doc["created_at"]),
        }

    from app.crew.research_crew import run_research_crew

    research_prompt = (
        "Based on the following document content, create a comprehensive research report. "
        "The report should include:\n"
        "1. Executive Summary\n"
        "2. Introduction\n"
        "3. Key Findings\n"
        "4. Analysis & Discussion\n"
        "5. Conclusion\n"
        "6. Recommendations\n\n"
        f"DOCUMENT CONTENT:\n{truncated_text}"
    )

    try:
        report = await run_research_crew(research_prompt)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"PDF analysis failed: {str(e)}",
        )

    doc = {
        "_id": str(ObjectId()),
        "user_id": current_user["_id"],
        "topic": f"PDF Analysis: {file.filename}",
        "report": report,
        "favorited": False,
        "source_type": "pdf",
        "original_filename": file.filename,
        "created_at": datetime.utcnow(),
    }

    await db.research_history.insert_one(doc)

    return {
        "id": doc["_id"],
        "user_id": doc["user_id"],
        "topic": doc["topic"],
        "report": doc["report"],
        "created_at": str(doc["created_at"]),
    }

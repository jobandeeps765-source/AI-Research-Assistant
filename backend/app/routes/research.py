import asyncio
from fastapi import APIRouter, HTTPException, status, Depends, Query
from app.models.research import (
    ResearchRequest,
    ResearchResponse,
    ResearchHistoryResponse,
    FollowUpRequest,
    FollowUpResponse,
)
from app.database import get_database
from app.utils.dependencies import get_current_user
from bson import ObjectId
from datetime import datetime

router = APIRouter(prefix="/api/research", tags=["Research"])


@router.post("/create", response_model=ResearchResponse)
async def create_research(
    request: ResearchRequest,
    current_user: dict = Depends(get_current_user),
):
    """Create a new research report using the AI agent crew."""
    db = get_database()

    try:
        from app.crew.research_crew import run_research_crew
        report = await run_research_crew(request.topic)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Research generation failed: {str(e)}",
        )

    doc = {
        "_id": str(ObjectId()),
        "user_id": current_user["_id"],
        "topic": request.topic,
        "report": report,
        "favorited": False,
        "created_at": datetime.utcnow(),
    }

    await db.research_history.insert_one(doc)

    return ResearchResponse(
        id=doc["_id"],
        user_id=doc["user_id"],
        topic=doc["topic"],
        report=doc["report"],
        created_at=doc["created_at"],
    )


@router.get("/history", response_model=list[ResearchHistoryResponse])
async def get_history(
    search: str = Query(None, min_length=1, max_length=200),
    current_user: dict = Depends(get_current_user),
):
    """Return all past research reports for the current user, optionally filtered by search."""
    db = get_database()

    query = {"user_id": current_user["_id"]}
    if search:
        query["topic"] = {"$regex": search, "$options": "i"}

    cursor = db.research_history.find(query).sort("created_at", -1)

    results = []
    async for doc in cursor:
        results.append(
            ResearchHistoryResponse(
                id=doc["_id"],
                topic=doc["topic"],
                report=doc["report"],
                favorited=doc.get("favorited", False),
                created_at=doc["created_at"],
            )
        )

    return results


@router.post("/favorite/{research_id}")
async def toggle_favorite(
    research_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Toggle the favorite status of a research report."""
    db = get_database()

    doc = await db.research_history.find_one(
        {"_id": research_id, "user_id": current_user["_id"]}
    )
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Research not found",
        )

    new_status = not doc.get("favorited", False)
    await db.research_history.update_one(
        {"_id": research_id},
        {"$set": {"favorited": new_status}},
    )

    return {"favorited": new_status}


@router.post("/followup", response_model=FollowUpResponse)
async def follow_up(
    request: FollowUpRequest,
    current_user: dict = Depends(get_current_user),
):
    """Ask a follow-up question about an existing research report."""
    try:
        from app.crew.research_crew import call_gemini

        prompt = (
            f"You previously researched the topic: \"{request.topic}\"\n\n"
            f"Here is the research report:\n{request.report}\n\n"
            f"The user now asks this follow-up question: \"{request.question}\"\n\n"
            f"Provide a clear, detailed answer based on the report above."
        )

        answer = await asyncio.to_thread(call_gemini, prompt)
        return FollowUpResponse(answer=answer)

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Follow-up failed: {str(e)}",
        )


@router.delete("/{research_id}")
async def delete_research(
    research_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Delete a research report by ID."""
    db = get_database()

    result = await db.research_history.delete_one(
        {"_id": research_id, "user_id": current_user["_id"]}
    )

    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Research not found",
        )

    return {"message": "Research deleted successfully"}

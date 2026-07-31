from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ResearchRequest(BaseModel):
    topic: str = Field(..., min_length=5, max_length=500)


class ResearchResponse(BaseModel):
    id: str
    user_id: str
    topic: str
    report: str
    created_at: datetime


class ResearchHistoryResponse(BaseModel):
    id: str
    topic: str
    report: str
    favorited: bool = False
    created_at: datetime


class FollowUpRequest(BaseModel):
    topic: str
    report: str
    question: str = Field(..., min_length=5, max_length=500)


class FollowUpResponse(BaseModel):
    answer: str

"""Pydantic models for feedback and contact form submissions."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class FeedbackRequest(BaseModel):
    context: str  # e.g. "recommendation", "dining_plan", "comparison"
    reference_id: Optional[str] = None
    useful: bool
    anonymous_id: str


class FeedbackRecord(FeedbackRequest):
    id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ContactRequest(BaseModel):
    name: str
    email: EmailStr
    subject: str
    message: str


class ContactRecord(ContactRequest):
    id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

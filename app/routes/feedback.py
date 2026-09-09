"""Feedback and contact form submission routes."""
import uuid
from datetime import datetime

from fastapi import APIRouter

from app.models.feedback import ContactRequest, FeedbackRequest
from app.services.json_store import append_json

router = APIRouter(prefix="/api")


@router.post("/feedback")
async def submit_feedback(payload: FeedbackRequest):
    record = payload.model_dump()
    record["id"] = uuid.uuid4().hex
    record["created_at"] = datetime.utcnow().isoformat()
    append_json("feedback.json", record)
    return {"status": "ok"}


@router.post("/contact")
async def submit_contact(payload: ContactRequest):
    record = payload.model_dump()
    record["id"] = uuid.uuid4().hex
    record["created_at"] = datetime.utcnow().isoformat()
    append_json("contacts.json", record)
    return {"status": "ok"}

"""
routes/helpers.py
─────────────────────────────────────────────────────────────────────────────
Shared utility functions used across all route modules.

Having these in one place means any route file can `from .helpers import ...`
and we avoid repeating the same logic everywhere.
"""

from bson import ObjectId
from fastapi import HTTPException


def fix_id(doc: dict) -> dict:
    """
    MongoDB stores document IDs as BSON ObjectId objects.
    JSON can't serialize those, so we convert _id → id (string).
    We also delete the original _id key to keep the response clean.
    """
    if doc and "_id" in doc:
        doc["id"] = str(doc["_id"])
        del doc["_id"]
    return doc


def object_id_or_404(id: str) -> ObjectId:
    """
    Safely parse a string into a MongoDB ObjectId.
    If the string is not a valid 24-char hex ObjectId, return a clean 400 error
    instead of letting Mongo crash with a confusing BSON exception.
    """
    try:
        return ObjectId(id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ID format — must be a 24-character hex string")

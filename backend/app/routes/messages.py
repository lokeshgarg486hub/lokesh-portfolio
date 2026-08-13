"""
routes/messages.py
─────────────────────────────────────────────────────────────────────────────
Endpoints for the contact form inbox.

Public:
  POST /api/messages          — visitor submits contact form

Admin (JWT required):
  GET    /api/messages         — read all received messages
  POST   /api/messages/:id/reply — send email reply via Resend
  DELETE /api/messages/:id     — delete a message
"""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException

from .. import models, auth, database, config
from .helpers import fix_id, object_id_or_404

router = APIRouter()


# ── PUBLIC ────────────────────────────────────────────────────────────────────

@router.post("/messages")
async def create_message(message: models.MessageCreate):
    """
    Receives a visitor's contact form submission.
    Timestamps and replied=False are set server-side (never trust the client).
    """
    payload = message.dict()
    payload["date_sent"] = datetime.now(timezone.utc)
    payload["replied"]   = False
    result = await database.messages_col.insert_one(payload)
    doc    = await database.messages_col.find_one({"_id": result.inserted_id})
    return fix_id(doc)


# ── PROTECTED (JWT Required) ───────────────────────────────────────────────────

@router.get("/messages")
async def get_messages(_: dict = Depends(auth.get_current_user)):
    """Return all contact form messages, sorted newest first."""
    docs = await database.messages_col.find({}).sort("date_sent", -1).to_list(200)
    return [fix_id(d) for d in docs]


@router.post("/messages/{id}/reply")
async def reply_to_message(id: str, payload: models.ReplyPayload, _: dict = Depends(auth.get_current_user)):
    """
    Send an email reply to the visitor who submitted a contact form message.

    Uses Resend (https://resend.com) to send the email.
    Requires RESEND_API_KEY and FROM_EMAIL to be set in backend/.env.

    After sending, marks the message as replied=True in the database
    so admin can track which messages have been handled.
    """
    if not config.settings.RESEND_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="RESEND_API_KEY is not configured. Add it to backend/.env to enable email replies."
        )

    oid = object_id_or_404(id)
    msg_doc = await database.messages_col.find_one({"_id": oid})
    if not msg_doc:
        raise HTTPException(status_code=404, detail="Message not found")

    # Lazy-import Resend so missing the package doesn't break app startup
    try:
        import resend
        resend.api_key = config.settings.RESEND_API_KEY
        params = {
            "from":    config.settings.FROM_EMAIL,
            "to":      [msg_doc["email"]],
            "subject": payload.subject,
            "html":    payload.body.replace("\n", "<br>"),
        }
        response = resend.Emails.send(params)
    except ImportError:
        raise HTTPException(status_code=500, detail="resend package not installed — run: pip install resend")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Resend API error: {str(e)}")

    # Mark as replied so the admin inbox badge updates
    await database.messages_col.update_one({"_id": oid}, {"$set": {"replied": True}})
    return {"status": "sent", "resend_id": str(response)}


@router.delete("/messages/{id}")
async def delete_message(id: str, _: dict = Depends(auth.get_current_user)):
    """Delete a message by ID. Useful for clearing spam."""
    result = await database.messages_col.delete_one({"_id": object_id_or_404(id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Message not found")
    return {"status": "deleted"}

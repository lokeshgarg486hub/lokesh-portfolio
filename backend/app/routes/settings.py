"""
routes/settings.py
─────────────────────────────────────────────────────────────────────────────
Endpoints for:
  - Site settings & custom domain configuration
  - Analytics event tracking and summary
  - Testimonials CRUD

Public:
  GET  /api/site-settings          — returns title, domain, SEO description
  POST /api/analytics/track        — fire-and-forget event tracking (no PII)
  GET  /api/testimonials           — visitor-facing testimonials list

Admin (JWT required):
  PUT  /api/site-settings          — update domain config, SEO, title
  GET  /api/analytics/summary      — chart data for admin dashboard
  POST/PUT/DELETE /api/testimonials — manage testimonials
"""

from datetime import datetime, timezone, timedelta
from typing import List

from fastapi import APIRouter, Depends, HTTPException

from .. import models, auth, database
from .helpers import fix_id, object_id_or_404

router = APIRouter()


# ── SITE SETTINGS ─────────────────────────────────────────────────────────────

@router.get("/site-settings", response_model=models.SiteSettings)
async def get_site_settings():
    """
    Return global site settings. Used by the frontend to render the correct
    canonical URL, SEO meta tags, and custom domain information.
    """
    doc = await database.site_settings_col.find_one({})
    return fix_id(doc) if doc else models.SiteSettings()


@router.put("/site-settings", response_model=models.SiteSettings)
async def update_site_settings(settings_data: models.SiteSettingsBase, _: dict = Depends(auth.get_current_user)):
    """
    Upsert site settings. There is always exactly one settings document.
    This controls the custom domain, SEO description, canonical URL etc.
    """
    existing = await database.site_settings_col.find_one({})
    if existing:
        await database.site_settings_col.update_one({"_id": existing["_id"]}, {"$set": settings_data.dict()})
    else:
        await database.site_settings_col.insert_one(settings_data.dict())
    doc = await database.site_settings_col.find_one({})
    return fix_id(doc)


# ── ANALYTICS ─────────────────────────────────────────────────────────────────

@router.post("/analytics/track", status_code=204)
async def track_event(event: models.AnalyticsEvent):
    """
    Record a page view or other trackable event.

    This endpoint is fire-and-forget — the frontend calls it and doesn't
    wait for a response. It stores minimal data (event type + page name),
    NO IP addresses or user identifiers — privacy first.
    """
    await database.analytics_col.insert_one({
        "event_type": event.event_type,
        "page":       event.page,
        "timestamp":  datetime.now(timezone.utc)
    })


@router.get("/analytics/summary")
async def get_analytics_summary(days: int = 30, _: dict = Depends(auth.get_current_user)):
    """
    Return day-wise aggregated event counts for the last N days.

    Output format:
      [{"date": "2026-08-01", "page_view": 12, "cv_download": 1}, ...]

    Used to render the line chart on the admin dashboard.
    """
    since    = datetime.now(timezone.utc) - timedelta(days=days)
    pipeline = [
        # Only process events within the time range
        {"$match": {"timestamp": {"$gte": since}}},
        {
            "$group": {
                "_id": {
                    "date":       {"$dateToString": {"format": "%Y-%m-%d", "date": "$timestamp"}},
                    "event_type": "$event_type"
                },
                "count": {"$sum": 1}
            }
        },
        {"$sort": {"_id.date": 1}}
    ]

    results  = await database.analytics_col.aggregate(pipeline).to_list(1000)

    # Pivot rows into {date, page_view, cv_download} column format for charting
    date_map = {}
    for r in results:
        date  = r["_id"]["date"]
        event = r["_id"]["event_type"]
        if date not in date_map:
            date_map[date] = {"date": date, "page_view": 0, "cv_download": 0}
        if event in date_map[date]:
            date_map[date][event] = r["count"]

    return sorted(date_map.values(), key=lambda x: x["date"])


# ── TESTIMONIALS ──────────────────────────────────────────────────────────────

@router.get("/testimonials", response_model=List[models.Testimonial])
async def get_testimonials():
    """Return all testimonials displayed on the homepage."""
    docs = await database.testimonials_col.find({}).to_list(100)
    return [fix_id(d) for d in docs]


@router.post("/testimonials", response_model=models.Testimonial)
async def create_testimonial(t: models.TestimonialBase, _: dict = Depends(auth.get_current_user)):
    """Add a new testimonial from a client or collaborator."""
    result = await database.testimonials_col.insert_one(t.dict())
    doc    = await database.testimonials_col.find_one({"_id": result.inserted_id})
    return fix_id(doc)


@router.put("/testimonials/{id}", response_model=models.Testimonial)
async def update_testimonial(id: str, t: models.TestimonialBase, _: dict = Depends(auth.get_current_user)):
    """Edit a testimonial by ID."""
    oid = object_id_or_404(id)
    await database.testimonials_col.update_one({"_id": oid}, {"$set": t.dict()})
    doc = await database.testimonials_col.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Testimonial not found")
    return fix_id(doc)


@router.delete("/testimonials/{id}")
async def delete_testimonial(id: str, _: dict = Depends(auth.get_current_user)):
    """Remove a testimonial by ID."""
    result = await database.testimonials_col.delete_one({"_id": object_id_or_404(id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Testimonial not found")
    return {"status": "deleted"}

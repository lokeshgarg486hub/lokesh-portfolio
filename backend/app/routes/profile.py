"""
routes/profile.py
─────────────────────────────────────────────────────────────────────────────
Endpoints for admin profile, social links, and specialty domains.

Public GET endpoints are open to visitors (no auth).
PUT/POST/DELETE endpoints require a valid JWT from the admin login.
"""

from fastapi import APIRouter, Depends, HTTPException
from typing import List

from .. import models, auth, database
from .helpers import fix_id, object_id_or_404

# All routes in this file will be prefixed with /api automatically
# when included in main.py (see include_router call there)
router = APIRouter()


# ── PUBLIC ────────────────────────────────────────────────────────────────────

@router.get("/profile", response_model=models.Profile)
async def get_profile():
    """Return the admin's public profile bio, photo, tagline etc."""
    doc = await database.profile_col.find_one({})
    return fix_id(doc) if doc else models.Profile()


@router.get("/social-links", response_model=List[models.SocialLink])
async def get_social_links():
    """Return all social media links displayed in the footer and hero."""
    docs = await database.social_links_col.find({}).to_list(100)
    return [fix_id(d) for d in docs]


@router.get("/domains", response_model=List[models.Domain])
async def get_domains():
    """Return specialty domain cards used on Skills and Works pages."""
    docs = await database.domains_col.find({}).to_list(100)
    return [fix_id(d) for d in docs]


# ── PROTECTED (JWT Required) ───────────────────────────────────────────────────

@router.put("/profile", response_model=models.Profile)
async def update_profile(profile: models.ProfileBase, _: dict = Depends(auth.get_current_user)):
    """
    Upsert the admin profile document.
    We do upsert (update-or-insert) because there's only ever one profile document.
    """
    existing = await database.profile_col.find_one({})
    if existing:
        await database.profile_col.update_one({"_id": existing["_id"]}, {"$set": profile.dict()})
    else:
        await database.profile_col.insert_one(profile.dict())
    doc = await database.profile_col.find_one({})
    return fix_id(doc)


@router.post("/social-links", response_model=models.SocialLink)
async def create_social_link(link: models.SocialLinkBase, _: dict = Depends(auth.get_current_user)):
    """Add a new social media link."""
    result = await database.social_links_col.insert_one(link.dict())
    doc = await database.social_links_col.find_one({"_id": result.inserted_id})
    return fix_id(doc)


@router.put("/social-links/{id}", response_model=models.SocialLink)
async def update_social_link(id: str, link: models.SocialLinkBase, _: dict = Depends(auth.get_current_user)):
    """Update an existing social link by its ID."""
    oid = object_id_or_404(id)
    await database.social_links_col.update_one({"_id": oid}, {"$set": link.dict()})
    doc = await database.social_links_col.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Social link not found")
    return fix_id(doc)


@router.delete("/social-links/{id}")
async def delete_social_link(id: str, _: dict = Depends(auth.get_current_user)):
    """Remove a social link by ID."""
    result = await database.social_links_col.delete_one({"_id": object_id_or_404(id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Social link not found")
    return {"status": "deleted"}


@router.post("/domains", response_model=models.Domain)
async def create_domain(domain: models.DomainBase, _: dict = Depends(auth.get_current_user)):
    """Add a new specialty domain / focus area."""
    result = await database.domains_col.insert_one(domain.dict())
    doc = await database.domains_col.find_one({"_id": result.inserted_id})
    return fix_id(doc)


@router.put("/domains/{id}", response_model=models.Domain)
async def update_domain(id: str, domain: models.DomainBase, _: dict = Depends(auth.get_current_user)):
    """Update a domain by ID."""
    oid = object_id_or_404(id)
    await database.domains_col.update_one({"_id": oid}, {"$set": domain.dict()})
    doc = await database.domains_col.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Domain not found")
    return fix_id(doc)


@router.delete("/domains/{id}")
async def delete_domain(id: str, _: dict = Depends(auth.get_current_user)):
    """Delete a domain by ID."""
    result = await database.domains_col.delete_one({"_id": object_id_or_404(id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Domain not found")
    return {"status": "deleted"}

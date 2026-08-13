"""
routes/projects.py
─────────────────────────────────────────────────────────────────────────────
Endpoints for the Works / Projects section.

Public GET endpoints are open to all visitors.
Write endpoints require JWT auth (admin only).
"""

from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional

from .. import models, auth, database
from .helpers import fix_id, object_id_or_404

router = APIRouter()


# ── PUBLIC ────────────────────────────────────────────────────────────────────

@router.get("/projects", response_model=List[models.Project])
async def get_projects(domain: Optional[str] = None, featured: Optional[bool] = None):
    """
    Return all projects. Supports optional query params:
    - domain: filter by domain/category (e.g. "AI & ML")
    - featured: if true, returns only homepage-pinned projects
    """
    query = {}
    if domain:
        query["domain"] = domain
    if featured is not None:
        query["featured"] = featured
    docs = await database.projects_col.find(query).to_list(100)
    return [fix_id(d) for d in docs]


@router.get("/projects/{id}", response_model=models.Project)
async def get_project(id: str):
    """Return a single project by its ID."""
    oid = object_id_or_404(id)
    doc = await database.projects_col.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Project not found")
    return fix_id(doc)


# ── PROTECTED (JWT Required) ───────────────────────────────────────────────────

@router.post("/projects", response_model=models.Project)
async def create_project(project: models.ProjectBase, _: dict = Depends(auth.get_current_user)):
    """Create a new project card."""
    result = await database.projects_col.insert_one(project.dict())
    doc = await database.projects_col.find_one({"_id": result.inserted_id})
    return fix_id(doc)


@router.put("/projects/{id}", response_model=models.Project)
async def update_project(id: str, project: models.ProjectBase, _: dict = Depends(auth.get_current_user)):
    """Update project details by ID."""
    oid = object_id_or_404(id)
    await database.projects_col.update_one({"_id": oid}, {"$set": project.dict()})
    doc = await database.projects_col.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Project not found")
    return fix_id(doc)


@router.delete("/projects/{id}")
async def delete_project(id: str, _: dict = Depends(auth.get_current_user)):
    """Delete a project by ID."""
    result = await database.projects_col.delete_one({"_id": object_id_or_404(id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"status": "deleted"}

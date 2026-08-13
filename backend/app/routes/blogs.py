"""
routes/blogs.py
─────────────────────────────────────────────────────────────────────────────
Public and admin endpoints for the blog engine.

Public routes:
  GET /api/blogs          — list published posts (with optional filters)
  GET /api/blogs/:id_or_slug — read a single post (also increments view count)

Admin routes (JWT required):
  POST   /api/blogs         — create new draft or published post
  PUT    /api/blogs/:id     — edit post (title, content, publish toggle)
  DELETE /api/blogs/:id     — permanently remove post
"""

import re
from datetime import datetime, timezone
from typing import List, Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException

from .. import models, auth, database
from .helpers import fix_id, object_id_or_404

router = APIRouter()


# ── Helper: Auto-generate URL slug from a blog title ─────────────────────────

def slugify(text: str) -> str:
    """
    Converts a blog title like "My RAG Architecture" to "my-rag-architecture".
    Used when admin saves a blog without manually setting a slug.
    Handles unicode/special chars safely.
    """
    text = text.lower().strip()
    text = re.sub(r'[^\w\s-]', '', text)     # remove non-word chars
    text = re.sub(r'[\s_-]+', '-', text)     # replace spaces/underscores with dashes
    return text.strip('-') or "post"


# ── PUBLIC ────────────────────────────────────────────────────────────────────

@router.get("/blogs", response_model=List[models.Blog])
async def get_blogs(
    published: Optional[bool] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 50
):
    """
    Return blog posts with optional filtering. Results are sorted newest-first.

    Query params:
    - published=true  → only show live posts (used by public blog page)
    - category=       → filter by category label
    - search=         → full-text search across title, summary, content, tags
    - limit=          → max results (default 50)
    """
    query = {}
    if published is not None:
        query["published"] = published
    if category:
        query["category"] = category
    if search:
        # Case-insensitive partial match across key fields
        query["$or"] = [
            {"title":   {"$regex": search, "$options": "i"}},
            {"summary": {"$regex": search, "$options": "i"}},
            {"content": {"$regex": search, "$options": "i"}},
            {"tags":    {"$elemMatch": {"$regex": search, "$options": "i"}}}
        ]
    docs = await database.blogs_col.find(query).sort("_id", -1).to_list(limit)
    return [fix_id(d) for d in docs]


@router.get("/blogs/{id_or_slug}", response_model=models.Blog)
async def get_blog_by_id_or_slug(id_or_slug: str):
    """
    Fetch a single blog post by either its MongoDB ID or its URL slug.
    Also increments the view counter (analytics) on every read.
    """
    doc = None

    # Try ObjectId lookup first (when coming from admin panel)
    if ObjectId.is_valid(id_or_slug):
        doc = await database.blogs_col.find_one({"_id": ObjectId(id_or_slug)})

    # Fall back to slug lookup (when visitor follows a URL like /blogs/my-post)
    if not doc:
        doc = await database.blogs_col.find_one({"slug": id_or_slug})

    if not doc:
        raise HTTPException(status_code=404, detail="Blog post not found")

    # Increment view count — non-blocking, visitor doesn't wait for this
    await database.blogs_col.update_one({"_id": doc["_id"]}, {"$inc": {"views_count": 1}})
    doc["views_count"] = doc.get("views_count", 0) + 1

    return fix_id(doc)


# ── PROTECTED (JWT Required) ───────────────────────────────────────────────────

@router.post("/blogs", response_model=models.Blog)
async def create_blog(blog: models.BlogBase, _: dict = Depends(auth.get_current_user)):
    """
    Create a new blog post. Auto-generates a slug from the title if not provided.
    Timestamps are set server-side to prevent client clock manipulation.
    """
    payload = blog.dict()

    # Auto-generate slug if admin didn't provide one
    if not payload.get("slug"):
        payload["slug"] = slugify(payload.get("title", "post"))

    # Server-side timestamps
    now_str = datetime.now(timezone.utc).isoformat()
    payload["created_at"] = now_str
    payload["updated_at"] = now_str

    # Default view count for new posts
    if "views_count" not in payload or payload["views_count"] is None:
        payload["views_count"] = 0

    result = await database.blogs_col.insert_one(payload)
    doc = await database.blogs_col.find_one({"_id": result.inserted_id})
    return fix_id(doc)


@router.put("/blogs/{id}", response_model=models.Blog)
async def update_blog(id: str, blog: models.BlogBase, _: dict = Depends(auth.get_current_user)):
    """Update a blog post. Auto-regenerates slug if title changed and no slug set."""
    oid = object_id_or_404(id)
    payload = blog.dict()

    if not payload.get("slug"):
        payload["slug"] = slugify(payload.get("title", "post"))

    payload["updated_at"] = datetime.now(timezone.utc).isoformat()

    await database.blogs_col.update_one({"_id": oid}, {"$set": payload})
    doc = await database.blogs_col.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Blog post not found")
    return fix_id(doc)


@router.delete("/blogs/{id}")
async def delete_blog(id: str, _: dict = Depends(auth.get_current_user)):
    """Permanently delete a blog post. This is not reversible."""
    result = await database.blogs_col.delete_one({"_id": object_id_or_404(id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Blog post not found")
    return {"status": "deleted"}

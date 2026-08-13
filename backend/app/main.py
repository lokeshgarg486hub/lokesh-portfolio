"""
backend/app/main.py
─────────────────────────────────────────────────────────────────────────────
Application entry point for the Lokesh Kumar Garg Portfolio API.

This file is intentionally kept short. Its only job is to:
  1. Create the FastAPI app instance
  2. Configure CORS
  3. Set up Cloudinary (used for image uploads)
  4. Create MongoDB indexes on startup
  5. Register the route modules (auth, profile, projects, skills, blogs, etc.)

All actual endpoint logic lives in the routes/ package — one file per domain.
That makes the codebase easier to read, test, and extend.
"""

from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta
from typing import List

# Internal modules
from . import models, auth, database, config

# Route modules — each handles one feature domain
from .routes import profile, projects, skills, blogs, messages, settings as site_settings

app = FastAPI(
    title="Lokesh Portfolio API",
    description="Backend API for lokesh-portfolio.vercel.app — Agentic AI, RAG, and Full-Stack Projects",
    version="2.0.0"
)


# ─────────────────────────────────────────────────────────────────────────────
# CORS
# Before deploying, add your Vercel/custom domain to ALLOWED_ORIGINS in .env
# Multiple origins are comma-separated: http://localhost:3000,https://yourdomain.com
# ─────────────────────────────────────────────────────────────────────────────
origins = [o.strip() for o in config.settings.ALLOWED_ORIGINS.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─────────────────────────────────────────────────────────────────────────────
# CLOUDINARY
# All uploads go to Cloudinary instead of local disk.
# This keeps the backend stateless — required for Vercel/serverless deploys.
# ─────────────────────────────────────────────────────────────────────────────
import cloudinary
import cloudinary.uploader

cloudinary.config(
    cloud_name = config.settings.CLOUDINARY_CLOUD_NAME,
    api_key    = config.settings.CLOUDINARY_API_KEY,
    api_secret = config.settings.CLOUDINARY_API_SECRET,
    secure     = True
)


# ─────────────────────────────────────────────────────────────────────────────
# STARTUP HOOK — create MongoDB indexes
# create_index() is idempotent — safe to call on every restart.
# ─────────────────────────────────────────────────────────────────────────────
@app.on_event("startup")
async def create_indexes():
    """
    Create MongoDB indexes once on server startup.
    These speed up the most common query patterns (domain filters, slug lookups).
    """
    await database.projects_col.create_index("domain")
    await database.projects_col.create_index("featured")
    await database.certificates_col.create_index("domain")
    await database.internships_col.create_index("domain")
    await database.skills_col.create_index("domain")
    await database.admin_user_col.create_index("username", unique=True)
    await database.blogs_col.create_index("slug")
    await database.blogs_col.create_index("published")


# ─────────────────────────────────────────────────────────────────────────────
# AUTH — Login endpoint
# Returns a JWT token valid for JWT_EXPIRE_MINUTES (set in .env).
# All admin write operations require this token in the Authorization header.
# ─────────────────────────────────────────────────────────────────────────────
@app.post("/api/auth/login", response_model=models.Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    Authenticates admin credentials and returns a Bearer token.
    Uses bcrypt hashing — plaintext passwords are never stored.
    """
    user = await database.admin_user_col.find_one({"username": form_data.username})
    if not user or not auth.verify_password(form_data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Incorrect username or password")

    expires = timedelta(minutes=config.settings.JWT_EXPIRE_MINUTES)
    token   = auth.create_access_token(data={"sub": user["username"]}, expires_delta=expires)
    return {"access_token": token, "token_type": "bearer"}


# ─────────────────────────────────────────────────────────────────────────────
# FILE UPLOAD — Cloudinary
# Used by the admin panel to upload profile photos, project thumbnails, etc.
# ─────────────────────────────────────────────────────────────────────────────
@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...), _: dict = Depends(auth.get_current_user)):
    """
    Uploads a file to Cloudinary and returns the secure CDN URL.
    No files are stored on the server — this keeps the backend stateless.

    Requires Cloudinary credentials in backend/.env.
    """
    if not config.settings.CLOUDINARY_CLOUD_NAME:
        raise HTTPException(
            status_code=500,
            detail="Cloudinary not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in .env"
        )

    contents = await file.read()
    result   = cloudinary.uploader.upload(
        contents,
        folder        = "lokesh_portfolio",
        resource_type = "auto"     # handles images, PDFs, etc.
    )
    return {"url": result["secure_url"]}


# ─────────────────────────────────────────────────────────────────────────────
# ROUTE REGISTRATION
# Each route module is registered with the /api prefix here.
# See routes/ for the actual endpoint implementations.
# ─────────────────────────────────────────────────────────────────────────────
app.include_router(profile.router,       prefix="/api", tags=["Profile"])
app.include_router(projects.router,      prefix="/api", tags=["Projects"])
app.include_router(skills.router,        prefix="/api", tags=["Skills & Edu"])
app.include_router(blogs.router,         prefix="/api", tags=["Blogs"])
app.include_router(messages.router,      prefix="/api", tags=["Messages"])
app.include_router(site_settings.router, prefix="/api", tags=["Settings & Analytics"])

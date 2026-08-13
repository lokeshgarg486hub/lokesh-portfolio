"""
routes/skills.py
─────────────────────────────────────────────────────────────────────────────
Endpoints for Skills, Certificates, Internships, and Education.

All GET endpoints are public. Write operations need JWT auth.
"""

from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional

from .. import models, auth, database
from .helpers import fix_id, object_id_or_404

router = APIRouter()


# ── SKILLS ────────────────────────────────────────────────────────────────────

@router.get("/skills", response_model=List[models.Skill])
async def get_skills(domain: Optional[str] = None):
    """Return all skills, optionally filtered by domain category."""
    query = {"domain": domain} if domain else {}
    docs = await database.skills_col.find(query).to_list(200)
    return [fix_id(d) for d in docs]


@router.post("/skills", response_model=models.Skill)
async def create_skill(skill: models.SkillBase, _: dict = Depends(auth.get_current_user)):
    """Add a new skill to the matrix."""
    result = await database.skills_col.insert_one(skill.dict())
    doc = await database.skills_col.find_one({"_id": result.inserted_id})
    return fix_id(doc)


@router.put("/skills/{id}", response_model=models.Skill)
async def update_skill(id: str, skill: models.SkillBase, _: dict = Depends(auth.get_current_user)):
    """Update a skill by ID."""
    oid = object_id_or_404(id)
    await database.skills_col.update_one({"_id": oid}, {"$set": skill.dict()})
    doc = await database.skills_col.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Skill not found")
    return fix_id(doc)


@router.delete("/skills/{id}")
async def delete_skill(id: str, _: dict = Depends(auth.get_current_user)):
    """Delete a skill by ID."""
    result = await database.skills_col.delete_one({"_id": object_id_or_404(id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Skill not found")
    return {"status": "deleted"}


# ── CERTIFICATES ──────────────────────────────────────────────────────────────

@router.get("/certificates", response_model=List[models.Certificate])
async def get_certificates(domain: Optional[str] = None):
    """Return all certificates, optionally filtered by domain."""
    query = {"domain": domain} if domain else {}
    docs = await database.certificates_col.find(query).to_list(100)
    return [fix_id(d) for d in docs]


@router.post("/certificates", response_model=models.Certificate)
async def create_certificate(cert: models.CertificateBase, _: dict = Depends(auth.get_current_user)):
    """Add a new certificate."""
    result = await database.certificates_col.insert_one(cert.dict())
    doc = await database.certificates_col.find_one({"_id": result.inserted_id})
    return fix_id(doc)


@router.put("/certificates/{id}", response_model=models.Certificate)
async def update_certificate(id: str, cert: models.CertificateBase, _: dict = Depends(auth.get_current_user)):
    """Update a certificate by ID."""
    oid = object_id_or_404(id)
    await database.certificates_col.update_one({"_id": oid}, {"$set": cert.dict()})
    doc = await database.certificates_col.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Certificate not found")
    return fix_id(doc)


@router.delete("/certificates/{id}")
async def delete_certificate(id: str, _: dict = Depends(auth.get_current_user)):
    """Delete a certificate by ID."""
    result = await database.certificates_col.delete_one({"_id": object_id_or_404(id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Certificate not found")
    return {"status": "deleted"}


# ── INTERNSHIPS ───────────────────────────────────────────────────────────────

@router.get("/internships", response_model=List[models.Internship])
async def get_internships(domain: Optional[str] = None):
    """Return all internship experiences."""
    query = {"domain": domain} if domain else {}
    docs = await database.internships_col.find(query).to_list(100)
    return [fix_id(d) for d in docs]


@router.post("/internships", response_model=models.Internship)
async def create_internship(item: models.InternshipBase, _: dict = Depends(auth.get_current_user)):
    """Add a new internship entry."""
    result = await database.internships_col.insert_one(item.dict())
    doc = await database.internships_col.find_one({"_id": result.inserted_id})
    return fix_id(doc)


@router.put("/internships/{id}", response_model=models.Internship)
async def update_internship(id: str, item: models.InternshipBase, _: dict = Depends(auth.get_current_user)):
    """Update an internship by ID."""
    oid = object_id_or_404(id)
    await database.internships_col.update_one({"_id": oid}, {"$set": item.dict()})
    doc = await database.internships_col.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Internship not found")
    return fix_id(doc)


@router.delete("/internships/{id}")
async def delete_internship(id: str, _: dict = Depends(auth.get_current_user)):
    """Delete an internship by ID."""
    result = await database.internships_col.delete_one({"_id": object_id_or_404(id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Internship not found")
    return {"status": "deleted"}


# ── EDUCATION ─────────────────────────────────────────────────────────────────

@router.get("/education", response_model=List[models.Education])
async def get_education():
    """Return all education history entries."""
    docs = await database.education_col.find({}).to_list(50)
    return [fix_id(d) for d in docs]


@router.post("/education", response_model=models.Education)
async def create_education(edu: models.EducationBase, _: dict = Depends(auth.get_current_user)):
    """Add a new education entry."""
    result = await database.education_col.insert_one(edu.dict())
    doc = await database.education_col.find_one({"_id": result.inserted_id})
    return fix_id(doc)


@router.put("/education/{id}", response_model=models.Education)
async def update_education(id: str, edu: models.EducationBase, _: dict = Depends(auth.get_current_user)):
    """Update an education entry by ID."""
    oid = object_id_or_404(id)
    await database.education_col.update_one({"_id": oid}, {"$set": edu.dict()})
    doc = await database.education_col.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Education record not found")
    return fix_id(doc)


@router.delete("/education/{id}")
async def delete_education(id: str, _: dict = Depends(auth.get_current_user)):
    """Delete an education entry by ID."""
    result = await database.education_col.delete_one({"_id": object_id_or_404(id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Education record not found")
    return {"status": "deleted"}

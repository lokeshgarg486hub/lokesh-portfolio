from pydantic import BaseModel

from typing import Optional, List
from datetime import datetime

# -------------------------------------------------------
# AUTH
# -------------------------------------------------------
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class AdminUser(BaseModel):
    username: str
    password_hash: str

# -------------------------------------------------------
# PROFILE
# -------------------------------------------------------
class ProfileBase(BaseModel):
    """
    Base profile structure. We default strings to empty so partial updates 
    or incomplete database records don't crash the validation engine.
    available_for_freelance defaults True so existing DB records (which lack
    this field) still show the badge without a migration step.
    """
    name: str = ""
    tagline: str = ""
    bio: str = ""
    location: str = ""
    profile_photo_url: str = ""
    resume_url: str = ""
    available_for_freelance: bool = True

class Profile(ProfileBase):
    pass

# -------------------------------------------------------
# SOCIAL LINKS
# -------------------------------------------------------
class SocialLinkBase(BaseModel):
    platform_name: str
    url: str
    icon_class: str

class SocialLink(SocialLinkBase):
    id: str

# -------------------------------------------------------
# DOMAINS
# -------------------------------------------------------
class DomainBase(BaseModel):
    title: str
    description: str
    icon_class: str
    color: str = "#eb5d3a"     # accent hex used on skills/works pages
    order: int = 0             # display sort order

class Domain(DomainBase):
    id: str

# -------------------------------------------------------
# CERTIFICATES
# -------------------------------------------------------
class CertificateBase(BaseModel):
    title: str
    issuer: str
    date: str
    domain: str
    image_url: str

class Certificate(CertificateBase):
    id: str

# -------------------------------------------------------
# INTERNSHIPS
# -------------------------------------------------------
class InternshipBase(BaseModel):
    company: str
    role: str
    duration: str
    description: str
    domain: str
    certificate_url: str = ""

class Internship(InternshipBase):
    id: str

# -------------------------------------------------------
# PROJECTS
# -------------------------------------------------------
class ProjectBase(BaseModel):
    title: str
    domain: str
    description: str
    thumbnail_url: str = ""
    details: str = ""
    github_link: str = ""
    demo_link: str = ""
    tech_stack: List[str] = []
    featured: bool = False  # pinned False (Python bool) — was incorrectly `false` (JS literal)

class Project(ProjectBase):
    id: str

# -------------------------------------------------------
# MESSAGES
# -------------------------------------------------------
class MessageCreate(BaseModel):
    """
    Payload received from the public contact form. 
    date_sent is omitted here because we trust the server's clock to stamp it, 
    not the client's payload.
    """
    name: str
    email: str
    subject: str = "Portfolio Contact"
    message: str

class Message(MessageCreate):
    id: str
    date_sent: datetime
    replied: bool = False  # tracks whether admin has sent a reply via the /reply endpoint

class ReplyPayload(BaseModel):
    """Payload for POST /api/messages/{id}/reply"""
    subject: str
    body: str

# -------------------------------------------------------
# TESTIMONIALS
# -------------------------------------------------------
class TestimonialBase(BaseModel):
    author_name: str
    author_role: str = ""
    quote: str
    author_photo_url: str = ""

class Testimonial(TestimonialBase):
    id: str

# -------------------------------------------------------
# SKILLS
# -------------------------------------------------------
class SkillBase(BaseModel):
    name: str
    domain: str = ""          # links to a Domain title (optional)
    proficiency: str = "Intermediate"  # Beginner / Intermediate / Advanced / Expert
    icon_class: str = ""

class Skill(SkillBase):
    id: str

# -------------------------------------------------------
# EDUCATION
# -------------------------------------------------------
class EducationBase(BaseModel):
    institution: str
    degree: str
    field_of_study: str = ""
    start_date: str = ""
    end_date: str = ""
    gpa: Optional[str] = None     # optional — not all institutions use GPA
    description: Optional[str] = None
    highlights: List[str] = []

class Education(EducationBase):
    id: str

# -------------------------------------------------------
# BLOGS
# -------------------------------------------------------
class BlogBase(BaseModel):
    title: str
    slug: str = ""             # URL-friendly identifier, auto-generated if blank
    category: str = "AI & ML"  # Domain / category name
    summary: str = ""          # Short excerpt shown on cards (≤ 200 chars)
    content: str = ""          # Full markdown / HTML body
    cover_image_url: str = ""
    read_time: str = "5 min read"
    views_count: int = 0
    tags: List[str] = []
    published: bool = True     # draft vs live
    created_at: str = ""       # ISO string, set server-side on create
    updated_at: str = ""       # ISO string, set server-side on update

class Blog(BlogBase):
    id: str

# -------------------------------------------------------
# SITE & CUSTOM DOMAIN SETTINGS
# -------------------------------------------------------
class SiteSettingsBase(BaseModel):
    custom_domain: str = ""    # e.g. "lokesh-garg.dev"
    site_title: str = "Lokesh Kumar Garg — AI Engineer & Data Scientist"
    canonical_url: str = "https://lokesh-portfolio.vercel.app"
    cname_target: str = "cname.vercel-dns.com"
    seo_description: str = "Portfolio of Lokesh Kumar Garg — AI Engineer & Data Scientist building Agentic AI, RAG Pipelines, and scalable ML systems."
    contact_email: str = "lokeshgarg486@gmail.com"
    ssl_status: str = "Active"

class SiteSettings(SiteSettingsBase):
    pass

# -------------------------------------------------------
# ANALYTICS
# -------------------------------------------------------
class AnalyticsEvent(BaseModel):
    event_type: str   # e.g. "page_view", "cv_download"
    page: str = ""    # e.g. "index.html"
    # timestamp is stamped server-side — never trust the client's clock
    # No IP addresses or other PII are stored here


import sys
from motor.motor_asyncio import AsyncIOMotorClient
from .config import settings

# --- Pre-flight Check: Ensure the Mongo URI is actually set ---
# We don't want the app to start silently if it can't connect to the database.
if not settings.MONGO_URI or settings.MONGO_URI.strip() == "":
    print("CRITICAL ERROR: MONGO_URI is missing from environment variables (.env).")
    print("Please set MONGO_URI before starting the server.")
    sys.exit(1)

# Initialize the async Motor client. 
# We use AsyncIOMotorClient so the FastAPI event loop isn't blocked by database calls.
try:
    client = AsyncIOMotorClient(settings.MONGO_URI)
    db = client[settings.DB_NAME]
except Exception as e:
    print(f"CRITICAL ERROR: Failed to parse MONGO_URI or connect. Error: {e}")
    sys.exit(1)

# Expose collections for the rest of the app to use
admin_user_col    = db["admin_user"]
profile_col       = db["profile"]
social_links_col  = db["social_links"]
certificates_col  = db["certificates"]
domains_col       = db["domains"]
internships_col   = db["internships"]
projects_col      = db["projects"]
messages_col      = db["messages"]
testimonials_col  = db["testimonials"]
skills_col        = db["skills"]
education_col     = db["education"]
analytics_col     = db["analytics_events"]
blogs_col         = db["blogs"]
site_settings_col = db["site_settings"]


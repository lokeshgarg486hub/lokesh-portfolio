from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    """
    Centralized configuration. 
    Pydantic automatically reads from the environment variables (or .env file) 
    and falls back to these default values if keys are missing.
    """
    MONGO_URI: str = "mongodb://localhost:27017"
    DB_NAME: str = "portfolio_db"
    JWT_SECRET: str = "super_secret_key_change_me_in_production"
    JWT_EXPIRE_MINUTES: int = 1440
    ADMIN_BOOTSTRAP_USERNAME: str = "admin"
    ADMIN_BOOTSTRAP_PASSWORD: str = "secret"
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_SIZE_MB: int = 5
    # REMINDER: Add your real deployed frontend URL here before going live.
    # e.g. "https://yourname.vercel.app,http://localhost:5500"
    ALLOWED_ORIGINS: str = "http://localhost:5500,http://127.0.0.1:5500"

    # Cloudinary — image hosting (free tier, no credit card required).
    # Set these in your .env file or Vercel dashboard environment variables.
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""

    # Resend — transactional email for the admin reply feature.
    # Sign up at https://resend.com (free: 3,000 emails/month).
    # Set RESEND_API_KEY in your .env file or Vercel dashboard.
    RESEND_API_KEY: str = ""
    FROM_EMAIL: str = "onboarding@resend.dev"  # Change to your verified sender once set up

    class Config:
        env_file = ".env"

settings = Settings()

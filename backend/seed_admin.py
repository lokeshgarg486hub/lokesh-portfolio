import asyncio
from app.config import settings
from app.database import admin_user_col
from app.auth import get_password_hash

async def seed_admin():
    """
    Creates the initial admin user so the site owner can log into the dashboard for the first time.
    Safe to run multiple times — if the admin already exists, it simply does nothing.
    """
    username = settings.ADMIN_BOOTSTRAP_USERNAME
    password = settings.ADMIN_BOOTSTRAP_PASSWORD
    
    existing = await admin_user_col.find_one({"username": username})
    if existing:
        print(f"Admin user '{username}' already exists.")
        return
        
    hashed_password = get_password_hash(password)
    await admin_user_col.insert_one({
        "username": username,
        "password_hash": hashed_password
    })
    print(f"Successfully created bootstrap admin user '{username}'.")

if __name__ == "__main__":
    asyncio.run(seed_admin())

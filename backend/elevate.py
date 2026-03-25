import asyncio
import sys
import argparse
from sqlalchemy import select, update
from database import SessionLocal
from models import User

async def elevate_user(email: str, role: str):
    async with SessionLocal() as db:
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        
        if not user:
            print(f"User with email '{email}' not found.")
            return

        user.role = role
        await db.commit()
        print(f"Successfully elevated user '{email}' to role '{role}'.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Elevate a user's role manually.")
    parser.add_argument("email", help="The email of the user to elevate")
    parser.add_argument("--role", default="admin", help="The role to assign (default: admin)")
    
    args = parser.parse_args()
    asyncio.run(elevate_user(args.email, args.role))

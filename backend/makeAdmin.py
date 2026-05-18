# Run from backend/ with venv activated: python makeAdmin.py
import asyncio
from app.database import init_db
from app.models.user import User

EMAIL = "lshrivas2019@gmail.com"   # ← change to your registered email

async def main():
    await init_db()

    # List ALL users first so you can see what's in the DB
    print("📋 All users in the database:")
    all_users = await User.find().to_list()
    if not all_users:
        print("  ⚠️  No users found at all!")
        print("  → Make sure you have registered on the frontend first.")
        print("  → Check that your .env MONGODB_URI is correct.")
        return

    for u in all_users:
        print(f"  {'✅' if u.email == EMAIL else '  '} {u.email}  (role={u.role}, name={u.name})")

    print()
    user = next((u for u in all_users if u.email == EMAIL), None)
    if user:
        user.role = "super_admin"
        await user.save()
        print(f"✅ Success! {user.name} ({user.email}) is now super_admin")
        print("   Log out and log back in on the frontend to see the Admin dashboard.")
    else:
        print(f"❌ No user with email '{EMAIL}' found.")
        print(f"   👆 Copy one of the emails above and update line 6 of this script.")

asyncio.run(main())

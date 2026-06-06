import asyncio
from pymongo import MongoClient

async def migrate():
    print("Starting role migration...")
    client = MongoClient("mongodb://localhost:27017/")
    db = client.stray_rescue
    
    # 1 = Admin, 2 = User, 3 = NGO
    
    res1 = db.users.update_many({"role": "super_admin"}, {"$set": {"role": 1}})
    print(f"Updated super_admin to 1: {res1.modified_count} users")
    
    res2 = db.users.update_many({"role": "citizen"}, {"$set": {"role": 2}})
    print(f"Updated citizen to 2: {res2.modified_count} users")
    
    res3 = db.users.update_many({"role": "ngo_admin"}, {"$set": {"role": 3}})
    print(f"Updated ngo_admin to 3: {res3.modified_count} users")

    print("Migration complete.")

if __name__ == "__main__":
    asyncio.run(migrate())

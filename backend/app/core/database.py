from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

client: AsyncIOMotorClient = None
db = None


async def connect_to_database():
    global client, db
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.DATABASE_NAME]

    # Create indexes for performance
    await db.users.create_index("email", unique=True)
    await db.bins.create_index("bin_id", unique=True)
    await db.bins.create_index("zone_id")
    await db.bins.create_index([("location", "2dsphere")])
    await db.vehicles.create_index("vehicle_id", unique=True)
    await db.collections.create_index("timestamp")
    await db.alerts.create_index([("status", 1), ("priority", -1)])
    await db.zones.create_index("zone_id", unique=True)
    await db.rewards.create_index("user_id")

    print(f"✅ Connected to MongoDB: {settings.DATABASE_NAME}")
    return db


async def close_database_connection():
    global client
    if client:
        client.close()
        print("🔌 MongoDB connection closed")


def get_database():
    return db

"""
Database Seeder for SmartWaste Pro
Populates MongoDB with realistic demo data for testing & demos.
Run: python seed.py
"""
import asyncio
import random
from datetime import datetime, timedelta, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "swm_db")

# City: New Delhi / Mumbai coordinates for realistic Indian city demo
ZONES = [
    {"zone_id": "ZN-NORTH", "name": "North District", "city": "New Delhi",
     "center": [77.2090, 28.6839], "collection_frequency": "daily"},
    {"zone_id": "ZN-SOUTH", "name": "South District", "city": "New Delhi",
     "center": [77.2295, 28.5355], "collection_frequency": "daily"},
    {"zone_id": "ZN-EAST", "name": "East District", "city": "New Delhi",
     "center": [77.3080, 28.6289], "collection_frequency": "twice_daily"},
    {"zone_id": "ZN-WEST", "name": "West District", "city": "New Delhi",
     "center": [77.0688, 28.6517], "collection_frequency": "daily"},
    {"zone_id": "ZN-CENTRAL", "name": "Central District", "city": "New Delhi",
     "center": [77.2295, 28.6353], "collection_frequency": "twice_daily"},
]

BIN_LOCATIONS = [
    "Main Market", "Bus Station", "City Park", "Hospital Entrance", "School Gate",
    "Metro Station", "Shopping Mall", "Residential Block A", "Residential Block B", "Highway Rest Area",
    "Community Center", "Temple Road", "Market Square", "Office Complex", "University Campus",
    "Railway Station", "Sports Stadium", "Museum Road", "Lake Garden", "Tech Park",
]

VEHICLES = [
    {"vehicle_id": "VH-001", "name": "EcoTruck Alpha", "vehicle_type": "compactor_truck", "capacity_kg": 8000},
    {"vehicle_id": "VH-002", "name": "GreenHauler Beta", "vehicle_type": "compactor_truck", "capacity_kg": 8000},
    {"vehicle_id": "VH-003", "name": "SwiftCollect Gamma", "vehicle_type": "mini_truck", "capacity_kg": 3000},
    {"vehicle_id": "VH-004", "name": "CleanFleet Delta", "vehicle_type": "compactor_truck", "capacity_kg": 10000},
    {"vehicle_id": "VH-005", "name": "EcoVan Epsilon", "vehicle_type": "van", "capacity_kg": 2000},
    {"vehicle_id": "VH-006", "name": "PowerHaul Zeta", "vehicle_type": "compactor_truck", "capacity_kg": 12000},
    {"vehicle_id": "VH-007", "name": "MicroCollect Eta", "vehicle_type": "mini_truck", "capacity_kg": 2500},
    {"vehicle_id": "VH-008", "name": "BioCleaner Theta", "vehicle_type": "specialized", "capacity_kg": 5000},
]

DRIVERS = [
    ("Rajesh Kumar", "+91-98765-43210"),
    ("Amit Sharma", "+91-98765-43211"),
    ("Suresh Patel", "+91-98765-43212"),
    ("Vikram Singh", "+91-98765-43213"),
    ("Deepak Verma", "+91-98765-43214"),
    ("Rahul Gupta", "+91-98765-43215"),
    ("Manoj Tiwari", "+91-98765-43216"),
    ("Sanjay Joshi", "+91-98765-43217"),
]


async def seed():
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]

    # Clear existing data
    for collection in ["users", "bins", "vehicles", "zones", "routes", "collections", "alerts", "citizen_reports", "pickups"]:
        await db[collection].drop()
    print("🗑️  Cleared existing data")

    # ── Seed Users ──
    import bcrypt

    def hash_pwd(password: str) -> str:
        return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    users = [
        {"name": "Admin User", "email": "admin@smartwaste.pro", "password": hash_pwd("admin123"),
         "role": "admin", "phone": "+91-99999-00001", "zone_id": None, "reward_points": 0,
         "is_active": True, "created_at": datetime.now(timezone.utc)},
        {"name": "Operator Singh", "email": "operator@smartwaste.pro", "password": hash_pwd("operator123"),
         "role": "operator", "phone": "+91-99999-00002", "zone_id": "ZN-NORTH", "reward_points": 0,
         "is_active": True, "created_at": datetime.now(timezone.utc)},
        {"name": "Priya Citizen", "email": "citizen@smartwaste.pro", "password": hash_pwd("citizen123"),
         "role": "citizen", "phone": "+91-99999-00003", "zone_id": "ZN-SOUTH", "reward_points": 245,
         "is_active": True, "created_at": datetime.now(timezone.utc)},
    ]
    # Add more citizens for leaderboard
    citizen_names = ["Arjun M.", "Nisha K.", "Rohan D.", "Sneha P.", "Karan J.", "Meera S.", "Akash R.", "Divya T."]
    for i, name in enumerate(citizen_names):
        users.append({
            "name": name, "email": f"citizen{i+2}@smartwaste.pro", "password": hash_pwd("citizen123"),
            "role": "citizen", "phone": f"+91-98800-{10000+i}", "zone_id": random.choice([z["zone_id"] for z in ZONES]),
            "reward_points": random.randint(10, 800), "is_active": True,
            "created_at": datetime.now(timezone.utc) - timedelta(days=random.randint(1, 90)),
        })
    await db.users.insert_many(users)
    print(f"👤 Seeded {len(users)} users")

    # ── Seed Zones ──
    zone_docs = []
    for z in ZONES:
        zone_docs.append({
            **z,
            "description": f"Waste management zone covering {z['name']} area",
            "boundary": None,
            "assigned_vehicles": [],
            "created_at": datetime.now(timezone.utc),
        })
    await db.zones.insert_many(zone_docs)
    print(f"🗺️  Seeded {len(zone_docs)} zones")

    # ── Seed Bins ──
    bin_types = ["general", "recyclable", "organic", "hazardous", "e-waste"]
    type_weights = [0.35, 0.30, 0.20, 0.05, 0.10]
    bin_docs = []
    bin_counter = 1

    for zone in ZONES:
        num_bins = random.randint(8, 14)
        for i in range(num_bins):
            lat_offset = random.uniform(-0.02, 0.02)
            lon_offset = random.uniform(-0.02, 0.02)

            fill = random.uniform(5, 95)
            status = "active"
            if fill >= 90:
                status = random.choice(["active", "full"])
            if random.random() < 0.05:
                status = "maintenance"
            if random.random() < 0.03:
                status = "offline"

            bin_type = random.choices(bin_types, weights=type_weights, k=1)[0]
            location_name = random.choice(BIN_LOCATIONS)

            bin_docs.append({
                "bin_id": f"BIN-{bin_counter:04d}",
                "name": f"{location_name} - {bin_type.title()} Bin",
                "bin_type": bin_type,
                "capacity_liters": random.choice([120, 240, 360, 660, 1100]),
                "location": {
                    "type": "Point",
                    "coordinates": [
                        round(zone["center"][0] + lon_offset, 6),
                        round(zone["center"][1] + lat_offset, 6)
                    ]
                },
                "address": f"{location_name}, {zone['name']}, New Delhi",
                "zone_id": zone["zone_id"],
                "status": status,
                "sensor_data": {
                    "fill_level": round(fill, 1),
                    "temperature": round(random.uniform(20, 45), 1),
                    "humidity": round(random.uniform(30, 80), 1),
                    "methane_level": round(random.uniform(0, fill * 0.5), 2),
                    "battery_level": round(random.uniform(15, 100), 1),
                    "last_reading": datetime.now(timezone.utc) - timedelta(minutes=random.randint(1, 120)),
                },
                "last_collected": datetime.now(timezone.utc) - timedelta(hours=random.randint(2, 72)),
                "collection_count": random.randint(10, 500),
                "description": f"Smart {bin_type} waste bin at {location_name}",
                "created_at": datetime.now(timezone.utc) - timedelta(days=random.randint(30, 365)),
            })
            bin_counter += 1

    await db.bins.insert_many(bin_docs)
    print(f"🗑️  Seeded {len(bin_docs)} smart bins")

    # ── Seed Vehicles ──
    vehicle_docs = []
    statuses = ["available", "on_route", "available", "available", "maintenance", "available", "on_route", "available"]
    for i, v in enumerate(VEHICLES):
        driver = DRIVERS[i]
        zone = ZONES[i % len(ZONES)]
        vehicle_docs.append({
            **v,
            "status": statuses[i],
            "current_location": {
                "type": "Point",
                "coordinates": [
                    round(zone["center"][0] + random.uniform(-0.01, 0.01), 6),
                    round(zone["center"][1] + random.uniform(-0.01, 0.01), 6)
                ]
            },
            "driver_name": driver[0],
            "driver_phone": driver[1],
            "fuel_level": round(random.uniform(30, 100), 1),
            "total_collections": random.randint(50, 2000),
            "total_distance_km": round(random.uniform(500, 15000), 1),
            "current_route_id": None,
            "created_at": datetime.now(timezone.utc) - timedelta(days=random.randint(30, 365)),
        })
    await db.vehicles.insert_many(vehicle_docs)
    print(f"🚛 Seeded {len(vehicle_docs)} vehicles")

    # ── Seed Collection History ──
    collection_docs = []
    for day_offset in range(60):
        date = datetime.now(timezone.utc) - timedelta(days=day_offset)
        num_collections = random.randint(15, 40)
        for _ in range(num_collections):
            b = random.choice(bin_docs)
            v = random.choice(vehicle_docs)
            fill_before = round(random.uniform(50, 100), 1)
            collection_docs.append({
                "bin_id": b["bin_id"],
                "vehicle_id": v["vehicle_id"],
                "route_id": None,
                "zone_id": b["zone_id"],
                "weight_kg": round(random.uniform(5, 150), 1),
                "fill_level_before": fill_before,
                "fill_level_after": round(random.uniform(0, 10), 1),
                "collected_by": v.get("driver_name"),
                "timestamp": date.replace(
                    hour=random.randint(5, 18),
                    minute=random.randint(0, 59)
                ),
                "notes": None,
            })
    await db.collections.insert_many(collection_docs)
    print(f"📦 Seeded {len(collection_docs)} collection records")

    # ── Seed Alerts ──
    alert_types = [
        ("overflow", "critical", "Bin Overflow Detected", "Bin {} has exceeded 95% capacity and requires immediate collection."),
        ("battery_low", "medium", "Low Battery Warning", "Bin {} sensor battery is below 20%. Schedule maintenance."),
        ("maintenance", "high", "Maintenance Required", "Bin {} is reporting sensor anomalies. Physical inspection recommended."),
        ("temperature", "high", "High Temperature Alert", "Bin {} temperature exceeds safe threshold. Possible fire hazard."),
        ("methane", "critical", "Methane Level Critical", "Bin {} methane levels are dangerously high. Immediate attention required."),
        ("offline", "medium", "Sensor Offline", "Bin {} sensor has been offline for 24+ hours."),
        ("collection_missed", "high", "Missed Collection", "Scheduled collection for Zone {} was not completed."),
    ]

    alert_docs = []
    for i in range(25):
        atype = random.choice(alert_types)
        b = random.choice(bin_docs)
        import uuid
        status = random.choice(["active", "active", "active", "acknowledged", "resolved"])
        alert_docs.append({
            "alert_id": f"ALT-{uuid.uuid4().hex[:8].upper()}",
            "alert_type": atype[0],
            "priority": atype[1],
            "status": status,
            "title": atype[2],
            "message": atype[3].format(b["bin_id"]),
            "bin_id": b["bin_id"],
            "zone_id": b["zone_id"],
            "vehicle_id": None,
            "acknowledged_by": "Operator Singh" if status in ["acknowledged", "resolved"] else None,
            "resolved_by": "Operator Singh" if status == "resolved" else None,
            "created_at": datetime.now(timezone.utc) - timedelta(hours=random.randint(1, 168)),
            "updated_at": datetime.now(timezone.utc) - timedelta(hours=random.randint(0, 48)) if status != "active" else None,
        })
    await db.alerts.insert_many(alert_docs)
    print(f"🚨 Seeded {len(alert_docs)} alerts")

    # ── Create Indexes ──
    await db.users.create_index("email", unique=True)
    await db.bins.create_index("bin_id", unique=True)
    await db.bins.create_index("zone_id")
    await db.vehicles.create_index("vehicle_id", unique=True)
    await db.collections.create_index("timestamp")
    await db.alerts.create_index([("status", 1), ("priority", -1)])
    await db.zones.create_index("zone_id", unique=True)
    print("📇 Created indexes")

    print("\n✅ Database seeded successfully!")
    print("\n📧 Demo Accounts:")
    print("   Admin:    admin@smartwaste.pro / admin123")
    print("   Operator: operator@smartwaste.pro / operator123")
    print("   Citizen:  citizen@smartwaste.pro / citizen123")

    client.close()


if __name__ == "__main__":
    asyncio.run(seed())

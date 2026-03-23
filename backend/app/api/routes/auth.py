from fastapi import APIRouter, HTTPException, status
from datetime import datetime, timezone
from bson import ObjectId
from app.core.database import get_database
from app.core.security import get_password_hash, verify_password, create_access_token
from app.models.user import UserCreate, UserLogin, UserResponse, TokenResponse, UserUpdate

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate):
    db = get_database()
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_doc = {
        "name": user_data.name,
        "email": user_data.email,
        "password": get_password_hash(user_data.password),
        "role": user_data.role.value,
        "phone": user_data.phone,
        "zone_id": user_data.zone_id,
        "reward_points": 0,
        "is_active": True,
        "created_at": datetime.now(timezone.utc),
    }
    result = await db.users.insert_one(user_doc)
    user_doc["id"] = str(result.inserted_id)

    token = create_access_token({"sub": str(result.inserted_id), "role": user_doc["role"]})
    return TokenResponse(
        access_token=token,
        user=UserResponse(**user_doc)
    )


@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    db = get_database()
    user = await db.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    user["id"] = str(user["_id"])
    token = create_access_token({"sub": user["id"], "role": user["role"]})
    return TokenResponse(
        access_token=token,
        user=UserResponse(**user)
    )


@router.get("/me", response_model=UserResponse)
async def get_profile(user=None):
    from fastapi import Depends
    from app.api.deps import get_current_user
    pass


# Override with proper dependency
from fastapi import Depends
from app.api.deps import get_current_user


@router.get("/profile", response_model=UserResponse)
async def get_my_profile(user=Depends(get_current_user)):
    return UserResponse(**user)


@router.put("/profile", response_model=UserResponse)
async def update_profile(update_data: UserUpdate, user=Depends(get_current_user)):
    db = get_database()
    update_fields = {k: v for k, v in update_data.model_dump().items() if v is not None}
    if update_fields:
        await db.users.update_one({"_id": ObjectId(user["id"])}, {"$set": update_fields})
        user.update(update_fields)
    return UserResponse(**user)


@router.get("/users", response_model=list[UserResponse])
async def list_users(role: str = None, admin=Depends(get_current_user)):
    db = get_database()
    query = {}
    if role:
        query["role"] = role
    cursor = db.users.find(query).sort("created_at", -1).limit(100)
    users = []
    async for u in cursor:
        u["id"] = str(u["_id"])
        users.append(UserResponse(**u))
    return users

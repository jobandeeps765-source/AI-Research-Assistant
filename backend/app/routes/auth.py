from fastapi import APIRouter, HTTPException, status, Depends
from app.models.user import UserCreate, UserLogin, TokenResponse, UserResponse
from app.database import get_database
from app.utils.auth import hash_password, verify_password, create_access_token
from app.utils.dependencies import get_current_user
from bson import ObjectId
from datetime import datetime

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse)
async def register(user: UserCreate):
    """Register a new user and return a JWT token."""
    db = get_database()

    existing = await db.users.find_one({"email": user.email})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    user_doc = {
        "_id": str(ObjectId()),
        "name": user.name,
        "email": user.email,
        "password": hash_password(user.password),
        "created_at": datetime.utcnow(),
    }

    await db.users.insert_one(user_doc)

    token = create_access_token(user_doc["_id"])
    user_response = UserResponse(
        id=user_doc["_id"],
        name=user_doc["name"],
        email=user_doc["email"],
        created_at=user_doc["created_at"],
    )

    return TokenResponse(access_token=token, user=user_response)


@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    """Authenticate a user and return a JWT token."""
    db = get_database()

    user = await db.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    token = create_access_token(user["_id"])
    user_response = UserResponse(
        id=user["_id"],
        name=user["name"],
        email=user["email"],
        created_at=user["created_at"],
    )

    return TokenResponse(access_token=token, user=user_response)


@router.get("/profile", response_model=UserResponse)
async def get_profile(current_user: dict = Depends(get_current_user)):
    """Return the current user's profile."""
    return UserResponse(
        id=current_user["_id"],
        name=current_user["name"],
        email=current_user["email"],
        created_at=current_user["created_at"],
    )

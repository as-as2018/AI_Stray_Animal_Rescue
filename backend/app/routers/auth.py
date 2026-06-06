from fastapi import APIRouter, HTTPException, status
from app.schemas.schemas import RegisterRequest, LoginRequest, TokenResponse, UserResponse
from app.models.user import User, UserRole
from app.core.auth import hash_password, verify_password, create_access_token, get_current_user
from fastapi import Depends

router = APIRouter(prefix="/api/v1/auth", tags=["Auth"])


from app.models.ngo import NGO

@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(data: RegisterRequest):
    existing = await User.find_one(User.email == data.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    assigned_role = UserRole.ngo if data.is_ngo else UserRole.user
    
    user = User(
        name=data.name,
        email=data.email,
        phone=data.phone,
        password_hash=hash_password(data.password),
        role=assigned_role,
    )
    await user.insert()
    
    if data.is_ngo:
        ngo_stub = NGO(
            name=f"{data.name} NGO",
            city="Pending",
            contact_email=data.email,
            contact_phone=data.phone,
            is_active=False
        )
        await ngo_stub.insert()

    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(access_token=token, user_id=str(user.id), name=user.name, role=user.role)


@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest):
    user = await User.find_one(User.email == data.email)
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(access_token=token, user_id=str(user.id), name=user.name, role=user.role)


@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=str(current_user.id),
        name=current_user.name,
        email=current_user.email,
        phone=current_user.phone,
        role=current_user.role,
        reports_submitted=current_user.reports_submitted,
        created_at=current_user.created_at,
    )


from app.schemas.schemas import UserUpdateRequest, ChangePasswordRequest

@router.patch("/password")
async def change_password(data: ChangePasswordRequest, current_user: User = Depends(get_current_user)):
    if not verify_password(data.current_password, current_user.password_hash):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Incorrect current password")
    
    hashed_new = hash_password(data.new_password)
    await current_user.set({User.password_hash: hashed_new})
    return {"status": "success", "message": "Password updated successfully"}

@router.patch("/me", response_model=UserResponse)
async def update_me(data: UserUpdateRequest, current_user: User = Depends(get_current_user)):
    update_data = {}
    if data.name is not None:
        update_data["name"] = data.name
    if data.phone is not None:
        update_data["phone"] = data.phone
        
    if update_data:
        await current_user.set(update_data)
        
    return UserResponse(
        id=str(current_user.id),
        name=current_user.name,
        email=current_user.email,
        phone=current_user.phone,
        role=current_user.role,
        reports_submitted=current_user.reports_submitted,
        created_at=current_user.created_at,
    )

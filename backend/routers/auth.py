from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import OfficialRecord, UserProfile
from schemas import (
    UserSignup, UserLogin, UserUpdate,
    TokenResponse, OfficialRecordResponse, UserDashboardResponse
)
from security import hash_password, verify_password, create_access_token
from dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


# ============================================================
# GET /auth/verify/{register_number} — Auto-fill workflow
# ============================================================

@router.get("/verify/{register_number}", response_model=OfficialRecordResponse)
def verify_register_number(register_number: str, db: Session = Depends(get_db)):
    """
    Lookup a register number in the Official Master Registry.
    Returns university, college, department info for auto-fill.
    """
    record = db.query(OfficialRecord).filter(
        OfficialRecord.register_number == register_number
    ).first()

    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Register number not found in official records"
        )

    return record


# ============================================================
# POST /auth/register — Signup
# ============================================================

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register_user(data: UserSignup, db: Session = Depends(get_db)):
    """
    Register a new user.
    1. Verify register_number exists in OfficialRecord
    2. Check if user already registered
    3. Hash password, create UserProfile
    4. Return JWT token
    """
    # Step 1: Verify against Official DB
    official = db.query(OfficialRecord).filter(
        OfficialRecord.register_number == data.register_number
    ).first()

    if not official:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Register number not found in official records. Cannot register."
        )

    # Step 2: Check if already registered
    existing = db.query(UserProfile).filter(
        UserProfile.register_number == data.register_number
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account already exists for this register number."
        )

    # Step 3: Check username uniqueness
    username_exists = db.query(UserProfile).filter(
        UserProfile.username == data.username
    ).first()

    if username_exists:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This username is already taken."
        )

    # Step 4: Create user
    new_user = UserProfile(
        register_number=data.register_number,
        username=data.username,
        hashed_password=hash_password(data.password),
        personal_mail_id=data.personal_mail_id,
        phone_number=data.phone_number,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Step 5: Generate JWT
    token = create_access_token(data={"sub": new_user.register_number})

    return {
        "token": token,
        "user": {
            "studentId": new_user.register_number,
            "username": new_user.username,
            "fullName": official.full_name,
            "university": official.university,
            "college": official.college,
            "department": official.department,
            "personalMailId": new_user.personal_mail_id,
            "phoneNumber": new_user.phone_number,
            "profilePictureUrl": new_user.profile_picture_url,
            "usernameChangeCount": new_user.username_change_count,
        }
    }


# ============================================================
# POST /auth/login — Login
# ============================================================

@router.post("/login", response_model=TokenResponse)
def login_user(data: UserLogin, db: Session = Depends(get_db)):
    """
    Authenticate user with register number (studentId) and password.
    Returns JWT token + user data (joined from both tables).
    """
    # Find user
    user = db.query(UserProfile).filter(
        UserProfile.register_number == data.studentId
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid register number or password"
        )

    # Verify password
    if not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid register number or password"
        )

    # Get official data for the joined response
    official = db.query(OfficialRecord).filter(
        OfficialRecord.register_number == user.register_number
    ).first()

    # Generate JWT
    token = create_access_token(data={"sub": user.register_number})

    return {
        "token": token,
        "user": {
            "studentId": user.register_number,
            "username": user.username,
            "fullName": official.full_name if official else "",
            "university": official.university if official else "",
            "college": official.college if official else "",
            "department": official.department if official else "",
            "personalMailId": user.personal_mail_id,
            "phoneNumber": user.phone_number,
            "profilePictureUrl": user.profile_picture_url,
            "usernameChangeCount": user.username_change_count,
            "createdAt": str(user.created_at) if user.created_at else None,
        }
    }


# ============================================================
# GET /auth/profile — Get current user dashboard (JOIN)
# ============================================================

@router.get("/profile")
def get_profile(current_user: UserProfile = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Returns the combined dashboard data by JOINing OfficialRecord + UserProfile.
    """
    official = db.query(OfficialRecord).filter(
        OfficialRecord.register_number == current_user.register_number
    ).first()

    return {
        "studentId": current_user.register_number,
        "username": current_user.username,
        "fullName": official.full_name if official else "",
        "university": official.university if official else "",
        "college": official.college if official else "",
        "department": official.department if official else "",
        "officialEmail": official.official_email if official else "",
        "personalMailId": current_user.personal_mail_id,
        "phoneNumber": current_user.phone_number,
        "profilePictureUrl": current_user.profile_picture_url,
        "usernameChangeCount": current_user.username_change_count,
        "createdAt": str(current_user.created_at) if current_user.created_at else None,
    }


# ============================================================
# PUT /auth/profile — Update user profile
# ============================================================

@router.put("/profile")
def update_profile(
    data: UserUpdate,
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update editable fields in UserProfile.
    If username is changed, increment username_change_count.
    """
    if data.username and data.username != current_user.username:
        # Check uniqueness
        username_exists = db.query(UserProfile).filter(
            UserProfile.username == data.username,
            UserProfile.register_number != current_user.register_number
        ).first()

        if username_exists:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This username is already taken."
            )

        current_user.username = data.username
        current_user.username_change_count += 1

    if data.personal_mail_id is not None:
        current_user.personal_mail_id = data.personal_mail_id

    if data.phone_number is not None:
        current_user.phone_number = data.phone_number

    if data.profile_picture_url is not None:
        current_user.profile_picture_url = data.profile_picture_url

    db.commit()
    db.refresh(current_user)

    return {
        "studentId": current_user.register_number,
        "username": current_user.username,
        "personalMailId": current_user.personal_mail_id,
        "phoneNumber": current_user.phone_number,
        "profilePictureUrl": current_user.profile_picture_url,
        "usernameChangeCount": current_user.username_change_count,
    }

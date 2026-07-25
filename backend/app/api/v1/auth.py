from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from jose import jwt, JWTError

from app.core.config import settings
from app.core.security import (
    create_access_token, 
    create_refresh_token, 
    get_password_hash, 
    verify_password
)
from app.api.deps import get_db
from app.models import User, Role, Student
from app.schemas import UserCreate, UserResponse, Token

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    """Register a new user to CampusOS AI."""
    # Check if user already exists
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The user with this email already exists in the system",
        )
    # Get or create Student role
    role = db.query(Role).filter(Role.name == "Student").first()
    if not role:
        role = Role(name="Student", description="Default Student Role")
        db.add(role)
        db.commit()
        db.refresh(role)
        
    hashed_password = get_password_hash(user_in.password)
    new_user = User(
        email=user_in.email,
        hashed_password=hashed_password,
        full_name=user_in.full_name,
        is_active=True
    )
    new_user.roles.append(role)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Create Student Profile
    student_profile = Student(
        user_id=new_user.id,
        roll_number=f"STU{new_user.id:05d}",
        cgpa=0.0,
        current_semester=1
    )
    db.add(student_profile)
    db.commit()
    db.refresh(new_user)
    
    return new_user


@router.post("/login", response_model=Token)
def login(db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()):
    """Authenticate a user and return tokens."""
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user",
        )
    return {
        "access_token": create_access_token(subject=user.email),
        "refresh_token": create_refresh_token(subject=user.email),
        "token_type": "bearer",
    }


@router.post("/refresh", response_model=Token)
def refresh_token(refresh_token: str, db: Session = Depends(get_db)):
    """Refresh access token using a valid refresh token."""
    try:
        payload = jwt.decode(
            refresh_token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
        )
        if not payload.get("refresh"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="Invalid refresh token"
            )
        subject = payload.get("sub")
        if subject is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, 
                detail="Could not validate credentials"
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Could not validate credentials"
        )
        
    user = db.query(User).filter(User.email == subject).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="User not found or inactive"
        )
        
    return {
        "access_token": create_access_token(subject=user.email),
        "refresh_token": create_refresh_token(subject=user.email),
        "token_type": "bearer",
    }


@router.post("/forgot-password")
def forgot_password(email: str):
    """Send reset password link/OTP to user email."""
    # Placeholder for SMTP / SendGrid logic
    return {"message": f"Password reset email sent to {email}"}


@router.post("/verify-otp")
def verify_otp(email: str, otp: str):
    """Verify OTP sent to user email/phone."""
    # Placeholder for Redis-based OTP matching
    return {"message": "OTP verified successfully"}


@router.post("/google")
def google_login(token: str):
    """Sign-in / sign-up with Google OAuth."""
    return {"access_token": "google_mock_access_token", "token_type": "bearer"}


@router.post("/microsoft")
def microsoft_login(token: str):
    """Sign-in / sign-up with Microsoft OAuth."""
    return {"access_token": "microsoft_mock_access_token", "token_type": "bearer"}


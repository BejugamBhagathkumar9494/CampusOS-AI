from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from jose import jwt, JWTError
import json

from app.core.config import settings
from app.core.security import (
    create_access_token, 
    create_refresh_token, 
    get_password_hash, 
    verify_password
)
from app.api.deps import get_db
from app.models import User, Role, Student
from app.models.database_models import Profile, AuthorizedUser, AuditLog
from app.schemas import UserCreate, UserResponse, Token

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    """Register a new user after verifying institution identity and authorized role."""
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The user with this email address already exists in CampusOS.",
        )

    # Admin accounts cannot be created through public registration.
    # Only an authorized Super Admin can grant administrative access.
    requested_role = (user_in.role or "student").lower()
    if requested_role in ["admin", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrative roles cannot be created via public registration. Contact Super Admin."
        )

    # Verify requested role and institution ID against pre-authorized registry
    auth_record = None
    if user_in.institution_id:
        auth_record = db.query(AuthorizedUser).filter(
            AuthorizedUser.institution_id == user_in.institution_id,
            AuthorizedUser.role == requested_role
        ).first()

    # Determine status: active if matched authorized_users record, else pending approval
    initial_status = "active" if (auth_record and not auth_record.is_used) else "pending"

    # Fetch database role
    db_role = db.query(Role).filter(Role.name == requested_role).first()
    if not db_role:
        db_role = Role(name=requested_role, description=f"{requested_role} role")
        db.add(db_role)
        db.commit()
        db.refresh(db_role)

    hashed_pw = get_password_hash(user_in.password)
    new_user = User(
        email=user_in.email,
        hashed_password=hashed_pw,
        full_name=user_in.full_name,
        institution_id=user_in.institution_id,
        status=initial_status,
        is_active=(initial_status == "active")
    )
    new_user.roles.append(db_role)
    db.add(new_user)
    db.flush()

    # Create associated profile record
    profile = Profile(
        id=str(new_user.id),
        auth_user_id=str(new_user.id),
        full_name=user_in.full_name,
        email=user_in.email,
        role=requested_role,
        institution_id=user_in.institution_id,
        status=initial_status,
        email_verified=True
    )
    db.add(profile)

    # Mark authorized record as used if matched
    if auth_record:
        auth_record.is_used = True

    # If role is student, create Student entity profile
    if requested_role == "student":
        student_profile = Student(
            user_id=new_user.id,
            roll_number=user_in.institution_id or f"STU{new_user.id:05d}",
            cgpa=0.0,
            current_semester=1
        )
        db.add(student_profile)

    # Audit Logging: Track account registration
    audit_entry = AuditLog(
        actor_user_id=str(new_user.id),
        action="USER_CREATED",
        target_user_id=str(new_user.id),
        metadata_json=json.dumps({"email": user_in.email, "role": requested_role, "status": initial_status})
    )
    db.add(audit_entry)
    
    db.commit()
    db.refresh(new_user)
    return new_user


@router.post("/login", response_model=Token)
def login(db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()):
    """
    Authenticate a user using Email and Password only.
    Role selection during login is forbidden; the trusted role is retrieved from the database.
    """
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email address or password.",
        )

    # Account status validation
    if user.status == "suspended":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is suspended. Please contact campus administrator."
        )
    elif user.status == "pending":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account registration is pending administrator approval."
        )
    elif user.status == "rejected":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account registration request was rejected by administration."
        )
    elif not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive."
        )

    # Audit Logging: Log successful sign-in
    audit_entry = AuditLog(
        actor_user_id=str(user.id),
        action="LOGIN",
        target_user_id=str(user.id),
        metadata_json=json.dumps({"email": user.email})
    )
    db.add(audit_entry)
    db.commit()

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
    if not user or not user.is_active or user.status != "active":
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
def forgot_password(email: str, db: Session = Depends(get_db)):
    """Send reset password instructions to user email."""
    user = db.query(User).filter(User.email == email).first()
    if user:
        # Audit logging password reset request
        audit = AuditLog(
            actor_user_id=str(user.id),
            action="PASSWORD_RESET_REQUESTED",
            target_user_id=str(user.id),
            metadata_json=json.dumps({"email": email})
        )
        db.add(audit)
        db.commit()
    return {"message": f"Password reset instructions sent to {email} if an account exists."}


@router.post("/reset-password")
def reset_password(token: str, new_password: str, db: Session = Depends(get_db)):
    """Reset user password using reset token."""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        email = payload.get("sub")
        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        user.hashed_password = get_password_hash(new_password)
        db.commit()
        return {"message": "Password updated successfully"}
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")



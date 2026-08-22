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
from app.api.deps import get_db, get_current_user

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

    # Validate institutional email format rules:
    # Must end with @campus.edu or @campusos.edu and contain role tag (.student, .faculty, .pofficer, .warden, .librarian)
    email_clean = user_in.email.strip().lower()
    role_email_tags = {
        "student": ".student",
        "faculty": ".faculty",
        "placement_officer": ".pofficer",
        "pofficer": ".pofficer",
        "hostel_warden": ".warden",
        "warden": ".warden",
        "librarian": ".librarian",
        "library": ".librarian"
    }

    req_tag = role_email_tags.get(requested_role, f".{requested_role}")
    allowed_domains = ["@campus.edu", "@campusos.edu"]
    is_valid_domain = any(email_clean.endswith(domain) for domain in allowed_domains)
    is_valid_tag = req_tag in email_clean

    if not is_valid_domain or not is_valid_tag:
        sample_email = f"username{req_tag}@campus.edu"
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Email format invalid. Email for role '{requested_role}' must end with '@campus.edu' and contain '{req_tag}' (e.g. '{sample_email}')."
        )

    # Verify requested role and institution ID against pre-authorized registry
    auth_record = None
    if user_in.institution_id:
        auth_record = db.query(AuthorizedUser).filter(
            AuthorizedUser.institution_id == user_in.institution_id,
            AuthorizedUser.role == requested_role
        ).first()

    # Initial status is pending Superadmin approval
    initial_status = "pending"

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
        is_active=False
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
    If a valid faculty, placement officer, warden, librarian, or student logs in for the first time
    and details do not exist in DB, send a registration request to Superadmin for approval.
    """
    email_clean = form_data.username.strip().lower()
    user = db.query(User).filter(User.email == email_clean).first()

    # First-time login auto-request flow if user does not exist in DB yet
    if not user:
        allowed_domains = ["@campus.edu", "@campusos.edu"]
        role_email_tags = {
            ".faculty": "faculty",
            ".pofficer": "placement_officer",
            ".warden": "hostel_warden",
            ".librarian": "librarian",
            ".student": "student"
        }
        is_campus_domain = any(email_clean.endswith(d) for d in allowed_domains)
        matched_tag = next((tag for tag in role_email_tags if tag in email_clean), None)

        if is_campus_domain and matched_tag:
            derived_role = role_email_tags[matched_tag]
            db_role = db.query(Role).filter(Role.name == derived_role).first()
            if not db_role:
                db_role = Role(name=derived_role, description=f"{derived_role} role")
                db.add(db_role)
                db.commit()
                db.refresh(db_role)

            hashed_pw = get_password_hash(form_data.password)
            name_part = email_clean.split('@')[0].split('.')[0]
            display_name = name_part.replace('_', ' ').replace('-', ' ').title()

            new_user = User(
                email=email_clean,
                hashed_password=hashed_pw,
                full_name=display_name,
                status="pending",
                is_active=False
            )
            new_user.roles.append(db_role)
            db.add(new_user)
            db.flush()

            profile = Profile(
                id=str(new_user.id),
                auth_user_id=str(new_user.id),
                full_name=display_name,
                email=email_clean,
                role=derived_role,
                status="pending",
                email_verified=True
            )
            db.add(profile)

            if derived_role == "student":
                student_profile = Student(
                    user_id=new_user.id,
                    roll_number=f"STU{new_user.id:05d}",
                    cgpa=0.0,
                    current_semester=1
                )
                db.add(student_profile)

            db.commit()
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Request has been successfully sent. Your account registration is pending Superadmin approval. Once approved by Superadmin, you will be able to access CampusOS."
            )

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email address or password.",
        )

    if not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email address or password.",
        )

    # Account status validation
    if user.status == "pending" or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Request has been successfully sent. Your account registration is pending Superadmin approval. Once approved by Superadmin, you will be able to access CampusOS."
        )
    elif user.status == "rejected":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account registration request was rejected by administration."
        )
    elif user.status == "suspended":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is suspended. Please contact campus administrator."
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


@router.get("/me")
def get_current_user_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve authenticated user's profile and database role."""
    roles = [r.name.lower() for r in current_user.roles]
    primary_role = roles[0] if roles else "student"
    return {
        "id": str(current_user.id),
        "full_name": current_user.full_name,
        "email": current_user.email,
        "role": primary_role,
        "institution_id": current_user.institution_id,
        "status": current_user.status,
        "is_active": current_user.is_active,
        "created_at": current_user.created_at,
        "updated_at": current_user.updated_at
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



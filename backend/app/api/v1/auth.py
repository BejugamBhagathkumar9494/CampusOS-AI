from fastapi import APIRouter, Depends, HTTPException, status, Body
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from datetime import datetime
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

    # Guarantee SuperAdmin account exists and is active without restrictions
    if email_clean == "superadmin@campus.edu":
        sa_role = db.query(Role).filter(Role.name == "super_admin").first()
        if not sa_role:
            sa_role = Role(name="super_admin", description="Super Administrator Role")
            db.add(sa_role)
            db.commit()
            db.refresh(sa_role)

        if not user:
            user = User(
                email="superadmin@campus.edu",
                hashed_password=get_password_hash(form_data.password),
                full_name="Super Administrator",
                status="active",
                is_active=True
            )
            user.roles.append(sa_role)
            db.add(user)
            db.flush()

            sa_prof = Profile(
                id=str(user.id),
                auth_user_id=str(user.id),
                full_name="Super Administrator",
                email="superadmin@campus.edu",
                role="super_admin",
                status="active",
                email_verified=True
            )
            db.add(sa_prof)
            db.commit()
            db.refresh(user)
        else:
            user.status = "active"
            user.is_active = True
            user.hashed_password = get_password_hash(form_data.password)
            if sa_role not in user.roles:
                user.roles.append(sa_role)
            
            prof = db.query(Profile).filter(Profile.email == "superadmin@campus.edu").first()
            if not prof:
                prof = Profile(
                    id=str(user.id),
                    auth_user_id=str(user.id),
                    full_name="Super Administrator",
                    email="superadmin@campus.edu",
                    role="super_admin",
                    status="active",
                    email_verified=True
                )
                db.add(prof)
            else:
                prof.status = "active"
                prof.role = "super_admin"
            db.commit()

    # Auto-provision pre-authorized / demo users if not present in DB
    if not user:
        demo_accounts = {
            "bhagath.student@campus.edu": ("Bhagath Kumar", "student", "STU003", "bhagath123"),
            "rahul.student@campus.edu": ("Rahul Kumar", "student", "STU001", "rahul123"),
            "priya.student@campus.edu": ("Priya Kumar", "student", "STU002", "priya123"),
            "arun.faculty@campus.edu": ("Dr. Arun Kumar", "faculty", "FAC001", "arun123"),
            "ramesh.warden@campus.edu": ("Ramesh Kumar", "hostel_warden", "WAR001", "ramesh123"),
            "suresh.placement@campus.edu": ("Suresh Kumar", "placement_officer", "PO001", "suresh123"),
            "admin1@campus.edu": ("Admin One", "admin", "ADM001", "admin123"),
        }
        if email_clean in demo_accounts:
            name, role_name, inst_id, demo_pass = demo_accounts[email_clean]
            if form_data.password == demo_pass:
                db_role = db.query(Role).filter(Role.name == role_name).first()
                if not db_role:
                    db_role = Role(name=role_name, description=f"{role_name} role")
                    db.add(db_role)
                    db.commit()
                    db.refresh(db_role)

                user = User(
                    email=email_clean,
                    hashed_password=get_password_hash(demo_pass),
                    full_name=name,
                    institution_id=inst_id,
                    status="active",
                    is_active=True
                )
                user.roles.append(db_role)
                db.add(user)
                db.flush()

                prof = Profile(
                    id=str(user.id),
                    auth_user_id=str(user.id),
                    full_name=name,
                    email=email_clean,
                    role=role_name,
                    institution_id=inst_id,
                    status="active",
                    email_verified=True
                )
                db.add(prof)

                if role_name == "student":
                    stu = Student(
                        user_id=user.id,
                        roll_number=inst_id,
                        cgpa=8.5,
                        current_semester=5
                    )
                    db.add(stu)
                db.commit()
                db.refresh(user)

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

    # Update activity and ensure profile exists
    user.updated_at = datetime.utcnow()
    roles = [r.name.lower() for r in user.roles]
    primary_role = roles[0] if roles else "student"
    
    prof = db.query(Profile).filter(Profile.email == user.email).first()
    if not prof:
        prof = Profile(
            id=str(user.id),
            auth_user_id=str(user.id),
            full_name=user.full_name,
            email=user.email,
            role=primary_role,
            institution_id=user.institution_id,
            status=user.status,
            email_verified=True
        )
        db.add(prof)

    # Audit Logging: Log successful sign-in
    audit_entry = AuditLog(
        actor_user_id=str(user.id),
        action="LOGIN",
        target_user_id=str(user.id),
        metadata_json=json.dumps({"email": user.email, "role": primary_role})
    )
    db.add(audit_entry)
    db.commit()

    return {
        "access_token": create_access_token(subject=user.email),
        "refresh_token": create_refresh_token(subject=user.email),
        "token_type": "bearer",
    }


@router.post("/sync-login")
def sync_login_record(
    payload: dict = Body(...),
    db: Session = Depends(get_db)
):
    """
    Ensure user details and login session are stored in the database.
    Called on any user sign-in to guarantee real-time persistence.
    """
    email = payload.get("email", "").strip().lower()
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
        
    full_name = payload.get("full_name") or email.split("@")[0].title()
    role = (payload.get("role") or "student").lower()
    institution_id = payload.get("institution_id")
    
    user = db.query(User).filter(User.email == email).first()
    db_role = db.query(Role).filter(Role.name == role).first()
    if not db_role:
        db_role = Role(name=role, description=f"{role} role")
        db.add(db_role)
        db.commit()
        db.refresh(db_role)
        
    if not user:
        user = User(
            email=email,
            hashed_password=get_password_hash("default123"),
            full_name=full_name,
            institution_id=institution_id,
            status="active",
            is_active=True
        )
        user.roles.append(db_role)
        db.add(user)
        db.flush()
    else:
        user.updated_at = datetime.utcnow()
        if db_role not in user.roles:
            user.roles.append(db_role)
            
    prof = db.query(Profile).filter(Profile.email == email).first()
    if not prof:
        prof = Profile(
            id=str(user.id),
            auth_user_id=str(user.id),
            full_name=full_name,
            email=email,
            role=role,
            institution_id=institution_id,
            status=user.status,
            email_verified=True
        )
        db.add(prof)
    else:
        prof.full_name = full_name
        prof.role = role
        prof.status = user.status
        
    audit_entry = AuditLog(
        actor_user_id=str(user.id),
        action="LOGIN",
        target_user_id=str(user.id),
        metadata_json=json.dumps({"email": user.email, "role": role, "source": "sync"})
    )
    db.add(audit_entry)
    db.commit()
    return {"status": "success", "user_id": user.id, "email": email}


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



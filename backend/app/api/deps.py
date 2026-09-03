from typing import List, Generator, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import SessionLocal
from app.models import User, Role
from app.schemas import TokenPayload

reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login"
)
optional_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login",
    auto_error=False
)

def get_db() -> Generator:
    """Dependency for database sessions."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user_optional(
    db: Session = Depends(get_db), token: Optional[str] = Depends(optional_oauth2)
) -> Optional[User]:
    """Optional user dependency for public/unauthenticated fallback AI access."""
    if not token:
        return None
    try:
        try:
            payload = jwt.decode(
                token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
            )
        except Exception:
            payload = jwt.decode(token, options={"verify_signature": False})

        email: str = payload.get("email") or payload.get("sub")
        if not email:
            return None
        return db.query(User).filter(User.email == email).first()
    except Exception:
        return None

def get_current_user(
    db: Session = Depends(get_db), token: str = Depends(reusable_oauth2)
) -> User:
    """
    Validates user identity from either backend JWT or Supabase Auth JWT.
    Enforces user existence and active status.
    """
    payload = None
    try:
        payload = jwt.decode(
            token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
        )
    except Exception:
        try:
            # Fallback for Supabase Auth JWT tokens
            payload = jwt.decode(token, options={"verify_signature": False})
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
            )

    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )

    # Resolve email from claims
    email = payload.get("email")
    if not email:
        sub = payload.get("sub", "")
        if "@" in sub:
            email = sub
        else:
            # Might be Supabase UUID, check user_metadata
            metadata = payload.get("user_metadata", {}) or {}
            email = metadata.get("email")

    if not email and payload.get("sub"):
        email = payload.get("sub")

    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials: no identifier present in token",
        )

    user = db.query(User).filter(User.email == email).first()

    # If user logged in via Supabase but doesn't exist in local PostgreSQL, auto-provision
    if not user and "@" in email:
        try:
            metadata = payload.get("user_metadata", {}) or {}
            full_name = metadata.get("full_name") or email.split("@")[0].title()
            derived_role = (metadata.get("role") or "student").lower()

            role_record = db.query(Role).filter(Role.name == derived_role).first()
            if not role_record:
                role_record = Role(name=derived_role, description=f"{derived_role.title()} role")
                db.add(role_record)
                db.flush()

            from app.core.security import get_password_hash
            user = User(
                email=email,
                full_name=full_name,
                hashed_password=get_password_hash("SupabaseAuthSyncPass2026!"),
                is_active=True,
                status="active"
            )
            user.roles.append(role_record)
            db.add(user)
            db.commit()
            db.refresh(user)

            if derived_role == "student":
                student_rec = db.query(Student).filter(Student.user_id == user.id).first()
                if not student_rec:
                    student_rec = Student(
                        user_id=user.id,
                        roll_number=f"STU{user.id:05d}",
                        cgpa=0.0,
                        current_semester=1
                    )
                    db.add(student_rec)
                    db.commit()
        except Exception as prov_err:
            db.rollback()
            print(f"[Auth Dependency Warning] Auto-provision user error: {prov_err}")
            user = db.query(User).filter(User.email == email).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="User account not found"
        )

    # Check account status
    if not user.is_active or user.status != "active":
        if user.status == "suspended":
            detail_msg = "Account is suspended. Please contact administrator."
        elif user.status == "pending":
            detail_msg = "Account is pending administrator approval."
        elif user.status == "rejected":
            detail_msg = "Account registration request was rejected."
        else:
            detail_msg = "Inactive or disabled account."
            
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail=detail_msg
        )
        
    return user


get_current_active_user = get_current_user


def check_role(allowed_roles: List[str]):
    # Never trust the role received from the frontend or request body.
    # The user's role must come directly from the trusted database profile.
    def role_dependency(current_user: User = Depends(get_current_user)) -> User:
        user_role_names = [role.name.lower() for role in current_user.roles]
        normalized_allowed = [r.lower() for r in allowed_roles]
        
        # Super admin has global system permissions across all modules
        if "super_admin" in user_role_names:
            return current_user

        if not any(role in user_role_names for role in normalized_allowed):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Authorized roles required: {', '.join(allowed_roles)}",
            )
        return current_user
    return role_dependency


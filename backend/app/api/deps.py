from typing import List, Generator
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

def get_db() -> Generator:
    """Dependency for database sessions."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(
    db: Session = Depends(get_db), token: str = Depends(reusable_oauth2)
) -> User:
    # Authentication verifies the user's identity via JWT signature verification.
    # Authorization and profile role validation are handled separately using the database.
    try:
        payload = jwt.decode(
            token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
        )
        # OAuth2 standard puts subject in 'sub' claim (email or UUID)
        token_subject: str = payload.get("sub")
        if token_subject is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
            )
        token_data = TokenPayload(sub=token_subject)
    except (JWTError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )
    
    user = db.query(User).filter(User.email == token_data.sub).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="User account not found"
        )

    # Check both is_active flag and explicit account status enum ('active', 'pending', 'suspended', 'rejected')
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


from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
import json

from app.api.deps import get_db, get_current_user, check_role
from app.models import User, Role
from app.models.database_models import Profile, AuditLog, AuthorizedUser
from app.schemas import UserResponse, UserStatusUpdate, AdminUserCreate, AuditLogResponse
from app.core.security import get_password_hash

router = APIRouter(prefix="/admin-management", tags=["Admin Management"])


# Security Comment: User Management APIs are restricted to Admin and Super Admin roles.
@router.get("/users")
def get_all_users(
    status_filter: Optional[str] = Query(None),
    role_filter: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(check_role(["admin", "super_admin"]))
):
    """Retrieve campus users with optional status and role filters."""
    query = db.query(Profile)
    if status_filter:
        query = query.filter(Profile.status == status_filter.lower())
    if role_filter:
        query = query.filter(Profile.role == role_filter.lower())
    
    profiles = query.all()
    return [{
        "id": p.id,
        "full_name": p.full_name,
        "email": p.email,
        "role": p.role,
        "institution_id": p.institution_id,
        "status": p.status,
        "created_at": p.created_at
    } for p in profiles]


@router.patch("/users/{user_id}/status")
def update_user_status(
    user_id: int,
    payload: UserStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_role(["admin", "super_admin"]))
):
    """Approve, suspend, or reject a user account."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    new_status = payload.status.lower()
    if new_status not in ["active", "pending", "suspended", "rejected"]:
        raise HTTPException(status_code=400, detail="Invalid status value")

    # Prevent regular admins from modifying Super Admin accounts
    user_roles = [r.name.lower() for r in user.roles]
    current_user_roles = [r.name.lower() for r in current_user.roles]
    if "super_admin" in user_roles and "super_admin" not in current_user_roles:
        raise HTTPException(status_code=403, detail="Only Super Admin can modify Super Admin accounts.")

    old_status = user.status
    user.status = new_status
    user.is_active = (new_status == "active")

    # Sync profile status
    profile = db.query(Profile).filter(Profile.auth_user_id == str(user.id)).first()
    if profile:
        profile.status = new_status

    # Map action to audit event
    action_map = {
        "active": "USER_APPROVED",
        "suspended": "USER_SUSPENDED",
        "rejected": "USER_REJECTED",
        "pending": "USER_STATUS_PENDING"
    }
    
    audit_entry = AuditLog(
        actor_user_id=str(current_user.id),
        action=action_map.get(new_status, "STATUS_CHANGED"),
        target_user_id=str(user.id),
        metadata_json=json.dumps({"old_status": old_status, "new_status": new_status})
    )
    db.add(audit_entry)
    db.commit()

    return {"message": f"User status updated to {new_status}", "user_id": user_id, "status": new_status}


# Security Comment: Creating administrator accounts is strictly restricted to Super Admin.
@router.post("/create-admin")
def create_admin_account(
    admin_in: AdminUserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_role(["super_admin"]))
):
    """Create a new Administrator account (Super Admin only)."""
    existing = db.query(User).filter(User.email == admin_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    admin_role = db.query(Role).filter(Role.name == "admin").first()
    if not admin_role:
        admin_role = Role(name="admin", description="Administrator Role")
        db.add(admin_role)
        db.commit()

    new_admin = User(
        email=admin_in.email,
        hashed_password=get_password_hash(admin_in.password),
        full_name=admin_in.full_name,
        institution_id=admin_in.institution_id,
        status="active",
        is_active=True
    )
    new_admin.roles.append(admin_role)
    db.add(new_admin)
    db.flush()

    profile = Profile(
        id=str(new_admin.id),
        auth_user_id=str(new_admin.id),
        full_name=admin_in.full_name,
        email=admin_in.email,
        role="admin",
        institution_id=admin_in.institution_id,
        status="active",
        email_verified=True
    )
    db.add(profile)

    audit = AuditLog(
        actor_user_id=str(current_user.id),
        action="ADMIN_CREATED",
        target_user_id=str(new_admin.id),
        metadata_json=json.dumps({"email": admin_in.email, "institution_id": admin_in.institution_id})
    )
    db.add(audit)
    db.commit()

    return {"message": "Administrator account created successfully", "user_id": new_admin.id}


@router.get("/audit-logs", response_model=List[AuditLogResponse])
def get_audit_logs(
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(check_role(["admin", "super_admin"]))
):
    """Retrieve system security audit logs."""
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(limit).all()
    return logs

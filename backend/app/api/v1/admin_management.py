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
    user_id: str,
    payload: UserStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_role(["admin", "super_admin"]))
):
    """Approve, suspend, or reject a user account."""
    new_status = payload.status.lower()
    if new_status not in ["active", "pending", "suspended", "rejected"]:
        raise HTTPException(status_code=400, detail="Invalid status value")

    # Find user by int ID, email, or Profile matching user_id
    user = None
    if user_id.isdigit():
        user = db.query(User).filter(User.id == int(user_id)).first()
    
    profile = None
    if not user:
        profile = db.query(Profile).filter((Profile.id == user_id) | (Profile.auth_user_id == user_id) | (Profile.email == user_id)).first()
        if profile:
            user = db.query(User).filter((User.id == profile.auth_user_id) | (User.email == profile.email)).first()
    else:
        profile = db.query(Profile).filter((Profile.auth_user_id == str(user.id)) | (Profile.email == user.email)).first()

    if not user and not profile:
        raise HTTPException(status_code=404, detail="User account not found")

    old_status = user.status if user else (profile.status if profile else "unknown")

    if user:
        user_roles = [r.name.lower() for r in user.roles]
        current_user_roles = [r.name.lower() for r in current_user.roles]
        if "super_admin" in user_roles and "super_admin" not in current_user_roles:
            raise HTTPException(status_code=403, detail="Only Super Admin can modify Super Admin accounts.")

        user.status = new_status
        user.is_active = (new_status == "active")

    if profile:
        profile.status = new_status

    # Also update RegistrationRequest table if exists
    user_email = user.email if user else (profile.email if profile else None)
    if user_email:
        from app.models import RegistrationRequest
        from datetime import datetime
        reg_req = db.query(RegistrationRequest).filter(RegistrationRequest.email == user_email).first()
        if reg_req:
            reg_req.status = new_status
            reg_req.reviewed_at = datetime.utcnow()
            reg_req.reviewed_by = current_user.id
            if payload.rejection_reason:
                reg_req.rejection_reason = payload.rejection_reason
    
    db.commit()

    # Try updating Supabase profiles table using Supabase Admin client if available
    try:
        from app.core.supabase import get_supabase_admin_client
        supa_admin = get_supabase_admin_client()
        target_id = profile.id if profile else (str(user.id) if user else user_id)
        supa_admin.from_("profiles").update({"status": new_status}).eq("id", target_id).execute()
    except Exception as supa_err:
        print(f"Supabase profile status update warning: {supa_err}")

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
        target_user_id=str(user.id if user else (profile.id if profile else user_id)),
        metadata_json=json.dumps({"old_status": old_status, "new_status": new_status})
    )
    db.add(audit_entry)
    db.commit()

    return {"message": f"User status updated to {new_status}", "user_id": user_id, "status": new_status}


@router.delete("/users/{user_id}")
def delete_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_role(["admin", "super_admin"]))
):
    """Permanently delete a user account from database (Super Admin / Admin)."""
    # Prevent self-deletion
    if str(current_user.id) == user_id or current_user.email == user_id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account.")

    user = None
    if user_id.isdigit():
        user = db.query(User).filter(User.id == int(user_id)).first()
    
    profile = None
    if not user:
        profile = db.query(Profile).filter((Profile.id == user_id) | (Profile.auth_user_id == user_id) | (Profile.email == user_id)).first()
        if profile:
            user = db.query(User).filter((User.id == profile.auth_user_id) | (User.email == profile.email)).first()
    else:
        profile = db.query(Profile).filter((Profile.auth_user_id == str(user.id)) | (Profile.email == user.email)).first()

    if not user and not profile:
        raise HTTPException(status_code=404, detail="User account not found")

    target_email = user.email if user else (profile.email if profile else "unknown")
    target_id_str = str(user.id) if user else (profile.id if profile else user_id)

    # Security check: Non-superadmin cannot delete super_admin accounts
    current_user_roles = [r.name.lower() for r in current_user.roles]
    target_roles = [r.name.lower() for r in user.roles] if user else ([profile.role.lower()] if profile and profile.role else [])
    if "super_admin" in target_roles and "super_admin" not in current_user_roles:
        raise HTTPException(status_code=403, detail="Only Super Admin can delete Super Admin accounts.")

    # Delete Profile record
    if profile:
        db.delete(profile)

    # Explicitly clean up Student and Faculty records for DB backends without FK CASCADE
    if user:
        from app.models import Student, Faculty
        student_rec = db.query(Student).filter(Student.user_id == user.id).first()
        if student_rec:
            db.delete(student_rec)
        faculty_rec = db.query(Faculty).filter(Faculty.user_id == user.id).first()
        if faculty_rec:
            db.delete(faculty_rec)
        db.delete(user)

    # Also clean up AuthorizedUser record if matching email
    auth_user = db.query(AuthorizedUser).filter((AuthorizedUser.email == target_email) | (AuthorizedUser.institution_id == user_id)).first()
    if auth_user:
        db.delete(auth_user)

    # Try deleting Supabase profile row via Supabase Admin client if configured
    try:
        from app.core.supabase import get_supabase_admin_client
        supa_admin = get_supabase_admin_client()
        supa_admin.from_("profiles").delete().eq("id", target_id_str).execute()
    except Exception as supa_err:
        print(f"Supabase profile delete warning: {supa_err}")

    # Audit logging
    audit_entry = AuditLog(
        actor_user_id=str(current_user.id),
        action="USER_DELETED",
        target_user_id=target_id_str,
        metadata_json=json.dumps({"deleted_email": target_email})
    )
    db.add(audit_entry)
    db.commit()

    return {"message": "User account deleted successfully", "user_id": target_id_str, "email": target_email}



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

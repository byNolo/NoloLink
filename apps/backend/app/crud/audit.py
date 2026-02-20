import json
from typing import Optional
from sqlalchemy.orm import Session
from app.models.audit import AuditLog


def create_audit_entry(
    db: Session,
    user_id: int,
    action: str,
    target_type: str,
    target_id: int,
    details: Optional[dict] = None,
):
    """Create a new audit log entry."""
    entry = AuditLog(
        user_id=user_id,
        action=action,
        target_type=target_type,
        target_id=target_id,
        details=json.dumps(details) if details else None,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def get_audit_logs(
    db: Session,
    user_id: Optional[int] = None,
    action: Optional[str] = None,
    target_type: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
):
    """Get audit logs, optionally filtered by user, action, or target type."""
    query = db.query(AuditLog)

    if user_id is not None:
        query = query.filter(AuditLog.user_id == user_id)
    if action:
        query = query.filter(AuditLog.action == action)
    if target_type:
        query = query.filter(AuditLog.target_type == target_type)

    return query.order_by(AuditLog.timestamp.desc()).offset(skip).limit(limit).all()

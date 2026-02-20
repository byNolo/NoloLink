from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.crud import audit as crud_audit
from app.schemas.audit import AuditLog as AuditLogSchema
from app.api import deps
from app.models.user import User
from app.crud import user as crud_user

router = APIRouter()


@router.get("/", response_model=List[AuditLogSchema])
def get_audit_logs(
    action: Optional[str] = Query(None, description="Filter by action: create, update, delete"),
    target_type: Optional[str] = Query(None, description="Filter by target: link, campaign"),
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Get audit logs. Regular users see only their own logs.
    Admins see all logs.
    """
    user_id_filter = None if current_user.is_superuser else current_user.id

    logs = crud_audit.get_audit_logs(
        db,
        user_id=user_id_filter,
        action=action,
        target_type=target_type,
        skip=skip,
        limit=limit,
    )

    # Enrich with usernames
    user_cache = {}
    results = []
    for log in logs:
        if log.user_id not in user_cache:
            user = crud_user.get_user(db, user_id=log.user_id)
            user_cache[log.user_id] = user.username if user else "Unknown"

        log_data = AuditLogSchema.model_validate(log)
        log_data.username = user_cache[log.user_id]
        results.append(log_data)

    return results

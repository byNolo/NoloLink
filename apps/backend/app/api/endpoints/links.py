from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.crud import link as crud_link
from app.crud import audit as crud_audit
from app.schemas import link as link_schema
from app.api import deps
from app.api.deps import OrgContext
from app.models.user import User

router = APIRouter()

@router.get("/", response_model=List[link_schema.Link])
def read_links(
    skip: int = 0, 
    limit: int = 100, 
    search: str = None,
    campaign_id: int = None,
    is_active: bool = None,
    db: Session = Depends(get_db), 
    current_user: User = Depends(deps.get_current_active_user),
    org_ctx: OrgContext = Depends(deps.get_current_org)
):
    filters = {
        "search": search,
        "campaign_id": campaign_id,
        "is_active": is_active
    }
    # Admins/owners see all org links, members see only their own UNLESS privacy is disabled
    show_all = (
        org_ctx.role in ("owner", "admin") or 
        current_user.is_superuser or 
        not org_ctx.org.is_link_privacy_enabled
    )
    
    if show_all:
        return crud_link.get_links(db, org_id=org_ctx.org.id, skip=skip, limit=limit, filters=filters)
    else:
        return crud_link.get_links(db, org_id=org_ctx.org.id, owner_id=current_user.id, skip=skip, limit=limit, filters=filters)

@router.post("/", response_model=link_schema.Link)
def create_link(
    link: link_schema.LinkCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(deps.get_current_active_user),
    org_ctx: OrgContext = Depends(deps.get_current_org)
):
    if not current_user.is_approved and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="User not approved to create links")

    db_link = crud_link.create_link(db=db, link=link, owner_id=current_user.id, org_id=org_ctx.org.id)
    if not db_link:
        raise HTTPException(status_code=400, detail="Short code already exists")
    
    crud_audit.create_audit_entry(
        db, user_id=current_user.id, action="create",
        target_type="link", target_id=db_link.id,
        details={
            "short_code": db_link.short_code,
            "summary": f"Created link /{db_link.short_code} → {db_link.original_url[:80]}"
        },
        org_id=org_ctx.org.id
    )
    return db_link

@router.post("/bulk", response_model=List[link_schema.Link])
def create_links_bulk(
    links: List[link_schema.LinkCreate],
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
    org_ctx: OrgContext = Depends(deps.get_current_org)
):
    if not current_user.is_approved and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="User not approved to create links")
    
    return crud_link.create_links_bulk(db=db, links=links, owner_id=current_user.id, org_id=org_ctx.org.id)

@router.put("/bulk", response_model=List[link_schema.Link])
def update_links_bulk(
    bulk_update: link_schema.LinkBulkUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
    org_ctx: OrgContext = Depends(deps.get_current_org)
):
    if not current_user.is_approved and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="User not approved to update links")
    
    # Members can only bulk-update their own links
    owner_filter = None if (org_ctx.role in ("owner", "admin") or current_user.is_superuser) else current_user.id
    updated = crud_link.update_links_bulk(db=db, bulk_update=bulk_update, owner_id=owner_filter, org_id=org_ctx.org.id)
    
    # Build summary of what fields were changed
    changed_fields = []
    update_data = bulk_update.dict(exclude={'link_ids'}, exclude_unset=True) if hasattr(bulk_update, 'dict') else {}
    for k, v in update_data.items():
        if v is not None:
            changed_fields.append(k.replace('_', ' '))
    fields_str = ', '.join(changed_fields) if changed_fields else 'bulk fields'
    
    for link in updated:
        crud_audit.create_audit_entry(
            db, user_id=current_user.id, action="update",
            target_type="link", target_id=link.id,
            details={
                "short_code": link.short_code,
                "bulk_update": True,
                "summary": f"Bulk edit /{link.short_code}: updated {fields_str}"
            },
            org_id=org_ctx.org.id
        )
    return updated

@router.put("/{link_id}", response_model=link_schema.Link)
def update_link(
    link_id: int,
    link_in: link_schema.LinkCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
    org_ctx: OrgContext = Depends(deps.get_current_org)
):
    if not current_user.is_approved and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="User not approved to update links")

    link = crud_link.get_link(db, link_id=link_id)
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")
    if link.org_id != org_ctx.org.id:
        raise HTTPException(status_code=404, detail="Link not found")
    # Members can only edit their own links, and only if allowed by org settings
    if org_ctx.role not in ("owner", "admin") and not current_user.is_superuser:
        if link.owner_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not enough permissions")
        if not org_ctx.org.allow_member_edit:
            raise HTTPException(status_code=403, detail="Member editing is disabled for this organization")
    
    updated_link = crud_link.update_link(db=db, db_link=link, link_update=link_in)
    if not updated_link:
        raise HTTPException(status_code=400, detail="Short code already exists")
    
    # Build change summary
    changes = []
    if link.original_url != updated_link.original_url:
        changes.append(f"url → {updated_link.original_url[:60]}")
    if link.short_code != updated_link.short_code:
        changes.append(f"slug → /{updated_link.short_code}")
    if link.is_active != updated_link.is_active:
        changes.append(f"{'activated' if updated_link.is_active else 'deactivated'}")
    if link.campaign_id != updated_link.campaign_id:
        changes.append("campaign changed")
    if link.title != updated_link.title:
        changes.append(f"title → {updated_link.title or '(cleared)'}")
    if link.tags != updated_link.tags:
        changes.append("tags updated")
    if link.expires_at != updated_link.expires_at:
        changes.append("expiration changed")
    if link.require_login != updated_link.require_login:
        changes.append(f"require login → {'yes' if updated_link.require_login else 'no'}")
    if link.redirect_type != updated_link.redirect_type:
        changes.append(f"redirect → {updated_link.redirect_type}")
    summary = f"Updated /{updated_link.short_code}: {', '.join(changes)}" if changes else f"Updated /{updated_link.short_code} (no visible changes)"
    
    crud_audit.create_audit_entry(
        db, user_id=current_user.id, action="update",
        target_type="link", target_id=updated_link.id,
        details={"short_code": updated_link.short_code, "summary": summary},
        org_id=org_ctx.org.id
    )
    return updated_link

@router.delete("/{link_id}", response_model=link_schema.Link)
def delete_link(
    link_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
    org_ctx: OrgContext = Depends(deps.get_current_org)
):
    link = crud_link.get_link(db, link_id=link_id)
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")
    if link.org_id != org_ctx.org.id:
        raise HTTPException(status_code=404, detail="Link not found")
    # Members can only delete their own links, and only if allowed by org settings
    if org_ctx.role not in ("owner", "admin") and not current_user.is_superuser:
        if link.owner_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not enough permissions")
        if not org_ctx.org.allow_member_delete:
            raise HTTPException(status_code=403, detail="Member deletion is disabled for this organization")
    
    crud_audit.create_audit_entry(
        db, user_id=current_user.id, action="delete",
        target_type="link", target_id=link.id,
        details={
            "short_code": link.short_code,
            "summary": f"Deleted /{link.short_code} → {link.original_url[:80]}"
        },
        org_id=org_ctx.org.id
    )
    crud_link.delete_link(db, db_link=link)
    return link


@router.get("/{short_code}/stats", response_model=link_schema.Link)
def get_link_stats(
    short_code: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
    org_ctx: OrgContext = Depends(deps.get_current_org)
):
    link = crud_link.get_link_by_code(db, short_code=short_code)
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")
    
    # Permission: must be in the same org (or superuser)
    if link.org_id != org_ctx.org.id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not authorized to view stats for this link")
    
    # Members can only view their own link stats
    if link.owner_id != current_user.id and not current_user.is_superuser and org_ctx.role not in ("owner", "admin"):
        raise HTTPException(status_code=403, detail="Not authorized to view stats for this link")
    
    # Aggregate Stats
    from sqlalchemy import func
    from app.models.analytics import ClickEvent
    from datetime import datetime, timedelta

    # 1. Clicks Over Time (Last 30 Days)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    clicks_over_time_query = db.query(
        func.date(ClickEvent.timestamp).label('date'),
        func.count(ClickEvent.id).label('count')
    ).filter(
        ClickEvent.link_id == link.id,
        ClickEvent.timestamp >= thirty_days_ago
    ).group_by('date').all()
    
    link.clicks_over_time = [{"date": str(row.date), "count": row.count} for row in clicks_over_time_query]

    # 2. Top Countries
    top_countries_query = db.query(
        ClickEvent.country_code,
        func.count(ClickEvent.id).label('count')
    ).filter(
        ClickEvent.link_id == link.id
    ).group_by(ClickEvent.country_code).order_by(func.count(ClickEvent.id).desc()).limit(10).all()
    
    link.top_countries = [{"country": row.country_code or "Unknown", "count": row.count} for row in top_countries_query]

    # 3. Top Referrers
    top_referrers_query = db.query(
        ClickEvent.referrer,
        func.count(ClickEvent.id).label('count')
    ).filter(
        ClickEvent.link_id == link.id
    ).group_by(ClickEvent.referrer).order_by(func.count(ClickEvent.id).desc()).limit(10).all()
    
    link.top_referrers = [{"referrer": row.referrer or "Direct", "count": row.count} for row in top_referrers_query]

    # 4. Device Breakdown
    device_breakdown_query = db.query(
        ClickEvent.device_type,
        func.count(ClickEvent.id).label('count')
    ).filter(
        ClickEvent.link_id == link.id
    ).group_by(ClickEvent.device_type).all()
    
    link.device_breakdown = [{"device": row.device_type or "Unknown", "count": row.count} for row in device_breakdown_query]
        
    return link

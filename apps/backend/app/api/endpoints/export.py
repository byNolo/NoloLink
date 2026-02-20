import csv
import io
from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.crud import link as crud_link
from app.api import deps
from app.models.user import User
from app.models.link import Link
from app.models.campaign import Campaign

router = APIRouter()

CSV_COLUMNS = [
    "short_code", "original_url", "title", "tags", "is_active",
    "redirect_type", "campaign_name", "require_login", "allowed_emails",
    "expires_at", "clicks", "created_at"
]


@router.get("/csv")
def export_links_csv(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """Export all of the current user's links as a CSV file."""
    links = db.query(Link).filter(
        Link.owner_id == current_user.id,
        Link.is_deleted == False
    ).order_by(Link.created_at.desc()).all()

    # Build a campaign ID -> name lookup
    campaigns = db.query(Campaign).filter(Campaign.owner_id == current_user.id).all()
    campaign_map = {c.id: c.name for c in campaigns}

    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=CSV_COLUMNS)
    writer.writeheader()

    for link in links:
        writer.writerow({
            "short_code": link.short_code,
            "original_url": link.original_url,
            "title": link.title or "",
            "tags": link.tags or "",
            "is_active": str(link.is_active),
            "redirect_type": link.redirect_type or 302,
            "campaign_name": campaign_map.get(link.campaign_id, ""),
            "require_login": str(link.require_login),
            "allowed_emails": link.allowed_emails or "",
            "expires_at": link.expires_at.isoformat() if link.expires_at else "",
            "clicks": link.clicks,
            "created_at": link.created_at.isoformat() if link.created_at else "",
        })

    output.seek(0)
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    filename = f"nololink_export_{timestamp}.csv"

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.post("/csv")
def import_links_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """Import links from a CSV file. Skips rows with duplicate short_codes."""
    if not current_user.is_approved and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="User not approved to create links")

    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="File must be a .csv")

    try:
        content = file.file.read().decode("utf-8")
    except Exception:
        raise HTTPException(status_code=400, detail="Could not read file as UTF-8 text")

    reader = csv.DictReader(io.StringIO(content))

    # Build campaign name -> id lookup for this user
    campaigns = db.query(Campaign).filter(Campaign.owner_id == current_user.id).all()
    campaign_name_map = {c.name.lower(): c.id for c in campaigns}

    created = 0
    skipped = 0
    errors = []

    for i, row in enumerate(reader, start=2):  # start=2 because row 1 is header
        original_url = row.get("original_url", "").strip()
        if not original_url:
            errors.append(f"Row {i}: missing original_url, skipped")
            skipped += 1
            continue

        short_code = row.get("short_code", "").strip() or None

        # Check for duplicates
        if short_code and crud_link.get_link_by_code(db, short_code):
            errors.append(f"Row {i}: short_code '{short_code}' already exists, skipped")
            skipped += 1
            continue

        # Parse fields
        title = row.get("title", "").strip() or None
        tags = row.get("tags", "").strip() or None
        is_active = row.get("is_active", "True").strip().lower() != "false"
        require_login = row.get("require_login", "False").strip().lower() == "true"
        allowed_emails = row.get("allowed_emails", "").strip() or None
        
        try:
            redirect_type = int(row.get("redirect_type", "302").strip())
        except ValueError:
            redirect_type = 302

        expires_at = None
        expires_str = row.get("expires_at", "").strip()
        if expires_str:
            try:
                expires_at = datetime.fromisoformat(expires_str)
            except ValueError:
                pass  # Ignore unparseable dates

        # Resolve campaign
        campaign_id = None
        campaign_name = row.get("campaign_name", "").strip()
        if campaign_name:
            campaign_id = campaign_name_map.get(campaign_name.lower())

        from app.schemas.link import LinkCreate
        link_data = LinkCreate(
            original_url=original_url,
            short_code=short_code,
            title=title,
            tags=tags,
            is_active=is_active,
            redirect_type=redirect_type,
            campaign_id=campaign_id,
            require_login=require_login,
            allowed_emails=allowed_emails,
            expires_at=expires_at,
        )

        db_link = crud_link.create_link(db=db, link=link_data, owner_id=current_user.id)
        if db_link:
            created += 1
        else:
            errors.append(f"Row {i}: short_code collision during creation, skipped")
            skipped += 1

    return {
        "created": created,
        "skipped": skipped,
        "errors": errors[:20],  # Cap error messages
    }

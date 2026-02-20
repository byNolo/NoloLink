from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.crud import campaign as crud_campaign
from app.crud import audit as crud_audit
from app.schemas.campaign import Campaign, CampaignCreate, CampaignUpdate
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter()

@router.post("/", response_model=Campaign)
def create_campaign(
    campaign: CampaignCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_campaign = crud_campaign.create_campaign(db=db, campaign=campaign, owner_id=current_user.id)
    crud_audit.create_audit_entry(
        db, user_id=current_user.id, action="create",
        target_type="campaign", target_id=db_campaign.id,
        details={"name": db_campaign.name, "summary": f"Created campaign '{db_campaign.name}'"}
    )
    return db_campaign

@router.get("/", response_model=List[Campaign])
def read_campaigns(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return crud_campaign.get_campaigns(db, owner_id=current_user.id, skip=skip, limit=limit)

@router.get("/{campaign_id}", response_model=Campaign)
def read_campaign(
    campaign_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    campaign = crud_campaign.get_campaign(db, campaign_id=campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    if campaign.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this campaign")
    return campaign

@router.put("/{campaign_id}", response_model=Campaign)
def update_campaign(
    campaign_id: int,
    campaign_in: CampaignUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    campaign = crud_campaign.get_campaign(db, campaign_id=campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    if campaign.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this campaign")
    old_name = campaign.name
    updated = crud_campaign.update_campaign(db=db, db_campaign=campaign, campaign=campaign_in)
    summary = f"Renamed campaign '{old_name}' → '{updated.name}'" if old_name != updated.name else f"Updated campaign '{updated.name}'"
    crud_audit.create_audit_entry(
        db, user_id=current_user.id, action="update",
        target_type="campaign", target_id=updated.id,
        details={"name": updated.name, "summary": summary}
    )
    return updated

@router.delete("/{campaign_id}")
def delete_campaign(
    campaign_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    campaign = crud_campaign.get_campaign(db, campaign_id=campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    if campaign.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this campaign")
    crud_audit.create_audit_entry(
        db, user_id=current_user.id, action="delete",
        target_type="campaign", target_id=campaign.id,
        details={"name": campaign.name, "summary": f"Deleted campaign '{campaign.name}'"}
    )
    crud_campaign.delete_campaign(db=db, db_campaign=campaign)
    return {"ok": True}

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.crud import campaign as crud_campaign
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
    return crud_campaign.create_campaign(db=db, campaign=campaign, owner_id=current_user.id)

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
    return crud_campaign.update_campaign(db=db, db_campaign=campaign, campaign=campaign_in)

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
    crud_campaign.delete_campaign(db=db, db_campaign=campaign)
    return {"ok": True}

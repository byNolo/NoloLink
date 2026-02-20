from sqlalchemy.orm import Session
from app.models.campaign import Campaign
from app.schemas.campaign import CampaignCreate, CampaignUpdate

def get_campaign(db: Session, campaign_id: int):
    return db.query(Campaign).filter(Campaign.id == campaign_id).first()

def get_campaigns(db: Session, owner_id: int, skip: int = 0, limit: int = 100):
    return db.query(Campaign).filter(Campaign.owner_id == owner_id).offset(skip).limit(limit).all()

def create_campaign(db: Session, campaign: CampaignCreate, owner_id: int):
    db_campaign = Campaign(**campaign.model_dump(), owner_id=owner_id)
    db.add(db_campaign)
    db.commit()
    db.refresh(db_campaign)
    return db_campaign

def update_campaign(db: Session, db_campaign: Campaign, campaign: CampaignUpdate):
    update_data = campaign.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_campaign, key, value)
    db.add(db_campaign)
    db.commit()
    db.refresh(db_campaign)
    return db_campaign

def delete_campaign(db: Session, db_campaign: Campaign):
    db.delete(db_campaign)
    db.commit()

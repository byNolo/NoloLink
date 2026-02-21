from urllib.parse import urlencode, urlparse, parse_qs, urlunparse

from sqlalchemy.orm import Session
from app.models.link import Link
from app.schemas.link import LinkCreate, LinkUpdate
import shortuuid
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def build_redirect_url(link: Link) -> str:
    """Append any non-empty UTM parameters to the link's original_url."""
    utm_params = {}
    if link.utm_source:
        utm_params["utm_source"] = link.utm_source
    if link.utm_medium:
        utm_params["utm_medium"] = link.utm_medium
    if link.utm_campaign:
        utm_params["utm_campaign"] = link.utm_campaign
    if link.utm_term:
        utm_params["utm_term"] = link.utm_term
    if link.utm_content:
        utm_params["utm_content"] = link.utm_content

    if not utm_params:
        return link.original_url

    parsed = urlparse(link.original_url)
    existing_params = parse_qs(parsed.query, keep_blank_values=True)
    # UTM params override any existing ones with the same key
    existing_params.update({k: [v] for k, v in utm_params.items()})
    new_query = urlencode({k: v[0] for k, v in existing_params.items()})
    return urlunparse(parsed._replace(query=new_query))

def get_link(db: Session, link_id: int):
    return db.query(Link).filter(Link.id == link_id, Link.is_deleted == False).first()

def get_link_by_code(db: Session, short_code: str):
    return db.query(Link).filter(Link.short_code == short_code, Link.is_deleted == False).first()

def get_links(
    db: Session, 
    org_id: int = None,
    owner_id: int = None, 
    skip: int = 0, 
    limit: int = 100, 
    filters: dict = None
):
    query = db.query(Link).filter(Link.is_deleted == False)
    if org_id:
        query = query.filter(Link.org_id == org_id)
    if owner_id:
        query = query.filter(Link.owner_id == owner_id)
    
    if filters:
        if filters.get("campaign_id"):
            query = query.filter(Link.campaign_id == filters["campaign_id"])
        if filters.get("is_active") is not None:
            query = query.filter(Link.is_active == filters["is_active"])
        if filters.get("search"):
            search = f"%{filters['search']}%"
            query = query.filter(
                (Link.title.ilike(search)) | 
                (Link.original_url.ilike(search)) | 
                (Link.tags.ilike(search)) |
                (Link.short_code.ilike(search))
            )

    return query.order_by(Link.created_at.desc()).offset(skip).limit(limit).all()

def create_link(db: Session, link: LinkCreate, owner_id: int, org_id: int = None):
    code = link.short_code
    if code:
        # Check if code exists
        if get_link_by_code(db, code):
            return None # Indicate collision
    else:
        # Generate a short code if not provided
        code = shortuuid.ShortUUID().random(length=7)
        # Simple collision check for generated codes (rare but possible)
        while get_link_by_code(db, code):
             code = shortuuid.ShortUUID().random(length=7)
    
    # Hash password if provided
    password_hash = None
    if link.password:
        password_hash = pwd_context.hash(link.password)

    db_link = Link(
        short_code=code,
        original_url=str(link.original_url),
        owner_id=owner_id,
        org_id=org_id,
        title=link.title,
        tags=link.tags,
        redirect_type=link.redirect_type or 302,
        is_active=link.is_active,
        require_login=link.require_login,
        allowed_emails=link.allowed_emails,
        password_hash=password_hash,
        expires_at=link.expires_at,
        track_activity=link.track_activity,
        campaign_id=link.campaign_id,
        utm_source=link.utm_source,
        utm_medium=link.utm_medium,
        utm_campaign=link.utm_campaign,
        utm_term=link.utm_term,
        utm_content=link.utm_content,
    )
    db.add(db_link)
    db.commit()
    db.refresh(db_link)
    return db_link

def update_link(db: Session, db_link: Link, link_update: LinkUpdate):
    # If updating short_code, check collision
    if link_update.short_code and link_update.short_code != db_link.short_code:
        if get_link_by_code(db, link_update.short_code):
            return None # Collision

    if link_update.short_code:
        db_link.short_code = link_update.short_code
    
    if link_update.original_url is not None:
        db_link.original_url = str(link_update.original_url)
    
    if link_update.title is not None:
        db_link.title = link_update.title
    db_link.tags = link_update.tags
    if link_update.redirect_type:
        db_link.redirect_type = link_update.redirect_type

    db_link.is_active = link_update.is_active
    db_link.track_activity = link_update.track_activity

    db_link.require_login = link_update.require_login
    db_link.allowed_emails = link_update.allowed_emails
    db_link.expires_at = link_update.expires_at

    # UTM Parameters
    db_link.utm_source = link_update.utm_source
    db_link.utm_medium = link_update.utm_medium
    db_link.utm_campaign = link_update.utm_campaign
    db_link.utm_term = link_update.utm_term
    db_link.utm_content = link_update.utm_content
    
    if link_update.password is not None:
        if link_update.password == "":
            db_link.password_hash = None
        else:
            db_link.password_hash = pwd_context.hash(link_update.password)
    
    db.add(db_link)
    db.commit()
    db.refresh(db_link)
    return db_link

def delete_link(db: Session, db_link: Link):
    db_link.is_deleted = True
    db_link.is_active = False
    db.add(db_link)
    db.commit()

def increment_clicks(db: Session, db_link: Link):
    db.add(db_link)
    db.commit()

def create_links_bulk(db: Session, links: list[LinkCreate], owner_id: int, org_id: int = None):
    created_links = []
    for link_data in links:
        code = link_data.short_code
        if not code:
            code = shortuuid.ShortUUID().random(length=7)
            while get_link_by_code(db, code):
                code = shortuuid.ShortUUID().random(length=7)
        else:
             if get_link_by_code(db, code):
                 continue 
        
        # Hash password if provided
        password_hash = None
        if link_data.password:
             password_hash = pwd_context.hash(link_data.password)

        db_link = Link(
            short_code=code,
            original_url=str(link_data.original_url),
            owner_id=owner_id,
            org_id=org_id,
            title=link_data.title,
            tags=link_data.tags,
            redirect_type=link_data.redirect_type or 302,
            is_active=link_data.is_active,
            require_login=link_data.require_login,
            allowed_emails=link_data.allowed_emails,
            password_hash=password_hash,
            expires_at=link_data.expires_at,
            track_activity=link_data.track_activity,
            campaign_id=link_data.campaign_id,
            utm_source=link_data.utm_source,
            utm_medium=link_data.utm_medium,
            utm_campaign=link_data.utm_campaign,
            utm_term=link_data.utm_term,
            utm_content=link_data.utm_content,
        )
        db.add(db_link)
        created_links.append(db_link)
    
    db.commit()
    for link in created_links:
        db.refresh(link)
    return created_links

from app.schemas.link import LinkBulkUpdate

def update_links_bulk(db: Session, bulk_update: LinkBulkUpdate, owner_id: int = None, org_id: int = None):
    # Fetch all links in the given org that are in the list
    query = db.query(Link).filter(
        Link.id.in_(bulk_update.link_ids),
        Link.is_deleted == False
    )
    if org_id:
        query = query.filter(Link.org_id == org_id)
    if owner_id:
        query = query.filter(Link.owner_id == owner_id)
    links_to_update = query.all()

    hashed_password = None
    if bulk_update.password:
        hashed_password = pwd_context.hash(bulk_update.password)

    updated_count = 0
    for link in links_to_update:
        if bulk_update.campaign_id is not None:
            # If -1 is sent, we clear the campaign
            link.campaign_id = None if bulk_update.campaign_id == -1 else bulk_update.campaign_id
        
        if bulk_update.is_active is not None:
            link.is_active = bulk_update.is_active
            
        if bulk_update.tags is not None:
            link.tags = bulk_update.tags
            
        if bulk_update.require_login is not None:
            link.require_login = bulk_update.require_login
            
        if bulk_update.redirect_type is not None:
            link.redirect_type = bulk_update.redirect_type
            
        if bulk_update.track_activity is not None:
            link.track_activity = bulk_update.track_activity

        if bulk_update.password is not None:
            if bulk_update.password == "":
                link.password_hash = None
            else:
                link.password_hash = hashed_password

        if bulk_update.expires_at is not None:
            link.expires_at = bulk_update.expires_at

        # UTM Parameters
        if bulk_update.utm_source is not None:
            link.utm_source = bulk_update.utm_source or None
        if bulk_update.utm_medium is not None:
            link.utm_medium = bulk_update.utm_medium or None
        if bulk_update.utm_campaign is not None:
            link.utm_campaign = bulk_update.utm_campaign or None
        if bulk_update.utm_term is not None:
            link.utm_term = bulk_update.utm_term or None
        if bulk_update.utm_content is not None:
            link.utm_content = bulk_update.utm_content or None
        
        updated_count += 1
        db.add(link)

    db.commit()
    # We return the updated links to refresh frontend state
    return links_to_update

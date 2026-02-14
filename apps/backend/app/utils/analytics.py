from fastapi import Request
from sqlalchemy.orm import Session
from app.models.analytics import ClickEvent
from app.models.link import Link
from datetime import datetime
import user_agents

# For MVP, we'll use a simple mock or free API for GeoIP if needed.
# Since we want to keep it simple and self-hosted, we might just log IP for now
# or use a local DB if available. for now, let's just log IP.

def capture_click(db: Session, link: Link, request: Request):
    """
    Captures analytics data for a link click.
    """
    if not link.track_activity:
        return

    ip_address = request.client.host
    user_agent_string = request.headers.get("user-agent", "")
    referrer = request.headers.get("referer", "")

    # Parse User Agent
    ua_data = user_agents.parse(user_agent_string)
    
    device_type = "desktop"
    if ua_data.is_mobile:
        device_type = "mobile"
    elif ua_data.is_tablet:
        device_type = "tablet"
        
    os = ua_data.os.family
    browser = ua_data.browser.family

    # TODO: GeoIP Lookup (Future enhancement)
    country_code = None

    event = ClickEvent(
        link_id=link.id,
        ip_address=ip_address,
        user_agent=user_agent_string,
        referrer=referrer,
        device_type=device_type,
        os=os,
        browser=browser,
        country_code=country_code,
        timestamp=datetime.utcnow()
    )
    
    db.add(event)
    db.commit()

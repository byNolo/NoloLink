from fastapi import Request
from sqlalchemy.orm import Session
from app.models.analytics import ClickEvent
from app.models.link import Link
from datetime import datetime
import user_agents

import requests
from urllib.parse import urlparse

def get_country_code(ip: str) -> str:
    """
    Fetches the ISO country code for an IP address using ip-api.com.
    Returns None if lookup fails or IP is local.
    """
    if ip in ("127.0.0.1", "localhost", "::1"):
        return "Local"
    
    try:
        # Free API with 45 requests per minute limit
        response = requests.get(f"http://ip-api.com/json/{ip}?fields=status,countryCode", timeout=2)
        if response.status_code == 200:
            data = response.json()
            if data.get("status") == "success":
                return data.get("countryCode")
    except Exception:
        pass
    return None

def normalize_referrer(referrer_url: str) -> str:
    """
    Extracts the domain from a referrer URL for cleaner statistics.
    """
    if not referrer_url:
        return None
    
    try:
        parsed = urlparse(referrer_url)
        domain = parsed.netloc
        if domain.startswith("www."):
            domain = domain[4:]
        return domain or None
    except Exception:
        return None

def get_client_ip(request: Request) -> str:
    """
    Extracts the real client IP, considering proxies like Cloudflare.
    """
    # Cloudflare specific header
    cf_ip = request.headers.get("cf-connecting-ip")
    if cf_ip:
        return cf_ip
        
    # Standard proxy header
    x_forwarded = request.headers.get("x-forwarded-for")
    if x_forwarded:
        # X-Forwarded-For can be a list of IPs, the first one is the client
        return x_forwarded.split(",")[0].strip()
        
    return request.client.host

def capture_click(db: Session, link: Link, request: Request):
    """
    Captures analytics data for a link click.
    """
    if not link.track_activity:
        return

    ip_address = get_client_ip(request)
    user_agent_string = request.headers.get("user-agent", "")
    raw_referrer = request.headers.get("referer", "")

    # Normalize Referrer
    referrer = normalize_referrer(raw_referrer)

    # Parse User Agent
    ua_data = user_agents.parse(user_agent_string)
    
    device_type = "desktop"
    if ua_data.is_mobile:
        device_type = "mobile"
    elif ua_data.is_tablet:
        device_type = "tablet"
        
    os = ua_data.os.family
    browser = ua_data.browser.family

    # GeoIP Lookup
    country_code = get_country_code(ip_address)

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


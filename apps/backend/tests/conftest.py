"""
Shared test fixtures for NoloLink backend tests.

Provides:
- In-memory SQLite test database (isolated from production)
- FastAPI TestClient with auth dependency overrides
- Pre-created test users (regular + superuser)
- Pre-created test organization with memberships
- Helper factories for links and campaigns
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

from app.db.base import Base
from app.db.session import get_db
from app.api.deps import (
    get_current_user,
    get_current_active_user,
    get_current_active_superuser,
    get_current_active_user_optional,
    get_current_org,
    OrgContext,
)
from app.models.user import User
from app.models.link import Link
from app.models.campaign import Campaign
from app.models.analytics import ClickEvent
from app.models.audit import AuditLog
from app.models.organization import Organization, OrgMembership, OrgInvite
from main import app

# ---------------------------------------------------------------------------
# Database fixtures
# ---------------------------------------------------------------------------

SQLALCHEMY_TEST_URL = "sqlite:///file::memory:?cache=shared"

engine = create_engine(SQLALCHEMY_TEST_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def create_tables():
    """Create all tables once for the entire test session."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def db():
    """Provide a clean database session for each test, rolled back afterwards."""
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


# ---------------------------------------------------------------------------
# Organization fixtures
# ---------------------------------------------------------------------------

@pytest.fixture()
def test_org(db: Session) -> Organization:
    """Create a test organization."""
    org = Organization(name="Test Org", slug="test-org", plan="free", is_active=True)
    db.add(org)
    db.commit()
    db.refresh(org)
    return org


# ---------------------------------------------------------------------------
# User fixtures
# ---------------------------------------------------------------------------

@pytest.fixture()
def test_user(db: Session, test_org: Organization) -> User:
    """Create a regular approved user for testing."""
    user = User(
        keyn_id="test-keyn-001",
        email="testuser@example.com",
        username="testuser",
        full_name="Test User",
        is_active=True,
        is_superuser=False,
        is_approved=True,
        request_status="approved",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    # Add membership
    membership = OrgMembership(user_id=user.id, org_id=test_org.id, role="member")
    db.add(membership)
    db.commit()
    return user


@pytest.fixture()
def test_superuser(db: Session, test_org: Organization) -> User:
    """Create a superuser for testing admin endpoints."""
    user = User(
        keyn_id="test-keyn-admin",
        email="admin@example.com",
        username="admin",
        full_name="Admin User",
        is_active=True,
        is_superuser=True,
        is_approved=True,
        request_status="approved",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    # Add as org owner
    membership = OrgMembership(user_id=user.id, org_id=test_org.id, role="owner")
    db.add(membership)
    db.commit()
    return user


@pytest.fixture()
def other_user(db: Session, test_org: Organization) -> User:
    """Create a second regular user for ownership isolation tests."""
    user = User(
        keyn_id="test-keyn-002",
        email="otheruser@example.com",
        username="otheruser",
        full_name="Other User",
        is_active=True,
        is_superuser=False,
        is_approved=True,
        request_status="approved",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    membership = OrgMembership(user_id=user.id, org_id=test_org.id, role="member")
    db.add(membership)
    db.commit()
    return user


@pytest.fixture()
def unapproved_user(db: Session, test_org: Organization) -> User:
    """Create an unapproved user for access-request tests."""
    user = User(
        keyn_id="test-keyn-unapproved",
        email="unapproved@example.com",
        username="unapproved",
        full_name="Unapproved User",
        is_active=True,
        is_superuser=False,
        is_approved=False,
        request_status="none",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    membership = OrgMembership(user_id=user.id, org_id=test_org.id, role="member")
    db.add(membership)
    db.commit()
    return user


# ---------------------------------------------------------------------------
# Client fixtures (with auth dependency overrides)
# ---------------------------------------------------------------------------

def _make_client(db: Session, user: User, org: Organization) -> TestClient:
    """Build a TestClient with dependency overrides for the given user and org."""

    # Get membership for the org context
    membership = db.query(OrgMembership).filter(
        OrgMembership.user_id == user.id,
        OrgMembership.org_id == org.id
    ).first()
    role = membership.role if membership else ("owner" if user.is_superuser else "member")

    org_ctx = OrgContext(org=org, role=role, membership=membership)

    def _override_get_db():
        yield db

    def _override_get_current_user():
        return user

    def _override_get_current_active_user():
        return user

    def _override_get_current_active_superuser():
        if not user.is_superuser:
            from fastapi import HTTPException
            raise HTTPException(status_code=400, detail="The user doesn't have enough privileges")
        return user

    def _override_get_current_active_user_optional():
        return user

    def _override_get_current_org():
        return org_ctx

    app.dependency_overrides[get_db] = _override_get_db
    app.dependency_overrides[get_current_user] = _override_get_current_user
    app.dependency_overrides[get_current_active_user] = _override_get_current_active_user
    app.dependency_overrides[get_current_active_superuser] = _override_get_current_active_superuser
    app.dependency_overrides[get_current_active_user_optional] = _override_get_current_active_user_optional
    app.dependency_overrides[get_current_org] = _override_get_current_org

    client = TestClient(app)
    return client


@pytest.fixture()
def client(db: Session, test_user: User, test_org: Organization) -> TestClient:
    """TestClient authenticated as a regular approved user."""
    c = _make_client(db, test_user, test_org)
    yield c
    app.dependency_overrides.clear()


@pytest.fixture()
def admin_client(db: Session, test_superuser: User, test_org: Organization) -> TestClient:
    """TestClient authenticated as a superuser."""
    c = _make_client(db, test_superuser, test_org)
    yield c
    app.dependency_overrides.clear()


@pytest.fixture()
def other_client(db: Session, other_user: User, test_org: Organization) -> TestClient:
    """TestClient authenticated as another regular user."""
    c = _make_client(db, other_user, test_org)
    yield c
    app.dependency_overrides.clear()


@pytest.fixture()
def anon_client(db: Session) -> TestClient:
    """TestClient with no authenticated user (for optional auth endpoints)."""
    def _override_get_db():
        yield db

    def _override_no_user():
        return None

    app.dependency_overrides[get_db] = _override_get_db
    app.dependency_overrides[get_current_active_user_optional] = _override_no_user

    c = TestClient(app)
    yield c
    app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# Helper factories
# ---------------------------------------------------------------------------

def create_test_link(
    db: Session,
    owner_id: int,
    short_code: str = "testlink",
    original_url: str = "https://example.com",
    is_active: bool = True,
    password_hash: str = None,
    require_login: bool = False,
    allowed_emails: str = None,
    expires_at=None,
    campaign_id: int = None,
    tags: str = None,
    title: str = None,
    track_activity: bool = True,
    org_id: int = None,
    utm_source: str = None,
    utm_medium: str = None,
    utm_campaign: str = None,
    utm_term: str = None,
    utm_content: str = None,
) -> Link:
    """Directly insert a Link into the test DB."""
    # Auto-detect org_id from first org if not specified
    if org_id is None:
        first_org = db.query(Organization).first()
        if first_org:
            org_id = first_org.id
    link = Link(
        short_code=short_code,
        original_url=original_url,
        owner_id=owner_id,
        org_id=org_id,
        is_active=is_active,
        password_hash=password_hash,
        require_login=require_login,
        allowed_emails=allowed_emails,
        expires_at=expires_at,
        campaign_id=campaign_id,
        tags=tags,
        title=title,
        track_activity=track_activity,
        utm_source=utm_source,
        utm_medium=utm_medium,
        utm_campaign=utm_campaign,
        utm_term=utm_term,
        utm_content=utm_content,
    )
    db.add(link)
    db.commit()
    db.refresh(link)
    return link


def create_test_campaign(
    db: Session,
    owner_id: int,
    name: str = "Test Campaign",
    color: str = "#FF5733",
    org_id: int = None,
) -> Campaign:
    """Directly insert a Campaign into the test DB."""
    # Auto-detect org_id from first org if not specified
    if org_id is None:
        first_org = db.query(Organization).first()
        if first_org:
            org_id = first_org.id
    campaign = Campaign(name=name, color=color, owner_id=owner_id, org_id=org_id)
    db.add(campaign)
    db.commit()
    db.refresh(campaign)
    return campaign


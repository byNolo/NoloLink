# Backend Testing Guide

## Overview

The backend test suite uses **pytest** with **FastAPI's `TestClient`** and an **in-memory SQLite database** for full isolation. All tests run without any external services (no KeyN, no real DB).

| Module | Tests | Coverage |
|--------|-------|----------|
| `test_links.py` | 18 | Link CRUD, bulk ops, stats, search, ownership isolation |
| `test_campaigns.py` | 8 | Campaign CRUD, ownership isolation |
| `test_redirect.py` | 6 | Short code resolution, protections (inactive, expired, password, login) |
| `test_verify.py` | 7 | Password verification, login verification, allowlist, dual protection |
| `test_users.py` | 8 | Profile, access requests, admin approve/reject |
| `test_export.py` | 10 | CSV export, CSV import, validation, campaign resolution |
| `test_audit.py` | 19 | Audit logging on CRUD, filtering, user isolation |

## Running Tests

```bash
# From project root
make test-backend

# Or directly
cd apps/backend && poetry run pytest tests/ -v --tb=short
```

## How It Works

### Test Database

Tests use an **in-memory SQLite database**, created fresh per session. Each individual test runs inside a **rolled-back transaction**, so tests never pollute each other:

```
Session start → create_tables()
  Test 1 → BEGIN → run test → ROLLBACK
  Test 2 → BEGIN → run test → ROLLBACK
  ...
Session end → drop_tables()
```

### Authentication Mocking

Real KeyN OAuth is bypassed. `conftest.py` provides dependency overrides that inject fake users directly:

- `get_current_user` → returns the test user
- `get_current_active_user` → same
- `get_current_active_superuser` → checks `is_superuser`, raises 400 if not
- `get_current_active_user_optional` → returns user or `None`

---

## Writing a New Test

### 1. Create the file

Create `tests/test_<feature>.py`:

```python
import pytest
from conftest import create_test_link  # use helpers as needed

class TestMyFeature:
    """Tests for the my-feature endpoint."""

    def test_basic_case(self, client, db, test_user):
        """Test the happy path."""
        response = client.get("/api/my-endpoint")
        assert response.status_code == 200

    def test_unauthorized(self, other_client, db, test_user, other_user):
        """Test that another user can't access this resource."""
        # Create data owned by test_user
        # Then access with other_client → expect 404 or 403
```

### 2. Use the right fixtures

| Fixture | What it gives you |
|---------|-------------------|
| `client` | `TestClient` authenticated as `testuser` (regular, approved) |
| `admin_client` | `TestClient` authenticated as `admin` (superuser) |
| `other_client` | `TestClient` authenticated as `otheruser` (for ownership tests) |
| `anon_client` | `TestClient` with no authenticated user |
| `db` | SQLAlchemy `Session` connected to the test database |
| `test_user` | Regular `User` object (owner_id for creating test data) |
| `test_superuser` | Admin `User` object |
| `other_user` | Second regular `User` object |
| `unapproved_user` | User with `is_approved=False` |

### 3. Use helper factories

Instead of making API calls to create test data, insert directly:

```python
from conftest import create_test_link, create_test_campaign

def test_something(self, client, db, test_user):
    # Create a link directly in the DB
    link = create_test_link(db, owner_id=test_user.id, short_code="mylink")
    
    # Create a campaign
    camp = create_test_campaign(db, owner_id=test_user.id, name="TestCampaign")
    
    # Now test an endpoint that reads this data
    response = client.get(f"/api/links/{link.short_code}/stats")
    assert response.status_code == 200
```

`create_test_link` accepts these parameters:
- `short_code`, `original_url`, `is_active`, `password_hash`, `require_login`
- `allowed_emails`, `expires_at`, `campaign_id`, `tags`, `title`, `track_activity`

### 4. Testing ownership isolation

When testing that users can't access each other's data, **don't use `client` and `other_client` fixtures together** (they share `dependency_overrides`). Instead, create an inline client:

```python
def test_ownership_isolation(self, client, db, test_user, other_user):
    # Create data owned by test_user
    link = create_test_link(db, owner_id=test_user.id, short_code="owned")
    
    # Build a separate client for other_user inline
    from conftest import _make_client
    from main import app
    
    other = _make_client(db, other_user)
    response = other.get(f"/api/links/{link.id}")
    assert response.status_code == 404  # ownership enforced
    app.dependency_overrides.clear()
```

### 5. Run and verify

```bash
# Run just your new test file
poetry run pytest tests/test_myfeature.py -v

# Run a single test
poetry run pytest tests/test_myfeature.py::TestMyFeature::test_basic_case -v
```

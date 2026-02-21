# NoloLink Backend

FastAPI-powered link management service with multi-tenancy and advanced analytics.

## Tech Stack
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/)
- **Database**: SQLite (SQLAlchemy ORM)
- **Migrations**: [Alembic](https://alembic.sqlalchemy.org/)
- **Authentication**: KeyN OAuth 2.0
- **Validation**: Pydantic V2

## Getting Started

### Prerequisites
- Python 3.10+
- [Poetry](https://python-poetry.org/)

### Installation
```bash
poetry install
```

### Configuration
Create a `.env` file based on `.env.example`:
```bash
KEYN_CLIENT_ID=your_id
KEYN_CLIENT_SECRET=your_secret
FRONTEND_URL=http://localhost:3070
SERVER_HOST=http://localhost:3071
```

### Running Locally
```bash
poetry run uvicorn main:app --reload --port 3071
```

## Key Modules
- `app/api/endpoints/`: REST API routes (Links, Orgs, Users, Campaigns, etc.)
- `app/crud/`: Database abstraction layer.
- `app/models/`: SQLAlchemy database models.
- `app/schemas/`: Pydantic data validation schemas.
- `app/core/`: Configuration and security logic.

## Testing
We use `pytest` for comprehensive backend testing.
```bash
# Run all tests
poetry run pytest

# Run with output
poetry run pytest -s

# Run specific suite
poetry run pytest tests/test_org_policies.py
```

## Recent Enhancements
- **Organization Policies**: Granular control over link privacy and member permissions.
- **Ownership Transfer**: Logic for demoting/promoting owners within organizations.
- **Improved Link Schemas**: Support for partial updates and robust validation.
- **Advanced Audit Logs**: Tracking administrative and organization-level changes.

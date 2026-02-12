# NoloLink Development Setup

This guide will help you set up the NoloLink monorepo for local development.

## Prerequisites

*   Python 3.11+
*   Node.js 20+
*   Poetry (will be installed inside venv if running via scripts, but good to have)

## Quick Start

We use a `Makefile` to simplify common tasks.

1.  **Install Dependencies**

    ```bash
    # Install Backend (creates venv and installs dependencies)
    make backend-install

    # Install Frontend (npm install)
    make frontend-install
    ```

2.  **Environment Setup**

    *   **Backend**: Copy `.env.example` to `.env` in `apps/backend/`.
        ```bash
        cp apps/backend/.env.example apps/backend/.env
        ```
        *   Edit `.env` and add your KeyN Client ID and Secret.
        *   Ensure `KEYN_REDIRECT_URI` is `http://localhost:3071/auth/callback`.

3.  **Run Development Servers**

    You will need two terminal windows:

    *   **Terminal 1 (Backend)**:
        ```bash
        make run-backend
        # Runs on http://localhost:3071
        ```

    *   **Terminal 2 (Frontend)**:
        ```bash
        make run-frontend
        # Runs on http://localhost:3070
        ```

## Database Migrations

The backend uses SQLite with Alembic for migrations.

To apply migrations (already done during setup usually, but good to know):

```bash
cd apps/backend
./venv/bin/poetry run alembic upgrade head
```

To create a new migration after modifying models:

```bash
cd apps/backend
./venv/bin/poetry run alembic revision --autogenerate -m "Description of change"
```

## Project Structure

*   `apps/backend`: FastAPI application.
    *   `app/models`: SQLAlchemy models.
    *   `app/api`: API routes.
*   `apps/frontend`: React + Vite application.
    *   `src/components`: React components.
    *   `src/context`: React Contexts (Auth).

## Features Implemented (MVP)

*   [x] KeyN OAuth Authentication
*   [x] Link Creation (Shortener)
*   [x] Link Redirection (`/<code>`)
*   [x] Dashboard with Hit Counters

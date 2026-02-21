<div align="center">

# NoloLink - byNolo

**Modern, self-hosted URL shortening platform with granular access control and analytics.**  
Shorten · Track · Secure · Manage · Analyze

[![Python](https://img.shields.io/badge/Python-3.11%2B-3776AB?logo=python&logoColor=white)](https://python.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://reactjs.org)
![Status](https://img.shields.io/badge/Status-Active-success)
![byNolo](https://img.shields.io/badge/byNolo-Studios-34d399?labelColor=0b0f12)

<sub>Designed, secured &amp; deployed · <strong>NoloLink - byNolo</strong></sub>

</div>

---

## Key Highlights

| Capability | What You Get | Notes |
|------------|--------------|-------|
| **Link Management** | Create, edit, and delete short URLs | Custom aliases supported |
| **Organization Support** | Multi-tenancy with granular roles | Owner, Admin, Member roles |
| **Secure Authentication** | Integrated OAuth 2.0 with KeyN | seamless identity management |
| **Advanced Analytics** | Deep insights on audience & traffic | Countries, Referrers, Devices |
| **Smart Stats Access** | Stats visualization via `/code+` | Respects org privacy settings |
| **Superuser Tools** | Global admin dashboard (/admin) | Manage all orgs and users |
| **QR Code Integration** | Instant QR generation for sharing | Downloadable & scannable |
| **Responsive UI** | Modern, dark-themed dashboard | Built with React + Tailwind CSS |

---

## Table of Contents
1. [Features](#features)
2. [Quick Start](#quick-start)
3. [Architecture](#architecture)
4. [Configuration](#configuration)
5. [Testing](#testing)
6. [Development](#development)
7. [License](#license)

---

## Features

Modern URL shortening with security and multi-tenancy at its core:
*   **Secure Authentication** - Seamless integration with KeyN OAuth for user identity.
*   **Organization Management** - Robust multi-tenancy support:
    *   **Workspaces**: Group links and members into distinct organizations.
    *   **Role-Based Access**: Owner, Admin, and Member roles with granular permissions.
    *   **Ownership Transfer**: Securely hand off organization ownership to other members.
    *   **Policies**: Organization-level settings to control link privacy and member permissions (edit/delete).
*   **Superuser Control** - Global administrative dashboard (`/admin`) to manage all organizations, users, and access requests.
*   **Advanced Link Management** - Create, edit, delete, and manage custom short links.
*   **Campaign Management** - Organize links into campaigns for better tracking and management.
*   **Bulk Operations** - Efficiently create and edit multiple links simultaneously, now including bulk expiration date settings.
*   **Enhanced Link Control** - Granular control with:
    *   **Expiration Dates**: Set links to auto-expire (supports local time on dashboard).
    *   **Custom Redirects**: Support for 301, 302, 307, and 308 status codes.
    *   **Tags**: Categorize links for easy filtering.
*   **Advanced Analytics** - Comprehensive insights:
    *   **Traffic Sources**: Top referrers (including direct traffic).
    *   **Geographic Data**: Top countries by visitor IP.
    *   **Device Breakdown**: Stats by device type (Mobile, Desktop, Tablet).
    *   **UTM Builder**: Append tracking parameters (`utm_source`, `utm_medium`, etc.) to URLs before shortening.
    *   **Privacy Control**: Per-link toggle to enable/disable detailed tracking.
*   **QR Code Integration** - Auto-generated QR codes for instant mobile sharing.
*   **Smart Stats Access** - Append `+` to any short link to view its stats (e.g., `s.bynolo.ca/code+`).
    *   **Security Feature**: Respects organization privacy settings. Unauthorized users are auto-redirected to the link destination.
*   **Legal & Compliance** - Built-in Terms of Service and Privacy Policy pages.
*   **Responsive Experience** - Sleek, dark-themed UI built with React and Tailwind CSS.

---

## Quick Start

### Prerequisites
*   Python 3.10+
*   Node.js 18+
*   Make (optional)

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/byNolo/NoloLink.git
    cd NoloLink
    ```

2.  **Install Backend**
    ```bash
    cd apps/backend
    poetry install
    ```

3.  **Install Frontend**
    ```bash
    cd ../frontend
    npm install
    ```

### Running the Application

Use the provided Makefile for convenience:

```bash
make run-all
```

Or run services individually:
*   **Backend**: `cd apps/backend && poetry run uvicorn main:app --reload --port 3071`
*   **Frontend**: `cd apps/frontend && npm run dev -- --port 3070`

---

## Architecture

```
┌──────────────┐     ┌────────────────┐     ┌────────────────┐
│  React App   │ ─▶ │  FastAPI API   │ ─▶  │  SQLite DB     │
│  (Frontend)  │     │  (Backend)     │     │  (Storage)     │
└──────────────┘     └────────────────┘     └────────────────┘
       │                      │
       ▼                      ▼
┌───────────────┐     ┌────────────────┐
│  Stats / QR   │     │   KeyN OAuth   │
│ Visualization │     │   Provider     │
└───────────────┘     └────────────────┘
```

### Tech Stack
*   **Backend**: FastAPI, SQLAlchemy, Alembic, Python 3.11+
*   **Frontend**: React, TypeScript, Tailwind CSS, Vite
*   **Auth**: OAuth2 (KeyN Integration)

---

## Configuration

### Backend Environment (`apps/backend/.env`)
```bash
KEYN_CLIENT_ID=your_client_id
KEYN_CLIENT_SECRET=your_client_secret
FRONTEND_URL=http://localhost:3070
SERVER_HOST=http://localhost:3071
```

### Frontend Environment (`apps/frontend/.env`)
```bash
VITE_API_URL=http://localhost:3071
VITE_SHORT_LINK_DOMAIN=localhost:3071
```

---

## Testing

NoloLink has a comprehensive test suite covering both backend and frontend.

### Quick Commands

```bash
make test            # Run all tests (backend + frontend)
make test-backend    # Backend only — 97 tests (pytest)
make test-frontend   # Frontend only — 49 tests (Vitest)
```

### Test Coverage

| Suite | Framework | Tests | Areas Covered |
|-------|-----------|-------|---------------|
| **Backend** | pytest + TestClient | 97 | Links, Campaigns, Redirect, Verify, Users, Export/Import, Audit, UTM, Org Policies |
| **Frontend** | Vitest + React Testing Library | 49 | Routing, Auth, API layer, Pages, Components, UTM UI, Stats |

### Writing New Tests

Each test suite has a detailed guide:
- **Backend**: [`apps/backend/tests/README.md`](apps/backend/tests/README.md) — fixtures, helpers, patterns
- **Frontend**: [`apps/frontend/src/test/README.md`](apps/frontend/src/test/README.md) — providers, mocking, interactions

---

## Development

### Directory Structure
```
nololink/
├── apps/
│   ├── backend/
│   │   ├── app/            # FastAPI Application & Migrations
│   │   └── tests/          # Backend test suite (pytest)
│   └── frontend/
│       └── src/
│           ├── components/  # React components
│           ├── pages/       # Page components
│           ├── lib/         # API layer
│           ├── context/     # Auth context
│           └── test/        # Frontend test suite (Vitest)
├── Docs/                    # Project Documentation
└── Makefile                 # Orchestration & testing commands
```

---

<p align="center"><sub>Written, designed, deployed -<strong> byNolo</strong>.</sub></p>

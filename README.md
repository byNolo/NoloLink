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
| **Secure Authentication** | Integrated OAuth 2.0 with KeyN | seamless identity management |
| **Advanced Analytics** | Deep insights on audience & traffic | Countries, Referrers, Devices |
| **Smart Stats Access** | Public stats via `code+` (if owner) | Unauthorized users redirected |
| **QR Code Integration** | Instant QR generation for sharing | Downloadable & scannable |
| **Granular Access** | Role-based permissions & approval workflow | Admin controls user onboarding |
| **Responsive UI** | Modern, dark-themed dashboard | Built with React + Tailwind CSS |
| **Deployment Ready** | Container-friendly architecture | Easy to self-host |

---

## Table of Contents
1. [Features](#features)
2. [Quick Start](#quick-start)
3. [Architecture](#architecture)
4. [Configuration](#configuration)
5. [Development](#development)
6. [License](#license)

---

## Features

Modern URL shortening with security at its core:
*   **Secure Authentication** - Seamless integration with KeyN OAuth for user identity.
*   **Advanced Link Management** - Create, edit, delete, and manage custom short links.
*   **Campaign Management** - Organize links into campaigns for better tracking and management.
*   **Bulk Operations** - Efficiently create and edit multiple links simultaneously.
*   **Enhanced Link Control** - Granular control with:
    *   **Expiration Dates**: Set links to auto-expire.
    *   **Custom Redirects**: Support for 301, 302, 307, and 308 status codes.
    *   **Tags**: Categorize links for easy filtering.
*   **Advanced Analytics** - Comprehensive insights:
    *   **Traffic Sources**: Top referrers (including direct traffic).
    *   **Geographic Data**: Top countries by visitor IP.
    *   **Device Breakdown**: Stats by device type (Mobile, Desktop, Tablet).
    *   *Privacy Control*: Per-link toggle to enable/disable detailed tracking.
*   **QR Code Integration** - Auto-generated QR codes for instant mobile sharing.
*   **Smart Stats Access** - Append `+` to any short link to view its stats (e.g., `s.bynolo.ca/code+`).
    *   *Security Feature*: Only the Link Owner can view stats. Unauthorized users are auto-redirected to the link destination.
*   **Legal & Compliance** - Built-in Terms of Service and Privacy Policy pages.
*   **Granular Access Control** - Role-based permissions with an Admin approval system for new users.
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

## Development

### Directory Structure
```
nololink/
├── apps/
│   ├── backend/        # FastAPI Application & Migrations
│   └── frontend/       # React Application & UI Components
├── Docs/               # Project Documentation
└── Makefile            # Orchestration commands
```

---

<p align="center"><sub>Written, designed, deployed -<strong> byNolo</strong>.</sub></p>

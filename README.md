# NoloLink

NoloLink is a modern, self-hosted URL shortening service integrated with KeyN authentication. It provides a robust platform for creating, managing, and tracking shortened links with granular access control.

## Features

*   **Secure Authentication**: Integrated with KeyN OAuth for secure user management.
*   **Link Management**: Create, edit, delete, and track clicks for shortened URLs.
*   **Custom Aliases**: Support for custom short codes (e.g., `s.bynolo.ca/custom-name`).
*   **Access Control**: Role-based access control with an approval workflow for new users.
*   **Admin Dashboard**: Dedicated panel for administrators to manage user access requests.
*   **Responsive UI**: A modern, dark-themed interface built with React and Tailwind CSS.

## Technology Stack

### Backend
*   **Framework**: FastAPI (Python)
*   **Database**: SQLite (with SQLAlchemy ORM)
*   **Migrations**: Alembic
*   **Authentication**: OAuth2 with KeyN

### Frontend
*   **Framework**: React (Vite)
*   **Language**: TypeScript
*   **Styling**: Tailwind CSS
*   **State Management**: React Context API

## Getting Started

### Prerequisites
*   Python 3.10 or higher
*   Node.js 18 or higher
*   Make (optional, for convenience commands)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/nololink.git
    cd nololink
    ```

2.  **Install Backend Dependencies:**
    ```bash
    cd apps/backend
    poetry install
    ```

3.  **Install Frontend Dependencies:**
    ```bash
    cd ../frontend
    npm install
    ```

### Configuration

1.  **Backend Environment:**
    Copy `apps/backend/.env.example` to `apps/backend/.env` and update the values:
    ```bash
    cp apps/backend/.env.example apps/backend/.env
    ```
    Required variables: `KEYN_CLIENT_ID`, `KEYN_CLIENT_SECRET`, `FRONTEND_URL`, `SERVER_HOST`.

2.  **Frontend Environment:**
    Create `apps/frontend/.env` with the following variables:
    ```env
    VITE_API_URL=http://localhost:3071
    VITE_SHORT_LINK_DOMAIN=localhost:3071
    ```

### Running the Application

You can start both services simultaneously using the provided Makefile:

```bash
make run-all
```

Alternatively, run them separately:

*   **Backend**: `cd apps/backend && poetry run uvicorn main:app --reload --port 3071`
*   **Frontend**: `cd apps/frontend && npm run dev -- --port 3070`

## Project Structure

```
nololink/
├── apps/
│   ├── backend/        # FastAPI Application
│   └── frontend/       # React Application
├── Docs/               # Documentation
└── Makefile            # Development commands
```

## Contributing

Contributions are welcome. Please ensure that your code adheres to the existing style and that all tests pass before submitting a pull request.

## License

[MIT License](LICENSE) (or specify your license here)

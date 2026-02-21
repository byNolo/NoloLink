# NoloLink Frontend

Modern, dark-themed dashboard for NoloLink, built with React, TypeScript, and Tailwind CSS.

## Tech Stack
- **Framework**: [React 18](https://reactjs.org/) + [Vite](https://vitejs.dev/)
- **Language**: TypeScript
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Charts**: [Recharts](https://recharts.org/)
- **Routing**: React Router 6

## Getting Started

### Prerequisites
- Node.js 18+

### Installation
```bash
npm install
```

### Configuration
Create a `.env` file based on `.env.example`:
```bash
VITE_API_URL=http://localhost:3071
VITE_SHORT_LINK_DOMAIN=localhost:3071
```

### Running Locally
```bash
npm run dev
```

## Features
- **Modern Dashboard**: High-performance link management UI.
- **Organization Switcher**: Seamless multi-tenancy support in the navbar.
- **Policies Management**: Owner-only tab for configuring workspace privacy and member permissions.
- **Superuser Admin**: Global dashboard for managing organizations and approving accounts.
- **Analytics Visualization**: Interactive charts for clicks, geography, referrers, and devices.
- **Smart Forms**: Advanced validation with Pydantic-aware error handling and local time conversion.

## Testing
We use [Vitest](https://vitest.dev/) and [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) for frontend tests.
```bash
# Run all tests
npm test

# Run a specific test
npm test -- src/test/StatsPage.test.tsx
```

## Development
- `src/components/`: Reusable UI elements (Navbar, Charts, etc.)
- `src/pages/`: Main application pages.
- `src/lib/api.ts`: Centralized API client logic.
- `src/context/`: Auth and application-wide state.

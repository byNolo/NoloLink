# Frontend Testing Guide

## Overview

The frontend test suite uses **Vitest** (Vite's native test runner) with **React Testing Library** and **jsdom** for DOM simulation. Tests run entirely in Node.js — no browser needed.

| Module | Tests | Coverage |
|--------|-------|----------|
| `App.test.tsx` | 1 | Smoke test — app renders without crashing |
| `AuthContext.test.tsx` | 6 | Auth state, login/logout, token persistence, error handling |
| `api.test.ts` | 15 | All API functions — URLs, headers, methods, error handling |
| `pages.test.tsx` | 10 | NotFound, ErrorPage (4 variants), Unauthorized, ServerError, ToS, Privacy |
| `Navbar.test.tsx` | 6 | Logo, username, superuser badge, admin panel, dashboard link |
| `VerifyLinkPage.test.tsx` | 8 | Password form, login button, dual protection, error display |
| `StatsPage.test.tsx` | 3 | Loading state, stats rendering, error state |

## Running Tests

```bash
# From project root
make test-frontend

# Or directly
cd apps/frontend && npx vitest run

# Watch mode (re-runs on file changes)
cd apps/frontend && npx vitest
```

## Project Setup

Tests live in `src/test/` and are configured in `vite.config.ts`:

```
src/test/
├── setup.ts               ← jest-dom matchers + env mocking
├── App.test.tsx
├── AuthContext.test.tsx
├── api.test.ts
├── pages.test.tsx
├── Navbar.test.tsx
├── VerifyLinkPage.test.tsx
└── StatsPage.test.tsx
```

Key config (in `vite.config.ts`):
- **Environment**: `jsdom` (simulates a browser DOM)
- **Globals**: `true` (no need to import `describe`, `it`, `expect`)
- **Setup file**: `src/test/setup.ts` (imports `@testing-library/jest-dom`)
- **Include**: Only `src/test/**/*.test.{ts,tsx}`

---

## Writing a New Test

### 1. Create the file

Create `src/test/MyComponent.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MyComponent from '../components/MyComponent';

describe('MyComponent', () => {
  it('renders the title', () => {
    render(
      <MemoryRouter>
        <MyComponent />
      </MemoryRouter>
    );
    expect(screen.getByText('Expected Title')).toBeInTheDocument();
  });
});
```

### 2. Mock `fetch` for API calls

Most components make API calls. Mock `fetch` globally:

```tsx
const mockFetch = vi.fn();
globalThis.fetch = mockFetch as any;

beforeEach(() => {
  vi.clearAllMocks();
});

it('loads data', async () => {
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => ({ id: 1, name: 'Test' }),
  });

  render(<MyComponent />);
  expect(await screen.findByText('Test')).toBeInTheDocument();
});
```

### 3. Wrap with required providers

Components that use `useAuth()` need `AuthProvider`. Components using `Link` or `useLocation` need a Router:

```tsx
import { AuthProvider } from '../context/AuthContext';

// For components using useAuth + react-router
render(
  <AuthProvider>
    <MemoryRouter initialEntries={['/some/path']}>
      <MyComponent />
    </MemoryRouter>
  </AuthProvider>
);
```

> **Tip**: If your component uses `AuthProvider`, you need a `fetch` mock since `AuthProvider` calls `/api/users/me` on mount.

### 4. Test with route params

For page components that read URL params with `useParams`:

```tsx
import { Routes, Route } from 'react-router-dom';

render(
  <AuthProvider>
    <MemoryRouter initialEntries={['/stats/abc123']}>
      <Routes>
        <Route path="/stats/:shortCode" element={<StatsPage />} />
      </Routes>
    </MemoryRouter>
  </AuthProvider>
);
```

### 5. Simulate user interaction

Use `@testing-library/user-event` for clicks, typing, etc.:

```tsx
import userEvent from '@testing-library/user-event';

it('submits the form', async () => {
  render(<MyForm />);
  
  const user = userEvent.setup();
  await user.type(screen.getByPlaceholderText('Enter name'), 'Test');
  await user.click(screen.getByText('Submit'));

  expect(await screen.findByText('Success')).toBeInTheDocument();
});
```

### 6. Testing API layer functions

For testing functions from `lib/api.ts` directly (no component rendering):

```tsx
import { myApiFunction } from '../lib/api';

it('calls the correct endpoint', async () => {
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => ({ result: 'ok' }),
  });

  const result = await myApiFunction('token-123');
  
  const [url, opts] = mockFetch.mock.calls[0];
  expect(url).toContain('/api/my-endpoint');
  expect(opts.headers.Authorization).toBe('Bearer token-123');
});
```

### 7. Run your test

```bash
# Run just your test
npx vitest run src/test/MyComponent.test.tsx

# Run in watch mode
npx vitest src/test/MyComponent.test.tsx
```

---

## Common Patterns

| Pattern | How |
|---------|-----|
| Wait for async content | `await screen.findByText('...')` |
| Assert element exists | `expect(screen.getByText('...')).toBeInTheDocument()` |
| Assert element absent | `expect(screen.queryByText('...')).not.toBeInTheDocument()` |
| Check link href | `expect(el.closest('a')).toHaveAttribute('href', '/path')` |
| Mock fetch sequence | `mockFetch.mockResolvedValueOnce({...}).mockResolvedValueOnce({...})` |
| Clear mocks between tests | `beforeEach(() => { vi.clearAllMocks(); localStorage.clear(); })` |

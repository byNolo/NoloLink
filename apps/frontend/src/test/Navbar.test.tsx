import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import Navbar from '../components/Navbar';

// Mock fetch for AuthProvider
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

function renderNavbar(opts: { isSuperuser?: boolean; path?: string } = {}) {
    const user = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        is_active: true,
        is_superuser: opts.isSuperuser || false,
        is_approved: true,
        request_status: 'approved',
        full_name: 'Test User',
    };

    // Store token and user in localStorage so AuthProvider picks them up
    localStorage.setItem('token', 'test-token');
    localStorage.setItem('user', JSON.stringify(user));
    mockFetch.mockResolvedValue({
        ok: true,
        json: async () => user,
    });

    return render(
        <AuthProvider>
            <MemoryRouter initialEntries={[opts.path || '/']}>
                <Navbar />
            </MemoryRouter>
        </AuthProvider>
    );
}

describe('Navbar', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    it('renders the NoloLink logo and text', async () => {
        renderNavbar();
        expect(screen.getByText('NoloLink')).toBeInTheDocument();
        expect(screen.getByAltText('NoloLink Logo')).toBeInTheDocument();
    });

    it('displays the username when logged in', async () => {
        renderNavbar();
        const username = await screen.findByText('testuser');
        expect(username).toBeInTheDocument();
    });

    it('shows superuser badge', async () => {
        renderNavbar({ isSuperuser: true });
        const badge = await screen.findByText('Superuser');
        expect(badge).toBeInTheDocument();
    });

    it('shows Admin link for superusers', async () => {
        renderNavbar({ isSuperuser: true });
        const link = await screen.findByText('Admin');
        expect(link).toBeInTheDocument();
    });

    it('does not show superuser badge for regular users', async () => {
        renderNavbar({ isSuperuser: false });
        await screen.findByText('testuser');
        expect(screen.queryByText('Superuser')).not.toBeInTheDocument();
    });

    it('shows Dashboard link on non-dashboard pages', async () => {
        renderNavbar({ path: '/stats/abc' });
        await screen.findByText('testuser');
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
});

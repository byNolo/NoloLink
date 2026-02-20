import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../context/AuthContext';

// Mock fetch globally
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

// Helper component to display auth state
function AuthDisplay() {
    const { user, isAuthenticated, isLoading, token } = useAuth();
    return (
        <div>
            <span data-testid="loading">{String(isLoading)}</span>
            <span data-testid="authenticated">{String(isAuthenticated)}</span>
            <span data-testid="username">{user?.username || 'none'}</span>
            <span data-testid="token">{token || 'none'}</span>
        </div>
    );
}

// Helper component to test login/logout
function AuthActions() {
    const { login, logout, isAuthenticated } = useAuth();
    return (
        <div>
            <span data-testid="authenticated">{String(isAuthenticated)}</span>
            <button data-testid="login" onClick={() => login()}>Login</button>
            <button data-testid="logout" onClick={() => logout()}>Logout</button>
        </div>
    );
}

describe('AuthContext', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        // Reset window.location
        Object.defineProperty(window, 'location', {
            value: { href: '', search: '', pathname: '/' },
            writable: true,
        });
    });

    it('starts with no authentication', async () => {
        mockFetch.mockResolvedValue({ ok: false });

        await act(async () => {
            render(
                <AuthProvider>
                    <AuthDisplay />
                </AuthProvider>
            );
        });

        expect(screen.getByTestId('authenticated').textContent).toBe('false');
        expect(screen.getByTestId('username').textContent).toBe('none');
    });

    it('loads token from localStorage', async () => {
        localStorage.setItem('token', 'saved-token');
        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => ({
                id: 1,
                username: 'testuser',
                email: 'test@example.com',
                is_active: true,
                is_superuser: false,
                is_approved: true,
                request_status: 'approved',
            }),
        });

        await act(async () => {
            render(
                <AuthProvider>
                    <AuthDisplay />
                </AuthProvider>
            );
        });

        expect(screen.getByTestId('authenticated').textContent).toBe('true');
        expect(screen.getByTestId('username').textContent).toBe('testuser');
        expect(screen.getByTestId('token').textContent).toBe('saved-token');
    });

    it('logs out and clears state', async () => {
        localStorage.setItem('token', 'old-token');
        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => ({
                id: 1,
                username: 'testuser',
                email: 'test@example.com',
                is_active: true,
                is_superuser: false,
                is_approved: true,
                request_status: 'approved',
            }),
        });

        await act(async () => {
            render(
                <AuthProvider>
                    <AuthActions />
                </AuthProvider>
            );
        });

        expect(screen.getByTestId('authenticated').textContent).toBe('true');

        await act(async () => {
            screen.getByTestId('logout').click();
        });

        expect(screen.getByTestId('authenticated').textContent).toBe('false');
        expect(localStorage.getItem('token')).toBeNull();
    });

    it('login redirects to KeyN', async () => {
        mockFetch.mockResolvedValue({ ok: false });

        await act(async () => {
            render(
                <AuthProvider>
                    <AuthActions />
                </AuthProvider>
            );
        });

        await act(async () => {
            screen.getByTestId('login').click();
        });

        expect(window.location.href).toContain('/api/auth/login');
    });

    it('throws when useAuth is used outside provider', () => {
        // Suppress console.error for expected error
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        expect(() => render(<AuthDisplay />)).toThrow('useAuth must be used within an AuthProvider');
        consoleSpy.mockRestore();
    });

    it('handles fetch failure gracefully', async () => {
        localStorage.setItem('token', 'bad-token');
        mockFetch.mockRejectedValue(new Error('Network error'));

        await act(async () => {
            render(
                <AuthProvider>
                    <AuthDisplay />
                </AuthProvider>
            );
        });

        // Should have logged out due to failure
        expect(screen.getByTestId('authenticated').textContent).toBe('false');
    });
});

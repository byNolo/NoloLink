import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import VerifyLinkPage from '../pages/VerifyLinkPage';

// Mock fetch
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

function renderVerifyPage(params: string = '?pwd=1') {
    // No token in localStorage = unauthenticated user
    localStorage.clear();
    mockFetch.mockResolvedValue({ ok: false, status: 401, json: async () => ({ detail: 'fail' }) });

    return render(
        <AuthProvider>
            <MemoryRouter initialEntries={[`/verify/testcode${params}`]}>
                <Routes>
                    <Route path="/verify/:shortCode" element={<VerifyLinkPage />} />
                </Routes>
            </MemoryRouter>
        </AuthProvider>
    );
}

describe('VerifyLinkPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        Object.defineProperty(window, 'location', {
            value: { href: '', search: '', pathname: '/' },
            writable: true,
        });
    });

    it('renders Restricted Access heading', async () => {
        renderVerifyPage();
        expect(await screen.findByText('Restricted Access')).toBeInTheDocument();
    });

    it('shows password form when pwd=1', async () => {
        renderVerifyPage('?pwd=1');
        expect(await screen.findByPlaceholderText('Enter password')).toBeInTheDocument();
        expect(screen.getByText('Access via Password')).toBeInTheDocument();
    });

    it('shows login button when login=1 and unauthenticated', async () => {
        renderVerifyPage('?login=1');
        expect(await screen.findByText('Login with KeyN')).toBeInTheDocument();
    });

    it('shows both options with OR divider for dual protection', async () => {
        renderVerifyPage('?pwd=1&login=1');
        expect(await screen.findByPlaceholderText('Enter password')).toBeInTheDocument();
        expect(screen.getByText('OR')).toBeInTheDocument();
        expect(screen.getByText('Login with KeyN')).toBeInTheDocument();
    });

    it('shows password-only prompt text', async () => {
        renderVerifyPage('?pwd=1');
        expect(await screen.findByText('Enter password to access.')).toBeInTheDocument();
    });

    it('shows login-only prompt text', async () => {
        renderVerifyPage('?login=1');
        expect(await screen.findByText('Login to access.')).toBeInTheDocument();
    });

    it('shows dual prompt text', async () => {
        renderVerifyPage('?pwd=1&login=1');
        expect(await screen.findByText('Enter password OR login to access.')).toBeInTheDocument();
    });

    it('displays error on failed verification', async () => {
        renderVerifyPage('?pwd=1');

        // Now set up the mock for the verify API call that happens on submit
        mockFetch.mockResolvedValue({
            ok: false,
            status: 401,
            json: async () => ({ detail: 'Incorrect password' }),
        });

        const input = await screen.findByPlaceholderText('Enter password');
        const user = userEvent.setup();
        await user.type(input, 'wrongpass');
        await user.click(screen.getByText('Access via Password'));

        expect(await screen.findByText('Incorrect password')).toBeInTheDocument();
    });
});

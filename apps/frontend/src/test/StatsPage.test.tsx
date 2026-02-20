import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import StatsPage from '../pages/StatsPage';

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

function renderStatsPage(shortCode: string = 'abc123') {
    localStorage.setItem('token', 'test-token');
    return render(
        <AuthProvider>
            <MemoryRouter initialEntries={[`/stats/${shortCode}`]}>
                <Routes>
                    <Route path="/stats/:shortCode" element={<StatsPage />} />
                </Routes>
            </MemoryRouter>
        </AuthProvider>
    );
}

describe('StatsPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    it('shows loading state initially', () => {
        // Return a pending promise to keep loading state
        mockFetch.mockReturnValue(new Promise(() => { }));
        renderStatsPage();
        expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('renders link stats after loading', async () => {
        // First call: user profile (from AuthProvider)
        // Subsequent calls: stats API
        mockFetch
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    id: 1, username: 'testuser', email: 'test@example.com',
                    is_active: true, is_superuser: false, is_approved: true, request_status: 'approved',
                }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    id: 1,
                    short_code: 'abc123',
                    original_url: 'https://example.com/long-url',
                    clicks: 42,
                    is_active: true,
                    created_at: '2026-01-15T10:00:00Z',
                    title: 'Test Link',
                    clicks_over_time: [{ date: '2026-01-15', count: 10 }],
                    top_countries: [{ country: 'US', count: 20 }],
                    top_referrers: [{ referrer: 'Direct', count: 30 }],
                    device_breakdown: [{ device: 'Desktop', count: 25 }],
                }),
            });

        renderStatsPage('abc123');

        // Wait for stats to load and display
        expect(await screen.findByText('42')).toBeInTheDocument();
        expect(screen.getByText(/abc123/)).toBeInTheDocument();
    });

    it('shows error state for not found link', async () => {
        mockFetch
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    id: 1, username: 'testuser', email: 'test@example.com',
                    is_active: true, is_superuser: false, is_approved: true, request_status: 'approved',
                }),
            })
            .mockResolvedValueOnce({
                ok: false,
                status: 404,
                json: async () => ({ detail: 'Link not found' }),
            });

        renderStatsPage('nonexistent');

        // The component shows "Error" heading when fetch fails
        expect(await screen.findByText('Error')).toBeInTheDocument();
    });
});

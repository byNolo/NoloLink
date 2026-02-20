import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    fetchLinks,
    fetchCampaigns,
    createCampaign,
    deleteCampaign,
    createLink,
    updateLink,
    deleteLink,
    fetchLinkStats,
    importLinksCSV,
    fetchAuditLogs,
} from '../lib/api';

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

const TOKEN = 'test-token-123';

describe('API Layer', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // --- Links ---
    describe('fetchLinks', () => {
        it('fetches links with auth header', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => [{ id: 1, short_code: 'abc' }],
            });

            const links = await fetchLinks(TOKEN);
            expect(mockFetch).toHaveBeenCalledOnce();
            const [url, opts] = mockFetch.mock.calls[0];
            expect(url).toContain('/api/links');
            expect(opts.headers.Authorization).toBe(`Bearer ${TOKEN}`);
            expect(links).toHaveLength(1);
        });

        it('passes search filter as query param', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => [],
            });

            await fetchLinks(TOKEN, { search: 'hello' });
            const url = mockFetch.mock.calls[0][0];
            expect(url).toContain('search=hello');
        });

        it('passes campaign_id filter', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => [],
            });

            await fetchLinks(TOKEN, { campaign_id: 5 });
            const url = mockFetch.mock.calls[0][0];
            expect(url).toContain('campaign_id=5');
        });

        it('throws on error response', async () => {
            mockFetch.mockResolvedValue({
                ok: false,
                status: 500,
                json: async () => ({ detail: 'Server error' }),
            });

            await expect(fetchLinks(TOKEN)).rejects.toThrow();
        });
    });

    // --- Campaigns ---
    describe('fetchCampaigns', () => {
        it('fetches campaigns list', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => [{ id: 1, name: 'Test' }],
            });

            const camps = await fetchCampaigns(TOKEN);
            expect(camps).toHaveLength(1);
            const url = mockFetch.mock.calls[0][0];
            expect(url).toContain('/api/campaigns');
        });
    });

    describe('createCampaign', () => {
        it('sends POST with name and color', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => ({ id: 1, name: 'New', color: '#FF0000' }),
            });

            const camp = await createCampaign(TOKEN, 'New', '#FF0000');
            expect(camp.name).toBe('New');
            const [, opts] = mockFetch.mock.calls[0];
            expect(opts.method).toBe('POST');
            const body = JSON.parse(opts.body);
            expect(body.name).toBe('New');
            expect(body.color).toBe('#FF0000');
        });
    });

    describe('deleteCampaign', () => {
        it('sends DELETE request', async () => {
            mockFetch.mockResolvedValue({ ok: true });

            await deleteCampaign(TOKEN, 5);
            const [url, opts] = mockFetch.mock.calls[0];
            expect(url).toContain('/api/campaigns/5');
            expect(opts.method).toBe('DELETE');
        });
    });

    // --- Link CRUD ---
    describe('createLink', () => {
        it('sends POST with URL and optional fields', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => ({ id: 1, short_code: 'new1', original_url: 'https://test.com' }),
            });

            const link = await createLink(TOKEN, 'https://test.com', 'new1', { title: 'My Link' });
            expect(link.short_code).toBe('new1');
            const [, opts] = mockFetch.mock.calls[0];
            expect(opts.method).toBe('POST');
            const body = JSON.parse(opts.body);
            expect(body.original_url).toBe('https://test.com');
            expect(body.short_code).toBe('new1');
            expect(body.title).toBe('My Link');
        });

        it('sends UTM parameters in request body', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => ({ id: 1, short_code: 'utm1', original_url: 'https://test.com' }),
            });

            await createLink(TOKEN, 'https://test.com', 'utm1', {
                utm_source: 'google',
                utm_medium: 'cpc',
                utm_campaign: 'spring_sale'
            });

            const [, opts] = mockFetch.mock.calls[0];
            const body = JSON.parse(opts.body);
            expect(body.utm_source).toBe('google');
            expect(body.utm_medium).toBe('cpc');
            expect(body.utm_campaign).toBe('spring_sale');
        });
    });

    describe('updateLink', () => {
        it('sends PUT with updates', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => ({ id: 1, original_url: 'https://updated.com' }),
            });

            await updateLink(TOKEN, 1, { original_url: 'https://updated.com' });
            const [url, opts] = mockFetch.mock.calls[0];
            expect(url).toContain('/api/links/1');
            expect(opts.method).toBe('PUT');
        });
    });

    describe('deleteLink', () => {
        it('sends DELETE request', async () => {
            mockFetch.mockResolvedValue({ ok: true });

            await deleteLink(TOKEN, 42);
            const [url, opts] = mockFetch.mock.calls[0];
            expect(url).toContain('/api/links/42');
            expect(opts.method).toBe('DELETE');
        });
    });

    describe('fetchLinkStats', () => {
        it('fetches stats for a short code', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => ({ short_code: 'abc', clicks: 100 }),
            });

            const stats = await fetchLinkStats(TOKEN, 'abc');
            expect(stats.clicks).toBe(100);
            const url = mockFetch.mock.calls[0][0];
            expect(url).toContain('/abc/stats');
        });
    });

    // --- Import ---
    describe('importLinksCSV', () => {
        it('sends file upload', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => ({ created: 3, skipped: 1, errors: [] }),
            });

            const file = new File(['csv,data'], 'test.csv', { type: 'text/csv' });
            const result = await importLinksCSV(TOKEN, file);
            expect(result.created).toBe(3);
            expect(result.skipped).toBe(1);
            const [, opts] = mockFetch.mock.calls[0];
            expect(opts.method).toBe('POST');
        });
    });

    // --- Audit Logs ---
    describe('fetchAuditLogs', () => {
        it('fetches audit entries', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => [{ id: 1, action: 'create', target_type: 'link' }],
            });

            const logs = await fetchAuditLogs(TOKEN);
            expect(logs).toHaveLength(1);
            const url = mockFetch.mock.calls[0][0];
            expect(url).toContain('/api/audit');
        });

        it('passes filter params', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => [],
            });

            await fetchAuditLogs(TOKEN, { action: 'delete', target_type: 'campaign' });
            const url = mockFetch.mock.calls[0][0];
            expect(url).toContain('action=delete');
            expect(url).toContain('target_type=campaign');
        });
    });
});

import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import App from '../App';

// Mock fetch
const mockFetch = vi.fn();
globalThis.fetch = mockFetch as any;

describe('App Routing', () => {
    it('renders the app without crashing', () => {
        mockFetch.mockResolvedValue({ ok: false });
        const { container } = render(<App />);
        expect(container).toBeTruthy();
    });
});

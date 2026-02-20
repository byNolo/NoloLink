import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import NotFound from '../pages/NotFound';
import ErrorPage from '../pages/ErrorPage';
import Unauthorized from '../pages/Unauthorized';
import ServerError from '../pages/ServerError';
import TermsOfService from '../pages/TermsOfService';
import PrivacyPolicy from '../pages/PrivacyPolicy';

const mockFetch = vi.fn();
globalThis.fetch = mockFetch as any;

describe('NotFound Page', () => {
    it('renders 404 heading', () => {
        render(<MemoryRouter><NotFound /></MemoryRouter>);
        expect(screen.getByText('404')).toBeInTheDocument();
        expect(screen.getByText('Page Not Found')).toBeInTheDocument();
    });

    it('has a Go Home link', () => {
        render(<MemoryRouter><NotFound /></MemoryRouter>);
        const link = screen.getByText('Go Home');
        expect(link).toBeInTheDocument();
        expect(link.closest('a')).toHaveAttribute('href', '/');
    });
});

describe('ErrorPage', () => {
    it('renders expired error', () => {
        render(
            <MemoryRouter initialEntries={['/error?type=expired']}>
                <ErrorPage />
            </MemoryRouter>
        );
        expect(screen.getByText('Link Expired')).toBeInTheDocument();
        expect(screen.getByText(/reached its expiration/)).toBeInTheDocument();
    });

    it('renders disabled error', () => {
        render(
            <MemoryRouter initialEntries={['/error?type=disabled']}>
                <ErrorPage />
            </MemoryRouter>
        );
        expect(screen.getByText('Link Disabled')).toBeInTheDocument();
    });

    it('renders unknown error for bad type', () => {
        render(
            <MemoryRouter initialEntries={['/error?type=badvalue']}>
                <ErrorPage />
            </MemoryRouter>
        );
        expect(screen.getByText('Something Went Wrong')).toBeInTheDocument();
    });

    it('renders unknown error with no type param', () => {
        render(
            <MemoryRouter initialEntries={['/error']}>
                <ErrorPage />
            </MemoryRouter>
        );
        expect(screen.getByText('Something Went Wrong')).toBeInTheDocument();
    });
});

describe('Unauthorized Page', () => {
    it('renders 403 content', () => {
        render(<MemoryRouter><Unauthorized /></MemoryRouter>);
        expect(screen.getByText('403')).toBeInTheDocument();
    });
});

describe('ServerError Page', () => {
    it('renders 500 content', () => {
        render(<MemoryRouter><ServerError /></MemoryRouter>);
        expect(screen.getByText('500')).toBeInTheDocument();
    });
});

describe('TermsOfService Page', () => {
    beforeEach(() => {
        mockFetch.mockResolvedValue({ ok: false });
    });

    it('renders terms heading', () => {
        render(
            <AuthProvider>
                <MemoryRouter><TermsOfService /></MemoryRouter>
            </AuthProvider>
        );
        expect(screen.getByText('Terms of Service')).toBeInTheDocument();
    });
});

describe('PrivacyPolicy Page', () => {
    beforeEach(() => {
        mockFetch.mockResolvedValue({ ok: false });
    });

    it('renders privacy heading', () => {
        render(
            <AuthProvider>
                <MemoryRouter><PrivacyPolicy /></MemoryRouter>
            </AuthProvider>
        );
        expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
    });
});

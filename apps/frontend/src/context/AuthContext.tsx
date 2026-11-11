import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { fetchMyOrgs, setCurrentOrgId, getCurrentOrgId } from '../lib/api';
import type { OrgMembership } from '../lib/api';

export interface User {
    id: number;
    username: string;
    full_name: string;
    email: string;
    avatar_url?: string;
    is_active: boolean;
    is_superuser: boolean;
    is_approved: boolean;
    request_status: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (redirectUrl?: string) => void;
    logout: () => Promise<void>;
    isAuthenticated: boolean;
    refreshProfile: () => Promise<void>;
    isLoading: boolean;
    currentOrg: OrgMembership | null;
    orgs: OrgMembership[];
    switchOrg: (orgId: number) => void;
    refreshOrgs: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [orgs, setOrgs] = useState<OrgMembership[]>([]);
    const [currentOrg, setCurrentOrg] = useState<OrgMembership | null>(null);

    useEffect(() => {
        const initAuth = async () => {
            const storedToken = localStorage.getItem('token');
            const params = new URLSearchParams(window.location.search);
            const callbackToken = params.get('token');
            const authToken = storedToken ?? callbackToken ?? undefined;

            if (storedToken) {
                localStorage.removeItem('token');
                setToken(storedToken);
            }
            if (callbackToken) {
                setToken(callbackToken);
                params.delete('token');
                params.delete('username');
                const search = params.toString();
                const cleanUrl = `${window.location.pathname}${search ? `?${search}` : ''}${window.location.hash}`;
                window.history.replaceState({}, document.title, cleanUrl);
            }

            try {
                const profileLoaded = await fetchUserProfile(authToken);
                if (profileLoaded) {
                    await loadOrgs(authToken);
                }
            } catch (error) {
                console.error('Failed to initialize auth', error);
            }

            const redirectUrl = localStorage.getItem('loginRedirectUrl');
            if (redirectUrl) {
                localStorage.removeItem('loginRedirectUrl');
                window.location.href = redirectUrl;
            }

            setIsLoading(false);
        };

        void initAuth();
    }, []);

    const loadOrgs = async (authToken?: string) => {
        try {
            const memberships = await fetchMyOrgs(authToken ?? '');
            setOrgs(memberships);
            if (memberships.length > 0) {
                const savedOrgId = getCurrentOrgId();
                const found = memberships.find(m => String(m.org_id) === savedOrgId);
                const active = found || memberships[0];
                setCurrentOrg(active);
                setCurrentOrgId(active.org_id);
            }
        } catch (error) {
            console.error('Failed to load orgs', error);
        }
    };

    const switchOrg = useCallback((orgId: number) => {
        const target = orgs.find(m => m.org_id === orgId);
        if (target) {
            setCurrentOrg(target);
            setCurrentOrgId(orgId);
        }
    }, [orgs]);

    const refreshOrgs = useCallback(async () => {
        await loadOrgs(token ?? undefined);
    }, [token]);

    const fetchUserProfile = async (authToken?: string) => {
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3071';
            const headers: Record<string, string> = {};
            if (authToken) {
                headers['Authorization'] = `Bearer ${authToken}`;
            }

            const response = await fetch(`${apiUrl}/api/users/me`, {
                credentials: 'include',
                headers,
            });

            if (response.ok) {
                const userData = await response.json();
                setUser(userData);
                setToken(authToken ?? token ?? null);
                localStorage.setItem('user', JSON.stringify(userData));
                return true;
            }

            setUser(null);
            setToken(null);
            localStorage.removeItem('user');
            return false;
        } catch (error) {
            console.error('Failed to fetch user profile', error);
            setUser(null);
            setToken(null);
            localStorage.removeItem('user');
            return false;
        }
    };

    const login = (redirectUrl?: string) => {
        if (redirectUrl) {
            localStorage.setItem('loginRedirectUrl', redirectUrl);
        }
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3071';
        window.location.href = `${apiUrl}/api/auth/login`;
    };

    const logout = async () => {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3071';
        try {
            await fetch(`${apiUrl}/api/auth/logout`, {
                method: 'POST',
                credentials: 'include',
            });
        } catch (error) {
            console.error('Failed to clear auth cookie', error);
        }

        setUser(null);
        setToken(null);
        setOrgs([]);
        setCurrentOrg(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('orgId');
    };

    const refreshProfile = async () => {
        await fetchUserProfile(token ?? undefined);
    };

    return (
        <AuthContext.Provider value={{
            user, token, login, logout,
            isAuthenticated: !!user,
            refreshProfile, isLoading,
            currentOrg, orgs,
            switchOrg, refreshOrgs,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

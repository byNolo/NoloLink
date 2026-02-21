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
    logout: () => void;
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
            if (storedToken) {
                setToken(storedToken);
                await fetchUserProfile(storedToken);
                await loadOrgs(storedToken);
            } else {
                const params = new URLSearchParams(window.location.search);
                const urlToken = params.get('token');
                if (urlToken) {
                    setToken(urlToken);
                    localStorage.setItem('token', urlToken);
                    await fetchUserProfile(urlToken);
                    await loadOrgs(urlToken);
                    window.history.replaceState({}, document.title, window.location.pathname);

                    const redirectUrl = localStorage.getItem('loginRedirectUrl');
                    if (redirectUrl) {
                        localStorage.removeItem('loginRedirectUrl');
                        window.location.href = redirectUrl;
                    }
                }
            }
            setIsLoading(false);
        };
        initAuth();
    }, []);

    const loadOrgs = async (authToken: string) => {
        try {
            const memberships = await fetchMyOrgs(authToken);
            setOrgs(memberships);
            if (memberships.length > 0) {
                const savedOrgId = getCurrentOrgId();
                const found = memberships.find(m => String(m.org_id) === savedOrgId);
                const active = found || memberships[0];
                setCurrentOrg(active);
                setCurrentOrgId(active.org_id);
            }
        } catch (error) {
            console.error("Failed to load orgs", error);
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
        if (token) {
            await loadOrgs(token);
        }
    }, [token]);

    const fetchUserProfile = async (authToken: string) => {
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3071';
            const response = await fetch(`${apiUrl}/api/users/me`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            if (response.ok) {
                const userData = await response.json();
                setUser(userData);
                localStorage.setItem('user', JSON.stringify(userData));
            } else {
                logout();
            }
        } catch (error) {
            console.error("Failed to fetch user profile", error);
            logout();
        }
    };

    const login = (redirectUrl?: string) => {
        if (redirectUrl) {
            localStorage.setItem('loginRedirectUrl', redirectUrl);
        }
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3071';
        window.location.href = `${apiUrl}/api/auth/login`;
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        setOrgs([]);
        setCurrentOrg(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('orgId');
    };

    const refreshProfile = async () => {
        if (token) {
            await fetchUserProfile(token);
        }
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

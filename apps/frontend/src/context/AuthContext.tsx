import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        const initAuth = async () => {
            const storedToken = localStorage.getItem('token');
            console.log("AuthContext Init: StoredToken=", storedToken);
            if (storedToken) {
                setToken(storedToken);
                await fetchUserProfile(storedToken);
            } else {
                // Check for token in URL (callback from backend)
                const params = new URLSearchParams(window.location.search);
                const urlToken = params.get('token');
                console.log("AuthContext Init: URLToken=", urlToken);
                if (urlToken) {
                    console.log("AuthContext: Setting token from URL");
                    setToken(urlToken);
                    localStorage.setItem('token', urlToken);

                    // Wait for profile fetch (and potential logout on failure)
                    await fetchUserProfile(urlToken);

                    window.history.replaceState({}, document.title, window.location.pathname);

                    // Check for redirect URL
                    const redirectUrl = localStorage.getItem('loginRedirectUrl');
                    console.log("AuthContext: RedirectUrl=", redirectUrl);
                    if (redirectUrl) {
                        localStorage.removeItem('loginRedirectUrl');
                        console.log("AuthContext: Redirecting to", redirectUrl);
                        window.location.href = redirectUrl;
                    }
                }
            }
        };

        initAuth();
    }, []);

    const fetchUserProfile = async (authToken: string) => {
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3071';
            const response = await fetch(`${apiUrl}/api/users/me`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
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
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    };

    const refreshProfile = async () => {
        if (token) {
            await fetchUserProfile(token);
        }
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!user, refreshProfile }}>
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

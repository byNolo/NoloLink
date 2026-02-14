import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function VerifyLinkPage() {
    const { shortCode } = useParams();
    const [searchParams] = useSearchParams();
    const hasPassword = searchParams.get('pwd') === '1';
    const hasLogin = searchParams.get('login') === '1';

    const { token, login, isAuthenticated } = useAuth();

    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Auto-verify if only login is required and we are authenticated, OR if we have login option and are authenticated (hybrid)
    // Actually, for hybrid, we should try to verify immediately if authenticated.
    useEffect(() => {
        console.log("VerifyLinkPage Effect:", { hasLogin, isAuthenticated, token });
        if (hasLogin && isAuthenticated && token) {
            console.log("Triggering verifyAccess from Effect");
            verifyAccess();
        }
    }, [hasLogin, isAuthenticated, token]);

    async function verifyAccess(e?: React.FormEvent) {
        if (e) e.preventDefault();

        setIsLoading(true);
        setError(null);

        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3071';
            const headers: any = {
                'Content-Type': 'application/json'
            };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`${apiUrl}/api/verify/${shortCode}`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ password: password || undefined })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.original_url) {
                    window.location.href = data.original_url;
                } else {
                    setError('Unexpected response from server.');
                }
            } else {
                const errData = await response.json();
                setError(errData.detail || 'Access denied.');
            }
        } catch (err) {
            setError('Failed to verify access.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-[#111] flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full bg-[#1c1c1c] rounded-2xl shadow-xl border border-gray-800 p-8">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Restricted Access</h1>
                    <p className="text-gray-400">
                        {hasPassword && hasLogin ? 'Enter password OR login to access.' :
                            hasPassword ? 'Enter password to access.' :
                                'Login to access.'}
                    </p>
                </div>

                <div className="space-y-6">
                    {hasPassword && (
                        <form onSubmit={verifyAccess} className="space-y-4">
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter password"
                                className="w-full bg-[#2a2a2a] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                autoFocus={!hasLogin}
                            />
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-xl transition-all disabled:opacity-50"
                            >
                                {isLoading ? 'Verifying...' : 'Access via Password'}
                            </button>
                        </form>
                    )}

                    {hasPassword && hasLogin && (
                        <div className="text-center text-gray-500 text-sm font-semibold relative py-2">
                            <span className="bg-[#1c1c1c] px-2 relative z-10">OR</span>
                            <div className="absolute top-1/2 left-0 w-full border-t border-gray-800 top-4"></div>
                        </div>
                    )}

                    {hasLogin && (
                        <div>
                            {!isAuthenticated ? (
                                <button
                                    onClick={() => login(window.location.href)}
                                    className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-xl transition-all"
                                >
                                    Login with KeyN
                                </button>
                            ) : (
                                <div className="text-center">
                                    <p className="text-gray-400 mb-4">Logged in as <span className="text-white font-medium">{useAuth().user?.email}</span></p>
                                    <button
                                        onClick={() => verifyAccess()}
                                        disabled={isLoading}
                                        className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-6 rounded-xl transition-all"
                                    >
                                        Access via Login
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {error && (
                    <div className="mt-6 p-3 bg-red-900/20 border border-red-900/50 rounded-lg text-red-400 text-sm text-center">
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
}

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { acceptInvite } from '../lib/api';
import Navbar from '../components/Navbar';

export default function AcceptInvitePage() {
    const { inviteToken } = useParams<{ inviteToken: string }>();
    const { token, isAuthenticated, login, isLoading: authLoading, refreshOrgs } = useAuth();
    const navigate = useNavigate();
    const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'redirecting'>('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (authLoading) return;

        if (!isAuthenticated) {
            // User needs to log in first, then come back here
            login(`/invite/${inviteToken}`);
            setStatus('redirecting');
            return;
        }

        if (token && inviteToken) {
            handleAccept();
        }
    }, [authLoading, isAuthenticated, token, inviteToken]);

    async function handleAccept() {
        if (!token || !inviteToken) return;
        try {
            setStatus('loading');
            await acceptInvite(token, inviteToken);
            await refreshOrgs();
            setStatus('success');
            setMessage('You have joined the organization!');
            // Redirect to dashboard after a moment
            setTimeout(() => navigate('/'), 2000);
        } catch (err: any) {
            setStatus('error');
            setMessage(err.message || 'Failed to accept invite. The link may have expired.');
        }
    }

    return (
        <div className="min-h-screen bg-[#111] text-white">
            {isAuthenticated && <Navbar />}
            <div className="flex items-center justify-center min-h-[80vh] px-4">
                <div className="max-w-md w-full bg-[#1c1c1c] rounded-2xl border border-gray-800 p-8 text-center shadow-2xl animate-fade-in">
                    {status === 'loading' && (
                        <>
                            <div className="w-12 h-12 mx-auto mb-6 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                            <h1 className="text-xl font-bold mb-2">Accepting Invite</h1>
                            <p className="text-gray-400 text-sm">Please wait...</p>
                        </>
                    )}

                    {status === 'redirecting' && (
                        <>
                            <div className="w-12 h-12 mx-auto mb-6 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                            <h1 className="text-xl font-bold mb-2">Redirecting to Login</h1>
                            <p className="text-gray-400 text-sm">Please log in to accept this invite</p>
                        </>
                    )}

                    {status === 'success' && (
                        <>
                            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h1 className="text-xl font-bold mb-2">Welcome!</h1>
                            <p className="text-gray-400 text-sm">{message}</p>
                            <p className="text-gray-500 text-xs mt-3">Redirecting to dashboard...</p>
                        </>
                    )}

                    {status === 'error' && (
                        <>
                            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                            <h1 className="text-xl font-bold mb-2">Invite Failed</h1>
                            <p className="text-gray-400 text-sm mb-6">{message}</p>
                            <button
                                onClick={() => navigate('/')}
                                className="px-6 py-2.5 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium rounded-xl transition-colors"
                            >
                                Go to Dashboard
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

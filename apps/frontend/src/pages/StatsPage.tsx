import { useEffect, useState } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import QRCode from 'react-qr-code';
import { useAuth } from '../context/AuthContext';
import { fetchLinkStats } from '../lib/api';
import type { Link } from '../lib/api';

export default function StatsPage() {
    const { shortCode } = useParams<{ shortCode: string }>();
    const { token, user, isLoading: authLoading } = useAuth();
    const [link, setLink] = useState<Link | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (authLoading) return;

        if (token && shortCode) {
            loadStats();
        } else if (!token) {
            // No token = Unauthorized for stats -> Redirect to destination
            const shortDomain = import.meta.env.VITE_SHORT_LINK_DOMAIN || 'localhost:3071';
            const protocol = shortDomain.includes('localhost') ? 'http' : 'https';
            window.location.href = `${protocol}://${shortDomain}/${shortCode}`;
        }
    }, [token, shortCode, authLoading]);

    async function loadStats() {
        try {
            setIsLoading(true);
            if (!shortCode || !token) return;
            const data = await fetchLinkStats(token, shortCode);
            setLink(data);
        } catch (err: any) {
            console.error(err);
            if (err.status === 403) {
                // Unauthorized to view stats, redirect to destination
                // Use the backend redirect endpoint (without +)
                // Actually, simpler: construct the short link URL and navigate there
                // But wait, we want to simulate a click, so we should go to the short link domain
                const shortDomain = import.meta.env.VITE_SHORT_LINK_DOMAIN || 'localhost:3071';
                const protocol = shortDomain.includes('localhost') ? 'http' : 'https';
                window.location.href = `${protocol}://${shortDomain}/${shortCode}`;
                return;
            }
            setError(err.message || "Failed to load stats");
        } finally {
            setIsLoading(false);
        }
    }

    if (isLoading) return <div className="p-8 text-center text-white">Loading stats...</div>;

    if (error) {
        return (
            <div className="min-h-screen bg-[#111] text-gray-100 font-sans p-8 flex flex-col items-center">
                <div className="bg-red-900/10 border border-red-900/20 text-red-500 px-6 py-4 rounded-xl max-w-md w-full text-center">
                    <h2 className="text-xl font-bold mb-2">Error</h2>
                    <p>{error}</p>
                    <RouterLink to="/" className="inline-block mt-4 text-blue-400 hover:text-blue-300">
                        &larr; Back to Dashboard
                    </RouterLink>
                </div>
            </div>
        );
    }

    if (!link) return null;

    const shortUrl = `${import.meta.env.VITE_SHORT_LINK_DOMAIN?.includes('localhost') ? 'http' : 'https'}://${import.meta.env.VITE_SHORT_LINK_DOMAIN || 'localhost:3071'}/${link.short_code}`;

    return (
        <div className="min-h-screen bg-[#111] text-gray-100 font-sans">
            <nav className="border-b border-gray-800 bg-[#161616]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex items-center gap-2">
                            <RouterLink to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                                <div className="bg-linear-to-tr from-blue-500 to-purple-600 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">
                                    N
                                </div>
                                <span className="text-xl font-bold bg-linear-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                                    NoloLink
                                </span>
                            </RouterLink>
                        </div>
                        <div className="flex items-center gap-4">
                            <RouterLink to="/" className="text-gray-400 hover:text-white transition-colors">
                                Dashboard
                            </RouterLink>
                            <div className="flex items-center gap-3 bg-[#222] px-3 py-1.5 rounded-full border border-gray-700">
                                <div className="w-6 h-6 rounded-full bg-linear-to-br from-gray-600 to-gray-800 flex items-center justify-center text-xs text-white">
                                    {user?.username?.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-sm font-medium text-gray-300">{user?.username}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-4xl mx-auto px-4 py-8">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Link Statistics</h1>
                        <p className="text-gray-500">
                            Stats for <span className="text-blue-400 font-mono">/{link.short_code}</span>
                        </p>
                    </div>
                    <RouterLink to="/" className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl transition-colors">
                        Back
                    </RouterLink>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Main Stats Card */}
                    <div className="bg-[#1c1c1c] rounded-2xl border border-gray-800 p-8 shadow-xl">
                        <div className="flex flex-col items-center justify-center text-center h-full">
                            <div className="text-6xl font-bold text-white mb-2">{link.clicks}</div>
                            <div className="text-sm text-gray-500 font-medium uppercase tracking-wider mb-8">Total Clicks</div>

                            <div className="w-full space-y-4">
                                <div className="bg-[#252525] p-4 rounded-xl border border-gray-800 text-left">
                                    <label className="text-xs text-gray-500 uppercase tracking-wider block mb-1">Destination</label>
                                    <div className="text-white truncate" title={link.original_url}>{link.original_url}</div>
                                </div>
                                <div className="bg-[#252525] p-4 rounded-xl border border-gray-800 text-left">
                                    <label className="text-xs text-gray-500 uppercase tracking-wider block mb-1">Short URL</label>
                                    <a href={shortUrl} target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300 truncate block font-mono">
                                        {shortUrl}
                                    </a>
                                </div>
                                <div className="bg-[#252525] p-4 rounded-xl border border-gray-800 text-left">
                                    <label className="text-xs text-gray-500 uppercase tracking-wider block mb-1">Created</label>
                                    <div className="text-gray-300">
                                        {new Date(link.created_at).toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* QR Code Card */}
                    <div className="bg-[#1c1c1c] rounded-2xl border border-gray-800 p-8 shadow-xl flex flex-col items-center justify-center">
                        <h2 className="text-xl font-bold text-white mb-6">QR Code</h2>
                        <div className="bg-white p-4 rounded-xl">
                            <QRCode
                                value={shortUrl}
                                size={200}
                                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                viewBox={`0 0 256 256`}
                            />
                        </div>
                        <p className="text-gray-500 text-sm mt-6 text-center max-w-xs">
                            Scan to visit <span className="text-blue-400">/{link.short_code}</span>
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}

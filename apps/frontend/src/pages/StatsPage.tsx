import { useEffect, useState } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import QRCode from 'react-qr-code';
import {
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { fetchLinkStats } from '../lib/api';
import type { Link } from '../lib/api';
import Navbar from '../components/Navbar';

export default function StatsPage() {
    const { shortCode } = useParams<{ shortCode: string }>();
    const { token, isLoading: authLoading } = useAuth();
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

    // Check if advanced analytics are enabled
    const hasAnalytics = link.track_activity;

    return (
        <div className="min-h-screen bg-[#111] text-gray-100 font-sans animate-fade-in">
            <Navbar />

            <main className="max-w-6xl mx-auto px-4 py-8">
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

                {/* Top Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Total Clicks */}
                    <div className="bg-[#1c1c1c] rounded-2xl border border-gray-800 p-6 shadow-xl flex flex-col justify-center items-center">
                        <div className="text-6xl font-bold text-white mb-2">{link.clicks}</div>
                        <div className="text-sm text-gray-500 font-medium uppercase tracking-wider">Total Clicks</div>
                    </div>

                    {/* QR Code */}
                    <div className="bg-[#1c1c1c] rounded-2xl border border-gray-800 p-6 shadow-xl flex flex-col items-center justify-center">
                        <div className="bg-white p-2 rounded-xl mb-3">
                            <QRCode
                                value={`${import.meta.env.VITE_SHORT_LINK_DOMAIN?.includes('localhost') ? 'http' : 'https'}://${import.meta.env.VITE_SHORT_LINK_DOMAIN || 'localhost:3071'}/${link.short_code}`}
                                size={100}
                                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                viewBox={`0 0 256 256`}
                            />
                        </div>
                        <span className="text-xs text-gray-500">Scan to visit</span>
                    </div>

                    {/* Link Info */}
                    <div className="bg-[#1c1c1c] rounded-2xl border border-gray-800 p-6 shadow-xl flex flex-col justify-center space-y-4">
                        <div>
                            <label className="text-xs text-gray-500 uppercase tracking-wider block mb-1">Destination</label>
                            <div className="text-white truncate text-sm" title={link.original_url}>{link.original_url}</div>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 uppercase tracking-wider block mb-1">Tracking</label>
                            <div className={`text-sm font-medium ${link.track_activity ? 'text-green-400' : 'text-yellow-500'}`}>
                                {link.track_activity ? 'Advanced Analytics Enabled' : 'Basic Tracking Only'}
                            </div>
                        </div>
                    </div>
                </div>

                {!hasAnalytics ? (
                    <div className="bg-yellow-900/10 border border-yellow-900/20 rounded-2xl p-8 text-center text-yellow-500">
                        <h3 className="text-xl font-bold mb-2">Advanced Analytics Disabled</h3>
                        <p>Enable "Track Activity" in the link settings to see detailed charts and insights.</p>
                    </div>
                ) : (
                    <>
                        {/* Clicks Over Time */}
                        <div className="bg-[#1c1c1c] rounded-2xl border border-gray-800 p-6 shadow-xl mb-8">
                            <h3 className="text-lg font-bold text-white mb-6">Clicks Over Last 30 Days</h3>
                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={link.clicks_over_time}>
                                        <defs>
                                            <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="date" stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 12 }} tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} />
                                        <YAxis stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 12 }} allowDecimals={false} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#252525', borderColor: '#374151', color: '#fff' }}
                                            itemStyle={{ color: '#fff' }}
                                            labelStyle={{ color: '#9ca3af' }}
                                        />
                                        <Area type="monotone" dataKey="count" stroke="#3b82f6" fillOpacity={1} fill="url(#colorClicks)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Top Countries */}
                            <div className="bg-[#1c1c1c] rounded-2xl border border-gray-800 p-6 shadow-xl">
                                <h3 className="text-lg font-bold text-white mb-4">Top Countries</h3>
                                <div className="space-y-3">
                                    {(link.top_countries || []).length > 0 ? (
                                        link.top_countries?.map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-center">
                                                <span className="text-gray-300">{item.country || 'Unknown'}</span>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-24 bg-gray-800 rounded-full h-2 overflow-hidden">
                                                        <div className="bg-blue-500 h-full" style={{ width: `${(item.count / (link.clicks || 1)) * 100}%` }}></div>
                                                    </div>
                                                    <span className="text-gray-500 text-sm w-8 text-right">{item.count}</span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-gray-500 text-sm">No data yet</p>
                                    )}
                                </div>
                            </div>

                            {/* Top Referrers */}
                            <div className="bg-[#1c1c1c] rounded-2xl border border-gray-800 p-6 shadow-xl">
                                <h3 className="text-lg font-bold text-white mb-4">Top Referrers</h3>
                                <div className="space-y-3">
                                    {(link.top_referrers || []).length > 0 ? (
                                        link.top_referrers?.map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-center">
                                                <span className="text-gray-300 truncate max-w-[150px]" title={item.referrer}>{item.referrer || 'Direct'}</span>
                                                <span className="text-gray-500 text-sm bg-gray-800 px-2 py-1 rounded-md">{item.count}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-gray-500 text-sm">No data yet</p>
                                    )}
                                </div>
                            </div>

                            {/* Device Breakdown */}
                            <div className="bg-[#1c1c1c] rounded-2xl border border-gray-800 p-6 shadow-xl">
                                <h3 className="text-lg font-bold text-white mb-4">Devices</h3>
                                <div className="h-48">
                                    {(link.device_breakdown || []).length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={link.device_breakdown}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={40}
                                                    outerRadius={70}
                                                    paddingAngle={5}
                                                    dataKey="count"
                                                    nameKey="device"
                                                >
                                                    {(link.device_breakdown || []).map((_, index) => (
                                                        <Cell key={`cell-${index}`} fill={['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b'][index % 4]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip contentStyle={{ backgroundColor: '#252525', borderColor: '#374151', color: '#fff' }} />
                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-gray-500 text-sm">No data yet</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}

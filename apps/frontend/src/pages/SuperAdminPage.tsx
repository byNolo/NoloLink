import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchAllOrgs, createOrg } from '../lib/api';
import type { OrgSummary } from '../lib/api';
import type { User } from '../context/AuthContext';
import Navbar from '../components/Navbar';

export default function SuperAdminPage() {
    const { token, user } = useAuth();
    const [activeTab, setActiveTab] = useState<'orgs' | 'requests' | 'create'>('orgs');
    const [allOrgs, setAllOrgs] = useState<OrgSummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Access requests
    const [requests, setRequests] = useState<User[]>([]);
    const [reqLoading, setReqLoading] = useState(true);

    // Create org
    const [newOrgName, setNewOrgName] = useState('');
    const [creating, setCreating] = useState(false);
    const [createMsg, setCreateMsg] = useState('');

    useEffect(() => {
        if (token) {
            loadAllOrgs();
            loadRequests();
        }
    }, [token]);

    async function loadAllOrgs() {
        if (!token) return;
        setIsLoading(true);
        try {
            const data = await fetchAllOrgs(token);
            setAllOrgs(data);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }

    async function loadRequests() {
        if (!token) return;
        setReqLoading(true);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3071';
            const response = await fetch(`${apiUrl}/api/users/requests`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                setRequests(await response.json());
            }
        } catch (err) {
            console.error(err);
        } finally {
            setReqLoading(false);
        }
    }

    async function handleAction(userId: number, action: 'approve' | 'reject') {
        if (!token) return;
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3071';
        try {
            const response = await fetch(`${apiUrl}/api/users/${userId}/${action}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                setRequests(requests.filter(r => r.id !== userId));
            }
        } catch (err) {
            console.error(err);
        }
    }

    async function handleCreateOrg(e: React.FormEvent) {
        e.preventDefault();
        if (!token || !newOrgName.trim()) return;
        setCreating(true);
        setCreateMsg('');
        try {
            await createOrg(token, newOrgName.trim());
            setNewOrgName('');
            setCreateMsg('Organization created!');
            await loadAllOrgs();
            setTimeout(() => setCreateMsg(''), 3000);
        } catch (err: any) {
            setCreateMsg(err.message || 'Failed to create org');
        } finally {
            setCreating(false);
        }
    }

    if (!user?.is_superuser) {
        return (
            <div className="min-h-screen bg-[#111] text-white">
                <Navbar />
                <div className="max-w-4xl mx-auto px-4 py-16 text-center">
                    <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
                    <p className="text-gray-400">Superuser access required.</p>
                </div>
            </div>
        );
    }

    const tabs = [
        { id: 'orgs' as const, label: `Organizations (${allOrgs.length})` },
        { id: 'requests' as const, label: `Access Requests (${requests.length})` },
        { id: 'create' as const, label: 'Create Org' },
    ];

    const totalLinks = allOrgs.reduce((s, o) => s + o.link_count, 0);
    const totalClicks = allOrgs.reduce((s, o) => s + o.total_clicks, 0);
    const totalMembers = allOrgs.reduce((s, o) => s + o.member_count, 0);

    return (
        <div className="min-h-screen bg-[#111] text-gray-100 font-sans animate-fade-in">
            <Navbar />

            <main className="max-w-6xl mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-1">Admin Dashboard</h1>
                    <p className="text-gray-500">Manage all organizations and platform settings</p>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: 'Organizations', value: allOrgs.length, color: 'from-blue-600 to-blue-800' },
                        { label: 'Total Members', value: totalMembers, color: 'from-purple-600 to-purple-800' },
                        { label: 'Total Links', value: totalLinks, color: 'from-cyan-600 to-cyan-800' },
                        { label: 'Total Clicks', value: totalClicks.toLocaleString(), color: 'from-green-600 to-green-800' },
                    ].map(card => (
                        <div key={card.label} className="bg-[#1c1c1c] rounded-2xl border border-gray-800 p-5">
                            <div className={`text-3xl font-bold bg-linear-to-r ${card.color} bg-clip-text text-transparent`}>{card.value}</div>
                            <div className="text-xs text-gray-500 uppercase tracking-wider mt-1 font-medium">{card.label}</div>
                        </div>
                    ))}
                </div>

                {/* Tabs */}
                <div className="flex gap-1 mb-6 bg-[#1a1a1a] p-1 rounded-xl border border-gray-800 w-fit">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === tab.id
                                    ? 'bg-[#252525] text-white shadow-sm'
                                    : 'text-gray-500 hover:text-gray-300'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Organizations Tab */}
                {activeTab === 'orgs' && (
                    <div className="bg-[#1c1c1c] rounded-2xl border border-gray-800 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-800 text-left">
                                        <th className="px-6 py-4 text-xs text-gray-500 uppercase tracking-wider font-medium">Organization</th>
                                        <th className="px-6 py-4 text-xs text-gray-500 uppercase tracking-wider font-medium">Plan</th>
                                        <th className="px-6 py-4 text-xs text-gray-500 uppercase tracking-wider font-medium text-right">Members</th>
                                        <th className="px-6 py-4 text-xs text-gray-500 uppercase tracking-wider font-medium text-right">Links</th>
                                        <th className="px-6 py-4 text-xs text-gray-500 uppercase tracking-wider font-medium text-right">Clicks</th>
                                        <th className="px-6 py-4 text-xs text-gray-500 uppercase tracking-wider font-medium">Created</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                    {isLoading ? (
                                        <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">Loading...</td></tr>
                                    ) : allOrgs.length === 0 ? (
                                        <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">No organizations yet</td></tr>
                                    ) : (
                                        allOrgs.map(org => (
                                            <tr key={org.id} className="hover:bg-[#222] transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-linear-to-br from-blue-600 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
                                                            {org.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-medium text-white">{org.name}</div>
                                                            <div className="text-xs text-gray-500">{org.slug}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`text-xs px-2 py-1 rounded-full border font-medium capitalize ${org.plan === 'enterprise' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                                                            org.plan === 'pro' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                                'bg-gray-500/10 text-gray-400 border-gray-500/20'
                                                        }`}>{org.plan}</span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-300 text-right">{org.member_count}</td>
                                                <td className="px-6 py-4 text-sm text-gray-300 text-right">{org.link_count}</td>
                                                <td className="px-6 py-4 text-sm text-gray-300 text-right">{org.total_clicks.toLocaleString()}</td>
                                                <td className="px-6 py-4 text-xs text-gray-500">{org.created_at ? new Date(org.created_at).toLocaleDateString() : '—'}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Access Requests Tab */}
                {activeTab === 'requests' && (
                    <div className="bg-[#1c1c1c] rounded-2xl border border-gray-800 overflow-hidden">
                        <div className="p-6 border-b border-gray-800">
                            <h2 className="text-lg font-bold text-white">Pending Access Requests</h2>
                        </div>
                        {reqLoading ? (
                            <div className="p-8 text-center text-gray-500">Loading...</div>
                        ) : requests.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">No pending requests</div>
                        ) : (
                            <div className="divide-y divide-gray-800">
                                {requests.map(req => (
                                    <div key={req.id} className="p-4 flex items-center justify-between hover:bg-[#222] transition-colors">
                                        <div className="flex items-center gap-3">
                                            {req.avatar_url ? (
                                                <img src={req.avatar_url} alt="" className="w-9 h-9 rounded-full" />
                                            ) : (
                                                <div className="w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center text-gray-300 font-bold text-xs">
                                                    {req.username.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            <div>
                                                <div className="text-sm font-medium text-white">{req.full_name || req.username}</div>
                                                <div className="text-xs text-gray-500">@{req.username} • {req.email}</div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleAction(req.id, 'reject')}
                                                className="px-3 py-1.5 text-red-400 hover:bg-red-500/10 rounded-lg text-xs font-medium transition-colors"
                                            >
                                                Reject
                                            </button>
                                            <button
                                                onClick={() => handleAction(req.id, 'approve')}
                                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition-colors"
                                            >
                                                Approve
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Create Org Tab */}
                {activeTab === 'create' && (
                    <div className="bg-[#1c1c1c] rounded-2xl border border-gray-800 p-6 max-w-lg">
                        <h2 className="text-lg font-bold text-white mb-4">Create Organization</h2>
                        <p className="text-sm text-gray-400 mb-6">Create a new organization. You will be assigned as the owner.</p>
                        <form onSubmit={handleCreateOrg} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Organization Name</label>
                                <input
                                    type="text"
                                    value={newOrgName}
                                    onChange={e => setNewOrgName(e.target.value)}
                                    placeholder="Acme Corp"
                                    className="w-full bg-[#0f0f0f] border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                                    required
                                />
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
                                >
                                    {creating ? 'Creating...' : 'Create Organization'}
                                </button>
                                {createMsg && (
                                    <span className={`text-sm ${createMsg.includes('Failed') ? 'text-red-400' : 'text-green-400'}`}>{createMsg}</span>
                                )}
                            </div>
                        </form>
                    </div>
                )}
            </main>
        </div>
    );
}

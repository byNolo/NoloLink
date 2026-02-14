import { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchLinks, createLink, updateLink, deleteLink } from '../lib/api';
import type { Link } from '../lib/api';
import AdminPanel from './AdminPanel';

export default function Dashboard() {
    const { token, user, refreshProfile } = useAuth();
    const [links, setLinks] = useState<Link[]>([]);

    // Create State
    const [newUrl, setNewUrl] = useState('');
    const [createSlug, setCreateSlug] = useState('');
    const [createPassword, setCreatePassword] = useState('');
    const [createRequireLogin, setCreateRequireLogin] = useState(false);
    const [createAllowedEmails, setCreateAllowedEmails] = useState('');
    const [createExpiresAt, setCreateExpiresAt] = useState('');
    const [createTrackActivity, setCreateTrackActivity] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);

    // Edit State
    const [editingLink, setEditingLink] = useState<Link | null>(null);
    const [editUrl, setEditUrl] = useState('');
    const [editSlug, setEditSlug] = useState('');
    const [editPassword, setEditPassword] = useState('');
    const [editRequireLogin, setEditRequireLogin] = useState(false);
    const [editAllowedEmails, setEditAllowedEmails] = useState('');
    const [editExpiresAt, setEditExpiresAt] = useState('');
    const [editIsActive, setEditIsActive] = useState(true);
    const [editTrackActivity, setEditTrackActivity] = useState(true);
    const [shouldClearPassword, setShouldClearPassword] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editError, setEditError] = useState<string | null>(null);

    // Request Access State
    const [isRequesting, setIsRequesting] = useState(false);
    const [showAdminPanel, setShowAdminPanel] = useState(false);

    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (token && (user?.is_approved || user?.is_superuser)) {
            loadLinks();
        } else {
            setIsLoading(false);
        }
    }, [token, user?.is_approved, user?.is_superuser]);

    async function loadLinks() {
        try {
            if (!token) return;
            setIsLoading(true);
            const data = await fetchLinks(token);
            setLinks(data);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleRequestAccess() {
        if (!token) return;
        try {
            setIsRequesting(true);
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3071';
            const response = await fetch(`${apiUrl}/api/users/request-access`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                await refreshProfile();
            } else {
                alert('Failed to submit request.');
            }
        } catch (err) {
            console.error(err);
            alert('Error submitting request.');
        } finally {
            setIsRequesting(false);
        }
    }

    async function handleCreateLink(e: React.FormEvent) {
        e.preventDefault();
        if (!newUrl || !token) return;

        try {
            setIsCreating(true);
            setCreateError(null);

            // Convert local input time to UTC ISO string for backend
            let expiresAtISO: string | undefined;
            if (createExpiresAt) {
                // createExpiresAt is "YYYY-MM-DDTHH:mm" (local)
                // Create date object treating input as local time
                const localDate = new Date(createExpiresAt);
                expiresAtISO = localDate.toISOString();
            }

            const created = await createLink(token, newUrl, createSlug || undefined, {
                password: createPassword || undefined,
                require_login: createRequireLogin,
                allowed_emails: createAllowedEmails || undefined,
                expires_at: expiresAtISO,
                track_activity: createTrackActivity
            });
            setLinks([created, ...links]);
            setNewUrl('');
            setCreateSlug('');
            setCreatePassword('');
            setCreateRequireLogin(false);
            setCreateAllowedEmails('');
            setCreateExpiresAt('');
            setCreateTrackActivity(true);
        } catch (err: any) {
            setCreateError(err.message || 'Failed to create link');
        } finally {
            setIsCreating(false);
        }
    }

    async function handleDeleteLink(id: number) {
        if (!confirm('Are you sure you want to delete this link?')) return;
        if (!token) return;

        try {
            await deleteLink(token, id);
            setLinks(links.filter(l => l.id !== id));
        } catch (err) {
            alert('Failed to delete link');
        }
    }

    async function handleUpdateLink(e: React.FormEvent) {
        e.preventDefault();
        if (!editingLink || !token) return;

        try {
            setIsSaving(true);
            setEditError(null);

            // Convert local input time to UTC ISO string for backend
            let expiresAtISO: string | undefined;
            if (editExpiresAt) {
                // editExpiresAt is "YYYY-MM-DDTHH:mm" (local)
                const localDate = new Date(editExpiresAt);
                expiresAtISO = localDate.toISOString();
            }

            const updated = await updateLink(token, editingLink.id, {
                original_url: editUrl,
                short_code: editSlug !== editingLink.short_code ? editSlug : undefined,
                password: shouldClearPassword ? "" : (editPassword || undefined),
                require_login: editRequireLogin,
                allowed_emails: editAllowedEmails || undefined,
                expires_at: expiresAtISO,
                is_active: editIsActive,
                track_activity: editTrackActivity
            });

            setLinks(links.map(l => l.id === updated.id ? updated : l));
            setEditingLink(null);
        } catch (err: any) {
            setEditError(err.message || 'Failed to update link');
        } finally {
            setIsSaving(false);
        }
    }

    function startEditing(link: Link) {
        setEditingLink(link);
        setEditUrl(link.original_url);
        setEditSlug(link.short_code);
        setEditPassword(''); // Don't show existing hash
        setEditRequireLogin(link.require_login);
        setEditAllowedEmails(link.allowed_emails || '');
        setEditIsActive(link.is_active);
        setEditTrackActivity(link.track_activity);

        // Convert UTC ISO string from backend to "YYYY-MM-DDTHH:mm" local time for input
        let localInputValue = '';
        if (link.expires_at) {
            // Ensure string is treated as UTC if it lacks timezone info
            const isoString = link.expires_at.endsWith('Z') ? link.expires_at : link.expires_at + 'Z';
            const date = new Date(isoString);

            // To get "YYYY-MM-DDTHH:mm" in local time, we need to manually format it
            // or use a trick with toISOString by shifting the time.
            // Manual formatting is safer.
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            localInputValue = `${year}-${month}-${day}T${hours}:${minutes}`;
        }
        setEditExpiresAt(localInputValue);

        setEditError(null);
    }

    function copyToClipboard(shortCode: string) {
        const domain = import.meta.env.VITE_SHORT_LINK_DOMAIN || 'localhost:3071';
        const protocol = import.meta.env.VITE_SHORT_LINK_DOMAIN?.includes('localhost') ? 'http' : 'https';
        const url = `${protocol}://${domain}/${shortCode}`;
        navigator.clipboard.writeText(url);
    }

    if (isLoading) return <div className="p-8 text-center text-white">Loading...</div>;

    // View for unapproved users
    if (!user?.is_approved && !user?.is_superuser) {
        return (
            <div className="min-h-screen bg-[#111] text-gray-100 font-sans">
                <Navbar user={user} />
                <main className="max-w-xl mx-auto px-4 py-20 text-center">
                    <div className="bg-[#1c1c1c] rounded-2xl shadow-xl border border-gray-800 p-10">
                        <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Access Restricted</h2>
                        <p className="text-gray-400 mb-8">
                            You need approval to create links on NoloLink.
                            {user?.request_status === 'pending' ? (
                                <span className="block mt-2 text-yellow-500 font-medium">Your request is currently pending approval.</span>
                            ) : user?.request_status === 'rejected' ? (
                                <span className="block mt-2 text-red-400 font-medium">Your request was rejected.</span>
                            ) : (
                                " Please request access below."
                            )}
                        </p>

                        {user?.request_status === 'pending' ? (
                            <button disabled className="w-full bg-gray-700 text-gray-400 font-medium py-3 px-4 rounded-xl cursor-not-allowed">
                                Request Pending
                            </button>
                        ) : (
                            <button
                                onClick={handleRequestAccess}
                                disabled={isRequesting}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-lg shadow-blue-900/20"
                            >
                                {isRequesting ? 'Submitting...' : 'Request Access'}
                            </button>
                        )}
                    </div>
                </main>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#111] text-gray-100 font-sans">
            <Navbar user={user} onToggleAdmin={() => setShowAdminPanel(!showAdminPanel)} showAdminToggle={user?.is_superuser} />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {showAdminPanel && user?.is_superuser ? (
                    <div className="mb-8">
                        <AdminPanel />
                    </div>
                ) : null}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Create Link */}
                    <div className="lg:col-span-1">
                        <div className="bg-[#1c1c1c] rounded-2xl shadow-xl border border-gray-800 p-6 sticky top-8">
                            <h2 className="text-xl font-bold mb-1 text-white">Create Link</h2>
                            <p className="text-gray-500 text-sm mb-6">Paste a long URL to shorten it.</p>

                            <form onSubmit={handleCreateLink} className="space-y-4">
                                <div>
                                    <label htmlFor="url" className="block text-sm font-medium text-gray-400 mb-1">Destination URL</label>
                                    <input
                                        id="url"
                                        type="url"
                                        value={newUrl}
                                        onChange={(e) => setNewUrl(e.target.value)}
                                        placeholder="https://example.com/..."
                                        required
                                        className="w-full bg-[#2a2a2a] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="slug" className="block text-sm font-medium text-gray-400 mb-1">Custom Alias (Optional)</label>
                                    <div className="flex items-center">
                                        <span className="bg-[#222] border border-r-0 border-gray-700 rounded-l-xl px-3 py-3 text-gray-500 text-sm">/</span>
                                        <input
                                            id="slug"
                                            type="text"
                                            value={createSlug}
                                            onChange={(e) => setCreateSlug(e.target.value)}
                                            placeholder="my-link"
                                            className="w-full bg-[#2a2a2a] border border-gray-700 rounded-r-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="border-t border-gray-800 pt-4 mt-2">
                                    <h3 className="text-sm font-semibold text-gray-300 mb-3">Access Control</h3>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-1">Password (Optional)</label>
                                            <input
                                                type="text"
                                                value={createPassword}
                                                onChange={(e) => setCreatePassword(e.target.value)}
                                                placeholder="Leave empty for none"
                                                className="w-full bg-[#2a2a2a] border border-gray-700 rounded-xl px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                                            />
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id="createRequireLogin"
                                                checked={createRequireLogin}
                                                onChange={(e) => setCreateRequireLogin(e.target.checked)}
                                                className="w-4 h-4 rounded border-gray-700 bg-[#2a2a2a] text-blue-500 focus:ring-blue-500"
                                            />
                                            <label htmlFor="createRequireLogin" className="text-sm text-gray-400">Require KeyN Login</label>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id="createTrackActivity"
                                                checked={createTrackActivity}
                                                onChange={(e) => setCreateTrackActivity(e.target.checked)}
                                                className="w-4 h-4 rounded border-gray-700 bg-[#2a2a2a] text-blue-500 focus:ring-blue-500"
                                            />
                                            <label htmlFor="createTrackActivity" className="text-sm text-gray-400">Enable Advanced Analytics</label>
                                        </div>

                                        {createRequireLogin && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-400 mb-1">Allowed Emails (Optional)</label>
                                                <input
                                                    type="text"
                                                    value={createAllowedEmails}
                                                    onChange={(e) => setCreateAllowedEmails(e.target.value)}
                                                    placeholder="bob@gmail.com, alice@keyn.com"
                                                    className="w-full bg-[#2a2a2a] border border-gray-700 rounded-xl px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                                                />
                                                <p className="text-xs text-gray-500 mt-1">Comma separated. Leave empty to allow any logged-in user.</p>
                                            </div>
                                        )}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-1">Expiration Date (Optional)</label>
                                            <input
                                                type="datetime-local"
                                                value={createExpiresAt}
                                                onChange={(e) => setCreateExpiresAt(e.target.value)}
                                                className="w-full bg-[#2a2a2a] border border-gray-700 rounded-xl px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={isCreating}
                                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 group"
                                >
                                    {isCreating ? 'Creating...' : 'Shorten URL'}
                                </button>
                                {createError && <p className="text-red-400 text-sm text-center bg-red-900/10 py-2 rounded-lg border border-red-900/20">{createError}</p>}
                            </form>
                        </div>
                    </div>

                    {/* Right Column: Links List */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex justify-between items-center mb-2">
                            <h2 className="text-xl font-bold text-white">Active Links</h2>
                            <span className="text-sm text-gray-500">{links.length} total</span>
                        </div>

                        {links.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 bg-[#1c1c1c] rounded-2xl border border-gray-800 border-dashed text-gray-500">
                                <p>No links yet. Create your first one!</p>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {links.map((link) => (
                                    <div key={link.id} className={`group bg-[#1c1c1c] hover:bg-[#252525] p-5 rounded-xl border transition-all duration-200 shadow-sm hover:shadow-md ${!link.is_active ? 'border-red-900/30 opacity-75' : 'border-gray-800 hover:border-gray-700'}`}>
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-1.5">
                                                    <a
                                                        href={`${import.meta.env.VITE_SHORT_LINK_DOMAIN?.includes('localhost') ? 'http' : 'https'}://${import.meta.env.VITE_SHORT_LINK_DOMAIN || 'localhost:3071'}/${link.short_code}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-lg font-bold text-blue-400 hover:text-blue-300 transition-colors tracking-tight font-mono"
                                                    >
                                                        {import.meta.env.VITE_SHORT_LINK_DOMAIN || 'localhost:3071'}/{link.short_code}
                                                    </a>
                                                    <button
                                                        onClick={() => copyToClipboard(link.short_code)}
                                                        className="text-gray-500 hover:text-white bg-gray-800/50 hover:bg-gray-700 p-1.5 rounded-md transition-all"
                                                        title="Copy"
                                                    >
                                                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                                                    </button>
                                                    {!link.is_active && (
                                                        <span className="w-fit ml-2 px-2 py-0.5 rounded-full bg-red-900/30 text-red-400 text-xs font-medium border border-red-900/50">
                                                            Disabled
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-gray-400 text-sm truncate pr-4" title={link.original_url}>
                                                    {link.original_url}
                                                </p>
                                                {link.expires_at && (
                                                    <div className="flex items-center gap-1 mt-2 text-xs text-yellow-500/80">
                                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        <span>Expires {new Date(link.expires_at.endsWith('Z') ? link.expires_at : link.expires_at + 'Z').toLocaleString()}</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-4 border-t sm:border-t-0 sm:border-l border-gray-800 pt-4 sm:pt-0 sm:pl-6 mt-2 sm:mt-0">
                                                <div className="text-center min-w-[60px]">
                                                    <div className="text-xl font-bold text-white">{link.clicks}</div>
                                                    <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">Clicks</div>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex gap-2 transition-opacity">
                                                    <button
                                                        onClick={() => startEditing(link)}
                                                        className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors border border-transparent hover:border-blue-400/20"
                                                        title="Edit"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteLink(link.id)}
                                                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors border border-transparent hover:border-red-400/20"
                                                        title="Delete"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    </button>
                                                    <RouterLink
                                                        to={`/stats/${link.short_code}`}
                                                        className="p-2 text-gray-400 hover:text-green-400 hover:bg-green-400/10 rounded-lg transition-colors border border-transparent hover:border-green-400/20"
                                                        title="Stats & QR"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                                        </svg>
                                                    </RouterLink>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Edit Modal */}
            {
                editingLink && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-[#1c1c1c] rounded-2xl shadow-2xl border border-gray-800 w-full max-w-lg p-6">
                            <h2 className="text-xl font-bold mb-6 text-white">Edit Link</h2>
                            <form onSubmit={handleUpdateLink} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Destination URL</label>
                                    <input
                                        type="url"
                                        value={editUrl}
                                        onChange={(e) => setEditUrl(e.target.value)}
                                        required
                                        className="w-full bg-[#2a2a2a] border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Custom Alias</label>
                                    <input
                                        type="text"
                                        value={editSlug}
                                        onChange={(e) => setEditSlug(e.target.value)}
                                        required
                                        className="w-full bg-[#2a2a2a] border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                </div>

                                <div className="border-t border-gray-700 pt-4 mt-2">
                                    <h3 className="text-sm font-semibold text-gray-300 mb-3">Settings</h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between p-3 bg-[#2a2a2a] rounded-xl border border-gray-700">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-white">Active Status</span>
                                                <span className="text-xs text-gray-400">Enable or disable this link</span>
                                            </div>
                                            <div className="relative inline-block w-12 mr-2 align-middle select-none">
                                                <input
                                                    type="checkbox"
                                                    name="toggle"
                                                    id="isActiveToggle"
                                                    checked={editIsActive}
                                                    onChange={(e) => setEditIsActive(e.target.checked)}
                                                    className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer transition-transform duration-200 ease-in-out checked:translate-x-full checked:border-blue-600"
                                                    style={{ top: 0, left: 0, marginTop: -2 }}
                                                />
                                                <label
                                                    htmlFor="isActiveToggle"
                                                    className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer transition-colors duration-200 ${editIsActive ? 'bg-blue-600' : 'bg-gray-600'}`}
                                                ></label>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between p-3 bg-[#2a2a2a] rounded-xl border border-gray-700">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-white">Advanced Analytics</span>
                                                <span className="text-xs text-gray-400">Track clicks, countries, and devices</span>
                                            </div>
                                            <div className="relative inline-block w-12 mr-2 align-middle select-none">
                                                <input
                                                    type="checkbox"
                                                    name="toggleAnalytics"
                                                    id="trackActivityToggle"
                                                    checked={editTrackActivity}
                                                    onChange={(e) => setEditTrackActivity(e.target.checked)}
                                                    className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer transition-transform duration-200 ease-in-out checked:translate-x-full checked:border-blue-600"
                                                    style={{ top: 0, left: 0, marginTop: -2 }}
                                                />
                                                <label
                                                    htmlFor="trackActivityToggle"
                                                    className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer transition-colors duration-200 ${editTrackActivity ? 'bg-blue-600' : 'bg-gray-600'}`}
                                                ></label>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-gray-700 pt-4 mt-2">
                                    <h3 className="text-sm font-semibold text-gray-300 mb-3">Access Control</h3>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-1">Update Password</label>
                                            <input
                                                type="text"
                                                value={editPassword}
                                                onChange={(e) => setEditPassword(e.target.value)}
                                                placeholder="Enter new password to update"
                                                className="w-full bg-[#2a2a2a] border border-gray-700 rounded-xl px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                                            />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id="clearPassword"
                                                checked={shouldClearPassword}
                                                onChange={(e) => {
                                                    setShouldClearPassword(e.target.checked);
                                                    if (e.target.checked) setEditPassword('');
                                                }}
                                                className="w-4 h-4 rounded border-gray-700 bg-[#2a2a2a] text-red-500 focus:ring-red-500"
                                            />
                                            <label htmlFor="clearPassword" className="text-sm text-red-400">Remove Password Protection</label>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id="editRequireLogin"
                                                checked={editRequireLogin}
                                                onChange={(e) => setEditRequireLogin(e.target.checked)}
                                                className="w-4 h-4 rounded border-gray-700 bg-[#2a2a2a] text-blue-500 focus:ring-blue-500"
                                            />
                                            <label htmlFor="editRequireLogin" className="text-sm text-gray-400">Require KeyN Login</label>
                                        </div>
                                        {editRequireLogin && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-400 mb-1">Allowed Emails</label>
                                                <input
                                                    type="text"
                                                    value={editAllowedEmails}
                                                    onChange={(e) => setEditAllowedEmails(e.target.value)}
                                                    placeholder="bob@gmail.com, alice@keyn.com"
                                                    className="w-full bg-[#2a2a2a] border border-gray-700 rounded-xl px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                                                />
                                            </div>
                                        )}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-1">Expiration Date</label>
                                            <input
                                                type="datetime-local"
                                                value={editExpiresAt}
                                                onChange={(e) => setEditExpiresAt(e.target.value)}
                                                className="w-full bg-[#2a2a2a] border border-gray-700 rounded-xl px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setEditingLink(null)}
                                        className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
                                    >
                                        {isSaving ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                                {editError && <p className="text-red-400 text-sm text-center">{editError}</p>}
                            </form>
                        </div>
                    </div>
                )
            }
        </div>
    );
}

function Navbar({ user, onToggleAdmin, showAdminToggle }: { user: any, onToggleAdmin?: () => void, showAdminToggle?: boolean }) {
    return (
        <nav className="border-b border-gray-800 bg-[#161616]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    <div className="flex items-center gap-2">
                        <div className="bg-linear-to-tr from-blue-500 to-purple-600 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">
                            N
                        </div>
                        <span className="text-xl font-bold bg-linear-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                            NoloLink
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        {user?.is_superuser && (
                            <>
                                <span className="bg-yellow-500/10 text-yellow-500 text-xs px-2 py-1 rounded-full border border-yellow-500/20 font-medium cursor-default">
                                    Superuser
                                </span>
                                {showAdminToggle && (
                                    <button
                                        onClick={onToggleAdmin}
                                        className="text-gray-400 hover:text-white text-sm font-medium transition-colors"
                                    >
                                        Admin Panel
                                    </button>
                                )}
                            </>
                        )}
                        <div className="flex items-center gap-3 bg-[#222] px-3 py-1.5 rounded-full border border-gray-700">
                            {user?.avatar_url ? (
                                <img src={user.avatar_url} alt={user.username} className="w-6 h-6 rounded-full" />
                            ) : (
                                <div className="w-6 h-6 rounded-full bg-linear-to-br from-gray-600 to-gray-800 flex items-center justify-center text-xs text-white">
                                    {user?.username?.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <span className="text-sm font-medium text-gray-300">{user?.username}</span>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    )
}

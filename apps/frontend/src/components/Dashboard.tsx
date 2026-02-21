import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchLinks, createLink, updateLink, deleteLink, fetchCampaigns, createCampaign, deleteCampaign, createLinksBulk, updateLinksBulk, exportLinksCSV, importLinksCSV, fetchAuditLogs } from '../lib/api';
import type { Link, Campaign, AuditLogEntry, ImportResult } from '../lib/api';

import Navbar from './Navbar';

const TriStateToggle = ({ label, value, onChange }: { label: string, value: boolean | null, onChange: (val: boolean | null) => void }) => (
    <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">{label}</label>
        <div className="flex bg-[#0f0f0f] rounded-xl p-1 border border-gray-800">
            <button
                type="button"
                onClick={() => onChange(null)}
                className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${value === null ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
            >
                No Change
            </button>
            <button
                type="button"
                onClick={() => onChange(true)}
                className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${value === true ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
            >
                Yes
            </button>
            <button
                type="button"
                onClick={() => onChange(false)}
                className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${value === false ? 'bg-red-900/30 text-red-200 border border-red-900/50 shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
            >
                No
            </button>
        </div>
    </div>
);

export default function Dashboard() {
    const { token, user, refreshProfile, currentOrg } = useAuth();
    const [links, setLinks] = useState<Link[]>([]);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);

    // Filtering State
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCampaignId, setFilterCampaignId] = useState<number | null>(null);
    const [filterStatus, setFilterStatus] = useState<boolean | null>(null); // null=all, true=active, false=inactive

    // Create State
    const [newUrl, setNewUrl] = useState('');
    const [createSlug, setCreateSlug] = useState('');
    const [createTitle, setCreateTitle] = useState('');
    const [createTags, setCreateTags] = useState('');
    const [createRedirectType, setCreateRedirectType] = useState(302);
    const [createPassword, setCreatePassword] = useState('');
    const [createRequireLogin, setCreateRequireLogin] = useState(false);
    const [createAllowedEmails, setCreateAllowedEmails] = useState('');
    const [createExpiresAt, setCreateExpiresAt] = useState('');
    const [createTrackActivity, setCreateTrackActivity] = useState(true);
    const [createCampaignId, setCreateCampaignId] = useState<number | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);
    const [createUtmSource, setCreateUtmSource] = useState('');
    const [createUtmMedium, setCreateUtmMedium] = useState('');
    const [createUtmCampaign, setCreateUtmCampaign] = useState('');
    const [createUtmTerm, setCreateUtmTerm] = useState('');
    const [createUtmContent, setCreateUtmContent] = useState('');
    const [showCreateUtm, setShowCreateUtm] = useState(false);

    // Bulk Create State
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [bulkUrls, setBulkUrls] = useState('');
    const [isBulkCreating, setIsBulkCreating] = useState(false);

    // Bulk Edit State
    const [selectedLinkIds, setSelectedLinkIds] = useState<Set<number>>(new Set());
    const [showBulkEditModal, setShowBulkEditModal] = useState(false);
    const [isBulkSaving, setIsBulkSaving] = useState(false);

    // Bulk Edit Form State
    const [bulkEditCampaignId, setBulkEditCampaignId] = useState<number | number | null>(null); // -1 for clear
    const [bulkEditTags, setBulkEditTags] = useState('');
    const [bulkEditIsActive, setBulkEditIsActive] = useState<boolean | null>(null);
    const [bulkEditRequireLogin, setBulkEditRequireLogin] = useState<boolean | null>(null);
    const [bulkEditTrackActivity, setBulkEditTrackActivity] = useState<boolean | null>(null);
    const [bulkEditRedirectType, setBulkEditRedirectType] = useState<number | null>(null);
    const [bulkEditExpiresAt, setBulkEditExpiresAt] = useState('');
    const [bulkEditError, setBulkEditError] = useState<string | null>(null);
    const [bulkEditUtmSource, setBulkEditUtmSource] = useState('');
    const [bulkEditUtmMedium, setBulkEditUtmMedium] = useState('');
    const [bulkEditUtmCampaign, setBulkEditUtmCampaign] = useState('');
    const [bulkEditUtmTerm, setBulkEditUtmTerm] = useState('');
    const [bulkEditUtmContent, setBulkEditUtmContent] = useState('');
    const [showBulkEditUtm, setShowBulkEditUtm] = useState(false);

    // Edit State
    const [editingLink, setEditingLink] = useState<Link | null>(null);
    const [editUrl, setEditUrl] = useState('');
    const [editSlug, setEditSlug] = useState('');
    const [editTitle, setEditTitle] = useState('');
    const [editTags, setEditTags] = useState('');
    const [editRedirectType, setEditRedirectType] = useState(302);
    const [editCampaignId, setEditCampaignId] = useState<number | null>(null);
    const [editPassword, setEditPassword] = useState('');
    const [editRequireLogin, setEditRequireLogin] = useState(false);
    const [editAllowedEmails, setEditAllowedEmails] = useState('');
    const [editExpiresAt, setEditExpiresAt] = useState('');
    const [editIsActive, setEditIsActive] = useState(true);
    const [editTrackActivity, setEditTrackActivity] = useState(true);
    const [shouldClearPassword, setShouldClearPassword] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editError, setEditError] = useState<string | null>(null);
    const [editUtmSource, setEditUtmSource] = useState('');
    const [editUtmMedium, setEditUtmMedium] = useState('');
    const [editUtmCampaign, setEditUtmCampaign] = useState('');
    const [editUtmTerm, setEditUtmTerm] = useState('');
    const [editUtmContent, setEditUtmContent] = useState('');
    const [showEditUtm, setShowEditUtm] = useState(false);

    // Campaign Manager State
    const [newCampaignName, setNewCampaignName] = useState('');
    const [isCreatingCampaign, setIsCreatingCampaign] = useState(false);

    // Request Access State
    const [isRequesting, setIsRequesting] = useState(false);


    // CSV Import/Export State
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [importResult, setImportResult] = useState<ImportResult | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Activity Log State
    const [showActivityLog, setShowActivityLog] = useState(false);
    const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
    const [isLoadingLogs, setIsLoadingLogs] = useState(false);
    const [auditFilter, setAuditFilter] = useState('');
    const [expandedLogId, setExpandedLogId] = useState<number | null>(null);

    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (token && currentOrg && (user?.is_approved || user?.is_superuser)) {
            loadData();
        } else if (!currentOrg) {
            // Org not loaded yet, keep showing loading
        } else {
            setIsLoading(false);
        }
    }, [token, user?.is_approved, user?.is_superuser, currentOrg]);

    async function loadData() {
        try {
            if (!token) return;
            setIsLoading(true);
            const [linksData, campaignsData] = await Promise.all([
                fetchLinks(token, {
                    search: searchQuery,
                    campaign_id: filterCampaignId || undefined,
                    is_active: filterStatus === null ? undefined : filterStatus
                }),
                fetchCampaigns(token)
            ]);
            setLinks(linksData);
            setCampaigns(campaignsData);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        if (token && currentOrg && (user?.is_approved || user?.is_superuser)) {
            loadData();
        } else if (!currentOrg) {
            // Org not loaded yet, keep showing loading
        } else {
            setIsLoading(false);
        }
    }, [token, user?.is_approved, user?.is_superuser, currentOrg, searchQuery, filterCampaignId, filterStatus]);

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
                track_activity: createTrackActivity,
                title: createTitle || undefined,
                tags: createTags || undefined,
                redirect_type: createRedirectType,
                campaign_id: createCampaignId || undefined,
                utm_source: createUtmSource || undefined,
                utm_medium: createUtmMedium || undefined,
                utm_campaign: createUtmCampaign || undefined,
                utm_term: createUtmTerm || undefined,
                utm_content: createUtmContent || undefined
            });
            setLinks([created, ...links]);
            setNewUrl('');
            setCreateSlug('');
            setCreateTitle('');
            setCreateTags('');
            setCreateRedirectType(302);
            setCreateCampaignId(null);
            setCreatePassword('');
            setCreateRequireLogin(false);
            setCreateAllowedEmails('');
            setCreateExpiresAt('');
            setCreateTrackActivity(true);
            setCreateUtmSource('');
            setCreateUtmMedium('');
            setCreateUtmCampaign('');
            setCreateUtmTerm('');
            setCreateUtmContent('');
            setShowCreateUtm(false);
        } catch (err: any) {
            setCreateError(err.message || 'Failed to create link');
        } finally {
            setIsCreating(false);
        }
    }

    async function handleCreateCampaign(e: React.FormEvent) {
        e.preventDefault();
        if (!newCampaignName.trim() || !token) return;
        try {
            setIsCreatingCampaign(true);
            const campaign = await createCampaign(token, newCampaignName);
            setCampaigns([...campaigns, campaign]);
            setNewCampaignName('');
        } catch (err) {
            alert('Failed to create campaign');
        } finally {
            setIsCreatingCampaign(false);
        }
    }

    async function handleDeleteCampaign(id: number) {
        if (!confirm('Are you sure? This will NOT delete the links, just untag them.')) return;
        if (!token) return;
        try {
            await deleteCampaign(token, id);
            setCampaigns(campaigns.filter(c => c.id !== id));
            if (filterCampaignId === id) setFilterCampaignId(null);
        } catch (err) {
            alert('Failed to delete campaign');
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
                track_activity: editTrackActivity,
                title: editTitle || undefined,
                tags: editTags || undefined,
                redirect_type: editRedirectType,
                campaign_id: editCampaignId || undefined,
                utm_source: editUtmSource || undefined,
                utm_medium: editUtmMedium || undefined,
                utm_campaign: editUtmCampaign || undefined,
                utm_term: editUtmTerm || undefined,
                utm_content: editUtmContent || undefined
            });

            setLinks(links.map(l => l.id === updated.id ? updated : l));
            setEditingLink(null);
        } catch (err: any) {
            setEditError(err.message || 'Failed to update link');
        } finally {
            setIsSaving(false);
        }
    }

    // Bulk Selection Helpers
    function toggleLinkSelection(id: number) {
        const newSelected = new Set(selectedLinkIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedLinkIds(newSelected);
    }

    function toggleSelectAll() {
        if (selectedLinkIds.size === links.length && links.length > 0) {
            setSelectedLinkIds(new Set());
        } else {
            setSelectedLinkIds(new Set(links.map(l => l.id)));
        }
    }

    async function handleBulkUpdate(e: React.FormEvent) {
        e.preventDefault();
        if (selectedLinkIds.size === 0 || !token) return;

        try {
            setIsBulkSaving(true);
            setBulkEditError(null);

            // Convert local input time to UTC ISO string for backend
            let expiresAtISO: string | undefined;
            if (bulkEditExpiresAt) {
                const localDate = new Date(bulkEditExpiresAt);
                expiresAtISO = localDate.toISOString();
            }

            await updateLinksBulk(token, Array.from(selectedLinkIds), {
                campaign_id: bulkEditCampaignId === null ? undefined : bulkEditCampaignId,
                tags: bulkEditTags || undefined,
                is_active: bulkEditIsActive === null ? undefined : bulkEditIsActive,
                require_login: bulkEditRequireLogin === null ? undefined : bulkEditRequireLogin,
                track_activity: bulkEditTrackActivity === null ? undefined : bulkEditTrackActivity,
                redirect_type: bulkEditRedirectType === null ? undefined : bulkEditRedirectType,
                expires_at: expiresAtISO,
                utm_source: bulkEditUtmSource || undefined,
                utm_medium: bulkEditUtmMedium || undefined,
                utm_campaign: bulkEditUtmCampaign || undefined,
                utm_term: bulkEditUtmTerm || undefined,
                utm_content: bulkEditUtmContent || undefined
            });

            // Reload data to reflect changes
            await loadData();

            // Reset state
            setSelectedLinkIds(new Set());
            setShowBulkEditModal(false);
            setBulkEditCampaignId(null);
            setBulkEditTags('');
            setBulkEditIsActive(null);
            setBulkEditRequireLogin(null);
            setBulkEditTrackActivity(null);
            setBulkEditTrackActivity(null);
            setBulkEditRedirectType(null);
            setBulkEditExpiresAt('');
            setBulkEditUtmSource('');
            setBulkEditUtmMedium('');
            setBulkEditUtmCampaign('');
            setBulkEditUtmTerm('');
            setBulkEditUtmContent('');
            setShowBulkEditUtm(false);

        } catch (err: any) {
            setBulkEditError(err.message || 'Failed to update links');
        } finally {
            setIsBulkSaving(false);
        }
    }

    function startEditing(link: Link) {
        setEditingLink(link);
        setEditUrl(link.original_url);
        setEditSlug(link.short_code);
        setEditTitle(link.title || '');
        setEditTags(link.tags || '');
        setEditRedirectType(link.redirect_type || 302);
        setEditCampaignId(link.campaign_id || null);
        setEditPassword(''); // Don't show existing hash
        setEditRequireLogin(link.require_login);
        setEditAllowedEmails(link.allowed_emails || '');
        setEditIsActive(link.is_active);
        setEditTrackActivity(link.track_activity);
        setEditUtmSource(link.utm_source || '');
        setEditUtmMedium(link.utm_medium || '');
        setEditUtmCampaign(link.utm_campaign || '');
        setEditUtmTerm(link.utm_term || '');
        setEditUtmContent(link.utm_content || '');
        setShowEditUtm(false);

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

    // CSV Export/Import Handlers
    async function handleExportCSV() {
        if (!token) return;
        try {
            setIsExporting(true);
            await exportLinksCSV(token);
        } catch (err) {
            alert('Failed to export links');
        } finally {
            setIsExporting(false);
        }
    }

    async function handleImportCSV(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file || !token) return;
        try {
            setIsImporting(true);
            setImportResult(null);
            const result = await importLinksCSV(token, file);
            setImportResult(result);
            await loadData(); // Refresh links
        } catch (err: any) {
            alert(err.message || 'Failed to import links');
        } finally {
            setIsImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    }

    // Activity Log Handler
    async function loadAuditLogs() {
        if (!token) return;
        try {
            setIsLoadingLogs(true);
            const logs = await fetchAuditLogs(token, {
                action: auditFilter || undefined
            });
            setAuditLogs(logs);
        } catch (err) {
            console.error('Failed to load audit logs', err);
        } finally {
            setIsLoadingLogs(false);
        }
    }

    useEffect(() => {
        if (showActivityLog && token) {
            loadAuditLogs();
        }
    }, [showActivityLog, auditFilter]);

    if (isLoading) return <div className="p-8 text-center text-white">Loading...</div>;

    // View for unapproved users
    if (!user?.is_approved && !user?.is_superuser) {
        return (
            <div className="min-h-screen bg-[#111] text-gray-100 font-sans">
                <Navbar />
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
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-lg shadow-blue-900/20 hover:scale-105 active:scale-95 duration-200"
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
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Campaigns & Create Link */}
                    <div className="lg:col-span-1 space-y-8">
                        {/* Campaigns */}
                        <div className="bg-[#1c1c1c] rounded-2xl shadow-xl border border-gray-800 p-6">
                            <h2 className="text-xl font-bold mb-4 text-white">Campaigns</h2>
                            <div className="space-y-2 mb-4">
                                <button
                                    onClick={() => setFilterCampaignId(null)}
                                    className={`w-full text-left px-4 py-2 rounded-xl transition-all ${filterCampaignId === null ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30' : 'hover:bg-gray-800 text-gray-400'}`}
                                >
                                    All Links
                                </button>
                                {campaigns.map(c => (
                                    <div key={c.id} className="group flex items-center gap-2">
                                        <button
                                            onClick={() => setFilterCampaignId(c.id)}
                                            className={`flex-1 text-left px-4 py-2 rounded-xl transition-all truncate ${filterCampaignId === c.id ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30' : 'hover:bg-gray-800 text-gray-400'}`}
                                        >
                                            {c.name}
                                        </button>
                                        <button
                                            onClick={() => handleDeleteCampaign(c.id)}
                                            className="opacity-0 group-hover:opacity-100 p-2 text-gray-600 hover:text-red-400 transition-all"
                                            title="Delete Campaign"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <form onSubmit={handleCreateCampaign} className="flex gap-2">
                                <input
                                    type="text"
                                    value={newCampaignName}
                                    onChange={(e) => setNewCampaignName(e.target.value)}
                                    placeholder="New Campaign..."
                                    className="flex-1 bg-[#2a2a2a] border border-gray-700 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <button
                                    type="submit"
                                    disabled={isCreatingCampaign || !newCampaignName.trim()}
                                    className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-all disabled:opacity-50"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                </button>
                            </form>
                        </div>

                        {/* Create Link Card */}
                        <div className="bg-[#1c1c1c] rounded-2xl shadow-xl border border-gray-800 p-6 sticky top-8 transition-all hover:shadow-lg hover:shadow-blue-900/20 hover:border-blue-500/30 duration-300">
                            <h2 className="text-xl font-bold mb-1 text-white">Create Link</h2>
                            <p className="text-gray-500 text-sm mb-6">Paste a long URL to shorten it.</p>

                            <form onSubmit={handleCreateLink} className="space-y-4">
                                <div>
                                    <div className="flex justify-end mb-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowBulkModal(true)}
                                            className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
                                        >
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                                            Bulk Create
                                        </button>
                                    </div>
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

                                {campaigns.length > 0 && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">Campaign</label>
                                        <select
                                            value={createCampaignId || ''}
                                            onChange={(e) => setCreateCampaignId(e.target.value ? Number(e.target.value) : null)}
                                            className="w-full bg-[#2a2a2a] border border-gray-700 rounded-xl px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                                        >
                                            <option value="">No Campaign</option>
                                            {campaigns.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
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

                                <div>
                                    <label htmlFor="title" className="block text-sm font-medium text-gray-400 mb-1">Title (Optional)</label>
                                    <input
                                        id="title"
                                        type="text"
                                        value={createTitle}
                                        onChange={(e) => setCreateTitle(e.target.value)}
                                        placeholder="My Cool Link"
                                        className="w-full bg-[#2a2a2a] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="tags" className="block text-sm font-medium text-gray-400 mb-1">Tags</label>
                                    <input
                                        id="tags"
                                        type="text"
                                        value={createTags}
                                        onChange={(e) => setCreateTags(e.target.value)}
                                        placeholder="blog, personal, tech"
                                        className="w-full bg-[#2a2a2a] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    />
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
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-1">Redirect Type</label>
                                            <select
                                                value={createRedirectType}
                                                onChange={(e) => setCreateRedirectType(Number(e.target.value))}
                                                className="w-full bg-[#2a2a2a] border border-gray-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                                            >
                                                <option value={301}>301 Moved Permanently (SEO)</option>
                                                <option value={302}>302 Found (Temporary)</option>
                                                <option value={307}>307 Temporary Redirect</option>
                                                <option value={308}>308 Permanent Redirect</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-gray-800 pt-4 mt-2">
                                    <div
                                        className="flex items-center justify-between cursor-pointer group mb-3"
                                        onClick={() => setShowCreateUtm(!showCreateUtm)}
                                    >
                                        <h3 className="text-sm font-semibold text-gray-300">UTM Parameters</h3>
                                        <svg className={`w-4 h-4 text-gray-500 group-hover:text-blue-400 transition-transform ${showCreateUtm ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>

                                    {showCreateUtm && (
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-400 mb-1">Source</label>
                                                <input
                                                    type="text"
                                                    value={createUtmSource}
                                                    onChange={(e) => setCreateUtmSource(e.target.value)}
                                                    placeholder="google, newsletter"
                                                    className="w-full bg-[#2a2a2a] border border-gray-700 rounded-xl px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-400 mb-1">Medium</label>
                                                <input
                                                    type="text"
                                                    value={createUtmMedium}
                                                    onChange={(e) => setCreateUtmMedium(e.target.value)}
                                                    placeholder="cpc, email"
                                                    className="w-full bg-[#2a2a2a] border border-gray-700 rounded-xl px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-400 mb-1">Campaign</label>
                                                <input
                                                    type="text"
                                                    value={createUtmCampaign}
                                                    onChange={(e) => setCreateUtmCampaign(e.target.value)}
                                                    placeholder="summer_sale"
                                                    className="w-full bg-[#2a2a2a] border border-gray-700 rounded-xl px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-400 mb-1">Term</label>
                                                <input
                                                    type="text"
                                                    value={createUtmTerm}
                                                    onChange={(e) => setCreateUtmTerm(e.target.value)}
                                                    placeholder="running+shoes"
                                                    className="w-full bg-[#2a2a2a] border border-gray-700 rounded-xl px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-400 mb-1">Content</label>
                                                <input
                                                    type="text"
                                                    value={createUtmContent}
                                                    onChange={(e) => setCreateUtmContent(e.target.value)}
                                                    placeholder="logotype_ad"
                                                    className="w-full bg-[#2a2a2a] border border-gray-700 rounded-xl px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={isCreating}
                                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 group hover:scale-105 active:scale-95"
                                >
                                    {isCreating ? 'Creating...' : 'Shorten URL'}
                                </button>
                                {createError && <p className="text-red-400 text-sm text-center bg-red-900/10 py-2 rounded-lg border border-red-900/20">{createError}</p>}
                            </form>
                        </div>
                    </div>

                    {/* Right Column: Links List */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
                            <div className="flex items-center gap-4">
                                <div>
                                    <h2 className="text-xl font-bold text-white">Active Links</h2>
                                    <span className="text-sm text-gray-500">{links.length} results</span>
                                </div>
                                <div className="flex gap-1">
                                    <button
                                        onClick={handleExportCSV}
                                        disabled={isExporting}
                                        className="p-2 text-gray-400 hover:text-green-400 hover:bg-green-400/10 rounded-lg transition-colors border border-transparent hover:border-green-400/20"
                                        title="Export CSV"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isImporting}
                                        className="p-2 text-gray-400 hover:text-purple-400 hover:bg-purple-400/10 rounded-lg transition-colors border border-transparent hover:border-purple-400/20"
                                        title="Import CSV"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                        </svg>
                                    </button>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".csv"
                                        onChange={handleImportCSV}
                                        className="hidden"
                                    />
                                    <button
                                        onClick={() => setShowActivityLog(!showActivityLog)}
                                        className={`p-2 rounded-lg transition-colors border border-transparent ${showActivityLog ? 'text-amber-400 bg-amber-400/10 border-amber-400/20' : 'text-gray-400 hover:text-amber-400 hover:bg-amber-400/10 hover:border-amber-400/20'}`}
                                        title="Activity Log"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            <div className="flex gap-2 w-full sm:w-auto">
                                {links.length > 0 && (
                                    <div
                                        className="flex items-center gap-2 mr-2 cursor-pointer group"
                                        onClick={toggleSelectAll}
                                    >
                                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${selectedLinkIds.size === links.length && links.length > 0 ? 'bg-blue-600 border-blue-600' : 'bg-[#1c1c1c] border-gray-700 group-hover:border-gray-600'}`}>
                                            {selectedLinkIds.size === links.length && links.length > 0 && (
                                                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </div>
                                        <span className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">Select All</span>
                                    </div>
                                )}
                                <div className="relative flex-1 sm:flex-initial">
                                    <input
                                        type="text"
                                        placeholder="Search links..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full sm:w-64 bg-[#1c1c1c] border border-gray-700 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <svg className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <select
                                    value={filterStatus === null ? '' : String(filterStatus)}
                                    onChange={(e) => setFilterStatus(e.target.value === '' ? null : e.target.value === 'true')}
                                    className="bg-[#1c1c1c] border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">All Status</option>
                                    <option value="true">Active</option>
                                    <option value="false">Disabled</option>
                                </select>
                            </div>
                        </div>

                        {/* Import Result Banner */}
                        {importResult && (
                            <div className="mb-4 p-4 rounded-xl border bg-[#1c1c1c] border-gray-800">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-white font-medium">Import Complete</p>
                                        <p className="text-sm text-gray-400 mt-1">
                                            <span className="text-green-400 font-medium">{importResult.created}</span> created
                                            {importResult.skipped > 0 && (<>, <span className="text-yellow-400 font-medium">{importResult.skipped}</span> skipped</>)}
                                        </p>
                                        {importResult.errors.length > 0 && (
                                            <ul className="mt-2 space-y-1">
                                                {importResult.errors.slice(0, 5).map((err, i) => (
                                                    <li key={i} className="text-xs text-gray-500">{err}</li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                    <button onClick={() => setImportResult(null)} className="text-gray-500 hover:text-gray-300 text-sm">✕</button>
                                </div>
                            </div>
                        )}

                        {/* Activity Log Panel */}
                        {showActivityLog && (
                            <div className="mb-6 bg-[#1c1c1c] rounded-2xl border border-gray-800 overflow-hidden">
                                <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                                    <h3 className="text-lg font-bold text-white">Activity Log</h3>
                                    <select
                                        value={auditFilter}
                                        onChange={(e) => setAuditFilter(e.target.value)}
                                        className="bg-[#2a2a2a] border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">All Actions</option>
                                        <option value="create">Created</option>
                                        <option value="update">Updated</option>
                                        <option value="delete">Deleted</option>
                                    </select>
                                </div>
                                <div className="max-h-80 overflow-y-auto">
                                    {isLoadingLogs ? (
                                        <div className="p-6 text-center text-gray-500">Loading activity...</div>
                                    ) : auditLogs.length === 0 ? (
                                        <div className="p-6 text-center text-gray-500">No activity recorded yet.</div>
                                    ) : (
                                        <div className="divide-y divide-gray-800/50">
                                            {auditLogs.map(log => {
                                                let details: Record<string, any> = {};
                                                try { details = log.details ? JSON.parse(log.details) : {}; } catch { }
                                                const actionColors: Record<string, string> = {
                                                    create: 'text-green-400 bg-green-400/10 border-green-400/20',
                                                    update: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
                                                    delete: 'text-red-400 bg-red-400/10 border-red-400/20',
                                                };
                                                return (
                                                    <div key={log.id}>
                                                        <div
                                                            className="px-4 py-3 flex items-center gap-3 hover:bg-[#252525] transition-colors cursor-pointer"
                                                            onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                                                        >
                                                            <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium border ${actionColors[log.action] || 'text-gray-400 bg-gray-400/10 border-gray-400/20'}`}>
                                                                {log.action}
                                                            </span>
                                                            <div className="flex-1 min-w-0">
                                                                <span className="text-sm text-white">
                                                                    {log.target_type === 'link' && details.short_code
                                                                        ? <span className="font-mono text-blue-300">/{details.short_code}</span>
                                                                        : log.target_type === 'campaign' && details.name
                                                                            ? <span className="text-purple-300">{details.name}</span>
                                                                            : <span>{log.target_type} #{log.target_id}</span>
                                                                    }
                                                                </span>
                                                                {details.bulk_update && (
                                                                    <span className="text-xs text-purple-400 ml-2">(bulk)</span>
                                                                )}
                                                            </div>
                                                            {log.username && (
                                                                <span className="text-xs text-gray-500">@{log.username}</span>
                                                            )}
                                                            <span className="text-xs text-gray-600 whitespace-nowrap">
                                                                {new Date(log.timestamp).toLocaleString()}
                                                            </span>
                                                            <svg className={`w-3.5 h-3.5 text-gray-600 shrink-0 transition-transform ${expandedLogId === log.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                            </svg>
                                                        </div>
                                                        {expandedLogId === log.id && details.summary && (
                                                            <div className="px-4 pb-3 pl-18">
                                                                <p className="text-xs text-gray-400 leading-relaxed">{details.summary}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {links.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 bg-[#1c1c1c] rounded-2xl border border-gray-800 border-dashed text-gray-500">
                                <p>No links yet. Create your first one!</p>
                            </div>
                        ) : (
                            <div className="grid gap-4 pb-20">
                                {links.map((link) => (
                                    <div key={link.id} className={`group bg-[#1c1c1c] hover:bg-[#252525] p-5 rounded-xl border transition-all duration-200 shadow-sm hover:shadow-md hover:scale-[1.01] ${!link.is_active ? 'border-red-900/30 opacity-75' : 'border-gray-800 hover:border-gray-700'} ${selectedLinkIds.has(link.id) ? 'ring-2 ring-blue-500/50' : ''}`}>
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div className="flex items-start gap-4 flex-1 min-w-0">
                                                <div className="pt-1.5" onClick={() => toggleLinkSelection(link.id)}>
                                                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center cursor-pointer transition-all ${selectedLinkIds.has(link.id) ? 'bg-blue-600 border-blue-600' : 'bg-[#2a2a2a] border-gray-700 hover:border-gray-500'}`}>
                                                        {selectedLinkIds.has(link.id) && (
                                                            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                </div>
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
                                                        {link.campaign_id && campaigns.find(c => c.id === link.campaign_id) && (
                                                            <span
                                                                className="w-fit ml-2 px-2 py-0.5 rounded-full bg-blue-900/30 text-blue-400 text-xs font-medium border border-blue-900/50 cursor-pointer hover:bg-blue-900/50"
                                                                onClick={() => setFilterCampaignId(link.campaign_id!)}
                                                            >
                                                                {campaigns.find(c => c.id === link.campaign_id)?.name}
                                                            </span>
                                                        )}
                                                        {link.title && <span className="text-white font-medium ml-2">- {link.title}</span>}
                                                    </div>
                                                    <p className="text-gray-400 text-sm truncate pr-4" title={link.original_url}>
                                                        {link.original_url}
                                                    </p>
                                                    {link.tags && (
                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                            {link.tags.split(',').map((tag, i) => (
                                                                <span key={i} className="px-2 py-0.5 rounded-md bg-gray-800 text-xs text-gray-400 border border-gray-700">
                                                                    {tag.trim()}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {link.expires_at && (
                                                        <div className="flex items-center gap-1 mt-2 text-xs text-yellow-500/80">
                                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            <span>Expires {new Date(link.expires_at.endsWith('Z') ? link.expires_at : link.expires_at + 'Z').toLocaleString()}</span>
                                                        </div>
                                                    )}
                                                </div>
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

            {/* Bulk Actions Floating Bar */}
            {selectedLinkIds.size > 0 && (
                <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 bg-[#1c1c1c] border border-gray-700 shadow-2xl rounded-xl px-6 py-3 flex items-center gap-6 animate-fade-in-up">
                    <span className="text-white font-medium">{selectedLinkIds.size} Selected</span>
                    <div className="h-6 w-px bg-gray-700"></div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowBulkEditModal(true)}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                            Bulk Edit
                        </button>
                        <button
                            onClick={() => setSelectedLinkIds(new Set())}
                            className="text-gray-400 hover:text-gray-200 px-3 py-2 text-sm font-medium transition-colors"
                        >
                            Deselect All
                        </button>
                    </div>
                </div>
            )}

            {/* Bulk Create Modal */}
            {
                showBulkModal && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-[#1c1c1c] rounded-2xl shadow-2xl border border-gray-800 w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
                            <h2 className="text-xl font-bold mb-4 text-white">Bulk Create Links</h2>
                            <p className="text-gray-400 text-sm mb-4">
                                Enter one URL per line. Each line will create a separate short link with default settings.
                            </p>

                            <textarea
                                value={bulkUrls}
                                onChange={(e) => setBulkUrls(e.target.value)}
                                placeholder={`https://example.com/page1\nhttps://example.com/page2\n...`}
                                className="w-full h-64 bg-[#2a2a2a] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm mb-4"
                            />

                            {campaigns.length > 0 && (
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Assign to Campaign (Optional)</label>
                                    <select
                                        value={createCampaignId || ''}
                                        onChange={(e) => setCreateCampaignId(e.target.value ? Number(e.target.value) : null)}
                                        className="w-full bg-[#2a2a2a] border border-gray-700 rounded-xl px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                                    >
                                        <option value="">No Campaign</option>
                                        {campaigns.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowBulkModal(false)}
                                    className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={async () => {
                                        if (!bulkUrls.trim()) return;
                                        try {
                                            setIsBulkCreating(true);
                                            const urls = bulkUrls.split('\n').map(u => u.trim()).filter(u => u);
                                            const linksToCreate = urls.map(url => ({
                                                original_url: url,
                                                campaign_id: createCampaignId || undefined,
                                                redirect_type: 302
                                            }));

                                            await createLinksBulk(token!, linksToCreate);
                                            await loadData(); // Reload all data
                                            setBulkUrls('');
                                            setShowBulkModal(false);
                                        } catch (err) {
                                            alert('Failed to create bulk links');
                                        } finally {
                                            setIsBulkCreating(false);
                                        }
                                    }}
                                    disabled={isBulkCreating || !bulkUrls.trim()}
                                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all disabled:opacity-50"
                                >
                                    {isBulkCreating ? 'Creating...' : `Create ${bulkUrls.split('\n').filter(u => u.trim()).length} Links`}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Edit Modal */}
            {
                editingLink && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-[#1c1c1c] rounded-2xl shadow-2xl border border-gray-800 w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
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
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Title</label>
                                    <input
                                        type="text"
                                        value={editTitle}
                                        onChange={(e) => setEditTitle(e.target.value)}
                                        className="w-full bg-[#2a2a2a] border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Tags</label>
                                    <input
                                        type="text"
                                        value={editTags}
                                        onChange={(e) => setEditTags(e.target.value)}
                                        placeholder="Comma separated"
                                        className="w-full bg-[#2a2a2a] border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                </div>

                                <div className="border-t border-gray-700 pt-4 mt-2">
                                    <h3 className="text-sm font-semibold text-gray-300 mb-3">Settings</h3>
                                    <div className="space-y-3">
                                        {campaigns.length > 0 && (
                                            <div className="flex items-center justify-between p-3 bg-[#2a2a2a] rounded-xl border border-gray-700">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-white">Campaign</span>
                                                    <span className="text-xs text-gray-400">Group this link</span>
                                                </div>
                                                <select
                                                    value={editCampaignId || ''}
                                                    onChange={(e) => setEditCampaignId(e.target.value ? Number(e.target.value) : null)}
                                                    className="bg-[#1c1c1c] border border-gray-600 rounded-lg px-2 py-1 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 w-40"
                                                >
                                                    <option value="">None</option>
                                                    {campaigns.map(c => (
                                                        <option key={c.id} value={c.id}>{c.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

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

                                        <div className="flex items-center justify-between p-3 bg-[#2a2a2a] rounded-xl border border-gray-700">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-white">Redirect Type</span>
                                                <span className="text-xs text-gray-400">HTTP Status Code</span>
                                            </div>
                                            <select
                                                value={editRedirectType}
                                                onChange={(e) => setEditRedirectType(Number(e.target.value))}
                                                className="bg-[#1c1c1c] border border-gray-600 rounded-lg px-2 py-1 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            >
                                                <option value={301}>301 (SEO)</option>
                                                <option value={302}>302 (Temp)</option>
                                                <option value={307}>307 (Temp)</option>
                                                <option value={308}>308 (Perm)</option>
                                            </select>
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

                                <div className="border-t border-gray-700 pt-4 mt-2">
                                    <div
                                        className="flex items-center justify-between cursor-pointer group mb-3"
                                        onClick={() => setShowEditUtm(!showEditUtm)}
                                    >
                                        <h3 className="text-sm font-semibold text-gray-300">UTM Parameters</h3>
                                        <svg className={`w-4 h-4 text-gray-500 group-hover:text-blue-400 transition-transform ${showEditUtm ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>

                                    {showEditUtm && (
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-400 mb-1">Source</label>
                                                <input
                                                    type="text"
                                                    value={editUtmSource}
                                                    onChange={(e) => setEditUtmSource(e.target.value)}
                                                    placeholder="google, newsletter"
                                                    className="w-full bg-[#2a2a2a] border border-gray-700 rounded-xl px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-400 mb-1">Medium</label>
                                                <input
                                                    type="text"
                                                    value={editUtmMedium}
                                                    onChange={(e) => setEditUtmMedium(e.target.value)}
                                                    placeholder="cpc, email"
                                                    className="w-full bg-[#2a2a2a] border border-gray-700 rounded-xl px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-400 mb-1">Campaign</label>
                                                <input
                                                    type="text"
                                                    value={editUtmCampaign}
                                                    onChange={(e) => setEditUtmCampaign(e.target.value)}
                                                    placeholder="summer_sale"
                                                    className="w-full bg-[#2a2a2a] border border-gray-700 rounded-xl px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-400 mb-1">Term</label>
                                                <input
                                                    type="text"
                                                    value={editUtmTerm}
                                                    onChange={(e) => setEditUtmTerm(e.target.value)}
                                                    placeholder="running+shoes"
                                                    className="w-full bg-[#2a2a2a] border border-gray-700 rounded-xl px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-400 mb-1">Content</label>
                                                <input
                                                    type="text"
                                                    value={editUtmContent}
                                                    onChange={(e) => setEditUtmContent(e.target.value)}
                                                    placeholder="logotype_ad"
                                                    className="w-full bg-[#2a2a2a] border border-gray-700 rounded-xl px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setEditingLink(null)}
                                        className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl transition-all hover:scale-105 active:scale-95 duration-200"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all disabled:opacity-50 hover:scale-105 active:scale-95 duration-200"
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

            {/* Bulk Edit Modal */}
            {
                showBulkEditModal && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-[#1c1c1c] rounded-2xl shadow-2xl border border-gray-800 w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
                            <h2 className="text-xl font-bold mb-2 text-white">Bulk Edit Links</h2>
                            <p className="text-gray-400 text-sm mb-6">
                                Editing {selectedLinkIds.size} links. Values left as "No Change" will remain untouched.
                            </p>

                            <form onSubmit={handleBulkUpdate} className="space-y-5">
                                {/* Campaign */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1.5">Campaign</label>
                                    <select
                                        value={bulkEditCampaignId === null ? '' : bulkEditCampaignId}
                                        onChange={(e) => setBulkEditCampaignId(e.target.value === '' ? null : Number(e.target.value))}
                                        className="w-full bg-[#1c1c1c] border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all"
                                    >
                                        <option value="">No Change</option>
                                        <option value="-1">None (Remove from Campaign)</option>
                                        {campaigns.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Tags */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1.5">Tags (Replaces existing)</label>
                                    <input
                                        type="text"
                                        value={bulkEditTags}
                                        onChange={(e) => setBulkEditTags(e.target.value)}
                                        placeholder="No Change"
                                        className="w-full bg-[#1c1c1c] border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all"
                                    />
                                    <p className="text-xs text-gray-600 mt-1.5 ml-1">Leave empty to keep existing tags.</p>
                                </div>

                                {/* Expiration Date */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1.5">Expiration Date</label>
                                    <input
                                        type="datetime-local"
                                        value={bulkEditExpiresAt}
                                        onChange={(e) => setBulkEditExpiresAt(e.target.value)}
                                        className="w-full bg-[#1c1c1c] border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all"
                                    />
                                    <p className="text-xs text-gray-600 mt-1.5 ml-1">Leave empty to keep existing expiration.</p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    {/* Redirect Type */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">Redirect Type</label>
                                        <select
                                            value={bulkEditRedirectType === null ? '' : bulkEditRedirectType}
                                            onChange={(e) => setBulkEditRedirectType(e.target.value === '' ? null : Number(e.target.value))}
                                            className="w-full bg-[#1c1c1c] border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all"
                                        >
                                            <option value="">No Change</option>
                                            <option value={301}>301 Moved Permanently</option>
                                            <option value={302}>302 Found (Temporary)</option>
                                            <option value={307}>307 Temporary Redirect</option>
                                            <option value={308}>308 Permanent Redirect</option>
                                        </select>
                                    </div>

                                    {/* Status */}
                                    <TriStateToggle
                                        label="Active Status"
                                        value={bulkEditIsActive}
                                        onChange={setBulkEditIsActive}
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 border-t border-gray-800">
                                    <TriStateToggle
                                        label="Require KeyN Login"
                                        value={bulkEditRequireLogin}
                                        onChange={setBulkEditRequireLogin}
                                    />
                                    <TriStateToggle
                                        label="Track Activity"
                                        value={bulkEditTrackActivity}
                                        onChange={setBulkEditTrackActivity}
                                    />
                                </div>

                                <div className="border-t border-gray-800 pt-4 mt-2">
                                    <div
                                        className="flex items-center justify-between cursor-pointer group mb-3"
                                        onClick={() => setShowBulkEditUtm(!showBulkEditUtm)}
                                    >
                                        <h3 className="text-sm font-semibold text-gray-300">UTM Parameters</h3>
                                        <svg className={`w-4 h-4 text-gray-500 group-hover:text-blue-400 transition-transform ${showBulkEditUtm ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>

                                    {showBulkEditUtm && (
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-400 mb-1">Source</label>
                                                <input
                                                    type="text"
                                                    value={bulkEditUtmSource}
                                                    onChange={(e) => setBulkEditUtmSource(e.target.value)}
                                                    placeholder="No Change"
                                                    className="w-full bg-[#1c1c1c] border border-gray-700 rounded-xl px-4 py-2 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-400 mb-1">Medium</label>
                                                <input
                                                    type="text"
                                                    value={bulkEditUtmMedium}
                                                    onChange={(e) => setBulkEditUtmMedium(e.target.value)}
                                                    placeholder="No Change"
                                                    className="w-full bg-[#1c1c1c] border border-gray-700 rounded-xl px-4 py-2 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-400 mb-1">Campaign</label>
                                                <input
                                                    type="text"
                                                    value={bulkEditUtmCampaign}
                                                    onChange={(e) => setBulkEditUtmCampaign(e.target.value)}
                                                    placeholder="No Change"
                                                    className="w-full bg-[#1c1c1c] border border-gray-700 rounded-xl px-4 py-2 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-400 mb-1">Term</label>
                                                <input
                                                    type="text"
                                                    value={bulkEditUtmTerm}
                                                    onChange={(e) => setBulkEditUtmTerm(e.target.value)}
                                                    placeholder="No Change"
                                                    className="w-full bg-[#1c1c1c] border border-gray-700 rounded-xl px-4 py-2 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-400 mb-1">Content</label>
                                                <input
                                                    type="text"
                                                    value={bulkEditUtmContent}
                                                    onChange={(e) => setBulkEditUtmContent(e.target.value)}
                                                    placeholder="No Change"
                                                    className="w-full bg-[#1c1c1c] border border-gray-700 rounded-xl px-4 py-2 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-3 mt-8 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowBulkEditModal(false)}
                                        className="flex-1 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl transition-all font-medium border border-transparent hover:border-gray-600"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isBulkSaving}
                                        className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-blue-900/20 hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                        {isBulkSaving ? 'Updating...' : 'Update Links'}
                                    </button>
                                </div>
                                {bulkEditError && <p className="text-red-400 text-sm text-center bg-red-900/10 py-2 rounded-lg border border-red-900/20">{bulkEditError}</p>}
                            </form>
                        </div>
                    </div>
                )
            }
        </div>
    );
}

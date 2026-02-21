import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchOrgMembers, fetchInvites, createInvite, revokeInvite, updateMemberRole, removeMember, updateOrg, fetchOrgDetails } from '../lib/api';
import type { OrgMember, OrgInvite, Organization } from '../lib/api';
import Navbar from '../components/Navbar';

export default function OrgSettingsPage() {
    const { token, user, currentOrg, refreshOrgs } = useAuth();
    const [activeTab, setActiveTab] = useState<'general' | 'policies' | 'members' | 'invites'>('general');
    const [members, setMembers] = useState<OrgMember[]>([]);
    const [invites, setInvites] = useState<OrgInvite[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [fullOrg, setFullOrg] = useState<Organization | null>(null);

    // General tab
    const [orgName, setOrgName] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState('');

    // Invite form
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('member');
    const [inviteLoading, setInviteLoading] = useState(false);
    const [inviteMsg, setInviteMsg] = useState('');

    // Policies tab
    const [poliSaving, setPoliSaving] = useState(false);

    const orgId = currentOrg?.org_id;
    const myRole = currentOrg?.role;
    const isOwner = myRole === 'owner';
    const isAdmin = isOwner || myRole === 'admin';

    useEffect(() => {
        if (token && orgId) {
            loadData();
        }
    }, [token, orgId]);

    async function loadData() {
        if (!token || !orgId) return;
        setIsLoading(true);
        try {
            const [m, i, d] = await Promise.all([
                fetchOrgMembers(token, orgId),
                isAdmin ? fetchInvites(token, orgId) : Promise.resolve([]),
                fetchOrgDetails(token, orgId),
            ]);
            setMembers(m);
            setInvites(i);
            setFullOrg(d);
            setOrgName(d.name);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleSaveOrg() {
        if (!token || !orgId || !orgName.trim()) return;
        setIsSaving(true);
        setSaveMsg('');
        try {
            await updateOrg(token, orgId, { name: orgName.trim() });
            await refreshOrgs();
            setSaveMsg('Saved!');
            setTimeout(() => setSaveMsg(''), 2000);
        } catch (err) {
            setSaveMsg('Failed to save');
        } finally {
            setIsSaving(false);
        }
    }

    async function handleUpdatePolicy(field: string, value: boolean) {
        if (!token || !orgId || !isOwner) return;
        setPoliSaving(true);
        try {
            await updateOrg(token, orgId, { [field]: value });
            await loadData();
        } catch (err) {
            alert('Failed to update policy');
        } finally {
            setPoliSaving(false);
        }
    }

    async function handleRoleChange(userId: number, newRole: string) {
        if (!token || !orgId) return;

        if (newRole === 'owner') {
            const confirmed = confirm("Transfer ownership? This will demote you (and any other current owners) to Admin. This action cannot be undone by you once Bob accepts or the role is changed.");
            if (!confirmed) {
                // Reset select value - this is handled by the state re-render after loadData
                return;
            }
        }

        try {
            await updateMemberRole(token, orgId, userId, newRole);
            await loadData();
            if (newRole === 'owner') {
                await refreshOrgs(); // Update local state for the demoted user
            }
        } catch (err: any) {
            alert(err.message || 'Failed to update role');
        }
    }

    async function handleRemoveMember(userId: number, username: string) {
        if (!token || !orgId) return;
        if (!confirm(`Remove ${username} from this organization?`)) return;
        try {
            await removeMember(token, orgId, userId);
            await loadData();
        } catch (err: any) {
            alert(err.message || 'Failed to remove member');
        }
    }

    async function handleSendInvite(e: React.FormEvent) {
        e.preventDefault();
        if (!token || !orgId || !inviteEmail.trim()) return;
        setInviteLoading(true);
        setInviteMsg('');
        try {
            await createInvite(token, orgId, inviteEmail.trim(), inviteRole);
            setInviteEmail('');
            setInviteRole('member');
            setInviteMsg('Invite sent!');
            await loadData();
            setTimeout(() => setInviteMsg(''), 3000);
        } catch (err: any) {
            setInviteMsg(err.message || 'Failed to send invite');
        } finally {
            setInviteLoading(false);
        }
    }

    async function handleRevokeInvite(inviteId: number) {
        if (!token || !orgId) return;
        if (!confirm('Revoke this invite?')) return;
        try {
            await revokeInvite(token, orgId, inviteId);
            await loadData();
        } catch (err) {
            console.error(err);
        }
    }

    if (!currentOrg || !isAdmin) {
        return (
            <div className="min-h-screen bg-[#111] text-white">
                <Navbar />
                <div className="max-w-4xl mx-auto px-4 py-16 text-center">
                    <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
                    <p className="text-gray-400">You need admin or owner access to manage this organization.</p>
                </div>
            </div>
        );
    }

    const tabs = [
        { id: 'general' as const, label: 'General' },
        { id: 'policies' as const, label: 'Policies' },
        { id: 'members' as const, label: `Members (${members.length})` },
        { id: 'invites' as const, label: `Invites (${invites.length})` },
    ];

    return (
        <div className="min-h-screen bg-[#111] text-gray-100 font-sans animate-fade-in">
            <Navbar />

            <main className="max-w-4xl mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-1">Organization Settings</h1>
                    <p className="text-gray-500">{currentOrg.org_name} • {currentOrg.org_slug}</p>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 mb-8 bg-[#1a1a1a] p-1 rounded-xl border border-gray-800 w-fit">
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

                {isLoading ? (
                    <div className="text-center py-12 text-gray-500">Loading...</div>
                ) : (
                    <>
                        {/* General Tab */}
                        {activeTab === 'general' && (
                            <div className="bg-[#1c1c1c] rounded-2xl border border-gray-800 p-6">
                                <h2 className="text-lg font-bold text-white mb-6">General Information</h2>
                                <div className="space-y-4 max-w-md">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">Organization Name</label>
                                        <input
                                            type="text"
                                            value={orgName}
                                            onChange={e => setOrgName(e.target.value)}
                                            className="w-full bg-[#0f0f0f] border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">Slug</label>
                                        <div className="text-sm text-gray-300 bg-[#0f0f0f] border border-gray-800 rounded-xl px-4 py-2.5">{currentOrg.org_slug}</div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">Your Role</label>
                                        <div className="text-sm text-gray-300 bg-[#0f0f0f] border border-gray-800 rounded-xl px-4 py-2.5 capitalize">{currentOrg.role}</div>
                                    </div>
                                    <div className="flex items-center gap-3 pt-2">
                                        <button
                                            onClick={handleSaveOrg}
                                            disabled={isSaving}
                                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
                                        >
                                            {isSaving ? 'Saving...' : 'Save Changes'}
                                        </button>
                                        {saveMsg && <span className="text-sm text-green-400">{saveMsg}</span>}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Policies Tab */}
                        {activeTab === 'policies' && fullOrg && (
                            <div className="bg-[#1c1c1c] rounded-2xl border border-gray-800 p-6">
                                <h2 className="text-lg font-bold text-white mb-6">Member Policies</h2>
                                <p className="text-sm text-gray-500 mb-8 max-w-lg">
                                    Configure how members interact with organization data. Only owners can modify these settings.
                                </p>

                                <div className="space-y-6 max-w-2xl">
                                    <div className="flex items-center justify-between p-4 bg-[#0f0f0f] rounded-xl border border-gray-800">
                                        <div>
                                            <div className="text-sm font-semibold text-white mb-1">Link Privacy</div>
                                            <p className="text-xs text-gray-500">When enabled, members only see the links they created.</p>
                                        </div>
                                        <button
                                            onClick={() => handleUpdatePolicy('is_link_privacy_enabled', !fullOrg.is_link_privacy_enabled)}
                                            disabled={!isOwner || poliSaving}
                                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${fullOrg.is_link_privacy_enabled ? 'bg-blue-600' : 'bg-gray-700'}`}
                                        >
                                            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${fullOrg.is_link_privacy_enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-[#0f0f0f] rounded-xl border border-gray-800">
                                        <div>
                                            <div className="text-sm font-semibold text-white mb-1">Allow Member Deletion</div>
                                            <p className="text-xs text-gray-500">When disabled, regular members cannot delete their own links.</p>
                                        </div>
                                        <button
                                            onClick={() => handleUpdatePolicy('allow_member_delete', !fullOrg.allow_member_delete)}
                                            disabled={!isOwner || poliSaving}
                                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${fullOrg.allow_member_delete ? 'bg-blue-600' : 'bg-gray-700'}`}
                                        >
                                            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${fullOrg.allow_member_delete ? 'translate-x-5' : 'translate-x-0'}`} />
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-[#0f0f0f] rounded-xl border border-gray-800">
                                        <div>
                                            <div className="text-sm font-semibold text-white mb-1">Allow Member Editing</div>
                                            <p className="text-xs text-gray-500">When disabled, regular members cannot edit their own links.</p>
                                        </div>
                                        <button
                                            onClick={() => handleUpdatePolicy('allow_member_edit', !fullOrg.allow_member_edit)}
                                            disabled={!isOwner || poliSaving}
                                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${fullOrg.allow_member_edit ? 'bg-blue-600' : 'bg-gray-700'}`}
                                        >
                                            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${fullOrg.allow_member_edit ? 'translate-x-5' : 'translate-x-0'}`} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Members Tab */}
                        {activeTab === 'members' && (
                            <div className="bg-[#1c1c1c] rounded-2xl border border-gray-800 overflow-hidden">
                                <div className="p-6 border-b border-gray-800">
                                    <h2 className="text-lg font-bold text-white">Members</h2>
                                </div>
                                <div className="divide-y divide-gray-800">
                                    {members.map(member => (
                                        <div key={member.id} className="p-4 flex items-center justify-between hover:bg-[#222] transition-colors">
                                            <div className="flex items-center gap-3">
                                                {member.avatar_url ? (
                                                    <img src={member.avatar_url} alt="" className="w-9 h-9 rounded-full" />
                                                ) : (
                                                    <div className="w-9 h-9 rounded-full bg-linear-to-br from-gray-600 to-gray-800 flex items-center justify-center text-xs text-white font-bold">
                                                        {(member.username || member.email || '?').charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="text-sm font-medium text-white">{member.full_name || member.username}</div>
                                                    <div className="text-xs text-gray-500">{member.email}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {isOwner && member.role !== 'owner' && member.user_id !== user?.id ? (
                                                    <select
                                                        value={member.role}
                                                        onChange={e => handleRoleChange(member.user_id, e.target.value)}
                                                        className="bg-[#0f0f0f] border border-gray-700 rounded-lg px-2 py-1 text-xs text-gray-300 focus:outline-none"
                                                    >
                                                        <option value="member">Member</option>
                                                        <option value="admin">Admin</option>
                                                        <option value="owner">Owner</option>
                                                    </select>
                                                ) : (
                                                    <span className={`text-xs px-2 py-1 rounded-full border font-medium capitalize ${member.role === 'owner' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                                        member.role === 'admin' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                            'bg-gray-500/10 text-gray-400 border-gray-500/20'
                                                        }`}>
                                                        {member.role}
                                                    </span>
                                                )}
                                                {isOwner && member.role !== 'owner' && member.user_id !== user?.id && (
                                                    <button
                                                        onClick={() => handleRemoveMember(member.user_id, member.username || member.email || 'this user')}
                                                        className="text-red-400 hover:text-red-300 text-xs font-medium px-2 py-1 hover:bg-red-500/10 rounded-lg transition-colors"
                                                    >
                                                        Remove
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {members.length === 0 && (
                                        <div className="p-8 text-center text-gray-500 text-sm">No members found</div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Invites Tab */}
                        {activeTab === 'invites' && (
                            <div className="space-y-6">
                                {/* Send Invite Form */}
                                <div className="bg-[#1c1c1c] rounded-2xl border border-gray-800 p-6">
                                    <h2 className="text-lg font-bold text-white mb-4">Send Invite</h2>
                                    <form onSubmit={handleSendInvite} className="flex flex-wrap gap-3 items-end">
                                        <div className="flex-1 min-w-[200px]">
                                            <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Email</label>
                                            <input
                                                type="email"
                                                value={inviteEmail}
                                                onChange={e => setInviteEmail(e.target.value)}
                                                placeholder="user@example.com"
                                                className="w-full bg-[#0f0f0f] border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                                                required
                                            />
                                        </div>
                                        <div className="w-32">
                                            <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Role</label>
                                            <select
                                                value={inviteRole}
                                                onChange={e => setInviteRole(e.target.value)}
                                                className="w-full bg-[#0f0f0f] border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none"
                                            >
                                                <option value="member">Member</option>
                                                <option value="admin">Admin</option>
                                                <option value="owner">Owner</option>
                                            </select>
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={inviteLoading}
                                            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
                                        >
                                            {inviteLoading ? 'Sending...' : 'Send Invite'}
                                        </button>
                                    </form>
                                    {inviteMsg && (
                                        <p className={`text-sm mt-3 ${inviteMsg.includes('Failed') ? 'text-red-400' : 'text-green-400'}`}>{inviteMsg}</p>
                                    )}
                                </div>

                                {/* Pending Invites */}
                                <div className="bg-[#1c1c1c] rounded-2xl border border-gray-800 overflow-hidden">
                                    <div className="p-6 border-b border-gray-800">
                                        <h2 className="text-lg font-bold text-white">Pending Invites</h2>
                                    </div>
                                    <div className="divide-y divide-gray-800">
                                        {invites.map(invite => (
                                            <div key={invite.id} className="p-4 flex items-center justify-between hover:bg-[#222] transition-colors">
                                                <div>
                                                    <div className="text-sm font-medium text-white">{invite.email}</div>
                                                    <div className="text-xs text-gray-500">
                                                        Role: <span className="capitalize">{invite.role}</span>
                                                        {invite.expires_at && ` • Expires ${new Date(invite.expires_at).toLocaleDateString()}`}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleRevokeInvite(invite.id)}
                                                    className="text-red-400 hover:text-red-300 text-xs font-medium px-3 py-1.5 hover:bg-red-500/10 rounded-lg transition-colors"
                                                >
                                                    Revoke
                                                </button>
                                            </div>
                                        ))}
                                        {invites.length === 0 && (
                                            <div className="p-8 text-center text-gray-500 text-sm">No pending invites</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}

import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
    const { user, logout, orgs, currentOrg, switchOrg } = useAuth();
    const location = useLocation();
    const isDashboard = location.pathname === '/';
    const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);
    const [userDropdownOpen, setUserDropdownOpen] = useState(false);
    const orgRef = useRef<HTMLDivElement>(null);
    const userRef = useRef<HTMLDivElement>(null);

    // Close dropdowns on outside click
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (orgRef.current && !orgRef.current.contains(e.target as Node)) setOrgDropdownOpen(false);
            if (userRef.current && !userRef.current.contains(e.target as Node)) setUserDropdownOpen(false);
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const roleBadge = (role: string) => {
        const colors: Record<string, string> = {
            owner: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
            admin: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
            member: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
        };
        return (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${colors[role] || colors.member}`}>
                {role}
            </span>
        );
    };

    return (
        <nav className="border-b border-gray-800 bg-[#161616]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    {/* Left: Logo + Org Switcher */}
                    <div className="flex items-center gap-3">
                        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-all hover:scale-105 active:scale-95 duration-200">
                            <img src="/logo.svg" alt="NoloLink Logo" className="w-8 h-8" />
                            <span className="text-xl font-bold bg-linear-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent hidden sm:inline-block">
                                NoloLink
                            </span>
                        </Link>

                        {/* Org Switcher */}
                        {currentOrg && (
                            <div className="relative" ref={orgRef}>
                                <button
                                    onClick={() => setOrgDropdownOpen(!orgDropdownOpen)}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#222] border border-gray-700 hover:border-gray-600 transition-colors text-sm"
                                >
                                    <div className="w-5 h-5 rounded bg-linear-to-br from-blue-600 to-purple-600 flex items-center justify-center text-[10px] font-bold text-white">
                                        {currentOrg.org_name.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="text-gray-200 font-medium max-w-[120px] truncate">{currentOrg.org_name}</span>
                                    {roleBadge(currentOrg.role)}
                                    <svg className={`w-3 h-3 text-gray-500 transition-transform ${orgDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {orgDropdownOpen && (
                                    <div className="absolute top-full left-0 mt-2 w-72 bg-[#1c1c1c] border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in">
                                        <div className="px-3 py-2 border-b border-gray-800">
                                            <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">Switch Organization</span>
                                        </div>
                                        <div className="max-h-64 overflow-y-auto">
                                            {orgs.map(org => (
                                                <button
                                                    key={org.org_id}
                                                    onClick={() => { switchOrg(org.org_id); setOrgDropdownOpen(false); }}
                                                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-[#252525] transition-colors ${currentOrg?.org_id === org.org_id ? 'bg-blue-600/5 border-l-2 border-blue-500' : 'border-l-2 border-transparent'
                                                        }`}
                                                >
                                                    <div className="w-7 h-7 rounded-lg bg-linear-to-br from-blue-600 to-purple-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                                                        {org.org_name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sm text-gray-200 font-medium truncate">{org.org_name}</div>
                                                        <div className="text-xs text-gray-500">{org.org_slug}</div>
                                                    </div>
                                                    {roleBadge(org.role)}
                                                    {currentOrg?.org_id === org.org_id && (
                                                        <svg className="w-4 h-4 text-blue-400 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                        {currentOrg && (currentOrg.role === 'owner' || currentOrg.role === 'admin') && (
                                            <div className="border-t border-gray-800">
                                                <Link
                                                    to="/org/settings"
                                                    onClick={() => setOrgDropdownOpen(false)}
                                                    className="flex items-center gap-2 px-3 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-[#252525] transition-colors"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                                    Org Settings
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Right: Nav Links + User */}
                    <div className="flex items-center gap-3">
                        {user?.is_superuser && (
                            <>
                                <span className="bg-yellow-500/10 text-yellow-500 text-xs px-2 py-1 rounded-full border border-yellow-500/20 font-medium cursor-default hidden sm:inline-block">
                                    Superuser
                                </span>
                                <Link to="/admin" className="text-gray-400 hover:text-white text-sm font-medium transition-colors">
                                    Admin
                                </Link>
                            </>
                        )}

                        {!isDashboard && (
                            <Link to="/" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">
                                Dashboard
                            </Link>
                        )}

                        {user && (
                            <div className="relative" ref={userRef}>
                                <button
                                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                                    className="flex items-center gap-2 bg-[#222] px-3 py-1.5 rounded-full border border-gray-700 hover:border-gray-600 transition-colors"
                                >
                                    {user.avatar_url ? (
                                        <img src={user.avatar_url} alt={user.username} className="w-6 h-6 rounded-full" />
                                    ) : (
                                        <div className="w-6 h-6 rounded-full bg-linear-to-br from-gray-600 to-gray-800 flex items-center justify-center text-xs text-white">
                                            {user.username?.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <span className="text-sm font-medium text-gray-300 hidden sm:inline-block">{user.username}</span>
                                    <svg className={`w-3 h-3 text-gray-500 transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {userDropdownOpen && (
                                    <div className="absolute top-full right-0 mt-2 w-56 bg-[#1c1c1c] border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in">
                                        <div className="px-4 py-3 border-b border-gray-800">
                                            <div className="text-sm font-medium text-white">{user.full_name || user.username}</div>
                                            <div className="text-xs text-gray-500">{user.email}</div>
                                        </div>
                                        {currentOrg && (currentOrg.role === 'owner' || currentOrg.role === 'admin') && (
                                            <Link
                                                to="/org/settings"
                                                onClick={() => setUserDropdownOpen(false)}
                                                className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-[#252525] transition-colors"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                                Org Settings
                                            </Link>
                                        )}
                                        <button
                                            onClick={() => { logout(); setUserDropdownOpen(false); }}
                                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-colors border-t border-gray-800"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                                            Sign out
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}

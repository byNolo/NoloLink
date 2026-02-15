
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
    onToggleAdmin?: () => void;
}

export default function Navbar({ onToggleAdmin }: NavbarProps) {
    const { user } = useAuth();
    const location = useLocation();
    const isDashboard = location.pathname === '/';

    return (
        <nav className="border-b border-gray-800 bg-[#161616]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    <div className="flex items-center gap-2">
                        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                            <img src="/logo.svg" alt="NoloLink Logo" className="w-8 h-8" />
                            <span className="text-xl font-bold bg-linear-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                                NoloLink
                            </span>
                        </Link>
                    </div>
                    <div className="flex items-center gap-4">
                        {user?.is_superuser && (
                            <>
                                <span className="bg-yellow-500/10 text-yellow-500 text-xs px-2 py-1 rounded-full border border-yellow-500/20 font-medium cursor-default hidden sm:inline-block">
                                    Superuser
                                </span>
                                {onToggleAdmin && (
                                    <button
                                        onClick={onToggleAdmin}
                                        className="text-gray-400 hover:text-white text-sm font-medium transition-colors"
                                    >
                                        Admin Panel
                                    </button>
                                )}
                            </>
                        )}

                        {!isDashboard && (
                            <Link to="/" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">
                                Dashboard
                            </Link>
                        )}

                        {user && (
                            <div className="flex items-center gap-3 bg-[#222] px-3 py-1.5 rounded-full border border-gray-700">
                                {user.avatar_url ? (
                                    <img src={user.avatar_url} alt={user.username} className="w-6 h-6 rounded-full" />
                                ) : (
                                    <div className="w-6 h-6 rounded-full bg-linear-to-br from-gray-600 to-gray-800 flex items-center justify-center text-xs text-white">
                                        {user.username?.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <span className="text-sm font-medium text-gray-300 hidden sm:inline-block">{user.username}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}

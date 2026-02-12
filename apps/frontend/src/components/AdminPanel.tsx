import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import type { User } from '../context/AuthContext';

export default function AdminPanel() {
    const { token } = useAuth();
    const [requests, setRequests] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (token) {
            fetchRequests();
        }
    }, [token]);

    async function fetchRequests() {
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3071';
            const response = await fetch(`${apiUrl}/api/users/requests`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setRequests(data);
            }
        } catch (error) {
            console.error("Failed to fetch requests", error);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleAction(userId: number, action: 'approve' | 'reject') {
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3071';
            const response = await fetch(`${apiUrl}/api/users/${userId}/${action}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                setRequests(requests.filter(req => req.id !== userId));
            }
        } catch (error) {
            console.error(`Failed to ${action} user`, error);
        }
    }

    if (isLoading) return <div className="text-gray-400">Loading requests...</div>;

    if (requests.length === 0) {
        return (
            <div className="bg-[#1c1c1c] rounded-2xl border border-gray-800 p-8 text-center">
                <p className="text-gray-500">No pending access requests.</p>
            </div>
        );
    }

    return (
        <div className="bg-[#1c1c1c] rounded-2xl border border-gray-800 overflow-hidden">
            <div className="p-6 border-b border-gray-800">
                <h2 className="text-xl font-bold text-white">Access Requests</h2>
            </div>
            <div className="divide-y divide-gray-800">
                {requests.map(user => (
                    <div key={user.id} className="p-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            {user.avatar_url ? (
                                <img src={user.avatar_url} alt={user.username} className="w-10 h-10 rounded-full" />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-gray-300 font-bold">
                                    {user.username.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div>
                                <h3 className="text-white font-medium">{user.full_name || user.username}</h3>
                                <p className="text-sm text-gray-500">@{user.username} • {user.email}</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleAction(user.id, 'reject')}
                                className="px-3 py-1.5 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors text-sm font-medium"
                            >
                                Reject
                            </button>
                            <button
                                onClick={() => handleAction(user.id, 'approve')}
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors text-sm font-medium shadow-lg shadow-blue-900/20"
                            >
                                Approve
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

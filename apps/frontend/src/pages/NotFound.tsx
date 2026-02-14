import { Link } from 'react-router-dom';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-[#111] flex flex-col items-center justify-center p-4 text-white font-sans">
            <div className="max-w-md w-full bg-[#1c1c1c] shadow-2xl rounded-2xl p-10 border border-gray-800 text-center">
                <div className="w-20 h-20 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h1 className="text-4xl font-bold bg-linear-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-2">
                    404
                </h1>
                <h2 className="text-xl font-semibold text-white mb-4">Page Not Found</h2>
                <p className="text-gray-400 mb-8">
                    The link you are looking for might have been removed, had its name changed, or is temporarily unavailable.
                </p>

                <Link
                    to="/"
                    className="inline-block w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-lg shadow-blue-900/20"
                >
                    Go Home
                </Link>
            </div>
        </div>
    );
}

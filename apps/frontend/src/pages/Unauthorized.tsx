import { Link } from 'react-router-dom';

export default function Unauthorized() {
    return (
        <div className="min-h-screen bg-[#111] flex flex-col items-center justify-center p-4 text-white font-sans">
            <div className="max-w-md w-full bg-[#1c1c1c] shadow-2xl rounded-2xl p-10 border border-gray-800 text-center">
                <div className="w-20 h-20 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                </div>
                <h1 className="text-4xl font-bold text-red-500 mb-2">
                    403
                </h1>
                <h2 className="text-xl font-semibold text-white mb-4">Access Denied</h2>
                <p className="text-gray-400 mb-8">
                    You don't have permission to access this page. Please contact an administrator if you believe this is an error.
                </p>

                <Link
                    to="/"
                    className="inline-block w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-xl transition-all"
                >
                    Back to Dashboard
                </Link>
            </div>
        </div>
    );
}

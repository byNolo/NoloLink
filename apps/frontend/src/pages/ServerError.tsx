import { Link } from 'react-router-dom';

export default function ServerError() {
    return (
        <div className="min-h-screen bg-[#111] flex flex-col items-center justify-center p-4 text-white font-sans">
            <div className="max-w-md w-full bg-[#1c1c1c] shadow-2xl rounded-2xl p-10 border border-gray-800 text-center">
                <div className="w-20 h-20 bg-yellow-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h1 className="text-4xl font-bold text-yellow-500 mb-2">
                    500
                </h1>
                <h2 className="text-xl font-semibold text-white mb-4">Server Error</h2>
                <p className="text-gray-400 mb-8">
                    Oops! Something went wrong on our end. We're working to fix it. Please try again later.
                </p>

                <Link
                    to="/"
                    className="inline-block w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-xl transition-all"
                >
                    Try Again
                </Link>
            </div>
        </div>
    );
}

import { useSearchParams, Link } from 'react-router-dom';

export default function ErrorPage() {
    const [searchParams] = useSearchParams();
    const type = searchParams.get('type') || 'unknown';

    const errorContent = {
        expired: {
            title: 'Link Expired',
            message: 'This link has reached its expiration time.',
            icon: (
                <svg className="w-16 h-16 text-yellow-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )
        },
        disabled: {
            title: 'Link Disabled',
            message: 'This link has been disabled by the owner.',
            icon: (
                <svg className="w-16 h-16 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
            )
        },
        not_found: {
            title: 'Link Not Found',
            message: "We couldn't find the link you're looking for.",
            icon: (
                <svg className="w-16 h-16 text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )
        },
        unknown: {
            title: 'Something Went Wrong',
            message: 'An unknown error occurred.',
            icon: (
                <svg className="w-16 h-16 text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            )
        }
    };

    const content = errorContent[type as keyof typeof errorContent] || errorContent.unknown;

    return (
        <div className="min-h-screen bg-[#111] flex flex-col items-center justify-center p-4 text-white">
            <div className="max-w-md w-full bg-[#1c1c1c] shadow-2xl rounded-2xl p-8 border border-gray-800 text-center">
                <div className="flex justify-center">
                    {content.icon}
                </div>
                <h1 className="text-3xl font-bold bg-linear-to-r from-gray-200 to-gray-400 bg-clip-text text-transparent mb-4">
                    {content.title}
                </h1>
                <p className="text-gray-400 text-lg mb-8">{content.message}</p>

                <Link
                    to="/"
                    className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition duration-200 shadow-lg hover:shadow-blue-900/20"
                >
                    Go Home
                </Link>
            </div>
            <div className="mt-8 text-gray-600 text-sm">
                &copy; 2026 NoloLink
            </div>
        </div>
    );
}

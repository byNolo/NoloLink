import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-[#111] text-gray-100 font-sans">
            <nav className="border-b border-gray-800 bg-[#161616]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex items-center gap-2">
                            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                                <div className="bg-linear-to-tr from-blue-500 to-purple-600 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">
                                    N
                                </div>
                                <span className="text-xl font-bold bg-linear-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                                    NoloLink
                                </span>
                            </Link>
                        </div>
                        <div className="flex items-center gap-4">
                            <Link to="/" className="text-gray-400 hover:text-white transition-colors">
                                Dashboard
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-4xl mx-auto px-4 py-12">
                <div className="bg-[#1c1c1c] rounded-2xl border border-gray-800 p-8 shadow-xl">
                    <h1 className="text-3xl font-bold text-white mb-6">Privacy Policy</h1>
                    <div className="prose prose-invert max-w-none text-gray-300">
                        <p className="mb-4">Last updated: {new Date().toLocaleDateString()}</p>

                        <h2 className="text-xl font-bold text-white mt-8 mb-4">1. Information We Collect</h2>
                        <ul className="list-disc pl-6 space-y-2 mb-4">
                            <li><strong>Account Information:</strong> When you log in via KeyN, we receive your username and potentially your email address if allowed.</li>
                            <li><strong>Link Data:</strong> The URLs you shorten and the custom aliases you create.</li>
                            <li><strong>Usage Data (Analytics):</strong> When advanced analytics are enabled for a link, we collect non-personally identifiable information about clicks, including IP address (anonymized/aggregated for country lookup), User Agent (device type, browser), and Referrer URL.</li>
                        </ul>

                        <h2 className="text-xl font-bold text-white mt-8 mb-4">2. How We Use Information</h2>
                        <p>We use the collected information to:</p>
                        <ul className="list-disc pl-6 space-y-2 mb-4">
                            <li>Provide and maintain the URL shortening service.</li>
                            <li>Display analytics to link creators (if enabled).</li>
                            <li>Prevent abuse and ensure security.</li>
                        </ul>

                        <h2 className="text-xl font-bold text-white mt-8 mb-4">3. Data Sharing</h2>
                        <p>We do not sell your personal data. Link analytics data is viewable by the creator of the link. We may share data if required by law.</p>

                        <h2 className="text-xl font-bold text-white mt-8 mb-4">4. Cookies</h2>
                        <p>We use local storage/cookies to maintain your session. Detailed tracking cookies are not used for general visitors unless specified.</p>

                        <h2 className="text-xl font-bold text-white mt-8 mb-4">5. Security</h2>
                        <p>We implement reasonable security measures to protect your data, but no method of transmission over the internet is 100% secure.</p>

                        <h2 className="text-xl font-bold text-white mt-8 mb-4">6. Changes to Policy</h2>
                        <p>We may update this policy. Changes will be posted on this page.</p>

                        <h2 className="text-xl font-bold text-white mt-8 mb-4">7. Contact</h2>
                        <p>If you have questions about privacy, please contact the administrator.</p>
                    </div>
                </div>
            </main>
        </div>
    );
}

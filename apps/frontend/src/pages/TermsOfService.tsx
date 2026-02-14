import { Link } from 'react-router-dom';

export default function TermsOfService() {
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
                    <h1 className="text-3xl font-bold text-white mb-6">Terms of Service</h1>
                    <div className="prose prose-invert max-w-none text-gray-300">
                        <p className="mb-4">Last updated: {new Date().toLocaleDateString()}</p>

                        <h2 className="text-xl font-bold text-white mt-8 mb-4">1. Acceptance of Terms</h2>
                        <p>By accessing and using NoloLink, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service.</p>

                        <h2 className="text-xl font-bold text-white mt-8 mb-4">2. Description of Service</h2>
                        <p>NoloLink provides URL shortening and analytics services. We reserve the right to modify, suspend, or discontinue the service at any time without notice.</p>

                        <h2 className="text-xl font-bold text-white mt-8 mb-4">3. User Conduct</h2>
                        <p>You agree not to use NoloLink for any illegal or unauthorized purpose, including but not limited to:</p>
                        <ul className="list-disc pl-6 space-y-2 mb-4">
                            <li>Spamming or sending unsolicited messages.</li>
                            <li>Distributing malware, viruses, or phishing links.</li>
                            <li>Linking to illegal content or content that violates intellectual property rights.</li>
                            <li>Harassment, hate speech, or abuse.</li>
                        </ul>
                        <p>We reserve the right to disable any link or ban any user found violating these terms.</p>

                        <h2 className="text-xl font-bold text-white mt-8 mb-4">4. Account Security</h2>
                        <p>You are responsible for maintaining the confidentiality of your account credentials (via KeyN) and for all activities that occur under your account.</p>

                        <h2 className="text-xl font-bold text-white mt-8 mb-4">5. Limitation of Liability</h2>
                        <p>NoloLink is provided "as is" without any warranties. We are not liable for any damages arising from your use of the service, including data loss or service interruptions.</p>

                        <h2 className="text-xl font-bold text-white mt-8 mb-4">6. Changes to Terms</h2>
                        <p>We may update these terms from time to time. Continued use of the service constitutes acceptance of the new terms.</p>

                        <h2 className="text-xl font-bold text-white mt-8 mb-4">7. Contact</h2>
                        <p>If you have any questions about these Terms, please contact the administrator.</p>
                    </div>
                </div>
            </main>
        </div>
    );
}

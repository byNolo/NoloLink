import Navbar from '../components/Navbar';

export default function TermsOfService() {
    return (
        <div className="min-h-screen bg-[#111] text-gray-100 font-sans animate-fade-in">
            <Navbar />

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

import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Dashboard from './components/Dashboard';
import NotFound from './pages/NotFound';
import Unauthorized from './pages/Unauthorized';
import ServerError from './pages/ServerError';
import VerifyLinkPage from './pages/VerifyLinkPage';
import ErrorPage from './pages/ErrorPage';
import StatsPage from './pages/StatsPage';
import TermsOfService from './pages/TermsOfService';
import PrivacyPolicy from './pages/PrivacyPolicy';

const Home = () => {
  const { login, isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Dashboard />;
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex flex-col items-center justify-center p-4 text-white">
      <div className="max-w-md w-full bg-[#242424] shadow-2xl rounded-2xl p-8 border border-gray-800">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-extrabold bg-linear-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent mb-4">
            NoloLink
          </h1>
          <p className="text-gray-400 text-lg">Shorten specific links with style.</p>
        </div>

        <div className="text-center">
          <p className="text-gray-300 mb-8">Please login to manage your links.</p>
          <button
            onClick={() => login()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition duration-200 flex items-center justify-center w-full shadow-lg hover:shadow-blue-900/20"
          >
            Login with KeyN
          </button>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-600 text-sm">
          <p>&copy; 2026 NoloLink. All rights reserved.</p>
          <div className="mt-3 flex justify-center gap-4 text-xs font-medium">
            <Link to="/tos" className="hover:text-blue-400 transition-colors">Terms of Service</Link>
            <Link to="/privacy" className="hover:text-blue-400 transition-colors">Privacy Policy</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/verify/:shortCode" element={<VerifyLinkPage />} />
          <Route path="/stats/:shortCode" element={<StatsPage />} />
          <Route path="/tos" element={<TermsOfService />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/error" element={<ErrorPage />} />
          <Route path="/403" element={<Unauthorized />} />
          <Route path="/404" element={<NotFound />} />
          <Route path="/500" element={<ServerError />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

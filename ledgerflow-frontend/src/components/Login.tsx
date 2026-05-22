import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { ForgotPasswordModal } from './ForgotPasswordModal';

const Login: React.FC = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // Clear any existing session when login page loads
  useEffect(() => {
    // Only clear if we're explicitly on the login page (not redirected while logged in)
    const token = localStorage.getItem('token');
    if (!token) {
      // No token, ensure everything is clean
      localStorage.clear();
      sessionStorage.clear();
    }
  }, []);

  // If user is already logged in, redirect to their dashboard
  useEffect(() => {
    if (user) {
      const role = user.role.toLowerCase();
      if (role === 'superadmin') {
        navigate('/superadmin/dashboard', { replace: true });
      } else {
        navigate(`/${role}`, { replace: true });
      }
    }
  }, [user, navigate]);

  // Check if there's a token in localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    
    if (token && role) {
      const normalizedRole = role.toLowerCase();
      if (normalizedRole === 'superadmin') {
        navigate('/superadmin/dashboard', { replace: true });
      } else {
        navigate(`/${normalizedRole}`, { replace: true });
      }
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    
    // Validate inputs before making API call
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    
    setIsLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password, rememberMe });
      const { token, expiresIn, rememberMe: shouldRemember, user: userData } = response.data;

      if (!token || !userData?.role) {
        setError('Invalid response from server.');
        setIsLoading(false);
        return;
      }

      // Calculate expiration timestamp
      const expiresAt = Date.now() + (expiresIn * 1000);

      // Store auth data based on Remember Me preference
      const storage = shouldRemember ? localStorage : sessionStorage;
      
      // Clear the other storage to avoid conflicts
      if (shouldRemember) {
        sessionStorage.clear();
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('user');
        localStorage.removeItem('expiresAt');
      }
      
      // Store complete auth data
      storage.setItem('token', token);
      storage.setItem('role', userData.role);
      storage.setItem('user', JSON.stringify(userData));
      storage.setItem('expiresAt', expiresAt.toString());

      // login() parses the JWT and sets user + sets Authorization header
      // Pass additional user info from login response
      login(token, shouldRemember, {
        companyId: userData.companyId,
        companyName: userData.companyName,
        firstName: userData.firstName,
        lastName: userData.lastName
      });

      // Use the role from the API response directly (most reliable)
      const role = userData.role.toLowerCase();
      console.log('LOGIN SUCCESS — role:', role, 'Remember Me:', shouldRemember);

      // Use navigate instead of window.location.replace to avoid full page reload
      if (role === 'superadmin') {
        navigate('/superadmin/dashboard', { replace: true });
      } else if (role === 'admin') {
        navigate('/admin', { replace: true });
      } else if (role === 'employee') {
        navigate('/employee', { replace: true });
      } else if (role === 'finance') {
        navigate('/finance', { replace: true });
      } else if (role === 'audit') {
        navigate('/audit', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (err: any) {
      console.error('LOGIN ERROR:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1929] via-[#0f2f47] to-[#0a1929] flex flex-col lg:flex-row">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-[45%] bg-gradient-to-br from-cyan-600/20 to-green-600/20 backdrop-blur-sm p-12 xl:p-16 flex-col justify-center items-center relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-96 h-96 bg-cyan-400 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-[500px] h-[500px] bg-green-400 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-xl w-full">
          {/* Clickable Logo */}
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-cyan-400 to-green-400 rounded-2xl mb-10 shadow-2xl shadow-cyan-500/50 hover:scale-105 transition-transform duration-200 cursor-pointer"
            aria-label="Back to home"
          >
            <span className="text-5xl font-bold text-[#0a1929]">S</span>
          </button>
          
          {/* Clickable Brand Name */}
          <button
            onClick={() => navigate('/')}
            className="text-left hover:scale-105 transition-transform duration-200 cursor-pointer mb-8"
            aria-label="Back to home"
          >
            <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-green-400">
              Spend<span className="text-green-400">Sync</span>
            </h1>
          </button>
          
          <p className="text-2xl text-gray-300 mb-12 leading-relaxed">
            Modern expense management and reimbursement platform for growing businesses
          </p>

          {/* Features */}
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-cyan-400 text-2xl">✓</span>
              </div>
              <div>
                <h3 className="text-white font-semibold text-xl mb-2">Automated Workflows</h3>
                <p className="text-gray-400 text-base">Streamline expense approvals with intelligent routing</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-green-400 text-2xl">✓</span>
              </div>
              <div>
                <h3 className="text-white font-semibold text-xl mb-2">Real-time Tracking</h3>
                <p className="text-gray-400 text-base">Monitor expenses and reimbursements in real-time</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-cyan-400 text-2xl">✓</span>
              </div>
              <div>
                <h3 className="text-white font-semibold text-xl mb-2">Comprehensive Reports</h3>
                <p className="text-gray-400 text-base">Generate detailed analytics and audit trails</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-[55%] flex items-center justify-center p-6 sm:p-8 lg:p-12">
        <div className="w-full max-w-xl">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-cyan-400 to-green-400 rounded-xl mb-4 hover:scale-105 transition-transform duration-200 cursor-pointer"
              aria-label="Back to home"
            >
              <span className="text-3xl font-bold text-[#0a1929]">S</span>
            </button>
            <button
              onClick={() => navigate('/')}
              className="hover:scale-105 transition-transform duration-200 cursor-pointer"
              aria-label="Back to home"
            >
              <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-green-400">
                SpendSync
              </h1>
            </button>
          </div>

          {/* Login Card */}
          <div className="bg-gradient-to-br from-[#1a4d5c]/40 to-[#0f3a47]/40 backdrop-blur-lg rounded-2xl border border-cyan-500/30 shadow-2xl p-8 sm:p-10 lg:p-12">
            <h2 className="text-3xl font-bold text-white mb-3">Welcome Back</h2>
            <p className="text-gray-400 mb-8 text-lg">Sign in to your account to continue</p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-gray-300 mb-3 font-medium text-base">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  disabled={isLoading}
                  className="w-full px-5 py-4 bg-[#0a1929]/50 border border-cyan-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition text-base"
                />
              </div>

              {/* Password Input */}
              <div>
                <label htmlFor="password" className="block text-gray-300 mb-3 font-medium text-base">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                  className="w-full px-5 py-4 bg-[#0a1929]/50 border border-cyan-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition text-base"
                />
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between flex-wrap gap-3">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-cyan-500/30 bg-[#0a1929]/50 text-cyan-500 focus:ring-2 focus:ring-cyan-400/20"
                  />
                  <span className="ml-2 text-sm text-gray-400">Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-cyan-400 hover:text-cyan-300 transition"
                >
                  Forgot password?
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-cyan-500 to-green-500 text-white font-semibold py-4 px-6 rounded-lg hover:from-cyan-600 hover:to-green-600 transition-all duration-300 shadow-lg hover:shadow-cyan-500/50 disabled:opacity-50 disabled:cursor-not-allowed text-base"
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>
          </div>

          {/* Footer */}
          <p className="text-center text-gray-500 text-sm mt-8">
            © 2026 SpendSync. All rights reserved.
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal 
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
      />
    </div>
  );
};

export default Login;

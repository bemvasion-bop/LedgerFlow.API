import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import api from '../services/api';

interface RegistrationForm {
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  companyAddress: string;
  adminFirstName: string;
  adminLastName: string;
  adminEmail: string;
  adminPassword: string;
  confirmPassword: string;
  planId: number;
  billingCycle: string;
}

interface PlanInfo {
  name: string;
  price: number;
  billingCycle: string;
  maxUsers: string;
  maxExpenses: string;
  features: string[];
}

interface PasswordRequirements {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

const RegisterCompany: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanInfo | null>(null);
  const [passwordRequirements, setPasswordRequirements] = useState<PasswordRequirements>({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecial: false,
  });
  const [formData, setFormData] = useState<RegistrationForm>({
    companyName: '',
    companyEmail: '',
    companyPhone: '',
    companyAddress: '',
    adminFirstName: '',
    adminLastName: '',
    adminEmail: '',
    adminPassword: '',
    confirmPassword: '',
    planId: 1, // Default to Starter plan
    billingCycle: 'Quarterly', // Default to Quarterly
  });

  // Parse query parameters and set plan on mount
  useEffect(() => {
    const plan = searchParams.get('plan')?.toLowerCase();
    const billing = searchParams.get('billing')?.toLowerCase();

    console.log('Query parameters:', { plan, billing });

    // Validate plan
    let planId = 1; // Default to Starter
    let planName = 'Starter';
    let planPrice = 1499;
    let maxUsers = '10 users';
    let maxExpenses = '100 expenses/month';
    let features = [
      'Expense tracking',
      'Basic dashboard',
      'PDF reports',
      'Email support',
      'Audit logs',
      'Expense tracking',
      'Receipt uploads',  // ✅ ADDED to Starter
      'Basic dashboard',
      'PDF reports',
      'Audit logs',
      'Export to Excel',
      'Admin approvals',
      'Reimbursements'
    ];

    if (plan === 'business') {
      planId = 2;
      planName = 'Business';
      planPrice = 6999;
      maxUsers = 'Unlimited users';
      maxExpenses = 'Unlimited expenses';
      features = [
        'Everything in Starter',
        'Finance & Audit roles',  // ✅ CHANGED from Multi-level approvals
        'Departments',
        'Role-based workflows',  // ✅ CHANGED from Approval workflows
        'Advanced analytics',
        'Advanced reports',
        'Priority support'
      ];
    }

    // Validate billing cycle
    let billingCycle = 'Quarterly';
    if (billing === 'yearly') {
      billingCycle = 'Yearly';
      planPrice = planName === 'Starter' ? 5499 : 24999;
    }

    console.log('Mapped values:', { planId, planName, billingCycle, planPrice });

    // Set plan info
    setSelectedPlan({
      name: planName,
      price: planPrice,
      billingCycle: billingCycle,
      maxUsers: maxUsers,
      maxExpenses: maxExpenses,
      features: features
    });

    // Update form data
    setFormData(prev => ({
      ...prev,
      planId: planId,
      billingCycle: billingCycle
    }));
  }, [searchParams]);

  // Check password requirements in real-time
  useEffect(() => {
    const password = formData.adminPassword;
    setPasswordRequirements({
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecial: /[@$!%*?&]/.test(password),
    });
  }, [formData.adminPassword]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = (): boolean => {
    if (!formData.companyName.trim()) {
      setError('Company name is required');
      return false;
    }
    if (!formData.companyEmail.trim() || !/\S+@\S+\.\S+/.test(formData.companyEmail)) {
      setError('Valid company email is required');
      return false;
    }
    if (!formData.adminFirstName.trim()) {
      setError('Admin first name is required');
      return false;
    }
    if (!formData.adminLastName.trim()) {
      setError('Admin last name is required');
      return false;
    }
    if (!formData.adminEmail.trim() || !/\S+@\S+\.\S+/.test(formData.adminEmail)) {
      setError('Valid admin email is required');
      return false;
    }
    if (formData.adminPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(formData.adminPassword)) {
      setError('Password must contain uppercase, lowercase, number, and special character');
      return false;
    }
    if (formData.adminPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Prepare request payload
      const payload = {
        companyName: formData.companyName,
        companyEmail: formData.companyEmail,
        companyPhone: formData.companyPhone || null,
        companyAddress: formData.companyAddress || null,
        adminFirstName: formData.adminFirstName,
        adminLastName: formData.adminLastName,
        adminEmail: formData.adminEmail,
        adminPassword: formData.adminPassword,
        planId: formData.planId,
        billingCycle: formData.billingCycle,
      };

      console.log('Registration payload:', {
        ...payload,
        adminPassword: '[REDACTED]'
      });

      const response = await api.post('/auth/register-company', payload);

      if (response.data.success) {
        // Navigate to OTP verification page
        navigate('/verify-email', { 
          state: { 
            email: formData.adminEmail,
            companyName: formData.companyName 
          } 
        });
      } else {
        setError(response.data.message || 'Registration failed. Please try again.');
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      
      // Show specific error messages from backend
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.response?.status === 404) {
        setError('Registration endpoint not found. Please contact support.');
      } else if (err.response?.status === 500) {
        setError('Server error occurred. Please try again later.');
      } else if (err.message === 'Network Error') {
        setError('Cannot connect to server. Please check if the backend is running.');
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1929] via-[#0f2f47] to-[#0a1929] flex items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-cyan-400 to-green-400 rounded-xl mb-4">
            <span className="text-2xl sm:text-3xl font-bold text-[#0a1929]">S</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-green-400 mb-2">
            Start Your Free Trial
          </h1>
          <p className="text-gray-400 text-base sm:text-lg px-4">
            Join SpendSync and transform your expense management
          </p>
        </div>

        {/* Selected Plan Summary */}
        {selectedPlan && (
          <div className="bg-gradient-to-br from-cyan-500/10 to-green-500/10 backdrop-blur-lg rounded-2xl border border-cyan-500/30 shadow-xl p-4 sm:p-6 mb-4 sm:mb-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg sm:text-xl font-bold text-cyan-400 mb-3 sm:mb-2">
                  {selectedPlan.name} Plan
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
                  <div>
                    <p className="text-gray-400 text-xs sm:text-sm">Billing Cycle</p>
                    <p className="text-white font-semibold text-sm sm:text-base">{selectedPlan.billingCycle}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs sm:text-sm">Price</p>
                    <p className="text-white font-semibold text-sm sm:text-base">
                      ₱{selectedPlan.price.toLocaleString()} / {selectedPlan.billingCycle.toLowerCase()}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs sm:text-sm">Users</p>
                    <p className="text-white font-semibold text-sm sm:text-base">{selectedPlan.maxUsers}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs sm:text-sm">Expenses</p>
                    <p className="text-white font-semibold text-sm sm:text-base">{selectedPlan.maxExpenses}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-green-400 bg-green-500/10 border border-green-500/30 rounded-lg px-3 sm:px-4 py-2">
                  <CheckCircle size={18} className="flex-shrink-0" />
                  <span className="font-semibold text-xs sm:text-sm">14-day free trial included</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Registration Form */}
        <div className="bg-gradient-to-br from-[#1a4d5c]/40 to-[#0f3a47]/40 backdrop-blur-lg rounded-2xl border border-cyan-500/30 shadow-2xl p-4 sm:p-6 lg:p-8">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Company Information */}
            <div>
              <h2 className="text-xl sm:text-2xl font-semibold text-cyan-400 mb-3 sm:mb-4 flex items-center">
                <span className="mr-2">🏢</span> Company Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-gray-300 mb-2 font-medium text-sm sm:text-base">
                    Company Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-[#0a1929]/50 border border-cyan-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition text-sm sm:text-base"
                    placeholder="Acme Corporation"
                    required
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-2 font-medium text-sm sm:text-base">
                    Company Email <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    name="companyEmail"
                    value={formData.companyEmail}
                    onChange={handleChange}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-[#0a1929]/50 border border-cyan-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition text-sm sm:text-base"
                    placeholder="company@example.com"
                    required
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-2 font-medium text-sm sm:text-base">
                    Company Phone
                  </label>
                  <input
                    type="tel"
                    name="companyPhone"
                    value={formData.companyPhone}
                    onChange={handleChange}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-[#0a1929]/50 border border-cyan-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition text-sm sm:text-base"
                    placeholder="+1 (555) 123-4567"
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-2 font-medium text-sm sm:text-base">
                    Company Address
                  </label>
                  <input
                    type="text"
                    name="companyAddress"
                    value={formData.companyAddress}
                    onChange={handleChange}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-[#0a1929]/50 border border-cyan-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition text-sm sm:text-base"
                    placeholder="123 Business St, City, State"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            {/* Admin Account */}
            <div>
              <h2 className="text-xl sm:text-2xl font-semibold text-cyan-400 mb-3 sm:mb-4 flex items-center">
                <span className="mr-2">👤</span> Admin Account
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-gray-300 mb-2 font-medium text-sm sm:text-base">
                    First Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="adminFirstName"
                    value={formData.adminFirstName}
                    onChange={handleChange}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-[#0a1929]/50 border border-cyan-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition text-sm sm:text-base"
                    placeholder="John"
                    required
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-2 font-medium text-sm sm:text-base">
                    Last Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="adminLastName"
                    value={formData.adminLastName}
                    onChange={handleChange}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-[#0a1929]/50 border border-cyan-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition text-sm sm:text-base"
                    placeholder="Doe"
                    required
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-2 font-medium text-sm sm:text-base">
                    Admin Email <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    name="adminEmail"
                    value={formData.adminEmail}
                    onChange={handleChange}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-[#0a1929]/50 border border-cyan-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition text-sm sm:text-base"
                    placeholder="admin@example.com"
                    required
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-2 font-medium text-sm sm:text-base">
                    Password <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="adminPassword"
                      value={formData.adminPassword}
                      onChange={handleChange}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 pr-10 sm:pr-12 bg-[#0a1929]/50 border border-cyan-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition text-sm sm:text-base"
                      placeholder="••••••••"
                      required
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-cyan-400 transition"
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-gray-300 mb-2 font-medium text-sm sm:text-base">
                    Confirm Password <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 pr-10 sm:pr-12 bg-[#0a1929]/50 border border-cyan-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition text-sm sm:text-base"
                      placeholder="••••••••"
                      required
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-cyan-400 transition"
                      disabled={isLoading}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Password Requirements Checklist */}
              {formData.adminPassword && (
                <div className="mt-4 p-3 sm:p-4 bg-[#0a1929]/30 border border-cyan-500/20 rounded-lg">
                  <p className="text-xs sm:text-sm text-gray-300 mb-2 sm:mb-3 font-medium">Password Requirements:</p>
                  <div className="space-y-1.5 sm:space-y-2">
                    <div className="flex items-center gap-2">
                      {passwordRequirements.minLength ? (
                        <CheckCircle size={14} className="text-green-400 flex-shrink-0 sm:w-4 sm:h-4" />
                      ) : (
                        <XCircle size={14} className="text-red-400 flex-shrink-0 sm:w-4 sm:h-4" />
                      )}
                      <span className={`text-xs sm:text-sm ${passwordRequirements.minLength ? 'text-green-400' : 'text-gray-400'}`}>
                        At least 8 characters
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {passwordRequirements.hasUppercase ? (
                        <CheckCircle size={14} className="text-green-400 flex-shrink-0 sm:w-4 sm:h-4" />
                      ) : (
                        <XCircle size={14} className="text-red-400 flex-shrink-0 sm:w-4 sm:h-4" />
                      )}
                      <span className={`text-xs sm:text-sm ${passwordRequirements.hasUppercase ? 'text-green-400' : 'text-gray-400'}`}>
                        One uppercase letter
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {passwordRequirements.hasLowercase ? (
                        <CheckCircle size={14} className="text-green-400 flex-shrink-0 sm:w-4 sm:h-4" />
                      ) : (
                        <XCircle size={14} className="text-red-400 flex-shrink-0 sm:w-4 sm:h-4" />
                      )}
                      <span className={`text-xs sm:text-sm ${passwordRequirements.hasLowercase ? 'text-green-400' : 'text-gray-400'}`}>
                        One lowercase letter
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {passwordRequirements.hasNumber ? (
                        <CheckCircle size={14} className="text-green-400 flex-shrink-0 sm:w-4 sm:h-4" />
                      ) : (
                        <XCircle size={14} className="text-red-400 flex-shrink-0 sm:w-4 sm:h-4" />
                      )}
                      <span className={`text-xs sm:text-sm ${passwordRequirements.hasNumber ? 'text-green-400' : 'text-gray-400'}`}>
                        One number
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {passwordRequirements.hasSpecial ? (
                        <CheckCircle size={14} className="text-green-400 flex-shrink-0 sm:w-4 sm:h-4" />
                      ) : (
                        <XCircle size={14} className="text-red-400 flex-shrink-0 sm:w-4 sm:h-4" />
                      )}
                      <span className={`text-xs sm:text-sm ${passwordRequirements.hasSpecial ? 'text-green-400' : 'text-gray-400'}`}>
                        One special character (@$!%*?&)
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 sm:p-4">
                <p className="text-red-400 text-xs sm:text-sm">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex flex-col gap-3 sm:gap-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-cyan-500 to-green-500 text-white font-semibold py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg hover:from-cyan-600 hover:to-green-600 transition-all duration-300 shadow-lg hover:shadow-cyan-500/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin sm:w-5 sm:h-5" />
                    <span>Creating your workspace...</span>
                  </>
                ) : (
                  'Start Free Trial'
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate('/login')}
                disabled={isLoading}
                className="w-full bg-transparent border border-cyan-500/30 text-cyan-400 font-semibold py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg hover:bg-cyan-500/10 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                Already have an account?
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-xs sm:text-sm mt-4 sm:mt-6 px-4">
          By signing up, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
};

export default RegisterCompany;

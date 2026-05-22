import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  CreditCard, 
  Calendar, 
  Users, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  Zap,
  Clock,
  Building2,
  Shield,
  Sparkles
} from 'lucide-react';
import { ManageSubscriptionModal } from '../subscription/ManageSubscriptionModal';
import { DemoPaymentModal } from '../subscription/DemoPaymentModal';
import { UpgradeSuccessModal } from '../subscription/UpgradeSuccessModal';
import { ConfirmationModal } from '../modals/ConfirmationModal';
import api from '../../services/api';

interface PlanInfo {
  companyId: number;
  companyName: string;
  planId: number;
  planName: string;
  planDescription: string;
  subscriptionStatus: string;
  trialDaysRemaining: number | null;
  trialEndsAt: string | null;
  subscriptionStartedAt: string | null;
  subscriptionExpiresAt: string | null;
  billingCycle: string;
  maxUsers: number;
  maxExpensesPerMonth: number;
  canUploadReceipt: boolean;
  hasAdvancedReports: boolean;
  hasAdvancedAnalytics: boolean;
  hasDepartmentAnalytics: boolean;
  hasRoleBasedWorkflows: boolean;
  hasPrioritySupport: boolean;
  quarterlyPrice: number;
  yearlyPrice: number;
}

export const SubscriptionSection: React.FC = () => {
  const [planInfo, setPlanInfo] = useState<PlanInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Upgrade modal states
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [selectedPlanType, setSelectedPlanType] = useState<'STARTER' | 'BUSINESS'>('BUSINESS');
  const [selectedBillingCycle, setSelectedBillingCycle] = useState<'Quarterly' | 'Yearly'>('Yearly');
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  
  // Confirmation modal states
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [confirmationModalType, setConfirmationModalType] = useState<'success' | 'error'>('success');
  const [confirmationModalTitle, setConfirmationModalTitle] = useState('');
  const [confirmationModalMessage, setConfirmationModalMessage] = useState('');

  useEffect(() => {
    const fetchPlanInfo = async () => {
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        
        if (!token) {
          setError('Authentication token not found');
          setLoading(false);
          return;
        }

        console.log('🔍 Fetching plan information...');
        
        const response = await axios.get('http://localhost:5256/api/plan/current', {
          headers: { Authorization: `Bearer ${token}` }
        });

        console.log('✅ Plan information loaded:', response.data);
        setPlanInfo(response.data);
        setLoading(false);
      } catch (err: any) {
        console.error('❌ Failed to fetch plan information:', err);
        console.error('Error response:', err.response?.data);
        console.error('Error status:', err.response?.status);
        
        if (err.response?.status === 401) {
          setError('Authentication failed. Please login again.');
        } else if (err.response?.status === 404) {
          setError('Plan information not found. Please contact support.');
        } else {
          setError('Failed to load subscription information. Please try again.');
        }
        
        setLoading(false);
      }
    };

    fetchPlanInfo();
  }, []);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      Trial: { 
        color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', 
        icon: Clock,
        label: 'Trial Active'
      },
      Active: { 
        color: 'bg-green-500/20 text-green-400 border-green-500/30', 
        icon: CheckCircle,
        label: 'Active'
      },
      Expired: { 
        color: 'bg-red-500/20 text-red-400 border-red-500/30', 
        icon: AlertCircle,
        label: 'Expired'
      },
      Suspended: { 
        color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', 
        icon: AlertCircle,
        label: 'Suspended'
      }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.Trial;
    const Icon = config.icon;

    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${config.color} text-sm font-semibold`}>
        <Icon className="w-4 h-4" />
        {config.label}
      </div>
    );
  };

  const getPlanBadge = (planName: string) => {
    const isBusinessPlan = planName === 'Business';
    const Icon = isBusinessPlan ? Sparkles : Shield;
    
    return (
      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-base font-bold ${
        isBusinessPlan
          ? 'bg-gradient-to-r from-cyan-500/20 to-teal-500/20 text-cyan-400 border-cyan-500/30'
          : 'bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-blue-400 border-blue-500/30'
      }`}>
        <Icon className="w-5 h-5" />
        {planName} Plan
      </div>
    );
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatNumber = (num: number) => {
    return num === -1 ? 'Unlimited' : num.toLocaleString();
  };

  // Handle plan selection from ManageSubscriptionModal
  const handleSelectPlan = (planType: 'STARTER' | 'BUSINESS', billingCycle: 'Quarterly' | 'Yearly') => {
    setSelectedPlanType(planType);
    setSelectedBillingCycle(billingCycle);
    setShowUpgradeModal(false);
    setShowPaymentModal(true);
  };



  // Handle payment success from DemoPaymentModal
  const handlePaymentSuccess = async () => {
    setShowPaymentModal(false);
    
    try {
      // Use the new request-based flow instead of immediate upgrade
      const res = await api.post('/subscription/request-change', {
        billingCycle: selectedBillingCycle,
        reason: `Plan change request: ${selectedBillingCycle} billing`
      });
      
      // Show success modal
      setConfirmationModalType('success');
      setConfirmationModalTitle('Request Submitted');
      setConfirmationModalMessage(res.data.message || 'Subscription request submitted successfully. Awaiting Super Admin approval.');
      setShowConfirmationModal(true);
      
      // Close all modals
      setShowUpgradeModal(false);
      setShowPaymentModal(false);
    } catch (error: any) {
      console.error('Plan change request failed:', error);
      
      // Show error modal
      setConfirmationModalType('error');
      setConfirmationModalTitle('Request Failed');
      setConfirmationModalMessage(error.response?.data?.message || 'Plan change request failed. Please try again.');
      setShowConfirmationModal(true);
      
      setShowPaymentModal(true); // Reopen payment modal on error
    }
  };

  // Handle confirmation modal close
  const handleConfirmationClose = () => {
    setShowConfirmationModal(false);
    
    // Reload page if it was a success
    if (confirmationModalType === 'success') {
      window.location.reload();
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
        <div className="flex items-center gap-3 mb-6">
          <CreditCard className="w-6 h-6 text-cyan-400" />
          <h2 className="text-xl font-bold text-white">Subscription & Plan</h2>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
        <div className="flex items-center gap-3 mb-6">
          <CreditCard className="w-6 h-6 text-cyan-400" />
          <h2 className="text-xl font-bold text-white">Subscription & Plan</h2>
        </div>
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-red-400 font-semibold mb-1">Error Loading Subscription</div>
              <div className="text-gray-400 text-sm">{error}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!planInfo) {
    return null;
  }

  const isBusinessPlan = planInfo.planName === 'Business';
  const isTrial = planInfo.subscriptionStatus === 'Trial';

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <CreditCard className="w-6 h-6 text-cyan-400" />
        <h2 className="text-xl font-bold text-white">Subscription & Plan</h2>
      </div>

      {/* Plan & Status Badges */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        {getPlanBadge(planInfo.planName)}
        {getStatusBadge(planInfo.subscriptionStatus)}
      </div>

      {/* Trial Warning */}
      {isTrial && planInfo.trialDaysRemaining !== null && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-yellow-400 font-semibold mb-1">
                {planInfo.trialDaysRemaining} days remaining in your trial
              </div>
              <div className="text-gray-400 text-sm">
                Your trial ends on {formatDate(planInfo.trialEndsAt)}. Upgrade to continue using SpendSync.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Company & Billing Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Company Name */}
        <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700/30">
          <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
            <Building2 className="w-4 h-4" />
            Company
          </div>
          <div className="text-white font-semibold">{planInfo.companyName}</div>
        </div>

        {/* Billing Cycle */}
        <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700/30">
          <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
            <Calendar className="w-4 h-4" />
            Billing Cycle
          </div>
          <div className="text-white font-semibold">{planInfo.billingCycle}</div>
        </div>

        {/* User Limit */}
        <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700/30">
          <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
            <Users className="w-4 h-4" />
            User Limit
          </div>
          <div className="text-white font-semibold">
            {formatNumber(planInfo.maxUsers)}
          </div>
        </div>

        {/* Expense Limit */}
        <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700/30">
          <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
            <TrendingUp className="w-4 h-4" />
            Monthly Expense Limit
          </div>
          <div className="text-white font-semibold">
            {formatNumber(planInfo.maxExpensesPerMonth)}
          </div>
        </div>
      </div>

      {/* Plan Features */}
      <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700/30 mb-6">
        <div className="flex items-center gap-2 text-white font-semibold mb-3">
          <Zap className="w-5 h-5 text-cyan-400" />
          Enabled Features
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {planInfo.canUploadReceipt && (
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-gray-300">Receipt Uploads</span>
            </div>
          )}
          {planInfo.hasAdvancedReports && (
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-gray-300">Advanced Reports</span>
            </div>
          )}
          {planInfo.hasAdvancedAnalytics && (
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-gray-300">Advanced Analytics</span>
            </div>
          )}
          {planInfo.hasDepartmentAnalytics && (
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-gray-300">Department Analytics</span>
            </div>
          )}
          {planInfo.hasRoleBasedWorkflows && (
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-gray-300">Finance & Audit Roles</span>
            </div>
          )}
          {planInfo.hasPrioritySupport && (
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-gray-300">Priority Support</span>
            </div>
          )}
        </div>
      </div>

      {/* Manage Subscription Button - For ALL Users */}
      <button
        onClick={() => setShowUpgradeModal(true)}
        className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 text-white font-semibold py-3 px-6 rounded-lg hover:from-cyan-600 hover:to-teal-600 transition-all duration-300 shadow-lg hover:shadow-cyan-500/50"
      >
        Manage Subscription
      </button>

      {/* Manage Subscription Modal */}
      <ManageSubscriptionModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onSelectPlan={handleSelectPlan}
        currentPlan={planInfo.planName.toUpperCase()}
        currentBillingCycle={planInfo.billingCycle}
        subscriptionStatus={planInfo.subscriptionStatus}
        trialEndsAt={planInfo.trialEndsAt}
        subscriptionExpiresAt={planInfo.subscriptionExpiresAt}
      />

      <DemoPaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onPaymentSuccess={handlePaymentSuccess}
        planType={selectedPlanType}
        billingCycle={selectedBillingCycle}
      />

      <UpgradeSuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        subscriptionData={subscriptionData}
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmationModal}
        onClose={handleConfirmationClose}
        type={confirmationModalType}
        title={confirmationModalTitle}
        message={confirmationModalMessage}
        confirmText="OK"
        showCancel={false}
      />
    </div>
  );
};

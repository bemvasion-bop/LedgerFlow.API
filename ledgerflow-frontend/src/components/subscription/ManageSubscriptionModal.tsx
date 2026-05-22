import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, Check, Zap, Shield, AlertTriangle, Calendar, TrendingDown, Sparkles } from 'lucide-react';

type PlanType = 'STARTER' | 'BUSINESS';
type BillingCycle = 'Quarterly' | 'Yearly';

interface ManageSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlan: (planType: PlanType, billingCycle: BillingCycle) => void;
  currentPlan: string; // 'STARTER', 'BUSINESS'
  currentBillingCycle?: string | null; // 'Quarterly', 'Yearly', null
  subscriptionStatus?: string; // 'Trial', 'Active', 'Expired'
  trialEndsAt?: string | null;
  subscriptionExpiresAt?: string | null;
}

export const ManageSubscriptionModal: React.FC<ManageSubscriptionModalProps> = ({
  isOpen,
  onClose,
  onSelectPlan,
  currentPlan,
  currentBillingCycle = null,
  subscriptionStatus = 'Active',
  trialEndsAt = null,
  subscriptionExpiresAt = null,
}) => {
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('BUSINESS');
  const [selectedBillingCycle, setSelectedBillingCycle] = useState<BillingCycle>('Yearly');
  const [showDowngradeWarning, setShowDowngradeWarning] = useState(false);

  // Lock body scroll when modal opens
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Set initial selection based on current plan
  useEffect(() => {
    if (isOpen) {
      const isStarter = currentPlan === 'STARTER' || currentPlan === 'Starter';
      setSelectedPlan(isStarter ? 'BUSINESS' : 'STARTER');
      setSelectedBillingCycle(currentBillingCycle === 'Quarterly' ? 'Yearly' : 'Quarterly');
    }
  }, [isOpen, currentPlan, currentBillingCycle]);

  if (!isOpen) return null;

  const isStarterPlan = currentPlan === 'STARTER' || currentPlan === 'Starter';
  const isBusinessPlan = currentPlan === 'BUSINESS' || currentPlan === 'Business';
  const isTrial = subscriptionStatus === 'Trial';

  // Pricing (source of truth)
  const pricing = {
    STARTER: {
      Quarterly: 1499,
      Yearly: 5499,
    },
    BUSINESS: {
      Quarterly: 6999,
      Yearly: 24999,
    },
  };

  // Check if current plan/cycle combination
  const isCurrentSelection = () => {
    if (isTrial) return false; // Trial users don't have a "current" paid plan
    return (
      (selectedPlan === 'STARTER' && isStarterPlan && selectedBillingCycle === currentBillingCycle) ||
      (selectedPlan === 'BUSINESS' && isBusinessPlan && selectedBillingCycle === currentBillingCycle)
    );
  };

  // Get action button text
  const getActionButtonText = () => {
    if (isCurrentSelection()) return 'Current Plan';
    
    if (isTrial) {
      return selectedPlan === 'BUSINESS' ? 'Upgrade to Business' : 'Continue to Payment';
    }
    
    if (selectedPlan === 'STARTER' && isBusinessPlan) {
      return 'Downgrade to Starter';
    }
    
    if (selectedPlan === 'BUSINESS' && isStarterPlan) {
      return 'Upgrade to Business';
    }
    
    if (selectedPlan === currentPlan && selectedBillingCycle !== currentBillingCycle) {
      return 'Change Billing Cycle';
    }
    
    return 'Confirm Change';
  };

  // Handle plan selection
  const handleContinue = () => {
    if (isCurrentSelection()) return;
    
    // If downgrading to Starter, show warning first
    if (selectedPlan === 'STARTER' && isBusinessPlan) {
      setShowDowngradeWarning(true);
      return;
    }
    
    onSelectPlan(selectedPlan, selectedBillingCycle);
  };

  // Handle downgrade confirmation
  const handleConfirmDowngrade = () => {
    setShowDowngradeWarning(false);
    onSelectPlan(selectedPlan, selectedBillingCycle);
  };

  // Format date
  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Format price
  const formatPrice = (price: number) => {
    return `₱${price.toLocaleString()}`;
  };

  // Get current subscription display
  const getCurrentSubscriptionDisplay = () => {
    if (isTrial) {
      return {
        title: 'Starter Trial',
        subtitle: `Trial ends ${formatDate(trialEndsAt)}`,
        showTrialBadge: true
      };
    }
    
    if (isStarterPlan) {
      return {
        title: `Starter Plan - ${currentBillingCycle}`,
        subtitle: `Renews on ${formatDate(subscriptionExpiresAt)}`,
        showTrialBadge: false
      };
    }
    
    if (isBusinessPlan) {
      return {
        title: `Business Plan - ${currentBillingCycle}`,
        subtitle: `Renews on ${formatDate(subscriptionExpiresAt)}`,
        showTrialBadge: false
      };
    }
    
    return {
      title: 'Unknown Plan',
      subtitle: 'N/A',
      showTrialBadge: false
    };
  };

  const currentSubscription = getCurrentSubscriptionDisplay();

  // Calculate renewal date for selected plan
  const getSelectedRenewalDate = () => {
    const months = selectedBillingCycle === 'Quarterly' ? 3 : 12;
    const renewalDate = new Date();
    renewalDate.setMonth(renewalDate.getMonth() + months);
    return renewalDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[90vh] rounded-2xl border border-cyan-500/20 bg-[#0f172a] shadow-[0_0_50px_rgba(0,255,255,0.15)] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Sticky */}
        <div className="sticky top-0 z-10 px-6 py-4 border-b border-cyan-500/20 bg-slate-900/80 backdrop-blur-sm rounded-t-2xl">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-cyan-400 mb-1">
                Manage Subscription
              </h2>
              <p className="text-gray-400 text-sm">
                View and manage your subscription plan
              </p>
            </div>
            <button
              onClick={onClose}
              className="ml-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all duration-200 flex-shrink-0"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body - Scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* Current Subscription Section */}
          <div className="mb-5 p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/20">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Current Subscription</p>
                <p className="text-lg font-bold text-white mb-0.5">
                  {currentSubscription.title}
                </p>
                <p className="text-sm text-gray-400">
                  {currentSubscription.subtitle}
                </p>
              </div>
              {currentSubscription.showTrialBadge && (
                <div className="px-3 py-1.5 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-bold uppercase tracking-wide flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Trial Active
                </div>
              )}
            </div>
          </div>

          {/* Billing Cycle Toggle */}
          <div className="mb-5 flex items-center justify-center gap-4">
            <span className={`text-sm font-medium transition-colors ${selectedBillingCycle === 'Quarterly' ? 'text-white' : 'text-gray-500'}`}>
              Quarterly
            </span>
            <button
              onClick={() => setSelectedBillingCycle(selectedBillingCycle === 'Quarterly' ? 'Yearly' : 'Quarterly')}
              className="relative w-14 h-7 bg-gray-700 rounded-full transition-colors hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <div
                className={`absolute top-0.5 left-0.5 w-6 h-6 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-full transition-transform ${
                  selectedBillingCycle === 'Yearly' ? 'translate-x-7' : 'translate-x-0'
                }`}
              ></div>
            </button>
            <span className={`text-sm font-medium transition-colors ${selectedBillingCycle === 'Yearly' ? 'text-white' : 'text-gray-500'}`}>
              Yearly
            </span>
            {selectedBillingCycle === 'Yearly' && (
              <span className="ml-2 px-2 py-0.5 bg-gradient-to-r from-cyan-500/20 to-teal-500/20 border border-cyan-500/30 rounded-full text-cyan-400 text-xs font-semibold">
                Save up to 25%
              </span>
            )}
          </div>

          {/* Plan Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
            {/* Starter Plan Card */}
            <div
              onClick={() => setSelectedPlan('STARTER')}
              className={`relative p-5 rounded-xl transition-all duration-300 cursor-pointer ${
                selectedPlan === 'STARTER'
                  ? 'border-2 border-cyan-400 bg-cyan-500/10 shadow-lg shadow-cyan-500/20'
                  : 'border-2 border-gray-700 bg-slate-800/50 hover:border-gray-600'
              }`}
            >
              {/* Current Badge - Only for paid subscriptions */}
              {!isTrial && isStarterPlan && selectedBillingCycle === currentBillingCycle && (
                <div className="absolute -top-2.5 left-3 px-3 py-1 rounded-full bg-gradient-to-r from-green-500 to-green-400 text-white text-xs font-bold uppercase tracking-wide shadow-lg flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  Current
                </div>
              )}

              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-0.5">
                    Starter Plan
                  </h3>
                  <p className="text-gray-400 text-xs">Perfect for startups and small teams</p>
                </div>
                {selectedPlan === 'STARTER' && (
                  <div className="w-5 h-5 rounded-full bg-cyan-400 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-slate-900" />
                  </div>
                )}
              </div>

              <div className="mb-4">
                <div className="flex items-baseline gap-2 mb-0.5">
                  <span className="text-3xl font-bold text-cyan-400">
                    {formatPrice(pricing.STARTER[selectedBillingCycle])}
                  </span>
                  <span className="text-base text-gray-400">
                    /{selectedBillingCycle === 'Quarterly' ? 'qtr' : 'yr'}
                  </span>
                </div>
                {selectedBillingCycle === 'Yearly' && (
                  <p className="text-xs text-green-400 font-semibold">
                    Save 20% with yearly billing
                  </p>
                )}
              </div>

              <div className="mb-3 p-3 bg-gray-900/50 rounded-lg border border-gray-700/50">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-400">Users</span>
                  <span className="text-white font-semibold">10 users</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Expenses</span>
                  <span className="text-white font-semibold">100/month</span>
                </div>
              </div>

              <div className="space-y-1.5">
                {[
                  'Expense tracking',
                  'Receipt uploads',
                  'Basic dashboard',
                  'PDF reports',
                  'Audit logs',
                  'Excel exports',
                  'Admin approvals',
                  'Reimbursements',
                  'Email support',
                ].map((feature) => (
                  <div key={feature} className="flex items-center gap-2">
                    <Check className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                    <span className="text-gray-300 text-xs">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Business Plan Card */}
            <div
              onClick={() => setSelectedPlan('BUSINESS')}
              className={`relative p-5 rounded-xl transition-all duration-300 cursor-pointer ${
                selectedPlan === 'BUSINESS'
                  ? 'border-2 border-cyan-400 bg-cyan-500/10 shadow-lg shadow-cyan-500/20'
                  : 'border-2 border-gray-700 bg-slate-800/50 hover:border-gray-600'
              }`}
            >
              {/* Most Popular Badge */}
              {selectedPlan !== 'BUSINESS' && (
                <div className="absolute -top-2.5 right-3 px-3 py-1 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-300 text-slate-900 text-xs font-bold uppercase tracking-wide shadow-lg flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Most Popular
                </div>
              )}

              {/* Current Badge - Only for paid subscriptions */}
              {!isTrial && isBusinessPlan && selectedBillingCycle === currentBillingCycle && (
                <div className="absolute -top-2.5 left-3 px-3 py-1 rounded-full bg-gradient-to-r from-green-500 to-green-400 text-white text-xs font-bold uppercase tracking-wide shadow-lg flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  Current
                </div>
              )}

              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-0.5">
                    Business Plan
                  </h3>
                  <p className="text-gray-400 text-xs">Built for growing companies</p>
                </div>
                {selectedPlan === 'BUSINESS' && (
                  <div className="w-5 h-5 rounded-full bg-cyan-400 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-slate-900" />
                  </div>
                )}
              </div>

              <div className="mb-4">
                <div className="flex items-baseline gap-2 mb-0.5">
                  <span className="text-3xl font-bold text-cyan-400">
                    {formatPrice(pricing.BUSINESS[selectedBillingCycle])}
                  </span>
                  <span className="text-base text-gray-400">
                    /{selectedBillingCycle === 'Quarterly' ? 'qtr' : 'yr'}
                  </span>
                </div>
                {selectedBillingCycle === 'Yearly' && (
                  <p className="text-xs text-green-400 font-semibold">
                    Save 25% with yearly billing
                  </p>
                )}
              </div>

              <div className="mb-3 p-3 bg-gray-900/50 rounded-lg border border-gray-700/50">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-400">Users</span>
                  <span className="text-cyan-400 font-semibold">Unlimited</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Expenses</span>
                  <span className="text-cyan-400 font-semibold">Unlimited</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2 mb-2">
                  <Check className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                  <span className="text-white text-xs font-semibold">Everything in Starter</span>
                </div>
                {[
                  'Finance & Audit roles',
                  'Departments',
                  'Role-based workflows',
                  'Advanced analytics',
                  'Advanced reports',
                  'Priority support',
                  'Unlimited users',
                  'Unlimited expenses',
                ].map((feature) => (
                  <div key={feature} className="flex items-center gap-2">
                    <Check className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                    <span className="text-gray-300 text-xs">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Selected Plan Summary */}
          <div className="p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/20">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Selected Plan</p>
                <p className="text-lg font-semibold text-white">
                  {selectedPlan === 'STARTER' ? 'Starter' : 'Business'} - {selectedBillingCycle}
                </p>
                <p className="text-sm text-cyan-400">
                  {formatPrice(pricing[selectedPlan][selectedBillingCycle])} / {selectedBillingCycle === 'Quarterly' ? 'quarter' : 'year'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400 mb-0.5">
                  {isCurrentSelection() ? 'Current Renewal' : 'Next Renewal'}
                </p>
                <p className="text-base font-semibold text-cyan-400">
                  {getSelectedRenewalDate()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Sticky */}
        <div className="sticky bottom-0 z-10 px-6 py-4 border-t border-cyan-500/20 bg-slate-900/80 backdrop-blur-sm flex items-center justify-between gap-3 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/20 text-white font-semibold transition-all duration-200 text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleContinue}
            disabled={isCurrentSelection()}
            className={`px-6 py-2.5 rounded-lg font-bold transition-all duration-200 flex items-center gap-2 shadow-lg text-sm ${
              isCurrentSelection()
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : selectedPlan === 'STARTER' && isBusinessPlan
                ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white hover:shadow-orange-500/50 hover:-translate-y-0.5'
                : 'bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-slate-900 hover:shadow-cyan-500/50 hover:-translate-y-0.5'
            }`}
          >
            {selectedPlan === 'STARTER' && isBusinessPlan && !isCurrentSelection() && (
              <TrendingDown className="w-4 h-4" />
            )}
            {!isCurrentSelection() && selectedPlan !== 'STARTER' && (
              <Zap className="w-4 h-4" />
            )}
            {getActionButtonText()}
          </button>
        </div>
      </div>

      {/* Downgrade Warning Modal */}
      {showDowngradeWarning && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          onClick={() => setShowDowngradeWarning(false)}
        >
          <div
            className="relative w-full max-w-md rounded-2xl border border-orange-500/30 bg-[#0f172a] shadow-[0_0_50px_rgba(255,165,0,0.2)] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Warning Header */}
            <div className="px-5 py-4 border-b border-orange-500/20 bg-orange-500/10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-orange-500/20">
                  <AlertTriangle className="w-6 h-6 text-orange-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-orange-400">Downgrade Subscription</h3>
                  <p className="text-xs text-gray-400">Please review before proceeding</p>
                </div>
              </div>
            </div>

            {/* Warning Body */}
            <div className="px-5 py-4">
              <p className="text-sm text-gray-300 mb-4">
                Downgrading will remove the following features:
              </p>
              
              <div className="p-3 rounded-lg bg-orange-500/5 border border-orange-500/20 mb-4">
                <ul className="space-y-1.5">
                  {[
                    'Departments',
                    'Finance & Audit roles',
                    'Advanced analytics',
                    'Unlimited users',
                    'Unlimited expenses',
                  ].map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-xs text-gray-400">
                      <X className="w-3 h-3 text-orange-400 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <p className="text-xs text-gray-400">
                Your data will remain safe, but premium features will become inaccessible.
              </p>
            </div>

            {/* Warning Footer */}
            <div className="px-5 py-4 border-t border-orange-500/20 bg-slate-900/50 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDowngradeWarning(false)}
                className="px-5 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/20 text-white font-semibold transition-all duration-200 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDowngrade}
                className="px-6 py-2.5 rounded-lg font-bold transition-all duration-200 flex items-center gap-2 shadow-lg text-sm bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white hover:shadow-orange-500/50 hover:-translate-y-0.5"
              >
                <TrendingDown className="w-4 h-4" />
                Confirm Downgrade
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Use portal to render modal at root level
  return ReactDOM.createPortal(modalContent, document.body);
};

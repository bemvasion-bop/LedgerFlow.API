import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, Check, Zap, TrendingUp, Shield } from 'lucide-react';

interface UpgradePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlan: (billingCycle: 'Quarterly' | 'Yearly') => void;
  currentPlan?: string; // 'STARTER', 'BUSINESS'
  currentBillingCycle?: string; // 'Quarterly', 'Yearly'
}

export const UpgradePlanModal: React.FC<UpgradePlanModalProps> = ({
  isOpen,
  onClose,
  onSelectPlan,
  currentPlan = 'STARTER',
  currentBillingCycle = null,
}) => {
  const [selectedPlan, setSelectedPlan] = useState<'Quarterly' | 'Yearly'>('Yearly');

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
      // If user has Quarterly, default to Yearly
      if (currentBillingCycle === 'Quarterly') {
        setSelectedPlan('Yearly');
      } else {
        // Default to Yearly for new users or Yearly renewals
        setSelectedPlan('Yearly');
      }
    }
  }, [isOpen, currentBillingCycle]);

  if (!isOpen) return null;

  const handleContinue = () => {
    onSelectPlan(selectedPlan);
  };

  // Determine if user is on Starter plan
  const isStarterPlan = currentPlan === 'STARTER';
  const isQuarterlyUser = currentBillingCycle === 'Quarterly';
  const isYearlyUser = currentBillingCycle === 'Yearly';

  // Dynamic title and subtitle
  const getModalTitle = () => {
    if (isStarterPlan) return 'Upgrade Plan';
    if (isQuarterlyUser) return 'Upgrade Plan';
    if (isYearlyUser) return 'Manage Subscription';
    return 'Upgrade Plan';
  };

  const getModalSubtitle = () => {
    if (isStarterPlan) return 'Choose the best subscription plan for your company';
    if (isQuarterlyUser) return 'Switch to Yearly for better savings';
    if (isYearlyUser) return 'Renew or modify your subscription';
    return 'Choose the best subscription plan for your company';
  };

  // Check if a plan is the current active plan
  const isCurrentPlan = (cycle: 'Quarterly' | 'Yearly') => {
    return !isStarterPlan && currentBillingCycle === cycle;
  };

  // Check if a plan can be selected
  const canSelectPlan = (cycle: 'Quarterly' | 'Yearly') => {
    return !isCurrentPlan(cycle);
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
                {getModalTitle()}
              </h2>
              <p className="text-gray-400 text-sm">
                {getModalSubtitle()}
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
          {/* Plan Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
            {/* Quarterly Plan */}
            <div
              onClick={() => canSelectPlan('Quarterly') && setSelectedPlan('Quarterly')}
              className={`relative p-5 rounded-xl transition-all duration-300 ${
                isCurrentPlan('Quarterly')
                  ? 'border-2 border-green-500 bg-green-500/10 cursor-not-allowed'
                  : canSelectPlan('Quarterly')
                  ? selectedPlan === 'Quarterly'
                    ? 'border-2 border-cyan-400 bg-cyan-500/10 shadow-lg shadow-cyan-500/20 cursor-pointer'
                    : 'border-2 border-gray-700 bg-slate-800/50 hover:border-gray-600 cursor-pointer'
                  : 'border-2 border-gray-700 bg-slate-800/50 opacity-50 cursor-not-allowed'
              }`}
            >
              {/* Current Plan Badge */}
              {isCurrentPlan('Quarterly') && (
                <div className="absolute -top-2.5 left-4 px-3 py-1 rounded-full bg-gradient-to-r from-green-500 to-green-400 text-white text-xs font-bold uppercase tracking-wide shadow-lg flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  Current Plan
                </div>
              )}

              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-0.5">
                    Quarterly Plan
                  </h3>
                  <p className="text-gray-400 text-xs">Billed every 3 months</p>
                </div>
                {selectedPlan === 'Quarterly' && !isCurrentPlan('Quarterly') && (
                  <div className="w-6 h-6 rounded-full bg-cyan-400 flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-slate-900" />
                  </div>
                )}
                {isCurrentPlan('Quarterly') && (
                  <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>

              <div className="mb-4">
                <div className="flex items-baseline gap-2 mb-0.5">
                  <span className="text-4xl font-bold text-cyan-400">₱2,499</span>
                  <span className="text-lg text-gray-400">/quarter</span>
                </div>
                <p className="text-xs text-gray-500">₱833 per month</p>
              </div>

              <div className="space-y-2">
                {[
                  'Departments & Analytics',
                  'Finance Approval Workflow',
                  'Auditor Access',
                  'Advanced Reports',
                ].map((feature) => (
                  <div key={feature} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                    <span className="text-gray-300 text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Yearly Plan */}
            <div
              onClick={() => canSelectPlan('Yearly') && setSelectedPlan('Yearly')}
              className={`relative p-5 rounded-xl transition-all duration-300 ${
                isCurrentPlan('Yearly')
                  ? 'border-2 border-green-500 bg-green-500/10 cursor-not-allowed'
                  : canSelectPlan('Yearly')
                  ? selectedPlan === 'Yearly'
                    ? 'border-2 border-cyan-400 bg-cyan-500/10 shadow-lg shadow-cyan-500/20 cursor-pointer'
                    : 'border-2 border-gray-700 bg-slate-800/50 hover:border-gray-600 cursor-pointer'
                  : 'border-2 border-gray-700 bg-slate-800/50 opacity-50 cursor-not-allowed'
              }`}
            >
              {/* Best Value Badge */}
              {!isCurrentPlan('Yearly') && (
                <div className="absolute -top-2.5 right-4 px-3 py-1 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-300 text-slate-900 text-xs font-bold uppercase tracking-wide shadow-lg flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  Best Value
                </div>
              )}

              {/* Current Plan Badge */}
              {isCurrentPlan('Yearly') && (
                <div className="absolute -top-2.5 left-4 px-3 py-1 rounded-full bg-gradient-to-r from-green-500 to-green-400 text-white text-xs font-bold uppercase tracking-wide shadow-lg flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  Current Plan
                </div>
              )}

              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-0.5">
                    Yearly Plan
                  </h3>
                  <p className="text-gray-400 text-xs">Billed annually</p>
                </div>
                {selectedPlan === 'Yearly' && !isCurrentPlan('Yearly') && (
                  <div className="w-6 h-6 rounded-full bg-cyan-400 flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-slate-900" />
                  </div>
                )}
                {isCurrentPlan('Yearly') && (
                  <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>

              <div className="mb-4">
                <div className="flex items-baseline gap-2 mb-0.5">
                  <span className="text-4xl font-bold text-cyan-400">₱8,999</span>
                  <span className="text-lg text-gray-400">/year</span>
                </div>
                <p className="text-xs text-green-400 font-semibold">
                  Save ₱997 annually • ₱750/mo
                </p>
              </div>

              <div className="space-y-2">
                {[
                  'All Business Features',
                  'Priority Support',
                  'Advanced Analytics',
                  'Unlimited Audit Logs',
                ].map((feature) => (
                  <div key={feature} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                    <span className="text-gray-300 text-sm">{feature}</span>
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
                  {selectedPlan} - {selectedPlan === 'Quarterly' ? '₱2,499' : '₱8,999'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400 mb-0.5">
                  {isCurrentPlan(selectedPlan) ? 'Current Renewal' : 'Next Renewal'}
                </p>
                <p className="text-base font-semibold text-cyan-400">
                  {new Date(
                    Date.now() + (selectedPlan === 'Quarterly' ? 90 : 365) * 24 * 60 * 60 * 1000
                  ).toLocaleDateString()}
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
            disabled={isCurrentPlan(selectedPlan)}
            className={`px-6 py-2.5 rounded-lg font-bold transition-all duration-200 flex items-center gap-2 shadow-lg text-sm ${
              isCurrentPlan(selectedPlan)
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-slate-900 hover:shadow-cyan-500/50 hover:-translate-y-0.5'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            {isCurrentPlan(selectedPlan) ? 'Current Plan' : 'Confirm Plan Change'}
          </button>
        </div>
      </div>
    </div>
  );

  // Use portal to render modal at root level
  return ReactDOM.createPortal(modalContent, document.body);
};

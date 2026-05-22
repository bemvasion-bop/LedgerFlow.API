import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, CreditCard, Lock, Loader } from 'lucide-react';

interface DemoPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: () => void;
  planType: 'STARTER' | 'BUSINESS';
  billingCycle: 'Quarterly' | 'Yearly';
}

export const DemoPaymentModal: React.FC<DemoPaymentModalProps> = ({
  isOpen,
  onClose,
  onPaymentSuccess,
  planType,
  billingCycle,
}) => {
  const [processing, setProcessing] = useState(false);
  const [cardholderName, setCardholderName] = useState('NovaCore Technologies');
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [expiry, setExpiry] = useState('12/30');
  const [cvv, setCvv] = useState('123');

  // Lock body scroll when modal opens
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Pricing (source of truth from landing page)
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

  const amount = pricing[planType][billingCycle];
  const planDisplayName = planType === 'STARTER' ? 'Starter' : 'Business';

  const handlePayment = async () => {
    setProcessing(true);
    // Simulate payment processing (2 seconds)
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setProcessing(false);
    onPaymentSuccess();
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md max-h-[90vh] rounded-2xl border border-cyan-500/20 bg-[#0f172a] shadow-[0_0_50px_rgba(0,255,255,0.15)] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Sticky */}
        <div className="sticky top-0 z-10 px-5 py-4 border-b border-cyan-500/20 bg-slate-900/80 backdrop-blur-sm rounded-t-2xl">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <CreditCard className="w-5 h-5 text-cyan-400" />
                <h2 className="text-xl font-bold text-cyan-400">
                  Demo Payment Gateway
                </h2>
              </div>
              <p className="text-gray-400 text-xs">
                Simulated payment for demo purposes
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={processing}
              className="ml-3 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all duration-200 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body - Scrollable */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {/* Amount Summary */}
          <div className="p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/20 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">{planDisplayName} Plan - {billingCycle}</p>
                <p className="text-sm text-white font-semibold">Total Amount</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-cyan-400">
                  ₱{amount.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Card Details Form */}
          <div className="space-y-3">
            {/* Cardholder Name */}
            <div>
              <label className="block text-gray-300 text-xs font-medium mb-1.5">
                Cardholder Name
              </label>
              <input
                type="text"
                value={cardholderName}
                onChange={(e) => setCardholderName(e.target.value)}
                disabled={processing}
                className="w-full px-3 py-2 bg-slate-800/50 border border-cyan-500/20 rounded-lg text-white text-sm outline-none focus:border-cyan-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* Card Number */}
            <div>
              <label className="block text-gray-300 text-xs font-medium mb-1.5">
                Card Number
              </label>
              <input
                type="text"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                disabled={processing}
                maxLength={19}
                className="w-full px-3 py-2 bg-slate-800/50 border border-cyan-500/20 rounded-lg text-white text-sm outline-none focus:border-cyan-400 transition-colors tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* Expiry and CVV */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-300 text-xs font-medium mb-1.5">
                  Expiry Date
                </label>
                <input
                  type="text"
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  disabled={processing}
                  placeholder="MM/YY"
                  maxLength={5}
                  className="w-full px-3 py-2 bg-slate-800/50 border border-cyan-500/20 rounded-lg text-white text-sm outline-none focus:border-cyan-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-gray-300 text-xs font-medium mb-1.5">
                  CVV
                </label>
                <input
                  type="text"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value)}
                  disabled={processing}
                  maxLength={3}
                  className="w-full px-3 py-2 bg-slate-800/50 border border-cyan-500/20 rounded-lg text-white text-sm outline-none focus:border-cyan-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="mt-4 p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/15 flex items-center gap-2">
            <Lock className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            <p className="text-gray-400 text-xs">
              Demo mode: No real payment will be processed
            </p>
          </div>
        </div>

        {/* Footer - Sticky */}
        <div className="sticky bottom-0 z-10 px-5 py-4 border-t border-cyan-500/20 bg-slate-900/80 backdrop-blur-sm flex items-center justify-end gap-3 rounded-b-2xl">
          <button
            onClick={onClose}
            disabled={processing}
            className="px-5 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/20 text-white font-semibold transition-all duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Back
          </button>
          <button
            onClick={handlePayment}
            disabled={processing}
            className={`px-6 py-2.5 rounded-lg font-bold transition-all duration-200 flex items-center gap-2 shadow-lg text-sm min-w-[130px] justify-center ${
              processing
                ? 'bg-cyan-500/30 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-slate-900 hover:shadow-cyan-500/50 hover:-translate-y-0.5'
            }`}
          >
            {processing ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                Pay Now
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  // Use portal to render modal at root level
  return ReactDOM.createPortal(modalContent, document.body);
};

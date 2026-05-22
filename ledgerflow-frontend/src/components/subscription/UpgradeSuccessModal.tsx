import React, { useEffect } from 'react';
import { CheckCircle, Calendar, CreditCard, FileText } from 'lucide-react';

interface UpgradeSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscriptionData: {
    planName: string;
    billingCycle: string;
    renewalDate: string;
    invoiceId: string;
    transactionId: string;
    amount: number;
  };
}

export const UpgradeSuccessModal: React.FC<UpgradeSuccessModalProps> = ({
  isOpen,
  onClose,
  subscriptionData,
}) => {
  // Prevent background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(4px)',
        zIndex: 10001,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        overflowY: 'auto',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '550px',
          maxHeight: '90vh',
          background: 'linear-gradient(135deg, rgba(26,77,92,0.98), rgba(15,45,55,0.98))',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          border: '1px solid rgba(0,217,217,0.3)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          margin: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Success Icon */}
        <div
          style={{
            padding: '40px 30px 30px',
            textAlign: 'center',
            background: 'rgba(0,0,0,0.3)',
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #00d9d9, #00a8a8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              boxShadow: '0 0 30px rgba(0,217,217,0.5)',
            }}
          >
            <CheckCircle style={{ width: 48, height: 48, color: '#0a0a0a' }} />
          </div>
          <h2 style={{ color: '#00d9d9', margin: 0, fontSize: '2rem', fontWeight: 700 }}>
            Upgrade Successful! 🎉
          </h2>
          <p style={{ color: '#aaa', margin: '12px 0 0', fontSize: '1rem' }}>
            Your subscription has been activated
          </p>
        </div>

        {/* Subscription Details - Scrollable Body */}
        <div 
          style={{ 
            padding: '30px',
            overflowY: 'auto',
            flex: 1,
          }}
        >
          <div
            style={{
              padding: '25px',
              borderRadius: '12px',
              background: 'rgba(0,217,217,0.05)',
              border: '1px solid rgba(0,217,217,0.2)',
              marginBottom: '20px',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Plan Name */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#aaa', fontSize: '0.9rem' }}>Plan</span>
                <span style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 600 }}>
                  {subscriptionData.planName}
                </span>
              </div>

              {/* Billing Cycle */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#aaa', fontSize: '0.9rem' }}>Billing Cycle</span>
                <span style={{ color: '#fff', fontSize: '1rem', fontWeight: 500 }}>
                  {subscriptionData.billingCycle}
                </span>
              </div>

              {/* Amount */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#aaa', fontSize: '0.9rem' }}>Amount Paid</span>
                <span style={{ color: '#00d9d9', fontSize: '1.2rem', fontWeight: 700 }}>
                  ₱{subscriptionData.amount.toLocaleString()}
                </span>
              </div>

              {/* Renewal Date */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '15px',
                  borderTop: '1px solid rgba(0,217,217,0.2)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar style={{ width: 16, height: 16, color: '#00d9d9' }} />
                  <span style={{ color: '#aaa', fontSize: '0.9rem' }}>Next Renewal</span>
                </div>
                <span style={{ color: '#00d9d9', fontSize: '1rem', fontWeight: 600 }}>
                  {subscriptionData.renewalDate}
                </span>
              </div>
            </div>
          </div>

          {/* Transaction Details */}
          <div
            style={{
              padding: '20px',
              borderRadius: '12px',
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <p style={{ color: '#aaa', margin: '0 0 15px', fontSize: '0.85rem', fontWeight: 600 }}>
              Transaction Details
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FileText style={{ width: 16, height: 16, color: '#00d9d9', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <p style={{ color: '#888', margin: 0, fontSize: '0.75rem' }}>Invoice ID</p>
                  <p style={{ color: '#e0e0e0', margin: '2px 0 0', fontSize: '0.9rem', fontFamily: 'monospace' }}>
                    {subscriptionData.invoiceId}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CreditCard style={{ width: 16, height: 16, color: '#00d9d9', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <p style={{ color: '#888', margin: 0, fontSize: '0.75rem' }}>Transaction ID</p>
                  <p style={{ color: '#e0e0e0', margin: '2px 0 0', fontSize: '0.9rem', fontFamily: 'monospace' }}>
                    {subscriptionData.transactionId}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Features Unlocked Notice */}
          <div
            style={{
              marginTop: '20px',
              padding: '16px',
              borderRadius: '8px',
              background: 'rgba(81,207,102,0.1)',
              border: '1px solid rgba(81,207,102,0.3)',
            }}
          >
            <p style={{ color: '#51cf66', margin: 0, fontSize: '0.9rem', fontWeight: 600, textAlign: 'center' }}>
              ✨ All Business features are now unlocked!
            </p>
          </div>
        </div>

        {/* Footer - Sticky */}
        <div
          style={{
            padding: '20px 30px',
            borderTop: '1px solid rgba(0,217,217,0.2)',
            background: 'rgba(0,0,0,0.3)',
            textAlign: 'center',
            position: 'sticky',
            bottom: 0,
            zIndex: 10,
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '14px 40px',
              background: 'linear-gradient(135deg, #00d9d9, #00a8a8)',
              border: 'none',
              color: '#0a0a0a',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '1rem',
              transition: 'all 0.2s',
              width: '100%',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            Continue to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

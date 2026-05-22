import React, { useEffect } from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'success' | 'warning' | 'danger';
  isLoading?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  type = 'warning',
  isLoading = false,
}) => {
  // Close on ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onCancel();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isLoading, onCancel]);

  if (!isOpen) return null;

  // Type-based styling
  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          iconBg: 'rgba(81, 207, 102, 0.1)',
          iconColor: '#51cf66',
          icon: '✓',
          confirmBg: 'linear-gradient(135deg, #51cf66, #37b24d)',
          glowColor: 'rgba(81, 207, 102, 0.3)',
        };
      case 'danger':
        return {
          iconBg: 'rgba(255, 107, 107, 0.1)',
          iconColor: '#ff6b6b',
          icon: '⚠',
          confirmBg: 'linear-gradient(135deg, #ff6b6b, #e03131)',
          glowColor: 'rgba(255, 107, 107, 0.3)',
        };
      case 'warning':
      default:
        return {
          iconBg: 'rgba(0, 217, 217, 0.1)',
          iconColor: '#00d9d9',
          icon: '?',
          confirmBg: 'linear-gradient(135deg, #00d9d9, #00a8a8)',
          glowColor: 'rgba(0, 217, 217, 0.3)',
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px',
      }}
      className="animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) {
          onCancel();
        }
      }}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, #1a2332 0%, #0f1923 100%)',
          borderRadius: '16px',
          padding: '32px',
          maxWidth: '480px',
          width: '100%',
          boxShadow: `0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(0, 217, 217, 0.2)`,
          border: '1px solid rgba(0, 217, 217, 0.3)',
          position: 'relative',
        }}
        className="animate-scale-in"
      >
        {/* Icon */}
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: styles.iconBg,
            border: `2px solid ${styles.iconColor}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px',
            fontWeight: 'bold',
            color: styles.iconColor,
            margin: '0 auto 24px',
            boxShadow: `0 0 20px ${styles.glowColor}`,
          }}
        >
          {styles.icon}
        </div>

        {/* Title */}
        <h3
          style={{
            color: '#00d9d9',
            fontSize: '24px',
            fontWeight: 600,
            margin: '0 0 12px',
            textAlign: 'center',
          }}
        >
          {title}
        </h3>

        {/* Message */}
        <p
          style={{
            color: '#b0b0b0',
            fontSize: '16px',
            lineHeight: '1.6',
            margin: '0 0 32px',
            textAlign: 'center',
          }}
        >
          {message}
        </p>

        {/* Buttons */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
          }}
        >
          <button
            onClick={onCancel}
            disabled={isLoading}
            style={{
              padding: '12px 28px',
              fontSize: '15px',
              fontWeight: 600,
              borderRadius: '8px',
              border: '2px solid rgba(255, 255, 255, 0.1)',
              background: 'rgba(255, 255, 255, 0.05)',
              color: '#e0e0e0',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              opacity: isLoading ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            {cancelText}
          </button>

          <button
            onClick={onConfirm}
            disabled={isLoading}
            style={{
              padding: '12px 28px',
              fontSize: '15px',
              fontWeight: 600,
              borderRadius: '8px',
              border: 'none',
              background: styles.confirmBg,
              color: type === 'warning' ? '#0a0a0a' : '#ffffff',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              opacity: isLoading ? 0.7 : 1,
              boxShadow: `0 4px 12px ${styles.glowColor}`,
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = `0 6px 20px ${styles.glowColor}`;
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = `0 4px 12px ${styles.glowColor}`;
            }}
          >
            {isLoading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;

import React, { useEffect } from 'react';
import { AlertTriangle, Trash2, Ban, CheckCircle, LogOut, Key, XCircle } from 'lucide-react';

export type ConfirmationType = 'delete' | 'suspend' | 'activate' | 'warning' | 'logout' | 'reset' | 'danger';

export interface ConfirmationModalProps {
  isOpen: boolean;
  type: ConfirmationType;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  type,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  loading = false,
}) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !loading) {
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
  }, [isOpen, loading, onCancel]);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'delete':
        return <Trash2 className="w-12 h-12 text-red-400" />;
      case 'suspend':
        return <Ban className="w-12 h-12 text-yellow-400" />;
      case 'activate':
        return <CheckCircle className="w-12 h-12 text-green-400" />;
      case 'logout':
        return <LogOut className="w-12 h-12 text-cyan-400" />;
      case 'reset':
        return <Key className="w-12 h-12 text-orange-400" />;
      case 'danger':
        return <XCircle className="w-12 h-12 text-red-400" />;
      case 'warning':
      default:
        return <AlertTriangle className="w-12 h-12 text-yellow-400" />;
    }
  };

  const getConfirmButtonClass = () => {
    const baseClass = 'flex-1 px-6 py-3 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';
    switch (type) {
      case 'delete':
      case 'danger':
        return `${baseClass} bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30`;
      case 'suspend':
      case 'warning':
        return `${baseClass} bg-yellow-500 hover:bg-yellow-600 text-gray-900 shadow-lg shadow-yellow-500/30`;
      case 'activate':
        return `${baseClass} bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/30`;
      case 'reset':
        return `${baseClass} bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/30`;
      case 'logout':
      default:
        return `${baseClass} bg-cyan-500 hover:bg-cyan-600 text-white shadow-lg shadow-cyan-500/30`;
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={loading ? undefined : onCancel}
      />

      {/* Modal */}
      <div className="relative bg-gray-800/95 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-2xl max-w-md w-full animate-scale-in">
        {/* Icon */}
        <div className="flex justify-center pt-8 pb-4">
          {getIcon()}
        </div>

        {/* Content */}
        <div className="px-8 pb-6 text-center">
          <h3 className="text-2xl font-bold text-white mb-3">{title}</h3>
          <p className="text-gray-300 leading-relaxed whitespace-pre-line">{message}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-8 pb-8">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={getConfirmButtonClass()}
          >
            {loading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

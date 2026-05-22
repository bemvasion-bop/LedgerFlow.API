import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react';

type ModalType = 'success' | 'error' | 'warning' | 'info' | 'confirm';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  type?: ModalType;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  type = 'confirm',
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  showCancel = true,
}) => {
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

  // Get icon and colors based on type
  const getTypeConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: CheckCircle,
          iconColor: 'text-green-400',
          bgColor: 'bg-green-500/10',
          borderColor: 'border-green-500/30',
          buttonColor: 'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700',
        };
      case 'error':
        return {
          icon: XCircle,
          iconColor: 'text-red-400',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/30',
          buttonColor: 'from-red-500 to-red-600 hover:from-red-600 hover:to-red-700',
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          iconColor: 'text-orange-400',
          bgColor: 'bg-orange-500/10',
          borderColor: 'border-orange-500/30',
          buttonColor: 'from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700',
        };
      case 'info':
        return {
          icon: Info,
          iconColor: 'text-blue-400',
          bgColor: 'bg-blue-500/10',
          borderColor: 'border-blue-500/30',
          buttonColor: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
        };
      default: // confirm
        return {
          icon: AlertTriangle,
          iconColor: 'text-cyan-400',
          bgColor: 'bg-cyan-500/10',
          borderColor: 'border-cyan-500/30',
          buttonColor: 'from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700',
        };
    }
  };

  const config = getTypeConfig();
  const Icon = config.icon;

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-md rounded-2xl border ${config.borderColor} bg-[#0f172a] shadow-[0_0_50px_rgba(0,255,255,0.15)] flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`px-5 py-4 border-b ${config.borderColor} ${config.bgColor}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${config.bgColor}`}>
              <Icon className={`w-6 h-6 ${config.iconColor}`} />
            </div>
            <div className="flex-1">
              <h3 className={`text-lg font-bold ${config.iconColor}`}>{title}</h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all duration-200"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          <p className="text-sm text-gray-300 leading-relaxed">{message}</p>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-cyan-500/20 bg-slate-900/50 flex items-center justify-end gap-3 rounded-b-2xl">
          {showCancel && (
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/20 text-white font-semibold transition-all duration-200 text-sm"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={handleConfirm}
            className={`px-6 py-2.5 rounded-lg font-bold transition-all duration-200 shadow-lg text-sm bg-gradient-to-r ${config.buttonColor} text-white`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );

  // Use portal to render modal at root level
  return ReactDOM.createPortal(modalContent, document.body);
};

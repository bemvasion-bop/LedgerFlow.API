import React, { useState, useEffect } from 'react';
import { Download, FileText, FileSpreadsheet, X } from 'lucide-react';

export type ExportFormat = 'pdf' | 'excel' | 'csv';

interface ExportModalProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  onExport: (format: ExportFormat) => void;
  availableFormats: ExportFormat[];
  isLoading?: boolean;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  title,
  onClose,
  onExport,
  availableFormats,
  isLoading = false,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>(availableFormats[0]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose();
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
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const formatOptions = [
    {
      value: 'pdf' as ExportFormat,
      label: 'PDF Document',
      icon: FileText,
      description: 'Professional report with charts and tables',
      color: '#ef4444'
    },
    {
      value: 'excel' as ExportFormat,
      label: 'Excel Spreadsheet',
      icon: FileSpreadsheet,
      description: 'Detailed data in multiple sheets',
      color: '#10b981'
    },
    {
      value: 'csv' as ExportFormat,
      label: 'CSV File',
      icon: FileSpreadsheet,
      description: 'Simple comma-separated values',
      color: '#06b6d4'
    }
  ].filter(option => availableFormats.includes(option.value));

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
          onClose();
        }
      }}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, #1a2332 0%, #0f1923 100%)',
          borderRadius: '16px',
          padding: '32px',
          maxWidth: '520px',
          width: '100%',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(0, 217, 217, 0.2)',
          border: '1px solid rgba(0, 217, 217, 0.3)',
          position: 'relative',
        }}
        className="animate-scale-in"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isLoading}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            padding: '8px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            opacity: isLoading ? 0.5 : 1,
          }}
          onMouseEnter={(e) => {
            if (!isLoading) {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
          }}
        >
          <X style={{ width: '20px', height: '20px', color: '#e0e0e0' }} />
        </button>

        {/* Icon */}
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(0, 217, 217, 0.1)',
            border: '2px solid #00d9d9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            boxShadow: '0 0 20px rgba(0, 217, 217, 0.3)',
          }}
        >
          <Download style={{ width: '32px', height: '32px', color: '#00d9d9' }} />
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

        {/* Description */}
        <p
          style={{
            color: '#b0b0b0',
            fontSize: '14px',
            lineHeight: '1.6',
            margin: '0 0 24px',
            textAlign: 'center',
          }}
        >
          Choose your preferred export format
        </p>

        {/* Format Options */}
        <div style={{ marginBottom: '32px' }}>
          {formatOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = selectedFormat === option.value;
            
            return (
              <div
                key={option.value}
                onClick={() => !isLoading && setSelectedFormat(option.value)}
                style={{
                  padding: '16px',
                  marginBottom: '12px',
                  borderRadius: '12px',
                  border: isSelected 
                    ? '2px solid #00d9d9' 
                    : '2px solid rgba(255, 255, 255, 0.1)',
                  background: isSelected 
                    ? 'rgba(0, 217, 217, 0.1)' 
                    : 'rgba(255, 255, 255, 0.03)',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  opacity: isLoading ? 0.6 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!isLoading && !isSelected) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.borderColor = 'rgba(0, 217, 217, 0.5)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  }
                }}
              >
                {/* Icon */}
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '10px',
                    background: `${option.color}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon style={{ width: '24px', height: '24px', color: option.color }} />
                </div>

                {/* Text */}
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      color: '#ffffff',
                      fontSize: '16px',
                      fontWeight: 600,
                      marginBottom: '4px',
                    }}
                  >
                    {option.label}
                  </div>
                  <div
                    style={{
                      color: '#b0b0b0',
                      fontSize: '13px',
                    }}
                  >
                    {option.description}
                  </div>
                </div>

                {/* Radio Indicator */}
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    border: isSelected ? '6px solid #00d9d9' : '2px solid rgba(255, 255, 255, 0.3)',
                    transition: 'all 0.2s ease',
                    flexShrink: 0,
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Buttons */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
          }}
        >
          <button
            onClick={onClose}
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
            Cancel
          </button>

          <button
            onClick={() => onExport(selectedFormat)}
            disabled={isLoading}
            style={{
              padding: '12px 28px',
              fontSize: '15px',
              fontWeight: 600,
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, #00d9d9, #00a8a8)',
              color: '#0a0a0a',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              opacity: isLoading ? 0.7 : 1,
              boxShadow: '0 4px 12px rgba(0, 217, 217, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 217, 217, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 217, 217, 0.3)';
            }}
          >
            {isLoading ? (
              <>
                <div
                  style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid #0a0a0a',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 0.6s linear infinite',
                  }}
                />
                Generating...
              </>
            ) : (
              <>
                <Download style={{ width: '16px', height: '16px' }} />
                Export
              </>
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

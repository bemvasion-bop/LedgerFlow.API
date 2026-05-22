import React, { useState } from 'react';
import { X, ZoomIn, ZoomOut, ExternalLink, Check, XCircle, FileText } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { getReceiptUrl } from '../../config/api.config';

interface Receipt {
  id: number;
  fileName: string;
  fileUrl: string;
}

interface Expense {
  id: number;
  userId: number;
  userName: string;
  departmentName?: string;
  description: string;
  amount: number;
  category: string;
  status: string;
  submittedAt: string;
  approvedAt?: string;
  approvedBy?: string;
  reimbursedAt?: string;
  reimbursedBy?: string;
  rejectionReason?: string;
  receipts?: Receipt[];
}

interface ExpenseReviewModalProps {
  expense: Expense | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove?: () => Promise<void>;
  onReject?: (reason: string) => Promise<void>;
  loading?: boolean;
  readonly?: boolean; // Read-only mode for Auditors
}

export const ExpenseReviewModal: React.FC<ExpenseReviewModalProps> = ({
  expense,
  isOpen,
  onClose,
  onApprove,
  onReject,
  loading = false,
  readonly = false,
}) => {
  const [rejectReason, setRejectReason] = useState('');
  const [imageZoom, setImageZoom] = useState(100);
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [imageError, setImageError] = useState(false);

  if (!isOpen || !expense) return null;

  const handleImageError = () => {
    setImageError(true);
  };

  const handleImageLoad = () => {
    setImageError(false);
  };

  const handleApprove = async () => {
    if (readonly || !onApprove) return;
    await onApprove();
    onClose();
  };

  const handleReject = async () => {
    if (readonly || !onReject) return;
    if (!rejectReason.trim()) {
      alert('Please enter a rejection reason');
      return;
    }
    await onReject(rejectReason);
    setRejectReason('');
    setShowRejectInput(false);
    onClose();
  };

  const handleClose = () => {
    setRejectReason('');
    setShowRejectInput(false);
    setImageZoom(100);
    setImageError(false);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(4px)',
        zIndex: 9998,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={handleClose}
    >
      {/* Modal Container */}
      <div
        style={{
          width: '85vw',
          height: '85vh',
          maxWidth: '1400px',
          background: 'rgba(26,77,92,0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '12px',
          border: '1px solid rgba(0,217,217,0.3)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '20px 30px',
            borderBottom: '1px solid rgba(0,217,217,0.2)',
            background: 'rgba(0,0,0,0.3)',
          }}
        >
          <div>
            <h2 style={{ color: '#00d9d9', margin: 0, fontSize: '1.4rem' }}>
              {readonly ? 'View Expense #' : 'Review Expense #'}{expense.id}
            </h2>
            <p style={{ color: '#aaa', margin: '5px 0 0', fontSize: '0.9rem' }}>
              Submitted by {expense.userName}
              {expense.departmentName && ` • ${expense.departmentName}`}
              {readonly && <span style={{ color: '#ffd700', marginLeft: '8px' }}>• Read-Only</span>}
            </p>
          </div>
          <button
            onClick={handleClose}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: '#fff',
              width: 36,
              height: 36,
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
          >
            <X style={{ width: 20, height: 20 }} />
          </button>
        </div>

        {/* Content - Two Column Layout */}
        <div
          style={{
            flex: 1,
            display: 'grid',
            gridTemplateColumns: '40% 60%',
            overflow: 'hidden',
          }}
        >
          {/* Left Panel - Expense Details */}
          <div
            style={{
              padding: '30px',
              overflowY: 'auto',
              borderRight: '1px solid rgba(0,217,217,0.2)',
              background: 'rgba(0,0,0,0.2)',
            }}
          >
            <div style={{ marginBottom: 20 }}>
              <label
                style={{
                  color: '#aaa',
                  fontSize: '0.8rem',
                  display: 'block',
                  marginBottom: 6,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Employee Name
              </label>
              <p style={{ color: '#fff', fontSize: '1.1rem', margin: 0, fontWeight: 500 }}>
                {expense.userName}
              </p>
            </div>

            {expense.departmentName && (
              <div style={{ marginBottom: 20 }}>
                <label
                  style={{
                    color: '#aaa',
                    fontSize: '0.8rem',
                    display: 'block',
                    marginBottom: 6,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Department
                </label>
                <p style={{ color: '#fff', fontSize: '1rem', margin: 0 }}>
                  {expense.departmentName}
                </p>
              </div>
            )}

            <div style={{ marginBottom: 20 }}>
              <label
                style={{
                  color: '#aaa',
                  fontSize: '0.8rem',
                  display: 'block',
                  marginBottom: 6,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Category
              </label>
              <p style={{ color: '#fff', fontSize: '1rem', margin: 0 }}>
                {expense.category}
              </p>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label
                style={{
                  color: '#aaa',
                  fontSize: '0.8rem',
                  display: 'block',
                  marginBottom: 6,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Amount
              </label>
              <p style={{ color: '#00d9d9', fontSize: '2rem', margin: 0, fontWeight: 700 }}>
                {formatCurrency(expense.amount)}
              </p>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label
                style={{
                  color: '#aaa',
                  fontSize: '0.8rem',
                  display: 'block',
                  marginBottom: 6,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Description
              </label>
              <p style={{ color: '#fff', fontSize: '0.95rem', margin: 0, lineHeight: 1.6 }}>
                {expense.description}
              </p>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label
                style={{
                  color: '#aaa',
                  fontSize: '0.8rem',
                  display: 'block',
                  marginBottom: 6,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Submitted Date
              </label>
              <p style={{ color: '#fff', fontSize: '0.95rem', margin: 0 }}>
                {formatDate(expense.submittedAt)}
              </p>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label
                style={{
                  color: '#aaa',
                  fontSize: '0.8rem',
                  display: 'block',
                  marginBottom: 6,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Status
              </label>
              <span
                style={{
                  display: 'inline-block',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  background:
                    expense.status === 'Pending'
                      ? 'rgba(255, 193, 7, 0.2)'
                      : expense.status === 'Approved'
                      ? 'rgba(0, 217, 217, 0.2)'
                      : expense.status === 'Reimbursed'
                      ? 'rgba(81, 207, 102, 0.2)'
                      : 'rgba(255, 107, 107, 0.2)',
                  color:
                    expense.status === 'Pending'
                      ? '#ffc107'
                      : expense.status === 'Approved'
                      ? '#00d9d9'
                      : expense.status === 'Reimbursed'
                      ? '#51cf66'
                      : '#ff6b6b',
                  border: `1px solid ${
                    expense.status === 'Pending'
                      ? '#ffc107'
                      : expense.status === 'Approved'
                      ? '#00d9d9'
                      : expense.status === 'Reimbursed'
                      ? '#51cf66'
                      : '#ff6b6b'
                  }`,
                }}
              >
                {expense.status}
              </span>
            </div>

            {/* Audit Trail Section */}
            <div style={{ 
              marginTop: 30, 
              paddingTop: 20, 
              borderTop: '1px solid rgba(0,217,217,0.2)' 
            }}>
              <label
                style={{
                  color: '#00d9d9',
                  fontSize: '0.9rem',
                  display: 'block',
                  marginBottom: 12,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                📋 Expense Timeline
              </label>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* Submitted */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ 
                    width: 8, 
                    height: 8, 
                    borderRadius: '50%', 
                    background: '#00d9d9',
                    marginTop: 6,
                    flexShrink: 0
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 500 }}>
                      Submitted by {expense.userName}
                    </div>
                    <div style={{ color: '#aaa', fontSize: '0.75rem', marginTop: 2 }}>
                      {formatDate(expense.submittedAt)}
                    </div>
                  </div>
                </div>

                {/* Approved */}
                {expense.approvedAt && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ 
                      width: 8, 
                      height: 8, 
                      borderRadius: '50%', 
                      background: '#51cf66',
                      marginTop: 6,
                      flexShrink: 0
                    }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 500 }}>
                        Approved {expense.approvedBy ? `by ${expense.approvedBy}` : ''}
                      </div>
                      <div style={{ color: '#aaa', fontSize: '0.75rem', marginTop: 2 }}>
                        {formatDate(expense.approvedAt)}
                      </div>
                    </div>
                  </div>
                )}

                {/* Reimbursed */}
                {expense.reimbursedAt && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ 
                      width: 8, 
                      height: 8, 
                      borderRadius: '50%', 
                      background: '#00d9d9',
                      marginTop: 6,
                      flexShrink: 0
                    }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 500 }}>
                        Reimbursed {expense.reimbursedBy ? `by ${expense.reimbursedBy}` : ''}
                      </div>
                      <div style={{ color: '#aaa', fontSize: '0.75rem', marginTop: 2 }}>
                        {formatDate(expense.reimbursedAt)}
                      </div>
                    </div>
                  </div>
                )}

                {/* Rejected */}
                {expense.status === 'Rejected' && expense.rejectionReason && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ 
                      width: 8, 
                      height: 8, 
                      borderRadius: '50%', 
                      background: '#ff6b6b',
                      marginTop: 6,
                      flexShrink: 0
                    }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ color: '#ff6b6b', fontSize: '0.85rem', fontWeight: 500 }}>
                        Rejected
                      </div>
                      <div style={{ color: '#aaa', fontSize: '0.75rem', marginTop: 2 }}>
                        Reason: {expense.rejectionReason}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - Receipt Preview */}
          <div
            style={{
              padding: '30px',
              overflowY: 'auto',
              background: 'rgba(0,0,0,0.1)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 20,
              }}
            >
              <h3 style={{ color: '#00d9d9', margin: 0, fontSize: '1.1rem' }}>
                Receipt Preview
              </h3>
              {(expense.receipts?.length ?? 0) > 0 && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => setImageZoom(Math.max(50, imageZoom - 10))}
                    style={{
                      background: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(0,217,217,0.3)',
                      color: '#00d9d9',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <ZoomOut style={{ width: 16, height: 16 }} />
                  </button>
                  <button
                    onClick={() => setImageZoom(Math.min(200, imageZoom + 10))}
                    style={{
                      background: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(0,217,217,0.3)',
                      color: '#00d9d9',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <ZoomIn style={{ width: 16, height: 16 }} />
                  </button>
                  <span
                    style={{
                      color: '#aaa',
                      fontSize: '0.9rem',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0 8px',
                    }}
                  >
                    {imageZoom}%
                  </span>
                </div>
              )}
            </div>

            {(expense.receipts?.length ?? 0) > 0 ? (
              <div style={{ flex: 1, overflow: 'auto' }}>
                {expense.receipts!.map(receipt => {
                  const receiptUrl = getReceiptUrl(receipt.fileUrl);
                  return (
                    <div key={receipt.id} style={{ marginBottom: 20 }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: 10,
                        }}
                      >
                        <span style={{ color: '#aaa', fontSize: '0.85rem' }}>
                          {receipt.fileName}
                        </span>
                        <a
                          href={receiptUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: '#00d9d9',
                            fontSize: '0.85rem',
                            textDecoration: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          Open Full Size <ExternalLink style={{ width: 14, height: 14 }} />
                        </a>
                      </div>
                      <div
                        style={{
                          border: '1px solid rgba(0,217,217,0.2)',
                          borderRadius: '8px',
                          overflow: 'auto',
                          background: 'rgba(0,0,0,0.3)',
                          padding: '10px',
                          minHeight: '200px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {!imageError ? (
                          <img
                            src={receiptUrl}
                            alt={receipt.fileName}
                            style={{
                              width: `${imageZoom}%`,
                              height: 'auto',
                              display: 'block',
                              margin: '0 auto',
                              borderRadius: '4px',
                              objectFit: 'contain',
                              maxHeight: '600px',
                            }}
                            onError={handleImageError}
                            onLoad={handleImageLoad}
                          />
                        ) : (
                          <div style={{ textAlign: 'center', padding: '40px' }}>
                            <FileText style={{ width: 48, height: 48, color: '#ff6b6b', margin: '0 auto 12px', opacity: 0.6 }} />
                            <p style={{ color: '#ff6b6b', fontSize: '1rem', marginBottom: '8px', fontWeight: 500 }}>
                              Unable to load receipt preview
                            </p>
                            <p style={{ color: '#aaa', fontSize: '0.85rem', marginBottom: '12px' }}>
                              The image file may be missing or the path is incorrect
                            </p>
                            <p style={{ color: '#666', fontSize: '0.75rem', fontFamily: 'monospace', wordBreak: 'break-all', marginBottom: '12px' }}>
                              {receiptUrl}
                            </p>
                            <a
                              href={receiptUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                color: '#00d9d9',
                                fontSize: '0.85rem',
                                textDecoration: 'underline',
                              }}
                            >
                              Try opening in new tab
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#aaa',
                }}
              >
                <FileText style={{ width: 48, height: 48, marginBottom: 12, opacity: 0.5 }} />
                <p style={{ margin: 0, fontSize: '0.95rem' }}>No receipt attached</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer - Action Buttons */}
        <div
          style={{
            padding: '20px 30px',
            borderTop: '1px solid rgba(0,217,217,0.2)',
            background: 'rgba(0,0,0,0.3)',
            display: 'flex',
            gap: 12,
            justifyContent: readonly ? 'center' : 'flex-end',
          }}
        >
          {readonly ? (
            // Read-only mode - only show close button
            <div style={{ textAlign: 'center', width: '100%' }}>
              <p style={{ color: '#aaa', fontSize: '0.9rem', margin: '0 0 12px 0' }}>
                🔒 Auditor View - Read-Only Access
              </p>
              <button
                onClick={handleClose}
                style={{
                  padding: '12px 32px',
                  background: 'rgba(0,217,217,0.2)',
                  border: '1px solid #00d9d9',
                  color: '#00d9d9',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(0,217,217,0.3)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(0,217,217,0.2)';
                }}
              >
                Close
              </button>
            </div>
          ) : expense.status === 'Pending' && !showRejectInput ? (
            // Pending status - show approve/reject buttons
            <>
              <button
                onClick={() => setShowRejectInput(true)}
                disabled={loading}
                style={{
                  padding: '12px 24px',
                  background: 'rgba(255, 107, 107, 0.2)',
                  border: '1px solid #ff6b6b',
                  color: '#ff6b6b',
                  borderRadius: '8px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'all 0.2s',
                  opacity: loading ? 0.5 : 1,
                }}
                onMouseEnter={e => {
                  if (!loading) e.currentTarget.style.background = 'rgba(255, 107, 107, 0.3)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(255, 107, 107, 0.2)';
                }}
              >
                <XCircle style={{ width: 18, height: 18 }} />
                Reject
              </button>
              <button
                onClick={handleApprove}
                disabled={loading}
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #00d9d9, #00a8a8)',
                  border: 'none',
                  color: '#0a0a0a',
                  borderRadius: '8px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'all 0.2s',
                  opacity: loading ? 0.5 : 1,
                }}
                onMouseEnter={e => {
                  if (!loading) e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <Check style={{ width: 18, height: 18 }} />
                {loading ? 'Processing...' : 'Approve'}
              </button>
            </>
          ) : expense.status === 'Pending' && showRejectInput ? (
            // Pending status - rejection input mode
            <div style={{ flex: 1, display: 'flex', gap: 12, alignItems: 'center' }}>
              <input
                type="text"
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="Enter rejection reason..."
                autoFocus
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255, 107, 107, 0.5)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.95rem',
                }}
                onKeyPress={e => {
                  if (e.key === 'Enter') handleReject();
                }}
              />
              <button
                onClick={() => {
                  setShowRejectInput(false);
                  setRejectReason('');
                }}
                style={{
                  padding: '12px 20px',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#fff',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={loading || !rejectReason.trim()}
                style={{
                  padding: '12px 24px',
                  background: 'rgba(255, 107, 107, 0.8)',
                  border: 'none',
                  color: '#fff',
                  borderRadius: '8px',
                  cursor: loading || !rejectReason.trim() ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                  opacity: loading || !rejectReason.trim() ? 0.5 : 1,
                }}
              >
                {loading ? 'Rejecting...' : 'Confirm Reject'}
              </button>
            </div>
          ) : (
            // Non-pending status - view only with close button
            <div style={{ textAlign: 'center', width: '100%' }}>
              <p style={{ color: '#aaa', fontSize: '0.9rem', margin: '0 0 12px 0' }}>
                {expense.status === 'Approved' && 'Expense has been approved'}
                {expense.status === 'Rejected' && 'Expense has been rejected'}
                {expense.status === 'Reimbursed' && 'Expense has been reimbursed'}
              </p>
              <button
                onClick={handleClose}
                style={{
                  padding: '12px 32px',
                  background: 'rgba(0,217,217,0.2)',
                  border: '1px solid #00d9d9',
                  color: '#00d9d9',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(0,217,217,0.3)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(0,217,217,0.2)';
                }}
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

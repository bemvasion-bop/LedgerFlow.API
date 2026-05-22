import React, { useState, useEffect } from 'react';
import { X, Calendar, DollarSign, Tag, FileText, Clock, CheckCircle, XCircle, CreditCard } from 'lucide-react';
import api from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/helpers';

interface Receipt {
  id: number;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  uploadedAt: string;
}

interface Expense {
  id: number;
  userId: number;
  userName: string;
  description: string;
  amount: number;
  category: string;
  status: string;
  submittedAt: string;
  approvedAt?: string;
  reimbursedAt?: string;
  rejectionReason?: string;
  receipts?: Receipt[];
}

interface Props {
  expenseId: number;
  onClose: () => void;
}

const API_BASE = 'http://localhost:5256';

const ExpenseViewModal: React.FC<Props> = ({ expenseId, onClose }) => {
  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState('');

  useEffect(() => {
    const fetchExpense = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/expenses/${expenseId}`);
        setExpense(res.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load expense details.');
      } finally {
        setLoading(false);
      }
    };

    fetchExpense();
  }, [expenseId]);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; color: string; border: string; icon: React.ReactNode }> = {
      Pending: {
        bg: 'rgba(255, 215, 0, 0.15)',
        color: '#ffd700',
        border: '1px solid rgba(255, 215, 0, 0.3)',
        icon: <Clock className="w-4 h-4" />
      },
      Approved: {
        bg: 'rgba(81, 207, 102, 0.15)',
        color: '#51cf66',
        border: '1px solid rgba(81, 207, 102, 0.3)',
        icon: <CheckCircle className="w-4 h-4" />
      },
      Rejected: {
        bg: 'rgba(255, 107, 107, 0.15)',
        color: '#ff6b6b',
        border: '1px solid rgba(255, 107, 107, 0.3)',
        icon: <XCircle className="w-4 h-4" />
      },
      Reimbursed: {
        bg: 'rgba(0, 217, 217, 0.15)',
        color: '#00d9d9',
        border: '1px solid rgba(0, 217, 217, 0.3)',
        icon: <CreditCard className="w-4 h-4" />
      },
    };

    const style = styles[status] || styles.Pending;

    return (
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 14px',
        borderRadius: '8px',
        fontSize: '0.875rem',
        fontWeight: 600,
        background: style.bg,
        color: style.color,
        border: style.border,
      }}>
        {style.icon}
        {status}
      </div>
    );
  };

  const openReceipt = (receipt: Receipt) => {
    const url = receipt.fileUrl.startsWith('http')
      ? receipt.fileUrl
      : `${API_BASE}${receipt.fileUrl}`;
    setPreviewUrl(url);
    setPreviewName(receipt.fileName);
  };

  if (loading) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}
        onClick={onClose}
      >
        <div className="card" style={{ width: 700, maxWidth: '90%', padding: 30 }}>
          <div className="loading">Loading expense details...</div>
        </div>
      </div>
    );
  }

  if (error || !expense) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}
        onClick={onClose}
      >
        <div className="card" style={{ width: 700, maxWidth: '90%', padding: 30 }}>
          <div className="error">{error || 'Expense not found'}</div>
          <div style={{ textAlign: 'right', marginTop: 20 }}>
            <button className="btn" style={{ background: '#555', color: '#fff' }} onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          overflow: 'auto',
          padding: '20px',
        }}
        onClick={onClose}
      >
        <div
          className="card"
          style={{
            width: 800,
            maxWidth: '95%',
            padding: 0,
            maxHeight: '90vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{
            padding: '24px 30px',
            borderBottom: '1px solid rgba(0,217,217,0.15)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div>
              <h3 style={{ color: '#00d9d9', margin: 0, fontSize: '1.5rem' }}>
                Expense Details
              </h3>
              <p style={{ color: '#aaa', margin: '4px 0 0', fontSize: '0.875rem' }}>
                Expense ID: #{expense.id}
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                color: '#aaa',
                cursor: 'pointer',
                fontSize: '1.5rem',
                width: '36px',
                height: '36px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                e.currentTarget.style.color = '#fff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                e.currentTarget.style.color = '#aaa';
              }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div style={{ padding: '30px', overflow: 'auto', flex: 1 }}>
            {/* Status Badge */}
            <div style={{ marginBottom: '24px' }}>
              {getStatusBadge(expense.status)}
            </div>

            {/* Main Details Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '20px',
              marginBottom: '24px',
            }}>
              {/* Amount */}
              <div style={{
                padding: '16px',
                background: 'rgba(0,217,217,0.05)',
                border: '1px solid rgba(0,217,217,0.15)',
                borderRadius: '8px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <DollarSign className="w-4 h-4" style={{ color: '#00d9d9' }} />
                  <span style={{ color: '#aaa', fontSize: '0.85rem' }}>Amount</span>
                </div>
                <div style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 700 }}>
                  {formatCurrency(expense.amount)}
                </div>
              </div>

              {/* Category */}
              <div style={{
                padding: '16px',
                background: 'rgba(0,217,217,0.05)',
                border: '1px solid rgba(0,217,217,0.15)',
                borderRadius: '8px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Tag className="w-4 h-4" style={{ color: '#00d9d9' }} />
                  <span style={{ color: '#aaa', fontSize: '0.85rem' }}>Category</span>
                </div>
                <div style={{ color: '#fff', fontSize: '1.125rem', fontWeight: 600 }}>
                  {expense.category}
                </div>
              </div>
            </div>

            {/* Description */}
            <div style={{
              padding: '16px',
              background: 'rgba(0,217,217,0.05)',
              border: '1px solid rgba(0,217,217,0.15)',
              borderRadius: '8px',
              marginBottom: '24px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <FileText className="w-4 h-4" style={{ color: '#00d9d9' }} />
                <span style={{ color: '#aaa', fontSize: '0.85rem' }}>Description</span>
              </div>
              <div style={{ color: '#fff', fontSize: '0.95rem', lineHeight: '1.6' }}>
                {expense.description}
              </div>
            </div>

            {/* Timeline */}
            <div style={{
              padding: '20px',
              background: 'rgba(26,77,92,0.3)',
              border: '1px solid rgba(0,217,217,0.15)',
              borderRadius: '8px',
              marginBottom: '24px',
            }}>
              <h4 style={{ color: '#00d9d9', margin: '0 0 16px', fontSize: '1rem' }}>
                <Calendar className="w-4 h-4" style={{ display: 'inline', marginRight: '8px' }} />
                Timeline
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Submitted */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#00d9d9',
                  }} />
                  <div style={{ flex: 1 }}>
                    <span style={{ color: '#fff', fontWeight: 500 }}>Submitted</span>
                    <span style={{ color: '#aaa', fontSize: '0.85rem', marginLeft: '12px' }}>
                      {formatDate(expense.submittedAt)}
                    </span>
                  </div>
                </div>

                {/* Approved */}
                {expense.approvedAt && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#51cf66',
                    }} />
                    <div style={{ flex: 1 }}>
                      <span style={{ color: '#fff', fontWeight: 500 }}>Approved</span>
                      <span style={{ color: '#aaa', fontSize: '0.85rem', marginLeft: '12px' }}>
                        {formatDate(expense.approvedAt)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Reimbursed */}
                {expense.reimbursedAt && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#00d9d9',
                    }} />
                    <div style={{ flex: 1 }}>
                      <span style={{ color: '#fff', fontWeight: 500 }}>Reimbursed</span>
                      <span style={{ color: '#aaa', fontSize: '0.85rem', marginLeft: '12px' }}>
                        {formatDate(expense.reimbursedAt)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Rejection Reason */}
            {expense.status === 'Rejected' && expense.rejectionReason && (
              <div style={{
                padding: '16px',
                background: 'rgba(255, 107, 107, 0.1)',
                border: '1px solid rgba(255, 107, 107, 0.3)',
                borderRadius: '8px',
                marginBottom: '24px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <XCircle className="w-4 h-4" style={{ color: '#ff6b6b' }} />
                  <span style={{ color: '#ff6b6b', fontSize: '0.875rem', fontWeight: 600 }}>
                    Rejection Reason
                  </span>
                </div>
                <div style={{ color: '#fff', fontSize: '0.95rem', lineHeight: '1.6' }}>
                  {expense.rejectionReason}
                </div>
              </div>
            )}

            {/* Receipts */}
            {expense.receipts && expense.receipts.length > 0 && (
              <div style={{
                padding: '20px',
                background: 'rgba(26,77,92,0.3)',
                border: '1px solid rgba(0,217,217,0.15)',
                borderRadius: '8px',
              }}>
                <h4 style={{ color: '#00d9d9', margin: '0 0 16px', fontSize: '1rem' }}>
                  Receipts ({expense.receipts.length})
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {expense.receipts.map(receipt => (
                    <div
                      key={receipt.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px',
                        background: 'rgba(0,217,217,0.05)',
                        border: '1px solid rgba(0,217,217,0.15)',
                        borderRadius: '6px',
                      }}
                    >
                      <div>
                        <div style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 500 }}>
                          {receipt.fileName}
                        </div>
                        <div style={{ color: '#aaa', fontSize: '0.8rem', marginTop: '2px' }}>
                          {(receipt.fileSize / 1024).toFixed(1)} KB · {formatDate(receipt.uploadedAt)}
                        </div>
                      </div>
                      <button
                        className="btn"
                        style={{
                          padding: '6px 16px',
                          fontSize: '0.8rem',
                          background: 'rgba(0,217,217,0.1)',
                          color: '#00d9d9',
                          border: '1px solid rgba(0,217,217,0.3)',
                        }}
                        onClick={() => openReceipt(receipt)}
                      >
                        View
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No Receipts Message */}
            {(!expense.receipts || expense.receipts.length === 0) && (
              <div style={{
                padding: '20px',
                background: 'rgba(26,77,92,0.3)',
                border: '1px solid rgba(0,217,217,0.15)',
                borderRadius: '8px',
                textAlign: 'center',
              }}>
                <p style={{ color: '#aaa', margin: 0, fontSize: '0.9rem' }}>
                  No receipts attached to this expense
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{
            padding: '20px 30px',
            borderTop: '1px solid rgba(0,217,217,0.15)',
            display: 'flex',
            justifyContent: 'flex-end',
          }}>
            <button
              className="btn"
              style={{ background: '#555', color: '#fff', padding: '10px 24px' }}
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Receipt Preview Modal */}
      {previewUrl && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1001,
          }}
          onClick={() => setPreviewUrl(null)}
        >
          <div
            className="card"
            style={{ maxWidth: '680px', width: '90%', padding: '20px' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h4 style={{ color: '#00d9d9', margin: 0 }}>{previewName}</h4>
              <button
                onClick={() => setPreviewUrl(null)}
                style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: '1.4rem', lineHeight: 1 }}
              >
                ×
              </button>
            </div>

            {previewUrl.match(/\.(jpg|jpeg|png)$/i) || !previewUrl.endsWith('.pdf') ? (
              <img
                src={previewUrl}
                alt={previewName}
                style={{ width: '100%', borderRadius: '6px', border: '1px solid rgba(0,217,217,0.2)' }}
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '30px' }}>
                <p style={{ color: '#aaa', marginBottom: '16px' }}>PDF receipt</p>
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                >
                  Open PDF
                </a>
              </div>
            )}

            <div style={{ textAlign: 'center', marginTop: '14px' }}>
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#00d9d9', fontSize: '0.85rem' }}
              >
                Open in new tab ↗
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ExpenseViewModal;

import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import api from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { ExpenseReviewModal } from '../common/ExpenseReviewModal';

interface Receipt { id: number; fileName: string; fileUrl: string; }
interface Expense {
  id: number; userId: number; userName: string;
  departmentName?: string;
  description: string; amount: number; category: string;
  status: string; submittedAt: string; 
  approvedAt?: string;
  approvedBy?: string;
  reimbursedAt?: string;
  reimbursedBy?: string;
  rejectionReason?: string;
  receipts?: Receipt[];
}

const FinancePendingApprovals: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reviewModal, setReviewModal] = useState<Expense | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchPending = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/expenses', { params: { status: 'Pending', pageSize: 200 } });
      setExpenses(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load pending expenses.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  const openReviewModal = (expense: Expense) => {
    setReviewModal(expense);
  };

  const closeReviewModal = () => {
    setReviewModal(null);
  };

  const handleApprove = async () => {
    if (!reviewModal) return;
    setActionLoading(reviewModal.id);
    try {
      await api.put(`/expenses/${reviewModal.id}/approve`);
      setExpenses(prev => prev.filter(e => e.id !== reviewModal.id));
      showToast('Expense approved successfully.', true);
      closeReviewModal();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Approve failed.', false);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (rejectionReason: string) => {
    if (!reviewModal) return;
    setActionLoading(reviewModal.id);
    try {
      await api.put(`/expenses/${reviewModal.id}/reject`, { rejectionReason });
      setExpenses(prev => prev.filter(e => e.id !== reviewModal.id));
      showToast('Expense rejected.', true);
      closeReviewModal();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Reject failed.', false);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: 20,
            right: 20,
            zIndex: 9999,
            background: toast.ok
              ? 'linear-gradient(135deg,#1a4d2e,#0f3a20)'
              : 'linear-gradient(135deg,#4d1a1a,#3a0f0f)',
            border: `1px solid ${toast.ok ? '#51cf66' : '#ff6b6b'}`,
            color: toast.ok ? '#51cf66' : '#ff8a8a',
            padding: '14px 22px',
            borderRadius: '10px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
            fontWeight: 500,
          }}
        >
          {toast.ok ? '✓ ' : '✕ '}
          {toast.msg}
        </div>
      )}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '25px',
        }}
      >
        <div>
          <h1 style={{ color: '#00d9d9', margin: 0 }}>Pending Approvals</h1>
          <p style={{ color: '#aaa', margin: '5px 0 0', fontSize: '0.9rem' }}>
            Review and approve or reject submitted expenses
          </p>
        </div>
        <button
          className="group relative p-2.5 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700/50 hover:border-cyan-500/30 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-all duration-200"
          onClick={fetchPending}
          aria-label="Refresh"
        >
          <RefreshCw className="w-5 h-5 text-gray-300 group-hover:text-cyan-400 transition-all duration-500 group-hover:rotate-180" />
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {loading ? (
        <div className="loading">Loading pending expenses...</div>
      ) : expenses.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: '#aaa', padding: '50px' }}>
          <p style={{ fontSize: '1.1rem', marginBottom: '8px' }}>No pending expenses.</p>
          <p style={{ fontSize: '0.9rem' }}>All caught up!</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px 0' }}>
            <span style={{ color: '#ffd700', fontWeight: 600 }}>{expenses.length}</span>
            <span style={{ color: '#aaa', fontSize: '0.9rem' }}>
              {' '}
              expense{expenses.length !== 1 ? 's' : ''} awaiting review
            </span>
          </div>
          <table className="table" style={{ margin: 0 }}>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Description</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Submitted</th>
                <th>Receipt</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map(exp => (
                <tr
                  key={exp.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => openReviewModal(exp)}
                >
                  <td>{exp.userName}</td>
                  <td
                    style={{
                      maxWidth: 180,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {exp.description}
                  </td>
                  <td>{exp.category}</td>
                  <td style={{ fontWeight: 600 }}>{formatCurrency(exp.amount)}</td>
                  <td style={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                    {formatDate(exp.submittedAt)}
                  </td>
                  <td>
                    {(exp.receipts?.length ?? 0) > 0 ? (
                      <span style={{ color: '#00d9d9', fontSize: '0.8rem' }}>✓ Attached</span>
                    ) : (
                      <span style={{ color: '#555', fontSize: '0.8rem' }}>—</span>
                    )}
                  </td>
                  <td>
                    <button
                      className="btn btn-primary"
                      style={{ 
                        padding: '5px 12px', 
                        fontSize: '0.8rem',
                        transition: 'all 0.2s ease',
                      }}
                      onClick={e => {
                        e.stopPropagation();
                        openReviewModal(exp);
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 217, 217, 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Unified Expense Review Modal */}
      <ExpenseReviewModal
        expense={reviewModal}
        isOpen={!!reviewModal}
        onClose={closeReviewModal}
        onApprove={handleApprove}
        onReject={handleReject}
        loading={actionLoading !== null}
      />
    </div>
  );
};

export default FinancePendingApprovals;

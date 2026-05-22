import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import api from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/helpers';
import ConfirmationModal from '../common/ConfirmationModal';
import { ToastContainer } from '../common/Toast';
import { useToast } from '../../hooks/useToast';

interface Expense {
  id: number; userId: number; userName: string;
  description: string; amount: number; category: string;
  status: string; submittedAt: string; approvedAt?: string;
}

const FinanceApprovedExpenses: React.FC = () => {
  const [expenses, setExpenses]           = useState<Expense[]>([]);
  const [loading, setLoading]             = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [error, setError]                 = useState<string | null>(null);
  const { toasts, removeToast, success, error: showError } = useToast();
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    expenseId: number;
  }>({
    isOpen: false,
    expenseId: 0,
  });

  const fetchApproved = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await api.get('/expenses', { params: { status: 'Approved', pageSize: 200 } });
      setExpenses(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load approved expenses.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchApproved(); }, [fetchApproved]);

  const handleReimburse = async (id: number) => {
    setConfirmModal({ isOpen: true, expenseId: id });
  };

  const confirmReimburse = async () => {
    const id = confirmModal.expenseId;
    setConfirmModal({ isOpen: false, expenseId: 0 });
    setActionLoading(id);
    try {
      await api.put(`/expenses/${id}/reimburse`);
      setExpenses(prev => prev.filter(e => e.id !== id));
      success('Expense marked as reimbursed.');
    } catch (err: any) {
      showError(err.response?.data?.message || 'Reimburse failed.');
    } finally { setActionLoading(null); }
  };

  const totalAmount = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <div>
          <h1 style={{ color: '#00d9d9', margin: 0 }}>Approved Expenses</h1>
          <p style={{ color: '#aaa', margin: '5px 0 0', fontSize: '0.9rem' }}>
            Expenses approved and ready for reimbursement
          </p>
        </div>
        <button
          className="group relative p-2.5 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700/50 hover:border-cyan-500/30 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-all duration-200"
          onClick={fetchApproved}
          aria-label="Refresh"
        >
          <RefreshCw className="w-5 h-5 text-gray-300 group-hover:text-cyan-400 transition-all duration-500 group-hover:rotate-180" />
        </button>
      </div>

      {/* Summary strip */}
      {!loading && expenses.length > 0 && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <div style={{ background: 'rgba(26,77,92,0.5)', border: '1px solid rgba(0,217,217,0.15)', borderRadius: 8, padding: '8px 18px', display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ color: '#51cf66', fontWeight: 700 }}>{expenses.length}</span>
            <span style={{ color: '#aaa', fontSize: '0.85rem' }}>Approved</span>
          </div>
          <div style={{ background: 'rgba(26,77,92,0.5)', border: '1px solid rgba(0,217,217,0.15)', borderRadius: 8, padding: '8px 18px', display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ color: '#00d9d9', fontWeight: 700 }}>{formatCurrency(totalAmount)}</span>
            <span style={{ color: '#aaa', fontSize: '0.85rem' }}>Total to Reimburse</span>
          </div>
        </div>
      )}

      {error && <div className="error">{error}</div>}

      {loading ? (
        <div className="loading">Loading approved expenses...</div>
      ) : expenses.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: '#aaa', padding: '50px' }}>
          No approved expenses pending reimbursement.
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="table" style={{ margin: 0 }}>
            <thead>
              <tr>
                <th>#</th>
                <th>Employee</th>
                <th>Description</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Submitted</th>
                <th>Approved</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map(exp => (
                <tr key={exp.id}>
                  <td style={{ color: '#aaa', fontSize: '0.85rem' }}>{exp.id}</td>
                  <td>{exp.userName}</td>
                  <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {exp.description}
                  </td>
                  <td>{exp.category}</td>
                  <td style={{ fontWeight: 600, color: '#51cf66' }}>{formatCurrency(exp.amount)}</td>
                  <td style={{ fontSize: '0.85rem' }}>{formatDate(exp.submittedAt)}</td>
                  <td style={{ fontSize: '0.85rem' }}>{exp.approvedAt ? formatDate(exp.approvedAt) : '—'}</td>
                  <td>
                    <button
                      className="btn btn-primary"
                      style={{ padding: '5px 14px', fontSize: '0.8rem' }}
                      disabled={actionLoading === exp.id}
                      onClick={() => handleReimburse(exp.id)}
                    >
                      {actionLoading === exp.id ? '...' : 'Mark Reimbursed'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title="Mark as Reimbursed"
        message="Are you sure you want to mark this expense as reimbursed? This action cannot be undone."
        confirmText="Mark Reimbursed"
        cancelText="Cancel"
        onConfirm={confirmReimburse}
        onCancel={() => setConfirmModal({ isOpen: false, expenseId: 0 })}
        type="success"
        isLoading={actionLoading !== null}
      />

      {/* Toast Notification */}
      <ToastContainer
        toasts={toasts}
        onClose={removeToast}
      />
    </div>
  );
};

export default FinanceApprovedExpenses;

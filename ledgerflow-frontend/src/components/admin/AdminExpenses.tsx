import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import api from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { ExpenseReviewModal } from '../common/ExpenseReviewModal';
import { usePermissions } from '../../hooks/usePermissions';

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
  reimbursedAt?: string;
  rejectionReason?: string;
  receipts?: Array<{
    id: number;
    fileName: string;
    fileUrl: string;
  }>;
}

const STATUS_OPTIONS = ['', 'Pending', 'Approved', 'Rejected', 'Reimbursed'];

const AdminExpenses: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [reviewModal, setReviewModal] = useState<Expense | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [reimbursementModal, setReimbursementModal] = useState<Expense | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    paymentMethod: 'Bank Transfer',
    referenceNumber: '',
    remarks: '',
  });
  const [processing, setProcessing] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const { permissions, loading: permissionsLoading } = usePermissions();

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  // Fetch ALL expenses once (no filtering on backend)
  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/expenses', { params: { pageSize: '1000' } });
      setAllExpenses(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load expenses.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load expenses on mount
  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  // React to URL changes - update filter immediately
  useEffect(() => {
    const statusParam = searchParams.get('status');
    if (statusParam) {
      // Capitalize first letter to match STATUS_OPTIONS format
      const formattedStatus = statusParam.charAt(0).toUpperCase() + statusParam.slice(1).toLowerCase();
      if (STATUS_OPTIONS.includes(formattedStatus)) {
        setStatusFilter(formattedStatus);
      } else {
        setStatusFilter('');
      }
    } else {
      setStatusFilter('');
    }
  }, [location.search, searchParams]);

  // Client-side filtering with useMemo - always reactive
  const filteredExpenses = useMemo(() => {
    if (!statusFilter) return allExpenses;
    return allExpenses.filter(expense => 
      expense.status.toLowerCase() === statusFilter.toLowerCase()
    );
  }, [allExpenses, statusFilter]);

  // Update URL when dropdown changes (URL change will trigger filter update via useEffect)
  const handleFilterChange = (newStatus: string) => {
    if (newStatus) {
      setSearchParams({ status: newStatus.toLowerCase() });
    } else {
      setSearchParams({});
    }
  };

  // Refresh - reload all expenses
  const handleRefresh = () => {
    fetchExpenses();
  };

  const openReviewModal = (expense: Expense) => {
    setReviewModal(expense);
  };

  const closeReviewModal = () => {
    setReviewModal(null);
  };

  // Handle approve expense
  const handleApprove = async () => {
    if (!reviewModal || !permissions.canApproveExpenses) return;
    
    setActionLoading(true);
    try {
      await api.post(`/approvals/${reviewModal.id}/approve`);
      // Refresh expenses to show updated status
      await fetchExpenses();
      setReviewModal(null);
    } catch (err: any) {
      console.error('Failed to approve expense:', err);
      alert(err.response?.data?.message || 'Failed to approve expense');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle reject expense
  const handleReject = async (reason: string) => {
    if (!reviewModal || !permissions.canRejectExpenses) return;
    
    setActionLoading(true);
    try {
      await api.post(`/approvals/${reviewModal.id}/reject`, { rejectionReason: reason });
      // Refresh expenses to show updated status
      await fetchExpenses();
      setReviewModal(null);
    } catch (err: any) {
      console.error('Failed to reject expense:', err);
      alert(err.response?.data?.message || 'Failed to reject expense');
    } finally {
      setActionLoading(false);
    }
  };

  // Open reimbursement modal
  const openReimbursementModal = (expense: Expense) => {
    // Auto-generate unique reference number
    const timestamp = Date.now();
    const refNumber = `PAY-${new Date().getFullYear()}-${String(expense.id).padStart(4, '0')}-${timestamp.toString().slice(-4)}`;
    
    setReimbursementModal(expense);
    setPaymentForm({
      paymentMethod: 'Bank Transfer',
      referenceNumber: refNumber,
      remarks: '',
    });
  };

  const closeReimbursementModal = () => {
    setReimbursementModal(null);
    setPaymentForm({
      paymentMethod: 'Bank Transfer',
      referenceNumber: '',
      remarks: '',
    });
  };

  // Handle mark as paid
  const handleMarkAsPaid = async () => {
    if (!reimbursementModal) return;
    if (!paymentForm.referenceNumber.trim()) {
      showToast('Reference number is required.', false);
      return;
    }

    setProcessing(true);
    try {
      // Call backend to mark as reimbursed
      await api.put(`/expenses/${reimbursementModal.id}/reimburse`, {
        paymentMethod: paymentForm.paymentMethod,
        referenceNumber: paymentForm.referenceNumber,
        remarks: paymentForm.remarks,
      });

      showToast('Payment processed successfully.', true);
      closeReimbursementModal();
      // Refresh expenses to show updated status
      await fetchExpenses();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Payment processing failed.', false);
    } finally {
      setProcessing(false);
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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <h1 style={{ color: '#00d9d9', margin: 0 }}>All Expenses</h1>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="group relative"
          style={{
            padding: '10px',
            borderRadius: '8px',
            background: 'rgba(31, 41, 55, 0.5)',
            border: '1px solid rgba(55, 65, 81, 0.5)',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            opacity: loading ? 0.5 : 1
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.background = 'rgba(55, 65, 81, 0.5)';
              e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.3)';
              e.currentTarget.style.boxShadow = '0 0 15px rgba(6, 182, 212, 0.2)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(31, 41, 55, 0.5)';
            e.currentTarget.style.borderColor = 'rgba(55, 65, 81, 0.5)';
            e.currentTarget.style.boxShadow = 'none';
          }}
          aria-label="Refresh"
        >
          <svg
            className={loading ? '' : 'group-hover:rotate-180'}
            style={{
              width: '20px',
              height: '20px',
              color: '#d1d5db',
              transition: 'all 0.5s',
              animation: loading ? 'spin 1s linear infinite' : 'none'
            }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .group-hover\\:rotate-180:hover {
            transform: rotate(180deg);
          }
        `}</style>
      </div>

      {/* Filters */}
      <div className="filter-controls" style={{ marginBottom: '20px' }}>
        <label style={{ color: '#e0e0e0', marginRight: '8px' }}>Filter by Status:</label>
        <select value={statusFilter} onChange={e => handleFilterChange(e.target.value)}>
          {STATUS_OPTIONS.map(s => (
            <option key={s} value={s}>{s || 'All'}</option>
          ))}
        </select>
      </div>

      {error && <div className="error">{error}</div>}

      {loading ? (
        <div className="loading">Loading expenses...</div>
      ) : filteredExpenses.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: '#aaa', padding: '40px' }}>
          {statusFilter ? `No ${statusFilter.toLowerCase()} expenses found.` : 'No expenses found.'}
        </div>
      ) : (
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <table className="table" style={{ margin: 0 }}>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Description</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Submitted</th>
                <th>Paid Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map(exp => (
                <tr key={exp.id}>
                  <td>{exp.userName}</td>
                  <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {exp.description}
                  </td>
                  <td>{exp.category}</td>
                  <td style={{ fontWeight: 600 }}>{formatCurrency(exp.amount)}</td>
                  <td>
                    {exp.status === 'Approved' ? (
                      <span style={{ color: '#ffd700', fontSize: '0.9rem', fontWeight: 500 }}>
                        Pending Payment
                      </span>
                    ) : exp.status === 'Reimbursed' ? (
                      <span style={{ color: '#51cf66', fontSize: '0.9rem', fontWeight: 500 }}>
                        Paid
                      </span>
                    ) : (
                      <span style={{ color: '#fff', fontWeight: 400 }}>
                        {exp.status}
                      </span>
                    )}
                  </td>
                  <td style={{ fontSize: '0.85rem' }}>{formatDate(exp.submittedAt)}</td>
                  <td style={{ fontSize: '0.85rem', color: '#00d9d9' }}>
                    {exp.reimbursedAt ? formatDate(exp.reimbursedAt) : '—'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button
                        className="btn btn-primary"
                        style={{ 
                          padding: '5px 12px', 
                          fontSize: '0.8rem',
                          transition: 'all 0.2s ease',
                        }}
                        onClick={() => openReviewModal(exp)}
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
                      {/* Show Process Payment button for Approved expenses if user has reimbursement permission */}
                      {exp.status === 'Approved' && permissions.canProcessReimbursements && (
                        <button
                          className="btn btn-success"
                          style={{ 
                            padding: '5px 12px', 
                            fontSize: '0.8rem',
                            background: 'rgba(81,207,102,0.2)',
                            border: '1px solid rgba(81,207,102,0.5)',
                            color: '#51cf66',
                            transition: 'all 0.2s ease',
                          }}
                          onClick={() => openReimbursementModal(exp)}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(81, 207, 102, 0.3)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          Process Payment
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Expense Review Modal - Plan-Based Permissions */}
      <ExpenseReviewModal
        expense={reviewModal}
        isOpen={!!reviewModal}
        onClose={closeReviewModal}
        onApprove={permissions.canApproveExpenses ? handleApprove : undefined}
        onReject={permissions.canRejectExpenses ? handleReject : undefined}
        loading={actionLoading}
        readonly={!permissions.canApproveExpenses}
      />

      {/* Payment Processing Modal */}
      {reimbursementModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={closeReimbursementModal}
        >
          <div 
            className="card" 
            style={{ 
              width: 540, 
              maxWidth: '90vw',
              padding: '32px 36px',
              background: 'rgba(26,77,92,0.95)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(0,217,217,0.3)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ color: '#00d9d9', marginTop: 0, marginBottom: 8, fontSize: '1.3rem' }}>
              Process Payment
            </h3>
            <p style={{ color: '#aaa', fontSize: '0.85rem', marginBottom: 24 }}>
              Expense #{reimbursementModal.id}
            </p>

            {/* Expense Summary */}
            <div style={{ 
              marginBottom: 28, 
              padding: '18px 20px', 
              background: 'rgba(0,217,217,0.08)', 
              borderRadius: 8,
              border: '1px solid rgba(0,217,217,0.2)',
            }}>
              <div style={{ marginBottom: 12 }}>
                <p style={{ color: '#aaa', fontSize: '0.75rem', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Employee</p>
                <p style={{ color: '#fff', fontSize: '1.05rem', margin: 0, fontWeight: 500 }}>
                  {reimbursementModal.userName}
                </p>
              </div>
              <div>
                <p style={{ color: '#aaa', fontSize: '0.75rem', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Amount</p>
                <p style={{ color: '#00d9d9', fontSize: '1.8rem', margin: 0, fontWeight: 700 }}>
                  {formatCurrency(reimbursementModal.amount)}
                </p>
              </div>
            </div>

            {/* Payment Method */}
            <div className="form-group" style={{ marginBottom: 20 }}>
              <label style={{ marginBottom: 8, display: 'block', color: '#aaa', fontSize: '0.85rem', fontWeight: 500 }}>
                Payment Method *
              </label>
              <select
                value={paymentForm.paymentMethod}
                onChange={e => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                disabled={processing}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 6,
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(0,217,217,0.3)',
                  color: '#fff',
                  fontSize: '0.95rem',
                }}
              >
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Check">Check</option>
                <option value="Cash">Cash</option>
                <option value="PayPal">PayPal</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Reference Number (Readonly) */}
            <div className="form-group" style={{ marginBottom: 20 }}>
              <label style={{ marginBottom: 8, display: 'block', color: '#aaa', fontSize: '0.85rem', fontWeight: 500 }}>
                Reference Number *
              </label>
              <input
                type="text"
                value={paymentForm.referenceNumber}
                readOnly
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 6,
                  background: 'rgba(0,217,217,0.08)',
                  border: '1px solid rgba(0,217,217,0.25)',
                  color: '#00d9d9',
                  cursor: 'default',
                  fontFamily: 'monospace',
                  fontSize: '0.95rem',
                  fontWeight: 500,
                }}
                title="Auto-generated reference number"
              />
              <p style={{ color: '#aaa', fontSize: '0.75rem', marginTop: 6, marginBottom: 0 }}>
                🔒 Auto-generated • Unique payment identifier
              </p>
            </div>

            {/* Remarks */}
            <div className="form-group" style={{ marginBottom: 28 }}>
              <label style={{ marginBottom: 8, display: 'block', color: '#aaa', fontSize: '0.85rem', fontWeight: 500 }}>
                Remarks (Optional)
              </label>
              <textarea
                rows={3}
                value={paymentForm.remarks}
                onChange={e => setPaymentForm({ ...paymentForm, remarks: e.target.value })}
                placeholder="Add any notes about this payment..."
                disabled={processing}
                style={{ 
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 6,
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(0,217,217,0.3)',
                  color: '#fff',
                  fontSize: '0.9rem',
                  resize: 'vertical',
                  minHeight: 80,
                }}
              />
            </div>

            {/* Action Buttons */}
            <div
              style={{
                display: 'flex',
                gap: 12,
                justifyContent: 'flex-end',
                paddingTop: 8,
              }}
            >
              <button
                className="btn"
                style={{ 
                  background: 'rgba(255,255,255,0.1)', 
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.2)',
                  padding: '10px 20px',
                  fontSize: '0.95rem',
                  fontWeight: 500,
                }}
                onClick={closeReimbursementModal}
                disabled={processing}
              >
                Cancel
              </button>
              <button
                className="btn btn-success"
                onClick={handleMarkAsPaid}
                disabled={processing || !paymentForm.referenceNumber.trim()}
                style={{
                  background: processing ? 'rgba(81,207,102,0.3)' : 'rgba(81,207,102,0.2)',
                  border: '1px solid rgba(81,207,102,0.5)',
                  color: '#51cf66',
                  padding: '10px 24px',
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  opacity: processing || !paymentForm.referenceNumber.trim() ? 0.6 : 1,
                  cursor:
                    processing || !paymentForm.referenceNumber.trim()
                      ? 'not-allowed'
                      : 'pointer',
                }}
              >
                {processing ? 'Processing...' : '✓ Mark as Paid'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminExpenses;

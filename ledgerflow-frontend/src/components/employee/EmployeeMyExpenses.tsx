import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import api from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/helpers';
import ConfirmationModal from '../common/ConfirmationModal';
import { ToastContainer } from '../common/Toast';
import { useToast } from '../../hooks/useToast';
import ExpenseViewModal from './ExpenseViewModal';

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
  receipts?: Receipt[]; // Optional - some expenses may not have receipts
}

interface EmployeeStats {
  totalSubmitted: number;
  totalAmount: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  reimbursedCount: number;
  reimbursedAmount: number;
}

const STATUS_OPTIONS = ['', 'Pending', 'Approved', 'Rejected', 'Reimbursed'];
const CATEGORIES = ['Travel', 'Meals', 'Office Supplies', 'Software', 'Utilities', 'Other'];
const API_BASE = 'http://localhost:5256';

// ── Status badge ──────────────────────────────────────────────────────────────
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  return (
    <span style={{
      color: '#ffffff',
      fontSize: '0.875rem',
      fontWeight: 500,
    }}>
      {status}
    </span>
  );
};

// ── Component ─────────────────────────────────────────────────────────────────
const EmployeeMyExpenses: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [expenses, setExpenses]         = useState<Expense[]>([]);
  const [stats, setStats]               = useState<EmployeeStats | null>(null);
  const [loading, setLoading]           = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [error, setError]               = useState<string | null>(null);
  const { toasts, removeToast, success, error: showError } = useToast();
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    expenseId: number;
  }>({
    isOpen: false,
    expenseId: 0,
  });

  // Filters - Initialize from URL params
  const [statusFilter, setStatusFilter] = useState(searchParams.get('filter') || '');

  // Edit modal
  const [editTarget, setEditTarget] = useState<Expense | null>(null);
  const [editForm, setEditForm]     = useState({ amount: '', description: '', category: '' });
  const [editError, setEditError]   = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  // Receipt preview modal
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState('');

  // Expense view modal
  const [viewExpenseId, setViewExpenseId] = useState<number | null>(null);

  // ── Fetch ───────────────────────────────────────────────────────────────
  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch global stats (always unfiltered)
      const statsRes = await api.get('/expenses/my-stats');
      setStats(statsRes.data);

      // Fetch expenses (with optional filter)
      const params: Record<string, string> = { pageSize: '200' };
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/expenses', { params });
      setExpenses(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load expenses.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  // Sync URL params when filter changes
  useEffect(() => {
    if (statusFilter) {
      setSearchParams({ filter: statusFilter });
    } else {
      setSearchParams({});
    }
  }, [statusFilter, setSearchParams]);

  // Listen to URL changes (e.g., from KPI card clicks)
  useEffect(() => {
    const filterFromUrl = searchParams.get('filter') || '';
    if (filterFromUrl !== statusFilter) {
      setStatusFilter(filterFromUrl);
    }
  }, [searchParams]);

  // ── Delete ──────────────────────────────────────────────────────────────
  const handleDelete = async (id: number) => {
    setConfirmModal({ isOpen: true, expenseId: id });
  };

  const confirmDelete = async () => {
    const id = confirmModal.expenseId;
    setConfirmModal({ isOpen: false, expenseId: 0 });
    setActionLoading(id);
    try {
      await api.delete(`/expenses/${id}`);
      setExpenses(prev => prev.filter(e => e.id !== id));
      // Refresh stats after deletion
      const statsRes = await api.get('/expenses/my-stats');
      setStats(statsRes.data);
      success('Expense deleted successfully.');
    } catch (err: any) {
      showError(err.response?.data?.message || 'Delete failed.');
    } finally {
      setActionLoading(null);
    }
  };

  // ── Edit modal ──────────────────────────────────────────────────────────
  const openEdit = (exp: Expense) => {
    setEditTarget(exp);
    setEditForm({ amount: String(exp.amount), description: exp.description, category: exp.category });
    setEditError(null);
  };

  const handleEditSave = async () => {
    if (!editTarget) return;
    const amount = parseFloat(editForm.amount);
    if (isNaN(amount) || amount <= 0) { setEditError('Amount must be greater than ₱0.00.'); return; }
    if (!editForm.description.trim())  { setEditError('Description is required.'); return; }
    if (!editForm.category)            { setEditError('Please select a category.'); return; }

    setEditSaving(true);
    setEditError(null);
    try {
      const res = await api.put(`/expenses/${editTarget.id}`, {
        amount,
        description: editForm.description.trim(),
        category: editForm.category,
      });
      setExpenses(prev => prev.map(e => e.id === editTarget.id ? res.data : e));
      setEditTarget(null);
      // Refresh stats after edit
      const statsRes = await api.get('/expenses/my-stats');
      setStats(statsRes.data);
    } catch (err: any) {
      setEditError(err.response?.data?.message || 'Update failed.');
    } finally {
      setEditSaving(false);
    }
  };

  // ── Receipt preview ─────────────────────────────────────────────────────
  const openReceipt = (receipt: Receipt) => {
    const url = receipt.fileUrl.startsWith('http')
      ? receipt.fileUrl
      : `${API_BASE}${receipt.fileUrl}`;
    setPreviewUrl(url);
    setPreviewName(receipt.fileName);
  };

  // ── View expense ────────────────────────────────────────────────────────
  const handleViewExpense = (expenseId: number) => {
    setViewExpenseId(expenseId);
  };

  // ── Summary counts from GLOBAL STATS (not filtered expenses) ───────────
  const summary = {
    total:      stats?.totalSubmitted || 0,
    pending:    stats?.pendingCount || 0,
    approved:   stats?.approvedCount || 0,
    rejected:   stats?.rejectedCount || 0,
    reimbursed: stats?.reimbursedCount || 0,
    totalAmount: stats?.totalAmount || 0,
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <div>
          <h1 style={{ color: '#00d9d9', margin: 0 }}>My Expenses</h1>
          <p style={{ color: '#aaa', margin: '5px 0 0', fontSize: '0.9rem' }}>
            View and manage your submitted expenses
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/employee/submit')} style={{ padding: '10px 22px' }}>
          + Submit New
        </button>
      </div>

      {/* Mini summary strip */}
      {!loading && expenses.length > 0 && (
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {[
            { label: 'Total',      value: summary.total,      color: '#e0e0e0' },
            { label: 'Pending',    value: summary.pending,    color: '#ffd700' },
            { label: 'Approved',   value: summary.approved,   color: '#51cf66' },
            { label: 'Rejected',   value: summary.rejected,   color: '#ff6b6b' },
            { label: 'Reimbursed', value: summary.reimbursed, color: '#00d9d9' },
          ].map(s => (
            <div key={s.label} style={{
              background: 'rgba(26,77,92,0.5)',
              border: '1px solid rgba(0,217,217,0.15)',
              borderRadius: '8px',
              padding: '8px 16px',
              display: 'flex', gap: '8px', alignItems: 'center',
            }}>
              <span style={{ color: s.color, fontWeight: 700 }}>{s.value}</span>
              <span style={{ color: '#aaa', fontSize: '0.85rem' }}>{s.label}</span>
            </div>
          ))}
          <div style={{
            background: 'rgba(26,77,92,0.5)',
            border: '1px solid rgba(0,217,217,0.15)',
            borderRadius: '8px',
            padding: '8px 16px',
            display: 'flex', gap: '8px', alignItems: 'center',
            marginLeft: 'auto',
          }}>
            <span style={{ color: '#00d9d9', fontWeight: 700 }}>{formatCurrency(summary.totalAmount)}</span>
            <span style={{ color: '#aaa', fontSize: '0.85rem' }}>Total</span>
          </div>
        </div>
      )}

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
        <label style={{ color: '#e0e0e0', fontSize: '0.9rem' }}>Filter by Status:</label>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{
            padding: '9px 14px',
            border: '2px solid rgba(0,217,217,0.3)',
            borderRadius: '8px',
            background: 'rgba(26,77,92,0.5)',
            color: '#e0e0e0',
            fontSize: '0.9rem',
          }}
        >
          {STATUS_OPTIONS.map(s => (
            <option key={s} value={s}>{s || 'All Statuses'}</option>
          ))}
        </select>
        <button
          className="group relative p-2.5 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700/50 hover:border-cyan-500/30 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={fetchExpenses}
          aria-label="Refresh"
        >
          <RefreshCw className="w-5 h-5 text-gray-300 group-hover:text-cyan-400 transition-all duration-500 group-hover:rotate-180" />
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {loading ? (
        <div className="loading">Loading expenses...</div>
      ) : expenses.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '50px' }}>
          <p style={{ color: '#aaa', marginBottom: '16px' }}>
            {statusFilter ? `No ${statusFilter.toLowerCase()} expenses found.` : 'No expenses submitted yet.'}
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/employee/submit')}>
            Submit your first expense
          </button>
        </div>
      ) : (
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <table className="table" style={{ margin: 0 }}>
            <thead>
              <tr>
                <th>#</th>
                <th>Description</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Submitted</th>
                <th>Receipt</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map(exp => (
                <tr key={exp.id}>
                  <td style={{ color: '#aaa', fontSize: '0.85rem' }}>{exp.id}</td>
                  <td>
                    <div style={{ maxWidth: '200px' }}>
                      <div style={{ fontWeight: 500 }}>{exp.description}</div>
                      {exp.status === 'Rejected' && exp.rejectionReason && (
                        <div style={{ color: '#ff6b6b', fontSize: '0.78rem', marginTop: '2px' }}>
                          Reason: {exp.rejectionReason}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>{exp.category}</td>
                  <td style={{ fontWeight: 600 }}>{formatCurrency(exp.amount)}</td>
                  <td><StatusBadge status={exp.status} /></td>
                  <td style={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>{formatDate(exp.submittedAt)}</td>
                  <td>
                    {(exp.receipts?.length ?? 0) > 0 ? (
                      <button
                        className="btn"
                        style={{
                          padding: '4px 12px', fontSize: '0.78rem',
                          background: 'rgba(0,217,217,0.1)',
                          color: '#00d9d9',
                          border: '1px solid rgba(0,217,217,0.3)',
                        }}
                        onClick={() => openReceipt(exp.receipts![0])}
                      >
                        View
                      </button>
                    ) : (
                      <span style={{ color: '#555', fontSize: '0.8rem' }}>—</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {/* View button - ALWAYS visible for all statuses */}
                      <button
                        style={{
                          padding: '6px 14px',
                          fontSize: '0.8125rem',
                          fontWeight: 500,
                          background: 'transparent',
                          color: '#ffffff',
                          border: '1px solid rgba(0, 217, 217, 0.3)',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                        onClick={() => handleViewExpense(exp.id)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'rgba(0, 217, 217, 0.6)';
                          e.currentTarget.style.boxShadow = '0 0 8px rgba(0, 217, 217, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'rgba(0, 217, 217, 0.3)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        View
                      </button>

                      {/* Edit and Delete buttons - only for Pending expenses */}
                      {exp.status === 'Pending' && (
                        <>
                          <button
                            style={{
                              padding: '6px 14px',
                              fontSize: '0.8125rem',
                              fontWeight: 500,
                              background: 'transparent',
                              color: '#ffffff',
                              border: '1px solid rgba(0, 217, 217, 0.3)',
                              borderRadius: '6px',
                              cursor: actionLoading === exp.id ? 'not-allowed' : 'pointer',
                              transition: 'all 0.2s ease',
                              opacity: actionLoading === exp.id ? 0.5 : 1,
                            }}
                            disabled={actionLoading === exp.id}
                            onClick={() => openEdit(exp)}
                            onMouseEnter={(e) => {
                              if (actionLoading !== exp.id) {
                                e.currentTarget.style.borderColor = 'rgba(0, 217, 217, 0.6)';
                                e.currentTarget.style.boxShadow = '0 0 8px rgba(0, 217, 217, 0.3)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = 'rgba(0, 217, 217, 0.3)';
                              e.currentTarget.style.boxShadow = 'none';
                            }}
                          >
                            Edit
                          </button>
                          <button
                            style={{
                              padding: '6px 14px',
                              fontSize: '0.8125rem',
                              fontWeight: 500,
                              background: 'transparent',
                              color: '#ffffff',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              borderRadius: '6px',
                              cursor: actionLoading === exp.id ? 'not-allowed' : 'pointer',
                              transition: 'all 0.2s ease',
                              opacity: actionLoading === exp.id ? 0.5 : 1,
                            }}
                            disabled={actionLoading === exp.id}
                            onClick={() => handleDelete(exp.id)}
                            onMouseEnter={(e) => {
                              if (actionLoading !== exp.id) {
                                e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.6)';
                                e.currentTarget.style.boxShadow = '0 0 8px rgba(239, 68, 68, 0.3)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                              e.currentTarget.style.boxShadow = 'none';
                            }}
                          >
                            {actionLoading === exp.id ? '...' : 'Delete'}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Edit Modal ── */}
      {editTarget && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div className="card" style={{ width: '460px', padding: '30px' }}>
            <h3 style={{ color: '#00d9d9', marginTop: 0 }}>Edit Expense #{editTarget.id}</h3>

            {editError && <div className="error" style={{ marginBottom: '16px' }}>{editError}</div>}

            <div className="form-group">
              <label>Amount (₱) *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={editForm.amount}
                onChange={e => setEditForm(f => ({ ...f, amount: e.target.value }))}
                disabled={editSaving}
              />
            </div>
            <div className="form-group">
              <label>Description *</label>
              <textarea
                rows={3}
                value={editForm.description}
                onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                disabled={editSaving}
                style={{ resize: 'vertical' }}
              />
            </div>
            <div className="form-group">
              <label>Category *</label>
              <select
                value={editForm.category}
                onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))}
                disabled={editSaving}
              >
                <option value="">Select category</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button
                className="btn"
                style={{ background: '#555', color: '#fff' }}
                onClick={() => setEditTarget(null)}
                disabled={editSaving}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleEditSave}
                disabled={editSaving}
              >
                {editSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Receipt Preview Modal ── */}
      {previewUrl && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
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

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title="Delete Expense"
        message="Are you sure you want to delete this expense? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => setConfirmModal({ isOpen: false, expenseId: 0 })}
        type="danger"
        isLoading={actionLoading !== null}
      />

      {/* Toast Notification */}
      <ToastContainer
        toasts={toasts}
        onClose={removeToast}
      />

      {/* Expense View Modal */}
      {viewExpenseId && (
        <ExpenseViewModal
          expenseId={viewExpenseId}
          onClose={() => setViewExpenseId(null)}
        />
      )}
    </div>
  );
};

export default EmployeeMyExpenses;

import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import api from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { ExpenseReviewModal } from '../common/ExpenseReviewModal';

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

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, { bg: string; color: string }> = {
    Pending:    { bg: 'rgba(255,215,0,0.12)',   color: '#ffd700' },
    Approved:   { bg: 'rgba(81,207,102,0.12)',  color: '#51cf66' },
    Rejected:   { bg: 'rgba(255,107,107,0.12)', color: '#ff6b6b' },
    Reimbursed: { bg: 'rgba(0,217,217,0.12)',   color: '#00d9d9' },
  };
  const s = map[status] ?? { bg: 'rgba(255,255,255,0.08)', color: '#aaa' };
  return (
    <span style={{
      background: s.bg, color: s.color,
      padding: '3px 10px', borderRadius: '12px',
      fontSize: '0.78rem', fontWeight: 700,
      textTransform: 'uppercase', letterSpacing: '0.5px',
    }}>
      {status}
    </span>
  );
};

const AuditExpenses: React.FC = () => {
  const [expenses, setExpenses]     = useState<Expense[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [reviewModal, setReviewModal] = useState<Expense | null>(null);

  const fetchExpenses = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params: Record<string, string> = { pageSize: '500' };
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/expenses', { params });
      setExpenses(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load expenses.');
    } finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  const openReviewModal = (expense: Expense) => {
    setReviewModal(expense);
  };

  const closeReviewModal = () => {
    setReviewModal(null);
  };

  const summary = {
    total:      expenses.length,
    totalAmount: expenses.reduce((s, e) => s + e.amount, 0),
    pending:    expenses.filter(e => e.status === 'Pending').length,
    approved:   expenses.filter(e => e.status === 'Approved').length,
    rejected:   expenses.filter(e => e.status === 'Rejected').length,
    reimbursed: expenses.filter(e => e.status === 'Reimbursed').length,
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <div>
          <h1 style={{ color: '#00d9d9', margin: 0 }}>View All Expenses</h1>
          <p style={{ color: '#aaa', margin: '5px 0 0', fontSize: '0.9rem' }}>
            Read-only view of all expense submissions
          </p>
        </div>
        <button
          className="group relative p-2.5 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700/50 hover:border-cyan-500/30 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-all duration-200"
          onClick={fetchExpenses}
          aria-label="Refresh"
        >
          <RefreshCw className="w-5 h-5 text-gray-300 group-hover:text-cyan-400 transition-all duration-500 group-hover:rotate-180" />
        </button>
      </div>

      {/* Summary strip */}
      {!loading && (
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {[
            { label: 'Total',      value: summary.total,      color: '#e0e0e0' },
            { label: 'Pending',    value: summary.pending,    color: '#ffd700' },
            { label: 'Approved',   value: summary.approved,   color: '#51cf66' },
            { label: 'Rejected',   value: summary.rejected,   color: '#ff6b6b' },
            { label: 'Reimbursed', value: summary.reimbursed, color: '#00d9d9' },
          ].map(s => (
            <div key={s.label} style={{
              background: 'rgba(26,77,92,0.5)', border: '1px solid rgba(0,217,217,0.15)',
              borderRadius: '8px', padding: '8px 16px',
              display: 'flex', gap: '8px', alignItems: 'center',
            }}>
              <span style={{ color: s.color, fontWeight: 700 }}>{s.value}</span>
              <span style={{ color: '#aaa', fontSize: '0.85rem' }}>{s.label}</span>
            </div>
          ))}
          <div style={{
            background: 'rgba(26,77,92,0.5)', border: '1px solid rgba(0,217,217,0.15)',
            borderRadius: '8px', padding: '8px 16px',
            display: 'flex', gap: '8px', alignItems: 'center', marginLeft: 'auto',
          }}>
            <span style={{ color: '#00d9d9', fontWeight: 700 }}>{formatCurrency(summary.totalAmount)}</span>
            <span style={{ color: '#aaa', fontSize: '0.85rem' }}>Total</span>
          </div>
        </div>
      )}

      {/* Filter */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'center' }}>
        <label style={{ color: '#e0e0e0', fontSize: '0.9rem' }}>Filter by Status:</label>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{
            padding: '9px 14px', border: '2px solid rgba(0,217,217,0.3)',
            borderRadius: '8px', background: 'rgba(26,77,92,0.5)',
            color: '#e0e0e0', fontSize: '0.9rem',
          }}
        >
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s || 'All Statuses'}</option>)}
        </select>
      </div>

      {error && <div className="error">{error}</div>}

      {loading ? (
        <div className="loading">Loading expenses...</div>
      ) : expenses.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: '#aaa', padding: '50px' }}>
          No expenses found.
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
                <th>Status</th>
                <th>Submitted</th>
                <th>Approved</th>
                <th>Reimbursed</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map(exp => (
                <tr key={exp.id}>
                  <td style={{ color: '#aaa', fontSize: '0.85rem' }}>{exp.id}</td>
                  <td>{exp.userName}</td>
                  <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {exp.description}
                    {exp.status === 'Rejected' && exp.rejectionReason && (
                      <div style={{ color: '#ff6b6b', fontSize: '0.75rem', marginTop: '2px' }}>
                        Reason: {exp.rejectionReason}
                      </div>
                    )}
                  </td>
                  <td>{exp.category}</td>
                  <td style={{ fontWeight: 600 }}>{formatCurrency(exp.amount)}</td>
                  <td><StatusBadge status={exp.status} /></td>
                  <td style={{ fontSize: '0.85rem' }}>{formatDate(exp.submittedAt)}</td>
                  <td style={{ fontSize: '0.85rem' }}>{exp.approvedAt ? formatDate(exp.approvedAt) : '—'}</td>
                  <td style={{ fontSize: '0.85rem', color: '#00d9d9' }}>{exp.reimbursedAt ? formatDate(exp.reimbursedAt) : '—'}</td>
                  <td>
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Expense Review Modal - Read-Only for Auditor */}
      <ExpenseReviewModal
        expense={reviewModal}
        isOpen={!!reviewModal}
        onClose={closeReviewModal}
        readonly={true}
      />
    </div>
  );
};

export default AuditExpenses;

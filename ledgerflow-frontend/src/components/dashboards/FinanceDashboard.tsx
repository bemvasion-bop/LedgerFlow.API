import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { formatCurrency } from '../../utils/helpers';

interface Stats {
  totalExpenses: number;
  totalAmount: number;
  pending: number;
  approved: number;
  rejected: number;
  reimbursed: number;
}

const FinanceDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats]   = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/expenses/history/stats');
      setStats(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load dashboard stats.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  const val = (n?: number) => loading ? '—' : (n ?? 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h1 style={{ color: '#00d9d9', margin: 0 }}>Finance Dashboard</h1>
          <p style={{ color: '#aaa', margin: '5px 0 0', fontSize: '0.9rem' }}>
            Approve expenses and process reimbursements
          </p>
        </div>
        <button className="btn btn-primary" onClick={loadStats} style={{ padding: '8px 18px', fontSize: '0.9rem' }}>
          Refresh
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {/* Stats grid */}
      <div className="dashboard-grid" style={{ marginBottom: '30px' }}>
        <div className="card">
          <h3>Pending Approvals</h3>
          <p style={{ color: '#ffd700' }}>{val(stats?.pending)}</p>
          <span style={{ color: '#aaa', fontSize: '0.85rem' }}>Awaiting review</span>
        </div>
        <div className="card">
          <h3>Approved</h3>
          <p style={{ color: '#51cf66' }}>{val(stats?.approved)}</p>
          <span style={{ color: '#aaa', fontSize: '0.85rem' }}>Ready to reimburse</span>
        </div>
        <div className="card">
          <h3>Reimbursed</h3>
          <p style={{ color: '#00d9d9' }}>{val(stats?.reimbursed)}</p>
          <span style={{ color: '#aaa', fontSize: '0.85rem' }}>Fully processed</span>
        </div>
        <div className="card">
          <h3>Rejected</h3>
          <p style={{ color: '#ff6b6b' }}>{val(stats?.rejected)}</p>
          <span style={{ color: '#aaa', fontSize: '0.85rem' }}>Declined expenses</span>
        </div>
        <div className="card">
          <h3>Total Expenses</h3>
          <p>{val(stats?.totalExpenses)}</p>
          <span style={{ color: '#aaa', fontSize: '0.85rem' }}>All submissions</span>
        </div>
        <div className="card">
          <h3>Total Amount</h3>
          <p style={{ fontSize: '1.8rem' }}>
            {loading ? '—' : formatCurrency(stats?.totalAmount ?? 0)}
          </p>
          <span style={{ color: '#aaa', fontSize: '0.85rem' }}>All time</span>
        </div>
      </div>

      {/* Quick-action cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
        <div
          className="card"
          onClick={() => navigate('/finance/approvals')}
          style={{
            cursor: 'pointer',
            borderColor: (stats?.pending ?? 0) > 0 ? 'rgba(255,215,0,0.4)' : undefined,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h3 style={{ color: '#ffd700' }}>Approval Workflow</h3>
              <p style={{ color: '#ffd700', margin: '8px 0' }}>{val(stats?.pending)}</p>
              <span style={{ color: '#aaa', fontSize: '0.85rem' }}>Manage approvals & history →</span>
            </div>
            <span style={{ fontSize: '2rem', opacity: 0.6 }}>⚡</span>
          </div>
        </div>

        <div
          className="card"
          onClick={() => navigate('/finance/pending')}
          style={{
            cursor: 'pointer',
            borderColor: (stats?.pending ?? 0) > 0 ? 'rgba(255,215,0,0.4)' : undefined,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h3 style={{ color: '#ffd700' }}>Pending Approvals</h3>
              <p style={{ color: '#ffd700', margin: '8px 0' }}>{val(stats?.pending)}</p>
              <span style={{ color: '#aaa', fontSize: '0.85rem' }}>Click to review →</span>
            </div>
            <span style={{ fontSize: '2rem', opacity: 0.6 }}>⏳</span>
          </div>
        </div>

        <div
          className="card"
          onClick={() => navigate('/finance/approved')}
          style={{
            cursor: 'pointer',
            borderColor: (stats?.approved ?? 0) > 0 ? 'rgba(81,207,102,0.4)' : undefined,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h3 style={{ color: '#51cf66' }}>Approved Expenses</h3>
              <p style={{ color: '#51cf66', margin: '8px 0' }}>{val(stats?.approved)}</p>
              <span style={{ color: '#aaa', fontSize: '0.85rem' }}>Click to reimburse →</span>
            </div>
            <span style={{ fontSize: '2rem', opacity: 0.6 }}>✓</span>
          </div>
        </div>

        <div
          className="card"
          onClick={() => navigate('/finance/reimbursements')}
          style={{ cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h3>Reimbursement History</h3>
              <p style={{ color: '#00d9d9', margin: '8px 0' }}>{val(stats?.reimbursed)}</p>
              <span style={{ color: '#aaa', fontSize: '0.85rem' }}>Click to view history →</span>
            </div>
            <span style={{ fontSize: '2rem', opacity: 0.6 }}>📋</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinanceDashboard;

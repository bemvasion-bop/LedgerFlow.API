import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/helpers';

interface DashboardStats {
  totalExpenses: number;
  totalAmount: number;
  pendingApprovals: number;
  approvedExpenses: number;
  rejectedExpenses: number;
  reimbursedExpenses: number;
  recentExpenses: RecentExpense[];
}

interface RecentExpense {
  id: number;
  description: string;
  amount: number;
  category: string;
  status: string;
  submittedAt: string;
  userName: string;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/dashboard/admin');
      setStats(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (loading) return <div className="loading">Loading dashboard...</div>;
  if (error)   return <div className="error">{error}</div>;
  if (!stats)  return null;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ color: '#00d9d9', margin: 0 }}>Admin Dashboard</h1>
        <button className="btn btn-primary" onClick={fetchDashboard} style={{ padding: '8px 18px', fontSize: '0.9rem' }}>
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="dashboard-grid">
        <div className="card">
          <h3>Total Expenses</h3>
          <p>{stats.totalExpenses}</p>
          <span style={{ color: '#aaa', fontSize: '0.85rem' }}>All time</span>
        </div>
        <div className="card">
          <h3>Total Amount</h3>
          <p style={{ fontSize: '1.8rem' }}>{formatCurrency(stats.totalAmount)}</p>
          <span style={{ color: '#aaa', fontSize: '0.85rem' }}>All submissions</span>
        </div>
        <div className="card">
          <h3>Pending Approvals</h3>
          <p style={{ color: '#ffd700' }}>{stats.pendingApprovals}</p>
          <span style={{ color: '#aaa', fontSize: '0.85rem' }}>Awaiting review</span>
        </div>
        <div className="card">
          <h3>Approved</h3>
          <p style={{ color: '#51cf66' }}>{stats.approvedExpenses}</p>
          <span style={{ color: '#aaa', fontSize: '0.85rem' }}>Approved expenses</span>
        </div>
        <div className="card">
          <h3>Rejected</h3>
          <p style={{ color: '#ff6b6b' }}>{stats.rejectedExpenses}</p>
          <span style={{ color: '#aaa', fontSize: '0.85rem' }}>Rejected expenses</span>
        </div>
        <div className="card">
          <h3>Reimbursed</h3>
          <p style={{ color: '#00d9d9' }}>{stats.reimbursedExpenses}</p>
          <span style={{ color: '#aaa', fontSize: '0.85rem' }}>Fully processed</span>
        </div>
      </div>

      {/* Recent Expenses */}
      <div className="card" style={{ marginTop: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ margin: 0 }}>Recent Expenses</h3>
          <a href="/admin/expenses" style={{ color: '#00d9d9', fontSize: '0.9rem', textDecoration: 'none' }}>
            View All →
          </a>
        </div>
        {stats.recentExpenses.length === 0 ? (
          <p style={{ color: '#aaa', textAlign: 'center', padding: '20px' }}>No expenses yet.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Employee</th>
                <th>Description</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentExpenses.map((exp) => (
                <tr key={exp.id}>
                  <td>{exp.id}</td>
                  <td>{exp.userName}</td>
                  <td>{exp.description}</td>
                  <td>{exp.category}</td>
                  <td>{formatCurrency(exp.amount)}</td>
                  <td className={`status-${exp.status.toLowerCase()}`}>{exp.status}</td>
                  <td>{formatDate(exp.submittedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;

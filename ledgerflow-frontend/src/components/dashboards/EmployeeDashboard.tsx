import React, { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExpenses } from '../../hooks/useExpenses';
import { formatCurrency, formatDate } from '../../utils/helpers';

const EmployeeDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { expenses, stats, loading, error, fetchExpenses, fetchExpenseStats } = useExpenses();

  const load = useCallback(() => {
    fetchExpenses({ pageSize: 5 });
    fetchExpenseStats();
  }, []);

  useEffect(() => { load(); }, []);

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h1 style={{ color: '#00d9d9', margin: 0 }}>My Dashboard</h1>
          <p style={{ color: '#aaa', margin: '5px 0 0', fontSize: '0.9rem' }}>
            Track your expense submissions and status
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => navigate('/employee/submit')}
          style={{ padding: '10px 22px' }}
        >
          + Submit Expense
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {/* Stats cards */}
      <div className="dashboard-grid" style={{ marginBottom: '30px' }}>
        <div className="card">
          <h3>Total Submitted</h3>
          <p>{loading ? '—' : stats?.totalExpenses ?? 0}</p>
          <span style={{ color: '#aaa', fontSize: '0.85rem' }}>All time</span>
        </div>
        <div className="card">
          <h3>Total Amount</h3>
          <p style={{ fontSize: '1.8rem' }}>
            {loading ? '—' : formatCurrency(stats?.totalAmount ?? 0)}
          </p>
          <span style={{ color: '#aaa', fontSize: '0.85rem' }}>All submissions</span>
        </div>
        <div className="card">
          <h3>Pending</h3>
          <p style={{ color: '#ffd700' }}>{loading ? '—' : stats?.pending ?? 0}</p>
          <span style={{ color: '#aaa', fontSize: '0.85rem' }}>Awaiting approval</span>
        </div>
        <div className="card">
          <h3>Approved</h3>
          <p style={{ color: '#51cf66' }}>{loading ? '—' : stats?.approved ?? 0}</p>
          <span style={{ color: '#aaa', fontSize: '0.85rem' }}>Approved expenses</span>
        </div>
        <div className="card">
          <h3>Rejected</h3>
          <p style={{ color: '#ff6b6b' }}>{loading ? '—' : stats?.rejected ?? 0}</p>
          <span style={{ color: '#aaa', fontSize: '0.85rem' }}>Needs resubmission</span>
        </div>
        <div className="card">
          <h3>Reimbursed</h3>
          <p style={{ color: '#00d9d9' }}>{loading ? '—' : stats?.reimbursed ?? 0}</p>
          <span style={{ color: '#aaa', fontSize: '0.85rem' }}>Fully processed</span>
        </div>
      </div>

      {/* Recent expenses */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{
          padding: '20px 20px 0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: '4px',
        }}>
          <h3 style={{ margin: 0, color: '#00d9d9' }}>Recent Expenses</h3>
          <button
            className="btn"
            style={{ padding: '6px 16px', fontSize: '0.85rem', background: 'rgba(0,217,217,0.1)', color: '#00d9d9', border: '1px solid rgba(0,217,217,0.3)' }}
            onClick={() => navigate('/employee/expenses')}
          >
            View All →
          </button>
        </div>

        {loading ? (
          <div className="loading" style={{ minHeight: '120px' }}>Loading...</div>
        ) : expenses.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#aaa', padding: '40px' }}>
            <p style={{ fontSize: '1rem', marginBottom: '12px' }}>No expenses yet.</p>
            <button className="btn btn-primary" onClick={() => navigate('/employee/submit')}>
              Submit your first expense
            </button>
          </div>
        ) : (
          <table className="table" style={{ margin: 0 }}>
            <thead>
              <tr>
                <th>Description</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map(exp => (
                <tr key={exp.id}>
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

export default EmployeeDashboard;

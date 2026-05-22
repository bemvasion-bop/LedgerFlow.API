import React, { useState, useCallback } from 'react';
import api from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/helpers';

interface ReportExpense {
  id: number;
  userName: string;
  userEmail: string;
  description: string;
  amount: number;
  category: string;
  status: string;
  submittedAt: string;
  approvedAt?: string;
  rejectionReason?: string;
}

const STATUS_OPTIONS = ['', 'Pending', 'Approved', 'Rejected', 'Reimbursed'];

const AdminReports: React.FC = () => {
  const [results, setResults] = useState<ReportExpense[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [status, setStatus] = useState('');

  // Summary computed from results
  const summary = {
    total: results.length,
    totalAmount: results.reduce((sum, r) => sum + r.amount, 0),
    pending: results.filter(r => r.status === 'Pending').length,
    approved: results.filter(r => r.status === 'Approved').length,
    rejected: results.filter(r => r.status === 'Rejected').length,
    reimbursed: results.filter(r => r.status === 'Reimbursed').length,
  };

  const handleSearch = useCallback(async () => {
    setLoading(true);
    setError(null);
    setHasSearched(true);
    try {
      const params: Record<string, string> = {};
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo)   params.dateTo   = dateTo;
      if (status)   params.status   = status;

      const res = await api.get('/reports/expenses', { params });
      setResults(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate report.');
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, status]);

  const handleReset = () => {
    setDateFrom('');
    setDateTo('');
    setStatus('');
    setResults([]);
    setHasSearched(false);
    setError(null);
  };

  return (
    <div>
      <h1 style={{ color: '#00d9d9', marginBottom: '25px' }}>Reports & Analytics</h1>

      {/* Filter Panel */}
      <div className="card" style={{ marginBottom: '25px' }}>
        <h3 style={{ marginTop: 0 }}>Filter Expenses</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label>Date From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label>Date To</label>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label>Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)}>
              {STATUS_OPTIONS.map(s => (
                <option key={s} value={s}>{s || 'All Statuses'}</option>
              ))}
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
          <button className="btn btn-primary" onClick={handleSearch} disabled={loading}>
            {loading ? 'Generating...' : 'Generate Report'}
          </button>
          <button
            className="btn"
            style={{ background: '#555', color: '#fff' }}
            onClick={handleReset}
          >
            Reset
          </button>
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      {/* Summary Cards — only shown after search */}
      {hasSearched && !loading && (
        <>
          <div className="dashboard-grid" style={{ marginBottom: '25px' }}>
            <div className="card">
              <h3>Total Records</h3>
              <p>{summary.total}</p>
            </div>
            <div className="card">
              <h3>Total Amount</h3>
              <p style={{ fontSize: '1.8rem' }}>{formatCurrency(summary.totalAmount)}</p>
            </div>
            <div className="card">
              <h3>Pending</h3>
              <p style={{ color: '#ffd700' }}>{summary.pending}</p>
            </div>
            <div className="card">
              <h3>Approved</h3>
              <p style={{ color: '#51cf66' }}>{summary.approved}</p>
            </div>
            <div className="card">
              <h3>Rejected</h3>
              <p style={{ color: '#ff6b6b' }}>{summary.rejected}</p>
            </div>
            <div className="card">
              <h3>Reimbursed</h3>
              <p style={{ color: '#00d9d9' }}>{summary.reimbursed}</p>
            </div>
          </div>

          {/* Results Table */}
          {results.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', color: '#aaa', padding: '40px' }}>
              No expenses match the selected filters.
            </div>
          ) : (
            <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
              <div style={{ padding: '20px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, color: '#00d9d9' }}>Results ({results.length})</h3>
              </div>
              <table className="table" style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Employee</th>
                    <th>Email</th>
                    <th>Description</th>
                    <th>Category</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map(r => (
                    <tr key={r.id}>
                      <td>{r.id}</td>
                      <td>{r.userName}</td>
                      <td style={{ fontSize: '0.85rem', color: '#aaa' }}>{r.userEmail}</td>
                      <td style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.description}
                      </td>
                      <td>{r.category}</td>
                      <td>{formatCurrency(r.amount)}</td>
                      <td className={`status-${r.status.toLowerCase()}`}>{r.status}</td>
                      <td>{formatDate(r.submittedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminReports;

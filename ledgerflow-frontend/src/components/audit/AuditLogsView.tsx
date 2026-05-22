import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { formatDate } from '../../utils/helpers';
import { AuditLog, AuditStats } from '../../types';

const AuditLogsView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [actionFilter, setActionFilter] = useState<string>('');
  const [entityFilter, setEntityFilter] = useState<string>('');
  const [userFilter, setUserFilter] = useState<string>('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 12;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {
        pageNumber: currentPage,
        pageSize: pageSize,
      };

      if (actionFilter) params.action = actionFilter;
      if (entityFilter) params.entity = entityFilter;

      const res = await api.get('/auditlogs', { params });
      setLogs(Array.isArray(res.data.data) ? res.data.data : []);
      setTotal(res.data.total || 0);
      setTotalPages(res.data.totalPages || 1);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load audit logs.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, actionFilter, entityFilter]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/auditlogs/stats');
      setStats(res.data);
    } catch (err: any) {
      console.error('Failed to load stats:', err);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleFilterChange = () => {
    setCurrentPage(1);
    fetchLogs();
  };

  const clearFilters = () => {
    setActionFilter('');
    setEntityFilter('');
    setUserFilter('');
    setCurrentPage(1);
  };

  const getEntityDisplay = (entityType: string, action: string) => {
    // Map entity types to more meaningful names
    const entityMap: Record<string, string> = {
      'Auth': 'Authentication',
      'Expense': 'Expense',
      'User': 'User',
      'Company': 'Company',
      'Report': 'Report',
      'Settings': 'Settings',
      'Category': 'Category',
      'Approval': 'Approval'
    };

    // If entity type is empty or null, infer from action
    if (!entityType || entityType === 'null' || entityType === '') {
      if (action === 'LOGIN' || action === 'LOGOUT') return 'Authentication';
      if (action === 'APPROVE' || action === 'REJECT' || action === 'REIMBURSE') return 'Expense';
      return 'System';
    }

    return entityMap[entityType] || entityType;
  };

  // Filter logs by user name/email on frontend
  const filteredLogs = userFilter
    ? logs.filter(log => 
        log.userName.toLowerCase().includes(userFilter.toLowerCase())
      )
    : logs;

  return (
    <div>
      <div style={{ marginBottom: '25px' }}>
        <h1 style={{ color: '#00d9d9', margin: 0 }}>Audit Logs</h1>
        <p style={{ color: '#aaa', margin: '5px 0 0', fontSize: '0.9rem' }}>
          Complete audit trail of all system activities
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '25px' }}>
          <div className="card" style={{ padding: '16px' }}>
            <h4 style={{ margin: '0 0 8px', color: '#aaa', fontSize: '0.85rem', fontWeight: 500 }}>Total Logs</h4>
            <p style={{ margin: 0, fontSize: '1.8rem', fontWeight: 600, color: '#fff' }}>{stats.totalLogs}</p>
          </div>
          <div className="card" style={{ padding: '16px' }}>
            <h4 style={{ margin: '0 0 8px', color: '#aaa', fontSize: '0.85rem', fontWeight: 500 }}>Today</h4>
            <p style={{ margin: 0, fontSize: '1.8rem', fontWeight: 600, color: '#fff' }}>{stats.todayLogs}</p>
          </div>
          <div className="card" style={{ padding: '16px' }}>
            <h4 style={{ margin: '0 0 8px', color: '#aaa', fontSize: '0.85rem', fontWeight: 500 }}>Logins</h4>
            <p style={{ margin: 0, fontSize: '1.8rem', fontWeight: 600, color: '#fff' }}>{stats.loginCount}</p>
          </div>
          <div className="card" style={{ padding: '16px' }}>
            <h4 style={{ margin: '0 0 8px', color: '#aaa', fontSize: '0.85rem', fontWeight: 500 }}>Expenses Created</h4>
            <p style={{ margin: 0, fontSize: '1.8rem', fontWeight: 600, color: '#fff' }}>{stats.expenseCreated}</p>
          </div>
          <div className="card" style={{ padding: '16px' }}>
            <h4 style={{ margin: '0 0 8px', color: '#aaa', fontSize: '0.85rem', fontWeight: 500 }}>Approved</h4>
            <p style={{ margin: 0, fontSize: '1.8rem', fontWeight: 600, color: '#fff' }}>{stats.expenseApproved}</p>
          </div>
          <div className="card" style={{ padding: '16px' }}>
            <h4 style={{ margin: '0 0 8px', color: '#aaa', fontSize: '0.85rem', fontWeight: 500 }}>Rejected</h4>
            <p style={{ margin: 0, fontSize: '1.8rem', fontWeight: 600, color: '#fff' }}>{stats.expenseRejected}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card" style={{ marginBottom: '20px', padding: '20px' }}>
        <h3 style={{ color: '#00d9d9', marginTop: 0, marginBottom: '15px', fontSize: '1rem' }}>Filters</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ fontSize: '0.85rem' }}>Action</label>
            <select value={actionFilter} onChange={e => setActionFilter(e.target.value)}>
              <option value="">All Actions</option>
              <option value="LOGIN">Login</option>
              <option value="LOGOUT">Logout</option>
              <option value="CREATE">Create</option>
              <option value="UPDATE">Update</option>
              <option value="DELETE">Delete</option>
              <option value="APPROVE">Approve</option>
              <option value="REJECT">Reject</option>
              <option value="REIMBURSE">Reimburse</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ fontSize: '0.85rem' }}>Entity</label>
            <select value={entityFilter} onChange={e => setEntityFilter(e.target.value)}>
              <option value="">All Entities</option>
              <option value="Auth">Auth</option>
              <option value="Expense">Expense</option>
              <option value="User">User</option>
              <option value="Company">Company</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ fontSize: '0.85rem' }}>User (Search)</label>
            <input
              type="text"
              value={userFilter}
              onChange={e => setUserFilter(e.target.value)}
              placeholder="Name or email..."
            />
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
            <button className="btn btn-primary" onClick={handleFilterChange} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
              Apply
            </button>
            <button className="btn" onClick={clearFilters} style={{ padding: '8px 16px', fontSize: '0.85rem', background: '#555' }}>
              Clear
            </button>
          </div>
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      {/* Logs Table */}
      {loading ? (
        <div className="loading">Loading audit logs...</div>
      ) : filteredLogs.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: '#aaa', padding: '50px' }}>
          <p style={{ fontSize: '1.1rem', marginBottom: '8px' }}>No audit logs found.</p>
          <p style={{ fontSize: '0.9rem' }}>Try adjusting your filters.</p>
        </div>
      ) : (
        <>
          <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: '20px' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(0,217,217,0.2)' }}>
              <span style={{ color: '#00d9d9', fontWeight: 600 }}>{total}</span>
              <span style={{ color: '#aaa', fontSize: '0.9rem' }}> total log{total !== 1 ? 's' : ''}</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>User</th>
                    <th>Action</th>
                    <th>Entity</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map(log => (
                    <tr key={log.id}>
                      <td style={{ fontSize: '0.85rem', whiteSpace: 'nowrap', color: '#aaa' }}>{formatDate(log.timestamp)}</td>
                      <td>
                        <div>
                          <div style={{ fontWeight: 500, color: '#fff' }}>{log.userName}</div>
                          <div style={{ fontSize: '0.8rem', color: '#888' }}>{log.userEmail}</div>
                        </div>
                      </td>
                      <td style={{ color: '#fff', fontSize: '0.85rem' }}>{log.action}</td>
                      <td style={{ color: '#aaa', fontSize: '0.85rem' }}>{getEntityDisplay(log.entityType, log.action)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
              <button
                className="btn"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{ padding: '8px 16px', fontSize: '0.85rem' }}
              >
                Previous
              </button>
              <span style={{ color: '#aaa', fontSize: '0.9rem' }}>
                Page {currentPage} of {totalPages}
              </span>
              <button
                className="btn"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                style={{ padding: '8px 16px', fontSize: '0.85rem' }}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AuditLogsView;

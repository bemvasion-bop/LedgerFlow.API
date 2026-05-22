import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import api from '../../services/api';
import { formatDateTime } from '../../utils/helpers';

interface AuditLog {
  id: number;
  userId: number;
  userEmail: string;
  userName: string;
  action: string;
  entity: string;
  entityId?: string;
  timestamp: string;
}

const PAGE_SIZE = 12;

const ACTION_COLORS: Record<string, string> = {
  CREATE:          '#51cf66',
  UPDATE:          '#00d9d9',
  DELETE:          '#ff6b6b',
  APPROVE:         '#51cf66',
  REJECT:          '#ff6b6b',
  REIMBURSE:       '#9b59b6',
  LOGIN:           '#ffd700',
  UPLOAD_RECEIPT:  '#20c997',
  DELETE_RECEIPT:  '#ff8a8a',
  CREATE_USER:     '#51cf66',
  UPDATE_USER:     '#00d9d9',
  ACTIVATE_USER:   '#51cf66',
  DEACTIVATE_USER: '#ff6b6b',
};

const AuditLogs: React.FC = () => {
  const [logs, setLogs]     = useState<AuditLog[]>([]);
  const [total, setTotal]   = useState(0);
  const [page, setPage]     = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const fetchLogs = useCallback(async (targetPage: number) => {
    setLoading(true); setError(null);
    try {
      const res = await api.get('/auditlogs', {
        params: { page: targetPage, pageSize: PAGE_SIZE },
      });
      const body = res.data;
      if (Array.isArray(body)) {
        setLogs(body);
        setTotal(body.length);
        setPage(1);
      } else {
        setLogs(Array.isArray(body?.data) ? body.data : []);
        setTotal(typeof body?.total === 'number' ? body.total : 0);
        setPage(typeof body?.page  === 'number' ? body.page  : targetPage);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load audit logs.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchLogs(1); }, [fetchLogs]);

  const handleRefresh = () => { setSearch(''); setActionFilter(''); fetchLogs(1); };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const filtered = logs.filter(l => {
    const matchAction = !actionFilter || l.action === actionFilter;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      (l.userEmail || '').toLowerCase().includes(q) ||
      (l.userName  || '').toLowerCase().includes(q) ||
      (l.entity    || '').toLowerCase().includes(q) ||
      (l.entityId  || '').toLowerCase().includes(q);
    return matchAction && matchSearch;
  });

  const uniqueActions = Array.from(new Set(logs.map(l => l.action))).sort();

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <div>
          <h1 style={{ color: '#00d9d9', margin: 0 }}>Audit Logs</h1>
          <p style={{ color: '#aaa', margin: '5px 0 0', fontSize: '0.9rem' }}>
            Read-only system activity log — {total} total entries
          </p>
        </div>
        <button
          className="group relative p-2.5 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700/50 hover:border-cyan-500/30 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-all duration-200"
          onClick={handleRefresh}
          aria-label="Refresh"
        >
          <RefreshCw className="w-5 h-5 text-gray-300 group-hover:text-cyan-400 transition-all duration-500 group-hover:rotate-180" />
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Search by user, entity..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            padding: '10px 15px', border: '2px solid rgba(0,217,217,0.3)',
            borderRadius: '8px', background: 'rgba(26,77,92,0.5)',
            color: '#e0e0e0', fontSize: '0.95rem', minWidth: '250px',
          }}
        />
        <select
          value={actionFilter}
          onChange={e => setActionFilter(e.target.value)}
          style={{
            padding: '10px 15px', border: '2px solid rgba(0,217,217,0.3)',
            borderRadius: '8px', background: 'rgba(26,77,92,0.5)',
            color: '#e0e0e0', fontSize: '0.95rem',
          }}
        >
          <option value="">All Actions</option>
          {uniqueActions.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <span style={{ color: '#aaa', fontSize: '0.9rem' }}>
          Page {page} of {totalPages} &nbsp;|&nbsp; {filtered.length} on this page
        </span>
      </div>

      {error && <div className="error">{error}</div>}

      {loading ? (
        <div className="loading">Loading audit logs...</div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: '#aaa', padding: '40px' }}>
          No audit logs found.
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="table" style={{ margin: 0 }}>
            <thead>
              <tr>
                <th>#</th>
                <th>User</th>
                <th>Email</th>
                <th>Action</th>
                <th>Entity</th>
                <th>Entity ID</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(log => (
                <tr key={log.id}>
                  <td style={{ color: '#aaa', fontSize: '0.85rem' }}>{log.id}</td>
                  <td>{log.userName}</td>
                  <td style={{ fontSize: '0.85rem', color: '#aaa' }}>{log.userEmail}</td>
                  <td>
                    <span style={{
                      color: ACTION_COLORS[log.action] || '#e0e0e0',
                      fontWeight: 600, fontSize: '0.8rem',
                      textTransform: 'uppercase', letterSpacing: '0.5px',
                    }}>
                      {log.action}
                    </span>
                  </td>
                  <td>{log.entity}</td>
                  <td style={{ color: '#aaa', fontSize: '0.85rem' }}>{log.entityId || '—'}</td>
                  <td style={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                    {formatDateTime(log.timestamp)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '16px 20px', borderTop: '1px solid rgba(0,217,217,0.1)',
          }}>
            <span style={{ color: '#aaa', fontSize: '0.9rem' }}>
              {total} total entries &nbsp;·&nbsp; Page {page} of {totalPages}
            </span>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                className="btn"
                style={{ padding: '7px 18px', fontSize: '0.9rem', opacity: page <= 1 ? 0.4 : 1, cursor: page <= 1 ? 'not-allowed' : 'pointer' }}
                disabled={page <= 1}
                onClick={() => fetchLogs(page - 1)}
              >
                ← Prev
              </button>
              <button
                className="btn"
                style={{ padding: '7px 18px', fontSize: '0.9rem', opacity: page >= totalPages ? 0.4 : 1, cursor: page >= totalPages ? 'not-allowed' : 'pointer' }}
                disabled={page >= totalPages}
                onClick={() => fetchLogs(page + 1)}
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogs;

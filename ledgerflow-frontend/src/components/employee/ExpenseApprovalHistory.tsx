import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { formatDate } from '../../utils/helpers';
import { ApprovalHistory } from '../../types';

interface Props {
  expenseId: number;
  onClose: () => void;
}

const ExpenseApprovalHistory: React.FC<Props> = ({ expenseId, onClose }) => {
  const [history, setHistory] = useState<ApprovalHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/approvals/expense/${expenseId}/history`);
        setHistory(Array.isArray(res.data) ? res.data : []);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load approval history.');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [expenseId]);

  const getStatusBadge = (status?: string) => {
    const safeStatus = status || 'Unknown';
    const styles: Record<string, React.CSSProperties> = {
      Approved: { background: 'rgba(81, 207, 102, 0.15)', color: '#51cf66', border: '1px solid rgba(81, 207, 102, 0.3)' },
      Rejected: { background: 'rgba(255, 107, 107, 0.15)', color: '#ff6b6b', border: '1px solid rgba(255, 107, 107, 0.3)' },
      Unknown: { background: 'rgba(150, 150, 150, 0.15)', color: '#aaa', border: '1px solid rgba(150, 150, 150, 0.3)' },
    };
    return (
      <span style={{ ...styles[safeStatus] || styles.Unknown, padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
        {safeStatus}
      </span>
    );
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{ width: 700, maxWidth: '90%', padding: 30, maxHeight: '80vh', overflow: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ color: '#00d9d9', margin: 0 }}>Approval History</h3>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: '1.4rem' }}
          >
            ×
          </button>
        </div>

        {loading ? (
          <div className="loading">Loading approval history...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : history.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#aaa', padding: '30px' }}>
            <p>No approval history for this expense yet.</p>
          </div>
        ) : (
          <div>
            {history.map((approval, index) => (
              <div
                key={approval.id}
                style={{
                  padding: '16px',
                  marginBottom: '12px',
                  background: 'rgba(0,217,217,0.05)',
                  border: '1px solid rgba(0,217,217,0.15)',
                  borderRadius: '8px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ color: '#aaa', fontSize: '0.85rem' }}>#{index + 1}</span>
                    {getStatusBadge(approval.status ?? approval.action)}
                  </div>
                  <span style={{ color: '#aaa', fontSize: '0.85rem' }}>{formatDate(approval.createdAt ?? approval.timestamp)}</span>
                </div>
                <div style={{ marginBottom: 6 }}>
                  <span style={{ color: '#aaa', fontSize: '0.85rem' }}>Approver: </span>
                  <span style={{ color: '#fff', fontWeight: 500 }}>{approval.approverName}</span>
                </div>
                {approval.remarks && (
                  <div style={{ marginTop: 10, padding: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px' }}>
                    <span style={{ color: '#aaa', fontSize: '0.8rem', display: 'block', marginBottom: 4 }}>Remarks:</span>
                    <span style={{ color: '#ddd', fontSize: '0.9rem' }}>{approval.remarks}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div style={{ textAlign: 'right', marginTop: 20 }}>
          <button className="btn" style={{ background: '#555', color: '#fff' }} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExpenseApprovalHistory;

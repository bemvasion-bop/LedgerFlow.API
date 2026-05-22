import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { Expense, ApprovalHistory } from '../../types';

const API_BASE = 'http://localhost:5256';

const FinanceApprovalWorkflow: React.FC = () => {
  const [pendingExpenses, setPendingExpenses] = useState<Expense[]>([]);
  const [approvalHistory, setApprovalHistory] = useState<ApprovalHistory[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Modals
  const [approveModal, setApproveModal] = useState<{ id: number; description: string } | null>(null);
  const [rejectModal, setRejectModal] = useState<{ id: number; description: string } | null>(null);
  const [remarks, setRemarks] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState('');
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchPendingExpenses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/approvals/pending', { params: { pageSize: 100 } });
      setPendingExpenses(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load pending expenses.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchApprovalHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/approvals/history', { params: { pageSize: 50 } });
      setApprovalHistory(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load approval history.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'pending') {
      fetchPendingExpenses();
    } else {
      fetchApprovalHistory();
    }
  }, [activeTab, fetchPendingExpenses, fetchApprovalHistory]);

  const handleApprove = async () => {
    if (!approveModal) return;
    setActionLoading(approveModal.id);
    try {
      await api.post(`/approvals/${approveModal.id}/approve`, { remarks: remarks || undefined });
      setPendingExpenses(prev => prev.filter(e => e.id !== approveModal.id));
      setApproveModal(null);
      setRemarks('');
      showToast('Expense approved successfully.', true);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Approve failed.', false);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    if (!rejectReason.trim()) {
      showToast('Rejection reason is required.', false);
      return;
    }
    setActionLoading(rejectModal.id);
    try {
      await api.post(`/approvals/${rejectModal.id}/reject`, { rejectionReason: rejectReason });
      setPendingExpenses(prev => prev.filter(e => e.id !== rejectModal.id));
      setRejectModal(null);
      setRejectReason('');
      showToast('Expense rejected.', true);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Reject failed.', false);
    } finally {
      setActionLoading(null);
    }
  };

  const openReceipt = (fileUrl: string, fileName: string) => {
    const url = fileUrl.startsWith('http') ? fileUrl : `${API_BASE}${fileUrl}`;
    setPreviewUrl(url);
    setPreviewName(fileName);
  };

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
    <div>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999,
          background: toast.ok ? 'linear-gradient(135deg,#1a4d2e,#0f3a20)' : 'linear-gradient(135deg,#4d1a1a,#3a0f0f)',
          border: `1px solid ${toast.ok ? '#51cf66' : '#ff6b6b'}`,
          color: toast.ok ? '#51cf66' : '#ff8a8a',
          padding: '14px 22px', borderRadius: '10px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)', fontWeight: 500,
        }}>
          {toast.ok ? '✓ ' : '✕ '}{toast.msg}
        </div>
      )}

      <div style={{ marginBottom: '25px' }}>
        <h1 style={{ color: '#00d9d9', margin: 0 }}>Approval Workflow</h1>
        <p style={{ color: '#aaa', margin: '5px 0 0', fontSize: '0.9rem' }}>
          Review and manage expense approvals
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid rgba(0,217,217,0.2)' }}>
        <button
          onClick={() => setActiveTab('pending')}
          style={{
            background: 'none',
            border: 'none',
            color: activeTab === 'pending' ? '#00d9d9' : '#aaa',
            padding: '12px 20px',
            cursor: 'pointer',
            fontSize: '0.95rem',
            fontWeight: 600,
            borderBottom: activeTab === 'pending' ? '2px solid #00d9d9' : '2px solid transparent',
            transition: 'all 0.2s',
          }}
        >
          Pending Approvals {pendingExpenses.length > 0 && `(${pendingExpenses.length})`}
        </button>
        <button
          onClick={() => setActiveTab('history')}
          style={{
            background: 'none',
            border: 'none',
            color: activeTab === 'history' ? '#00d9d9' : '#aaa',
            padding: '12px 20px',
            cursor: 'pointer',
            fontSize: '0.95rem',
            fontWeight: 600,
            borderBottom: activeTab === 'history' ? '2px solid #00d9d9' : '2px solid transparent',
            transition: 'all 0.2s',
          }}
        >
          Approval History
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {/* Pending Approvals Tab */}
      {activeTab === 'pending' && (
        <>
          {loading ? (
            <div className="loading">Loading pending expenses...</div>
          ) : pendingExpenses.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', color: '#aaa', padding: '50px' }}>
              <p style={{ fontSize: '1.1rem', marginBottom: '8px' }}>No pending expenses.</p>
              <p style={{ fontSize: '0.9rem' }}>All caught up!</p>
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
                    <th>Submitted</th>
                    <th>Receipt</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingExpenses.map(exp => (
                    <tr key={exp.id}>
                      <td style={{ color: '#aaa', fontSize: '0.85rem' }}>{exp.id}</td>
                      <td>{exp.userName || 'Unknown'}</td>
                      <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {exp.description}
                      </td>
                      <td>{exp.category}</td>
                      <td style={{ fontWeight: 600 }}>{formatCurrency(exp.amount)}</td>
                      <td style={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>{formatDate(exp.submittedAt)}</td>
                      <td>
                        {(exp.receipts?.length ?? 0) > 0 ? (
                          <button
                            className="btn"
                            style={{ padding: '4px 12px', fontSize: '0.78rem', background: 'rgba(0,217,217,0.1)', color: '#00d9d9', border: '1px solid rgba(0,217,217,0.3)' }}
                            onClick={() => openReceipt(exp.receipts![0].fileUrl, exp.receipts![0].fileName)}
                          >
                            View
                          </button>
                        ) : (
                          <span style={{ color: '#555', fontSize: '0.8rem' }}>—</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            className="btn btn-success"
                            style={{ padding: '5px 12px', fontSize: '0.8rem' }}
                            disabled={actionLoading === exp.id}
                            onClick={() => {
                              setRemarks('');
                              setApproveModal({ id: exp.id, description: exp.description });
                            }}
                          >
                            Approve
                          </button>
                          <button
                            className="btn btn-danger"
                            style={{ padding: '5px 12px', fontSize: '0.8rem' }}
                            disabled={actionLoading === exp.id}
                            onClick={() => {
                              setRejectReason('');
                              setRejectModal({ id: exp.id, description: exp.description });
                            }}
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Approval History Tab */}
      {activeTab === 'history' && (
        <>
          {loading ? (
            <div className="loading">Loading approval history...</div>
          ) : approvalHistory.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', color: '#aaa', padding: '50px' }}>
              <p style={{ fontSize: '1.1rem', marginBottom: '8px' }}>No approval history.</p>
            </div>
          ) : (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <table className="table" style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th>Expense ID</th>
                    <th>Description</th>
                    <th>Amount</th>
                    <th>Approver</th>
                    <th>Status</th>
                    <th>Remarks</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {approvalHistory.map(approval => (
                    <tr key={approval.id}>
                      <td style={{ color: '#aaa', fontSize: '0.85rem' }}>#{approval.expenseId}</td>
                      <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {approval.expenseDescription}
                      </td>
                      <td style={{ fontWeight: 600 }}>{formatCurrency(approval.expenseAmount)}</td>
                      <td>{approval.approverName}</td>
                      <td>{getStatusBadge(approval.status ?? approval.action)}</td>
                      <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#aaa', fontSize: '0.85rem' }}>
                        {approval.remarks || '—'}
                      </td>
                      <td style={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>{formatDate(approval.createdAt ?? approval.timestamp)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Approve Modal */}
      {approveModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: 480, padding: 30 }}>
            <h3 style={{ color: '#00d9d9', marginTop: 0 }}>Approve Expense</h3>
            <p style={{ color: '#aaa', marginBottom: 20 }}>
              <strong>Description:</strong> {approveModal.description}
            </p>
            <div className="form-group">
              <label>Remarks (Optional)</label>
              <textarea
                rows={3}
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                placeholder="Add any comments or notes..."
                style={{ resize: 'vertical' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                className="btn"
                style={{ background: '#555', color: '#fff' }}
                onClick={() => setApproveModal(null)}
              >
                Cancel
              </button>
              <button
                className="btn btn-success"
                onClick={handleApprove}
                disabled={actionLoading !== null}
              >
                {actionLoading !== null ? 'Approving...' : 'Confirm Approve'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: 480, padding: 30 }}>
            <h3 style={{ color: '#00d9d9', marginTop: 0 }}>Reject Expense</h3>
            <p style={{ color: '#aaa', marginBottom: 20 }}>
              <strong>Description:</strong> {rejectModal.description}
            </p>
            <div className="form-group">
              <label>Rejection Reason *</label>
              <textarea
                rows={4}
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="Explain why this expense is being rejected..."
                style={{ resize: 'vertical' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                className="btn"
                style={{ background: '#555', color: '#fff' }}
                onClick={() => setRejectModal(null)}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={handleReject}
                disabled={actionLoading !== null}
              >
                {actionLoading !== null ? 'Rejecting...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Preview Modal */}
      {previewUrl && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setPreviewUrl(null)}
        >
          <div className="card" style={{ maxWidth: 680, width: '90%', padding: 20 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h4 style={{ color: '#00d9d9', margin: 0 }}>{previewName}</h4>
              <button
                onClick={() => setPreviewUrl(null)}
                style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: '1.4rem' }}
              >
                ×
              </button>
            </div>
            {!previewUrl.endsWith('.pdf') ? (
              <img src={previewUrl} alt={previewName} style={{ width: '100%', borderRadius: 6, border: '1px solid rgba(0,217,217,0.2)' }} />
            ) : (
              <div style={{ textAlign: 'center', padding: 30 }}>
                <p style={{ color: '#aaa', marginBottom: 16 }}>PDF receipt</p>
                <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                  Open PDF
                </a>
              </div>
            )}
            <div style={{ textAlign: 'center', marginTop: 14 }}>
              <a href={previewUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#00d9d9', fontSize: '0.85rem' }}>
                Open in new tab ↗
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceApprovalWorkflow;

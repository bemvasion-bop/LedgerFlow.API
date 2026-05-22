import React, { useState, useEffect, useCallback } from 'react';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText, 
  RefreshCw 
} from 'lucide-react';
import api from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/helpers';

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
  receiptUrl?: string;
  receipts?: Array<{
    id: number;
    fileName: string;
    fileUrl: string;
  }>;
}

interface ComplianceIssue {
  expenseId: number;
  issue: string;
  severity: 'high' | 'medium' | 'low';
}

const AuditCompliance: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [issues, setIssues] = useState<ComplianceIssue[]>([]);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/expenses', { params: { pageSize: 500 } });
      const expenseData = Array.isArray(res.data) ? res.data : [];
      setExpenses(expenseData);

      // Analyze compliance issues
      const detectedIssues: ComplianceIssue[] = [];

      expenseData.forEach((exp: Expense) => {
        // Missing receipt - check both receiptUrl and receipts array
        const hasReceipt = exp.receiptUrl || (exp.receipts && exp.receipts.length > 0);
        if (!hasReceipt) {
          detectedIssues.push({
            expenseId: exp.id,
            issue: 'Missing receipt',
            severity: 'high'
          });
        }

        // Pending too long (more than 7 days)
        if (exp.status === 'Pending') {
          const daysPending = Math.floor(
            (new Date().getTime() - new Date(exp.submittedAt).getTime()) / (1000 * 60 * 60 * 24)
          );
          if (daysPending > 7) {
            detectedIssues.push({
              expenseId: exp.id,
              issue: `Pending for ${daysPending} days`,
              severity: 'medium'
            });
          }
        }

        // Reimbursed without approval date
        if (exp.status === 'Reimbursed' && !exp.approvedAt) {
          detectedIssues.push({
            expenseId: exp.id,
            issue: 'Reimbursed without approval date',
            severity: 'high'
          });
        }

        // Approved but not reimbursed for more than 14 days
        if (exp.status === 'Approved' && exp.approvedAt) {
          const daysApproved = Math.floor(
            (new Date().getTime() - new Date(exp.approvedAt).getTime()) / (1000 * 60 * 60 * 24)
          );
          if (daysApproved > 14) {
            detectedIssues.push({
              expenseId: exp.id,
              issue: `Approved but not paid for ${daysApproved} days`,
              severity: 'medium'
            });
          }
        }
      });

      setIssues(detectedIssues);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load compliance data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const getComplianceStatus = (expenseId: number): {
    status: 'compliant' | 'warning' | 'critical';
    issues: ComplianceIssue[];
  } => {
    const expenseIssues = issues.filter(i => i.expenseId === expenseId);
    if (expenseIssues.length === 0) return { status: 'compliant', issues: [] };
    
    const hasHigh = expenseIssues.some(i => i.severity === 'high');
    return {
      status: hasHigh ? 'critical' : 'warning',
      issues: expenseIssues
    };
  };

  const summary = {
    total: expenses.length,
    compliant: expenses.filter(e => getComplianceStatus(e.id).status === 'compliant').length,
    warnings: expenses.filter(e => getComplianceStatus(e.id).status === 'warning').length,
    critical: expenses.filter(e => getComplianceStatus(e.id).status === 'critical').length,
    missingReceipts: issues.filter(i => i.issue === 'Missing receipt').length,
    pendingTooLong: issues.filter(i => i.issue.includes('Pending for')).length,
  };

  const ComplianceIcon: React.FC<{ status: 'compliant' | 'warning' | 'critical' }> = ({ status }) => {
    if (status === 'compliant') return <CheckCircle className="w-5 h-5" style={{ color: '#51cf66' }} />;
    if (status === 'warning') return <AlertTriangle className="w-5 h-5" style={{ color: '#ffd700' }} />;
    return <XCircle className="w-5 h-5" style={{ color: '#ff6b6b' }} />;
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <div>
          <h1 style={{ color: '#00d9d9', margin: 0 }}>Compliance Monitoring</h1>
          <p style={{ color: '#aaa', margin: '5px 0 0', fontSize: '0.9rem' }}>
            Policy verification and compliance tracking
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

      {error && <div className="error">{error}</div>}

      {/* Summary Cards */}
      {!loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <CheckCircle style={{ color: '#51cf66', width: '24px', height: '24px' }} />
              <h3 style={{ margin: 0, fontSize: '0.9rem', color: '#aaa' }}>Compliant</h3>
            </div>
            <p style={{ fontSize: '2rem', fontWeight: 700, color: '#51cf66', margin: '8px 0 0' }}>
              {summary.compliant}
            </p>
          </div>

          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <AlertTriangle style={{ color: '#ffd700', width: '24px', height: '24px' }} />
              <h3 style={{ margin: 0, fontSize: '0.9rem', color: '#aaa' }}>Warnings</h3>
            </div>
            <p style={{ fontSize: '2rem', fontWeight: 700, color: '#ffd700', margin: '8px 0 0' }}>
              {summary.warnings}
            </p>
          </div>

          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <XCircle style={{ color: '#ff6b6b', width: '24px', height: '24px' }} />
              <h3 style={{ margin: 0, fontSize: '0.9rem', color: '#aaa' }}>Critical</h3>
            </div>
            <p style={{ fontSize: '2rem', fontWeight: 700, color: '#ff6b6b', margin: '8px 0 0' }}>
              {summary.critical}
            </p>
          </div>

          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <FileText style={{ color: '#00d9d9', width: '24px', height: '24px' }} />
              <h3 style={{ margin: 0, fontSize: '0.9rem', color: '#aaa' }}>Missing Receipts</h3>
            </div>
            <p style={{ fontSize: '2rem', fontWeight: 700, color: '#00d9d9', margin: '8px 0 0' }}>
              {summary.missingReceipts}
            </p>
          </div>

          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <Clock style={{ color: '#ffd700', width: '24px', height: '24px' }} />
              <h3 style={{ margin: 0, fontSize: '0.9rem', color: '#aaa' }}>Pending Too Long</h3>
            </div>
            <p style={{ fontSize: '2rem', fontWeight: 700, color: '#ffd700', margin: '8px 0 0' }}>
              {summary.pendingTooLong}
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading">Loading compliance data...</div>
      ) : expenses.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: '#aaa', padding: '50px' }}>
          No expenses found.
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(0,217,217,0.1)' }}>
            <h3 style={{ margin: 0, color: '#00d9d9' }}>Expense Compliance Status</h3>
          </div>
          <table className="table" style={{ margin: 0 }}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Employee</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Receipt</th>
                <th>Approval</th>
                <th>Payment</th>
                <th>Compliance</th>
                <th>Issues</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map(exp => {
                const compliance = getComplianceStatus(exp.id);
                return (
                  <tr key={exp.id}>
                    <td style={{ color: '#aaa', fontSize: '0.85rem' }}>{exp.id}</td>
                    <td>{exp.userName}</td>
                    <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {exp.description}
                    </td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(exp.amount)}</td>
                    <td>
                      {exp.receiptUrl || (exp.receipts && exp.receipts.length > 0) ? (
                        <span style={{ color: '#51cf66', fontSize: '0.85rem' }}>✓ Attached</span>
                      ) : (
                        <span style={{ color: '#ff6b6b', fontSize: '0.85rem' }}>✗ Missing</span>
                      )}
                    </td>
                    <td>
                      {exp.status === 'Approved' || exp.status === 'Reimbursed' ? (
                        <span style={{ color: '#51cf66', fontSize: '0.85rem' }}>✓ Approved</span>
                      ) : exp.status === 'Rejected' ? (
                        <span style={{ color: '#ff6b6b', fontSize: '0.85rem' }}>✗ Rejected</span>
                      ) : (
                        <span style={{ color: '#ffd700', fontSize: '0.85rem' }}>⏳ Pending</span>
                      )}
                    </td>
                    <td>
                      {exp.status === 'Reimbursed' ? (
                        <span style={{ color: '#51cf66', fontSize: '0.85rem' }}>✓ Paid</span>
                      ) : exp.status === 'Approved' ? (
                        <span style={{ color: '#ffd700', fontSize: '0.85rem' }}>⏳ Pending</span>
                      ) : (
                        <span style={{ color: '#aaa', fontSize: '0.85rem' }}>—</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ComplianceIcon status={compliance.status} />
                        <span style={{
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          color: compliance.status === 'compliant' ? '#51cf66' :
                                 compliance.status === 'warning' ? '#ffd700' : '#ff6b6b'
                        }}>
                          {compliance.status}
                        </span>
                      </div>
                    </td>
                    <td>
                      {compliance.issues.length > 0 ? (
                        <div style={{ fontSize: '0.75rem', color: '#ff6b6b' }}>
                          {compliance.issues.map((issue, idx) => (
                            <div key={idx}>• {issue.issue}</div>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: '#51cf66', fontSize: '0.85rem' }}>No issues</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AuditCompliance;

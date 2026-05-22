import React, { useState, useEffect, useCallback } from 'react';
import { CreditCard, Wallet, Clock, CheckCircle, RefreshCw } from 'lucide-react';
import { KpiCard, StatsGrid } from '../../components/dashboard';
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
}

const FinanceReimbursements: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentModal, setPaymentModal] = useState<Expense | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    paymentMethod: 'Bank Transfer',
    referenceNumber: '',
    remarks: '',
  });
  const [processing, setProcessing] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchReimbursements = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch both Approved (pending payment) and Reimbursed (paid) expenses
      const [approvedRes, reimbursedRes] = await Promise.all([
        api.get('/expenses', { params: { status: 'Approved', pageSize: 200 } }),
        api.get('/expenses', { params: { status: 'Reimbursed', pageSize: 200 } }),
      ]);

      const approved = Array.isArray(approvedRes.data) ? approvedRes.data : [];
      const reimbursed = Array.isArray(reimbursedRes.data) ? reimbursedRes.data : [];

      // Combine and sort by date
      const combined = [...approved, ...reimbursed].sort(
        (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      );

      setExpenses(combined);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load reimbursements.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReimbursements();
  }, [fetchReimbursements]);

  const openPaymentModal = (expense: Expense) => {
    // Auto-generate unique reference number
    const timestamp = Date.now();
    const refNumber = `PAY-${new Date().getFullYear()}-${String(expense.id).padStart(4, '0')}-${timestamp.toString().slice(-4)}`;
    
    setPaymentModal(expense);
    setPaymentForm({
      paymentMethod: 'Bank Transfer',
      referenceNumber: refNumber,
      remarks: '',
    });
  };

  const closePaymentModal = () => {
    setPaymentModal(null);
    setPaymentForm({
      paymentMethod: 'Bank Transfer',
      referenceNumber: '',
      remarks: '',
    });
  };

  const handleMarkAsPaid = async () => {
    if (!paymentModal) return;
    if (!paymentForm.referenceNumber.trim()) {
      showToast('Reference number is required.', false);
      return;
    }

    setProcessing(true);
    try {
      // Call backend to mark as reimbursed
      await api.put(`/expenses/${paymentModal.id}/reimburse`, {
        paymentMethod: paymentForm.paymentMethod,
        referenceNumber: paymentForm.referenceNumber,
        remarks: paymentForm.remarks,
      });

      // Update local state
      setExpenses(prev =>
        prev.map(e =>
          e.id === paymentModal.id
            ? { ...e, status: 'Reimbursed', reimbursedAt: new Date().toISOString() }
            : e
        )
      );

      showToast('Payment processed successfully.', true);
      closePaymentModal();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Payment processing failed.', false);
    } finally {
      setProcessing(false);
    }
  };

  // Calculate summary stats
  const summary = {
    total: expenses.length,
    pending: expenses.filter(e => e.status === 'Approved').length,
    paid: expenses.filter(e => e.status === 'Reimbursed').length,
    pendingAmount: expenses
      .filter(e => e.status === 'Approved')
      .reduce((s, e) => s + e.amount, 0),
    paidAmount: expenses
      .filter(e => e.status === 'Reimbursed')
      .reduce((s, e) => s + e.amount, 0),
  };

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: 20,
            right: 20,
            zIndex: 9999,
            background: toast.ok
              ? 'linear-gradient(135deg,#1a4d2e,#0f3a20)'
              : 'linear-gradient(135deg,#4d1a1a,#3a0f0f)',
            border: `1px solid ${toast.ok ? '#51cf66' : '#ff6b6b'}`,
            color: toast.ok ? '#51cf66' : '#ff8a8a',
            padding: '14px 22px',
            borderRadius: '10px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
            fontWeight: 500,
          }}
        >
          {toast.ok ? '✓ ' : '✕ '}
          {toast.msg}
        </div>
      )}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '25px',
        }}
      >
        <div>
          <h1 style={{ color: '#00d9d9', margin: 0 }}>Reimbursements</h1>
          <p style={{ color: '#aaa', margin: '5px 0 0', fontSize: '0.9rem' }}>
            Process payments for approved expenses
          </p>
        </div>
        <button
          className="group relative p-2.5 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700/50 hover:border-cyan-500/30 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-all duration-200"
          onClick={fetchReimbursements}
          aria-label="Refresh"
        >
          <RefreshCw className="w-5 h-5 text-gray-300 group-hover:text-cyan-400 transition-all duration-500 group-hover:rotate-180" />
        </button>
      </div>

      {/* Summary Cards */}
      {!loading && expenses.length > 0 && (
        <div className="mb-10">
          <StatsGrid>
            <KpiCard
              title="Total Reimbursements"
              value={summary.total}
              subtitle="All records"
              icon={<CreditCard className="w-6 h-6" />}
              color="cyan"
            />
            <KpiCard
              title="Ready for Payment"
              value={summary.pending}
              subtitle="Approved expenses awaiting reimbursement"
              icon={<Clock className="w-6 h-6" />}
              color="yellow"
            />
            <KpiCard
              title="Paid"
              value={summary.paid}
              subtitle={formatCurrency(summary.paidAmount)}
              icon={<CheckCircle className="w-6 h-6" />}
              color="green"
            />
            <KpiCard
              title="Total Received"
              value={formatCurrency(summary.paidAmount)}
              subtitle="Completed payments"
              icon={<Wallet className="w-6 h-6" />}
              color="cyan"
            />
          </StatsGrid>
        </div>
      )}

      {error && <div className="error">{error}</div>}

      {loading ? (
        <div className="loading">Loading reimbursements...</div>
      ) : expenses.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: '#aaa', padding: '50px' }}>
          No reimbursements to process yet.
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="table" style={{ margin: 0 }}>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Description</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Approved Date</th>
                <th>Payment Status</th>
                <th>Paid Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map(exp => (
                <tr key={exp.id}>
                  <td>{exp.userName}</td>
                  <td
                    style={{
                      maxWidth: 180,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {exp.description}
                  </td>
                  <td>{exp.category}</td>
                  <td style={{ fontWeight: 600 }}>{formatCurrency(exp.amount)}</td>
                  <td style={{ fontSize: '0.85rem' }}>
                    {exp.approvedAt ? formatDate(exp.approvedAt) : '—'}
                  </td>
                  <td>
                    {exp.status === 'Approved' ? (
                      <span style={{ color: '#ffd700', fontSize: '0.9rem', fontWeight: 500 }}>
                        Pending Payment
                      </span>
                    ) : (
                      <span style={{ color: '#51cf66', fontSize: '0.9rem', fontWeight: 500 }}>
                        Paid
                      </span>
                    )}
                  </td>
                  <td style={{ fontSize: '0.85rem', color: '#00d9d9' }}>
                    {exp.reimbursedAt ? formatDate(exp.reimbursedAt) : '—'}
                  </td>
                  <td>
                    {exp.status === 'Approved' ? (
                      <button
                        className="btn btn-success"
                        style={{ padding: '5px 12px', fontSize: '0.8rem' }}
                        onClick={() => openPaymentModal(exp)}
                      >
                        Process Payment
                      </button>
                    ) : (
                      <span style={{ color: '#555', fontSize: '0.8rem' }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Payment Processing Modal */}
      {paymentModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={closePaymentModal}
        >
          <div 
            className="card" 
            style={{ 
              width: 540, 
              maxWidth: '90vw',
              padding: '32px 36px',
              background: 'rgba(26,77,92,0.95)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(0,217,217,0.3)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ color: '#00d9d9', marginTop: 0, marginBottom: 8, fontSize: '1.3rem' }}>
              Process Payment
            </h3>
            <p style={{ color: '#aaa', fontSize: '0.85rem', marginBottom: 24 }}>
              Expense #{paymentModal.id}
            </p>

            {/* Expense Summary */}
            <div style={{ 
              marginBottom: 28, 
              padding: '18px 20px', 
              background: 'rgba(0,217,217,0.08)', 
              borderRadius: 8,
              border: '1px solid rgba(0,217,217,0.2)',
            }}>
              <div style={{ marginBottom: 12 }}>
                <p style={{ color: '#aaa', fontSize: '0.75rem', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Employee</p>
                <p style={{ color: '#fff', fontSize: '1.05rem', margin: 0, fontWeight: 500 }}>
                  {paymentModal.userName}
                </p>
              </div>
              <div>
                <p style={{ color: '#aaa', fontSize: '0.75rem', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Amount</p>
                <p style={{ color: '#00d9d9', fontSize: '1.8rem', margin: 0, fontWeight: 700 }}>
                  {formatCurrency(paymentModal.amount)}
                </p>
              </div>
            </div>

            {/* Payment Method */}
            <div className="form-group" style={{ marginBottom: 20 }}>
              <label style={{ marginBottom: 8, display: 'block', color: '#aaa', fontSize: '0.85rem', fontWeight: 500 }}>
                Payment Method *
              </label>
              <select
                value={paymentForm.paymentMethod}
                onChange={e => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                disabled={processing}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 6,
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(0,217,217,0.3)',
                  color: '#fff',
                  fontSize: '0.95rem',
                }}
              >
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Check">Check</option>
                <option value="Cash">Cash</option>
                <option value="PayPal">PayPal</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Reference Number (Readonly) */}
            <div className="form-group" style={{ marginBottom: 20 }}>
              <label style={{ marginBottom: 8, display: 'block', color: '#aaa', fontSize: '0.85rem', fontWeight: 500 }}>
                Reference Number *
              </label>
              <input
                type="text"
                value={paymentForm.referenceNumber}
                readOnly
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 6,
                  background: 'rgba(0,217,217,0.08)',
                  border: '1px solid rgba(0,217,217,0.25)',
                  color: '#00d9d9',
                  cursor: 'default',
                  fontFamily: 'monospace',
                  fontSize: '0.95rem',
                  fontWeight: 500,
                }}
                title="Auto-generated reference number"
              />
              <p style={{ color: '#aaa', fontSize: '0.75rem', marginTop: 6, marginBottom: 0 }}>
                🔒 Auto-generated • Unique payment identifier
              </p>
            </div>

            {/* Remarks */}
            <div className="form-group" style={{ marginBottom: 28 }}>
              <label style={{ marginBottom: 8, display: 'block', color: '#aaa', fontSize: '0.85rem', fontWeight: 500 }}>
                Remarks (Optional)
              </label>
              <textarea
                rows={3}
                value={paymentForm.remarks}
                onChange={e => setPaymentForm({ ...paymentForm, remarks: e.target.value })}
                placeholder="Add any notes about this payment..."
                disabled={processing}
                style={{ 
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 6,
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(0,217,217,0.3)',
                  color: '#fff',
                  fontSize: '0.9rem',
                  resize: 'vertical',
                  minHeight: 80,
                }}
              />
            </div>

            {/* Action Buttons */}
            <div
              style={{
                display: 'flex',
                gap: 12,
                justifyContent: 'flex-end',
                paddingTop: 8,
              }}
            >
              <button
                className="btn"
                style={{ 
                  background: 'rgba(255,255,255,0.1)', 
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.2)',
                  padding: '10px 20px',
                  fontSize: '0.95rem',
                  fontWeight: 500,
                }}
                onClick={closePaymentModal}
                disabled={processing}
              >
                Cancel
              </button>
              <button
                className="btn btn-success"
                onClick={handleMarkAsPaid}
                disabled={processing || !paymentForm.referenceNumber.trim()}
                style={{
                  background: processing ? 'rgba(81,207,102,0.3)' : 'rgba(81,207,102,0.2)',
                  border: '1px solid rgba(81,207,102,0.5)',
                  color: '#51cf66',
                  padding: '10px 24px',
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  opacity: processing || !paymentForm.referenceNumber.trim() ? 0.6 : 1,
                  cursor:
                    processing || !paymentForm.referenceNumber.trim()
                      ? 'not-allowed'
                      : 'pointer',
                }}
              >
                {processing ? 'Processing...' : '✓ Mark as Paid'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceReimbursements;

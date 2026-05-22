import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { formatCurrency } from '../../utils/helpers';

const CATEGORIES = ['Travel', 'Meals', 'Office Supplies', 'Software', 'Utilities', 'Other'];

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];

const EmployeeSubmitExpense: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    amount: '',
    description: '',
    category: '',
  });
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // ── File selection ────────────────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const selected = e.target.files?.[0] ?? null;
    if (!selected) { setFile(null); setFilePreview(null); return; }

    if (!ALLOWED_TYPES.includes(selected.type)) {
      setFileError('Only JPG, PNG, and PDF files are allowed.');
      setFile(null); setFilePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    if (selected.size > MAX_FILE_BYTES) {
      setFileError('File must be 10 MB or smaller.');
      setFile(null); setFilePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setFile(selected);
    if (selected.type.startsWith('image/')) {
      setFilePreview(URL.createObjectURL(selected));
    } else {
      setFilePreview(null); // PDF — no image preview
    }
  };

  const removeFile = () => {
    setFile(null);
    setFilePreview(null);
    setFileError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount <= 0) {
      setFormError('Amount must be greater than ₱0.00.');
      return;
    }
    if (!form.description.trim()) {
      setFormError('Description is required.');
      return;
    }
    if (!form.category) {
      setFormError('Please select a category.');
      return;
    }

    setSubmitting(true);
    try {
      // Step 1: create the expense (JSON)
      const expenseRes = await api.post('/expenses', {
        amount,
        description: form.description.trim(),
        category: form.category,
      });
      const expenseId: number = expenseRes.data.id;

      // Step 2: upload receipt if provided (multipart)
      if (file) {
        const fd = new FormData();
        fd.append('file', file);
        await api.post(`/expenses/${expenseId}/receipts/upload`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      setSuccess(true);
    } catch (err: any) {
      setFormError(
        err.response?.data?.message ||
        err.response?.data ||
        'Failed to submit expense. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ── Success screen ────────────────────────────────────────────────────────
  if (success) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="card" style={{ textAlign: 'center', padding: '50px 40px', maxWidth: '420px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>✓</div>
          <h2 style={{ color: '#51cf66', marginTop: 0 }}>Expense Submitted!</h2>
          <p style={{ color: '#aaa', marginBottom: '28px' }}>
            Your expense has been submitted and is pending approval.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button className="btn btn-primary" onClick={() => navigate('/employee/expenses')}>
              View My Expenses
            </button>
            <button
              className="btn"
              style={{ background: 'rgba(0,217,217,0.1)', color: '#00d9d9', border: '1px solid rgba(0,217,217,0.3)' }}
              onClick={() => {
                setSuccess(false);
                setForm({ amount: '', description: '', category: '' });
                setFile(null); setFilePreview(null);
              }}
            >
              Submit Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' }}>
        <button
          onClick={() => navigate('/employee')}
          style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: '1.2rem', padding: 0 }}
        >
          ←
        </button>
        <div>
          <h1 style={{ color: '#00d9d9', margin: 0 }}>Submit Expense</h1>
          <p style={{ color: '#aaa', margin: '4px 0 0', fontSize: '0.9rem' }}>
            Fill in the details below. Receipt upload is optional but recommended.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'start' }}>

        {/* ── Main form ── */}
        <div className="card">
          {formError && <div className="error" style={{ marginBottom: '20px' }}>{formError}</div>}

          <form onSubmit={handleSubmit}>
            {/* Amount */}
            <div className="form-group">
              <label>Amount (₱) *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                placeholder="0.00"
                required
                disabled={submitting}
              />
              {form.amount && parseFloat(form.amount) > 0 && (
                <small style={{ color: '#00d9d9', marginTop: '4px', display: 'block' }}>
                  {formatCurrency(parseFloat(form.amount))}
                </small>
              )}
            </div>

            {/* Description */}
            <div className="form-group">
              <label>Description *</label>
              <textarea
                rows={3}
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Brief description of the expense (e.g. Team lunch, Flight to Manila)"
                required
                disabled={submitting}
                style={{ resize: 'vertical' }}
              />
            </div>

            {/* Category */}
            <div className="form-group">
              <label>Category *</label>
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                required
                disabled={submitting}
              >
                <option value="">Select a category</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Receipt upload */}
            <div className="form-group">
              <label>Receipt (optional)</label>
              <div
                onClick={() => !submitting && fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${file ? '#00d9d9' : 'rgba(0,217,217,0.3)'}`,
                  borderRadius: '8px',
                  padding: '20px',
                  textAlign: 'center',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  background: file ? 'rgba(0,217,217,0.05)' : 'transparent',
                  transition: 'all 0.2s',
                }}
              >
                {file ? (
                  <div>
                    <p style={{ color: '#00d9d9', margin: '0 0 4px', fontWeight: 600 }}>
                      {file.name}
                    </p>
                    <p style={{ color: '#aaa', margin: 0, fontSize: '0.85rem' }}>
                      {(file.size / 1024).toFixed(1)} KB &nbsp;·&nbsp;
                      <span
                        style={{ color: '#ff6b6b', cursor: 'pointer' }}
                        onClick={e => { e.stopPropagation(); removeFile(); }}
                      >
                        Remove
                      </span>
                    </p>
                  </div>
                ) : (
                  <div>
                    <p style={{ color: '#aaa', margin: '0 0 4px' }}>
                      Click to upload receipt
                    </p>
                    <p style={{ color: '#666', margin: 0, fontSize: '0.8rem' }}>
                      JPG, PNG, PDF · max 10 MB
                    </p>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/jpg,application/pdf"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              {fileError && (
                <small style={{ color: '#ff6b6b', marginTop: '6px', display: 'block' }}>{fileError}</small>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button type="submit" className="btn btn-primary" disabled={submitting} style={{ flex: 1 }}>
                {submitting ? 'Submitting...' : 'Submit Expense'}
              </button>
              <button
                type="button"
                className="btn"
                style={{ background: '#555', color: '#fff' }}
                onClick={() => navigate('/employee')}
                disabled={submitting}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        {/* ── Receipt preview panel ── */}
        <div>
          {filePreview ? (
            <div className="card" style={{ padding: '16px' }}>
              <h4 style={{ color: '#00d9d9', marginTop: 0, marginBottom: '12px' }}>Receipt Preview</h4>
              <img
                src={filePreview}
                alt="Receipt preview"
                style={{ width: '100%', borderRadius: '6px', border: '1px solid rgba(0,217,217,0.2)' }}
              />
            </div>
          ) : (
            <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
              <h4 style={{ color: '#00d9d9', marginTop: 0 }}>Tips</h4>
              <ul style={{ color: '#aaa', fontSize: '0.88rem', textAlign: 'left', paddingLeft: '18px', lineHeight: '1.8' }}>
                <li>Attach a clear photo of your receipt</li>
                <li>Make sure the amount is visible</li>
                <li>PDF receipts are also accepted</li>
                <li>Max file size: 10 MB</li>
                <li>Expenses can only be edited while Pending</li>
              </ul>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default EmployeeSubmitExpense;

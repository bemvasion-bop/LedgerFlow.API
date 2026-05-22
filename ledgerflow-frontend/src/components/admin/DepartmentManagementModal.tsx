import React, { useState, useEffect } from 'react';
import {
  Department,
  CreateDepartmentPayload,
  UpdateDepartmentPayload,
  fetchDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from '../../services/departmentService';
import ConfirmationModal from '../common/ConfirmationModal';
import { useToast } from '../../hooks/useToast';
import { ToastContainer } from '../common/Toast';

interface DepartmentManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDepartmentChange?: () => void;
}

const DepartmentManagementModal: React.FC<DepartmentManagementModalProps> = ({
  isOpen,
  onClose,
  onDepartmentChange,
}) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const { toasts, removeToast, success: showSuccess, error: showError } = useToast();

  const [form, setForm] = useState<CreateDepartmentPayload>({
    name: '',
    description: '',
  });
  const [formError, setFormError] = useState<string | null>(null);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: 'success' | 'warning' | 'danger';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'warning',
  });

  // Load departments
  const loadDepartments = async () => {
    setLoading(true);
    try {
      const data = await fetchDepartments();
      setDepartments(data);
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadDepartments();
    }
  }, [isOpen]);

  // Reset form
  const resetForm = () => {
    setSelectedDepartment(null);
    setForm({ name: '', description: '' });
    setFormError(null);
  };

  // Handle form change
  const handleFormChange = (field: keyof CreateDepartmentPayload, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setFormError(null);
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    if (!form.name.trim()) {
      setFormError('Department name is required');
      return;
    }

    setSubmitLoading(true);
    try {
      if (selectedDepartment) {
        const updated = await updateDepartment(selectedDepartment.id, form);
        setDepartments(prev => prev.map(d => d.id === updated.id ? updated : d));
        showSuccess(`Department "${updated.name}" updated successfully`);
      } else {
        const created = await createDepartment(form);
        setDepartments(prev => [created, ...prev]);
        showSuccess(`Department "${created.name}" created successfully`);
      }
      resetForm();
      onDepartmentChange?.();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to save department';
      setFormError(msg);
      showError(msg);
    } finally {
      setSubmitLoading(false);
    }
  };

  // Edit department
  const handleEdit = (dept: Department) => {
    setSelectedDepartment(dept);
    setForm({ name: dept.name, description: dept.description || '' });
    setFormError(null);
  };

  // Delete department
  const handleDelete = (dept: Department) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Department',
      message: `Are you sure you want to delete "${dept.name}"? Users in this department will need to be reassigned.`,
      type: 'danger',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          await deleteDepartment(dept.id);
          setDepartments(prev => prev.filter(d => d.id !== dept.id));
          showSuccess(`Department "${dept.name}" deleted successfully`);
          onDepartmentChange?.();
        } catch (err: any) {
          showError(err.response?.data?.message || 'Failed to delete department');
        }
      },
    });
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Modal Overlay */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
          animation: 'fadeIn 0.2s ease-out',
        }}
        onClick={onClose}
      >
        {/* Modal Content */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(20, 20, 30, 0.95), rgba(30, 30, 45, 0.95))',
            border: '1px solid rgba(0, 217, 217, 0.3)',
            borderRadius: '16px',
            boxShadow: '0 20px 60px rgba(0, 217, 217, 0.2)',
            maxWidth: '900px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            animation: 'slideUp 0.3s ease-out',
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div
            style={{
              padding: '24px',
              borderBottom: '1px solid rgba(0, 217, 217, 0.2)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <h2 style={{ margin: 0, color: '#00d9d9', fontSize: '1.5rem' }}>
              Department Management
            </h2>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#aaa',
                fontSize: '1.5rem',
                cursor: 'pointer',
                padding: '0',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.color = '#fff';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'none';
                e.currentTarget.style.color = '#aaa';
              }}
            >
              ×
            </button>
          </div>

          {/* Body */}
          <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
            {/* Create/Edit Form */}
            <div className="card" style={{ marginBottom: '24px' }}>
              <h3 style={{ color: '#00d9d9', marginTop: 0 }}>
                {selectedDepartment ? `Edit Department — ${selectedDepartment.name}` : 'Add New Department'}
              </h3>

              {formError && (
                <div className="error" style={{ marginBottom: '16px' }}>{formError}</div>
              )}

              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                  {/* Department Name */}
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Department Name *</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={e => handleFormChange('name', e.target.value)}
                      placeholder="e.g., Finance, HR, Operations"
                      required
                    />
                  </div>

                  {/* Description */}
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Description (Optional)</label>
                    <textarea
                      value={form.description}
                      onChange={e => handleFormChange('description', e.target.value)}
                      placeholder="Brief description of this department"
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '0.95rem',
                        resize: 'vertical',
                      }}
                    />
                  </div>
                </div>

                {/* Buttons */}
                <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitLoading}
                  >
                    {submitLoading
                      ? (selectedDepartment ? 'Saving...' : 'Creating...')
                      : (selectedDepartment ? 'Save Changes' : 'Add Department')}
                  </button>
                  {selectedDepartment && (
                    <button
                      type="button"
                      className="btn"
                      style={{ background: '#555', color: '#fff' }}
                      onClick={resetForm}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Departments List */}
            <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
              <div style={{ padding: '20px 20px 0' }}>
                <h3 style={{ margin: 0, color: '#00d9d9' }}>
                  All Departments ({departments.length})
                </h3>
              </div>

              {loading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#aaa' }}>
                  Loading departments...
                </div>
              ) : departments.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#aaa' }}>
                  No departments yet. Create your first department above.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="table" style={{ margin: 0 }}>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Description</th>
                        <th>Employees</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {departments.map(dept => (
                        <tr key={dept.id}>
                          <td>
                            <strong style={{ color: '#00d9d9' }}>{dept.name}</strong>
                          </td>
                          <td style={{ color: '#aaa', fontSize: '0.9rem' }}>
                            {dept.description || '—'}
                          </td>
                          <td>
                            <span style={{
                              background: 'rgba(0, 217, 217, 0.1)',
                              color: '#00d9d9',
                              padding: '4px 12px',
                              borderRadius: '12px',
                              fontSize: '0.85rem',
                              fontWeight: 600,
                            }}>
                              {dept.employeeCount || 0} users
                            </span>
                          </td>
                          <td>
                            <span style={{
                              color: dept.isActive ? '#51cf66' : '#ff6b6b',
                              fontWeight: 600,
                              fontSize: '0.85rem',
                            }}>
                              {dept.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                className="btn"
                                style={{ padding: '5px 14px', fontSize: '0.8rem' }}
                                onClick={() => handleEdit(dept)}
                              >
                                Edit
                              </button>
                              <button
                                className="btn btn-danger"
                                style={{ padding: '5px 14px', fontSize: '0.8rem' }}
                                onClick={() => handleDelete(dept)}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        type={confirmModal.type}
      />

      {/* Toast Notification */}
      <ToastContainer
        toasts={toasts}
        onClose={removeToast}
      />

      {/* Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
};

export default DepartmentManagementModal;

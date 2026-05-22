import React, { useState, useEffect, useCallback } from 'react';
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
import { Building2, Users, Edit2, Trash2, Plus } from 'lucide-react';

const DepartmentManagement: React.FC = () => {
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
  const [showForm, setShowForm] = useState(false);

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
  const loadDepartments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchDepartments();
      setDepartments(data);
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed to load departments');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadDepartments();
  }, [loadDepartments]);

  // Reset form
  const resetForm = () => {
    setSelectedDepartment(null);
    setForm({ name: '', description: '' });
    setFormError(null);
    setShowForm(false);
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
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
        } catch (err: any) {
          showError(err.response?.data?.message || 'Failed to delete department');
        }
      },
    });
  };

  // Calculate total employees
  const totalEmployees = departments.reduce((sum, dept) => sum + (dept.employeeCount || 0), 0);

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#aaa' }}>
        Loading departments...
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ color: '#00d9d9', margin: 0, fontSize: '2rem', fontWeight: 700 }}>
              Department Management
            </h1>
            <p style={{ color: '#aaa', margin: '8px 0 0', fontSize: '0.95rem' }}>
              Organize your company structure and manage department assignments
            </p>
          </div>
          
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              style={{
                padding: '12px 24px',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #00d9d9, #00a8a8)',
                color: '#0a0a0f',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.95rem',
                transition: 'all 0.2s',
                boxShadow: '0 4px 12px rgba(0, 217, 217, 0.3)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 217, 217, 0.4)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 217, 217, 0.3)';
              }}
            >
              <Plus size={20} />
              Add Department
            </button>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '20px', 
        marginBottom: '32px' 
      }}>
        <div className="card" style={{ 
          background: 'linear-gradient(135deg, rgba(0, 217, 217, 0.1), rgba(0, 150, 150, 0.05))',
          border: '1px solid rgba(0, 217, 217, 0.2)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ 
              padding: '16px', 
              borderRadius: '12px', 
              background: 'rgba(0, 217, 217, 0.1)',
              border: '1px solid rgba(0, 217, 217, 0.2)',
            }}>
              <Building2 size={32} color="#00d9d9" />
            </div>
            <div>
              <p style={{ margin: 0, color: '#aaa', fontSize: '0.85rem' }}>Total Departments</p>
              <h2 style={{ margin: '4px 0 0', color: '#00d9d9', fontSize: '2rem', fontWeight: 700 }}>
                {departments.length}
              </h2>
            </div>
          </div>
        </div>

        <div className="card" style={{ 
          background: 'linear-gradient(135deg, rgba(81, 207, 102, 0.1), rgba(34, 197, 94, 0.05))',
          border: '1px solid rgba(81, 207, 102, 0.2)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ 
              padding: '16px', 
              borderRadius: '12px', 
              background: 'rgba(81, 207, 102, 0.1)',
              border: '1px solid rgba(81, 207, 102, 0.2)',
            }}>
              <Users size={32} color="#51cf66" />
            </div>
            <div>
              <p style={{ margin: 0, color: '#aaa', fontSize: '0.85rem' }}>Total Employees</p>
              <h2 style={{ margin: '4px 0 0', color: '#51cf66', fontSize: '2rem', fontWeight: 700 }}>
                {totalEmployees}
              </h2>
            </div>
          </div>
        </div>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div className="card" style={{ marginBottom: '32px' }}>
          <h3 style={{ color: '#00d9d9', marginTop: 0, fontSize: '1.3rem' }}>
            {selectedDepartment ? `Edit Department — ${selectedDepartment.name}` : 'Add New Department'}
          </h3>

          {formError && (
            <div className="error" style={{ marginBottom: '20px' }}>{formError}</div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
              {/* Department Name */}
              <div className="form-group" style={{ margin: 0 }}>
                <label>Department Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => handleFormChange('name', e.target.value)}
                  placeholder="e.g., Finance, HR, Operations"
                  required
                  autoFocus
                />
              </div>

              {/* Description */}
              <div className="form-group" style={{ margin: 0 }}>
                <label>Description (Optional)</label>
                <textarea
                  value={form.description}
                  onChange={e => handleFormChange('description', e.target.value)}
                  placeholder="Brief description of this department's responsibilities"
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '0.95rem',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                  }}
                />
              </div>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px', flexWrap: 'wrap' }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitLoading}
              >
                {submitLoading
                  ? (selectedDepartment ? 'Saving...' : 'Creating...')
                  : (selectedDepartment ? 'Save Changes' : 'Add Department')}
              </button>
              <button
                type="button"
                className="btn"
                style={{ background: '#555', color: '#fff' }}
                onClick={resetForm}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Departments List */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '24px 24px 0' }}>
          <h3 style={{ margin: 0, color: '#00d9d9', fontSize: '1.3rem' }}>
            All Departments ({departments.length})
          </h3>
        </div>

        {departments.length === 0 ? (
          <div style={{ padding: '60px 24px', textAlign: 'center' }}>
            <Building2 size={64} color="#555" style={{ margin: '0 auto 16px' }} />
            <p style={{ color: '#aaa', fontSize: '1.1rem', margin: 0 }}>
              No departments yet
            </p>
            <p style={{ color: '#666', fontSize: '0.9rem', margin: '8px 0 0' }}>
              Create your first department to start organizing your company
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th>Department</th>
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          padding: '10px',
                          borderRadius: '8px',
                          background: 'rgba(0, 217, 217, 0.1)',
                          border: '1px solid rgba(0, 217, 217, 0.2)',
                        }}>
                          <Building2 size={20} color="#00d9d9" />
                        </div>
                        <strong style={{ color: '#00d9d9', fontSize: '1rem' }}>
                          {dept.name}
                        </strong>
                      </div>
                    </td>
                    <td style={{ color: '#aaa', fontSize: '0.9rem', maxWidth: '300px' }}>
                      {dept.description || '—'}
                    </td>
                    <td>
                      <span style={{
                        background: 'rgba(81, 207, 102, 0.1)',
                        color: '#51cf66',
                        padding: '6px 14px',
                        borderRadius: '12px',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}>
                        <Users size={14} />
                        {dept.employeeCount || 0}
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
                          onClick={() => handleEdit(dept)}
                          style={{
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: '1px solid rgba(0, 217, 217, 0.3)',
                            background: 'rgba(0, 217, 217, 0.1)',
                            color: '#00d9d9',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '0.85rem',
                            fontWeight: 500,
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.background = 'rgba(0, 217, 217, 0.2)';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.background = 'rgba(0, 217, 217, 0.1)';
                          }}
                        >
                          <Edit2 size={14} />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(dept)}
                          style={{
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: '1px solid rgba(255, 107, 107, 0.3)',
                            background: 'rgba(255, 107, 107, 0.1)',
                            color: '#ff6b6b',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '0.85rem',
                            fontWeight: 500,
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.background = 'rgba(255, 107, 107, 0.2)';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.background = 'rgba(255, 107, 107, 0.1)';
                          }}
                        >
                          <Trash2 size={14} />
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
    </div>
  );
};

export default DepartmentManagement;

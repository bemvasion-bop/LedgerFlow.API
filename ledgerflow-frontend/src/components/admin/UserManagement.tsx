import React, { useEffect, useState, useCallback } from 'react';
import {
  AdminUser,
  CreateUserPayload,
  RoleItem,
  fetchAdminUsers,
  fetchRoles,
  createAdminUser,
  updateAdminUser,
  deactivateAdminUser,
  activateAdminUser,
} from '../../services/userService';
import { Department, fetchDepartments } from '../../services/departmentService';
import ConfirmationModal from '../common/ConfirmationModal';
import { ToastContainer } from '../common/Toast';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../hooks/useAuth';
import axios from 'axios';

// ─── Password validation (8 characters minimum) ──────────────────────────────
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

interface PasswordRule {
  label: string;
  test: (pw: string) => boolean;
}

const PASSWORD_RULES: PasswordRule[] = [
  { label: 'At least 8 characters',          test: pw => pw.length >= 8 },
  { label: 'One uppercase letter (A–Z)',     test: pw => /[A-Z]/.test(pw) },
  { label: 'One lowercase letter (a–z)',     test: pw => /[a-z]/.test(pw) },
  { label: 'One number (0–9)',               test: pw => /\d/.test(pw) },
  { label: 'One special character (!@#…)',   test: pw => /[@$!%*?&]/.test(pw) },
];

const validatePassword = (pw: string) => PASSWORD_REGEX.test(pw);

// ─── Plan Features Interface ──────────────────────────────────────────────────
interface PlanFeatures {
  planName: string;
  hasDepartmentAnalytics: boolean;
  hasRoleBasedWorkflows: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────
const UserManagement: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers]               = useState<AdminUser[]>([]);
  const [roles, setRoles]               = useState<RoleItem[]>([]);
  const [departments, setDepartments]   = useState<Department[]>([]);
  const [planFeatures, setPlanFeatures] = useState<PlanFeatures | null>(null);
  const [loading, setLoading]           = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const { toasts, removeToast, success: showSuccess, error: showError } = useToast();
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

  const [form, setForm] = useState<CreateUserPayload>({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    position: '',
    password: '',
    roleId: 2,
    departmentId: undefined,
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword]       = useState(false);
  const [showConfirm, setShowConfirm]         = useState(false);
  const [formError, setFormError]             = useState<string | null>(null);

  // ── Load data ────────────────────────────────────────────────────────────
  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const [userList, roleList, deptList] = await Promise.all([
        fetchAdminUsers(),
        fetchRoles(),
        fetchDepartments().catch(() => []), // Departments may not exist for Starter plan
      ]);
      setUsers(userList);
      setRoles(roleList);
      setDepartments(deptList);
    } catch (err: any) {
      showError(err.response?.data?.message || 'Could not load users.');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  // ── Load plan features ───────────────────────────────────────────────────
  useEffect(() => {
    const fetchPlanFeatures = async () => {
      if (user?.role === 'Admin') {
        try {
          const token = localStorage.getItem('token') || sessionStorage.getItem('token');
          const response = await axios.get('http://localhost:5256/api/plan/current', {
            headers: { Authorization: `Bearer ${token}` }
          });
          console.log('✅ Plan Features Loaded:', response.data);
          setPlanFeatures(response.data);
        } catch (error) {
          console.error('❌ Failed to fetch plan features:', error);
        }
      }
    };

    fetchPlanFeatures();
  }, [user]);

  // ✅ Reload departments when needed
  const handleDepartmentChange = async () => {
    try {
      const deptList = await fetchDepartments();
      setDepartments(deptList);
    } catch (err) {
      console.error('Failed to reload departments:', err);
    }
  };

  // ── Form helpers ─────────────────────────────────────────────────────────
  const resetForm = useCallback(() => {
    setSelectedUser(null);
    setForm({ 
      firstName: '', 
      lastName: '', 
      email: '', 
      phoneNumber: '',
      position: '',
      password: '', 
      roleId: roles[0]?.id || 2,
      departmentId: undefined,
    });
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirm(false);
    setFormError(null);
  }, [roles]);

  const handleFormChange = (field: keyof CreateUserPayload, value: string | number | undefined) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setFormError(null);
  };

  // Check if selected role requires department
  const selectedRole = roles.find(r => r.id === form.roleId);
  const requiresDepartment = selectedRole && 
    (selectedRole.roleName === 'Employee' || 
     selectedRole.roleName === 'Finance' || 
     selectedRole.roleName === 'Audit');
  
  // Check if we have departments available (Business Plan feature)
  const hasDepartments = departments.length > 0;
  
  // Check if this is a Business Plan account
  const isBusinessPlan = planFeatures?.planName?.toLowerCase() === 'business' || 
                         planFeatures?.hasDepartmentAnalytics === true;

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    const isCreate = !selectedUser;
    const passwordProvided = form.password.trim() !== '';

    // Validate password when creating, or when updating and a new password was typed
    if (isCreate || passwordProvided) {
      if (!validatePassword(form.password)) {
        setFormError(
          'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.'
        );
        return;
      }
      if (form.password !== confirmPassword) {
        setFormError('Passwords do not match.');
        return;
      }
    }

    // ✅ Validate department requirement for certain roles
    if (requiresDepartment && !form.departmentId) {
      setFormError(`${selectedRole?.roleName} role requires a department assignment.`);
      return;
    }

    setSubmitLoading(true);
    try {
      if (selectedUser) {
        const payload = {
          firstName: form.firstName,
          lastName:  form.lastName,
          email:     form.email,
          phoneNumber: form.phoneNumber,
          position:  form.position,
          roleId:    form.roleId,
          departmentId: form.departmentId,
          password:  passwordProvided ? form.password : undefined,
        };
        const updated = await updateAdminUser(selectedUser.id, payload);
        setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
        showSuccess(`User "${updated.firstName} ${updated.lastName}" updated successfully.`);
      } else {
        const created = await createAdminUser(form);
        setUsers(prev => [created, ...prev]);
        showSuccess(`User "${created.firstName} ${created.lastName}" created successfully.`);
      }
      resetForm();
    } catch (err: any) {
      // ✅ Enhanced error message extraction
      console.error('User save error:', err);
      
      let errorMessage = 'Failed to save user.';
      
      if (err.response?.data) {
        const data = err.response.data;
        
        // Check for validation errors array
        if (Array.isArray(data.errors) && data.errors.length > 0) {
          errorMessage = data.errors.join(' ');
        }
        // Check for single message
        else if (data.message) {
          errorMessage = data.message;
        }
        // Check for error field
        else if (data.error) {
          errorMessage = data.error;
        }
      }
      // Check for network or other errors
      else if (err.message) {
        errorMessage = err.message;
      }
      
      setFormError(errorMessage);
      showError(errorMessage);
    } finally {
      setSubmitLoading(false);
    }
  };

  // ── Edit ─────────────────────────────────────────────────────────────────
  const handleEdit = (user: AdminUser) => {
    setSelectedUser(user);
    setForm({ 
      firstName: user.firstName, 
      lastName: user.lastName, 
      email: user.email, 
      phoneNumber: user.phoneNumber || '',
      position: user.position || '',
      password: '', 
      roleId: user.roleId,
      departmentId: user.departmentId,
    });
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirm(false);
    setFormError(null);
  };

  // ── Deactivate ───────────────────────────────────────────────────────────
  const handleDeactivate = async (id: number) => {
    setConfirmModal({
      isOpen: true,
      title: 'Deactivate User',
      message: 'Are you sure you want to deactivate this user? They will no longer be able to log in.',
      type: 'warning',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          await deactivateAdminUser(id);
          setUsers(prev => prev.map(u => u.id === id ? { ...u, isActive: false } : u));
          showSuccess('User deactivated.');
        } catch (err: any) {
          showError(err.response?.data?.message || 'Unable to deactivate user.');
        }
      },
    });
  };

  // ── Activate ─────────────────────────────────────────────────────────────
  const handleActivate = async (id: number) => {
    setConfirmModal({
      isOpen: true,
      title: 'Activate User',
      message: 'Are you sure you want to re-activate this user? They will be able to log in again.',
      type: 'success',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          await activateAdminUser(id);
          setUsers(prev => prev.map(u => u.id === id ? { ...u, isActive: true } : u));
          showSuccess('User activated.');
        } catch (err: any) {
          showError(err.response?.data?.message || 'Unable to activate user.');
        }
      },
    });
  };

  // ── Password strength ────────────────────────────────────────────────────
  const passwordStrength = PASSWORD_RULES.filter(r => r.test(form.password)).length;
  const strengthLabel  = ['', 'Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'][passwordStrength];
  const strengthColor  = ['', '#ff6b6b', '#ff8a8a', '#ffd700', '#51cf66', '#00d9d9'][passwordStrength];
  const showPwFeedback = form.password.length > 0;
  const isPasswordRequired = !selectedUser; // required only on create

  if (loading) return <div className="loading">Loading users...</div>;

  return (
    <div>
      {/* ── Page header ── */}
      <div style={{ marginBottom: '25px' }}>
        <h1 style={{ color: '#00d9d9', margin: 0 }}>User Management</h1>
        <p style={{ color: '#aaa', margin: '5px 0 0', fontSize: '0.9rem' }}>
          Create users, assign roles, and manage account access.
        </p>
      </div>

      {/* ── Create / Edit form ── */}
      <div className="card" style={{ marginBottom: '30px' }}>
        <h3 style={{ color: '#00d9d9', marginTop: 0 }}>
          {selectedUser ? `Edit User — ${selectedUser.firstName} ${selectedUser.lastName}` : 'Create New User'}
        </h3>

        {formError && (
          <div className="error" style={{ marginBottom: '20px' }}>{formError}</div>
        )}

        <form onSubmit={handleSubmit}>
          {/* ✅ Mobile responsive grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr',
            gap: '20px' 
          }} className="md:grid-cols-2">

            {/* First Name */}
            <div className="form-group" style={{ margin: 0 }}>
              <label>First Name</label>
              <input
                type="text"
                value={form.firstName}
                onChange={e => handleFormChange('firstName', e.target.value)}
                placeholder="First name"
                required
              />
            </div>

            {/* Last Name */}
            <div className="form-group" style={{ margin: 0 }}>
              <label>Last Name</label>
              <input
                type="text"
                value={form.lastName}
                onChange={e => handleFormChange('lastName', e.target.value)}
                placeholder="Last name"
                required
              />
            </div>

            {/* Email */}
            <div className="form-group" style={{ margin: 0 }}>
              <label>Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => handleFormChange('email', e.target.value)}
                placeholder="user@example.com"
                required
              />
            </div>

            {/* Phone Number */}
            <div className="form-group" style={{ margin: 0 }}>
              <label>Phone Number</label>
              <input
                type="tel"
                value={form.phoneNumber || ''}
                onChange={e => handleFormChange('phoneNumber', e.target.value)}
                placeholder="+63 912 345 6789"
              />
            </div>

            {/* Position */}
            <div className="form-group" style={{ margin: 0, gridColumn: '1 / -1' }}>
              <label>Position / Job Title *</label>
              <input
                type="text"
                value={form.position}
                onChange={e => handleFormChange('position', e.target.value)}
                placeholder="e.g., Office Staff, Accountant, Manager"
                required
              />
            </div>

            {/* Role */}
            <div className="form-group" style={{ margin: 0 }}>
              <label>Role</label>
              <select
                value={form.roleId}
                onChange={e => {
                  const newRoleId = Number(e.target.value);
                  handleFormChange('roleId', newRoleId);
                  // Reset department if new role doesn't require it
                  const newRole = roles.find(r => r.id === newRoleId);
                  if (newRole && newRole.roleName === 'Admin') {
                    handleFormChange('departmentId', undefined);
                  }
                }}
                required
              >
                {roles.map(r => (
                  <option key={r.id} value={r.id}>{r.roleName}</option>
                ))}
              </select>
            </div>

            {/* ✅ Department dropdown (conditional - Business Plan only) */}
            {isBusinessPlan && requiresDepartment && (
              <div className="form-group" style={{ margin: 0 }}>
                <label>
                  Department *
                  {!hasDepartments && (
                    <span style={{ color: '#ff6b6b', fontWeight: 400, fontSize: '0.8rem', marginLeft: '8px' }}>
                      (No departments available - create one first)
                    </span>
                  )}
                </label>
                <select
                  value={form.departmentId || ''}
                  onChange={e => handleFormChange('departmentId', e.target.value ? Number(e.target.value) : undefined)}
                  required
                  disabled={!hasDepartments}
                  style={{
                    opacity: hasDepartments ? 1 : 0.6,
                    cursor: hasDepartments ? 'pointer' : 'not-allowed'
                  }}
                >
                  <option value="">
                    {hasDepartments ? 'Select Department' : 'No departments available'}
                  </option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
                {requiresDepartment && !hasDepartments && (
                  <small style={{ color: '#ff6b6b', fontSize: '0.8rem', display: 'block', marginTop: '4px' }}>
                    {selectedRole?.roleName} role requires a department. Please create departments first in the Departments module.
                  </small>
                )}
              </div>
            )}

            {/* Password */}
            <div className="form-group" style={{ margin: 0 }}>
              <label>
                Password
                {selectedUser && (
                  <span style={{ color: '#aaa', fontWeight: 400, fontSize: '0.8rem', marginLeft: '8px' }}>
                    (leave blank to keep current)
                  </span>
                )}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => handleFormChange('password', e.target.value)}
                  placeholder={selectedUser ? 'New password (optional)' : 'Min. 8 characters'}
                  required={isPasswordRequired}
                  style={{ paddingRight: '44px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#00d9d9', fontSize: '0.85rem', padding: 0,
                  }}
                  tabIndex={-1}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>

              {/* Live strength indicator */}
              {showPwFeedback && (
                <div style={{ marginTop: '8px' }}>
                  {/* Strength bar */}
                  <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
                    {[1,2,3,4,5].map(i => (
                      <div key={i} style={{
                        flex: 1, height: '4px', borderRadius: '2px',
                        background: i <= passwordStrength ? strengthColor : 'rgba(255,255,255,0.1)',
                        transition: 'background 0.2s',
                      }} />
                    ))}
                  </div>
                  <span style={{ fontSize: '0.8rem', color: strengthColor, fontWeight: 600 }}>
                    {strengthLabel}
                  </span>
                  {/* Rule checklist */}
                  <ul style={{ margin: '8px 0 0', padding: 0, listStyle: 'none' }}>
                    {PASSWORD_RULES.map(rule => {
                      const passed = rule.test(form.password);
                      return (
                        <li key={rule.label} style={{
                          fontSize: '0.8rem',
                          color: passed ? '#51cf66' : '#aaa',
                          display: 'flex', alignItems: 'center', gap: '6px',
                          marginBottom: '2px',
                        }}>
                          <span style={{ fontSize: '0.75rem' }}>{passed ? '✓' : '○'}</span>
                          {rule.label}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>

            {/* Confirm Password — only shown when a password is being set */}
            {(isPasswordRequired || form.password.length > 0) && (
              <div className="form-group" style={{ margin: 0 }}>
                <label>Confirm Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => { setConfirmPassword(e.target.value); setFormError(null); }}
                    placeholder="Re-enter password"
                    required={isPasswordRequired}
                    style={{
                      paddingRight: '44px',
                      borderColor: confirmPassword && form.password !== confirmPassword
                        ? '#ff6b6b'
                        : confirmPassword && form.password === confirmPassword
                        ? '#51cf66'
                        : undefined,
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(v => !v)}
                    style={{
                      position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: '#00d9d9', fontSize: '0.85rem', padding: 0,
                    }}
                    tabIndex={-1}
                  >
                    {showConfirm ? 'Hide' : 'Show'}
                  </button>
                </div>
                {confirmPassword && form.password !== confirmPassword && (
                  <small style={{ color: '#ff6b6b', fontSize: '0.8rem' }}>Passwords do not match.</small>
                )}
                {confirmPassword && form.password === confirmPassword && (
                  <small style={{ color: '#51cf66', fontSize: '0.8rem' }}>✓ Passwords match.</small>
                )}
              </div>
            )}

          </div>{/* end grid */}

          {/* ✅ Mobile responsive buttons */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            gap: '12px', 
            marginTop: '24px' 
          }} className="sm:flex-row">
            <button
              type="submit"
              className="btn btn-primary sm:w-auto"
              disabled={submitLoading}
              style={{ width: '100%' }}
            >
              {submitLoading
                ? (selectedUser ? 'Saving...' : 'Creating...')
                : (selectedUser ? 'Save Changes' : 'Create User')}
            </button>
            {selectedUser && (
              <button
                type="button"
                className="btn sm:w-auto"
                style={{ background: '#555', color: '#fff', width: '100%' }}
                onClick={resetForm}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* ── Users table ── */}
      <div className="card" style={{ padding: '0', overflow: 'hidden', overflowX: 'auto' }}>
        <div style={{ padding: '20px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, color: '#00d9d9' }}>All Users ({users.length})</h3>
        </div>
        <table className="table" style={{ margin: 0, minWidth: '800px' }}>
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Position</th>
              <th>Role</th>
              {isBusinessPlan && <th>Department</th>}
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={isBusinessPlan ? 9 : 8} style={{ textAlign: 'center', color: '#aaa', padding: '30px' }}>
                  No users found.
                </td>
              </tr>
            ) : users.map(user => (
              <tr key={user.id} style={{ opacity: user.isActive ? 1 : 0.5 }}>
                <td style={{ color: '#aaa', fontSize: '0.85rem' }}>{user.id}</td>
                <td>{user.firstName} {user.lastName}</td>
                <td style={{ fontSize: '0.9rem', color: '#aaa' }}>{user.email}</td>
                <td style={{ fontSize: '0.9rem', color: '#aaa' }}>{user.phoneNumber || '—'}</td>
                <td style={{ fontSize: '0.9rem', color: '#ccc' }}>{user.position || '—'}</td>
                <td>
                  <span style={{
                    background: 'rgba(0,217,217,0.1)',
                    color: '#00d9d9',
                    padding: '3px 10px',
                    borderRadius: '12px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                  }}>
                    {user.roleName}
                  </span>
                </td>
                {isBusinessPlan && (
                  <td style={{ color: '#aaa', fontSize: '0.9rem' }}>
                    {user.departmentName || 'N/A'}
                  </td>
                )}
                <td>
                  <span style={{
                    color: user.isActive ? '#51cf66' : '#ff6b6b',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                  }}>
                    {user.isActive ? 'Active' : 'Deactivated'}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      className="btn"
                      style={{ padding: '5px 14px', fontSize: '0.8rem' }}
                      onClick={() => handleEdit(user)}
                    >
                      Edit
                    </button>
                    {user.isActive ? (
                      <button
                        className="btn btn-danger"
                        style={{ padding: '5px 14px', fontSize: '0.8rem' }}
                        onClick={() => handleDeactivate(user.id)}
                      >
                        Deactivate
                      </button>
                    ) : (
                      <button
                        className="btn btn-success"
                        style={{ padding: '5px 14px', fontSize: '0.8rem' }}
                        onClick={() => handleActivate(user.id)}
                      >
                        Activate
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.type === 'success' ? 'Activate' : confirmModal.type === 'danger' ? 'Delete' : 'Confirm'}
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

export default UserManagement;

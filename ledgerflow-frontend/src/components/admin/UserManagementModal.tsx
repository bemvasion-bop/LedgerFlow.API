import React, { useState, useEffect } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import { CreateUserPayload, RoleItem } from '../../services/userService';
import axios from 'axios';

interface Department {
  id: number;
  name: string;
}

interface PlanFeatures {
  planName: string;
  hasDepartmentAnalytics: boolean;
}

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateUserPayload & { confirmPassword: string }) => Promise<void>;
  roles: RoleItem[];
  editUser?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    position?: string;
    roleId: number;
    departmentId?: number;
  } | null;
}

const PASSWORD_RULES = [
  { label: 'At least 12 characters', test: (pw: string) => pw.length >= 12 },
  { label: 'One uppercase letter (A–Z)', test: (pw: string) => /[A-Z]/.test(pw) },
  { label: 'One lowercase letter (a–z)', test: (pw: string) => /[a-z]/.test(pw) },
  { label: 'One number (0–9)', test: (pw: string) => /\d/.test(pw) },
  { label: 'One special character (!@#…)', test: (pw: string) => /[\W_]/.test(pw) },
];

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  roles,
  editUser
}) => {
  const [formData, setFormData] = useState<CreateUserPayload>({
    firstName: editUser?.firstName || '',
    lastName: editUser?.lastName || '',
    email: editUser?.email || '',
    phoneNumber: editUser?.phoneNumber || '',
    position: editUser?.position || '',
    password: '',
    roleId: editUser?.roleId || (roles[0]?.id || 2),
    departmentId: editUser?.departmentId || undefined,
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // ✅ Business Plan detection
  const [planFeatures, setPlanFeatures] = useState<PlanFeatures | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);

  // ✅ Load plan features
  useEffect(() => {
    const fetchPlanFeatures = async () => {
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const response = await axios.get('http://localhost:5256/api/plan/current', {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Modal Plan Features:', response.data);
        setPlanFeatures(response.data);
      } catch (error) {
        console.error('❌ Failed to fetch plan features:', error);
      }
    };

    if (isOpen) {
      fetchPlanFeatures();
    }
  }, [isOpen]);

  // ✅ Load departments
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const response = await axios.get('http://localhost:5256/api/department', {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Modal Departments:', response.data);
        setDepartments(response.data || []);
      } catch (error) {
        console.error('❌ Failed to fetch departments:', error);
        setDepartments([]);
      }
    };

    if (isOpen && planFeatures?.hasDepartmentAnalytics) {
      fetchDepartments();
    }
  }, [isOpen, planFeatures]);

  // ✅ Business Plan detection
  const isBusinessPlan = planFeatures?.planName?.toLowerCase() === 'business' || 
                         planFeatures?.hasDepartmentAnalytics === true;

  // ✅ Check if selected role requires department
  const selectedRole = roles.find(r => r.id === formData.roleId);
  const requiresDepartment = selectedRole && 
    (selectedRole.roleName === 'Employee' || 
     selectedRole.roleName === 'Finance' || 
     selectedRole.roleName === 'Audit');

  React.useEffect(() => {
    if (editUser) {
      setFormData({
        firstName: editUser.firstName,
        lastName: editUser.lastName,
        email: editUser.email,
        phoneNumber: editUser.phoneNumber || '',
        position: editUser.position || '',
        password: '',
        roleId: editUser.roleId,
        departmentId: editUser.departmentId || undefined,
      });
      setConfirmPassword('');
    } else {
      setFormData({
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
    }
    setError(null);
    setShowPassword(false);
    setShowConfirm(false);
  }, [editUser, roles, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const isCreate = !editUser;
    const passwordProvided = formData.password.trim() !== '';

    // ✅ Validate department requirement
    if (isBusinessPlan && requiresDepartment && !formData.departmentId) {
      setError(`${selectedRole?.roleName} role requires a department assignment`);
      return;
    }

    // Validate password when creating or when updating with new password
    if (isCreate || passwordProvided) {
      const passwordValid = PASSWORD_RULES.every(rule => rule.test(formData.password));
      if (!passwordValid) {
        setError('Password must meet all requirements');
        return;
      }
      if (formData.password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
    }

    setLoading(true);
    try {
      await onSubmit({ ...formData, confirmPassword });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save user');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const passwordStrength = PASSWORD_RULES.filter(r => r.test(formData.password)).length;
  const strengthColors = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-cyan-500'];
  const strengthLabels = ['', 'Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xl animate-fadeIn">
      <div className="bg-gray-900/95 backdrop-blur-sm border border-cyan-500/20 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700/50">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
            {editUser ? 'Edit User' : 'Create New User'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* First Name */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                First Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
                placeholder="John"
                required
              />
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Last Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
                placeholder="Doe"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Email <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
                placeholder="john.doe@company.com"
                required
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phoneNumber || ''}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
                placeholder="+63 912 345 6789"
              />
            </div>

            {/* Position */}
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Position / Job Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
                placeholder="e.g., Office Staff, Accountant, Manager"
                required
              />
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Role <span className="text-red-400">*</span>
              </label>
              <select
                value={formData.roleId}
                onChange={(e) => {
                  const newRoleId = Number(e.target.value);
                  setFormData({ 
                    ...formData, 
                    roleId: newRoleId,
                    // Clear department if switching to Admin
                    departmentId: roles.find(r => r.id === newRoleId)?.roleName === 'Admin' ? undefined : formData.departmentId
                  });
                }}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
                required
              >
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.roleName}
                  </option>
                ))}
              </select>
            </div>

            {/* ✅ Department Dropdown (Business Plan Only) */}
            {isBusinessPlan && requiresDepartment && (
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Department <span className="text-red-400">*</span>
                  {departments.length === 0 && (
                    <span className="text-xs text-red-400 ml-2">
                      (No departments available)
                    </span>
                  )}
                </label>
                <select
                  value={formData.departmentId || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    departmentId: e.target.value ? Number(e.target.value) : undefined 
                  })}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white focus:outline-none focus:border-cyan-500/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  required
                  disabled={departments.length === 0}
                >
                  <option value="">
                    {departments.length > 0 ? 'Select Department' : 'No departments available'}
                  </option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
                {departments.length === 0 && (
                  <p className="text-xs text-red-400 mt-2">
                    {selectedRole?.roleName} role requires a department. Please create departments first in the Departments module.
                  </p>
                )}
              </div>
            )}

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Password
                {editUser && (
                  <span className="text-xs text-gray-500 ml-2">(leave blank to keep current)</span>
                )}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-3 pr-12 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
                  placeholder={editUser ? 'New password (optional)' : 'Min. 12 characters'}
                  required={!editUser}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-cyan-400 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Password Strength */}
              {formData.password && (
                <div className="mt-3 space-y-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          i <= passwordStrength ? strengthColors[passwordStrength] : 'bg-gray-700'
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs font-medium ${
                    passwordStrength >= 4 ? 'text-green-400' : 'text-yellow-400'
                  }`}>
                    {strengthLabels[passwordStrength]}
                  </p>
                  <ul className="space-y-1">
                    {PASSWORD_RULES.map((rule) => {
                      const passed = rule.test(formData.password);
                      return (
                        <li
                          key={rule.label}
                          className={`text-xs flex items-center gap-2 ${
                            passed ? 'text-green-400' : 'text-gray-500'
                          }`}
                        >
                          <span>{passed ? '✓' : '○'}</span>
                          {rule.label}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            {(!editUser || formData.password) && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full px-4 py-3 pr-12 bg-gray-800/50 border rounded-lg text-white placeholder-gray-500 focus:outline-none transition-colors ${
                      confirmPassword && formData.password !== confirmPassword
                        ? 'border-red-500/50 focus:border-red-500/50'
                        : confirmPassword && formData.password === confirmPassword
                        ? 'border-green-500/50 focus:border-green-500/50'
                        : 'border-gray-700/50 focus:border-cyan-500/50'
                    }`}
                    placeholder="Re-enter password"
                    required={!editUser || !!formData.password}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-cyan-400 transition-colors"
                  >
                    {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {confirmPassword && formData.password !== confirmPassword && (
                  <p className="text-xs text-red-400 mt-2">Passwords do not match</p>
                )}
                {confirmPassword && formData.password === confirmPassword && (
                  <p className="text-xs text-green-400 mt-2">✓ Passwords match</p>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors"
            >
              {loading ? 'Saving...' : editUser ? 'Save Changes' : 'Create User'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

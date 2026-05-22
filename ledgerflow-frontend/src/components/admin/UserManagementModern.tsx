import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Edit2, UserX, UserCheck, AlertCircle } from 'lucide-react';
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
import { UserManagementModal } from './UserManagementModal';
import { PageContainer } from '../layout';
import { PageHeader, Card } from '../ui';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

let toastCounter = 0;

export const UserManagementModern: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Toast helper
  const addToast = useCallback((message: string, type: 'success' | 'error') => {
    const id = ++toastCounter;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  // Load data
  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const [userList, roleList] = await Promise.all([fetchAdminUsers(), fetchRoles()]);
      setUsers(userList);
      setFilteredUsers(userList);
      setRoles(roleList);
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Could not load users.', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Get plan features to determine if we should show department column
  const [planFeatures, setPlanFeatures] = useState<{ planName: string; hasDepartmentAnalytics: boolean } | null>(null);

  useEffect(() => {
    const fetchPlanFeatures = async () => {
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const response = await fetch('http://localhost:5256/api/plan/current', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        setPlanFeatures(data);
      } catch (error) {
        console.error('Failed to fetch plan features:', error);
      }
    };
    fetchPlanFeatures();
  }, []);

  const isBusinessPlan = planFeatures?.planName?.toLowerCase() === 'business' || 
                         planFeatures?.hasDepartmentAnalytics === true;

  // Filter users
  useEffect(() => {
    let filtered = users;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.firstName.toLowerCase().includes(query) ||
          u.lastName.toLowerCase().includes(query) ||
          u.email.toLowerCase().includes(query)
      );
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter((u) => u.roleName === roleFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((u) =>
        statusFilter === 'active' ? u.isActive : !u.isActive
      );
    }

    setFilteredUsers(filtered);
  }, [users, searchQuery, roleFilter, statusFilter]);

  // Handle create/edit user
  const handleSubmitUser = async (data: CreateUserPayload & { confirmPassword: string }) => {
    try {
      if (editingUser) {
        const payload = {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          roleId: data.roleId,
          password: data.password || undefined,
        };
        const updated = await updateAdminUser(editingUser.id, payload);
        setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
        addToast(`User "${updated.firstName} ${updated.lastName}" updated successfully.`, 'success');
      } else {
        const created = await createAdminUser(data);
        setUsers((prev) => [created, ...prev]);
        addToast(`User "${created.firstName} ${created.lastName}" created successfully.`, 'success');
      }
      setIsModalOpen(false);
      setEditingUser(null);
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        (Array.isArray(err.response?.data?.errors) ? err.response.data.errors.join(' ') : null) ||
        'Failed to save user.';
      throw new Error(msg);
    }
  };

  // Handle edit
  const handleEdit = (user: AdminUser) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  // Handle deactivate
  const handleDeactivate = async (id: number) => {
    if (!window.confirm('Deactivate this user? They will no longer be able to log in.')) return;
    try {
      await deactivateAdminUser(id);
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, isActive: false } : u)));
      addToast('User deactivated.', 'success');
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Unable to deactivate user.', 'error');
    }
  };

  // Handle activate
  const handleActivate = async (id: number) => {
    if (!window.confirm('Re-activate this user? They will be able to log in again.')) return;
    try {
      await activateAdminUser(id);
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, isActive: true } : u)));
      addToast('User activated.', 'success');
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Unable to activate user.', 'error');
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="space-y-8 animate-pulse">
          <div className="h-8 bg-gray-700 rounded w-1/4"></div>
          <div className="h-64 bg-gray-800/50 rounded-xl"></div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`px-6 py-4 rounded-lg shadow-lg backdrop-blur-sm border animate-slideIn ${
              t.type === 'success'
                ? 'bg-green-500/10 border-green-500/20 text-green-400'
                : 'bg-red-500/10 border-red-500/20 text-red-400'
            }`}
          >
            <div className="flex items-center gap-2">
              {t.type === 'success' ? '✓' : '✕'} {t.message}
            </div>
          </div>
        ))}
      </div>

      {/* Header */}
      <PageHeader
        title="User Management"
        subtitle="Create users, assign roles, and manage account access"
        action={
          <button
            onClick={() => {
              setEditingUser(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            Create User
          </button>
        }
      />

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
            />
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
          >
            <option value="all">All Roles</option>
            {roles.map((role) => (
              <option key={role.id} value={role.roleName}>
                {role.roleName}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </Card>

      {/* Users Table */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">
            All Users ({filteredUsers.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">#</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Name</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Email</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Phone</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Position</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Role</th>
                {isBusinessPlan && (
                  <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Department</th>
                )}
                <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Status</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={isBusinessPlan ? 9 : 8} className="py-12 text-center">
                    <AlertCircle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">No users found</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className={`border-b border-gray-700/50 hover:bg-gray-800/30 transition-colors ${
                      !user.isActive ? 'opacity-50' : ''
                    }`}
                  >
                    <td className="py-4 px-4 text-gray-500 text-sm">{user.id}</td>
                    <td className="py-4 px-4 text-white font-medium">
                      {user.firstName} {user.lastName}
                    </td>
                    <td className="py-4 px-4 text-gray-400 text-sm">{user.email}</td>
                    <td className="py-4 px-4 text-gray-400 text-sm">{user.phoneNumber || '—'}</td>
                    <td className="py-4 px-4 text-gray-300 text-sm">{user.position || '—'}</td>
                    <td className="py-4 px-4 text-white text-sm">{user.roleName}</td>
                    {isBusinessPlan && (
                      <td className="py-4 px-4 text-gray-300 text-sm">{user.departmentName || 'N/A'}</td>
                    )}
                    <td className="py-4 px-4 text-white text-sm">{user.isActive ? 'Active' : 'Inactive'}</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-cyan-400 hover:text-cyan-300"
                          title="Edit user"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {user.isActive ? (
                          <button
                            onClick={() => handleDeactivate(user.id)}
                            className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-red-400 hover:text-red-300"
                            title="Deactivate user"
                          >
                            <UserX className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleActivate(user.id)}
                            className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-green-400 hover:text-green-300"
                            title="Activate user"
                          >
                            <UserCheck className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal */}
      <UserManagementModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingUser(null);
        }}
        onSubmit={handleSubmitUser}
        roles={roles}
        editUser={editingUser}
      />
    </PageContainer>
  );
};

export default UserManagementModern;

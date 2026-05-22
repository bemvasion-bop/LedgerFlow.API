import React, { useEffect, useState } from 'react';
import { 
  Search, 
  Plus,
  Edit,
  Trash2,
  Ban,
  CheckCircle,
  Key,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { superAdminService } from '../../services/superAdmin.service';
import { useToast } from '../../components/ui/ToastContainer';
import { ConfirmationModal } from '../../components/ui';
import type { PlatformUser, Company } from '../../types';

export const Users: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const toast = useToast();
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<PlatformUser[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<PlatformUser | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    roleId: 2, // Default to Admin
    companyId: 0,
    isActive: true
  });
  const [newPassword, setNewPassword] = useState('');

  const roles = [
    { id: 1, name: 'SuperAdmin' },
    { id: 2, name: 'Admin' },
    { id: 3, name: 'Finance Manager' },
    { id: 4, name: 'Auditor' },
    { id: 5, name: 'Employee' }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchTerm, companyFilter, roleFilter, statusFilter, users]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [usersData, companiesData] = await Promise.all([
        superAdminService.getAllPlatformUsers(),
        superAdminService.getAllCompanies()
      ]);
      setUsers(usersData);
      setCompanies(companiesData);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      setError(error.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(u => 
        u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (companyFilter !== 'all') {
      filtered = filtered.filter(u => u.companyId === parseInt(companyFilter));
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(u => u.roleName.toLowerCase() === roleFilter.toLowerCase());
    }

    if (statusFilter !== 'all') {
      if (statusFilter === 'active') {
        filtered = filtered.filter(u => u.isActive);
      } else if (statusFilter === 'inactive') {
        filtered = filtered.filter(u => !u.isActive);
      }
    }

    setFilteredUsers(filtered);
  };

  const handleLogout = async () => {
    await logout();
    sessionStorage.clear();
    navigate('/login', { replace: true });
    window.location.href = '/login';
  };

  const handleAddUser = async () => {
    try {
      setActionLoading(true);
      const response = await superAdminService.createPlatformUser(formData);
      // Check if response has success property
      if (response.success !== false) {
        const message = response.message || 'User created successfully';
        toast.success('User Created', message);
        setShowAddModal(false);
        resetForm();
        await fetchData();
      } else {
        toast.error('Failed to Create User', response.message || 'An error occurred');
      }
    } catch (error: any) {
      console.error('Error creating user:', error);
      const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
      toast.error('Failed to Create User', errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;
    
    try {
      setActionLoading(true);
      const updateData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        roleId: formData.roleId,
        companyId: formData.companyId,
        isActive: formData.isActive
      };
      const response = await superAdminService.updatePlatformUser(selectedUser.id, updateData);
      // Check if response has success property
      if (response.success !== false) {
        const message = response.message || 'User updated successfully';
        toast.success('User Updated', message);
        setShowEditModal(false);
        setSelectedUser(null);
        resetForm();
        await fetchData();
      } else {
        toast.error('Failed to Update User', response.message || 'An error occurred');
      }
    } catch (error: any) {
      console.error('Error updating user:', error);
      const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
      toast.error('Failed to Update User', errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    try {
      setActionLoading(true);
      const response = await superAdminService.deletePlatformUser(selectedUser.id);
      // Check if response has success property
      if (response.success !== false) {
        const message = response.message || 'User deleted successfully';
        toast.success('User Deleted', message);
        setShowDeleteModal(false);
        setSelectedUser(null);
        await fetchData();
      } else {
        toast.error('Failed to Delete User', response.message || 'An error occurred');
      }
    } catch (error: any) {
      console.error('Error deleting user:', error);
      const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
      toast.error('Failed to Delete User', errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  const handleActivate = async (userId: number, name: string) => {
    try {
      setActionLoading(true);
      const response = await superAdminService.activateUser(userId);
      // Check if response has success property
      if (response.success !== false) {
        const message = response.message || `${name} has been activated successfully`;
        toast.success('User Activated', message);
        await fetchData();
      } else {
        toast.error('Failed to Activate User', response.message || 'An error occurred');
      }
    } catch (error: any) {
      console.error('Error activating user:', error);
      const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
      toast.error('Failed to Activate User', errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspend = async () => {
    if (!selectedUser) return;
    
    try {
      setActionLoading(true);
      const response = await superAdminService.suspendUser(selectedUser.id);
      // Check if response has success property
      if (response.success !== false) {
        const message = response.message || `${selectedUser.fullName} has been suspended successfully`;
        toast.success('User Suspended', message);
        setShowSuspendModal(false);
        setSelectedUser(null);
        await fetchData();
      } else {
        toast.error('Failed to Suspend User', response.message || 'An error occurred');
      }
    } catch (error: any) {
      console.error('Error suspending user:', error);
      const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
      toast.error('Failed to Suspend User', errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser) return;
    
    try {
      setActionLoading(true);
      const response = await superAdminService.resetUserPassword({
        userId: selectedUser.id,
        newPassword: newPassword
      });
      // Check if response has success property
      if (response.success !== false) {
        const message = response.message || `Password reset successfully for ${selectedUser.fullName}`;
        toast.success('Password Reset', message);
        setShowResetPasswordModal(false);
        setSelectedUser(null);
        setNewPassword('');
      } else {
        toast.error('Failed to Reset Password', response.message || 'An error occurred');
      }
    } catch (error: any) {
      console.error('Error resetting password:', error);
      const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
      toast.error('Failed to Reset Password', errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  const openEditModal = (user: PlatformUser) => {
    setSelectedUser(user);
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: '',
      roleId: user.roleId,
      companyId: user.companyId,
      isActive: user.isActive
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (user: PlatformUser) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const openSuspendModal = (user: PlatformUser) => {
    setSelectedUser(user);
    setShowSuspendModal(true);
  };

  const openResetPasswordModal = (user: PlatformUser) => {
    setSelectedUser(user);
    setNewPassword('');
    setShowResetPasswordModal(true);
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      roleId: 2,
      companyId: 0,
      isActive: true
    });
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-700 rounded w-1/4"></div>
        <div className="h-20 bg-gray-800/50 rounded-xl"></div>
        <div className="h-96 bg-gray-800/50 rounded-xl"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white">Platform Users</h1>
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <p className="font-semibold text-red-400 mb-2">Error Loading Users</p>
              <p className="text-sm text-red-300 mb-4">{error}</p>
              <button 
                onClick={fetchData}
                className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors font-medium"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Platform Users</h1>
          <p className="text-gray-400">Manage all users across all companies</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors font-medium"
          >
            <Plus className="w-4 h-4" />
            Add User
          </button>
          <button
            onClick={fetchData}
            disabled={loading}
            className="group relative p-2.5 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700/50 hover:border-cyan-500/30 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Refresh"
          >
            <RefreshCw className={`w-5 h-5 text-gray-300 group-hover:text-cyan-400 transition-all duration-500 ${loading ? 'animate-spin' : 'group-hover:rotate-180'}`} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
          <select
            value={companyFilter}
            onChange={(e) => setCompanyFilter(e.target.value)}
            className="px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Companies</option>
            {companies.map(company => (
              <option key={company.id} value={company.id}>{company.name}</option>
            ))}
          </select>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Roles</option>
            {roles.map(role => (
              <option key={role.id} value={role.name}>{role.name}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-4 px-6 text-gray-400 font-medium">User</th>
                <th className="text-left py-4 px-6 text-gray-400 font-medium">Email</th>
                <th className="text-left py-4 px-6 text-gray-400 font-medium">Company</th>
                <th className="text-left py-4 px-6 text-gray-400 font-medium">Role</th>
                <th className="text-left py-4 px-6 text-gray-400 font-medium">Status</th>
                <th className="text-left py-4 px-6 text-gray-400 font-medium">Joined</th>
                <th className="text-left py-4 px-6 text-gray-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                    <td className="py-4 px-6 text-white font-medium">{user.fullName}</td>
                    <td className="py-4 px-6 text-gray-400">{user.email}</td>
                    <td className="py-4 px-6 text-gray-300">{user.companyName}</td>
                    <td className="py-4 px-6 text-white">
                      {user.roleName}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`${
                        user.isActive ? 'text-green-400' : 'text-gray-400'
                      }`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-gray-400">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(user)}
                          disabled={actionLoading}
                          className="p-2 hover:bg-cyan-500/10 text-cyan-400 rounded-lg transition-colors disabled:opacity-50"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openResetPasswordModal(user)}
                          disabled={actionLoading}
                          className="p-2 hover:bg-yellow-500/10 text-yellow-400 rounded-lg transition-colors disabled:opacity-50"
                          title="Reset Password"
                        >
                          <Key className="w-4 h-4" />
                        </button>
                        {user.isActive ? (
                          <button
                            onClick={() => openSuspendModal(user)}
                            disabled={actionLoading}
                            className="p-2 hover:bg-red-500/10 text-red-400 rounded-lg transition-colors disabled:opacity-50"
                            title="Suspend"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleActivate(user.id, user.fullName)}
                            disabled={actionLoading}
                            className="p-2 hover:bg-green-500/10 text-green-400 rounded-lg transition-colors disabled:opacity-50"
                            title="Activate"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => openDeleteModal(user)}
                          disabled={actionLoading}
                          className="p-2 hover:bg-red-500/10 text-red-400 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-6">Add New User</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 mb-2">First Name *</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                    placeholder="Enter first name"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-2">Last Name *</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                    placeholder="Enter last name"
                  />
                </div>
              </div>
              <div>
                <label className="block text-gray-400 mb-2">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-2">Password *</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  placeholder="Enter password (min 8 characters)"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 mb-2">Company *</label>
                  <select
                    value={formData.companyId}
                    onChange={(e) => setFormData({ ...formData, companyId: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value={0}>Select Company</option>
                    {companies.map(company => (
                      <option key={company.id} value={company.id}>{company.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 mb-2">Role *</label>
                  <select
                    value={formData.roleId}
                    onChange={(e) => setFormData({ ...formData, roleId: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  >
                    {roles.map(role => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 bg-gray-900/50 border-gray-700 rounded focus:ring-cyan-500"
                />
                <label htmlFor="isActive" className="text-gray-400">Active User</label>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleAddUser}
                disabled={actionLoading || !formData.firstName || !formData.lastName || !formData.email || !formData.password || formData.companyId === 0}
                className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
              >
                {actionLoading ? 'Creating...' : 'Create User'}
              </button>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-6">Edit User</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 mb-2">First Name *</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                    placeholder="Enter first name"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-2">Last Name *</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                    placeholder="Enter last name"
                  />
                </div>
              </div>
              <div>
                <label className="block text-gray-400 mb-2">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  placeholder="user@example.com"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 mb-2">Company *</label>
                  <select
                    value={formData.companyId}
                    onChange={(e) => setFormData({ ...formData, companyId: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  >
                    {companies.map(company => (
                      <option key={company.id} value={company.id}>{company.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 mb-2">Role *</label>
                  <select
                    value={formData.roleId}
                    onChange={(e) => setFormData({ ...formData, roleId: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  >
                    {roles.map(role => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="editIsActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 bg-gray-900/50 border-gray-700 rounded focus:ring-cyan-500"
                />
                <label htmlFor="editIsActive" className="text-gray-400">Active User</label>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleEditUser}
                disabled={actionLoading || !formData.firstName || !formData.lastName || !formData.email}
                className="flex-1 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
              >
                {actionLoading ? 'Updating...' : 'Update User'}
              </button>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedUser(null);
                  resetForm();
                }}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-red-500/50 rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Delete User</h3>
                <p className="text-gray-400">
                  Are you sure you want to delete <span className="text-white font-semibold">{selectedUser.fullName}</span>?
                </p>
                <p className="text-red-400 text-sm mt-2">
                  This action cannot be undone. All user data and expenses will be permanently deleted.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleDeleteUser}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-600 text-white rounded-lg transition-colors font-medium"
              >
                {actionLoading ? 'Deleting...' : 'Delete User'}
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedUser(null);
                }}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetPasswordModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-white mb-4">Reset Password</h3>
            <p className="text-gray-400 mb-4">
              User: <span className="text-white font-semibold">{selectedUser.fullName}</span>
            </p>
            <div className="mb-6">
              <label className="block text-gray-400 mb-2">New Password *</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                placeholder="Enter new password (min 8 characters)"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleResetPassword}
                disabled={actionLoading || newPassword.length < 8}
                className="flex-1 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
              >
                {actionLoading ? 'Resetting...' : 'Reset Password'}
              </button>
              <button
                onClick={() => {
                  setShowResetPasswordModal(false);
                  setSelectedUser(null);
                  setNewPassword('');
                }}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suspend Confirmation Modal */}
      <ConfirmationModal
        isOpen={showSuspendModal}
        type="suspend"
        title="Suspend User"
        message={`Are you sure you want to suspend ${selectedUser?.fullName}? They will no longer be able to log in.`}
        confirmText="Suspend User"
        onConfirm={handleSuspend}
        onCancel={() => {
          setShowSuspendModal(false);
          setSelectedUser(null);
        }}
        loading={actionLoading}
      />
    </div>
  );
};

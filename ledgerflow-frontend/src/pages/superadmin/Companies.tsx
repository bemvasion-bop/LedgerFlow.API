import React, { useEffect, useState } from 'react';
import { 
  Search, 
  Ban, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { superAdminService } from '../../services/superAdmin.service';
import { useToast, ConfirmationModal } from '../../components/ui';
import type { Company } from '../../types';

export const Companies: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const toast = useToast();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSuspendConfirm, setShowSuspendConfirm] = useState(false);
  const [showActivateConfirm, setShowActivateConfirm] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [companyToAction, setCompanyToAction] = useState<{id: number, name: string} | null>(null);
  const [extendDays, setExtendDays] = useState(30);
  const [actionLoading, setActionLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordRequirements, setPasswordRequirements] = useState({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecial: false,
  });
  const [formData, setFormData] = useState({
    // Company Information
    companyName: '',
    companyEmail: '',
    companyPhone: '',
    companyAddress: '',
    // Admin Account
    adminFirstName: '',
    adminLastName: '',
    adminEmail: '',
    adminPassword: '',
    confirmPassword: '',
    // Subscription Settings
    planId: 1,
    subscriptionStatus: 'Trial',
    // Legacy fields for edit modal
    name: '',
    email: '',
    contactPerson: '',
    maxUsers: 10
  });

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    filterCompanies();
  }, [searchTerm, statusFilter, planFilter, companies]);

  // Check password requirements in real-time
  useEffect(() => {
    const password = formData.adminPassword;
    setPasswordRequirements({
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecial: /[@$!%*?&]/.test(password),
    });
  }, [formData.adminPassword]);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await superAdminService.getAllCompanies();
      setCompanies(data);
    } catch (error: any) {
      console.error('Error fetching companies:', error);
      setError(error.response?.data?.message || 'Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  const filterCompanies = () => {
    let filtered = companies;

    if (searchTerm) {
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(c => 
        c.subscriptionStatus?.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    if (planFilter !== 'all') {
      filtered = filtered.filter(c => 
        c.planName?.toLowerCase() === planFilter.toLowerCase()
      );
    }

    setFilteredCompanies(filtered);
  };

  const handleSuspend = async () => {
    if (!companyToAction) return;
    
    try {
      setActionLoading(true);
      await superAdminService.suspendCompany(companyToAction.id);
      toast.success('Company Suspended', `${companyToAction.name} has been suspended successfully`);
      setShowSuspendConfirm(false);
      setCompanyToAction(null);
      await fetchCompanies();
    } catch (error: any) {
      console.error('Error suspending company:', error);
      toast.error('Suspension Failed', error.response?.data?.message || 'Failed to suspend company');
    } finally {
      setActionLoading(false);
    }
  };

  const handleActivate = async () => {
    if (!companyToAction) return;
    
    try {
      setActionLoading(true);
      await superAdminService.activateCompany(companyToAction.id);
      toast.success('Company Activated', `${companyToAction.name} has been activated successfully`);
      setShowActivateConfirm(false);
      setCompanyToAction(null);
      await fetchCompanies();
    } catch (error: any) {
      console.error('Error activating company:', error);
      toast.error('Activation Failed', error.response?.data?.message || 'Failed to activate company');
    } finally {
      setActionLoading(false);
    }
  };

  const handleExtendTrial = async () => {
    if (!selectedCompany) return;
    
    try {
      setActionLoading(true);
      await superAdminService.extendTrial({
        companyId: selectedCompany.id,
        days: extendDays
      });
      toast.success('Trial Extended', `Trial extended by ${extendDays} days for ${selectedCompany.name}`);
      setShowExtendModal(false);
      setSelectedCompany(null);
      await fetchCompanies();
    } catch (error: any) {
      console.error('Error extending trial:', error);
      toast.error('Extension Failed', error.response?.data?.message || 'Failed to extend trial');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    sessionStorage.clear();
    navigate('/login', { replace: true });
    window.location.href = '/login';
  };

  const handleAddCompany = async () => {
    // Validation
    if (!formData.companyName.trim()) {
      toast.error('Validation Error', 'Company name is required');
      return;
    }
    if (!formData.companyEmail.trim() || !/\S+@\S+\.\S+/.test(formData.companyEmail)) {
      toast.error('Validation Error', 'Valid company email is required');
      return;
    }
    if (!formData.adminFirstName.trim()) {
      toast.error('Validation Error', 'Admin first name is required');
      return;
    }
    if (!formData.adminLastName.trim()) {
      toast.error('Validation Error', 'Admin last name is required');
      return;
    }
    if (!formData.adminEmail.trim() || !/\S+@\S+\.\S+/.test(formData.adminEmail)) {
      toast.error('Validation Error', 'Valid admin email is required');
      return;
    }
    if (formData.adminPassword.length < 8) {
      toast.error('Validation Error', 'Password must be at least 8 characters');
      return;
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(formData.adminPassword)) {
      toast.error('Validation Error', 'Password must contain uppercase, lowercase, number, and special character');
      return;
    }
    if (formData.adminPassword !== formData.confirmPassword) {
      toast.error('Validation Error', 'Passwords do not match');
      return;
    }

    try {
      setActionLoading(true);
      await superAdminService.createCompanyWithAdmin({
        companyName: formData.companyName,
        companyEmail: formData.companyEmail,
        companyPhone: formData.companyPhone || undefined,
        companyAddress: formData.companyAddress || undefined,
        adminFirstName: formData.adminFirstName,
        adminLastName: formData.adminLastName,
        adminEmail: formData.adminEmail,
        adminPassword: formData.adminPassword,
        planId: formData.planId,
        subscriptionStatus: formData.subscriptionStatus
      });
      toast.success('Company Created', `Company ${formData.companyName} created successfully with admin account`);
      setShowAddModal(false);
      resetForm();
      await fetchCompanies();
    } catch (error: any) {
      console.error('Error creating company:', error);
      toast.error('Creation Failed', error.response?.data?.message || 'Failed to create company');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditCompany = async () => {
    if (!selectedCompany) return;

    // Validation
    if (!formData.companyName.trim()) {
      toast.error('Validation Error', 'Company name is required');
      return;
    }
    if (!formData.companyEmail.trim() || !/\S+@\S+\.\S+/.test(formData.companyEmail)) {
      toast.error('Validation Error', 'Valid company email is required');
      return;
    }
    if (!formData.adminFirstName.trim()) {
      toast.error('Validation Error', 'Admin first name is required');
      return;
    }
    if (!formData.adminLastName.trim()) {
      toast.error('Validation Error', 'Admin last name is required');
      return;
    }
    if (!formData.adminEmail.trim() || !/\S+@\S+\.\S+/.test(formData.adminEmail)) {
      toast.error('Validation Error', 'Valid admin email is required');
      return;
    }
    
    // Validate password if provided
    if (formData.adminPassword) {
      if (formData.adminPassword.length < 8) {
        toast.error('Validation Error', 'Password must be at least 8 characters');
        return;
      }
      if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(formData.adminPassword)) {
        toast.error('Validation Error', 'Password must contain uppercase, lowercase, number, and special character');
        return;
      }
      if (formData.adminPassword !== formData.confirmPassword) {
        toast.error('Validation Error', 'Passwords do not match');
        return;
      }
    }
    
    try {
      setActionLoading(true);
      await superAdminService.updateCompanyWithAdmin(selectedCompany.id, {
        companyName: formData.companyName,
        companyEmail: formData.companyEmail,
        companyPhone: formData.companyPhone || undefined,
        companyAddress: formData.companyAddress || undefined,
        adminFirstName: formData.adminFirstName,
        adminLastName: formData.adminLastName,
        adminEmail: formData.adminEmail,
        adminPassword: formData.adminPassword || undefined, // Only send if provided
        planId: formData.planId,
        subscriptionStatus: formData.subscriptionStatus
      });
      toast.success('Company Updated', `Company ${formData.companyName} updated successfully`);
      setShowEditModal(false);
      setSelectedCompany(null);
      resetForm();
      await fetchCompanies();
    } catch (error: any) {
      console.error('Error updating company:', error);
      toast.error('Update Failed', error.response?.data?.message || 'Failed to update company');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCompany = async () => {
    if (!selectedCompany) return;
    
    try {
      setActionLoading(true);
      await superAdminService.deleteCompany(selectedCompany.id);
      toast.success('Company Deleted', `Company ${selectedCompany.name} deleted successfully`);
      setShowDeleteConfirm(false);
      setSelectedCompany(null);
      await fetchCompanies();
    } catch (error: any) {
      console.error('Error deleting company:', error);
      toast.error('Deletion Failed', error.response?.data?.message || 'Failed to delete company');
    } finally {
      setActionLoading(false);
    }
  };

  const openEditModal = async (company: Company) => {
    setSelectedCompany(company);
    
    // Fetch admin user details for this company
    try {
      const adminRole = await superAdminService.getAllPlatformUsers();
      const adminUser = adminRole.find(u => u.companyId === company.id && u.roleName === 'Admin');
      
      setFormData({
        // Company Information
        companyName: company.name,
        companyEmail: company.email,
        companyPhone: company.phone || '',
        companyAddress: company.address || '',
        // Admin Account
        adminFirstName: adminUser?.firstName || '',
        adminLastName: adminUser?.lastName || '',
        adminEmail: adminUser?.email || '',
        adminPassword: '',
        confirmPassword: '',
        // Subscription Settings
        planId: company.planId || 1,
        subscriptionStatus: company.subscriptionStatus || 'Trial',
        // Legacy fields (not used in edit)
        name: '',
        email: '',
        contactPerson: '',
        maxUsers: 10
      });
    } catch (error) {
      console.error('Error fetching admin user:', error);
      // Fallback to company data only
      setFormData({
        companyName: company.name,
        companyEmail: company.email,
        companyPhone: company.phone || '',
        companyAddress: company.address || '',
        adminFirstName: '',
        adminLastName: '',
        adminEmail: '',
        adminPassword: '',
        confirmPassword: '',
        planId: company.planId || 1,
        subscriptionStatus: company.subscriptionStatus || 'Trial',
        name: '',
        email: '',
        contactPerson: '',
        maxUsers: 10
      });
    }
    
    setShowEditModal(true);
  };

  const openDeleteModal = (company: Company) => {
    setSelectedCompany(company);
    setShowDeleteConfirm(true);
  };

  const resetForm = () => {
    setFormData({
      // Company Information
      companyName: '',
      companyEmail: '',
      companyPhone: '',
      companyAddress: '',
      // Admin Account
      adminFirstName: '',
      adminLastName: '',
      adminEmail: '',
      adminPassword: '',
      confirmPassword: '',
      // Subscription Settings
      planId: 1,
      subscriptionStatus: 'Trial',
      // Legacy fields for edit modal
      name: '',
      email: '',
      contactPerson: '',
      maxUsers: 10
    });
    setShowPassword(false);
    setShowConfirmPassword(false);
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
        <h1 className="text-3xl font-bold text-white">Company Management</h1>
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <p className="font-semibold text-red-400 mb-2">Error Loading Companies</p>
              <p className="text-sm text-red-300 mb-4">{error}</p>
              <button 
                onClick={fetchCompanies}
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
          <h1 className="text-3xl font-bold text-white mb-2">Company Management</h1>
          <p className="text-gray-400">Manage all companies on the platform</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Company
          </button>
          <button
            onClick={fetchCompanies}
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search companies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Status</option>
            <option value="trial">Trial</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="suspended">Suspended</option>
          </select>
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Plans</option>
            <option value="starter">Starter</option>
            <option value="business">Business</option>
          </select>
        </div>
      </div>

      {/* Companies Table */}
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-4 px-6 text-gray-400 font-medium">Company</th>
                <th className="text-left py-4 px-6 text-gray-400 font-medium">Email</th>
                <th className="text-left py-4 px-6 text-gray-400 font-medium">Plan</th>
                <th className="text-left py-4 px-6 text-gray-400 font-medium">Status</th>
                <th className="text-left py-4 px-6 text-gray-400 font-medium">Users</th>
                <th className="text-left py-4 px-6 text-gray-400 font-medium">Trial End</th>
                <th className="text-left py-4 px-6 text-gray-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCompanies.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400">
                    No companies found
                  </td>
                </tr>
              ) : (
                filteredCompanies.map((company) => (
                  <tr key={company.id} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                    <td className="py-4 px-6 text-white font-medium">{company.name}</td>
                    <td className="py-4 px-6 text-gray-400">{company.email}</td>
                    <td className="py-4 px-6 text-gray-300">{company.planName || 'N/A'}</td>
                    <td className="py-4 px-6">
                      <span className={`${
                        company.subscriptionStatus?.toLowerCase() === 'trial' ? 'text-yellow-400' :
                        company.subscriptionStatus?.toLowerCase() === 'active' ? 'text-green-400' :
                        company.subscriptionStatus?.toLowerCase() === 'suspended' ? 'text-red-400' :
                        company.subscriptionStatus?.toLowerCase() === 'expired' ? 'text-gray-400' :
                        'text-gray-300'
                      }`}>
                        {company.subscriptionStatus || 'Trial'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-gray-300">{company.userCount || 0}</td>
                    <td className="py-4 px-6 text-gray-400">
                      {company.trialEndsAt ? new Date(company.trialEndsAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(company)}
                          disabled={actionLoading}
                          className="p-2 hover:bg-cyan-500/10 text-cyan-400 rounded-lg transition-colors disabled:opacity-50"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedCompany(company);
                            setShowExtendModal(true);
                          }}
                          disabled={actionLoading}
                          className="p-2 hover:bg-yellow-500/10 text-yellow-400 rounded-lg transition-colors disabled:opacity-50"
                          title="Extend Trial"
                        >
                          <Clock className="w-4 h-4" />
                        </button>
                        {company.subscriptionStatus?.toLowerCase() !== 'suspended' ? (
                          <button
                            onClick={() => {
                              setCompanyToAction({id: company.id, name: company.name});
                              setShowSuspendConfirm(true);
                            }}
                            disabled={actionLoading}
                            className="p-2 hover:bg-red-500/10 text-red-400 rounded-lg transition-colors disabled:opacity-50"
                            title="Suspend"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setCompanyToAction({id: company.id, name: company.name});
                              setShowActivateConfirm(true);
                            }}
                            disabled={actionLoading}
                            className="p-2 hover:bg-green-500/10 text-green-400 rounded-lg transition-colors disabled:opacity-50"
                            title="Activate"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => openDeleteModal(company)}
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

      {/* Extend Trial Modal */}
      {showExtendModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-white mb-4">Extend Trial Period</h3>
            <p className="text-gray-400 mb-4">
              Company: <span className="text-white font-semibold">{selectedCompany?.name}</span>
            </p>
            <div className="mb-6">
              <label className="block text-gray-400 mb-2">Extend by (days)</label>
              <input
                type="number"
                value={extendDays}
                onChange={(e) => setExtendDays(parseInt(e.target.value))}
                className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                min="1"
                max="365"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleExtendTrial}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-600 text-white rounded-lg transition-colors font-medium"
              >
                {actionLoading ? 'Extending...' : 'Extend Trial'}
              </button>
              <button
                onClick={() => {
                  setShowExtendModal(false);
                  setSelectedCompany(null);
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

      {/* Add Company Modal - Unified with Public Registration Form */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-white mb-6">Add New Company</h3>
            
            <div className="space-y-8">
              {/* Section 1: Company Information */}
              <div>
                <h4 className="text-lg font-semibold text-cyan-400 mb-4 flex items-center gap-2">
                  <span>🏢</span> Company Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-300 mb-2 font-medium">
                      Company Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition"
                      placeholder="Acme Corporation"
                      disabled={actionLoading}
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-2 font-medium">
                      Company Email <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.companyEmail}
                      onChange={(e) => setFormData({ ...formData, companyEmail: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition"
                      placeholder="company@example.com"
                      disabled={actionLoading}
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-2 font-medium">
                      Company Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.companyPhone}
                      onChange={(e) => setFormData({ ...formData, companyPhone: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition"
                      placeholder="+63 2 1234 5678"
                      disabled={actionLoading}
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-2 font-medium">
                      Company Address
                    </label>
                    <input
                      type="text"
                      value={formData.companyAddress}
                      onChange={(e) => setFormData({ ...formData, companyAddress: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition"
                      placeholder="Makati City, Metro Manila"
                      disabled={actionLoading}
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Admin Account */}
              <div>
                <h4 className="text-lg font-semibold text-cyan-400 mb-4 flex items-center gap-2">
                  <span>👤</span> Admin Account
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-300 mb-2 font-medium">
                      First Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.adminFirstName}
                      onChange={(e) => setFormData({ ...formData, adminFirstName: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition"
                      placeholder="John"
                      disabled={actionLoading}
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-2 font-medium">
                      Last Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.adminLastName}
                      onChange={(e) => setFormData({ ...formData, adminLastName: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition"
                      placeholder="Doe"
                      disabled={actionLoading}
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-2 font-medium">
                      Admin Email <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.adminEmail}
                      onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition"
                      placeholder="admin@example.com"
                      disabled={actionLoading}
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-2 font-medium">
                      Password <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.adminPassword}
                        onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                        className="w-full px-4 py-3 pr-12 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition"
                        placeholder="••••••••"
                        disabled={actionLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-cyan-400 transition"
                        disabled={actionLoading}
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-gray-300 mb-2 font-medium">
                      Confirm Password <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        className="w-full px-4 py-3 pr-12 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition"
                        placeholder="••••••••"
                        disabled={actionLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-cyan-400 transition"
                        disabled={actionLoading}
                      >
                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Password Requirements Checklist */}
                {formData.adminPassword && (
                  <div className="mt-4 p-4 bg-gray-900/30 border border-cyan-500/20 rounded-lg">
                    <p className="text-sm text-gray-300 mb-3 font-medium">Password Requirements:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div className="flex items-center gap-2">
                        {passwordRequirements.minLength ? (
                          <CheckCircle size={16} className="text-green-400 flex-shrink-0" />
                        ) : (
                          <XCircle size={16} className="text-red-400 flex-shrink-0" />
                        )}
                        <span className={`text-sm ${passwordRequirements.minLength ? 'text-green-400' : 'text-gray-400'}`}>
                          At least 8 characters
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {passwordRequirements.hasUppercase ? (
                          <CheckCircle size={16} className="text-green-400 flex-shrink-0" />
                        ) : (
                          <XCircle size={16} className="text-red-400 flex-shrink-0" />
                        )}
                        <span className={`text-sm ${passwordRequirements.hasUppercase ? 'text-green-400' : 'text-gray-400'}`}>
                          One uppercase letter
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {passwordRequirements.hasLowercase ? (
                          <CheckCircle size={16} className="text-green-400 flex-shrink-0" />
                        ) : (
                          <XCircle size={16} className="text-red-400 flex-shrink-0" />
                        )}
                        <span className={`text-sm ${passwordRequirements.hasLowercase ? 'text-green-400' : 'text-gray-400'}`}>
                          One lowercase letter
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {passwordRequirements.hasNumber ? (
                          <CheckCircle size={16} className="text-green-400 flex-shrink-0" />
                        ) : (
                          <XCircle size={16} className="text-red-400 flex-shrink-0" />
                        )}
                        <span className={`text-sm ${passwordRequirements.hasNumber ? 'text-green-400' : 'text-gray-400'}`}>
                          One number
                        </span>
                      </div>
                      <div className="flex items-center gap-2 md:col-span-2">
                        {passwordRequirements.hasSpecial ? (
                          <CheckCircle size={16} className="text-green-400 flex-shrink-0" />
                        ) : (
                          <XCircle size={16} className="text-red-400 flex-shrink-0" />
                        )}
                        <span className={`text-sm ${passwordRequirements.hasSpecial ? 'text-green-400' : 'text-gray-400'}`}>
                          One special character (@$!%*?&)
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Section 3: Subscription Settings */}
              <div>
                <h4 className="text-lg font-semibold text-cyan-400 mb-4 flex items-center gap-2">
                  <span>⚙️</span> Subscription Settings
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-300 mb-2 font-medium">
                      Subscription Plan <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={formData.planId}
                      onChange={(e) => setFormData({ ...formData, planId: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition"
                      disabled={actionLoading}
                    >
                      <option value={1}>Starter</option>
                      <option value={2}>Business</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-2 font-medium">
                      Company Status <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={formData.subscriptionStatus}
                      onChange={(e) => setFormData({ ...formData, subscriptionStatus: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition"
                      disabled={actionLoading}
                    >
                      <option value="Active">Active</option>
                      <option value="Trial">Trial</option>
                      <option value="Suspended">Suspended</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-8">
              <button
                onClick={handleAddCompany}
                disabled={actionLoading}
                className="flex-1 px-6 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium text-lg"
              >
                {actionLoading ? 'Creating Company...' : 'Create Company'}
              </button>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                disabled={actionLoading}
                className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-600 text-white rounded-lg transition-colors font-medium text-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Company Modal - Unified Design */}
      {showEditModal && selectedCompany && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-white mb-6">Edit Company</h3>
            
            <div className="space-y-8">
              {/* Section 1: Company Information */}
              <div>
                <h4 className="text-lg font-semibold text-cyan-400 mb-4 flex items-center gap-2">
                  <span>🏢</span> Company Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-300 mb-2 font-medium">
                      Company Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition"
                      placeholder="Acme Corporation"
                      disabled={actionLoading}
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-2 font-medium">
                      Company Email <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.companyEmail}
                      onChange={(e) => setFormData({ ...formData, companyEmail: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition"
                      placeholder="company@example.com"
                      disabled={actionLoading}
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-2 font-medium">
                      Company Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.companyPhone}
                      onChange={(e) => setFormData({ ...formData, companyPhone: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition"
                      placeholder="+63 2 1234 5678"
                      disabled={actionLoading}
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-2 font-medium">
                      Company Address
                    </label>
                    <input
                      type="text"
                      value={formData.companyAddress}
                      onChange={(e) => setFormData({ ...formData, companyAddress: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition"
                      placeholder="Makati City, Metro Manila"
                      disabled={actionLoading}
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Admin Account */}
              <div>
                <h4 className="text-lg font-semibold text-cyan-400 mb-4 flex items-center gap-2">
                  <span>👤</span> Admin Account
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-300 mb-2 font-medium">
                      First Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.adminFirstName}
                      onChange={(e) => setFormData({ ...formData, adminFirstName: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition"
                      placeholder="John"
                      disabled={actionLoading}
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-2 font-medium">
                      Last Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.adminLastName}
                      onChange={(e) => setFormData({ ...formData, adminLastName: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition"
                      placeholder="Doe"
                      disabled={actionLoading}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-gray-300 mb-2 font-medium">
                      Admin Email <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.adminEmail}
                      onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition"
                      placeholder="admin@example.com"
                      disabled={actionLoading}
                    />
                  </div>
                </div>

                {/* Optional Password Change Section */}
                <div className="mt-6 p-4 bg-gray-900/30 border border-cyan-500/20 rounded-lg">
                  <p className="text-sm text-gray-300 mb-3 font-medium">Change Password (Optional)</p>
                  <p className="text-xs text-gray-400 mb-4">Leave empty to keep current password</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-300 mb-2 font-medium">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={formData.adminPassword}
                          onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                          className="w-full px-4 py-3 pr-12 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition"
                          placeholder="••••••••"
                          disabled={actionLoading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-cyan-400 transition"
                          disabled={actionLoading}
                        >
                          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-gray-300 mb-2 font-medium">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={formData.confirmPassword}
                          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                          className="w-full px-4 py-3 pr-12 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition"
                          placeholder="••••••••"
                          disabled={actionLoading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-cyan-400 transition"
                          disabled={actionLoading}
                        >
                          {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Password Requirements Checklist (only show if password is being changed) */}
                  {formData.adminPassword && (
                    <div className="mt-4 p-4 bg-gray-900/30 border border-cyan-500/20 rounded-lg">
                      <p className="text-sm text-gray-300 mb-3 font-medium">Password Requirements:</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div className="flex items-center gap-2">
                          {passwordRequirements.minLength ? (
                            <CheckCircle size={16} className="text-green-400 flex-shrink-0" />
                          ) : (
                            <XCircle size={16} className="text-red-400 flex-shrink-0" />
                          )}
                          <span className={`text-sm ${passwordRequirements.minLength ? 'text-green-400' : 'text-gray-400'}`}>
                            At least 8 characters
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {passwordRequirements.hasUppercase ? (
                            <CheckCircle size={16} className="text-green-400 flex-shrink-0" />
                          ) : (
                            <XCircle size={16} className="text-red-400 flex-shrink-0" />
                          )}
                          <span className={`text-sm ${passwordRequirements.hasUppercase ? 'text-green-400' : 'text-gray-400'}`}>
                            One uppercase letter
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {passwordRequirements.hasLowercase ? (
                            <CheckCircle size={16} className="text-green-400 flex-shrink-0" />
                          ) : (
                            <XCircle size={16} className="text-red-400 flex-shrink-0" />
                          )}
                          <span className={`text-sm ${passwordRequirements.hasLowercase ? 'text-green-400' : 'text-gray-400'}`}>
                            One lowercase letter
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {passwordRequirements.hasNumber ? (
                            <CheckCircle size={16} className="text-green-400 flex-shrink-0" />
                          ) : (
                            <XCircle size={16} className="text-red-400 flex-shrink-0" />
                          )}
                          <span className={`text-sm ${passwordRequirements.hasNumber ? 'text-green-400' : 'text-gray-400'}`}>
                            One number
                          </span>
                        </div>
                        <div className="flex items-center gap-2 md:col-span-2">
                          {passwordRequirements.hasSpecial ? (
                            <CheckCircle size={16} className="text-green-400 flex-shrink-0" />
                          ) : (
                            <XCircle size={16} className="text-red-400 flex-shrink-0" />
                          )}
                          <span className={`text-sm ${passwordRequirements.hasSpecial ? 'text-green-400' : 'text-gray-400'}`}>
                            One special character (@$!%*?&)
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 3: Subscription Settings */}
              <div>
                <h4 className="text-lg font-semibold text-cyan-400 mb-4 flex items-center gap-2">
                  <span>⚙️</span> Subscription Settings
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-300 mb-2 font-medium">
                      Subscription Plan <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={formData.planId}
                      onChange={(e) => setFormData({ ...formData, planId: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition"
                      disabled={actionLoading}
                    >
                      <option value={1}>Starter</option>
                      <option value={2}>Business</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-2 font-medium">
                      Company Status <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={formData.subscriptionStatus}
                      onChange={(e) => setFormData({ ...formData, subscriptionStatus: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition"
                      disabled={actionLoading}
                    >
                      <option value="Active">Active</option>
                      <option value="Trial">Trial</option>
                      <option value="Suspended">Suspended</option>
                      <option value="Expired">Expired</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-8">
              <button
                onClick={handleEditCompany}
                disabled={actionLoading}
                className="flex-1 px-6 py-3 bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium text-lg"
              >
                {actionLoading ? 'Updating Company...' : 'Update Company'}
              </button>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedCompany(null);
                  resetForm();
                }}
                disabled={actionLoading}
                className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-600 text-white rounded-lg transition-colors font-medium text-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        type="delete"
        title="Delete Company"
        message={`Are you sure you want to delete ${selectedCompany?.name}?\n\nThis action cannot be undone. All company data, users, and expenses will be permanently deleted.`}
        confirmText="Delete Company"
        cancelText="Cancel"
        onConfirm={handleDeleteCompany}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setSelectedCompany(null);
        }}
        loading={actionLoading}
      />

      {/* Suspend Confirmation Modal */}
      <ConfirmationModal
        isOpen={showSuspendConfirm}
        type="suspend"
        title="Suspend Company"
        message={`Are you sure you want to suspend ${companyToAction?.name}?\n\nThe company will no longer be able to access the system until reactivated.`}
        confirmText="Suspend"
        cancelText="Cancel"
        onConfirm={handleSuspend}
        onCancel={() => {
          setShowSuspendConfirm(false);
          setCompanyToAction(null);
        }}
        loading={actionLoading}
      />

      {/* Activate Confirmation Modal */}
      <ConfirmationModal
        isOpen={showActivateConfirm}
        type="activate"
        title="Activate Company"
        message={`Are you sure you want to activate ${companyToAction?.name}?\n\nThe company will regain full access to the system.`}
        confirmText="Activate"
        cancelText="Cancel"
        onConfirm={handleActivate}
        onCancel={() => {
          setShowActivateConfirm(false);
          setCompanyToAction(null);
        }}
        loading={actionLoading}
      />
    </div>
  );
};

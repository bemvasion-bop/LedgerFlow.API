import React, { useEffect, useState } from 'react';
import { 
  Building2, 
  Users, 
  Activity, 
  AlertCircle, 
  FileText,
  Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { StatusBadge } from '../../components/superadmin/StatusBadge';
import { PageHeader } from '../../components/common/PageHeader';
import { superAdminService } from '../../services/superAdmin.service';
import subscriptionService from '../../services/subscriptionService';
import type { SystemStats, Company } from '../../types';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [pendingRequestsCount, setPendingRequestsCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [statsData, companiesData, pendingRequests] = await Promise.all([
        superAdminService.getSystemStats(),
        superAdminService.getAllCompanies(),
        subscriptionService.getPendingRequests()
      ]);
      
      setStats(statsData);
      setCompanies(companiesData.slice(0, 5)); // Latest 5 companies
      setPendingRequestsCount(pendingRequests.length);
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      const errorMessage = error.response?.data?.message 
        || error.message 
        || 'Failed to load dashboard data. Please check your connection and try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-8 bg-gray-700 rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-800/50 rounded-xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-gray-800/50 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader 
          title="Platform Dashboard"
          subtitle="Monitor and manage your entire platform"
          onRefresh={fetchData}
          refreshing={false}
          showRefresh={false}
        />
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <p className="font-semibold text-red-400 mb-2">Error Loading Dashboard</p>
              <p className="text-sm text-red-300 mb-4">{error}</p>
              <div className="flex gap-3">
                <button 
                  onClick={fetchData}
                  className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors font-medium"
                >
                  Retry
                </button>
                <button 
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
                >
                  Reload Page
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn overflow-visible">
      {/* Page Header */}
      <PageHeader 
        title="Platform Dashboard"
        subtitle="Monitor and manage your entire platform"
        onRefresh={handleRefresh}
        refreshing={refreshing}
      />

      {/* Stats Grid - Fixed Responsiveness - CLICKABLE KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        <button
          onClick={() => navigate('/superadmin/companies')}
          className="group bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 backdrop-blur-sm border border-cyan-500/20 rounded-xl p-6 hover:border-cyan-500/40 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)] transition-all duration-300 hover:-translate-y-1 text-left cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-cyan-500/10 group-hover:bg-cyan-500/20 transition-colors">
              <Building2 className="w-6 h-6 text-cyan-400" />
            </div>
            <span className="text-3xl font-bold text-white">{stats?.totalCompanies || 0}</span>
          </div>
          <h3 className="text-sm font-semibold text-white mb-1">Total Companies</h3>
          <p className="text-xs text-gray-400">Manage all companies</p>
        </button>

        <button
          onClick={() => navigate('/superadmin/companies?status=active')}
          className="group bg-gradient-to-br from-green-500/10 to-green-600/5 backdrop-blur-sm border border-green-500/20 rounded-xl p-6 hover:border-green-500/40 hover:shadow-[0_0_30px_rgba(34,197,94,0.15)] transition-all duration-300 hover:-translate-y-1 text-left cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
              <Activity className="w-6 h-6 text-green-400" />
            </div>
            <span className="text-3xl font-bold text-white">{stats?.activeCompanies || 0}</span>
          </div>
          <h3 className="text-sm font-semibold text-white mb-1">Active Companies</h3>
          <p className="text-xs text-gray-400">Currently active</p>
        </button>

        <button
          onClick={() => navigate('/superadmin/users')}
          className="group bg-gradient-to-br from-purple-500/10 to-purple-600/5 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6 hover:border-purple-500/40 hover:shadow-[0_0_30px_rgba(168,85,247,0.15)] transition-all duration-300 hover:-translate-y-1 text-left cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
              <Users className="w-6 h-6 text-purple-400" />
            </div>
            <span className="text-3xl font-bold text-white">{stats?.totalUsers || 0}</span>
          </div>
          <h3 className="text-sm font-semibold text-white mb-1">Total Users</h3>
          <p className="text-xs text-gray-400">Platform-wide users</p>
        </button>

        <button
          onClick={() => navigate('/superadmin/subscriptions')}
          className="group bg-gradient-to-br from-amber-500/10 to-orange-600/5 backdrop-blur-sm border border-amber-500/20 rounded-xl p-6 hover:border-amber-500/40 hover:shadow-[0_0_30px_rgba(251,191,36,0.15)] transition-all duration-300 hover:-translate-y-1 text-left cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-amber-500/10 group-hover:bg-amber-500/20 transition-colors">
              <Clock className="w-6 h-6 text-amber-400" />
            </div>
            <span className="text-3xl font-bold text-white">{pendingRequestsCount}</span>
          </div>
          <h3 className="text-sm font-semibold text-white mb-1">Pending Requests</h3>
          <p className="text-xs text-gray-400">Awaiting approval</p>
        </button>
      </div>

      {/* Secondary Stats - Fixed Responsiveness */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="group bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 hover:border-gray-600/50 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-cyan-500/10">
              <Activity className="w-5 h-5 text-cyan-400" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-white">Subscription Status</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 rounded-lg bg-gray-900/30 hover:bg-gray-900/50 transition-colors">
              <span className="text-sm text-gray-400">Trial</span>
              <span className="text-lg font-bold text-yellow-400">{stats?.trialCompanies || 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-gray-900/30 hover:bg-gray-900/50 transition-colors">
              <span className="text-sm text-gray-400">Active</span>
              <span className="text-lg font-bold text-green-400">{stats?.activeCompanies || 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-gray-900/30 hover:bg-gray-900/50 transition-colors">
              <span className="text-sm text-gray-400">Expired</span>
              <span className="text-lg font-bold text-red-400">{stats?.expiredCompanies || 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-gray-900/30 hover:bg-gray-900/50 transition-colors">
              <span className="text-sm text-gray-400">Suspended</span>
              <span className="text-lg font-bold text-gray-400">{stats?.suspendedCompanies || 0}</span>
            </div>
          </div>
        </div>

        <div className="group bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 hover:border-gray-600/50 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-purple-500/10">
              {/* Philippine Peso Icon */}
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 8h6M9 12h6m-6 4h6m-8-8v8m0 0H5m4 0h2m8-8v8m0 0h2m-2 0h-2" />
              </svg>
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-white">Plan Distribution</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 rounded-lg bg-gray-900/30 hover:bg-gray-900/50 transition-colors">
              <span className="text-sm text-gray-400">Starter Plan</span>
              <span className="text-lg font-bold text-cyan-400">{stats?.starterPlanCompanies || 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-gray-900/30 hover:bg-gray-900/50 transition-colors">
              <span className="text-sm text-gray-400">Business Plan</span>
              <span className="text-lg font-bold text-purple-400">{stats?.businessPlanCompanies || 0}</span>
            </div>
          </div>
        </div>

        <div className="group bg-gradient-to-br from-cyan-500/10 to-teal-500/10 border border-cyan-500/30 rounded-xl p-6 hover:border-cyan-500/50 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)] transition-all duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-cyan-500/20">
              <AlertCircle className="w-5 h-5 text-cyan-400" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-white">Quick Actions</h3>
          </div>
          <div className="space-y-2">
            <a 
              href="/superadmin/companies" 
              className="group/link flex items-center justify-between w-full px-4 py-3 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg text-sm text-gray-300 hover:text-white transition-all duration-200 hover:translate-x-1"
            >
              <span>View All Companies</span>
              <Building2 className="w-4 h-4 opacity-0 group-hover/link:opacity-100 transition-opacity" />
            </a>
            <a 
              href="/superadmin/audit-logs" 
              className="group/link flex items-center justify-between w-full px-4 py-3 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg text-sm text-gray-300 hover:text-white transition-all duration-200 hover:translate-x-1"
            >
              <span>Check Audit Logs</span>
              <FileText className="w-4 h-4 opacity-0 group-hover/link:opacity-100 transition-opacity" />
            </a>
            <a 
              href="/superadmin/settings" 
              className="group/link flex items-center justify-between w-full px-4 py-3 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg text-sm text-gray-300 hover:text-white transition-all duration-200 hover:translate-x-1"
            >
              <span>Platform Settings</span>
              <Activity className="w-4 h-4 opacity-0 group-hover/link:opacity-100 transition-opacity" />
            </a>
          </div>
        </div>
      </div>

      {/* Recent Companies */}
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl overflow-hidden hover:border-gray-600/50 transition-all duration-300">
        <div className="px-6 py-4 border-b border-gray-700/50 bg-gray-900/30">
          <h3 className="text-lg font-semibold text-white">Recent Companies</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900/50 sticky top-0">
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">Company</th>
                <th className="text-left py-3 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">Email</th>
                <th className="text-left py-3 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">Plan</th>
                <th className="text-left py-3 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="text-left py-3 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">Users</th>
                <th className="text-left py-3 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">Registered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {companies.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <Building2 className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">No companies found</p>
                  </td>
                </tr>
              ) : (
                companies.map((company) => (
                  <tr 
                    key={company.id} 
                    className="hover:bg-gray-700/30 transition-all duration-200 cursor-pointer group"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-teal-500/20 flex items-center justify-center group-hover:from-cyan-500/30 group-hover:to-teal-500/30 transition-all">
                          <Building2 className="w-5 h-5 text-cyan-400" />
                        </div>
                        <span className="text-white font-medium group-hover:text-cyan-400 transition-colors">{company.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-gray-400 text-sm">{company.email}</td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                        {company.planName || 'N/A'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <StatusBadge status={company.subscriptionStatus || 'Trial'} />
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-300 font-medium">{company.userCount || 0}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-gray-400 text-sm">
                      {company.createdAt ? new Date(company.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add animations */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideDown {
          animation: slideDown 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

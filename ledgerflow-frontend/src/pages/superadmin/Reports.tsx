import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Download,
  Building2,
  Users,
  Activity,
  AlertCircle,
  Clock,
  CheckCircle,
  Calendar,
  RefreshCw
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { StatsCard } from '../../components/superadmin/StatsCard';
import { reportsService, type PlatformOverview, type CompanyGrowthDataPoint, type UserActivityDataPoint, type SubscriptionDistribution, type ExpenseByCompany, type ExpenseByCategory, type TopCompany, type MostActiveUser, type RecentActivity, type SystemHealth } from '../../services/reports.service';
import { PesoIcon } from '../../components/icons/PesoIcon';
import { ExportModal, type ExportFormat } from '../../components/common/ExportModal';
import { ToastContainer } from '../../components/common/Toast';
import { useToast } from '../../hooks/useToast';
import { exportReportsToPDF, exportReportsToExcel } from '../../utils/exportUtils';

const COLORS = ['#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export const Reports: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  const { toasts, removeToast, success, error: showError } = useToast();
  
  // Data states
  const [overview, setOverview] = useState<PlatformOverview | null>(null);
  const [companyGrowth, setCompanyGrowth] = useState<CompanyGrowthDataPoint[]>([]);
  const [userActivity, setUserActivity] = useState<UserActivityDataPoint[]>([]);
  const [subscriptionDist, setSubscriptionDist] = useState<SubscriptionDistribution[]>([]);
  const [expensesByCompany, setExpensesByCompany] = useState<ExpenseByCompany[]>([]);
  const [expensesByCategory, setExpensesByCategory] = useState<ExpenseByCategory[]>([]);
  const [topCompanies, setTopCompanies] = useState<TopCompany[]>([]);
  const [mostActiveUsers, setMostActiveUsers] = useState<MostActiveUser[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);

  // Filters
  const [growthPeriod, setGrowthPeriod] = useState(6);
  const [activityPeriod, setActivityPeriod] = useState(30);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        overviewData,
        growthData,
        activityData,
        distData,
        expCompanyData,
        expCategoryData,
        topCompData,
        activeUsersData,
        activitiesData
      ] = await Promise.all([
        reportsService.getPlatformOverview(),
        reportsService.getCompanyGrowth(growthPeriod),
        reportsService.getUserActivity(activityPeriod),
        reportsService.getSubscriptionDistribution(),
        reportsService.getExpensesByCompany(10),
        reportsService.getExpensesByCategory(),
        reportsService.getTopCompanies(10),
        reportsService.getMostActiveUsers(10),
        reportsService.getRecentActivities(20)
      ]);

      setOverview(overviewData);
      setCompanyGrowth(growthData);
      setUserActivity(activityData);
      setSubscriptionDist(distData);
      setExpensesByCompany(expCompanyData);
      setExpensesByCategory(expCategoryData);
      setTopCompanies(topCompData);
      setMostActiveUsers(activeUsersData);
      setRecentActivities(activitiesData);
    } catch (error: any) {
      console.error('Error fetching reports data:', error);
      setError(error.response?.data?.message || 'Failed to load reports data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
  };

  const handleExport = (format: ExportFormat) => {
    setIsExporting(true);
    
    try {
      const exportData = {
        overview,
        companyGrowth,
        userActivity,
        subscriptionDist,
        expensesByCategory,
        topCompanies,
        mostActiveUsers
      };

      if (format === 'pdf') {
        exportReportsToPDF(exportData);
        success('Platform report exported successfully as PDF');
      } else if (format === 'excel') {
        exportReportsToExcel(exportData);
        success('Platform report exported successfully as Excel');
      }
      
      setShowExportModal(false);
    } catch (error) {
      console.error('Export error:', error);
      showError('Failed to export report. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-8 bg-gray-700 rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-32 bg-gray-800/50 rounded-xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-96 bg-gray-800/50 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Platform Reports</h1>
          <p className="text-gray-400">Analytics and insights across the platform</p>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <p className="font-semibold text-red-400 mb-2">Error Loading Reports</p>
              <p className="text-sm text-red-300 mb-4">{error}</p>
              <button 
                onClick={fetchAllData}
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Platform Reports</h1>
          <p className="text-gray-400">Analytics and insights across the platform</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors font-medium"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="group relative p-2.5 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700/50 hover:border-cyan-500/30 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Refresh"
          >
            <RefreshCw className={`w-5 h-5 text-gray-300 group-hover:text-cyan-400 transition-all duration-500 ${refreshing ? 'animate-spin' : 'group-hover:rotate-180'}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Companies"
          subtitle="All registered companies"
          value={overview?.totalCompanies || 0}
          icon={<Building2 className="w-6 h-6 text-cyan-400" />}
          color="cyan"
        />
        <StatsCard
          title="Active Companies"
          subtitle="Currently active"
          value={overview?.activeCompanies || 0}
          icon={<CheckCircle className="w-6 h-6 text-green-400" />}
          color="green"
        />
        <StatsCard
          title="Total Users"
          subtitle="Platform-wide users"
          value={overview?.totalUsers || 0}
          icon={<Users className="w-6 h-6 text-purple-400" />}
          color="purple"
        />
        <StatsCard
          title="Total Expenses"
          subtitle="All submitted expenses"
          value={overview?.totalExpenses || 0}
          icon={<PesoIcon className="w-6 h-6 text-yellow-400" />}
          color="yellow"
        />
        <StatsCard
          title="Total Revenue"
          subtitle="All expense amounts"
          value={formatCurrency(overview?.totalExpenseAmount || 0)}
          icon={<PesoIcon className="w-6 h-6 text-green-400" />}
          color="green"
        />
        <StatsCard
          title="Trial Companies"
          subtitle="On trial period"
          value={overview?.trialCompanies || 0}
          icon={<Clock className="w-6 h-6 text-yellow-400" />}
          color="yellow"
        />
        <StatsCard
          title="Expired Subscriptions"
          subtitle="Needs renewal"
          value={overview?.expiredCompanies || 0}
          icon={<AlertCircle className="w-6 h-6 text-red-400" />}
          color="red"
        />
        <StatsCard
          title="Active Sessions"
          subtitle="Logged in today"
          value={overview?.activeSessions || 0}
          icon={<Activity className="w-6 h-6 text-cyan-400" />}
          color="cyan"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Company Growth Chart */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-cyan-400" />
              <h3 className="text-lg font-semibold text-white">Company Growth</h3>
            </div>
            <select
              value={growthPeriod}
              onChange={(e) => {
                setGrowthPeriod(Number(e.target.value));
                reportsService.getCompanyGrowth(Number(e.target.value)).then(setCompanyGrowth);
              }}
              className="px-3 py-1 bg-gray-900/50 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
            >
              <option value={3}>Last 3 Months</option>
              <option value={6}>Last 6 Months</option>
              <option value={12}>Last 12 Months</option>
            </select>
          </div>
          {companyGrowth.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={companyGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  dot={{ fill: '#06b6d4', r: 4 }}
                  activeDot={{ r: 6 }}
                  name="New Companies"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400">
              No company growth data available
            </div>
          )}
        </div>

        {/* User Activity Chart */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Activity className="w-6 h-6 text-green-400" />
              <h3 className="text-lg font-semibold text-white">User Activity</h3>
            </div>
            <select
              value={activityPeriod}
              onChange={(e) => {
                setActivityPeriod(Number(e.target.value));
                reportsService.getUserActivity(Number(e.target.value)).then(setUserActivity);
              }}
              className="px-3 py-1 bg-gray-900/50 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
            >
              <option value={7}>Last 7 Days</option>
              <option value={14}>Last 14 Days</option>
              <option value={30}>Last 30 Days</option>
            </select>
          </div>
          {userActivity.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={userActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="uniqueUsers"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.3}
                  name="Unique Users"
                />
                <Area
                  type="monotone"
                  dataKey="loginCount"
                  stroke="#06b6d4"
                  fill="#06b6d4"
                  fillOpacity={0.2}
                  name="Total Logins"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400">
              No user activity data available
            </div>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subscription Distribution */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <BarChart3 className="w-6 h-6 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Subscription Distribution</h3>
          </div>
          {subscriptionDist.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={subscriptionDist}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry: any) => `${entry.status}: ${entry.count}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {subscriptionDist.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400">
              No subscription data available
            </div>
          )}
        </div>

        {/* Expenses by Category */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <PesoIcon className="w-6 h-6 text-yellow-400" />
            <h3 className="text-lg font-semibold text-white">Expenses by Category</h3>
          </div>
          {expensesByCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={expensesByCategory} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis type="number" stroke="#9ca3af" />
                <YAxis dataKey="category" type="category" stroke="#9ca3af" width={100} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                  formatter={(value: any) => formatCurrency(Number(value))}
                />
                <Legend />
                <Bar dataKey="totalAmount" fill="#f59e0b" name="Total Amount" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400">
              No expense category data available
            </div>
          )}
        </div>
      </div>

      {/* Expenses by Company */}
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <Building2 className="w-6 h-6 text-cyan-400" />
          <h3 className="text-lg font-semibold text-white">Top Companies by Expenses</h3>
        </div>
        {expensesByCompany.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={expensesByCompany}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="companyName" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#fff'
                }}
                formatter={(value: any) => formatCurrency(Number(value))}
              />
              <Legend />
              <Bar dataKey="totalAmount" fill="#06b6d4" name="Total Amount" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-gray-400">
            No expense data available
          </div>
        )}
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Companies Table */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Top Companies</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Company</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Users</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Expenses</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Amount</th>
                </tr>
              </thead>
              <tbody>
                {topCompanies.length > 0 ? (
                  topCompanies.map((company) => (
                    <tr key={company.id} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                      <td className="py-3 px-4 text-white text-sm">{company.name}</td>
                      <td className="py-3 px-4 text-gray-400 text-sm">{company.userCount}</td>
                      <td className="py-3 px-4 text-gray-400 text-sm">{company.expenseCount}</td>
                      <td className="py-3 px-4 text-cyan-400 text-sm font-semibold">
                        {formatCurrency(company.totalExpenseAmount)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-400 text-sm">
                      No company data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Most Active Users Table */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Most Active Users</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">User</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Company</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Activity</th>
                </tr>
              </thead>
              <tbody>
                {mostActiveUsers.length > 0 ? (
                  mostActiveUsers.map((user) => (
                    <tr key={user.userId} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                      <td className="py-3 px-4 text-white text-sm">{user.userName}</td>
                      <td className="py-3 px-4 text-gray-400 text-sm">{user.companyName}</td>
                      <td className="py-3 px-4 text-cyan-400 text-sm font-semibold">{user.activityCount}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-gray-400 text-sm">
                      No user activity data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="w-6 h-6 text-cyan-400" />
          <h3 className="text-lg font-semibold text-white">Recent Platform Activities</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Timestamp</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Company</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">User</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Action</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Details</th>
              </tr>
            </thead>
            <tbody>
              {recentActivities.length > 0 ? (
                recentActivities.map((activity) => (
                  <tr key={activity.id} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                    <td className="py-3 px-4 text-gray-400 text-sm">
                      {new Date(activity.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-gray-300 text-sm">{activity.companyName}</td>
                    <td className="py-3 px-4 text-gray-300 text-sm">{activity.userName}</td>
                    <td className="py-3 px-4 text-sm">
                      <span className="px-2 py-1 bg-cyan-500/10 text-cyan-400 rounded text-xs">
                        {activity.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-400 text-sm">{activity.details || '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400 text-sm">
                    No recent activities
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        title="Export Platform Report"
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
        availableFormats={['pdf', 'excel']}
        isLoading={isExporting}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
};

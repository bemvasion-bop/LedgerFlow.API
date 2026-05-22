import React, { useEffect, useState } from 'react';
import { 
  Wallet, 
  Clock, 
  CheckCircle,
  TrendingUp,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { PageContainer } from '../../components/layout';
import { Card, DataTable, StatusBadge } from '../../components/ui';
import { KpiCard, NavigationCard, StatsGrid } from '../../components/dashboard';
import { PageHeader } from '../../components/common/PageHeader';
import api from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { usePermissions } from '../../hooks/usePermissions';

interface ExpenseStats {
  totalExpenses: number;
  totalAmount: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  reimbursedCount: number;
}

interface UserStats {
  activeUsers: number;
}

interface RecentExpense {
  id: number;
  userName: string;
  description: string;
  amount: number;
  category: string;
  status: string;
  submittedAt: string;
}

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<ExpenseStats | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [recentExpenses, setRecentExpenses] = useState<RecentExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { permissions } = usePermissions();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [statsRes, expensesRes, usersRes] = await Promise.all([
        api.get('/expenses/stats'),
        api.get('/expenses', { params: { pageSize: 5 } }),
        api.get('/admin/users').catch(() => ({ data: [] })) // Fallback if endpoint doesn't exist
      ]);
      
      setStats(statsRes.data);
      setRecentExpenses(expensesRes.data);
      
      // Calculate active users from response
      const users = Array.isArray(usersRes.data) ? usersRes.data : [];
      const activeCount = users.filter((u: any) => u.isActive).length;
      setUserStats({ activeUsers: activeCount });
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      setError(error.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
  };

  const tableColumns = [
    { header: 'Employee', accessor: 'userName', cell: (value: string) => <span className="text-white font-medium">{value}</span> },
    { header: 'Description', accessor: 'description', className: 'text-gray-300' },
    { header: 'Category', accessor: 'category', className: 'text-gray-400' },
    { header: 'Amount', accessor: 'amount', cell: (value: number) => <span className="text-white font-semibold">{formatCurrency(value)}</span> },
    { header: 'Status', accessor: 'status', cell: (value: string) => <StatusBadge status={value} variant="expense" /> },
    { header: 'Submitted', accessor: 'submittedAt', cell: (value: string) => <span className="text-gray-400 text-sm">{formatDate(value)}</span> },
  ];

  if (loading) {
    return (
      <PageContainer>
        <div className="space-y-8 animate-pulse">
          <div className="h-8 bg-gray-700 rounded w-1/4"></div>
          <StatsGrid>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-800/50 rounded-xl"></div>
            ))}
          </StatsGrid>
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-gray-400">Manage your company's expense system</p>
        </div>
        <Card>
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <p className="font-semibold text-red-400 mb-2">Error Loading Dashboard</p>
              <p className="text-sm text-red-300 mb-4">{error}</p>
              <button 
                onClick={fetchData}
                className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors font-medium"
              >
                Retry
              </button>
            </div>
          </div>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader 
        title="Admin Dashboard" 
        subtitle="Manage your company's expense system"
        onRefresh={handleRefresh}
        refreshing={refreshing}
      />

      {/* KPI Cards - Mix of Stats and Navigation */}
      <StatsGrid>
        <KpiCard
          title="Total Expenses"
          value={stats?.totalExpenses || 0}
          subtitle="Click to view all"
          icon={<Wallet className="w-6 h-6" />}
          color="cyan"
          href="/admin/expenses"
        />
        <NavigationCard
          title="Total Amount"
          subtitle="View Reports & Analytics"
          icon={<TrendingUp className="w-6 h-6" />}
          color="green"
          href="/admin/reports"
        />
        <KpiCard
          title={permissions.isStarterPlan ? "Pending Review" : "Pending Approvals"}
          value={stats?.pendingCount || 0}
          subtitle={permissions.isStarterPlan ? "Awaiting your review" : "Requires Finance review"}
          icon={<Clock className="w-6 h-6" />}
          color="yellow"
          href="/admin/expenses?status=pending"
        />
        {permissions.isStarterPlan ? (
          <KpiCard
            title="Ready for Payment"
            value={stats?.approvedCount || 0}
            subtitle="Click to process reimbursements"
            icon={<CheckCircle className="w-6 h-6" />}
            color="green"
            href="/admin/reimbursements"
          />
        ) : (
          <KpiCard
            title="Approved"
            value={stats?.approvedCount || 0}
            subtitle="View approved expenses"
            icon={<CheckCircle className="w-6 h-6" />}
            color="green"
            href="/admin/expenses?status=approved"
          />
        )}
      </StatsGrid>

      {/* Expense Breakdown Card */}
      <Card>
        <h3 className="text-lg font-semibold text-white mb-6">Expense Breakdown</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Pending</span>
            <span className="text-white font-bold text-lg">{stats?.pendingCount || 0}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Approved</span>
            <span className="text-white font-bold text-lg">{stats?.approvedCount || 0}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Rejected</span>
            <span className="text-white font-bold text-lg">{stats?.rejectedCount || 0}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Reimbursed</span>
            <span className="text-white font-bold text-lg">{stats?.reimbursedCount || 0}</span>
          </div>
        </div>
      </Card>

      {/* Recent Expenses */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Expenses</h3>
        <DataTable 
          columns={tableColumns}
          data={recentExpenses}
          emptyMessage="No expenses found"
        />
      </div>
    </PageContainer>
  );
};

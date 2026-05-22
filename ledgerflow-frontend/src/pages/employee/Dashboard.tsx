import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  CreditCard,
  AlertCircle
} from 'lucide-react';
import { PageContainer } from '../../components/layout';
import { Card, DataTable, StatusBadge } from '../../components/ui';
import { KpiCard, StatsGrid } from '../../components/dashboard';
import { PageHeader } from '../../components/common/PageHeader';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/helpers';

interface EmployeeStats {
  totalSubmitted: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  reimbursedCount: number;
  reimbursedAmount: number;
}

interface MyExpense {
  id: number;
  description: string;
  amount: number;
  category: string;
  status: string;
  submittedAt: string;
}

export const EmployeeDashboard: React.FC = () => {
  const [stats, setStats] = useState<EmployeeStats | null>(null);
  const [recentExpenses, setRecentExpenses] = useState<MyExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [statsRes, expensesRes] = await Promise.all([
        api.get('/expenses/my-stats'),
        api.get('/expenses/my-expenses', { params: { pageSize: 5 } })
      ]);
      
      setStats(statsRes.data);
      setRecentExpenses(expensesRes.data);
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
    { header: 'ID', accessor: 'id', cell: (value: number) => <span className="text-gray-400">#{value}</span> },
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
          <h1 className="text-3xl font-bold text-white mb-2">My Dashboard</h1>
          <p className="text-gray-400">Track your expense submissions</p>
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
        title="My Dashboard" 
        subtitle="Track your expense submissions"
        onRefresh={handleRefresh}
        refreshing={refreshing}
      />

      {/* KPI Cards */}
      <StatsGrid>
        <KpiCard
          title="Total Expenses"
          value={stats?.totalSubmitted || 0}
          subtitle="All submissions"
          icon={<FileText className="w-6 h-6" />}
          color="cyan"
          onClick={() => navigate('/employee/expenses')}
        />
        <KpiCard
          title="Pending"
          value={stats?.pendingCount || 0}
          subtitle="Awaiting approval"
          icon={<Clock className="w-6 h-6" />}
          color="yellow"
          onClick={() => navigate('/employee/expenses?filter=Pending')}
        />
        <KpiCard
          title="Approved"
          value={stats?.approvedCount || 0}
          subtitle="Ready for payment"
          icon={<CheckCircle className="w-6 h-6" />}
          color="green"
          onClick={() => navigate('/employee/expenses?filter=Approved')}
        />
        <KpiCard
          title="Reimbursed"
          value={stats?.reimbursedCount || 0}
          subtitle="Completed"
          icon={<CreditCard className="w-6 h-6" />}
          color="purple"
          onClick={() => navigate('/employee/expenses?filter=Reimbursed')}
        />
      </StatsGrid>

      {/* Recent Submissions */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Recent Submissions</h3>
        <DataTable 
          columns={tableColumns}
          data={recentExpenses}
          emptyMessage="No expenses submitted yet"
        />
      </div>
    </PageContainer>
  );
};

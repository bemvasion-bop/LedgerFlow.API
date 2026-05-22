import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Clock, 
  CheckCircle, 
  CreditCard, 
  AlertCircle,
  Wallet,
  BarChart3
} from 'lucide-react';
import { PageContainer } from '../../components/layout';
import { Card, DataTable, StatusBadge } from '../../components/ui';
import { KpiCard, StatsGrid } from '../../components/dashboard';
import { PageHeader } from '../../components/common/PageHeader';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/helpers';

interface FinanceStats {
  pendingApprovals: number;
  approvedExpenses: number;
  totalReimbursements: number;
  monthlyDisbursement: number;
}

interface PendingExpense {
  id: number;
  userName: string;
  description: string;
  amount: number;
  category: string;
  submittedAt: string;
}

export const FinanceDashboard: React.FC = () => {
  const [stats, setStats] = useState<FinanceStats | null>(null);
  const [pendingExpenses, setPendingExpenses] = useState<PendingExpense[]>([]);
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
      
      const [statsRes, pendingRes] = await Promise.all([
        api.get('/expenses/stats'),
        api.get('/approvals/pending', { params: { pageSize: 5 } })
      ]);
      
      setStats({
        pendingApprovals: statsRes.data.pendingCount || 0,
        approvedExpenses: statsRes.data.approvedCount || 0,
        totalReimbursements: statsRes.data.reimbursedCount || 0,
        monthlyDisbursement: statsRes.data.totalAmount || 0
      });
      setPendingExpenses(pendingRes.data);
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

  const quickActions = [
    { icon: <Clock className="w-5 h-5" />, label: 'Pending Approvals', href: '/finance/pending', description: 'Review waiting items' },
    { icon: <CreditCard className="w-5 h-5" />, label: 'Reimbursements', href: '/finance/reimbursements', description: 'Manage payments' },
    { icon: <BarChart3 className="w-5 h-5" />, label: 'Financial Reports', href: '/finance/reports', description: 'Generate reports' },
  ];

  const tableColumns = [
    { header: 'ID', accessor: 'id', cell: (value: number) => <span className="text-gray-400">#{value}</span> },
    { header: 'Employee', accessor: 'userName', cell: (value: string) => <span className="text-white font-medium">{value}</span> },
    { header: 'Description', accessor: 'description', className: 'text-gray-300' },
    { header: 'Category', accessor: 'category', className: 'text-gray-400' },
    { header: 'Amount', accessor: 'amount', cell: (value: number) => <span className="text-white font-semibold">{formatCurrency(value)}</span> },
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
          <h1 className="text-3xl font-bold text-white mb-2">Finance Dashboard</h1>
          <p className="text-gray-400">Manage approvals and reimbursements</p>
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
        title="Finance Dashboard" 
        subtitle="Manage approvals and reimbursements"
        onRefresh={handleRefresh}
        refreshing={refreshing}
      />

      {/* KPI Cards */}
      <div className="mb-10">
        <StatsGrid>
          <KpiCard
            title="Pending Approvals"
            value={stats?.pendingApprovals || 0}
            subtitle="Waiting for finance review"
            icon={<Clock className="w-6 h-6" />}
            color="yellow"
            onClick={() => navigate('/finance/pending')}
          />
          <KpiCard
            title="Approved Expenses"
            value={stats?.approvedExpenses || 0}
            subtitle="Ready for reimbursement"
            icon={<CheckCircle className="w-6 h-6" />}
            color="cyan"
            onClick={() => navigate('/finance/reimbursements')}
          />
          <KpiCard
            title="Reimbursed"
            value={stats?.totalReimbursements || 0}
            subtitle="Payments completed"
            icon={<CreditCard className="w-6 h-6" />}
            color="green"
            onClick={() => navigate('/finance/reimbursements')}
          />
          <KpiCard
            title="Total Disbursed"
            value={formatCurrency(stats?.monthlyDisbursement || 0)}
            subtitle="Total reimbursed amount"
            icon={<Wallet className="w-6 h-6" />}
            color="purple"
            onClick={() => navigate('/finance/reports')}
          />
        </StatsGrid>
      </div>

      {/* Pending Approvals */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Recent Pending Approvals</h3>
        <DataTable 
          columns={tableColumns}
          data={pendingExpenses}
          emptyMessage="No pending approvals"
        />
      </div>
    </PageContainer>
  );
};

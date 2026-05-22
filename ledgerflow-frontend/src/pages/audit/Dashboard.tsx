import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  AlertTriangle, 
  Activity,
  AlertCircle,
  Eye,
  CheckCircle
} from 'lucide-react';
import { PageContainer } from '../../components/layout';
import { Card, DataTable } from '../../components/ui';
import { KpiCard, StatsGrid } from '../../components/dashboard';
import { PageHeader } from '../../components/common/PageHeader';
import { ExpenseReviewModal } from '../../components/common/ExpenseReviewModal';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/helpers';

interface AuditStats {
  totalExpenses: number;
  pendingCompliance: number;
  reimbursedExpenses: number;
  auditFlags: number;
}

interface RecentExpense {
  id: number;
  userId: number;
  userName: string;
  description: string;
  category: string;
  amount: number;
  status: string;
  submittedAt: string;
  receiptUrl?: string;
  receipts?: Array<{
    id: number;
    fileName: string;
    fileUrl: string;
  }>;
}

interface AuditLog {
  id: number;
  userName: string;
  action: string;
  entity: string;
  timestamp: string;
}

interface ComplianceAlert {
  id: number;
  type: string;
  message: string;
  severity: 'high' | 'medium' | 'low';
  expenseId?: number;
}

export const AuditorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [recentExpenses, setRecentExpenses] = useState<RecentExpense[]>([]);
  const [recentLogs, setRecentLogs] = useState<AuditLog[]>([]);
  const [complianceAlerts, setComplianceAlerts] = useState<ComplianceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [reviewModal, setReviewModal] = useState<RecentExpense | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch expenses and audit logs
      const [expensesRes, logsRes] = await Promise.all([
        api.get('/expenses', { params: { pageSize: 10 } }).catch(() => ({ data: [] })),
        api.get('/auditlogs', { params: { pageSize: 5 } }).catch(() => ({ data: [] }))
      ]);
      
      const expenses = Array.isArray(expensesRes.data) ? expensesRes.data : [];
      const logs = Array.isArray(logsRes.data) ? logsRes.data : 
                   (logsRes.data?.data && Array.isArray(logsRes.data.data) ? logsRes.data.data : []);

      // Calculate stats
      const pending = expenses.filter((e: any) => e.status === 'Pending').length;
      const reimbursed = expenses.filter((e: any) => e.status === 'Reimbursed').length;
      
      // Detect compliance issues
      const alerts: ComplianceAlert[] = [];
      expenses.forEach((exp: any) => {
        // Check if receipt is truly missing (no receiptUrl AND no receipts array with items)
        const hasReceipt = exp.receiptUrl || (exp.receipts && exp.receipts.length > 0);
        if (!hasReceipt) {
          alerts.push({
            id: exp.id,
            type: 'Missing Receipt',
            message: `Expense #${exp.id} by ${exp.userName} has no receipt`,
            severity: 'high',
            expenseId: exp.id
          });
        }
        
        if (exp.status === 'Pending') {
          const daysPending = Math.floor(
            (new Date().getTime() - new Date(exp.submittedAt).getTime()) / (1000 * 60 * 60 * 24)
          );
          if (daysPending > 7) {
            alerts.push({
              id: exp.id,
              type: 'Pending Too Long',
              message: `Expense #${exp.id} pending for ${daysPending} days`,
              severity: 'medium',
              expenseId: exp.id
            });
          }
        }

        if (exp.status === 'Reimbursed' && !exp.approvedAt) {
          alerts.push({
            id: exp.id,
            type: 'Missing Approval Date',
            message: `Expense #${exp.id} reimbursed without approval date`,
            severity: 'high',
            expenseId: exp.id
          });
        }
      });

      setStats({
        totalExpenses: expenses.length,
        pendingCompliance: pending,
        reimbursedExpenses: reimbursed,
        auditFlags: alerts.length
      });
      
      setRecentExpenses(expenses.slice(0, 5));
      setRecentLogs(logs.slice(0, 5));
      setComplianceAlerts(alerts.slice(0, 5));
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

  const handleViewExpense = (expenseId: number) => {
    const expense = recentExpenses.find(e => e.id === expenseId);
    if (expense) {
      setReviewModal(expense);
    }
  };

  const closeReviewModal = () => {
    setReviewModal(null);
  };

  const expenseColumns = [
    { header: 'Employee', accessor: 'userName', cell: (value: string) => <span className="text-white font-medium">{value}</span> },
    { header: 'Description', accessor: 'description', className: 'text-gray-300' },
    { header: 'Category', accessor: 'category', className: 'text-gray-400' },
    { header: 'Amount', accessor: 'amount', cell: (value: number) => <span className="text-white font-semibold">{formatCurrency(value)}</span> },
    { 
      header: 'Status', 
      accessor: 'status', 
      cell: (value: string) => <span className="text-white">{value}</span>
    },
    { header: 'Submitted', accessor: 'submittedAt', cell: (value: string) => <span className="text-gray-400 text-sm">{formatDate(value)}</span> },
  ];

  const logColumns = [
    { header: 'User', accessor: 'userName', cell: (value: string) => <span className="text-white font-medium">{value}</span> },
    { header: 'Action', accessor: 'action', cell: (value: string) => <span className="text-white font-semibold text-sm uppercase">{value}</span> },
    { header: 'Module', accessor: 'entity', className: 'text-gray-400' },
    { header: 'Timestamp', accessor: 'timestamp', cell: (value: string) => <span className="text-gray-400 text-sm">{formatDateTime(value)}</span> },
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
          <h1 className="text-3xl font-bold text-white mb-2">Auditor Dashboard</h1>
          <p className="text-gray-400">Read-only monitoring and compliance</p>
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
        title="Auditor Dashboard" 
        subtitle="Read-only monitoring and compliance tracking"
        onRefresh={handleRefresh}
        refreshing={refreshing}
      />

      {/* KPI Cards */}
      <div className="mb-10">
        <StatsGrid>
          <KpiCard
            title="Total Expenses Reviewed"
            value={stats?.totalExpenses || 0}
            subtitle="All submissions"
            icon={<Eye className="w-6 h-6" />}
            color="cyan"
            onClick={() => navigate('/audit/expenses')}
          />
          <KpiCard
            title="Pending Compliance Checks"
            value={stats?.pendingCompliance || 0}
            subtitle="Awaiting review"
            icon={<AlertTriangle className="w-6 h-6" />}
            color="yellow"
            onClick={() => navigate('/audit/compliance')}
          />
          <KpiCard
            title="Reimbursed Expenses"
            value={stats?.reimbursedExpenses || 0}
            subtitle="Completed"
            icon={<CheckCircle className="w-6 h-6" />}
            color="green"
            onClick={() => navigate('/audit/expenses')}
          />
          <KpiCard
            title="Audit Flags"
            value={stats?.auditFlags || 0}
            subtitle="Requires attention"
            icon={<Shield className="w-6 h-6" />}
            color="red"
            onClick={() => navigate('/audit/compliance')}
          />
        </StatsGrid>
      </div>

      {/* Recent Expense Activity */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Expense Activity</h3>
        <DataTable 
          columns={expenseColumns}
          data={recentExpenses}
          emptyMessage="No recent expenses"
        />
      </div>

      {/* Recent Audit Logs */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Audit Logs</h3>
        <DataTable 
          columns={logColumns}
          data={recentLogs}
          emptyMessage="No audit logs found"
        />
      </div>

      {/* Compliance Alerts */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Compliance Alerts</h3>
        {complianceAlerts.length === 0 ? (
          <Card>
            <div className="flex items-center gap-3 text-green-400">
              <CheckCircle className="w-5 h-5" />
              <span>No compliance issues detected</span>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {complianceAlerts.map((alert, idx) => (
              <Card key={idx}>
                <div className="flex items-start gap-4">
                  {alert.severity === 'high' && <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-1" />}
                  {alert.severity === 'medium' && <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-1" />}
                  {alert.severity === 'low' && <Activity className="w-5 h-5 text-blue-400 flex-shrink-0 mt-1" />}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-sm font-semibold uppercase ${
                        alert.severity === 'high' ? 'text-red-400' :
                        alert.severity === 'medium' ? 'text-yellow-400' : 'text-blue-400'
                      }`}>
                        {alert.type}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        alert.severity === 'high' ? 'bg-red-500/20 text-red-400' :
                        alert.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {alert.severity}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm">{alert.message}</p>
                  </div>
                  {alert.expenseId && (
                    <button
                      onClick={() => handleViewExpense(alert.expenseId!)}
                      className="text-cyan-400 hover:text-cyan-300 text-sm font-medium"
                    >
                      View →
                    </button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Expense Review Modal - Read-Only for Auditor */}
      <ExpenseReviewModal
        expense={reviewModal}
        isOpen={!!reviewModal}
        onClose={closeReviewModal}
        readonly={true}
      />
    </PageContainer>
  );
};

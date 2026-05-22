import React, { useEffect, useState } from 'react';
import { 
  Download,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  BarChart, 
  Bar, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { PageContainer } from '../../components/layout';
import { PageHeader } from '../../components/ui';
import api from '../../services/api';
import { formatCurrency } from '../../utils/helpers';

interface ExpenseStats {
  totalExpenses: number;
  totalAmount: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  reimbursedCount: number;
  pendingAmount?: number;
  approvedAmount?: number;
  rejectedAmount?: number;
  reimbursedAmount?: number;
}

interface CategoryData {
  category: string;
  amount: number;
  count: number;
}

interface MonthlyData {
  month: string;
  amount: number;
  count: number;
}

const COLORS = {
  pending: '#facc15',
  approved: '#22c55e',
  rejected: '#ef4444',
  reimbursed: '#a855f7',
};

export const Reports: React.FC = () => {
  const [stats, setStats] = useState<ExpenseStats | null>(null);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
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
      
      // Fetch all expenses for analysis
      const expensesRes = await api.get('/expenses', { params: { pageSize: 1000 } });
      const expenses = expensesRes.data;

      // Calculate stats from expenses
      const pendingExpenses = expenses.filter((exp: any) => exp.status.toLowerCase() === 'pending');
      const approvedExpenses = expenses.filter((exp: any) => exp.status.toLowerCase() === 'approved');
      const rejectedExpenses = expenses.filter((exp: any) => exp.status.toLowerCase() === 'rejected');
      const reimbursedExpenses = expenses.filter((exp: any) => exp.status.toLowerCase() === 'reimbursed');

      const calculatedStats: ExpenseStats = {
        totalExpenses: expenses.length,
        totalAmount: expenses.reduce((sum: number, exp: any) => sum + exp.amount, 0),
        pendingCount: pendingExpenses.length,
        approvedCount: approvedExpenses.length,
        rejectedCount: rejectedExpenses.length,
        reimbursedCount: reimbursedExpenses.length,
        pendingAmount: pendingExpenses.reduce((sum: number, exp: any) => sum + exp.amount, 0),
        approvedAmount: approvedExpenses.reduce((sum: number, exp: any) => sum + exp.amount, 0),
        rejectedAmount: rejectedExpenses.reduce((sum: number, exp: any) => sum + exp.amount, 0),
        reimbursedAmount: reimbursedExpenses.reduce((sum: number, exp: any) => sum + exp.amount, 0),
      };

      setStats(calculatedStats);

      // Calculate category breakdown
      const categoryMap = new Map<string, { amount: number; count: number }>();
      expenses.forEach((exp: any) => {
        const existing = categoryMap.get(exp.category) || { amount: 0, count: 0 };
        categoryMap.set(exp.category, {
          amount: existing.amount + exp.amount,
          count: existing.count + 1
        });
      });
      const categories = Array.from(categoryMap.entries()).map(([category, data]) => ({
        category,
        ...data
      }));
      setCategoryData(categories);

      // Calculate monthly breakdown (last 6 months)
      const monthlyMap = new Map<string, { amount: number; count: number }>();
      expenses.forEach((exp: any) => {
        const date = new Date(exp.submittedAt);
        const monthKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        const existing = monthlyMap.get(monthKey) || { amount: 0, count: 0 };
        monthlyMap.set(monthKey, {
          amount: existing.amount + exp.amount,
          count: existing.count + 1
        });
      });
      const monthly = Array.from(monthlyMap.entries())
        .map(([month, data]) => ({ month, ...data }))
        .slice(-6); // Last 6 months
      setMonthlyData(monthly);

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
    await fetchData();
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    alert('Export functionality coming soon!');
  };

  // Prepare status pie chart data
  const statusData = stats ? [
    { name: 'Pending', value: stats.pendingCount, color: COLORS.pending },
    { name: 'Approved', value: stats.approvedCount, color: COLORS.approved },
    { name: 'Rejected', value: stats.rejectedCount, color: COLORS.rejected },
    { name: 'Reimbursed', value: stats.reimbursedCount, color: COLORS.reimbursed },
  ].filter(item => item.value > 0) : [];

  if (loading) {
    return (
      <PageContainer>
        <div className="space-y-8 animate-pulse">
          <div className="h-8 bg-gray-700 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="h-96 bg-gray-800/50 rounded-xl"></div>
            <div className="h-96 bg-gray-800/50 rounded-xl"></div>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <PageHeader title="Reports & Insights" subtitle="Comprehensive expense analytics and insights" />
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <p className="font-semibold text-red-400 mb-2">Error Loading Reports</p>
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
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader 
        title="Reports & Insights" 
        subtitle="Comprehensive expense analytics and insights"
        action={
          <div className="flex items-center gap-3">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
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
        }
      />

      {/* Charts Grid - Larger spacing and better layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Expense Status Pie Chart */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-8">
          <h3 className="text-xl font-semibold text-white mb-8">Expense Status Distribution</h3>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Legend 
                  wrapperStyle={{ color: '#fff' }}
                  iconType="circle"
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400">
              No data available
            </div>
          )}
        </div>

        {/* Monthly Expense Bar Chart */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Monthly Expense Trend</h3>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis 
                  dataKey="month" 
                  stroke="#94a3b8"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="#94a3b8"
                  style={{ fontSize: '12px' }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                  formatter={(value: any) => [formatCurrency(value), 'Amount']}
                />
                <Legend wrapperStyle={{ color: '#fff' }} />
                <Bar dataKey="amount" fill="#06b6d4" name="Total Amount" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400">
              No data available
            </div>
          )}
        </div>
      </div>

      {/* Category Breakdown Chart - Full Width */}
      <div className="bg-slate-900/60 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-6 mt-6">
        <h3 className="text-lg font-semibold text-white mb-6">Expense by Category</h3>
        {categoryData.length > 0 ? (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={categoryData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis 
                type="number" 
                stroke="#94a3b8"
                style={{ fontSize: '12px' }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <YAxis 
                type="category" 
                dataKey="category" 
                stroke="#94a3b8"
                style={{ fontSize: '12px' }}
                width={120}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e293b', 
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#fff'
                }}
                formatter={(value: any, name: any) => {
                  if (name === 'amount') return [formatCurrency(value), 'Amount'];
                  return [value, 'Count'];
                }}
              />
              <Legend wrapperStyle={{ color: '#fff' }} />
              <Bar dataKey="amount" fill="#22c55e" name="Total Amount" radius={[0, 8, 8, 0]} />
              <Bar dataKey="count" fill="#a855f7" name="Count" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[350px] flex items-center justify-center text-gray-400">
            No data available
          </div>
        )}
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div className="bg-slate-900/60 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Status Breakdown</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Pending</span>
              <span className="text-yellow-400 font-bold text-lg">{stats?.pendingCount || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Approved</span>
              <span className="text-green-400 font-bold text-lg">{stats?.approvedCount || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Rejected</span>
              <span className="text-red-400 font-bold text-lg">{stats?.rejectedCount || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Reimbursed</span>
              <span className="text-purple-400 font-bold text-lg">{stats?.reimbursedCount || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Top Categories</h3>
          <div className="space-y-4">
            {categoryData.slice(0, 4).map((cat, idx) => (
              <div key={idx} className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">{cat.category}</span>
                <span className="text-cyan-400 font-bold text-lg">{formatCurrency(cat.amount)}</span>
              </div>
            ))}
            {categoryData.length === 0 && (
              <div className="text-center text-gray-400 py-4">No category data available</div>
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

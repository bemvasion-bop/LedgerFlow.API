import React, { useState, useEffect } from 'react';
import { PageContainer } from '../../components/layout/PageContainer';
import { 
  CheckCircle, 
  Clock, 
  DollarSign, 
  FileText, 
  TrendingUp,
  AlertCircle,
  User,
  Calendar,
  Filter,
  Search
} from 'lucide-react';
import axios from 'axios';

interface WorkflowExpense {
  id: number;
  description: string;
  amount: number;
  category: string;
  status: string;
  submittedBy: string;
  submittedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  reviewedByFinance?: string;
  reviewedAt?: string;
  reimbursedBy?: string;
  reimbursedAt?: string;
  departmentName?: string;
}

interface WorkflowStats {
  pendingApprovals: number;
  financeReview: number;
  pendingReimbursement: number;
  completedToday: number;
}

export const AdminWorkflows: React.FC = () => {
  const [expenses, setExpenses] = useState<WorkflowExpense[]>([]);
  const [stats, setStats] = useState<WorkflowStats>({
    pendingApprovals: 0,
    financeReview: 0,
    pendingReimbursement: 0,
    completedToday: 0
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'finance' | 'reimbursement' | 'history'>('pending');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchWorkflowData();
  }, [activeTab]);

  const fetchWorkflowData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      // Fetch expenses based on active tab
      let endpoint = 'http://localhost:5256/api/expenses';
      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Filter based on tab
      let filteredExpenses = response.data;
      switch (activeTab) {
        case 'pending':
          filteredExpenses = response.data.filter((e: WorkflowExpense) => e.status === 'Pending');
          break;
        case 'finance':
          filteredExpenses = response.data.filter((e: WorkflowExpense) => e.status === 'Approved');
          break;
        case 'reimbursement':
          filteredExpenses = response.data.filter((e: WorkflowExpense) => e.status === 'Finance Review');
          break;
        case 'history':
          filteredExpenses = response.data.filter((e: WorkflowExpense) => 
            e.status === 'Reimbursed' || e.status === 'Rejected'
          );
          break;
      }

      setExpenses(filteredExpenses);

      // Calculate stats
      const pending = response.data.filter((e: WorkflowExpense) => e.status === 'Pending').length;
      const finance = response.data.filter((e: WorkflowExpense) => e.status === 'Approved').length;
      const reimbursement = response.data.filter((e: WorkflowExpense) => e.status === 'Finance Review').length;
      const today = new Date().toDateString();
      const completed = response.data.filter((e: WorkflowExpense) => 
        e.status === 'Reimbursed' && new Date(e.reimbursedAt || '').toDateString() === today
      ).length;

      setStats({
        pendingApprovals: pending,
        financeReview: finance,
        pendingReimbursement: reimbursement,
        completedToday: completed
      });

      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch workflow data:', error);
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
      'Pending': { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: Clock, label: 'Pending Approval' },
      'Approved': { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: CheckCircle, label: 'Finance Review' },
      'Finance Review': { color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: DollarSign, label: 'Pending Reimbursement' },
      'Reimbursed': { color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: CheckCircle, label: 'Reimbursed' },
      'Rejected': { color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: AlertCircle, label: 'Rejected' }
    };

    const config = statusConfig[status] || statusConfig['Pending'];
    const Icon = config.icon;

    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg border ${config.color} text-xs font-semibold`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </div>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const filteredExpenses = expenses.filter(expense =>
    expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.submittedBy.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <PageContainer
      title="Workflows"
      subtitle="Enterprise reimbursement workflow management"
      icon={CheckCircle}
    >
      {/* Workflow Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-gray-400 text-sm">Pending Approvals</div>
            <Clock className="w-5 h-5 text-yellow-400" />
          </div>
          <div className="text-3xl font-bold text-white">{stats.pendingApprovals}</div>
          <div className="text-xs text-gray-500 mt-1">Awaiting admin review</div>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-gray-400 text-sm">Finance Review</div>
            <DollarSign className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-3xl font-bold text-white">{stats.financeReview}</div>
          <div className="text-xs text-gray-500 mt-1">Approved, awaiting finance</div>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-gray-400 text-sm">Pending Reimbursement</div>
            <TrendingUp className="w-5 h-5 text-purple-400" />
          </div>
          <div className="text-3xl font-bold text-white">{stats.pendingReimbursement}</div>
          <div className="text-xs text-gray-500 mt-1">Ready for payment</div>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-gray-400 text-sm">Completed Today</div>
            <CheckCircle className="w-5 h-5 text-green-400" />
          </div>
          <div className="text-3xl font-bold text-white">{stats.completedToday}</div>
          <div className="text-xs text-gray-500 mt-1">Reimbursed today</div>
        </div>
      </div>

      {/* Workflow Tabs */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
        {/* Tab Navigation */}
        <div className="flex items-center gap-4 mb-6 border-b border-gray-700/50 pb-4">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'pending'
                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Pending Approvals
            </div>
          </button>

          <button
            onClick={() => setActiveTab('finance')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'finance'
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Finance Review
            </div>
          </button>

          <button
            onClick={() => setActiveTab('reimbursement')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'reimbursement'
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Reimbursement Queue
            </div>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'history'
                ? 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              History
            </div>
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search expenses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-900/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20"
            />
          </div>
        </div>

        {/* Expenses List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <div className="text-gray-400 text-lg mb-2">No expenses found</div>
            <div className="text-gray-500 text-sm">
              {activeTab === 'pending' && 'No expenses awaiting approval'}
              {activeTab === 'finance' && 'No expenses in finance review'}
              {activeTab === 'reimbursement' && 'No expenses pending reimbursement'}
              {activeTab === 'history' && 'No completed expenses'}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredExpenses.map((expense) => (
              <div
                key={expense.id}
                className="bg-gray-900/50 rounded-lg border border-gray-700/30 p-4 hover:border-cyan-500/30 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-white font-semibold">{expense.description}</h3>
                      {getStatusBadge(expense.status)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {expense.submittedBy}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(expense.submittedAt)}
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        {expense.category}
                      </div>
                      {expense.departmentName && (
                        <div className="flex items-center gap-1">
                          <Filter className="w-4 h-4" />
                          {expense.departmentName}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-cyan-400">
                      {formatCurrency(expense.amount)}
                    </div>
                  </div>
                </div>

                {/* Workflow Timeline */}
                {(expense.approvedAt || expense.reviewedAt || expense.reimbursedAt) && (
                  <div className="mt-4 pt-4 border-t border-gray-700/30">
                    <div className="text-xs text-gray-500 mb-2">Workflow Timeline</div>
                    <div className="flex items-center gap-4 text-xs">
                      {expense.approvedAt && (
                        <div className="flex items-center gap-2 text-green-400">
                          <CheckCircle className="w-3 h-3" />
                          <span>Approved {formatDate(expense.approvedAt)}</span>
                        </div>
                      )}
                      {expense.reviewedAt && (
                        <div className="flex items-center gap-2 text-blue-400">
                          <CheckCircle className="w-3 h-3" />
                          <span>Reviewed {formatDate(expense.reviewedAt)}</span>
                        </div>
                      )}
                      {expense.reimbursedAt && (
                        <div className="flex items-center gap-2 text-purple-400">
                          <CheckCircle className="w-3 h-3" />
                          <span>Reimbursed {formatDate(expense.reimbursedAt)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
};

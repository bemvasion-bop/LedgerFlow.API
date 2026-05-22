import React, { useState, useEffect } from 'react';
import { RefreshCw, AlertCircle, CreditCard } from 'lucide-react';
import { PageContainer } from '../layout';
import { PageHeader, Card, DataTable } from '../ui';
import api from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/helpers';

interface Reimbursement {
  id: number;
  description: string;
  category: string;
  approvedAmount: number;
  reimbursementStatus: string;
  paymentMethod: string;
  referenceNumber: string;
  processedDate: string;
  remarks: string;
  approvedAt: string;
  reimbursedAt: string;
}

export const EmployeeReimbursements: React.FC = () => {
  const [reimbursements, setReimbursements] = useState<Reimbursement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchReimbursements();
  }, []);

  const fetchReimbursements = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch expenses with Approved or Reimbursed status using the correct endpoint
      const response = await api.get('/expenses', {
        params: { pageSize: 200 }
      });
      
      // Filter for approved and reimbursed expenses
      const expenses = Array.isArray(response.data) ? response.data : [];
      const reimbursementData = expenses
        .filter((exp: any) => exp.status === 'Approved' || exp.status === 'Reimbursed')
        .map((exp: any) => ({
          id: exp.id,
          description: exp.description,
          category: exp.category,
          approvedAmount: exp.amount,
          reimbursementStatus: exp.status === 'Reimbursed' ? 'Paid' : 'Pending Reimbursement',
          paymentMethod: exp.status === 'Reimbursed' ? 'Bank Transfer' : '—',
          referenceNumber: exp.status === 'Reimbursed' ? `REF-${exp.id}-${new Date(exp.reimbursedAt || exp.approvedAt).getFullYear()}` : '—',
          processedDate: exp.reimbursedAt || exp.approvedAt,
          remarks: exp.status === 'Reimbursed' ? 'Payment completed' : 'Awaiting payment processing',
          approvedAt: exp.approvedAt,
          reimbursedAt: exp.reimbursedAt,
        }));
      
      setReimbursements(reimbursementData);
    } catch (error: any) {
      console.error('Error fetching reimbursements:', error);
      setError(error.response?.data?.message || 'Failed to load reimbursements');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchReimbursements();
  };

  // Calculate summary stats
  const summary = {
    total: reimbursements.length,
    pending: reimbursements.filter(r => r.reimbursementStatus === 'Pending Reimbursement').length,
    paid: reimbursements.filter(r => r.reimbursementStatus === 'Paid').length,
    totalAmount: reimbursements.reduce((sum, r) => sum + r.approvedAmount, 0),
    paidAmount: reimbursements
      .filter(r => r.reimbursementStatus === 'Paid')
      .reduce((sum, r) => sum + r.approvedAmount, 0),
  };

  const tableColumns = [
    { 
      header: '#', 
      accessor: 'id', 
      cell: (value: number) => <span className="text-gray-400">#{value}</span> 
    },
    { 
      header: 'Description', 
      accessor: 'description', 
      className: 'text-gray-300' 
    },
    { 
      header: 'Category', 
      accessor: 'category', 
      className: 'text-gray-400' 
    },
    { 
      header: 'Approved Amount', 
      accessor: 'approvedAmount', 
      cell: (value: number) => <span className="text-white font-semibold">{formatCurrency(value)}</span> 
    },
    { 
      header: 'Status', 
      accessor: 'reimbursementStatus',
      cell: (value: string) => <span className="text-white text-sm font-medium">{value}</span>
    },
    { 
      header: 'Payment Method', 
      accessor: 'paymentMethod', 
      className: 'text-gray-400' 
    },
    { 
      header: 'Reference Number', 
      accessor: 'referenceNumber', 
      className: 'text-gray-400 text-sm' 
    },
    { 
      header: 'Processed Date', 
      accessor: 'processedDate', 
      cell: (value: string) => <span className="text-gray-400 text-sm">{formatDate(value)}</span> 
    },
    { 
      header: 'Remarks', 
      accessor: 'remarks', 
      className: 'text-gray-400 text-sm' 
    },
  ];

  if (loading) {
    return (
      <PageContainer>
        <div className="space-y-8 animate-pulse">
          <div className="h-8 bg-gray-700 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-800/50 rounded-xl"></div>
            ))}
          </div>
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <PageHeader title="Reimbursements" subtitle="Track your payment history" />
        <Card>
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <p className="font-semibold text-red-400 mb-2">Error Loading Reimbursements</p>
              <p className="text-sm text-red-300 mb-4">{error}</p>
              <button 
                onClick={fetchReimbursements}
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
        title="Reimbursements" 
        subtitle="Track your payment history and reimbursement status"
        action={
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="group relative p-2.5 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700/50 hover:border-cyan-500/30 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Refresh"
          >
            <RefreshCw className={`w-5 h-5 text-gray-300 group-hover:text-cyan-400 transition-all duration-500 ${refreshing ? 'animate-spin' : 'group-hover:rotate-180'}`} />
          </button>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-cyan-500/10 text-cyan-400">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total Reimbursements</p>
              <p className="text-2xl font-bold text-white">{summary.total}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-yellow-500/10 text-yellow-400">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Pending Payment</p>
              <p className="text-2xl font-bold text-white">{summary.pending}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-green-500/10 text-green-400">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Paid</p>
              <p className="text-2xl font-bold text-white">{summary.paid}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-purple-500/10 text-purple-400">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total Received</p>
              <p className="text-xl font-bold text-white">{formatCurrency(summary.paidAmount)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Reimbursements Table */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Reimbursement History</h3>
        {reimbursements.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <CreditCard className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 mb-2">No reimbursements yet</p>
              <p className="text-gray-500 text-sm">
                Approved expenses will appear here for reimbursement tracking
              </p>
            </div>
          </Card>
        ) : (
          <DataTable 
            columns={tableColumns}
            data={reimbursements}
            emptyMessage="No reimbursements found"
          />
        )}
      </div>
    </PageContainer>
  );
};

export default EmployeeReimbursements;

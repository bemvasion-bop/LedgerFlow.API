import React, { useState, useEffect } from 'react';
import { FileText, Download, Calendar, TrendingUp, Wallet, Filter, RefreshCw } from 'lucide-react';
import { KpiCard, StatsGrid } from '../../components/dashboard';
import api from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/helpers';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ReportStats {
  totalApproved: number;
  totalReimbursed: number;
  pendingPayment: number;
  totalDisbursed: number;
  approvedAmount: number;
  reimbursedAmount: number;
  pendingAmount: number;
}

interface CategorySummary {
  category: string;
  count: number;
  totalAmount: number;
}

interface MonthlyData {
  month: string;
  approved: number;
  reimbursed: number;
  amount: number;
}

interface Expense {
  id: number;
  userId: number;
  userName: string;
  description: string;
  amount: number;
  category: string;
  status: string;
  submittedAt: string;
  approvedAt?: string;
  reimbursedAt?: string;
}

const FinanceReports: React.FC = () => {
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [categoryData, setCategoryData] = useState<CategorySummary[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], // Jan 1st
    endDate: new Date().toISOString().split('T')[0], // Today
  });
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    fetchReportData();
  }, [dateRange]);

  const fetchReportData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch all expenses for the date range
      const res = await api.get('/expenses', {
        params: {
          pageSize: 1000,
          // Add date range params if backend supports them
        },
      });

      const expenses = Array.isArray(res.data) ? res.data : [];

      // Filter by date range
      const filtered = expenses.filter((exp: any) => {
        const submittedDate = new Date(exp.submittedAt);
        const start = new Date(dateRange.startDate);
        const end = new Date(dateRange.endDate);
        return submittedDate >= start && submittedDate <= end;
      });

      // Store filtered expenses for export
      setFilteredExpenses(filtered);

      // Calculate stats
      const approved = filtered.filter((e: any) => e.status === 'Approved');
      const reimbursed = filtered.filter((e: any) => e.status === 'Reimbursed');
      const pending = approved.length;

      const reportStats: ReportStats = {
        totalApproved: approved.length,
        totalReimbursed: reimbursed.length,
        pendingPayment: pending,
        totalDisbursed: reimbursed.reduce((sum: number, e: any) => sum + e.amount, 0),
        approvedAmount: approved.reduce((sum: number, e: any) => sum + e.amount, 0),
        reimbursedAmount: reimbursed.reduce((sum: number, e: any) => sum + e.amount, 0),
        pendingAmount: approved.reduce((sum: number, e: any) => sum + e.amount, 0),
      };

      setStats(reportStats);

      // Calculate category summary
      const categoryMap = new Map<string, { count: number; amount: number }>();
      filtered.forEach((exp: any) => {
        const existing = categoryMap.get(exp.category) || { count: 0, amount: 0 };
        categoryMap.set(exp.category, {
          count: existing.count + 1,
          amount: existing.amount + exp.amount,
        });
      });

      const categories: CategorySummary[] = Array.from(categoryMap.entries())
        .map(([category, data]) => ({
          category,
          count: data.count,
          totalAmount: data.amount,
        }))
        .sort((a, b) => b.totalAmount - a.totalAmount);

      setCategoryData(categories);

      // Calculate monthly data (last 6 months)
      const monthlyMap = new Map<string, { approved: number; reimbursed: number; amount: number }>();
      
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        monthlyMap.set(monthKey, { approved: 0, reimbursed: 0, amount: 0 });
      }

      filtered.forEach((exp: any) => {
        const expDate = new Date(exp.submittedAt);
        const monthKey = expDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        
        if (monthlyMap.has(monthKey)) {
          const existing = monthlyMap.get(monthKey)!;
          if (exp.status === 'Approved') existing.approved++;
          if (exp.status === 'Reimbursed') {
            existing.reimbursed++;
            existing.amount += exp.amount;
          }
        }
      });

      const monthly: MonthlyData[] = Array.from(monthlyMap.entries()).map(([month, data]) => ({
        month,
        ...data,
      }));

      setMonthlyData(monthly);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load report data.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async () => {
    if (exporting) return;
    
    setExporting(true);
    try {
      // Create workbook
      const wb = XLSX.utils.book_new();

      // ===== SHEET 1: Report Summary =====
      const summaryData: any[][] = [
        ['SpendSync Financial Report'],
        [],
        ['Report Period'],
        ['Start Date:', dateRange.startDate],
        ['End Date:', dateRange.endDate],
        [],
        ['KPI Summary'],
        ['Metric', 'Count', 'Amount'],
        ['Total Approved', stats?.totalApproved || 0, stats?.approvedAmount || 0],
        ['Total Reimbursed', stats?.totalReimbursed || 0, stats?.reimbursedAmount || 0],
        ['Pending Payment', stats?.pendingPayment || 0, stats?.pendingAmount || 0],
        ['Total Disbursed', '-', stats?.totalDisbursed || 0],
        [],
        ['Category Spending Summary'],
        ['Category', 'Count', 'Total Amount', 'Percentage'],
      ];

      // Add category data
      if (categoryData.length > 0) {
        categoryData.forEach(cat => {
          const percentage = stats?.reimbursedAmount
            ? ((cat.totalAmount / stats.reimbursedAmount) * 100).toFixed(1)
            : '0.0';
          summaryData.push([
            cat.category,
            cat.count,
            cat.totalAmount,
            percentage + '%'
          ]);
        });
      } else {
        summaryData.push(['No category data available']);
      }

      summaryData.push([]);
      summaryData.push(['Monthly Disbursement Report']);
      summaryData.push(['Month', 'Approved', 'Reimbursed', 'Total Disbursed']);

      // Add monthly data
      if (monthlyData.length > 0) {
        monthlyData.forEach(month => {
          summaryData.push([
            month.month,
            month.approved,
            month.reimbursed,
            month.amount
          ]);
        });
      } else {
        summaryData.push(['No monthly data available']);
      }

      const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);

      // Set column widths
      wsSummary['!cols'] = [
        { wch: 25 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 }
      ];

      XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

      // ===== SHEET 2: Expense Records =====
      const expenseHeaders = [
        'ID',
        'Employee',
        'Description',
        'Category',
        'Amount',
        'Status',
        'Submitted Date',
        'Approved Date',
        'Paid Date'
      ];

      const expenseData: any[][] = [expenseHeaders];

      if (filteredExpenses.length > 0) {
        filteredExpenses.forEach(exp => {
          expenseData.push([
            exp.id,
            exp.userName || 'N/A',
            exp.description || 'N/A',
            exp.category || 'N/A',
            exp.amount || 0,
            exp.status || 'N/A',
            exp.submittedAt ? formatDate(exp.submittedAt) : 'N/A',
            exp.approvedAt ? formatDate(exp.approvedAt) : '-',
            exp.reimbursedAt ? formatDate(exp.reimbursedAt) : '-'
          ]);
        });
      } else {
        expenseData.push(['No expense records found for the selected date range']);
      }

      const wsExpenses = XLSX.utils.aoa_to_sheet(expenseData);

      // Set column widths
      wsExpenses['!cols'] = [
        { wch: 8 },
        { wch: 20 },
        { wch: 30 },
        { wch: 15 },
        { wch: 12 },
        { wch: 12 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 }
      ];

      XLSX.utils.book_append_sheet(wb, wsExpenses, 'Expense Records');

      // Generate filename
      const today = new Date().toISOString().split('T')[0];
      const filename = `financial-report-${today}.xlsx`;

      // Write file
      XLSX.writeFile(wb, filename);

      showToast('Excel report exported successfully', true);
    } catch (err: any) {
      console.error('Excel export error:', err);
      showToast('Failed to export Excel report', false);
    } finally {
      setExporting(false);
    }
  };

  const handleExportPDF = async () => {
    if (exporting) return;
    
    setExporting(true);
    try {
      const doc = new jsPDF();
      let yPos = 20;

      // ===== HEADER =====
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('SpendSync Financial Report', 105, yPos, { align: 'center' });
      yPos += 10;

      // ===== DATE RANGE =====
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Report Period: ${dateRange.startDate} to ${dateRange.endDate}`, 105, yPos, { align: 'center' });
      yPos += 15;

      // ===== KPI SUMMARY =====
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('KPI Summary', 14, yPos);
      yPos += 8;

      const kpiData = [
        ['Total Approved', (stats?.totalApproved || 0).toString(), formatCurrency(stats?.approvedAmount || 0)],
        ['Total Reimbursed', (stats?.totalReimbursed || 0).toString(), formatCurrency(stats?.reimbursedAmount || 0)],
        ['Pending Payment', (stats?.pendingPayment || 0).toString(), formatCurrency(stats?.pendingAmount || 0)],
        ['Total Disbursed', '-', formatCurrency(stats?.totalDisbursed || 0)]
      ];

      autoTable(doc, {
        startY: yPos,
        head: [['Metric', 'Count', 'Amount']],
        body: kpiData,
        theme: 'grid',
        headStyles: { fillColor: [0, 217, 217], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 9 },
        margin: { left: 14, right: 14 }
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;

      // ===== CATEGORY SPENDING SUMMARY =====
      if (categoryData.length > 0) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Category Spending Summary', 14, yPos);
        yPos += 8;

        const categoryTableData = categoryData.map(cat => {
          const percentage = stats?.reimbursedAmount
            ? ((cat.totalAmount / stats.reimbursedAmount) * 100).toFixed(1)
            : '0.0';
          return [
            cat.category,
            cat.count.toString(),
            formatCurrency(cat.totalAmount),
            percentage + '%'
          ];
        });

        autoTable(doc, {
          startY: yPos,
          head: [['Category', 'Count', 'Total Amount', 'Percentage']],
          body: categoryTableData,
          theme: 'grid',
          headStyles: { fillColor: [0, 217, 217], textColor: [255, 255, 255], fontStyle: 'bold' },
          styles: { fontSize: 9 },
          margin: { left: 14, right: 14 }
        });

        yPos = (doc as any).lastAutoTable.finalY + 15;
      }

      // ===== MONTHLY DISBURSEMENT REPORT =====
      if (monthlyData.length > 0) {
        // Check if we need a new page
        if (yPos > 240) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Monthly Disbursement Report', 14, yPos);
        yPos += 8;

        const monthlyTableData = monthlyData.map(month => [
          month.month,
          month.approved.toString(),
          month.reimbursed.toString(),
          formatCurrency(month.amount)
        ]);

        autoTable(doc, {
          startY: yPos,
          head: [['Month', 'Approved', 'Reimbursed', 'Total Disbursed']],
          body: monthlyTableData,
          theme: 'grid',
          headStyles: { fillColor: [0, 217, 217], textColor: [255, 255, 255], fontStyle: 'bold' },
          styles: { fontSize: 9 },
          margin: { left: 14, right: 14 }
        });

        yPos = (doc as any).lastAutoTable.finalY + 15;
      }

      // ===== EXPENSE RECORDS =====
      if (filteredExpenses.length > 0) {
        // Add new page for expense records
        doc.addPage();
        yPos = 20;

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Expense Records', 14, yPos);
        yPos += 8;

        const expenseTableData = filteredExpenses.map(exp => [
          exp.id.toString(),
          exp.userName || 'N/A',
          (exp.description || 'N/A').substring(0, 30) + ((exp.description || '').length > 30 ? '...' : ''),
          exp.category || 'N/A',
          formatCurrency(exp.amount || 0),
          exp.status || 'N/A',
          exp.submittedAt ? formatDate(exp.submittedAt) : 'N/A'
        ]);

        autoTable(doc, {
          startY: yPos,
          head: [['ID', 'Employee', 'Description', 'Category', 'Amount', 'Status', 'Date']],
          body: expenseTableData.length > 0 ? expenseTableData : [['No expense records found']],
          theme: 'grid',
          headStyles: { fillColor: [0, 217, 217], textColor: [255, 255, 255], fontStyle: 'bold' },
          styles: { fontSize: 8 },
          margin: { left: 14, right: 14 },
          columnStyles: {
            0: { cellWidth: 15 },
            1: { cellWidth: 30 },
            2: { cellWidth: 45 },
            3: { cellWidth: 25 },
            4: { cellWidth: 25 },
            5: { cellWidth: 25 },
            6: { cellWidth: 25 }
          }
        });
      }

      // Generate filename
      const today = new Date().toISOString().split('T')[0];
      const filename = `financial-report-${today}.pdf`;

      // Save PDF
      doc.save(filename);

      showToast('PDF report exported successfully', true);
    } catch (err: any) {
      console.error('PDF export error:', err);
      showToast('Failed to export PDF report', false);
    } finally {
      setExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: 20,
            right: 20,
            zIndex: 9999,
            background: toast.ok
              ? 'linear-gradient(135deg,#1a4d2e,#0f3a20)'
              : 'linear-gradient(135deg,#4d1a1a,#3a0f0f)',
            border: `1px solid ${toast.ok ? '#51cf66' : '#ff6b6b'}`,
            color: toast.ok ? '#51cf66' : '#ff8a8a',
            padding: '14px 22px',
            borderRadius: '10px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
            fontWeight: 500,
          }}
        >
          {toast.ok ? '✓ ' : '✕ '}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '25px',
        }}
      >
        <div>
          <h1 style={{ color: '#00d9d9', margin: 0 }}>Financial Reports</h1>
          <p style={{ color: '#aaa', margin: '5px 0 0', fontSize: '0.9rem' }}>
            Comprehensive expense and reimbursement analytics
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn"
            onClick={handleExportExcel}
            disabled={exporting || loading}
            style={{
              padding: '8px 16px',
              fontSize: '0.9rem',
              background: exporting || loading ? 'rgba(0,217,217,0.05)' : 'rgba(0,217,217,0.15)',
              border: '1px solid rgba(0,217,217,0.3)',
              color: exporting || loading ? '#666' : '#00d9d9',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: exporting || loading ? 'not-allowed' : 'pointer',
              opacity: exporting || loading ? 0.5 : 1,
            }}
          >
            <Download style={{ width: 16, height: 16 }} />
            {exporting ? 'Exporting...' : 'Export Excel'}
          </button>
          <button
            className="btn"
            onClick={handleExportPDF}
            disabled={exporting || loading}
            style={{
              padding: '8px 16px',
              fontSize: '0.9rem',
              background: exporting || loading ? 'rgba(0,217,217,0.05)' : 'rgba(0,217,217,0.15)',
              border: '1px solid rgba(0,217,217,0.3)',
              color: exporting || loading ? '#666' : '#00d9d9',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: exporting || loading ? 'not-allowed' : 'pointer',
              opacity: exporting || loading ? 0.5 : 1,
            }}
          >
            <FileText style={{ width: 16, height: 16 }} />
            {exporting ? 'Exporting...' : 'Export PDF'}
          </button>
          <button
            className="group relative p-2.5 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700/50 hover:border-cyan-500/30 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-all duration-200"
            onClick={fetchReportData}
            aria-label="Refresh"
          >
            <RefreshCw className="w-5 h-5 text-gray-300 group-hover:text-cyan-400 transition-all duration-500 group-hover:rotate-180" />
          </button>
        </div>
      </div>

      {/* Date Range Filter */}
      <div
        className="card"
        style={{
          padding: '20px',
          marginBottom: 25,
          display: 'flex',
          alignItems: 'center',
          gap: 20,
        }}
      >
        <Filter style={{ width: 20, height: 20, color: '#00d9d9' }} />
        <div style={{ flex: 1, display: 'flex', gap: 15, alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <label
              style={{
                display: 'block',
                color: '#aaa',
                fontSize: '0.8rem',
                marginBottom: 6,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Start Date
            </label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={e => setDateRange({ ...dateRange, startDate: e.target.value })}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 6,
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(0,217,217,0.3)',
                color: '#fff',
                fontSize: '0.9rem',
              }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label
              style={{
                display: 'block',
                color: '#aaa',
                fontSize: '0.8rem',
                marginBottom: 6,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              End Date
            </label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={e => setDateRange({ ...dateRange, endDate: e.target.value })}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 6,
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(0,217,217,0.3)',
                color: '#fff',
                fontSize: '0.9rem',
              }}
            />
          </div>
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      {loading ? (
        <div className="loading">Loading report data...</div>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="mb-10">
            <StatsGrid>
              <KpiCard
                title="Total Approved"
                value={stats?.totalApproved || 0}
                subtitle={formatCurrency(stats?.approvedAmount || 0)}
                icon={<TrendingUp className="w-6 h-6" />}
                color="cyan"
              />
              <KpiCard
                title="Total Reimbursed"
                value={stats?.totalReimbursed || 0}
                subtitle={formatCurrency(stats?.reimbursedAmount || 0)}
                icon={<Wallet className="w-6 h-6" />}
                color="green"
              />
              <KpiCard
                title="Pending Payment"
                value={stats?.pendingPayment || 0}
                subtitle={formatCurrency(stats?.pendingAmount || 0)}
                icon={<Calendar className="w-6 h-6" />}
                color="yellow"
              />
              <KpiCard
                title="Total Disbursed"
                value={formatCurrency(stats?.totalDisbursed || 0)}
                subtitle="All payments"
                icon={<Wallet className="w-6 h-6" />}
                color="purple"
              />
            </StatsGrid>
          </div>

          {/* Category Spending Summary */}
          <div className="card" style={{ marginBottom: 30 }}>
            <h3 style={{ color: '#00d9d9', margin: '0 0 20px', fontSize: '1.2rem' }}>
              Category Spending Summary
            </h3>
            {categoryData.length === 0 ? (
              <p style={{ color: '#aaa', textAlign: 'center', padding: '30px 0' }}>
                No category data available for the selected date range.
              </p>
            ) : (
              <table className="table" style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Count</th>
                    <th>Total Amount</th>
                    <th>Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryData.map((cat, idx) => {
                    const percentage =
                      stats?.reimbursedAmount
                        ? ((cat.totalAmount / stats.reimbursedAmount) * 100).toFixed(1)
                        : '0.0';
                    return (
                      <tr key={idx}>
                        <td style={{ fontWeight: 500 }}>{cat.category}</td>
                        <td style={{ color: '#aaa' }}>{cat.count}</td>
                        <td style={{ fontWeight: 600 }}>{formatCurrency(cat.totalAmount)}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div
                              style={{
                                flex: 1,
                                height: 8,
                                background: 'rgba(0,0,0,0.3)',
                                borderRadius: 4,
                                overflow: 'hidden',
                              }}
                            >
                              <div
                                style={{
                                  width: `${percentage}%`,
                                  height: '100%',
                                  background: 'linear-gradient(90deg, #00d9d9, #51cf66)',
                                  borderRadius: 4,
                                }}
                              />
                            </div>
                            <span style={{ color: '#00d9d9', fontSize: '0.85rem', minWidth: 45 }}>
                              {percentage}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Monthly Disbursement Report */}
          <div className="card">
            <h3 style={{ color: '#00d9d9', margin: '0 0 20px', fontSize: '1.2rem' }}>
              Monthly Disbursement Report (Last 6 Months)
            </h3>
            {monthlyData.length === 0 ? (
              <p style={{ color: '#aaa', textAlign: 'center', padding: '30px 0' }}>
                No monthly data available.
              </p>
            ) : (
              <table className="table" style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Approved</th>
                    <th>Reimbursed</th>
                    <th>Total Disbursed</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyData.map((month, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 500 }}>{month.month}</td>
                      <td style={{ color: '#00d9d9' }}>{month.approved}</td>
                      <td style={{ color: '#51cf66' }}>{month.reimbursed}</td>
                      <td style={{ fontWeight: 600 }}>{formatCurrency(month.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default FinanceReports;

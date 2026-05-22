import * as XLSX from 'xlsx';
import * as jsPDF from 'jspdf';
import 'jspdf-autotable';
import type { AuditLog } from '../types';

// Format currency in Philippine Peso
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2
  }).format(amount);
};

// Export Audit Logs to CSV
export const exportAuditLogsToCSV = (logs: AuditLog[], filename: string = 'audit-logs') => {
  const csvData = logs.map(log => ({
    Timestamp: log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A',
    Company: log.companyName || 'N/A',
    User: log.userName || 'System',
    Action: log.action,
    Details: log.details || '-',
    'IP Address': log.ipAddress || '-'
  }));

  const worksheet = XLSX.utils.json_to_sheet(csvData);
  const csv = XLSX.utils.sheet_to_csv(worksheet);
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Export Audit Logs to Excel
export const exportAuditLogsToExcel = (logs: AuditLog[], filename: string = 'audit-logs') => {
  const excelData = logs.map(log => ({
    Timestamp: log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A',
    Company: log.companyName || 'N/A',
    User: log.userName || 'System',
    Action: log.action,
    Details: log.details || '-',
    'IP Address': log.ipAddress || '-'
  }));

  const worksheet = XLSX.utils.json_to_sheet(excelData);
  
  // Set column widths
  worksheet['!cols'] = [
    { wch: 20 }, // Timestamp
    { wch: 25 }, // Company
    { wch: 25 }, // User
    { wch: 20 }, // Action
    { wch: 40 }, // Details
    { wch: 15 }  // IP Address
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Audit Logs');
  
  XLSX.writeFile(workbook, `${filename}-${new Date().toISOString().split('T')[0]}.xlsx`);
};

// Export Reports to PDF
export const exportReportsToPDF = (data: {
  overview: any;
  companyGrowth: any[];
  userActivity: any[];
  subscriptionDist: any[];
  expensesByCategory: any[];
  topCompanies: any[];
  mostActiveUsers: any[];
}, filename: string = 'platform-report') => {
  try {
    // Create new jsPDF instance with proper configuration for old version
    const doc = new (jsPDF as any)('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPosition = 20;

    // Title
    doc.setFontSize(20);
    doc.setTextColor(0, 217, 217);
    doc.text('Platform Analytics Report', pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 10;
    doc.setFontSize(10);
    doc.setTextColor(128, 128, 128);
    doc.text(`Generated on ${new Date().toLocaleString()}`, pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 15;

    // KPI Summary Section
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Key Performance Indicators', 14, yPosition);
    yPosition += 10;

    const kpiData = [
      ['Total Companies', String(data.overview?.totalCompanies || 0)],
      ['Active Companies', String(data.overview?.activeCompanies || 0)],
      ['Total Users', String(data.overview?.totalUsers || 0)],
      ['Total Expenses', String(data.overview?.totalExpenses || 0)],
      ['Total Revenue', formatCurrency(data.overview?.totalExpenseAmount || 0)],
      ['Trial Companies', String(data.overview?.trialCompanies || 0)],
      ['Expired Subscriptions', String(data.overview?.expiredCompanies || 0)],
      ['Active Sessions', String(data.overview?.activeSessions || 0)]
    ];

    (doc as any).autoTable({
      startY: yPosition,
      head: [['Metric', 'Value']],
      body: kpiData,
      theme: 'grid',
      headStyles: { fillColor: [0, 217, 217], textColor: [10, 10, 10] },
      styles: { fontSize: 10 }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;

    // Top Companies Section
    if (data.topCompanies && data.topCompanies.length > 0) {
      // Check if we need a new page
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text('Top Companies', 14, yPosition);
      yPosition += 10;

      const companyData = data.topCompanies.map(company => [
        String(company.name || ''),
        String(company.userCount || 0),
        String(company.expenseCount || 0),
        formatCurrency(company.totalExpenseAmount || 0)
      ]);

      (doc as any).autoTable({
        startY: yPosition,
        head: [['Company', 'Users', 'Expenses', 'Total Amount']],
        body: companyData,
        theme: 'grid',
        headStyles: { fillColor: [0, 217, 217], textColor: [10, 10, 10] },
        styles: { fontSize: 9 }
      });

      yPosition = (doc as any).lastAutoTable.finalY + 15;
    }

    // Subscription Distribution
    if (data.subscriptionDist && data.subscriptionDist.length > 0) {
      // Check if we need a new page
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text('Subscription Distribution', 14, yPosition);
      yPosition += 10;

      const subData = data.subscriptionDist.map(sub => [
        String(sub.status || ''),
        String(sub.count || 0)
      ]);

      (doc as any).autoTable({
        startY: yPosition,
        head: [['Status', 'Count']],
        body: subData,
        theme: 'grid',
        headStyles: { fillColor: [0, 217, 217], textColor: [10, 10, 10] },
        styles: { fontSize: 10 }
      });

      yPosition = (doc as any).lastAutoTable.finalY + 15;
    }

    // Expenses by Category
    if (data.expensesByCategory && data.expensesByCategory.length > 0) {
      // Check if we need a new page
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text('Expenses by Category', 14, yPosition);
      yPosition += 10;

      const categoryData = data.expensesByCategory.map(cat => [
        String(cat.category || ''),
        String(cat.count || 0),
        formatCurrency(cat.totalAmount || 0)
      ]);

      (doc as any).autoTable({
        startY: yPosition,
        head: [['Category', 'Count', 'Total Amount']],
        body: categoryData,
        theme: 'grid',
        headStyles: { fillColor: [0, 217, 217], textColor: [10, 10, 10] },
        styles: { fontSize: 10 }
      });

      yPosition = (doc as any).lastAutoTable.finalY + 15;
    }

    // Most Active Users
    if (data.mostActiveUsers && data.mostActiveUsers.length > 0) {
      // Check if we need a new page
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text('Most Active Users', 14, yPosition);
      yPosition += 10;

      const userData = data.mostActiveUsers.map(user => [
        String(user.userName || ''),
        String(user.companyName || ''),
        String(user.activityCount || 0)
      ]);

      (doc as any).autoTable({
        startY: yPosition,
        head: [['User', 'Company', 'Activity Count']],
        body: userData,
        theme: 'grid',
        headStyles: { fillColor: [0, 217, 217], textColor: [10, 10, 10] },
        styles: { fontSize: 9 }
      });
    }

    // Save the PDF
    const fileName = `${filename}-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    
    return true;
  } catch (error) {
    console.error('PDF Export Error:', error);
    throw new Error('Failed to generate PDF. Please try again.');
  }
};

// Export Reports to Excel
export const exportReportsToExcel = (data: {
  overview: any;
  companyGrowth: any[];
  userActivity: any[];
  subscriptionDist: any[];
  expensesByCategory: any[];
  topCompanies: any[];
  mostActiveUsers: any[];
}, filename: string = 'platform-report') => {
  const workbook = XLSX.utils.book_new();

  // KPI Summary Sheet
  const kpiData = [
    ['Metric', 'Value'],
    ['Total Companies', data.overview?.totalCompanies || 0],
    ['Active Companies', data.overview?.activeCompanies || 0],
    ['Total Users', data.overview?.totalUsers || 0],
    ['Total Expenses', data.overview?.totalExpenses || 0],
    ['Total Revenue', formatCurrency(data.overview?.totalExpenseAmount || 0)],
    ['Trial Companies', data.overview?.trialCompanies || 0],
    ['Expired Subscriptions', data.overview?.expiredCompanies || 0],
    ['Active Sessions', data.overview?.activeSessions || 0]
  ];
  const kpiSheet = XLSX.utils.aoa_to_sheet(kpiData);
  XLSX.utils.book_append_sheet(workbook, kpiSheet, 'KPI Summary');

  // Top Companies Sheet
  if (data.topCompanies && data.topCompanies.length > 0) {
    const companyData = data.topCompanies.map(company => ({
      Company: company.name,
      Users: company.userCount,
      Expenses: company.expenseCount,
      'Total Amount': formatCurrency(company.totalExpenseAmount)
    }));
    const companySheet = XLSX.utils.json_to_sheet(companyData);
    XLSX.utils.book_append_sheet(workbook, companySheet, 'Top Companies');
  }

  // Subscription Distribution Sheet
  if (data.subscriptionDist && data.subscriptionDist.length > 0) {
    const subData = data.subscriptionDist.map(sub => ({
      Status: sub.status,
      Count: sub.count
    }));
    const subSheet = XLSX.utils.json_to_sheet(subData);
    XLSX.utils.book_append_sheet(workbook, subSheet, 'Subscriptions');
  }

  // Expenses by Category Sheet
  if (data.expensesByCategory && data.expensesByCategory.length > 0) {
    const categoryData = data.expensesByCategory.map(cat => ({
      Category: cat.category,
      Count: cat.count,
      'Total Amount': formatCurrency(cat.totalAmount)
    }));
    const categorySheet = XLSX.utils.json_to_sheet(categoryData);
    XLSX.utils.book_append_sheet(workbook, categorySheet, 'Expenses by Category');
  }

  // Most Active Users Sheet
  if (data.mostActiveUsers && data.mostActiveUsers.length > 0) {
    const userData = data.mostActiveUsers.map(user => ({
      User: user.userName,
      Company: user.companyName,
      'Activity Count': user.activityCount
    }));
    const userSheet = XLSX.utils.json_to_sheet(userData);
    XLSX.utils.book_append_sheet(workbook, userSheet, 'Active Users');
  }

  // Company Growth Sheet
  if (data.companyGrowth && data.companyGrowth.length > 0) {
    const growthData = data.companyGrowth.map(item => ({
      Month: item.month,
      'New Companies': item.count
    }));
    const growthSheet = XLSX.utils.json_to_sheet(growthData);
    XLSX.utils.book_append_sheet(workbook, growthSheet, 'Company Growth');
  }

  // User Activity Sheet
  if (data.userActivity && data.userActivity.length > 0) {
    const activityData = data.userActivity.map(item => ({
      Date: item.date,
      'Unique Users': item.uniqueUsers,
      'Total Logins': item.loginCount
    }));
    const activitySheet = XLSX.utils.json_to_sheet(activityData);
    XLSX.utils.book_append_sheet(workbook, activitySheet, 'User Activity');
  }

  XLSX.writeFile(workbook, `${filename}-${new Date().toISOString().split('T')[0]}.xlsx`);
};

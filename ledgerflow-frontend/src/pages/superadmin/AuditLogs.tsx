import React, { useEffect, useState } from 'react';
import { Search, Download, AlertCircle, RefreshCw } from 'lucide-react';
import { superAdminService } from '../../services/superAdmin.service';
import type { AuditLog } from '../../types';
import { ExportModal, type ExportFormat } from '../../components/common/ExportModal';
import { ToastContainer } from '../../components/common/Toast';
import { useToast } from '../../hooks/useToast';
import { exportAuditLogsToCSV, exportAuditLogsToExcel } from '../../utils/exportUtils';

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showExportModal, setShowExportModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const pageSize = 50;

  const { toasts, removeToast, success, error: showError } = useToast();

  useEffect(() => {
    fetchLogs();
  }, [currentPage, actionFilter]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await superAdminService.getAuditLogs({
        action: actionFilter || undefined,
        pageNumber: currentPage,
        pageSize: pageSize
      });
      setLogs(response.data);
      setTotalPages(response.totalPages);
    } catch (error: any) {
      console.error('Error fetching audit logs:', error);
      setError(error.response?.data?.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllLogsForExport = async (): Promise<AuditLog[]> => {
    try {
      // Fetch all logs without pagination for export
      const response = await superAdminService.getAuditLogs({
        action: actionFilter || undefined,
        pageNumber: 1,
        pageSize: 10000 // Large number to get all logs
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching all logs:', error);
      throw error;
    }
  };

  const handleExport = async (format: ExportFormat) => {
    setIsExporting(true);
    
    try {
      // Fetch all logs with current filters
      const allFilteredLogs = await fetchAllLogsForExport();
      
      // Apply search filter to exported data
      const logsToExport = allFilteredLogs.filter(log => {
        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();
        return (
          log.userName.toLowerCase().includes(search) ||
          log.companyName.toLowerCase().includes(search) ||
          log.action.toLowerCase().includes(search) ||
          log.details.toLowerCase().includes(search)
        );
      });

      if (logsToExport.length === 0) {
        showError('No audit logs to export');
        setShowExportModal(false);
        setIsExporting(false);
        return;
      }

      if (format === 'csv') {
        exportAuditLogsToCSV(logsToExport);
        success('Audit logs exported successfully as CSV');
      } else if (format === 'excel') {
        exportAuditLogsToExcel(logsToExport);
        success('Audit logs exported successfully as Excel');
      }
      
      setShowExportModal(false);
    } catch (error) {
      console.error('Export error:', error);
      showError('Failed to export audit logs. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      log.userName.toLowerCase().includes(search) ||
      log.companyName.toLowerCase().includes(search) ||
      log.action.toLowerCase().includes(search) ||
      log.details.toLowerCase().includes(search)
    );
  });

  if (loading && logs.length === 0) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-700 rounded w-1/4"></div>
        <div className="h-20 bg-gray-800/50 rounded-xl"></div>
        <div className="h-96 bg-gray-800/50 rounded-xl"></div>
      </div>
    );
  }

  if (error && logs.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Audit Logs</h1>
          <p className="text-gray-400">Track all platform activities</p>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <p className="font-semibold text-red-400 mb-2">Error Loading Audit Logs</p>
              <p className="text-sm text-red-300 mb-4">{error}</p>
              <button 
                onClick={fetchLogs}
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Audit Logs</h1>
          <p className="text-gray-400">Track all platform activities</p>
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
            onClick={fetchLogs}
            disabled={loading}
            className="group relative p-2.5 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700/50 hover:border-cyan-500/30 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Refresh"
          >
            <RefreshCw className={`w-5 h-5 text-gray-300 group-hover:text-cyan-400 transition-all duration-500 ${loading ? 'animate-spin' : 'group-hover:rotate-180'}`} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
          <select 
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="">All Actions</option>
            <option value="LOGIN">Login</option>
            <option value="LOGOUT">Logout</option>
            <option value="COMPANY_CREATED">Company Created</option>
            <option value="COMPANY_SUSPENDED">Company Suspended</option>
            <option value="COMPANY_ACTIVATED">Company Activated</option>
            <option value="TRIAL_EXTENDED">Trial Extended</option>
            <option value="PLAN_UPDATE">Plan Update</option>
            <option value="USER_CREATED">User Created</option>
            <option value="USER_UPDATED">User Updated</option>
          </select>
          <div className="text-gray-400 flex items-center justify-end">
            Page {currentPage} of {totalPages}
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-4 px-6 text-gray-400 font-medium">Timestamp</th>
                <th className="text-left py-4 px-6 text-gray-400 font-medium">Company</th>
                <th className="text-left py-4 px-6 text-gray-400 font-medium">User</th>
                <th className="text-left py-4 px-6 text-gray-400 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-400">
                    <div className="flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="ml-2">Loading audit logs...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-400">
                    No audit logs found
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                    <td className="py-4 px-6 text-gray-300">
                      {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}
                    </td>
                    <td className="py-4 px-6 text-gray-300">{log.companyName || 'N/A'}</td>
                    <td className="py-4 px-6 text-gray-300">{log.userName || 'System'}</td>
                    <td className="py-4 px-6 text-white">
                      {log.action}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-700">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1 || loading}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 text-white rounded-lg transition-colors font-medium"
            >
              Previous
            </button>
            <span className="text-gray-400">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages || loading}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 text-white rounded-lg transition-colors font-medium"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        title="Export Audit Logs"
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
        availableFormats={['excel', 'csv']}
        isLoading={isExporting}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Search, 
  CheckCircle, 
  XCircle, 
  Clock,
  Eye,
  RefreshCw
} from 'lucide-react';
import subscriptionService, { SubscriptionRequest } from '../../services/subscriptionService';
import { ConfirmationModal } from '../../components/modals/ConfirmationModal';
import { useToast } from '../../hooks/useToast';
import { ToastContainer } from '../../components/common/Toast';
import { formatDistanceToNow } from 'date-fns';

type TabType = 'pending' | 'approved' | 'rejected';

export const Subscriptions: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [requests, setRequests] = useState<SubscriptionRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<SubscriptionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<SubscriptionRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [approveNotes, setApproveNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  
  const { toasts, removeToast, success, error: showError } = useToast();

  // Fetch requests
  const fetchRequests = async () => {
    try {
      setLoading(true);
      const data = await subscriptionService.getAllRequests();
      setRequests(data);
    } catch (err: any) {
      console.error('Failed to fetch subscription requests:', err);
      showError('Failed to load subscription requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // Filter requests by tab and search
  useEffect(() => {
    let filtered = requests.filter(req => {
      if (activeTab === 'pending') return req.status === 'Pending';
      if (activeTab === 'approved') return req.status === 'Approved';
      if (activeTab === 'rejected') return req.status === 'Rejected';
      return true;
    });

    if (searchTerm) {
      filtered = filtered.filter(req =>
        req.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.requestedBy.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredRequests(filtered);
  }, [requests, activeTab, searchTerm]);

  // Handle approve
  const handleApprove = async () => {
    if (!selectedRequest) return;

    try {
      setProcessing(true);
      await subscriptionService.approveRequest(selectedRequest.id, {
        notes: approveNotes || undefined
      });
      
      success('Subscription request approved successfully');
      setShowApproveModal(false);
      setApproveNotes('');
      setSelectedRequest(null);
      fetchRequests();
    } catch (err: any) {
      console.error('Failed to approve request:', err);
      showError(err.response?.data?.message || 'Failed to approve request');
    } finally {
      setProcessing(false);
    }
  };

  // Handle reject
  const handleReject = async () => {
    if (!selectedRequest || !rejectReason.trim()) {
      showError('Please provide a reason for rejection');
      return;
    }

    try {
      setProcessing(true);
      await subscriptionService.rejectRequest(selectedRequest.id, {
        reason: rejectReason
      });
      
      success('Subscription request rejected');
      setShowRejectModal(false);
      setRejectReason('');
      setSelectedRequest(null);
      fetchRequests();
    } catch (err: any) {
      console.error('Failed to reject request:', err);
      showError(err.response?.data?.message || 'Failed to reject request');
    } finally {
      setProcessing(false);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return `₱${amount.toLocaleString()}`;
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'Recently';
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 text-xs font-semibold">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      case 'Approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30 text-xs font-semibold">
            <CheckCircle className="w-3 h-3" />
            Approved
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-semibold">
            <XCircle className="w-3 h-3" />
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header - Simple module header without profile/notification */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Subscription Requests</h1>
          <p className="text-gray-400">Manage company subscription requests and approvals</p>
        </div>
        <button
          onClick={fetchRequests}
          disabled={loading}
          className="group relative p-2.5 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700/50 hover:border-cyan-500/30 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Refresh"
        >
          <RefreshCw className={`w-5 h-5 text-gray-300 group-hover:text-cyan-400 transition-all duration-500 ${loading ? 'animate-spin' : 'group-hover:rotate-180'}`} />
        </button>
      </div>

      {/* Stats Cards - CLICKABLE KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => setActiveTab('pending')}
          className={`bg-gray-800/50 backdrop-blur-sm rounded-xl border p-4 text-left transition-all duration-200 ${
            activeTab === 'pending' 
              ? 'border-yellow-500/50 shadow-[0_0_20px_rgba(234,179,8,0.2)]' 
              : 'border-yellow-500/30 hover:border-yellow-500/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Pending</p>
              <p className="text-2xl font-bold text-yellow-400">
                {requests.filter(r => r.status === 'Pending').length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-400" />
          </div>
        </button>

        <button
          onClick={() => setActiveTab('approved')}
          className={`bg-gray-800/50 backdrop-blur-sm rounded-xl border p-4 text-left transition-all duration-200 ${
            activeTab === 'approved' 
              ? 'border-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.2)]' 
              : 'border-green-500/30 hover:border-green-500/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Approved</p>
              <p className="text-2xl font-bold text-green-400">
                {requests.filter(r => r.status === 'Approved').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </button>

        <button
          onClick={() => setActiveTab('rejected')}
          className={`bg-gray-800/50 backdrop-blur-sm rounded-xl border p-4 text-left transition-all duration-200 ${
            activeTab === 'rejected' 
              ? 'border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.2)]' 
              : 'border-red-500/30 hover:border-red-500/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Rejected</p>
              <p className="text-2xl font-bold text-red-400">
                {requests.filter(r => r.status === 'Rejected').length}
              </p>
            </div>
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
        </button>
      </div>

      {/* Search Bar - TOP RIGHT */}
      <div className="flex justify-end">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by company or user..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
          />
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <CreditCard className="w-16 h-16 text-gray-600 mb-4" />
            <p className="text-gray-400 text-center">
              {searchTerm ? 'No requests found matching your search' : `No ${activeTab} requests`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900/50 border-b border-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Current Plan
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Requested Plan
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Requested
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {filteredRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-700/30 transition-colors">
                    <td className="px-4 py-4">
                      <div>
                        <div className="text-white font-medium">{request.companyName}</div>
                        <div className="text-xs text-gray-400">by {request.requestedBy}</div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-300">
                        {request.currentPlanName}
                        <div className="text-xs text-gray-500">{request.currentBillingCycle}</div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-cyan-400 font-medium">
                        {request.requestedPlanName}
                        <div className="text-xs text-gray-400">{request.requestedBillingCycle}</div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm font-semibold text-white">
                        {formatCurrency(request.amount)}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {getStatusBadge(request.status)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-400">
                        {formatDate(request.requestedAt)}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedRequest(request);
                            setShowDetailsModal(true);
                          }}
                          className="p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 transition-all duration-200"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {request.status === 'Pending' && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedRequest(request);
                                setShowApproveModal(true);
                              }}
                              className="p-2 rounded-lg bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-400 transition-all duration-200"
                              title="Approve"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedRequest(request);
                                setShowRejectModal(true);
                              }}
                              className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 transition-all duration-200"
                              title="Reject"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedRequest && (
        <ConfirmationModal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedRequest(null);
          }}
          type="info"
          title="Request Details"
          message={`
Company: ${selectedRequest.companyName}
Current Plan: ${selectedRequest.currentPlanName} (${selectedRequest.currentBillingCycle})
Requested Plan: ${selectedRequest.requestedPlanName} (${selectedRequest.requestedBillingCycle})
Amount: ${formatCurrency(selectedRequest.amount)}
Status: ${selectedRequest.status}
Requested By: ${selectedRequest.requestedBy}
Requested At: ${new Date(selectedRequest.requestedAt).toLocaleString()}
${selectedRequest.reviewNotes ? `\nNotes: ${selectedRequest.reviewNotes}` : ''}
${selectedRequest.reason ? `\nReason: ${selectedRequest.reason}` : ''}
          `.trim()}
          confirmText="Close"
          showCancel={false}
        />
      )}

      {/* Approve Modal */}
      {showApproveModal && selectedRequest && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="relative w-full max-w-md rounded-2xl border border-green-500/30 bg-[#0f172a] shadow-[0_0_50px_rgba(0,255,0,0.15)] flex flex-col">
            <div className="px-5 py-4 border-b border-green-500/20 bg-green-500/10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-green-500/20">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-green-400">Approve Request</h3>
                  <p className="text-xs text-gray-400">{selectedRequest.companyName}</p>
                </div>
              </div>
            </div>

            <div className="px-5 py-4">
              <p className="text-sm text-gray-300 mb-4">
                Approve subscription change from <strong>{selectedRequest.currentPlanName}</strong> to{' '}
                <strong className="text-cyan-400">{selectedRequest.requestedPlanName}</strong>?
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={approveNotes}
                  onChange={(e) => setApproveNotes(e.target.value)}
                  placeholder="Add any notes for this approval..."
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-900/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 transition-colors resize-none"
                />
              </div>
            </div>

            <div className="px-5 py-4 border-t border-green-500/20 bg-slate-900/50 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowApproveModal(false);
                  setApproveNotes('');
                  setSelectedRequest(null);
                }}
                disabled={processing}
                className="px-5 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/20 text-white font-semibold transition-all duration-200 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                disabled={processing}
                className="px-6 py-2.5 rounded-lg font-bold transition-all duration-200 shadow-lg text-sm bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? 'Approving...' : 'Approve Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedRequest && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="relative w-full max-w-md rounded-2xl border border-red-500/30 bg-[#0f172a] shadow-[0_0_50px_rgba(255,0,0,0.15)] flex flex-col">
            <div className="px-5 py-4 border-b border-red-500/20 bg-red-500/10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-red-500/20">
                  <XCircle className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-red-400">Reject Request</h3>
                  <p className="text-xs text-gray-400">{selectedRequest.companyName}</p>
                </div>
              </div>
            </div>

            <div className="px-5 py-4">
              <p className="text-sm text-gray-300 mb-4">
                Please provide a reason for rejecting this subscription request.
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Rejection Reason <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Explain why this request is being rejected..."
                  rows={4}
                  className="w-full px-3 py-2 bg-gray-900/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 transition-colors resize-none"
                  required
                />
              </div>
            </div>

            <div className="px-5 py-4 border-t border-red-500/20 bg-slate-900/50 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                  setSelectedRequest(null);
                }}
                disabled={processing}
                className="px-5 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/20 text-white font-semibold transition-all duration-200 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={processing || !rejectReason.trim()}
                className="px-6 py-2.5 rounded-lg font-bold transition-all duration-200 shadow-lg text-sm bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? 'Rejecting...' : 'Reject Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
};

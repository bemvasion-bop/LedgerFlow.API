import api from './api';

export interface SubscriptionRequest {
  id: number;
  companyId: number;
  companyName: string;
  currentPlanName: string;
  requestedPlanName: string;
  currentBillingCycle: string;
  requestedBillingCycle: string;
  amount: number;
  paymentReference?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  reason?: string;
  requestedBy: string;
  requestedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
}

export interface ApproveRequestDto {
  notes?: string;
}

export interface RejectRequestDto {
  reason: string;
}

class SubscriptionService {
  /**
   * Get all subscription requests (Super Admin only)
   */
  async getAllRequests(): Promise<SubscriptionRequest[]> {
    const response = await api.get<SubscriptionRequest[]>('/subscription/requests');
    return response.data;
  }

  /**
   * Get pending subscription requests
   */
  async getPendingRequests(): Promise<SubscriptionRequest[]> {
    const response = await api.get<SubscriptionRequest[]>('/subscription/requests/pending');
    return response.data;
  }

  /**
   * Approve a subscription request
   */
  async approveRequest(requestId: number, data: ApproveRequestDto): Promise<void> {
    await api.post(`/subscription/requests/${requestId}/approve`, data);
  }

  /**
   * Reject a subscription request
   */
  async rejectRequest(requestId: number, data: RejectRequestDto): Promise<void> {
    await api.post(`/subscription/requests/${requestId}/reject`, data);
  }

  /**
   * Get subscription request details
   */
  async getRequestDetails(requestId: number): Promise<SubscriptionRequest> {
    const response = await api.get<SubscriptionRequest>(`/subscription/requests/${requestId}`);
    return response.data;
  }
}

export const subscriptionService = new SubscriptionService();
export default subscriptionService;

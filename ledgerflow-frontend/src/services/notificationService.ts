import api from './api';

export interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: 'subscription_request' | 'subscription_approved' | 'subscription_rejected' | 'payment_received' | 'trial_expiring' | 'system_alert';
  isRead: boolean;
  relatedEntityId?: number;
  relatedEntityType?: string;
  createdAt: string;
  readAt?: string;
}

export interface NotificationResponse {
  notifications: Notification[];
  unreadCount: number;
}

class NotificationService {
  /**
   * Get all notifications for the current user
   */
  async getNotifications(): Promise<Notification[]> {
    const response = await api.get<Notification[]>('/notification/all');
    return response.data;
  }

  /**
   * Get unread notifications
   */
  async getUnreadNotifications(): Promise<Notification[]> {
    const response = await api.get<Notification[]>('/notification/unread');
    return response.data;
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(): Promise<number> {
    const response = await api.get<{ count: number }>('/notification/unread-count');
    return response.data.count;
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: number): Promise<void> {
    await api.put(`/notification/${notificationId}/read`);
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<void> {
    await api.put('/notification/mark-all-read');
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: number): Promise<void> {
    await api.delete(`/notification/${notificationId}`);
  }
}

export const notificationService = new NotificationService();
export default notificationService;

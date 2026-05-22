import api from './api';
import {
  UserProfile,
  UpdateProfileRequest,
  ChangePasswordRequest,
  UserPreferences,
  ApiResponse
} from '../types/settings';

class SettingsService {
  /**
   * Get current user's profile
   */
  async getProfile(): Promise<UserProfile> {
    const response = await api.get<ApiResponse<UserProfile>>('/user/profile');
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to get profile');
    }
    return response.data.data;
  }

  /**
   * Update current user's profile
   */
  async updateProfile(data: UpdateProfileRequest): Promise<void> {
    const response = await api.put<ApiResponse>('/user/profile', data);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to update profile');
    }
  }

  /**
   * Change current user's password
   */
  async changePassword(data: ChangePasswordRequest): Promise<void> {
    const response = await api.post<ApiResponse>('/user/change-password', data);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to change password');
    }
  }

  /**
   * Get current user's preferences
   */
  async getPreferences(): Promise<UserPreferences> {
    const response = await api.get<ApiResponse<UserPreferences>>('/user/preferences');
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to get preferences');
    }
    return response.data.data;
  }

  /**
   * Update current user's preferences
   */
  async updatePreferences(data: UserPreferences): Promise<void> {
    const response = await api.put<ApiResponse>('/user/preferences', data);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to update preferences');
    }
  }
}

export default new SettingsService();

import axios from 'axios';

const API_URL = 'http://localhost:5256/api/superadmin';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
};

export const superAdminApi = {
  // Platform Statistics
  getStats: async () => {
    const response = await axios.get(`${API_URL}/stats`, getAuthHeader());
    return response.data;
  },

  // Companies
  getCompanies: async () => {
    const response = await axios.get(`${API_URL}/companies`, getAuthHeader());
    return response.data;
  },

  getCompanyDetails: async (id: number) => {
    const response = await axios.get(`${API_URL}/companies/${id}`, getAuthHeader());
    return response.data;
  },

  suspendCompany: async (id: number) => {
    const response = await axios.post(`${API_URL}/companies/${id}/suspend`, {}, getAuthHeader());
    return response.data;
  },

  activateCompany: async (id: number) => {
    const response = await axios.post(`${API_URL}/companies/${id}/activate`, {}, getAuthHeader());
    return response.data;
  },

  extendTrial: async (companyId: number, days: number) => {
    const response = await axios.post(
      `${API_URL}/companies/extend-trial`,
      { companyId, days },
      getAuthHeader()
    );
    return response.data;
  },

  updateCompanyPlan: async (companyId: number, planId: number) => {
    const response = await axios.post(
      `${API_URL}/companies/update-plan`,
      { companyId, planId },
      getAuthHeader()
    );
    return response.data;
  },

  // Analytics
  getPlatformActivity: async (days: number = 30) => {
    const response = await axios.get(`${API_URL}/analytics/activity?days=${days}`, getAuthHeader());
    return response.data;
  },

  getCompanyGrowth: async (months: number = 6) => {
    const response = await axios.get(`${API_URL}/analytics/growth?months=${months}`, getAuthHeader());
    return response.data;
  },

  // Audit Logs
  getAuditLogs: async (params: any = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await axios.get(`${API_URL}/audit-logs?${queryString}`, getAuthHeader());
    return response.data;
  },

  // Plans
  getPlans: async () => {
    const response = await axios.get(`${API_URL}/plans`, getAuthHeader());
    return response.data;
  }
};

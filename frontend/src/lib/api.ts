import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://safetasks-backend.onrender.com/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor to handle 401 and 402 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Check if we're returning from Stripe checkout - don't logout in this case
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const isReturningFromCheckout = urlParams.get('subscription') === 'success' || urlParams.get('subscription') === 'cancelled';

        if (isReturningFromCheckout) {
          console.log('Returning from Stripe checkout, avoiding automatic logout');
          // Don't remove token or redirect to login when returning from checkout
          // Let the dashboard handle the authentication gracefully
          return Promise.reject(error);
        }
      }

      // Token expired or invalid - normal logout flow
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }

    if (error.response?.status === 402) {
      // Payment Required - Trigger global event or redirect
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('subscription-blocked'));
      }
    }

    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', {
      username: email,
      password: password,
    });
    return response.data;
  },

  registerOwner: async (data: any) => {
    const response = await api.post('/auth/register-owner', data);
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get('/users/me');
    return response.data;
  },
};

export const dashboardApi = {
  getSummary: async () => {
    const response = await api.get('/dashboard/summary');
    return response.data;
  },
};

export const productionsApi = {
  getProductions: async (skip = 0, limit = 50) => {
    const response = await api.get(`/productions/?skip=${skip}&limit=${limit}`);
    return response.data;
  },

  getProduction: async (id: number) => {
    const response = await api.get(`/productions/${id}`);
    return response.data;
  },

  createProduction: async (data: any) => {
    const response = await api.post('/productions/', data);
    return response.data;
  },

  updateProduction: async (id: number, data: any) => {
    const response = await api.patch(`/productions/${id}`, data);
    return response.data;
  },

  deleteProduction: async (id: number) => {
    const response = await api.delete(`/productions/${id}`);
    return response.data;
  },

  addProductionItem: async (productionId: number, data: any) => {
    const response = await api.post(`/productions/${productionId}/items`, data);
    return response.data;
  },

  deleteProductionItem: async (productionId: number, itemId: number) => {
    const response = await api.delete(`/productions/${productionId}/items/${itemId}`);
    return response.data;
  },

  addCrewMember: async (productionId: number, data: any) => {
    const response = await api.post(`/productions/${productionId}/crew`, data);
    return response.data;
  },

  removeCrewMember: async (productionId: number, userId: number) => {
    const response = await api.delete(`/productions/${productionId}/crew/${userId}`);
    return response.data;
  },

  addExpense: async (productionId: number, data: any) => {
    const response = await api.post(`/productions/${productionId}/expenses`, data);
    return response.data;
  },

  removeExpense: async (productionId: number, expenseId: number) => {
    const response = await api.delete(`/productions/${productionId}/expenses/${expenseId}`);
    return response.data;
  },
};

export const servicesApi = {
  getServices: async () => {
    const response = await api.get('/services/');
    return response.data;
  },

  createService: async (data: any) => {
    const response = await api.post('/services/', data);
    return response.data;
  },

  deleteService: async (serviceId: number) => {
    const response = await api.delete(`/services/${serviceId}`);
    return response.data;
  },
};

export const clientsApi = {
  getClients: async () => {
    const response = await api.get('/clients/');
    return response.data;
  },

  createClient: async (data: any) => {
    const response = await api.post('/clients/', data);
    return response.data;
  },

  updateClient: async (clientId: number, data: any) => {
    const response = await api.put(`/clients/${clientId}`, data);
    return response.data;
  },

  deleteClient: async (clientId: number) => {
    const response = await api.delete(`/clients/${clientId}`);
    return response.data;
  },
};

export const usersApi = {
  getUsers: async () => {
    const response = await api.get('/users/');
    return response.data;
  },

  inviteCrewMember: async (data: any) => {
    const response = await api.post('/users/invite-crew', data);
    return response.data;
  },

  updateUserStatus: async (userId: number, data: { is_active: boolean }) => {
    const response = await api.patch(`/users/${userId}`, data);
    return response.data;
  },

  deleteUser: async (userId: number) => {
    const response = await api.delete(`/users/${userId}`);
    return response.data;
  },
};

export const organizationsApi = {
  getSettings: async () => {
    const response = await api.get('/organizations/settings');
    return response.data;
  },

  updateSettings: async (data: any) => {
    const response = await api.patch('/organizations/settings', data);
    return response.data;
  },

  createCheckoutSession: async (data: { plan: string; success_url: string; cancel_url: string }) => {
    const response = await api.post('/organizations/create-checkout-session', data);
    return response.data;
  },

  getPaymentHistory: async () => {
    const response = await api.get('/organizations/payment-history');
    return response.data;
  },

  cancelSubscription: async () => {
    const response = await api.post('/organizations/cancel-subscription');
    return response.data;
  },

  createPortalSession: async () => {
    const response = await api.post('/organizations/create-portal-session');
    return response.data;
  },
};

import axios from 'axios';
import { supabase, authHelpers } from './supabase';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://safetasks-backend.onrender.com/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  // ✅ CORREÇÃO: Usar Promise para lidar com async corretamente
  return new Promise((resolve) => {
    if (typeof window !== 'undefined') {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.access_token) {
          config.headers.Authorization = `Bearer ${session.access_token}`;
        }
        resolve(config);
      }).catch((error) => {
        console.error('Erro ao obter sessão Supabase:', error);
        resolve(config); // Sempre resolver mesmo com erro
      });
    }
    else {
      resolve(config);
    }
  });
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
    const response = await api.get('/users/supabase/me');
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

  updateUserStatus: async (userId: string, data: { is_active: boolean }) => {
    const response = await api.patch(`/users/${userId}`, data);
    return response.data;
  },

  deleteUser: async (userId: string) => {
    const response = await api.delete(`/users/${userId}`);
    return response.data;
  },
};

// ===== SUPABASE AUTH API =====
export const supabaseAuthApi = {
  // Registration with Supabase (direct to Supabase, then sync with backend)
  registerOwner: async (data: {
    organization_name: string;
    full_name: string;
    email: string;
    password: string;
  }) => {
    try {
      // Register directly with Supabase Auth
      const { data: authData, error: authError } = await authHelpers.signUp(
        data.email,
        data.password,
        {
          full_name: data.full_name,
          organization_name: data.organization_name
        }
      );

      if (authError) throw authError;

      // ✅ NOVA CORREÇÃO: SEMPRE criar perfil no backend, mesmo com email confirmation
      // Isso resolve o problema de perfil não existir após confirmação de email
      if (!authData.user) {
        throw new Error('No user returned from Supabase registration');
      }

      const backendResponse = await api.post('/auth/supabase/register-owner', {
        ...data,
        supabase_user_id: authData.user.id
      });

      // ✅ CORREÇÃO: Com email confirmation, NÃO há sessão imediata
      if (!authData.session) {
        // Email confirmation required - return info for UI
        return {
          success: true,
          requiresEmailConfirmation: true,
          user: authData.user,
          email: data.email,
          ...backendResponse.data
        };
      }

      // ✅ Se chegou aqui, email confirmation está desabilitado (modo dev)
      return {
        ...backendResponse.data,
        session: authData.session
      };

      throw new Error('Unexpected registration response');

    }
    catch (error) {
      console.error('❌ Registration failed:', error);
      throw error;
    }
  },

  // Login with Supabase
  login: async (email: string, password: string) => {
    try {
      const { data, error } = await authHelpers.signIn(email, password);

      if (error) {
        console.error('❌ Erro Supabase login:', error);
        throw error;
      }

      // ✅ CORREÇÃO: Verificar se sessão existe (email confirmado)
      if (!data.session) {
        throw new Error('Email não confirmado. Verifique sua caixa de entrada e clique no link de confirmação.');
      }

      console.log('✅ Login Supabase OK:', data.user?.email);

      // Return session data
      return {
        access_token: data.session?.access_token,
        refresh_token: data.session?.refresh_token,
        token_type: "bearer",
        expires_in: data.session?.expires_in,
        user: data.user ? {
          id: data.user.id,
          email: data.user.email,
          full_name: data.user.user_metadata?.full_name,
          role: data.user.user_metadata?.role || 'user',
          organization_id: data.user.user_metadata?.organization_id
        } : null
      };

    }
    catch (error) {
      console.error('❌ Login failed:', error);
      throw error;
    }
  },

  // Logout from Supabase
  logout: async () => {
    // Sign out from Supabase (this handles everything)
    const { error } = await authHelpers.signOut();
    if (error) throw error;
  },

  // Get current user profile
  getCurrentUser: async () => {
    const { user, error } = await authHelpers.getCurrentUser();
    if (error) throw error;
    return user;
  },

  // Get current user profile from backend
  getCurrentUserProfile: async () => {
    const response = await api.get('/users/supabase/me');
    return response.data;
  },

  // Reset password
  resetPassword: async (email: string) => {
    return await authHelpers.resetPassword(email);
  },

  // Update password
  updatePassword: async (password: string) => {
    return await authHelpers.updatePassword(password);
  },

  // Get current session
  getCurrentSession: async () => {
    return await authHelpers.getCurrentSession();
  },

  // Listen to auth state changes
  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return authHelpers.onAuthStateChange(callback);
  }
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
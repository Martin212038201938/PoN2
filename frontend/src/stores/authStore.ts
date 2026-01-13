import { create } from 'zustand';
import { User } from '../types';
import { api, setAuthErrorHandler } from '../services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => {
  // Register auth error handler to update state on 401 responses
  setAuthErrorHandler(() => {
    set({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  });

  return {
    user: null,
    token: localStorage.getItem('auth_token'),
    isAuthenticated: !!localStorage.getItem('auth_token'), // Initially trust token if present
    isLoading: true, // Start with loading to prevent flash

    login: async (email: string, password: string) => {
      set({ isLoading: true });
      try {
        const response = await api.login(email, password);
        const { token, user } = response;

        localStorage.setItem('auth_token', token);
        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch (error) {
        set({ isLoading: false });
        throw error;
      }
    },

    logout: () => {
      localStorage.removeItem('auth_token');
      set({
        user: null,
        token: null,
        isAuthenticated: false,
      });
    },

    loadUser: async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        set({ isAuthenticated: false, isLoading: false });
        return;
      }

      set({ isLoading: true });
      try {
        const response = await api.getCurrentUser();
        set({
          user: response.user,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch (error) {
        // Only clear auth if it's a 401 (handled by interceptor)
        // For network errors, keep the token and let user retry
        const isAuthError = (error as any)?.response?.status === 401;
        if (isAuthError) {
          localStorage.removeItem('auth_token');
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
        } else {
          // Network error - keep token, mark as authenticated (optimistic)
          set({
            isAuthenticated: true,
            isLoading: false,
          });
        }
      }
    },
  };
});

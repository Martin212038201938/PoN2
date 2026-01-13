import axios, { AxiosError, AxiosInstance } from 'axios';

// API URL configuration:
// 1. Use VITE_API_URL from environment (set during build)
// 2. In production, default to relative /api path (works with reverse proxy)
// 3. In development, fallback to localhost:8100 (matches backend default)
const getApiUrl = (): string => {
  const envUrl = (import.meta as any).env?.VITE_API_URL;
  if (envUrl) return envUrl;

  // Check if we're in production (served from same domain)
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return '/api';  // Use relative path - reverse proxy handles it
  }

  return 'http://localhost:8100/api';  // Development default - matches backend PORT
};

const API_URL = getApiUrl();

// Store reference for auth state updates
let onAuthError: (() => void) | null = null;

export function setAuthErrorHandler(handler: () => void) {
  onAuthError = handler;
}

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Clear token and notify auth store (no page reload)
          localStorage.removeItem('auth_token');
          if (onAuthError) {
            onAuthError();
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async login(email: string, password: string) {
    const response = await this.client.post('/auth/login', { email, password });
    return response.data;
  }

  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) {
    const response = await this.client.post('/auth/register', data);
    return response.data;
  }

  async getCurrentUser() {
    const response = await this.client.get('/auth/me');
    return response.data;
  }

  // Case endpoints
  async getCases(params?: {
    page?: number;
    limit?: number;
    status?: string;
    court?: string;
    search?: string;
  }) {
    const response = await this.client.get('/cases', { params });
    return response.data;
  }

  async getCase(id: string) {
    const response = await this.client.get(`/cases/${id}`);
    return response.data;
  }

  async createCase(data: any) {
    const response = await this.client.post('/cases', data);
    return response.data;
  }

  async updateCase(id: string, data: any) {
    const response = await this.client.put(`/cases/${id}`, data);
    return response.data;
  }

  async deleteCase(id: string) {
    const response = await this.client.delete(`/cases/${id}`);
    return response.data;
  }

  async startResearch(id: string) {
    const response = await this.client.post(`/cases/${id}/start-research`);
    return response.data;
  }

  async closeCase(id: string, successful: boolean) {
    const response = await this.client.post(`/cases/${id}/close`, { successful });
    return response.data;
  }

  async getCasePersons(id: string) {
    const response = await this.client.get(`/cases/${id}/persons`);
    return response.data;
  }

  async getCaseArtifacts(id: string, params?: { type?: string; source?: string }) {
    const response = await this.client.get(`/cases/${id}/artifacts`, { params });
    return response.data;
  }

  async getCaseDocuments(id: string) {
    const response = await this.client.get(`/cases/${id}/documents`);
    return response.data;
  }

  async getCaseResearchWaves(id: string) {
    const response = await this.client.get(`/cases/${id}/research-waves`);
    return response.data;
  }

  // Dashboard endpoints
  async getDashboardStats() {
    const response = await this.client.get('/dashboard/stats');
    return response.data;
  }
}

export const api = new ApiService();

import axios, { AxiosInstance, AxiosResponse } from 'axios';
import toast from 'react-hot-toast';
import {
  ApiResponse,
  ApiError,
  PaginationResponse,
  LoginRequest,
  LoginResponse,
  User,
  Site,
  CreateSiteRequest,
  Estimate,
  CreateEstimateRequest,
  Category,
  EstimateItem,
  CreateEstimateItemRequest,
  Actual,
  CreateActualRequest,
  VarianceAnalysis,
  VarianceSummary,
  DashboardStats,
} from '../types';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: '/api',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }

        const message = error.response?.data?.message || 'An error occurred';
        toast.error(message);

        return Promise.reject(error);
      }
    );
  }

  // Authentication
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response: AxiosResponse<ApiResponse<LoginResponse>> = await this.api.post('/auth/login', credentials);
    return response.data.data!;
  }

  async getProfile(): Promise<User> {
    const response: AxiosResponse<ApiResponse<User>> = await this.api.get('/auth/profile');
    return response.data.data!;
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    const response: AxiosResponse<ApiResponse<User>> = await this.api.put('/auth/profile', data);
    return response.data.data!;
  }

  async changePassword(data: { currentPassword: string; newPassword: string }): Promise<void> {
    await this.api.post('/auth/change-password', data);
  }

  // Users
  async getUsers(params?: { page?: number; limit?: number; role?: string; search?: string }): Promise<PaginationResponse<User>['data']> {
    const response: AxiosResponse<PaginationResponse<User>> = await this.api.get('/users', { params });
    return response.data.data;
  }

  async getUserById(id: number): Promise<User> {
    const response: AxiosResponse<ApiResponse<User>> = await this.api.get(`/users/${id}`);
    return response.data.data!;
  }

  async createUser(data: any): Promise<User> {
    const response: AxiosResponse<ApiResponse<User>> = await this.api.post('/users', data);
    return response.data.data!;
  }

  async updateUser(id: number, data: Partial<User>): Promise<User> {
    const response: AxiosResponse<ApiResponse<User>> = await this.api.put(`/users/${id}`, data);
    return response.data.data!;
  }

  async deleteUser(id: number): Promise<void> {
    await this.api.delete(`/users/${id}`);
  }

  // Sites
  getSites = async (params?: { page?: number; limit?: number; status?: string; search?: string }): Promise<PaginationResponse<Site>['data']> => {
    const response: AxiosResponse<PaginationResponse<Site>> = await this.api.get('/sites', { params });
    return response.data.data;
  }

  async getSiteById(id: number): Promise<Site> {
    const response: AxiosResponse<ApiResponse<Site>> = await this.api.get(`/sites/${id}`);
    return response.data.data!;
  }

  createSite = async (data: CreateSiteRequest): Promise<Site> => {
    const response: AxiosResponse<ApiResponse<Site>> = await this.api.post('/sites', data);
    return response.data.data!;
  }

  updateSite = async (id: number, data: Partial<CreateSiteRequest>): Promise<Site> => {
    const response: AxiosResponse<ApiResponse<Site>> = await this.api.put(`/sites/${id}`, data);
    return response.data.data!;
  }

  deleteSite = async (id: number): Promise<void> => {
    await this.api.delete(`/sites/${id}`);
  }

  async getSiteStatistics(): Promise<any> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get('/sites/statistics');
    return response.data.data!;
  }

  // Estimates
  async getEstimates(params?: { page?: number; limit?: number; site_id?: number; status?: string; search?: string }): Promise<PaginationResponse<Estimate>['data']> {
    const response: AxiosResponse<PaginationResponse<Estimate>> = await this.api.get('/estimates', { params });
    return response.data.data;
  }

  async getEstimateById(id: number): Promise<Estimate> {
    const response: AxiosResponse<ApiResponse<Estimate>> = await this.api.get(`/estimates/${id}`);
    return response.data.data!;
  }

  async createEstimate(data: CreateEstimateRequest): Promise<Estimate> {
    const response: AxiosResponse<ApiResponse<Estimate>> = await this.api.post('/estimates', data);
    return response.data.data!;
  }

  async updateEstimate(id: number, data: Partial<Estimate>): Promise<Estimate> {
    const response: AxiosResponse<ApiResponse<Estimate>> = await this.api.put(`/estimates/${id}`, data);
    return response.data.data!;
  }

  async deleteEstimate(id: number): Promise<void> {
    await this.api.delete(`/estimates/${id}`);
  }

  async duplicateEstimate(id: number, title: string): Promise<Estimate> {
    const response: AxiosResponse<ApiResponse<Estimate>> = await this.api.post(`/estimates/${id}/duplicate`, { title });
    return response.data.data!;
  }

  async getEstimateStatistics(): Promise<any> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get('/estimates/statistics');
    return response.data.data!;
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    const response: AxiosResponse<ApiResponse<Category[]>> = await this.api.get('/estimate-items/categories');
    return response.data.data!;
  }

  // Estimate Items
  async getEstimateItems(estimateId: number, params?: { category_id?: number }): Promise<{ items: EstimateItem[]; summary: any }> {
    const response: AxiosResponse<ApiResponse<{ items: EstimateItem[]; summary: any }>> = await this.api.get(`/estimate-items/estimate/${estimateId}`, { params });
    return response.data.data!;
  }

  async getEstimateItemById(id: number): Promise<EstimateItem> {
    const response: AxiosResponse<ApiResponse<EstimateItem>> = await this.api.get(`/estimate-items/${id}`);
    return response.data.data!;
  }

  async createEstimateItem(data: CreateEstimateItemRequest): Promise<EstimateItem> {
    const response: AxiosResponse<ApiResponse<EstimateItem>> = await this.api.post('/estimate-items', data);
    return response.data.data!;
  }

  async updateEstimateItem(id: number, data: Partial<CreateEstimateItemRequest>): Promise<EstimateItem> {
    const response: AxiosResponse<ApiResponse<EstimateItem>> = await this.api.put(`/estimate-items/${id}`, data);
    return response.data.data!;
  }

  async deleteEstimateItem(id: number): Promise<void> {
    await this.api.delete(`/estimate-items/${id}`);
  }

  async getItemsByCategory(estimateId: number): Promise<any[]> {
    const response: AxiosResponse<ApiResponse<any[]>> = await this.api.get(`/estimate-items/estimate/${estimateId}/by-category`);
    return response.data.data!;
  }

  async bulkCreateEstimateItems(estimateId: number, items: CreateEstimateItemRequest[]): Promise<EstimateItem[]> {
    const response: AxiosResponse<ApiResponse<EstimateItem[]>> = await this.api.post(`/estimate-items/estimate/${estimateId}/bulk`, { items });
    return response.data.data!;
  }

  // Actuals
  async getActuals(params?: { page?: number; limit?: number; site_id?: number; estimate_id?: number; item_id?: number; date_from?: string; date_to?: string }): Promise<{ data: Actual[]; pagination: any; summary: any }> {
    const response: AxiosResponse<{ success: boolean; data: Actual[]; pagination: any; summary: any }> = await this.api.get('/actuals', { params });
    return {
      data: response.data.data,
      pagination: response.data.pagination,
      summary: response.data.summary
    };
  }

  async getActualById(id: number): Promise<Actual> {
    const response: AxiosResponse<ApiResponse<Actual>> = await this.api.get(`/actuals/${id}`);
    return response.data.data!;
  }

  async createActual(data: CreateActualRequest): Promise<Actual> {
    const response: AxiosResponse<ApiResponse<Actual>> = await this.api.post('/actuals', data);
    return response.data.data!;
  }

  async updateActual(id: number, data: Partial<CreateActualRequest>): Promise<Actual> {
    const response: AxiosResponse<ApiResponse<Actual>> = await this.api.put(`/actuals/${id}`, data);
    return response.data.data!;
  }

  async deleteActual(id: number): Promise<void> {
    await this.api.delete(`/actuals/${id}`);
  }

  async getActualsByEstimate(estimateId: number): Promise<{ actuals: Actual[]; summary: any }> {
    const response: AxiosResponse<ApiResponse<{ actuals: Actual[]; summary: any }>> = await this.api.get(`/actuals/estimate/${estimateId}`);
    return response.data.data!;
  }

  async getActualsByItem(itemId: number): Promise<{ item: EstimateItem; actuals: Actual[] }> {
    const response: AxiosResponse<ApiResponse<{ item: EstimateItem; actuals: Actual[] }>> = await this.api.get(`/actuals/item/${itemId}`);
    return response.data.data!;
  }

  async getActualsStatistics(): Promise<any> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get('/actuals/statistics');
    return response.data.data!;
  }

  // Variance Analysis
  async getVarianceAnalysis(params?: { site_id?: number; estimate_id?: number; category_id?: number; variance_threshold?: number }): Promise<{ variance_analysis: VarianceAnalysis[]; significant_variances: VarianceAnalysis[]; summary: VarianceSummary }> {
    const response: AxiosResponse<ApiResponse<{ variance_analysis: VarianceAnalysis[]; significant_variances: VarianceAnalysis[]; summary: VarianceSummary }>> = await this.api.get('/variance/analysis', { params });
    return response.data.data!;
  }

  async getVarianceBySite(): Promise<any[]> {
    const response: AxiosResponse<ApiResponse<any[]>> = await this.api.get('/variance/by-site');
    return response.data.data!;
  }

  async getVarianceByCategory(params?: { site_id?: number; estimate_id?: number }): Promise<any[]> {
    const response: AxiosResponse<ApiResponse<any[]>> = await this.api.get('/variance/by-category', { params });
    return response.data.data!;
  }

  async getVarianceTrends(params?: { site_id?: number; days?: number }): Promise<{ daily_trends: any[]; cumulative_trends: any[] }> {
    const response: AxiosResponse<ApiResponse<{ daily_trends: any[]; cumulative_trends: any[] }>> = await this.api.get('/variance/trends', { params });
    return response.data.data!;
  }

  async getTopVariances(params?: { limit?: number; type?: 'both' | 'over' | 'under' }): Promise<any[]> {
    const response: AxiosResponse<ApiResponse<any[]>> = await this.api.get('/variance/top', { params });
    return response.data.data!;
  }

  async getVarianceAlerts(params?: { threshold?: number }): Promise<{ variance_alerts: any[]; budget_alerts: any[] }> {
    const response: AxiosResponse<ApiResponse<{ variance_alerts: any[]; budget_alerts: any[] }>> = await this.api.get('/variance/alerts', { params });
    return response.data.data!;
  }

  // Reports
  async generateEstimateReport(estimateId: number, params?: { download?: boolean; filename?: string }): Promise<any> {
    const response = await this.api.get(`/reports/estimate/${estimateId}`, {
      params,
      responseType: params?.download ? 'blob' : 'json'
    });

    if (params?.download) {
      return response.data; // Blob for download
    }

    return response.data.data;
  }

  async generateVarianceReport(siteId: number, params?: { download?: boolean; filename?: string }): Promise<any> {
    const response = await this.api.get(`/reports/variance/${siteId}`, {
      params,
      responseType: params?.download ? 'blob' : 'json'
    });

    if (params?.download) {
      return response.data; // Blob for download
    }

    return response.data.data;
  }

  async generateSiteReport(siteId: number, params?: { download?: boolean; filename?: string }): Promise<any> {
    const response = await this.api.get(`/reports/site/${siteId}`, {
      params,
      responseType: params?.download ? 'blob' : 'json'
    });

    if (params?.download) {
      return response.data; // Blob for download
    }

    return response.data.data;
  }

  async getReportsList(): Promise<any[]> {
    const response: AxiosResponse<ApiResponse<any[]>> = await this.api.get('/reports/list');
    return response.data.data!;
  }

  async downloadReport(filename: string): Promise<Blob> {
    const response = await this.api.get(`/reports/download/${filename}`, {
      responseType: 'blob'
    });
    return response.data;
  }

  // Health Check
  async getHealth(): Promise<any> {
    const response: AxiosResponse<any> = await this.api.get('/health');
    return response.data;
  }

  // Dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    const [siteStats, estimateStats, actualsStats] = await Promise.all([
      this.getSiteStatistics(),
      this.getEstimateStatistics(),
      this.getActualsStatistics()
    ]);

    return {
      total_sites: siteStats.statistics?.total_sites || 0,
      active_sites: siteStats.statistics?.active_sites || 0,
      total_estimates: estimateStats.statistics?.total_estimates || 0,
      pending_estimates: estimateStats.statistics?.draft_estimates || 0,
      total_estimated_value: estimateStats.statistics?.total_estimated_value || 0,
      total_actual_value: actualsStats.statistics?.total_actual_cost || 0,
      total_purchased_value: actualsStats.statistics?.total_actual_cost || 0,
      overall_variance_percentage: actualsStats.statistics?.average_variance_percentage || 0,
    };
  }
}

export const apiService = new ApiService();
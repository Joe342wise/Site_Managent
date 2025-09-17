// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

export interface PaginationResponse<T> {
  success: boolean;
  data: {
    [key: string]: T[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalRecords: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}

// User Types
export interface User {
  user_id: number;
  username: string;
  email?: string;
  full_name?: string;
  role: 'admin' | 'manager' | 'supervisor' | 'accountant';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

// Site Types
export interface Site {
  site_id: number;
  name: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  budget_limit?: number;
  notes?: string;
  created_by?: number;
  created_by_username?: string;
  estimate_count?: number;
  total_estimated_amount?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateSiteRequest {
  name: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  status?: Site['status'];
  budget_limit?: number;
  notes?: string;
}

// Estimate Types
export interface Estimate {
  estimate_id: number;
  site_id: number;
  title: string;
  description?: string;
  date_created: string;
  version: number;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'archived';
  total_estimated: number;
  created_by?: number;
  site_name?: string;
  site_location?: string;
  created_by_username?: string;
  item_count?: number;
  calculated_total?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateEstimateRequest {
  site_id: number;
  title: string;
  description?: string;
  date_created?: string;
}

// Category Types
export interface Category {
  category_id: number;
  name: string;
  description?: string;
  sort_order: number;
  created_at: string;
}

// Estimate Item Types
export interface EstimateItem {
  item_id: number;
  estimate_id: number;
  description: string;
  category_id: number;
  quantity: number;
  unit: string;
  unit_price: number;
  total_estimated: number;
  notes?: string;
  category_name?: string;
  has_actuals?: number;
  total_actual_cost?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateEstimateItemRequest {
  estimate_id: number;
  description: string;
  category_id: number;
  quantity?: number;
  unit: string;
  unit_price: number;
  notes?: string;
}

// Actual Cost Types
export interface Actual {
  actual_id: number;
  item_id: number;
  actual_unit_price: number;
  actual_quantity?: number;
  total_actual: number;
  variance_amount: number;
  variance_percentage: number;
  date_recorded: string;
  notes?: string;
  recorded_by?: number;
  item_description?: string;
  estimated_quantity?: number;
  item_unit?: string;
  estimated_unit_price?: number;
  total_estimated?: number;
  category_name?: string;
  estimate_title?: string;
  site_name?: string;
  recorded_by_username?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateActualRequest {
  item_id: number;
  actual_unit_price: number;
  actual_quantity?: number;
  date_recorded?: string;
  notes?: string;
}

// Variance Analysis Types
export interface VarianceAnalysis {
  site_id: number;
  site_name: string;
  estimate_id: number;
  estimate_title: string;
  item_id: number;
  item_description: string;
  category_name: string;
  estimated_quantity: number;
  unit: string;
  estimated_unit_price: number;
  total_estimated: number;
  actual_unit_price: number;
  actual_quantity: number;
  total_actual: number;
  variance_amount: number;
  variance_percentage: number;
  variance_status: 'no_actual' | 'over_budget' | 'under_budget' | 'on_budget';
  date_recorded?: string;
}

export interface VarianceSummary {
  total_items: number;
  items_with_actuals: number;
  over_budget_items: number;
  under_budget_items: number;
  on_budget_items: number;
  significant_variances: number;
  total_estimated: number;
  total_actual: number;
  total_variance: number;
  overall_variance_percentage: number;
}

// Dashboard Types
export interface DashboardStats {
  total_sites: number;
  active_sites: number;
  total_estimates: number;
  pending_estimates: number;
  total_estimated_value: number;
  total_actual_value: number;
  overall_variance_percentage: number;
}

// Chart Data Types
export interface ChartData {
  name: string;
  value: number;
  estimated?: number;
  actual?: number;
  variance?: number;
}

// Report Types
export interface ReportRequest {
  estimate_id?: number;
  site_id?: number;
  download?: boolean;
  filename?: string;
}
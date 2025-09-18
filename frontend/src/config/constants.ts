// Application constants
export const APP_NAME = 'Construction Site Manager';

// Currency configuration - can be overridden by environment variables
export const CURRENCY = {
  code: (import.meta as any).env?.VITE_CURRENCY_CODE || 'GHS',
  locale: (import.meta as any).env?.VITE_CURRENCY_LOCALE || 'en-GH',
};

// Company information
export const COMPANY = {
  name: (import.meta as any).env?.VITE_COMPANY_NAME || "De'Aion Contractors",
  phone1: (import.meta as any).env?.VITE_COMPANY_PHONE1 || '0242838007',
  phone2: (import.meta as any).env?.VITE_COMPANY_PHONE2 || '0208936345',
};

// API configuration
export const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || '/api';

// Default pagination
export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;
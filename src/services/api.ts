import axios from 'axios';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  
  register: async (name: string, email: string, password: string) => {
    const response = await api.post('/auth/register', { name, email, password });
    return response.data;
  },
  
  getProfile: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

// Reports API
export const reportsAPI = {
  getReports: async () => {
    const response = await api.get('/reports');
    return response.data;
  },
  
  getReport: async (id: string) => {
    const response = await api.get(`/reports/${id}`);
    return response.data;
  },
  
  createReport: async (reportData: any) => {
    const response = await api.post('/reports', reportData);
    return response.data;
  },
  
  updateReport: async (id: string, reportData: any) => {
    const response = await api.put(`/reports/${id}`, reportData);
    return response.data;
  },
  
  deleteReport: async (id: string) => {
    const response = await api.delete(`/reports/${id}`);
    return response.data;
  },
  
  uploadReport: async (file: File, metadata: any) => {
    const formData = new FormData();
    formData.append('report', file);
    formData.append('metadata', JSON.stringify(metadata));
    
    const response = await api.post('/medical-reports/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  
  getUploadedReports: async () => {
    const response = await api.get('/medical-reports');
    return response.data;
  },

  deleteReport: async (id: string) => {
    const response = await api.delete(`/medical-reports/${id}`);
    return response.data;
  },

  downloadReport: async (id: string) => {
    const response = await api.get(`/medical-reports/${id}/download`, {
      responseType: 'blob',
    });
    return response;
  }
};

// AI API
export const aiAPI = {
  analyzeReport: async (reportData: any, reportType: string) => {
    const response = await api.post('/ai/analyze', { reportData, reportType });
    return response.data;
  },
  
  chat: async (message: string, context?: any) => {
    const response = await api.post('/ai/chat', { message, context });
    return response.data;
  },
  
  getSuggestions: async () => {
    const response = await api.get('/ai/suggestions');
    return response.data;
  }
};

// Clinics API (using external service)
export const clinicsAPI = {
  searchClinics: async (location: string, specialization?: string, radius?: number) => {
    // This would integrate with a real clinic search service
    // For now, we'll use mock data but structure it for real API integration
    const response = await api.get('/clinics/search', {
      params: { location, specialization, radius }
    });
    return response.data;
  },
  
  getClinicDetails: async (id: string) => {
    const response = await api.get(`/clinics/${id}`);
    return response.data;
  }
};

export default api;

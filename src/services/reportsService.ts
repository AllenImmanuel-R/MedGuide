import axios from 'axios';

export interface Report {
  _id: string;
  name: string;
  originalName: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadDate: string;
  readableSize: string;
  category: string;
  description?: string;
  tags?: string[];
}

export interface ReportAnalysisResult {
  success: boolean;
  data?: {
    analysis: string;
    reportInfo: {
      id: string;
      name: string;
      originalName: string;
      fileType: string;
      fileSize: number;
      uploadDate: string;
      category: string;
    };
    query: string;
    language: string;
    analysisType: 'medical_condition_detection' | 'document_analysis';
    timestamp: string;
    disclaimer: string;
  };
  error?: string;
}

class ReportsService {
  private api;
  private baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

  constructor() {
    this.api = axios.create({
      baseURL: this.baseURL,
      withCredentials: true,
    });

    // Add token to requests
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  /**
   * Get all reports for the current user
   */
  async getReports(): Promise<Report[]> {
    try {
      const response = await this.api.get('/reports');
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching reports:', error);
      throw error;
    }
  }

  /**
   * Analyze a report by ID and get health suggestions
   */
  async analyzeReport(
    reportId: string, 
    query: string = '', 
    language: string = 'en',
    userId?: string
  ): Promise<ReportAnalysisResult> {
    try {
      const response = await this.api.post('/ai/analyze-report', {
        reportId,
        query,
        language,
        userId
      });
      
      return response.data;
    } catch (error: any) {
      console.error('Error analyzing report:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to analyze report'
      };
    }
  }

  /**
   * Get a specific report by ID
   */
  async getReport(reportId: string): Promise<Report | null> {
    try {
      const response = await this.api.get(`/reports/${reportId}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching report:', error);
      return null;
    }
  }

  /**
   * Download a report file
   */
  async downloadReport(reportId: string, filename: string): Promise<void> {
    try {
      const response = await this.api.get(`/reports/${reportId}/download`, {
        responseType: 'blob',
      });
      
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading report:', error);
      throw error;
    }
  }

  /**
   * Analyze all user reports comprehensively
   */
  async analyzeAllReports(
    query: string = '', 
    language: string = 'en',
    userId?: string
  ): Promise<ReportAnalysisResult> {
    try {
      const response = await this.api.post('/ai/analyze-all-reports', {
        query,
        language,
        userId
      });
      
      return response.data;
    } catch (error: any) {
      console.error('Error analyzing all reports:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to analyze all reports'
      };
    }
  }

  /**
   * Get reports formatted for chat interface selection
   */
  async getReportsForChat(): Promise<Array<{ id: string; name: string; type: string; date: string; category: string }>> {
    try {
      const reports = await this.getReports();
      return reports.map(report => ({
        id: report._id,
        name: report.name,
        type: report.fileType,
        date: new Date(report.uploadDate).toLocaleDateString(),
        category: report.category
      }));
    } catch (error) {
      console.error('Error getting reports for chat:', error);
      return [];
    }
  }
}

export default new ReportsService();
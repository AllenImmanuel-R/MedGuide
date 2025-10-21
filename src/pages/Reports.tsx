import { useState, useEffect } from "react";
import { Upload, FileText, Trash2, Download, Plus, Calendar, User, Tag, Eye, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { EnergeticBackground, GlassCard, SectionHeader } from "@/components/ui/energetic-elements";
import '../styles/reports.css';

interface MedicalReport {
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

import axios from 'axios';

// API functions using axios (same as AuthContext)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

// Configure axios instance for reports
const reportsApi = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Add token to requests
reportsApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const apiCall = async (endpoint: string, options: any = {}) => {
  const response = await reportsApi({ url: endpoint, ...options });
  return response.data;
};

const uploadFiles = async (files: FileList) => {
  const formData = new FormData();
  
  Array.from(files).forEach((file) => {
    formData.append('reports', file);
  });
  
  const response = await reportsApi.post('/reports', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
};

const getAuthToken = () => {
  return localStorage.getItem('token');
};

const Reports = () => {
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      const response = await apiCall('/reports');
      setReports(response.data);
    } catch (error: any) {
      console.error('Error fetching reports:', error);
      
      if (error?.response?.status === 401) {
        toast({
          title: "Authentication Error",
          description: "Please log out and log back in to continue",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to load reports",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    try {
      setIsUploading(true);
      const response = await uploadFiles(files);
      
      // Refresh the reports list
      await fetchReports();
      
      toast({
        title: "Reports uploaded",
        description: `${response.count} file(s) uploaded successfully`,
      });
      
      // Reset file input
      event.target.value = '';
    } catch (error: any) {
      console.error('Error uploading reports:', error);
      
      if (error?.response?.status === 401) {
        toast({
          title: "Authentication Error",
          description: "Please log out and log back in to continue",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Upload failed",
          description: "Failed to upload reports. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsUploading(false);
    }
  };

  const deleteReport = async (id: string) => {
    try {
      await reportsApi.delete(`/reports/${id}`);
      
      // Remove from local state
      setReports(reports.filter((r) => r._id !== id));
      
      toast({
        title: "Report deleted",
        description: "Medical report removed from your records",
      });
    } catch (error) {
      console.error('Error deleting report:', error);
      toast({
        title: "Delete failed",
        description: "Failed to delete report. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const downloadReport = async (id: string, filename: string) => {
    try {
      const response = await reportsApi.get(`/reports/${id}/download`, {
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
      toast({
        title: "Download failed",
        description: "Failed to download report. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <EnergeticBackground>
      <div className="min-h-screen px-6 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Header Section */}
          <SectionHeader 
            title="Medical Reports" 
            subtitle={`Securely manage your medical documents${user ? ` - Welcome back, ${user.name}!` : ''}`}
          />

          {/* Upload Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <GlassCard className="p-8 upload-area">
              <label className="flex flex-col items-center gap-6 cursor-pointer">
                <motion.div 
                  className="upload-icon-container"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isUploading ? (
                    <Loader2 className="w-12 h-12 text-white animate-spin" />
                  ) : (
                    <Upload className="w-12 h-12 text-white" />
                  )}
                </motion.div>
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {isUploading ? 'Uploading...' : 'Upload Medical Reports'}
                  </h3>
                  <p className="text-white/70 mb-4">
                    Drag and drop files here or click to browse
                  </p>
                  <p className="text-sm text-white/50">
                    Supported: PDF, JPG, PNG, DOC, DOCX (Max 10MB per file)
                  </p>
                </div>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isUploading}
                />
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button 
                    className="upload-button" 
                    disabled={isUploading}
                    size="lg"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    {isUploading ? 'Uploading...' : 'Choose Files'}
                  </Button>
                </motion.div>
              </label>
            </GlassCard>
          </motion.div>

          {/* Reports List */}
          <div className="space-y-6">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Loader2 className="w-8 h-8 text-purple-400" />
                </motion.div>
              </div>
            ) : reports.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
              >
                <GlassCard className="p-12 text-center empty-state">
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <FileText className="w-16 h-16 text-white/50 mx-auto mb-6" />
                    <h3 className="text-xl font-semibold text-white mb-2">
                      No reports yet
                    </h3>
                    <p className="text-white/70">
                      Upload your first medical report to get started with secure document management.
                    </p>
                  </motion.div>
                </GlassCard>
              </motion.div>
            ) : (
              <AnimatePresence>
                {reports.map((report, index) => (
                  <motion.div
                    key={report._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                  >
                    <GlassCard className="report-card group">
                      <div className="p-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <motion.div 
                            className="report-icon"
                            whileHover={{ scale: 1.1, rotate: 5 }}
                          >
                            <FileText className="w-8 h-8 text-white" />
                          </motion.div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-white text-lg mb-1">
                              {report.name}
                            </h3>
                            <div className="flex items-center gap-4 text-sm text-white/60">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {new Date(report.uploadDate).toLocaleDateString()}
                              </div>
                              <div className="flex items-center gap-1">
                                <Tag className="w-4 h-4" />
                                {report.readableSize}
                              </div>
                              <div className="flex items-center gap-1">
                                <User className="w-4 h-4" />
                                {report.category}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 action-buttons">
                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                            <Button
                              variant="outline"
                              size="icon"
                              className="action-button download-button"
                              onClick={() => downloadReport(report._id, report.originalName)}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </motion.div>
                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                            <Button
                              variant="outline"
                              size="icon"
                              className="action-button delete-button"
                              onClick={() => deleteReport(report._id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </motion.div>
                        </div>
                      </div>
                    </GlassCard>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>
    </EnergeticBackground>
  );
};

export default Reports;

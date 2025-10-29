import { useState, useEffect } from "react";
import { Upload, FileText, Trash2, Download, Plus, Calendar, User, Tag, Eye, Loader2, MapPin, Globe, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { reportsAPI } from "@/services/api";

interface TravelMedicalReport {
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
  country?: string;
  travelDate?: string;
  isVaccination?: boolean;
  isPrescription?: boolean;
}

const Reports = () => {
  const [reports, setReports] = useState<TravelMedicalReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { toast } = useToast();
  const { user } = useAuth();

  // Load reports from API
  useEffect(() => {
    const loadReports = async () => {
      try {
        setLoading(true);
        const response = await reportsAPI.getUploadedReports();
        
        if (response.success) {
          setReports(response.data || []);
        } else {
          toast({
            title: 'Error loading reports',
            description: response.message || 'Failed to load medical reports',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Error loading reports:', error);
        toast({
          title: 'Error loading reports',
          description: 'Failed to load medical reports. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, [toast]);

  const categories = [
    { id: 'all', label: 'All Documents', icon: FileText, count: reports.length },
    { id: 'vaccination', label: 'Vaccinations', icon: Shield, count: reports.filter(r => r.isVaccination).length },
    { id: 'prescription', label: 'Prescriptions', icon: Tag, count: reports.filter(r => r.isPrescription).length },
    { id: 'medical', label: 'Medical Records', icon: FileText, count: reports.filter(r => !r.isVaccination && !r.isPrescription).length }
  ];

  const filteredReports = selectedCategory === 'all' 
    ? reports 
    : reports.filter(report => report.category === selectedCategory);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    
    try {
      const file = files[0];
      const metadata = {
        category: 'medical',
        description: 'Travel medical document',
        tags: ['travel', 'medical'],
        country: 'Unknown',
        travelDate: new Date().toISOString().split('T')[0]
      };
      
      const response = await reportsAPI.uploadReport(file, metadata);
      
      if (response.success) {
        const newReport: TravelMedicalReport = {
          _id: response.data.id,
          name: response.data.originalName,
          originalName: response.data.originalName,
          fileName: response.data.filename,
          fileSize: response.data.size,
          fileType: response.data.mimetype,
          uploadDate: response.data.uploadedAt,
          readableSize: `${(response.data.size / 1024 / 1024).toFixed(1)} MB`,
          category: 'medical',
          description: 'Travel medical document',
          tags: ['travel', 'medical'],
          country: 'Unknown',
          travelDate: new Date().toISOString().split('T')[0]
        };
        
        setReports(prev => [newReport, ...prev]);
        toast({
          title: 'Document uploaded successfully!',
          description: 'Your travel medical document has been added to your records.',
        });
      } else {
        toast({
          title: 'Upload failed',
          description: response.message || 'Failed to upload document',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: 'Failed to upload document. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'vaccination': return Shield;
      case 'prescription': return Tag;
      default: return FileText;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'vaccination': return 'bg-green-100 text-green-800';
      case 'prescription': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleViewReport = (report: TravelMedicalReport) => {
    // Open file in new tab using the URL from backend
    if (report.url) {
      window.open(`http://localhost:5000${report.url}`, '_blank');
    } else {
      toast({
        title: 'Error',
        description: 'File URL not available',
        variant: 'destructive',
      });
    }
  };

  const handleDownloadReport = async (report: TravelMedicalReport) => {
    try {
      const response = await reportsAPI.downloadReport(report._id);
      
      // Create blob URL and download
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = report.originalName || report.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: 'Download started',
        description: `Downloading ${report.name}`,
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: 'Download failed',
        description: 'Failed to download the file',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteReport = async (report: TravelMedicalReport) => {
    if (!confirm('Are you sure you want to delete this report?')) return;
    
    try {
      await reportsAPI.deleteMedicalReport(report._id);
      setReports(prev => prev.filter(r => r._id !== report._id));
      toast({
        title: 'Report deleted',
        description: `${report.name} has been deleted`,
      });
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: 'Delete failed',
        description: 'Failed to delete the report',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Travel Medical Records
          </h1>
          <p className="text-gray-600 text-lg">
            Manage your medical documents for safe and healthy travel
          </p>
        </motion.div>

        {/* Upload Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-900">Upload Travel Documents</CardTitle>
              <CardDescription>Add your medical records, vaccination certificates, and prescriptions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <div className="space-y-2">
                  <p className="text-lg font-medium text-gray-900">Upload your travel medical documents</p>
                  <p className="text-sm text-gray-500">PDF, JPG, PNG files up to 10MB</p>
                </div>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                  disabled={uploading}
                />
                <Button 
                  className="mt-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  disabled={uploading}
                  onClick={() => document.getElementById('file-upload')?.click()}
                  type="button"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Choose Files
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Categories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-6"
        >
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center space-x-2 ${
                    selectedCategory === category.id 
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white" 
                      : "hover:bg-gray-50"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{category.label}</span>
                  <Badge variant="secondary" className="ml-1">
                    {category.count}
                  </Badge>
                </Button>
              );
            })}
          </div>
        </motion.div>

        {/* Reports Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {loading ? (
            <div className="col-span-full flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
              <p className="text-gray-500">Upload your first travel medical document to get started.</p>
            </div>
          ) : (
            filteredReports.map((report) => {
              const CategoryIcon = getCategoryIcon(report.category);
              return (
                <motion.div
                  key={report._id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="p-2 bg-blue-50 rounded-lg">
                            <CategoryIcon className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-1">
                              {report.name}
                            </CardTitle>
                            <CardDescription className="text-sm text-gray-500">
                              {report.readableSize} • {report.fileType}
                            </CardDescription>
                          </div>
                        </div>
                        <Badge className={getCategoryColor(report.category)}>
                          {report.category}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {report.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {report.description}
                        </p>
                      )}
                      
                      {report.country && (
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <MapPin className="h-4 w-4" />
                          <span>{report.country}</span>
                        </div>
                      )}
                      
                      {report.travelDate && (
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <Calendar className="h-4 w-4" />
                          <span>Travel: {new Date(report.travelDate).toLocaleDateString()}</span>
                        </div>
                      )}
                      
                      {report.tags && report.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {report.tags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between pt-3 border-t">
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewReport(report)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDownloadReport(report)}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDeleteReport(report)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Reports;
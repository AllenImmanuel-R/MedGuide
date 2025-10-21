import { useState, useEffect } from 'react';
import { FileText, Calendar, Tag, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import reportsService, { Report } from '@/services/reportsService';
import { useTranslation } from 'react-i18next';

interface ReportSelectorProps {
  onSelectReport: (reportId: string, reportName: string) => void;
  isVisible: boolean;
  onClose: () => void;
}

const ReportSelector = ({ onSelectReport, isVisible, onClose }: ReportSelectorProps) => {
  const { t, i18n } = useTranslation(['chat', 'common']);
  const { toast } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  useEffect(() => {
    if (isVisible) {
      fetchReports();
    }
  }, [isVisible]);

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      const userReports = await reportsService.getReports();
      setReports(userReports);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast({
        title: "Error",
        description: "Failed to load your medical reports",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectReport = (report: Report) => {
    setSelectedReportId(report._id);
    onSelectReport(report._id, report.name);
  };

  const getFileTypeIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return '🖼️';
    } else if (fileType === 'application/pdf') {
      return '📄';
    } else {
      return '📋';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'lab-report':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'prescription':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'scan':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.2 }}
        className="absolute bottom-full left-0 right-0 mb-2 z-10"
      >
        <Card className="bg-white/95 backdrop-blur-sm border-gray-200 shadow-lg">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                {i18n.language === 'en' ? 'Select Report' : 'அறிக்கையை தேர்ந்தெடுக்கவும்'}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </Button>
            </div>

            <ScrollArea className="max-h-64">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  <span className="ml-2 text-gray-600">Loading reports...</span>
                </div>
              ) : reports.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                  <AlertCircle className="w-8 h-8 mb-2" />
                  <p className="text-sm">No medical reports found</p>
                  <p className="text-xs mt-1">Upload reports in the Reports page first</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {reports.map((report) => (
                    <motion.div
                      key={report._id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Card
                        className={`p-3 cursor-pointer transition-all duration-200 hover:shadow-md border ${
                          selectedReportId === report._id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handleSelectReport(report)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="text-2xl mt-1">
                            {getFileTypeIcon(report.fileType)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 truncate">
                              {report.name}
                            </h4>
                            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                              <Calendar className="w-3 h-3" />
                              {new Date(report.uploadDate).toLocaleDateString()}
                              <span>•</span>
                              <span>{report.readableSize}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge
                                variant="outline"
                                className={`text-xs ${getCategoryColor(report.category)}`}
                              >
                                <Tag className="w-3 h-3 mr-1" />
                                {report.category}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {reports.length > 0 && (
              <div className="mt-4 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-500 text-center">
                  💡 Click on a report to analyze it with AI and get personalized health suggestions
                </p>
              </div>
            )}
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};

export default ReportSelector;
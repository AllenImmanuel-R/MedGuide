import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, FileText, Image, AlertCircle, CheckCircle, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { reportsAPI } from '@/services/api';

interface UploadedReport {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadDate: Date;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  extractedText?: string;
  medicalData?: {
    conditions: string[];
    medications: string[];
    allergies: string[];
    dates: string[];
    symptoms: string[];
  };
}

interface MedicalReportUploadProps {
  onReportsChange: (reports: UploadedReport[]) => void;
}

const MedicalReportUpload: React.FC<MedicalReportUploadProps> = ({ onReportsChange }) => {
  const { t } = useTranslation();
  const [reports, setReports] = useState<UploadedReport[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  const acceptedFileTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/jpg'
  ];

  const handleFileUpload = useCallback(async (files: FileList) => {
    const newReports: UploadedReport[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (!acceptedFileTypes.includes(file.type)) {
        alert(t('chat.invalidFileType', { fileName: file.name }));
        continue;
      }

      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        alert(t('chat.fileTooLarge', { fileName: file.name }));
        continue;
      }

      const reportId = Date.now().toString() + i;
      const newReport: UploadedReport = {
        id: reportId,
        name: file.name,
        size: file.size,
        type: file.type,
        uploadDate: new Date(),
        status: 'uploading'
      };

      newReports.push(newReport);
      setUploadProgress(prev => ({ ...prev, [reportId]: 0 }));
    }

    setReports(prev => [...prev, ...newReports]);

    // Process each file
    for (const report of newReports) {
      try {
        const file = files[Array.from(files).findIndex(f => 
          f.name === report.name && f.size === report.size
        )];
        
        if (file) {
          await processReport(report, file);
        }
      } catch (error) {
        console.error('Error processing report:', error);
        updateReportStatus(report.id, 'error');
      }
    }

    onReportsChange([...reports, ...newReports]);
  }, [reports, onReportsChange, t]);

  const processReport = async (report: UploadedReport, file: File) => {
    updateReportStatus(report.id, 'processing');
    
    try {
      const result = await reportsAPI.uploadReport(file, { reportId: report.id });

      setReports(prev => prev.map(r =>
        r.id === report.id
          ? {
              ...r,
              status: 'completed'
            }
          : r
      ));

      setUploadProgress(prev => ({ ...prev, [report.id]: 100 }));
    } catch (error) {
      console.error('Error uploading report:', error);
      updateReportStatus(report.id, 'error');
    }
  };

  const updateReportStatus = (reportId: string, status: UploadedReport['status']) => {
    setReports(prev => prev.map(r => 
      r.id === reportId ? { ...r, status } : r
    ));
  };

  const removeReport = (reportId: string) => {
    const updatedReports = reports.filter(r => r.id !== reportId);
    setReports(updatedReports);
    onReportsChange(updatedReports);
    setUploadProgress(prev => {
      const updated = { ...prev };
      delete updated[reportId];
      return updated;
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files);
    }
  };

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return <FileText className="w-6 h-6 text-red-500" />;
    if (type.includes('image')) return <Image className="w-6 h-6 text-blue-500" />;
    return <FileText className="w-6 h-6 text-gray-500" />;
  };

  const getStatusIcon = (status: UploadedReport['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            {t('chat.uploadMedicalReports')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragOver
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                : 'border-gray-300 dark:border-gray-600'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-lg font-medium mb-2">
              {t('chat.dragDropFiles')}
            </p>
            <p className="text-sm text-gray-500 mb-4">
              {t('chat.supportedFormats')}: PDF, JPG, PNG
            </p>
            <input
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileInputChange}
              className="hidden"
              id="file-upload"
            />
            <Button asChild>
              <label htmlFor="file-upload" className="cursor-pointer">
                {t('chat.selectFiles')}
              </label>
            </Button>
          </div>

          {reports.length > 0 && (
            <div className="mt-6 space-y-3">
              <h3 className="font-medium">{t('chat.uploadedReports')}</h3>
              {reports.map((report) => (
                <div key={report.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getFileIcon(report.type)}
                      <div>
                        <p className="font-medium text-sm">{report.name}</p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(report.size)} • {report.uploadDate.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(report.status)}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeReport(report.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {(report.status === 'uploading' || report.status === 'processing') && (
                    <div className="mt-2">
                      <Progress 
                        value={uploadProgress[report.id] || 0} 
                        className="w-full"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {report.status === 'uploading' ? t('chat.uploading') : t('chat.processing')}
                      </p>
                    </div>
                  )}

                  {report.status === 'completed' && report.medicalData && (
                    <div className="mt-3 p-3 bg-green-50 dark:bg-green-950 rounded">
                      <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
                        {t('chat.extractedData')}:
                      </p>
                      <div className="text-xs text-green-700 dark:text-green-300 space-y-1">
                        {report.medicalData.conditions.length > 0 && (
                          <p><strong>{t('chat.conditions')}:</strong> {report.medicalData.conditions.join(', ')}</p>
                        )}
                        {report.medicalData.medications.length > 0 && (
                          <p><strong>{t('chat.medications')}:</strong> {report.medicalData.medications.join(', ')}</p>
                        )}
                        {report.medicalData.allergies.length > 0 && (
                          <p><strong>{t('chat.allergies')}:</strong> {report.medicalData.allergies.join(', ')}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {report.status === 'error' && (
                    <Alert className="mt-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        {t('chat.uploadError')}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MedicalReportUpload;
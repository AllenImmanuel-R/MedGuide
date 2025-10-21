import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import MedicalReportUpload from '@/components/MedicalReportUpload';

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

const TestMedicalReports = () => {
  const [reports, setReports] = useState<UploadedReport[]>([]);

  const handleReportsChange = (newReports: UploadedReport[]) => {
    setReports(newReports);
    console.log('Reports updated:', newReports);
  };

  const testBackendConnection = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/v1/ai/suggestions');
      const data = await response.json();
      console.log('Backend test result:', data);
      alert(`Backend Status: ${data.success ? 'Connected' : 'Failed'}\nMessage: ${data.data?.message || data.error}`);
    } catch (error) {
      console.error('Backend test failed:', error);
      alert(`Backend connection failed: ${error}`);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Medical Report Upload Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={testBackendConnection} variant="outline">
            Test Backend Connection
          </Button>
          
          <div className="border p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Upload Status:</h3>
            <p>Total Reports: {reports.length}</p>
            <p>Completed: {reports.filter(r => r.status === 'completed').length}</p>
            <p>Processing: {reports.filter(r => r.status === 'processing').length}</p>
            <p>Failed: {reports.filter(r => r.status === 'error').length}</p>
          </div>
        </CardContent>
      </Card>

      <MedicalReportUpload onReportsChange={handleReportsChange} />

      {reports.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Uploaded Reports Debug Info</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reports.map((report) => (
                <div key={report.id} className="border p-4 rounded-lg">
                  <h4 className="font-semibold">{report.name}</h4>
                  <p className="text-sm text-gray-600">Status: {report.status}</p>
                  <p className="text-sm text-gray-600">Size: {(report.size / 1024 / 1024).toFixed(2)} MB</p>
                  <p className="text-sm text-gray-600">Type: {report.type}</p>
                  
                  {report.extractedText && (
                    <div className="mt-2">
                      <h5 className="font-medium">Extracted Text (first 200 chars):</h5>
                      <p className="text-xs bg-gray-100 p-2 rounded">
                        {report.extractedText.substring(0, 200)}...
                      </p>
                    </div>
                  )}
                  
                  {report.medicalData && (
                    <div className="mt-2">
                      <h5 className="font-medium">Medical Data Extracted:</h5>
                      <div className="text-xs space-y-1">
                        {report.medicalData.conditions.length > 0 && (
                          <p><strong>Conditions:</strong> {report.medicalData.conditions.join(', ')}</p>
                        )}
                        {report.medicalData.medications.length > 0 && (
                          <p><strong>Medications:</strong> {report.medicalData.medications.join(', ')}</p>
                        )}
                        {report.medicalData.allergies.length > 0 && (
                          <p><strong>Allergies:</strong> {report.medicalData.allergies.join(', ')}</p>
                        )}
                        {report.medicalData.symptoms.length > 0 && (
                          <p><strong>Symptoms:</strong> {report.medicalData.symptoms.join(', ')}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TestMedicalReports;
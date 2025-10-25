
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Clock, XCircle } from "lucide-react";
import { AssessmentCase } from '@/types/assessmentCase';

interface CaseInformationProps {
  currentCase: AssessmentCase;
}

export const CaseInformation: React.FC<CaseInformationProps> = ({ currentCase }) => {
  const analysisResult = currentCase.analysis_result;
  
  console.log('=== CaseInformation Render ===');
  console.log('Case ID:', currentCase.id);
  console.log('Case status:', currentCase.status);
  console.log('Display name:', currentCase.display_name);
  console.log('Has analysis result:', !!analysisResult);
  console.log('Analysis status:', analysisResult?.status);
  console.log('Last updated:', currentCase.last_updated);
  
  // Determine status display information
  const getStatusInfo = () => {
    const status = currentCase.status;
    
    console.log('Determining status info for:', status);
    
    switch (status) {
      case 'completed':
        return {
          variant: 'default' as const,
          className: 'text-green-600 bg-green-50 border-green-200',
          icon: CheckCircle,
          text: 'Completed'
        };
      case 'completed_no_findings':
        return {
          variant: 'outline' as const,
          className: 'text-blue-600 bg-blue-50 border-blue-200',
          icon: AlertCircle,
          text: 'No Findings'
        };
      case 'document_processing_error':
        return {
          variant: 'destructive' as const,
          className: 'text-red-600 bg-red-50 border-red-200',
          icon: XCircle,
          text: 'Document Error'
        };
      case 'processing':
        return {
          variant: 'outline' as const,
          className: 'text-orange-600 bg-orange-50 border-orange-200',
          icon: Clock,
          text: 'Processing'
        };
      case 'error':
        return {
          variant: 'destructive' as const,
          className: 'text-red-600 bg-red-50 border-red-200',
          icon: XCircle,
          text: 'Error'
        };
      case 'draft':
        return {
          variant: 'outline' as const,
          className: 'text-gray-600 bg-gray-50 border-gray-200',
          icon: Clock,
          text: 'Draft'
        };
      default:
        return {
          variant: 'outline' as const,
          className: 'text-gray-600 bg-gray-50 border-gray-200',
          icon: AlertCircle,
          text: status
        };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;
  
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>
            Case Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Case Name</p>
              <p className="font-medium">Sarah Jones</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Case ID</p>
              <p className="font-medium text-xs">demo</p>
            </div>
          </div>

          <div className="mt-4">
            <p className="text-sm text-gray-600">Documents ({currentCase.documents.length})</p>
            <div className="mt-2 space-y-1">
              {currentCase.documents.map((doc, index) => (
                <div key={index} className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                  {doc.name} ({doc.type})
                </div>
              ))}
            </div>
          </div>
          
          {/* Show analysis summary for completed cases */}
          {analysisResult && currentCase.status === 'completed' && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center text-green-800 mb-2">
                <CheckCircle className="h-4 w-4 mr-2" />
                <span className="font-medium">Analysis Complete</span>
              </div>
              <div className="text-sm text-green-700">
                <p>Markdown report generated successfully ({analysisResult.markdown_report?.length || 0} characters)</p>
              </div>
            </div>
          )}

          {/* Show no findings message */}
          {currentCase.status === 'completed_no_findings' && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center text-blue-800 mb-2">
                <AlertCircle className="h-4 w-4 mr-2" />
                <span className="font-medium">No Actionable Findings</span>
              </div>
              <p className="text-sm text-blue-700">
                The analysis completed successfully but did not identify any functional impacts or accommodation needs. 
                Consider uploading additional documentation.
              </p>
            </div>
          )}

          {/* Show document processing error */}
          {currentCase.status === 'document_processing_error' && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center text-red-800 mb-2">
                <XCircle className="h-4 w-4 mr-2" />
                <span className="font-medium">Document Processing Error</span>
              </div>
              <p className="text-sm text-red-700">
                We couldn't read your document files. Please check that they are valid PDF files and try uploading again.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Show error message if analysis failed */}
      {(currentCase.status === 'error' || analysisResult?.status === 'failed') && analysisResult?.error_message && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              Analysis Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700">{analysisResult.error_message}</p>
          </CardContent>
        </Card>
      )}
    </>
  );
};

import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { DocumentFile } from "@/types/assessment";
import DocumentUpload from './DocumentUpload';
import { GradeSelection } from './GradeSelection';
import { Loader2, FileText, Eye, Zap, GraduationCap } from 'lucide-react';
import { ProgressSidebar } from './shared/ProgressSidebar';
import ThriveLogo from "@assets/isotype Y-NB_1754494460165.png";

interface UnifiedAssessmentFormProps {
  moduleType: 'k12' | 'post_secondary';
  pathway: 'simple' | 'complex';
  onBack: () => void;
}

export const UnifiedAssessmentForm: React.FC<UnifiedAssessmentFormProps> = ({ 
  moduleType, 
  pathway, 
  onBack 
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [documentFiles, setDocumentFiles] = useState<FileList | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<string>('');
  const [gradeError, setGradeError] = useState<string>('');
  const [uniqueId, setUniqueId] = useState<string>('');
  const [uniqueIdError, setUniqueIdError] = useState<string>('');
  const [reportAuthor, setReportAuthor] = useState<string>('');
  const [reportAuthorError, setReportAuthorError] = useState<string>('');

  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const clearAllFileInputs = () => {
    console.log('=== Clearing all file inputs after processing ===');
    Object.values(fileInputRefs.current).forEach(input => {
      if (input) {
        input.value = '';
      }
    });
    setDocumentFiles(null);
    setDocuments([]);
    console.log('✅ File inputs and document state cleared');
  };

  const handleSubmit = async () => {
    console.log(`=== Preparing ${moduleType.toUpperCase()} ${pathway.toUpperCase()} Assessment for Review ===`);

    // Validate unique ID
    if (!uniqueId.trim()) {
      setUniqueIdError('Please enter the student\'s unique ID');
      toast({
        title: "Unique ID Required",
        description: "Please enter the student's unique ID before proceeding.",
        variant: "destructive"
      });
      return;
    }

    // Validate report author
    if (!reportAuthor.trim()) {
      setReportAuthorError('Please enter the report author');
      toast({
        title: "Report Author Required",
        description: "Please enter who is creating this report.",
        variant: "destructive"
      });
      return;
    }

    // Validate grade selection for K-12
    if (moduleType === 'k12' && !selectedGrade) {
      setGradeError('Please select a grade level for K-12 assessment');
      toast({
        title: "Grade Required",
        description: "Please select the student's grade level before proceeding.",
        variant: "destructive"
      });
      return;
    }

    // Clear errors if validation passes
    setUniqueIdError('');
    setReportAuthorError('');
    setGradeError('');

    // Check for documents
    if (!documentFiles || documentFiles.length === 0) {
      toast({
        title: "No Documents",
        description: "Please upload at least one document for analysis.",
        variant: "destructive"
      });
      return;
    }

    // Convert FileList to array for serialization
    const filesArray = Array.from(documentFiles);
    
    // Navigate to review page with all assessment data
    console.log('Navigating to review page with documents:', documents.length);
    navigate('/review-documents', {
      state: {
        moduleType,
        pathway,
        uniqueId: uniqueId.trim(),
        reportAuthor: reportAuthor.trim(),
        selectedGrade,
        documents,
        filesArray
      }
    });
  };

  // Define progress steps
  const progressSteps = [
    {
      id: 'assessment-info',
      label: 'Assessment Info',
      icon: GraduationCap,
      status: 'active' as const
    },
    {
      id: 'document-upload',
      label: 'Document Upload',
      icon: FileText,
      status: 'pending' as const
    },
    {
      id: 'review',
      label: 'Review',
      icon: Eye,
      status: 'pending' as const
    },
    {
      id: 'analysis',
      label: 'Analysis',
      icon: Zap,
      status: 'pending' as const
    }
  ];

  // THRIVE brand colors
  const brandColors = {
    navyBlue: '#1297D2',
    skyBlue: '#96D7E1',
    orange: '#F89E54',
    yellow: '#FDE677',
  };

  return (
    <div className="flex min-h-screen">
      {/* Progress Sidebar */}
      <ProgressSidebar steps={progressSteps} />

      {/* Main Content Area */}
      <div className="flex-1 ml-64">
        {/* Blue Header Banner */}
        <div 
          className="py-8 px-8 flex items-center gap-4"
          style={{
            background: `linear-gradient(135deg, ${brandColors.navyBlue} 0%, ${brandColors.skyBlue} 100%)`
          }}
        >
          <img 
            src={ThriveLogo}
            alt="THRIVE"
            className="h-12 w-auto"
          />
          <h1 className="text-3xl font-bold text-white">
            {moduleType === 'k12' ? 'K-12' : 'Post-Secondary'} Assessment
          </h1>
        </div>

        {/* Content with Sky Blue Background */}
        <div 
          className="min-h-screen p-8"
          style={{
            background: `linear-gradient(to bottom, rgba(150, 215, 225, 0.1), rgba(150, 215, 225, 0.05))`
          }}
        >
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Assessment Information Card */}
            <div className="bg-white rounded-xl shadow-md p-8 border border-gray-200">
              <div className="flex items-center gap-3 mb-6">
                <div 
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: `${brandColors.skyBlue}40` }}
                >
                  <GraduationCap 
                    className="h-6 w-6"
                    style={{ color: brandColors.navyBlue }}
                  />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Assessment Information</h2>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="uniqueId" className="text-base font-semibold">Unique ID *</Label>
                  <Input
                    id="uniqueId"
                    type="text"
                    placeholder="e.g., STU-2025-001, CASE-12345, or any custom code"
                    value={uniqueId}
                    onChange={(e) => setUniqueId(e.target.value)}
                    className={`h-12 ${uniqueIdError ? 'border-red-500' : ''}`}
                    data-testid="input-unique-id"
                  />
                  {uniqueIdError && <p className="text-sm text-red-500">{uniqueIdError}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reportAuthor" className="text-base font-semibold">Report Author *</Label>
                  <Input
                    id="reportAuthor"
                    type="text"
                    placeholder="Enter who is creating this report"
                    value={reportAuthor}
                    onChange={(e) => setReportAuthor(e.target.value)}
                    className={`h-12 ${reportAuthorError ? 'border-red-500' : ''}`}
                    data-testid="input-report-author"
                  />
                  {reportAuthorError && <p className="text-sm text-red-500">{reportAuthorError}</p>}
                </div>

                {moduleType === 'k12' && (
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Grade Level *</Label>
                    <GradeSelection
                      selectedGrade={selectedGrade}
                      onGradeChange={setSelectedGrade}
                      error={gradeError}
                    />
                    {gradeError && <p className="text-sm text-red-500">{gradeError}</p>}
                  </div>
                )}
              </div>
            </div>

            {/* Document Upload Card */}
            <div className="bg-white rounded-xl shadow-md p-8 border border-gray-200">
              <div className="flex items-center gap-3 mb-6">
                <div 
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: `${brandColors.orange}40` }}
                >
                  <FileText 
                    className="h-6 w-6"
                    style={{ color: brandColors.orange }}
                  />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Document Upload</h2>
              </div>

              <DocumentUpload
                documents={documents}
                setDocuments={setDocuments}
                onFilesChange={setDocumentFiles}
                fileInputRefs={fileInputRefs}
              />
            </div>

            {/* Submit Button */}
            <div className="pt-4 flex justify-end">
              <Button
                onClick={handleSubmit}
                disabled={isProcessing}
                size="lg"
                className="px-8 h-14 text-lg font-semibold"
                style={{
                  backgroundColor: brandColors.orange,
                  borderColor: brandColors.orange
                }}
                data-testid="button-start-analysis"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-5 w-5" />
                    Start Analysis
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
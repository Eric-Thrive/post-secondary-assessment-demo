import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';
import { DocumentFile } from "@/types/assessment";
import DocumentUpload from './DocumentUpload';
import { GradeSelection } from './GradeSelection';
import { DeidentificationHeroCard } from './DeidentificationHeroCard';
import { Loader2, FileText, Eye, Zap, GraduationCap, User } from 'lucide-react';
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
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('assessment-info');
  const [activeDocumentSubSection, setActiveDocumentSubSection] = useState<'deidentification' | 'upload'>('deidentification');
  
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

  const handleNextSection = () => {
    if (activeSection === 'assessment-info') {
      // Validate assessment info before moving to documents
      if (!uniqueId.trim()) {
        setUniqueIdError('Please enter the student\'s unique ID');
        toast({
          title: "Unique ID Required",
          description: "Please enter the student's unique ID before proceeding.",
          variant: "destructive"
        });
        return;
      }

      if (!reportAuthor.trim()) {
        setReportAuthorError('Please enter the report author');
        toast({
          title: "Report Author Required",
          description: "Please enter who is creating this report.",
          variant: "destructive"
        });
        return;
      }

      if (moduleType === 'k12' && !selectedGrade) {
        setGradeError('Please select a grade level for K-12 assessment');
        toast({
          title: "Grade Required",
          description: "Please select the student's grade level before proceeding.",
          variant: "destructive"
        });
        return;
      }

      // Clear errors and move to next section
      setUniqueIdError('');
      setReportAuthorError('');
      setGradeError('');
      // Reset to first sub-section when entering document section
      setActiveDocumentSubSection('deidentification');
      setActiveSection('document-upload');
    } else if (activeSection === 'document-upload') {
      // This will trigger the final submission
      handleSubmit();
    }
  };

  const handlePreviousSection = () => {
    if (activeSection === 'document-upload') {
      // Reset to first sub-section when re-entering document section
      setActiveDocumentSubSection('deidentification');
      setActiveSection('assessment-info');
    }
  };

  const handleSectionClick = (sectionId: string) => {
    // Validate whenever entering document-upload section
    if (sectionId === 'document-upload') {
      // Validate assessment info before allowing navigation to documents
      if (!uniqueId.trim()) {
        setUniqueIdError('Please enter the student\'s unique ID');
        toast({
          title: "Unique ID Required",
          description: "Please enter the student's unique ID before proceeding.",
          variant: "destructive"
        });
        return;
      }

      if (!reportAuthor.trim()) {
        setReportAuthorError('Please enter the report author');
        toast({
          title: "Report Author Required",
          description: "Please enter who is creating this report.",
          variant: "destructive"
        });
        return;
      }

      if (moduleType === 'k12' && !selectedGrade) {
        setGradeError('Please select a grade level for K-12 assessment');
        toast({
          title: "Grade Required",
          description: "Please select the student's grade level before proceeding.",
          variant: "destructive"
        });
        return;
      }

      // Clear errors
      setUniqueIdError('');
      setReportAuthorError('');
      setGradeError('');
      // Reset to first sub-section when entering document section
      setActiveDocumentSubSection('deidentification');
    }

    // Set active section (backward navigation allowed without validation)
    setActiveSection(sectionId);
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

  // THRIVE brand colors
  const brandColors = {
    navyBlue: '#1297D2',
    skyBlue: '#96D7E1',
    orange: '#F89E54',
    yellow: '#FDE677',
  };

  // Define progress sections
  const progressSections = [
    {
      id: 'assessment-info',
      label: 'Assessment Info',
      icon: GraduationCap,
      status: 'pending' as const,
      iconColor: brandColors.orange
    },
    {
      id: 'document-upload',
      label: 'Document Upload',
      icon: FileText,
      status: 'pending' as const,
      iconColor: brandColors.navyBlue
    }
  ];

  return (
    <div className="flex min-h-screen">
      {/* Progress Sidebar */}
      <ProgressSidebar 
        steps={progressSections} 
        activeSection={activeSection}
        onSectionClick={handleSectionClick}
      />
      {/* Main Content Area */}
      <div className="flex-1 ml-64">
        {/* Blue Header Banner */}
        <div 
          className="py-8 px-8 flex items-center justify-between"
          style={{
            background: `linear-gradient(135deg, ${brandColors.navyBlue} 0%, ${brandColors.skyBlue} 100%)`
          }}
        >
          <div className="flex items-center gap-4">
            <img 
              src={ThriveLogo}
              alt="THRIVE"
              className="h-12 w-auto"
            />
            <h1 className="text-3xl font-bold text-white">
              {moduleType === 'k12' ? 'K-12' : 'Post-Secondary'} Assessment
            </h1>
          </div>
          {user && (
            <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg backdrop-blur-sm" data-testid="user-indicator">
              <User className="h-5 w-5 text-white" />
              <span className="text-white font-medium" data-testid="text-username">{user.username || 'User'}</span>
            </div>
          )}
        </div>

        {/* Assessment Information Section */}
        {activeSection === 'assessment-info' && (
          <div 
            className="min-h-screen p-8"
            style={{
              background: 'linear-gradient(to right, rgba(150, 215, 225, 0.2), rgba(150, 215, 225, 0.3), rgba(150, 215, 225, 0.1))'
            }}
          >
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-xl shadow-lg p-10 border border-gray-200">
                <h2 className="text-3xl font-bold text-gray-800 mb-8">
                  {moduleType === 'k12' ? 'Student' : 'Student'} Information & Report Details
                </h2>

                <div className="space-y-8">
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <Label htmlFor="uniqueId" className="text-base font-semibold text-gray-700">Unique ID *</Label>
                      <Input
                        id="uniqueId"
                        type="text"
                        placeholder="e.g., STU-2025-001, CZ, or any custom code"
                        value={uniqueId}
                        onChange={(e) => setUniqueId(e.target.value)}
                        className={`h-12 ${uniqueIdError ? 'border-red-500' : ''}`}
                        data-testid="input-unique-id"
                      />
                      {uniqueIdError && <p className="text-sm text-red-500">{uniqueIdError}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="reportAuthor" className="text-base font-semibold text-gray-700">Report Author *</Label>
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
                  </div>

                  {moduleType === 'k12' && (
                    <div className="space-y-2">
                      <Label className="text-base font-semibold text-gray-700">Grade Level *</Label>
                      <GradeSelection
                        selectedGrade={selectedGrade}
                        onGradeChange={setSelectedGrade}
                        error={gradeError}
                      />
                      {gradeError && <p className="text-sm text-red-500">{gradeError}</p>}
                    </div>
                  )}
                </div>

                {/* Next Section Button */}
                <div className="mt-10 flex justify-end">
                  <Button
                    onClick={handleNextSection}
                    size="lg"
                    className="px-8 h-12 text-base font-semibold"
                    style={{
                      backgroundColor: brandColors.skyBlue,
                      color: '#1e40af'
                    }}
                    data-testid="button-next-section"
                  >
                    Next Section →
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Document Upload Section */}
        {activeSection === 'document-upload' && (
          <div 
            className="min-h-screen p-8"
            style={{
              background: 'linear-gradient(to right, rgba(248, 158, 84, 0.2), rgba(248, 158, 84, 0.3), rgba(248, 158, 84, 0.1))'
            }}
          >
            <div className="max-w-4xl mx-auto">
              {/* De-identification Sub-section */}
              {activeDocumentSubSection === 'deidentification' && (
                <div className="bg-white rounded-xl shadow-lg p-10 border border-gray-200">
                  <h2 className="text-3xl font-bold text-gray-800 mb-8">Document De-identification</h2>
                  
                  <DeidentificationHeroCard />
                  
                  {/* Navigation Buttons */}
                  <div className="mt-10 flex justify-between">
                    <Button
                      onClick={handlePreviousSection}
                      variant="outline"
                      size="lg"
                      className="px-8 h-12 text-base font-semibold"
                      data-testid="button-previous-from-deidentification"
                    >
                      ← Previous
                    </Button>

                    <Button
                      onClick={() => setActiveDocumentSubSection('upload')}
                      size="lg"
                      className="px-8 h-12 text-base font-semibold"
                      style={{
                        backgroundColor: brandColors.skyBlue,
                        color: '#1e40af'
                      }}
                      data-testid="button-next-to-upload"
                    >
                      Next Section →
                    </Button>
                  </div>
                </div>
              )}

              {/* Document Upload Sub-section */}
              {activeDocumentSubSection === 'upload' && (
                <div className="bg-white rounded-xl shadow-lg p-10 border border-gray-200">
                  <h2 className="text-3xl font-bold text-gray-800 mb-8">Documents Upload</h2>

                  <DocumentUpload
                    documents={documents}
                    setDocuments={setDocuments}
                    onFilesChange={setDocumentFiles}
                    fileInputRefs={fileInputRefs}
                  />

                  {/* Navigation Buttons */}
                  <div className="mt-10 flex justify-between">
                    <Button
                      onClick={() => setActiveDocumentSubSection('deidentification')}
                      variant="outline"
                      size="lg"
                      className="px-8 h-12 text-base font-semibold"
                      data-testid="button-back-to-deidentification"
                    >
                      ← Previous
                    </Button>

                    <Button
                      onClick={handleNextSection}
                      disabled={isProcessing}
                      size="lg"
                      className="px-8 h-12 text-base font-semibold"
                      style={{
                        backgroundColor: brandColors.skyBlue,
                        color: '#1e40af'
                      }}
                      data-testid="button-start-analysis"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        'Start Analysis →'
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
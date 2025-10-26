
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { DocumentFile } from "@/types/assessment";
import { useModuleAssessmentData } from "@/hooks/useModuleAssessmentData";
import { useModule } from "@/contexts/ModuleContext";
import DocumentUpload from './DocumentUpload';
import { PDFTestWidget } from './PDFTestWidget';
import { GradeSelection } from './GradeSelection';
import { DeidentificationHeroCard } from './DeidentificationHeroCard';

const NewAssessment = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isK12, activeModule } = useModule();
  const { createAssessment, processAssessment, isProcessing } = useModuleAssessmentData(activeModule);
  
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [documentFiles, setDocumentFiles] = useState<FileList | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<string>('');
  const [gradeError, setGradeError] = useState<string>('');
  const [studentName, setStudentName] = useState<string>('');
  const [nameError, setNameError] = useState<string>('');
  const [activeDocumentView, setActiveDocumentView] = useState<'deidentification' | 'upload'>('deidentification');

  const handleSubmit = async () => {
    // Validate student name (required for all modules)
    if (!studentName.trim()) {
      setNameError('Please enter the student\'s name');
      toast({
        title: "Student Name Required",
        description: "Please enter the student's name before proceeding.",
        variant: "destructive"
      });
      return;
    }

    // Clear name error if validation passes
    setNameError('');

    // Validate grade selection for K-12
    if (isK12 && !selectedGrade) {
      setGradeError('Please select a grade level for K-12 assessment');
      toast({
        title: "Grade Required",
        description: "Please select the student's grade level before proceeding.",
        variant: "destructive"
      });
      return;
    }

    // Clear grade error if validation passes
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

    try {
      // Create assessment case with documents and student name
      const assessmentCase = await createAssessment(documents, studentName.trim());
      
      toast({
        title: "Processing Started",
        description: "AI analysis is running. This may take a few minutes..."
      });

      // Process with AI using the case object directly, including student name
      await processAssessment(assessmentCase, documentFiles, selectedGrade, studentName.trim());
      
      toast({
        title: "Analysis Completed",
        description: "Redirecting to your report..."
      });

      // Reset form
      setDocuments([]);
      setDocumentFiles(null);
      setSelectedGrade('');
      setGradeError('');
      setStudentName('');
      setNameError('');
      
      // Navigate to the correct reports page based on active module
      const reportsPage = activeModule === 'k12' ? '/k12-reports' : 
                         activeModule === 'tutoring' ? '/tutoring-reports' : 
                         '/post-secondary-reports';
      
      navigate(reportsPage);
    } catch (error) {
      console.error('Assessment submission failed:', error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {activeModule === 'k12' ? 'K-12 AI Document Analysis' : 
             activeModule === 'tutoring' ? 'Tutoring AI Document Analysis' : 
             'Post-Secondary AI Document Analysis'}
          </h1>
          <p className="text-gray-600 mt-1">
            Upload documents and get instant AI-powered {activeModule === 'tutoring' ? 'tutoring support' : 'accommodation'} analysis
            {activeModule === 'k12' && ' tailored for K-12 students'}
            {activeModule === 'tutoring' && ' tailored for tutoring environments'}
          </p>
        </div>
        <Button 
          onClick={handleSubmit} 
          disabled={isProcessing} 
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isProcessing ? "Analyzing..." : "Analyze Documents"}
        </Button>
      </div>

      {/* Student Name Input - Always visible for all modules */}
      <div className={`rounded-lg p-4 space-y-4 ${
        activeModule === 'tutoring' ? 'bg-green-50 border border-green-200' : 
        activeModule === 'k12' ? 'bg-blue-50 border border-blue-200' : 
        'bg-purple-50 border border-purple-200'
      }`}>
        <div className="space-y-2">
          <Label htmlFor="studentName" className={`text-sm font-medium ${
            activeModule === 'tutoring' ? 'text-green-900' : 
            activeModule === 'k12' ? 'text-blue-900' : 
            'text-purple-900'
          }`}>
            Student Name *
          </Label>
          <Input
            id="studentName"
            type="text"
            placeholder="Enter student's full name"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            className={nameError ? 'border-red-500' : ''}
          />
          {nameError && (
            <span className="text-sm font-medium text-red-600">
              {nameError}
            </span>
          )}
        </div>
        
        {isK12 && (
          <GradeSelection
            selectedGrade={selectedGrade}
            onGradeChange={setSelectedGrade}
            error={gradeError}
          />
        )}
      </div>

      {/* De-identification Screen */}
      {activeDocumentView === 'deidentification' && (
        <div className="space-y-6">
          <DeidentificationHeroCard />
          <div className="flex justify-end">
            <Button
              onClick={() => setActiveDocumentView('upload')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Next: Upload Documents →
            </Button>
          </div>
        </div>
      )}

      {/* Document Upload Screen */}
      {activeDocumentView === 'upload' && (
        <div className="space-y-6">
          <div className="flex justify-start">
            <Button
              variant="outline"
              onClick={() => setActiveDocumentView('deidentification')}
            >
              ← Back to De-identification
            </Button>
          </div>

          <PDFTestWidget />

          <DocumentUpload
            documents={documents}
            setDocuments={setDocuments}
            onFilesChange={setDocumentFiles}
          />
        </div>
      )}
    </div>
  );
};

export default NewAssessment;

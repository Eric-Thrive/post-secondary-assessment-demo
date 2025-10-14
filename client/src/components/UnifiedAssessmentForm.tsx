import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { DocumentFile } from "@/types/assessment";
import DocumentUpload from './DocumentUpload';
import { GradeSelection } from './GradeSelection';
import { Loader2, ArrowLeft } from 'lucide-react';

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
  const [programMajor, setProgramMajor] = useState<string>('');
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
    console.log(`=== Starting ${moduleType.toUpperCase()} ${pathway.toUpperCase()} Assessment Submission ===`);

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

    try {
      setIsProcessing(true);
      console.log(`Creating ${moduleType} ${pathway} assessment case...`);
      console.log('Unique ID:', uniqueId);
      console.log('Report Author:', reportAuthor);
      console.log('Program/Major:', programMajor);
      console.log('Selected grade:', selectedGrade);
      console.log('Documents to process:', documentFiles.length);

      // Extract text from all documents using proper document processor
      const extractedDocs = [];
      for (let i = 0; i < documentFiles.length; i++) {
        const file = documentFiles[i];
        console.log(`Extracting text from ${file.name}...`);
        
        const { documentProcessor } = await import('@/services/document/documentProcessor');
        const text = await documentProcessor.extractTextFromFile(file);
        extractedDocs.push({
          filename: file.name,
          content: text
        });
      }

      // Generate proper UUID for case ID
      const caseId = crypto.randomUUID();

      toast({
        title: "Processing Started",
        description: `${moduleType.toUpperCase()} AI analysis using ${pathway} pathway is running. This may take a few minutes...`
      });
      
      console.log(`Starting ${moduleType} AI processing using ${pathway} pathway...`);

      // Determine which endpoint to use based on environment
      const environment = localStorage.getItem('app-environment') || 'replit-prod';
      const isDemoEnvironment = environment.includes('demo');
      const endpoint = isDemoEnvironment ? '/api/demo-analyze-assessment' : '/api/analyze-assessment';
      
      console.log(`Using endpoint: ${endpoint} (environment: ${environment}, isDemo: ${isDemoEnvironment})`);

      // Call the appropriate analysis endpoint
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Environment': environment
        },
        body: JSON.stringify({
          caseId,
          documents: extractedDocs,
          moduleType,
          pathway, // This is the key new parameter
          uniqueId: uniqueId.trim(),
          programMajor: programMajor.trim(),
          reportAuthor: reportAuthor.trim(),
          studentGrade: selectedGrade,
          environment
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `${moduleType.toUpperCase()} analysis failed`);
      }

      const result = await response.json();
      console.log(`✅ ${moduleType.toUpperCase()} ${pathway} analysis completed:`, result);
      
      toast({
        title: "Analysis Completed",
        description: `Documents have been processed and cleaned up. Redirecting to your ${moduleType.toUpperCase()} report...`
      });

      // Clear all file inputs and document state after successful processing
      clearAllFileInputs();
      
      // Reset form
      setUniqueId('');
      setProgramMajor('');
      setReportAuthor('');
      setSelectedGrade('');
      setUniqueIdError('');
      setReportAuthorError('');
      setGradeError('');
      
      // Navigate to appropriate reports page
      const reportsPath = moduleType === 'k12' ? '/k12-reports' : '/post-secondary-reports';
      console.log(`Navigating to ${reportsPath}...`);
      navigate(reportsPath);
      
    } catch (error) {
      console.error(`${moduleType.toUpperCase()} ${pathway} Assessment submission failed:`, error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred during analysis.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          {moduleType === 'k12' ? 'K-12' : 'Post-Secondary'} Assessment
        </h1>
        <p className="text-muted-foreground">
          Using {pathway} analysis pathway
        </p>
      </div>

      {/* Assessment Information */}
      <div className="space-y-4 p-4 border rounded-lg">
        <h3 className="text-lg font-semibold">Assessment Information</h3>
        
        <div className="space-y-2">
          <Label htmlFor="uniqueId">Unique ID *</Label>
          <Input
            id="uniqueId"
            type="text"
            placeholder="Enter student's unique ID"
            value={uniqueId}
            onChange={(e) => setUniqueId(e.target.value)}
            className={uniqueIdError ? 'border-red-500' : ''}
            data-testid="input-unique-id"
          />
          {uniqueIdError && <p className="text-sm text-red-500">{uniqueIdError}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="programMajor">Program/Major</Label>
          <Input
            id="programMajor"
            type="text"
            placeholder="Enter student's program or major"
            value={programMajor}
            onChange={(e) => setProgramMajor(e.target.value)}
            data-testid="input-program-major"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="reportAuthor">Report Author *</Label>
          <Input
            id="reportAuthor"
            type="text"
            placeholder="Enter who is creating this report"
            value={reportAuthor}
            onChange={(e) => setReportAuthor(e.target.value)}
            className={reportAuthorError ? 'border-red-500' : ''}
            data-testid="input-report-author"
          />
          {reportAuthorError && <p className="text-sm text-red-500">{reportAuthorError}</p>}
        </div>


        {moduleType === 'k12' && (
          <div className="space-y-2">
            <Label>Grade Level *</Label>
            <GradeSelection
              selectedGrade={selectedGrade}
              onGradeChange={setSelectedGrade}
              error={gradeError}
            />
            {gradeError && <p className="text-sm text-red-500">{gradeError}</p>}
          </div>
        )}
      </div>

      {/* Document Upload */}
      <div className="space-y-4 p-4 border rounded-lg">
        <h3 className="text-lg font-semibold">Document Upload</h3>
        <DocumentUpload
          documents={documents}
          setDocuments={setDocuments}
          onFilesChange={setDocumentFiles}
          fileInputRefs={fileInputRefs}
        />
      </div>

      {/* Submit Button */}
      <div className="pt-4">
        <Button
          onClick={handleSubmit}
          disabled={isProcessing}
          className="w-full"
          size="lg"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing {pathway.charAt(0).toUpperCase() + pathway.slice(1)} Analysis...
            </>
          ) : (
            `Start ${pathway.charAt(0).toUpperCase() + pathway.slice(1)} Analysis`
          )}
        </Button>
      </div>
    </div>
  );
};
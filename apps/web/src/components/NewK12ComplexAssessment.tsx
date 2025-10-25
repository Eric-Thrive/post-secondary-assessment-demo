import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PDFTestWidget } from '@/components/PDFTestWidget';
import DocumentUpload from '@/components/DocumentUpload';
import { GradeSelection } from '@/components/GradeSelection';
import { Loader2 } from 'lucide-react';
import type { DocumentFile } from '@/types/assessment';

const NewK12ComplexAssessment = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [documentFiles, setDocumentFiles] = useState<FileList | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<string>('');
  const [gradeError, setGradeError] = useState<string>('');
  const [studentName, setStudentName] = useState<string>('');
  const [nameError, setNameError] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Add ref to track file inputs for cleanup
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const clearAllFileInputs = () => {
    console.log('=== Clearing all file inputs after processing ===');
    Object.values(fileInputRefs.current).forEach(input => {
      if (input) {
        input.value = '';
      }
    });
    // Clear memory references
    setDocumentFiles(null);
    setDocuments([]);
    console.log('✅ File inputs and document state cleared');
  };

  const handleSubmit = async () => {
    console.log('=== Starting K-12 Complex Assessment Submission ===');

    // Validate student name
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
    if (!selectedGrade) {
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
      setIsProcessing(true);
      console.log('🔄 Processing K-12 Complex Analysis with three-step workflow...');
      
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

      // Determine which endpoint to use based on environment
      const environment = localStorage.getItem('app-environment') || 'replit-prod';
      const isDemoEnvironment = environment.includes('demo');
      const endpoint = isDemoEnvironment ? '/api/demo-analyze-assessment' : '/api/analyze-assessment-k12';
      
      console.log(`Using K12 endpoint: ${endpoint} (environment: ${environment}, isDemo: ${isDemoEnvironment})`);

      // Call the appropriate K-12 analysis endpoint
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Environment': environment
        },
        body: JSON.stringify({
          caseId,
          documents: extractedDocs,
          documentFiles: Array.from(documentFiles).map(file => ({
            name: file.name,
            size: file.size,
            type: file.type
          })),
          moduleType: 'k12',
          studentName: studentName.trim(),
          studentGrade: selectedGrade,
          environment
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Analysis failed');
      }

      const result = await response.json();
      console.log('✅ K-12 Complex Analysis completed:', result);

      toast({
        title: "Analysis Complete",
        description: "K-12 complex analysis has been completed successfully.",
      });

      // Clear all file inputs and document state
      clearAllFileInputs();

      // Navigate to K-12 reports page after successful completion
      navigate('/k12-reports');
    } catch (error) {
      console.error('K-12 Complex Assessment submission failed:', error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            K-12 Complex AI Analysis
          </h1>
          <p className="text-gray-600 mt-1">
            Advanced three-step workflow: Technical identification → Canonical matching → Item master population
          </p>
        </div>
        <Button 
          onClick={handleSubmit} 
          disabled={isProcessing} 
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            "Run Complex Analysis"
          )}
        </Button>
      </div>

      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
        <h3 className="font-semibold text-emerald-900 mb-2">Complex Analysis Features:</h3>
        <ul className="space-y-1 text-sm text-emerald-800">
          <li>• AI-powered function calling for comprehensive analysis</li>
          <li>• Canonical key resolution with semantic matching</li>
          <li>• Structured item master data population</li>
          <li>• Both matched and inferred accommodations tracked</li>
          <li>• Quality control flags for validation</li>
        </ul>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="studentName" className="text-sm font-medium text-blue-900">
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
        
        <GradeSelection
          selectedGrade={selectedGrade}
          onGradeChange={setSelectedGrade}
          error={gradeError}
        />
      </div>

      <PDFTestWidget />

      <DocumentUpload 
        documents={documents} 
        setDocuments={setDocuments} 
        onFilesChange={setDocumentFiles}
        fileInputRefs={fileInputRefs}
      />
    </div>
  );
};

export default NewK12ComplexAssessment;
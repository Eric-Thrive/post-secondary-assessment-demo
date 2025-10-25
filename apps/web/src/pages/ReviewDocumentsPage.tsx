import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle2, FileText, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { DocumentFile } from "@/types/assessment";

interface ReviewDocumentsState {
  moduleType: 'k12' | 'post_secondary' | 'tutoring';
  pathway: 'simple' | 'complex';
  uniqueId: string;
  reportAuthor: string;
  selectedGrade?: string;
  documents: DocumentFile[];
  filesArray: File[];
}

const ReviewDocumentsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const state = location.state as ReviewDocumentsState | undefined;

  if (!state) {
    navigate('/');
    return null;
  }

  const { moduleType, pathway, uniqueId, reportAuthor, selectedGrade, documents, filesArray } = state;

  const finalizedDocuments = documents.filter(doc => doc.finalized === true);

  const parseFileTimestamp = (filename: string): string | null => {
    const match = filename.match(/_FINALIZED_(\d{8})_(\d{4})/);
    if (!match) return null;
    
    const dateStr = match[1];
    const timeStr = match[2];
    
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    const hours = timeStr.substring(0, 2);
    const minutes = timeStr.substring(2, 4);
    
    return `${month}/${day}/${year} ${hours}:${minutes}`;
  };

  const handleProceedToAnalysis = async () => {
    if (finalizedDocuments.length === 0) {
      toast({
        title: "No Finalized Documents",
        description: "Please finalize at least one document in the PI Redactor before proceeding.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsProcessing(true);
      console.log(`=== Starting ${moduleType.toUpperCase()} ${pathway.toUpperCase()} Assessment with Finalized Documents ===`);
      console.log('Finalized documents count:', finalizedDocuments.length);

      const extractedDocs = [];
      for (let i = 0; i < filesArray.length; i++) {
        const file = filesArray[i];
        
        const isFinalized = file.name.includes('_FINALIZED_');
        if (!isFinalized) {
          console.log(`Skipping non-finalized file: ${file.name}`);
          continue;
        }

        console.log(`Extracting text from finalized file: ${file.name}...`);
        
        const { documentProcessor } = await import('@/services/document/documentProcessor');
        const text = await documentProcessor.extractTextFromFile(file);
        extractedDocs.push({
          filename: file.name,
          content: text
        });
      }

      if (extractedDocs.length === 0) {
        toast({
          title: "No Documents to Process",
          description: "No finalized documents were found to analyze.",
          variant: "destructive"
        });
        setIsProcessing(false);
        return;
      }

      const caseId = crypto.randomUUID();

      toast({
        title: "Processing Started",
        description: `${moduleType.toUpperCase()} AI analysis using ${pathway} pathway is running. This may take a few minutes...`
      });
      
      console.log(`Starting ${moduleType} AI processing using ${pathway} pathway...`);

      const environment = localStorage.getItem('app-environment') || 'replit-prod';
      const isDemoEnvironment = environment.includes('demo');
      const endpoint = isDemoEnvironment ? '/api/demo-analyze-assessment' : '/api/analyze-assessment';
      
      console.log(`Using endpoint: ${endpoint} (environment: ${environment}, isDemo: ${isDemoEnvironment})`);

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
          pathway,
          uniqueId,
          reportAuthor,
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
        description: `Documents have been processed. Redirecting to your ${moduleType.toUpperCase()} report...`
      });
      
      const reportsPath = moduleType === 'k12' ? '/k12-reports' : 
                         moduleType === 'tutoring' ? '/tutoring-reports' : 
                         '/post-secondary-reports';
      console.log(`Navigating to ${reportsPath}...`);
      navigate(reportsPath);
      
    } catch (error) {
      console.error(`${moduleType.toUpperCase()} ${pathway} Assessment analysis failed:`, error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred during analysis.",
        variant: "destructive"
      });
      setIsProcessing(false);
    }
  };

  const handleGoBack = () => {
    if (moduleType === 'k12') {
      if (pathway === 'complex') {
        navigate('/new-k12-complex-assessment');
      } else {
        navigate('/new-k12-assessment');
      }
    } else if (moduleType === 'tutoring') {
      navigate('/new-tutoring-assessment');
    } else {
      navigate('/new-post-secondary-assessment');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <Button
            onClick={handleGoBack}
            variant="ghost"
            className="mb-4"
            disabled={isProcessing}
            data-testid="button-back"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Assessment Form
          </Button>
          
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Review Finalized Documents
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Review your finalized documents before starting the AI analysis
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Assessment Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Unique ID:</span>
                <p className="text-base font-semibold" data-testid="text-unique-id">{uniqueId}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Report Author:</span>
                <p className="text-base font-semibold" data-testid="text-report-author">{reportAuthor}</p>
              </div>
              {moduleType === 'k12' && selectedGrade && (
                <div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Grade Level:</span>
                  <p className="text-base font-semibold" data-testid="text-grade">{selectedGrade}</p>
                </div>
              )}
              <div>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Module Type:</span>
                <p className="text-base font-semibold capitalize" data-testid="text-module-type">
                  {moduleType === 'post_secondary' ? 'Post-Secondary' : moduleType.toUpperCase()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {finalizedDocuments.length === 0 ? (
          <Alert className="mb-6 border-amber-500 bg-amber-50 dark:bg-amber-950">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertDescription className="text-amber-800 dark:text-amber-200">
              <strong>No finalized documents found.</strong>
              <br />
              Please return to the assessment form and use the PI Redactor Tool to finalize your documents.
              Documents must contain "_FINALIZED_" in the filename to proceed with analysis.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <Alert className="mb-6 border-green-500 bg-green-50 dark:bg-green-950">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                <strong>{finalizedDocuments.length} finalized {finalizedDocuments.length === 1 ? 'document' : 'documents'} ready for analysis.</strong>
                <br />
                All documents have been properly de-identified and are ready to be processed.
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Finalized Documents</span>
                  <Badge variant="secondary" className="ml-2">
                    {finalizedDocuments.length} {finalizedDocuments.length === 1 ? 'Document' : 'Documents'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {finalizedDocuments.map((doc) => {
                    const timestamp = parseFileTimestamp(doc.name);
                    return (
                      <div
                        key={doc.id}
                        className="flex items-start gap-3 p-4 border rounded-lg bg-white dark:bg-gray-800"
                        data-testid={`document-${doc.id}`}
                      >
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center">
                            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate" data-testid={`text-filename-${doc.id}`}>
                              {doc.name}
                            </p>
                            <Badge variant="outline" className="border-green-500 text-green-700 dark:text-green-300">
                              Finalized
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                            <span data-testid={`text-size-${doc.id}`}>{doc.size}</span>
                            {timestamp && (
                              <span data-testid={`text-timestamp-${doc.id}`}>Finalized: {timestamp}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        <div className="flex gap-4 mt-6">
          <Button
            onClick={handleGoBack}
            variant="outline"
            disabled={isProcessing}
            data-testid="button-back-bottom"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
          <Button
            onClick={handleProceedToAnalysis}
            disabled={finalizedDocuments.length === 0 || isProcessing}
            className="flex-1"
            data-testid="button-proceed-analysis"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Preparing Analysis...
              </>
            ) : (
              <>
                Proceed to Analysis
                <CheckCircle2 className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ReviewDocumentsPage;

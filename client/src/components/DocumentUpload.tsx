import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DocumentFile, DocumentType } from "@/types/assessment";
import DocumentList from './DocumentList';
import PrivacyNotice from './PrivacyNotice';

interface DocumentUploadProps {
  documents: DocumentFile[];
  setDocuments: React.Dispatch<React.SetStateAction<DocumentFile[]>>;
  onFilesChange?: (files: FileList | null) => void;
  fileInputRefs?: React.MutableRefObject<{ [key: string]: HTMLInputElement | null }>;
  uploadConfirmed?: boolean;
  onUploadConfirmedChange?: (confirmed: boolean) => void;
}

const DocumentUpload = ({
  documents,
  setDocuments,
  onFilesChange,
  fileInputRefs,
  uploadConfirmed = false,
  onUploadConfirmedChange
}: DocumentUploadProps) => {
  const { toast } = useToast();
  const [allFiles, setAllFiles] = React.useState<FileList | null>(null);
  const [waitingForRedactor, setWaitingForRedactor] = React.useState(false);
  const redactorWindowRef = React.useRef<Window | null>(null);

  const documentTypes: DocumentType[] = [
    {
      id: 'student_form',
      label: 'Student Information Form',
      required: false
    },
    {
      id: 'psychoed_eval',
      label: 'Psychoeducational Evaluation',
      required: false
    },
    {
      id: 'medical_eval',
      label: 'Medical Evaluation',
      required: false
    },
    {
      id: 'other',
      label: 'Supporting Documents',
      required: false
    }
  ];

  React.useEffect(() => {
    const redactorUrl = import.meta.env.VITE_PI_REDACTOR_URL;
    if (!redactorUrl) return;

    const redactorOrigin = new URL(redactorUrl).origin;

    const handleMessage = async (event: MessageEvent) => {
      if (event.origin !== redactorOrigin) {
        console.warn('Rejected message from untrusted origin:', event.origin);
        return;
      }

      if (event.data?.type === 'REDACTED_FILES' && event.data?.files) {
        setWaitingForRedactor(false);
        
        if (redactorWindowRef.current && !redactorWindowRef.current.closed) {
          redactorWindowRef.current.close();
        }
        redactorWindowRef.current = null;

        try {
          const redactedFiles = event.data.files;
          
          if (!Array.isArray(redactedFiles) || redactedFiles.length === 0) {
            toast({
              title: "No Files Received",
              description: "No redacted files were returned from the redactor tool.",
              variant: "destructive"
            });
            return;
          }

          const currentDocCount = documents.length;
          const newFileCount = redactedFiles.length;
          const totalAfterUpload = currentDocCount + newFileCount;

          if (totalAfterUpload > 4) {
            const remainingSlots = 4 - currentDocCount;
            toast({
              title: "Document Limit Reached",
              description: `You can only upload up to 4 documents. You have ${remainingSlots} slot${remainingSlots !== 1 ? 's' : ''} remaining.`,
              variant: "destructive"
            });
            return;
          }

          const dataTransfer = new DataTransfer();

          if (allFiles) {
            for (let i = 0; i < allFiles.length; i++) {
              dataTransfer.items.add(allFiles[i]);
            }
          }

          const fileObjects: File[] = [];
          for (const fileData of redactedFiles) {
            const response = await fetch(fileData.dataUrl);
            const blob = await response.blob();
            const file = new File([blob], fileData.name, { type: fileData.type });
            fileObjects.push(file);
            dataTransfer.items.add(file);

            const isFinalized = file.name.includes('_FINALIZED_');

            const newDoc: DocumentFile = {
              id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              name: file.name,
              type: 'other',
              size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
              uploadDate: new Date().toISOString().split('T')[0],
              status: 'uploaded',
              finalized: isFinalized
            };
            setDocuments(prev => [...prev, newDoc]);
          }

          const newFileList = dataTransfer.files;
          setAllFiles(newFileList);
          onFilesChange?.(newFileList);

          toast({
            title: "Files Uploaded Successfully",
            description: `${fileObjects.length} redacted ${fileObjects.length === 1 ? 'document' : 'documents'} added.`,
          });

        } catch (error) {
          console.error('Error processing redacted files:', error);
          toast({
            title: "Upload Error",
            description: "Failed to process redacted files. Please try again.",
            variant: "destructive"
          });
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [documents.length, allFiles, onFilesChange, setDocuments, toast]);

  const handleOpenRedactor = () => {
    const redactorUrl = import.meta.env.VITE_PI_REDACTOR_URL;
    if (!redactorUrl) {
      toast({
        title: "Configuration Error",
        description: "PI redactor URL is not configured.",
        variant: "destructive"
      });
      return;
    }

    setWaitingForRedactor(true);
    
    const width = 1200;
    const height = 800;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;
    
    redactorWindowRef.current = window.open(
      redactorUrl,
      'PIRedactor',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );

    if (!redactorWindowRef.current) {
      setWaitingForRedactor(false);
      toast({
        title: "Popup Blocked",
        description: "Please allow popups for this site to use the redactor tool.",
        variant: "destructive"
      });
      return;
    }

    const checkWindowClosed = setInterval(() => {
      if (redactorWindowRef.current && redactorWindowRef.current.closed) {
        setWaitingForRedactor(false);
        clearInterval(checkWindowClosed);
        redactorWindowRef.current = null;
      }
    }, 500);

    toast({
      title: "Redactor Opened",
      description: "Process your documents and send them back when ready.",
    });
  };


  const removeDocument = (docId: string) => {
    const docToRemove = documents.find(doc => doc.id === docId);
    if (!docToRemove) return;

    setDocuments(prev => prev.filter(doc => doc.id !== docId));

    if (allFiles) {
      const dataTransfer = new DataTransfer();
      const remainingDocs = documents.filter(doc => doc.id !== docId);
      for (let i = 0; i < allFiles.length; i++) {
        const file = allFiles[i];
        const stillExists = remainingDocs.some(doc => doc.name === file.name);
        if (stillExists) {
          dataTransfer.items.add(file);
        }
      }
      const newFileList = dataTransfer.files;
      setAllFiles(newFileList.length > 0 ? newFileList : null);
      onFilesChange?.(newFileList.length > 0 ? newFileList : null);
    }
  };

  return (
    <div className="space-y-6">
      <PrivacyNotice
        onOpenRedactor={handleOpenRedactor}
      />

      {waitingForRedactor && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600 dark:text-blue-400" />
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Waiting for redacted files...
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Process your documents in the redactor tool and send them back when ready.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {documents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Uploaded Documents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <DocumentList 
              documents={documents} 
              onRemoveDocument={removeDocument} 
              documentTypes={documentTypes} 
            />
            
            {/* Upload Confirmation Checkbox */}
            <div className="flex items-start space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Checkbox
                id="upload-confirmed"
                checked={uploadConfirmed}
                onCheckedChange={(checked) => onUploadConfirmedChange?.(checked === true)}
                className="mt-1"
                data-testid="checkbox-upload-confirmed"
              />
              <Label
                htmlFor="upload-confirmed"
                className="text-base font-medium text-gray-700 dark:text-gray-300 cursor-pointer leading-relaxed"
              >
                I confirm that all documents have been uploaded and are ready for analysis
              </Label>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DocumentUpload;

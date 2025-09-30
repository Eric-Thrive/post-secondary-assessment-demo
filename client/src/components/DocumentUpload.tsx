
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DocumentFile, DocumentType } from "@/types/assessment";
import DocumentList from './DocumentList';

interface DocumentUploadProps {
  documents: DocumentFile[];
  setDocuments: React.Dispatch<React.SetStateAction<DocumentFile[]>>;
  onFilesChange?: (files: FileList | null) => void;
  fileInputRefs?: React.MutableRefObject<{ [key: string]: HTMLInputElement | null }>;
}

const DocumentUpload = ({
  documents,
  setDocuments,
  onFilesChange,
  fileInputRefs
}: DocumentUploadProps) => {
  const { toast } = useToast();
  const [allFiles, setAllFiles] = React.useState<FileList | null>(null);

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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, docType: string) => {
    const files = event.target.files;
    if (!files) return;

    // Check if adding these files would exceed the 4-document limit
    const currentDocCount = documents.length;
    const newFileCount = files.length;
    const totalAfterUpload = currentDocCount + newFileCount;

    if (totalAfterUpload > 4) {
      const remainingSlots = 4 - currentDocCount;
      toast({
        title: "Document Limit Reached",
        description: `You can only upload up to 4 documents. You have ${remainingSlots} slot${remainingSlots !== 1 ? 's' : ''} remaining.`,
        variant: "destructive"
      });
      // Reset the file input
      event.target.value = '';
      return;
    }

    // Store all files for AI processing
    const dataTransfer = new DataTransfer();

    // Add existing files
    if (allFiles) {
      for (let i = 0; i < allFiles.length; i++) {
        dataTransfer.items.add(allFiles[i]);
      }
    }

    // Add new files
    Array.from(files).forEach(file => {
      dataTransfer.items.add(file);
      const newDoc: DocumentFile = {
        id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        type: docType as DocumentFile['type'],
        size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        uploadDate: new Date().toISOString().split('T')[0],
        status: 'uploaded'
      };
      setDocuments(prev => [...prev, newDoc]);
    });

    const newFileList = dataTransfer.files;
    setAllFiles(newFileList);
    onFilesChange?.(newFileList);
  };

  const removeDocument = (docId: string) => {
    const docToRemove = documents.find(doc => doc.id === docId);
    if (!docToRemove) return;

    setDocuments(prev => prev.filter(doc => doc.id !== docId));

    // Update file list
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

  const isAtLimit = documents.length >= 4;

  return (
    <Card>
      <CardHeader>
        <CardTitle 
          className={`transition-colors ${isAtLimit ? 'cursor-not-allowed text-gray-400' : 'cursor-pointer hover:text-blue-600'}`}
          onClick={() => !isAtLimit && document.getElementById('file-upload')?.click()}
        >Upload Documents</CardTitle>
        {isAtLimit && (
          <p className="text-sm text-gray-500 mt-2">
            Document limit reached (4/4). Remove a document to upload more.
          </p>
        )}
        <input
          id="file-upload"
          type="file"
          multiple
          accept=".pdf,.docx,.jpg,.jpeg,.png,.gif,.bmp,.tiff,.webp,.txt"
          onChange={(e) => handleFileUpload(e, 'assessment_report')}
          className="hidden"
          disabled={isAtLimit}
        />
      </CardHeader>
      <CardContent className="space-y-6">
        <DocumentList 
          documents={documents} 
          onRemoveDocument={removeDocument} 
          documentTypes={documentTypes} 
        />
      </CardContent>
    </Card>
  );
};

export default DocumentUpload;

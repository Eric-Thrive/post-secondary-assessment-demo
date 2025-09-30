
import React from 'react';
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle, FileText, X } from "lucide-react";
import { DocumentFile, DocumentType } from "@/types/assessment";

interface DocumentListProps {
  documents: DocumentFile[];
  onRemoveDocument: (docId: string) => void;
  documentTypes: DocumentType[];
}

const DocumentList = ({ documents, onRemoveDocument, documentTypes }: DocumentListProps) => {
  const getDocTypeLabel = (type: string) => {
    const docType = documentTypes.find(dt => dt.id === type);
    return docType?.label || 'Unknown Document';
  };

  const getStatusIcon = (status: DocumentFile['status']) => {
    switch (status) {
      case 'uploaded':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'processing':
        return <AlertCircle className="h-4 w-4 text-amber-600 animate-pulse" />;
      case 'analyzed':
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  if (documents.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h4 className="font-medium text-gray-900">Uploaded Documents ({documents.length}/4)</h4>
      <div className="space-y-2">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
          >
            <div className="flex items-center space-x-3">
              {getStatusIcon(doc.status)}
              <div className="flex-1">
                <p className="font-medium text-gray-900">{doc.name}</p>
                <p className="text-sm text-gray-600">
                  {getDocTypeLabel(doc.type)} • {doc.size} • Uploaded {doc.uploadDate}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemoveDocument(doc.id)}
              className="text-red-600 hover:text-red-800"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DocumentList;

import React, { useCallback, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Upload, Download, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { csvProcessingService, CSVProcessingResult, CSVUploadOptions } from '@/services/csvProcessingService';
import { useToast } from '@/hooks/use-toast';

interface CSVUploadWidgetProps {
  tableType: string;
  tableName: string;
  onUpload: (data: any[], options: CSVUploadOptions) => Promise<void>;
  isUploading?: boolean;
}

export const CSVUploadWidget: React.FC<CSVUploadWidgetProps> = ({
  tableType,
  tableName,
  onUpload,
  isUploading = false
}) => {
  const [uploadResult, setUploadResult] = useState<CSVProcessingResult<any> | null>(null);
  const [uploadMode, setUploadMode] = useState<'replace' | 'append' | 'update'>('append');
  const [showPreview, setShowPreview] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = useCallback(async (file: File) => {
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a CSV file",
        variant: "destructive"
      });
      return;
    }

    try {
      const result = await csvProcessingService.parseCSV(file, tableType);
      setUploadResult(result);
      setShowPreview(true);

      if (result.errors.length > 0) {
        toast({
          title: "CSV Validation Warnings",
          description: `${result.errors.length} rows have issues. Review before importing.`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "CSV Parsed Successfully",
          description: `${result.validRows} rows ready for import`,
        });
      }
    } catch (error) {
      toast({
        title: "CSV Parse Error",
        description: "Failed to parse CSV file",
        variant: "destructive"
      });
    }
  }, [toast, tableType]);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragActive(false);
  }, []);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragActive(false);
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleUpload = async () => {
    if (!uploadResult || uploadResult.validRows === 0) return;

    try {
      await onUpload(uploadResult.data, { mode: uploadMode });
      setUploadResult(null);
      setShowPreview(false);
      toast({
        title: "Import Successful",
        description: `${uploadResult.validRows} rows imported successfully`,
      });
    } catch (error) {
      toast({
        title: "Import Failed",
        description: "Failed to import CSV data",
        variant: "destructive"
      });
    }
  };

  const downloadTemplate = () => {
    csvProcessingService.downloadTemplate(tableType, `${tableName}_template.csv`);
  };

  const downloadErrors = () => {
    if (!uploadResult || uploadResult.errors.length === 0) return;
    
    const errorReport = uploadResult.errors.map(error => 
      `Row ${error.row}: ${error.field} - ${error.message}`
    ).join('\n');
    
    const blob = new Blob([errorReport], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${tableName}_errors.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Upload className="h-4 w-4" />
          CSV Upload - {tableName}
          <Button
            variant="outline"
            size="sm"
            onClick={downloadTemplate}
            className="ml-auto"
          >
            <Download className="h-3 w-3 mr-1" />
            Template
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {!showPreview && (
          <div
            onClick={handleClick}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-600">
              {isDragActive ? 'Drop CSV file here' : 'Drag & drop CSV file or click to browse'}
            </p>
          </div>
        )}

        {showPreview && uploadResult && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {uploadResult.errors.length === 0 ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                )}
                <span className="text-sm font-medium">
                  {uploadResult.validRows} of {uploadResult.totalRows} rows valid
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPreview(false)}
                >
                  Cancel
                </Button>
                {uploadResult.errors.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadErrors}
                  >
                    Download Errors
                  </Button>
                )}
              </div>
            </div>

            {uploadResult.errors.length > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {uploadResult.errors.length} rows have validation errors. 
                  Only valid rows will be imported.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Import Mode:</label>
              <div className="flex gap-2">
                <Button
                  variant={uploadMode === 'append' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setUploadMode('append')}
                >
                  Append
                </Button>
                <Button
                  variant={uploadMode === 'replace' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setUploadMode('replace')}
                >
                  Replace All
                </Button>
                <Button
                  variant={uploadMode === 'update' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setUploadMode('update')}
                >
                  Update Existing
                </Button>
              </div>
            </div>

            {uploadResult.validRows > 0 && (
              <Button
                onClick={handleUpload}
                disabled={isUploading}
                className="w-full"
              >
                {isUploading ? 'Importing...' : `Import ${uploadResult.validRows} Rows`}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

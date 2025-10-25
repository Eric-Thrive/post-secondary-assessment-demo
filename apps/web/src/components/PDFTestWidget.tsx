import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, CheckCircle, AlertCircle, FileText, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { pdfExtractionService } from '@/services/document/pdfExtractionService';
export const PDFTestWidget = () => {
  const [isTesting, setIsTesting] = useState(false);
  const [isCheckingWorker, setIsCheckingWorker] = useState(true);
  const [workerStatus, setWorkerStatus] = useState<{
    available: boolean;
    message: string;
  } | null>(null);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    details?: string;
  } | null>(null);
  const {
    toast
  } = useToast();

  // Check worker status on component mount
  useEffect(() => {
    const checkWorkerStatus = async () => {
      try {
        console.log('Checking PDF worker status...');
        const response = await fetch('/pdf.worker.min.js');
        if (!response.ok) {
          setWorkerStatus({
            available: false,
            message: `Worker file not found (HTTP ${response.status})`
          });
        } else {
          // Skip size validation - just confirm the file exists
          setWorkerStatus({
            available: true,
            message: 'Worker ready - test with a PDF to verify functionality'
          });
        }
      } catch (error) {
        setWorkerStatus({
          available: false,
          message: 'Failed to check worker status'
        });
      } finally {
        setIsCheckingWorker(false);
      }
    };
    checkWorkerStatus();
  }, []);
  const handleTestPDF = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      toast({
        title: "Invalid File",
        description: "Please select a PDF file.",
        variant: "destructive"
      });
      return;
    }
    setIsTesting(true);
    setTestResult(null);
    try {
      console.log('=== Testing PDF Extraction ===');
      const extractedText = await pdfExtractionService.extractTextFromPDF(file);
      setTestResult({
        success: true,
        message: `✅ PDF extraction successful!`,
        details: `Extracted ${extractedText.length} characters from ${file.name}`
      });
      toast({
        title: "PDF Test Successful",
        description: `Extracted ${extractedText.length} characters`
      });
    } catch (error) {
      console.error('PDF test failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setTestResult({
        success: false,
        message: `❌ PDF extraction failed`,
        details: errorMessage
      });
      toast({
        title: "PDF Test Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsTesting(false);
      // Clear the input
      event.target.value = '';
    }
  };
  const handleDownloadWorker = () => {
    toast({
      title: "Run Worker Setup",
      description: "Please run: node scripts/download-pdf-worker.cjs in your terminal"
    });
  };
  return <Card className="border-2 border-dashed border-blue-200 bg-blue-50/50">
      
      
    </Card>;
};
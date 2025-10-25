
import React from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from 'lucide-react';

interface ErrorAlertProps {
  error: any;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({ error }) => (
  <Alert variant="destructive">
    <AlertCircle className="h-4 w-4" />
    <AlertDescription>
      {error?.message || 'Failed to load data. Please check the console for details.'}
    </AlertDescription>
  </Alert>
);

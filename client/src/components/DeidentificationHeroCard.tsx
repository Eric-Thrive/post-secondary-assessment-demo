import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Shield, FileCheck, AlertTriangle, ExternalLink } from "lucide-react";

interface DeidentificationHeroCardProps {
  onOpenRedactor?: () => void;
}

export function DeidentificationHeroCard({ onOpenRedactor }: DeidentificationHeroCardProps) {
  return (
    <Card className="border border-gray-200">
      <CardHeader className="pb-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Shield className="h-6 w-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-xl text-gray-800">
              Document De-identification Required
            </CardTitle>
            <CardDescription className="text-base mt-1 text-gray-600">
              HIPAA & FERPA Compliance
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="border-amber-200 bg-gray-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-gray-700">
            All documents must be de-identified before uploading to remove any personally 
            identifiable information (PII) including:
            <ul className="mt-2 ml-4 list-disc list-inside space-y-1">
              <li>Names (students, parents, teachers, staff)</li>
              <li>Dates of birth and addresses</li>
              <li>Social security numbers</li>
              <li>Student ID numbers</li>
              <li>Other protected health information</li>
            </ul>
          </AlertDescription>
        </Alert>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileCheck className="h-5 w-5 text-green-600" />
            <span className="font-medium text-gray-800">Secure Browser-Based Processing</span>
          </div>
          <p className="text-sm text-gray-600">
            The redactor runs entirely in your browser - no data is sent to external servers. 
            Redacted files will automatically upload when you're done.
          </p>
        </div>

        <div className="flex justify-center">
          <Button 
            onClick={onOpenRedactor}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8"
            data-testid="button-open-redactor"
          >
            <ExternalLink className="mr-2 h-5 w-5" />
            Open PI Redactor Tool
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
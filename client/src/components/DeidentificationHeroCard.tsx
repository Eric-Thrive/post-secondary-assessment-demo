import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Shield, Info, FileCheck, AlertTriangle, ExternalLink } from "lucide-react";
import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface DeidentificationHeroCardProps {
  onOpenRedactor?: () => void;
}

export function DeidentificationHeroCard({ onOpenRedactor }: DeidentificationHeroCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 via-blue-50/80 to-blue-50/50">
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
        <Alert className="border-amber-200 bg-amber-50">
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

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileCheck className="h-5 w-5 text-green-600" />
            <span className="font-medium text-gray-800">Secure Browser-Based Processing</span>
          </div>
          <p className="text-sm text-gray-600">
            The redactor runs entirely in your browser - no data is sent to external servers. 
            Redacted files will automatically upload when you're done.
          </p>
        </div>

        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button 
              variant="ghost" 
              className="w-full justify-between text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              data-testid="button-toggle-instructions"
            >
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                <span>Step-by-Step Instructions</span>
              </div>
              <span className="text-sm">{isOpen ? "Hide" : "Show"}</span>
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4">
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <h4 className="font-semibold text-gray-800 mb-3">How to De-identify Documents:</h4>
              <ol className="space-y-3">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-7 h-7 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                    1
                  </span>
                  <div>
                    <p className="font-medium text-gray-800">Open the PI Redactor Tool</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Click the "Open PI Redactor Tool" button below to launch the secure redaction interface
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-7 h-7 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                    2
                  </span>
                  <div>
                    <p className="font-medium text-gray-800">Process Documents One at a Time</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Upload and redact each document individually. The tool will automatically detect and highlight PII for removal
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-7 h-7 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                    3
                  </span>
                  <div>
                    <p className="font-medium text-gray-800">Review and Confirm Redactions</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Carefully review all highlighted areas and confirm that all PII has been properly redacted
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-7 h-7 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                    4
                  </span>
                  <div>
                    <p className="font-medium text-gray-800">Files Upload Automatically</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Once redacted, files are automatically transferred back to this form. Repeat for all documents
                    </p>
                  </div>
                </li>
              </ol>
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Important:</strong> Continue processing documents one at a time until all 
                  required documents have been de-identified and uploaded.
                </p>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {onOpenRedactor && (
          <Button 
            onClick={onOpenRedactor}
            size="lg"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            data-testid="button-open-redactor"
          >
            <ExternalLink className="mr-2 h-5 w-5" />
            Open PI Redactor Tool
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
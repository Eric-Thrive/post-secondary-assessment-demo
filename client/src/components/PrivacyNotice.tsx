import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { AlertTriangle, ExternalLink, Shield } from "lucide-react";

interface PrivacyNoticeProps {
  onCertificationChange: (certified: boolean) => void;
  certified: boolean;
  onOpenRedactor: () => void;
}

const PrivacyNotice = ({ onCertificationChange, certified, onOpenRedactor }: PrivacyNoticeProps) => {
  const redactorUrl = import.meta.env.VITE_PI_REDACTOR_URL;

  return (
    <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-900 dark:text-amber-100">
          <Shield className="h-5 w-5" />
          Privacy & De-identification Required
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-2 text-sm text-amber-800 dark:text-amber-200">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold mb-2">HIPAA & FERPA Compliance</p>
            <p className="mb-2">
              All documents must be de-identified before uploading to remove any personally 
              identifiable information (PII) including names, dates of birth, addresses, 
              social security numbers, and other protected health information.
            </p>
          </div>
        </div>

        {redactorUrl && (
          <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
            <p className="text-sm font-medium mb-3 text-gray-900 dark:text-gray-100">
              Use our secure redactor tool to remove PI before uploading:
            </p>
            <Button
              onClick={onOpenRedactor}
              variant="outline"
              className="w-full justify-between border-blue-500 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950 disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="button-open-redactor"
              disabled={!certified}
            >
              <span className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Open PI Redactor Tool
              </span>
              <ExternalLink className="h-4 w-4" />
            </Button>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              The redactor runs entirely in your browser - no data is sent to external servers
            </p>
          </div>
        )}

        <div className="flex items-start gap-3 p-4 bg-white dark:bg-gray-900 rounded-lg border border-amber-200 dark:border-amber-800">
          <Checkbox
            id="privacy-certification"
            checked={certified}
            onCheckedChange={(checked) => onCertificationChange(checked === true)}
            data-testid="checkbox-privacy-certification"
          />
          <Label
            htmlFor="privacy-certification"
            className="text-sm font-medium leading-relaxed cursor-pointer text-gray-900 dark:text-gray-100"
          >
            I certify that all documents I upload have been properly de-identified and 
            contain no personally identifiable information (PII) in compliance with 
            HIPAA and FERPA regulations.
          </Label>
        </div>

        {!certified && (
          <p className="text-xs text-amber-700 dark:text-amber-300 italic">
            You must certify document de-identification before uploading files.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default PrivacyNotice;

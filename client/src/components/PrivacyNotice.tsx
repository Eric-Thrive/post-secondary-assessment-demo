import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ExternalLink } from "lucide-react";

interface PrivacyNoticeProps {
  onOpenRedactor: () => void;
}

const PrivacyNotice = ({ onOpenRedactor }: PrivacyNoticeProps) => {
  const redactorUrl = import.meta.env.VITE_PI_REDACTOR_URL;

  return (
    <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
      <CardContent className="space-y-4">
        <div className="flex items-start gap-2 text-sm text-blue-800 dark:text-blue-200">
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
          <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm font-medium mb-3 text-gray-900 dark:text-gray-100">
              Use our secure redactor tool to remove PI from your documents:
            </p>
            <Button
              onClick={onOpenRedactor}
              variant="outline"
              className="w-full justify-between border-blue-500 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950"
              data-testid="button-open-redactor"
            >
              <span className="flex items-center gap-2">
                Open PI Redactor Tool
              </span>
              <ExternalLink className="h-4 w-4" />
            </Button>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              The redactor runs entirely in your browser - no data is sent to external servers. 
              Redacted files will automatically upload when you're done.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PrivacyNotice;

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Info } from "lucide-react";

interface PrivacyNoticeProps {
  onOpenRedactor: () => void;
}

const PrivacyNotice = ({ onOpenRedactor }: PrivacyNoticeProps) => {
  const redactorUrl = import.meta.env.VITE_PI_REDACTOR_URL;

  return (
    <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
      <CardContent className="space-y-4">
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
            
            {/* Privacy & Security Note */}
            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-100 dark:border-blue-800">
              <div className="flex gap-2">
                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                    <span className="font-medium">Complete Privacy:</span> The redactor operates entirely in your browser—no documents leave your device until redacted.
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                    <span className="font-medium">Easy Workflow:</span> Redacted files automatically upload when complete. For multiple documents, simply repeat the process for each one.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PrivacyNotice;

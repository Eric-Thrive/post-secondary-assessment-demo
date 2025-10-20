import { Button } from "@/components/ui/button";
import { ExternalLink, Info } from "lucide-react";

interface PrivacyNoticeProps {
  onOpenRedactor: () => void;
}

const PrivacyNotice = ({ onOpenRedactor }: PrivacyNoticeProps) => {
  const redactorUrl = import.meta.env.VITE_PI_REDACTOR_URL;

  if (!redactorUrl) return null;

  return (
    <div className="bg-white dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
      <p className="text-base font-medium mb-4 text-gray-900 dark:text-gray-100">
        Use our secure redactor tool to remove PI from your documents:
      </p>
      <Button
        onClick={onOpenRedactor}
        variant="outline"
        className="w-full justify-between text-base"
        data-testid="button-remove-personal-info"
      >
        <span className="flex items-center gap-2">
          Remove Personal Info
        </span>
        <ExternalLink className="h-5 w-5" />
      </Button>
      
      {/* Privacy & Security Note */}
      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/40 rounded-md">
        <div className="flex gap-3">
          <Info className="h-5 w-5 text-gray-500 dark:text-gray-400 mt-0.5 flex-shrink-0" />
          <div className="space-y-2">
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              <span className="font-medium">Complete Privacy:</span> The redactor operates entirely in your browser—no documents leave your device until redacted.
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              <span className="font-medium">Easy Workflow:</span> Redacted files automatically upload when complete. For multiple documents, simply repeat the process for each one.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyNotice;

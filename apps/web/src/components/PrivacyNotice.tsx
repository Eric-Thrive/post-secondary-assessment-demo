import { Button } from "@/components/ui/button";
import { ExternalLink, Info } from "lucide-react";

interface PrivacyNoticeProps {
  onOpenRedactor: () => void;
}

const PrivacyNotice = ({ onOpenRedactor }: PrivacyNoticeProps) => {
  const redactorUrl = import.meta.env.VITE_PI_REDACTOR_URL;

  // Debug logging
  console.log("PrivacyNotice - redactorUrl:", redactorUrl);
  console.log("PrivacyNotice - all env vars:", import.meta.env);

  if (!redactorUrl) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg border border-red-200 dark:border-red-700">
        <p className="text-base font-medium mb-2 text-red-900 dark:text-red-100">
          Configuration Error
        </p>
        <p className="text-sm text-red-700 dark:text-red-300">
          PI Redactor URL is not configured. Please set VITE_PI_REDACTOR_URL in
          your .env file.
        </p>
        <p className="text-xs text-red-600 dark:text-red-400 mt-2">
          Current value: {redactorUrl || "undefined"}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
      <p className="text-base font-medium mb-4 text-gray-900 dark:text-gray-100">
        Click the blue button below to get started
      </p>
      <div className="max-w-md mx-auto w-full">
        <Button
          onClick={onOpenRedactor}
          className="w-full justify-between text-xl py-3 bg-[#1297D2] hover:bg-[#0F7DB0] text-white font-bold shadow-md rounded-lg focus-visible:ring-2 focus-visible:ring-black dark:focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-900"
          data-testid="button-remove-personal-info"
        >
          <span className="flex items-center gap-2">Remove Personal Info</span>
          <ExternalLink className="h-6 w-6" />
        </Button>
      </div>
      {/* Privacy & Security Note */}
      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/40 rounded-md">
        <div className="flex gap-3">
          <Info className="h-5 w-5 text-gray-500 dark:text-gray-400 mt-0.5 flex-shrink-0" />
          <div className="space-y-2">
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              <span className="font-medium">Complete Privacy:</span> The
              redactor operates entirely in your browser—no documents leave your
              device until redacted.
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              <span className="font-medium">Easy Workflow:</span> Redacted files
              automatically upload when complete. For multiple documents, simply
              repeat the process for each one.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyNotice;

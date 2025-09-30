
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, RefreshCw, Plus, Loader2 } from "lucide-react";

interface NoReportsEmptyStateProps {
  onCreateNew: () => void;
}

export const NoReportsEmptyState = ({ onCreateNew }: NoReportsEmptyStateProps) => (
  <div className="max-w-2xl mx-auto p-6">
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <FileText className="h-16 w-16 text-gray-400 mb-4" />
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">No Assessment Reports</h2>
        <p className="text-gray-600 mb-6 max-w-md">
          You haven't created any assessment cases yet. Create your first assessment to generate accommodation reports.
        </p>
        <Button onClick={onCreateNew} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Create New Assessment
        </Button>
      </CardContent>
    </Card>
  </div>
);

interface ProcessingEmptyStateProps {
  caseCount: number;
  onRefresh: () => void;
}

export const ProcessingEmptyState = ({ caseCount, onRefresh }: ProcessingEmptyStateProps) => (
  <div className="max-w-2xl mx-auto p-6">
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <RefreshCw className="h-16 w-16 text-blue-500 mb-4 animate-spin" />
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Processing Assessment Cases</h2>
        <p className="text-gray-600 mb-6 max-w-md">
          You have {caseCount} assessment case{caseCount !== 1 ? 's' : ''} that {caseCount === 1 ? 'is' : 'are'} still being processed or haven't completed analysis yet. Please wait for the analysis to complete or refresh to check for updates.
        </p>
        <Button onClick={onRefresh} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </CardContent>
    </Card>
  </div>
);

interface SelectCasePromptProps {
  caseCount: number;
}

export const SelectCasePrompt = ({ caseCount }: SelectCasePromptProps) => (
  <Card>
    <CardContent className="py-8 text-center">
      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">Select an Assessment Case</h3>
      <p className="text-gray-600">
        Choose from {caseCount} completed assessment case{caseCount !== 1 ? 's' : ''} to view the detailed report.
      </p>
    </CardContent>
  </Card>
);

export const LoadingState = () => (
  <div className="max-w-2xl mx-auto p-6">
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <Loader2 className="h-16 w-16 text-blue-500 mb-4 animate-spin" />
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Loading Assessment Cases</h2>
        <p className="text-gray-600 max-w-md">
          Loading your assessment cases from the database...
        </p>
      </CardContent>
    </Card>
  </div>
);

interface NoDataPromptProps {
  title: string;
  description: string;
}

export const NoDataPrompt = ({ title, description }: NoDataPromptProps) => (
  <Card>
    <CardContent className="py-8 text-center">
      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </CardContent>
  </Card>
);

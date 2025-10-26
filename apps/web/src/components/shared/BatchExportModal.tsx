import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  FileText,
  Database,
  FileSpreadsheet,
  X,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { AssessmentCase } from "@/types/assessmentCase";
import {
  useEnhancedReportDownloads,
  BatchExportOptions,
} from "@/hooks/useEnhancedReportDownloads";

interface BatchExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableCases: AssessmentCase[];
  moduleType: "k12" | "post_secondary" | "tutoring";
}

export const BatchExportModal: React.FC<BatchExportModalProps> = ({
  isOpen,
  onClose,
  availableCases,
  moduleType,
}) => {
  const [selectedCases, setSelectedCases] = useState<string[]>([]);
  const [selectedFormats, setSelectedFormats] = useState<
    ("markdown" | "csv" | "json" | "pdf")[]
  >([]);
  const [includeRawText, setIncludeRawText] = useState(false);
  const [includeAnalysisData, setIncludeAnalysisData] = useState(false);

  const { handleBatchExport, exportProgress, resetExportProgress } =
    useEnhancedReportDownloads();

  const handleCaseToggle = (caseId: string) => {
    setSelectedCases((prev) =>
      prev.includes(caseId)
        ? prev.filter((id) => id !== caseId)
        : [...prev, caseId]
    );
  };

  const handleFormatToggle = (format: "markdown" | "csv" | "json" | "pdf") => {
    setSelectedFormats((prev) =>
      prev.includes(format)
        ? prev.filter((f) => f !== format)
        : [...prev, format]
    );
  };

  const handleSelectAllCases = () => {
    if (selectedCases.length === availableCases.length) {
      setSelectedCases([]);
    } else {
      setSelectedCases(availableCases.map((c) => c.id));
    }
  };

  const handleStartExport = async () => {
    const casesToExport = availableCases.filter((c) =>
      selectedCases.includes(c.id)
    );

    const options: BatchExportOptions = {
      cases: casesToExport,
      formats: selectedFormats,
      includeRawText,
      includeAnalysisData,
    };

    await handleBatchExport(options);
  };

  const handleClose = () => {
    resetExportProgress();
    onClose();
  };

  const formatIcons = {
    markdown: FileText,
    csv: FileSpreadsheet,
    json: Database,
    pdf: FileText,
  };

  const formatLabels = {
    markdown: "Markdown Report",
    csv: "Analysis Data (CSV)",
    json: "Analysis Data (JSON)",
    pdf: "PDF Report",
  };

  const isExporting = exportProgress.status === "processing";
  const exportCompleted = exportProgress.status === "completed";
  const exportFailed = exportProgress.status === "error";

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Download className="h-5 w-5" />
            <span>Batch Export - {moduleType.toUpperCase()}</span>
          </DialogTitle>
          <DialogDescription>
            Export multiple assessment reports in various formats. Select the
            cases and formats you want to export.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Export Progress */}
          {isExporting && (
            <div className="space-y-3 p-4 bg-blue-50 rounded-lg border">
              <div className="flex items-center justify-between">
                <span className="font-medium text-blue-900">
                  Exporting Reports...
                </span>
                <Badge variant="secondary">
                  {exportProgress.current} / {exportProgress.total}
                </Badge>
              </div>
              <Progress
                value={(exportProgress.current / exportProgress.total) * 100}
                className="w-full"
              />
              <p className="text-sm text-blue-700">
                Current: {exportProgress.currentFile}
              </p>
            </div>
          )}

          {/* Export Completed */}
          {exportCompleted && (
            <div className="flex items-center space-x-2 p-4 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-green-800 font-medium">
                Export completed successfully!
              </span>
            </div>
          )}

          {/* Export Failed */}
          {exportFailed && (
            <div className="flex items-center space-x-2 p-4 bg-red-50 rounded-lg border border-red-200">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div className="flex-1">
                <span className="text-red-800 font-medium">Export failed</span>
                {exportProgress.error && (
                  <p className="text-sm text-red-600 mt-1">
                    {exportProgress.error}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Case Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Select Cases</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAllCases}
              >
                {selectedCases.length === availableCases.length
                  ? "Deselect All"
                  : "Select All"}
              </Button>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-2 border rounded-lg p-3">
              {availableCases.map((assessmentCase) => (
                <div
                  key={assessmentCase.id}
                  className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded"
                >
                  <Checkbox
                    id={`case-${assessmentCase.id}`}
                    checked={selectedCases.includes(assessmentCase.id)}
                    onCheckedChange={() => handleCaseToggle(assessmentCase.id)}
                  />
                  <Label
                    htmlFor={`case-${assessmentCase.id}`}
                    className="flex-1 cursor-pointer"
                  >
                    <div>
                      <div className="font-medium">
                        {assessmentCase.display_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        Created:{" "}
                        {new Date(
                          assessmentCase.created_date
                        ).toLocaleDateString()}
                      </div>
                    </div>
                  </Label>
                  <Badge
                    variant={
                      assessmentCase.status === "completed"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {assessmentCase.status}
                  </Badge>
                </div>
              ))}
            </div>

            <p className="text-sm text-gray-600">
              Selected: {selectedCases.length} of {availableCases.length} cases
            </p>
          </div>

          {/* Format Selection */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium">Export Formats</h3>

            <div className="grid grid-cols-2 gap-3">
              {(["markdown", "csv", "json", "pdf"] as const).map((format) => {
                const Icon = formatIcons[format];
                return (
                  <div
                    key={format}
                    className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <Checkbox
                      id={`format-${format}`}
                      checked={selectedFormats.includes(format)}
                      onCheckedChange={() => handleFormatToggle(format)}
                    />
                    <Icon className="h-4 w-4 text-gray-600" />
                    <Label
                      htmlFor={`format-${format}`}
                      className="flex-1 cursor-pointer font-medium"
                    >
                      {formatLabels[format]}
                    </Label>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Additional Options */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium">Additional Options</h3>

            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 border rounded-lg">
                <Checkbox
                  id="include-raw-text"
                  checked={includeRawText}
                  onCheckedChange={(checked) =>
                    setIncludeRawText(checked === true)
                  }
                />
                <Label
                  htmlFor="include-raw-text"
                  className="flex-1 cursor-pointer"
                >
                  <div>
                    <div className="font-medium">Include Raw Text</div>
                    <div className="text-sm text-gray-500">
                      Export the original extracted document text
                    </div>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-3 p-3 border rounded-lg">
                <Checkbox
                  id="include-analysis-data"
                  checked={includeAnalysisData}
                  onCheckedChange={(checked) =>
                    setIncludeAnalysisData(checked === true)
                  }
                />
                <Label
                  htmlFor="include-analysis-data"
                  className="flex-1 cursor-pointer"
                >
                  <div>
                    <div className="font-medium">Include Analysis Data</div>
                    <div className="text-sm text-gray-500">
                      Export structured analysis data in selected formats
                    </div>
                  </div>
                </Label>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isExporting}
            >
              <X className="h-4 w-4 mr-2" />
              {exportCompleted ? "Close" : "Cancel"}
            </Button>

            <Button
              onClick={handleStartExport}
              disabled={
                selectedCases.length === 0 ||
                selectedFormats.length === 0 ||
                isExporting
              }
            >
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? "Exporting..." : "Start Export"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

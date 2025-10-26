import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Download,
  FileText,
  Database,
  Share2,
  Package,
  Loader2,
} from "lucide-react";
import { AssessmentCase } from "@/types/assessmentCase";
import {
  BatchExportOptions,
  ExportProgress,
} from "@/hooks/useEnhancedReportDownloads";

interface EnhancedReportHeaderProps {
  selectedCaseId: string;
  displayableCases: AssessmentCase[];
  onSelectCase: (caseId: string) => void;
  onDownloadReport: () => void;
  onDownloadMarkdown: () => void;
  onDownloadRawText: () => void;
  onDownloadItemMaster?: (format: "csv" | "json" | "markdown") => void;
  onBatchExport?: (options: BatchExportOptions) => void;
  hasAnalysisResult: boolean;
  exportProgress?: ExportProgress;
  // Sharing props
  onShareReport: () => void;
  isShared?: boolean;
  currentCaseDisplayName?: string;
}

export const EnhancedReportHeader: React.FC<EnhancedReportHeaderProps> = ({
  selectedCaseId,
  displayableCases,
  onSelectCase,
  onDownloadReport,
  onDownloadMarkdown,
  onDownloadRawText,
  onDownloadItemMaster,
  onBatchExport,
  hasAnalysisResult,
  exportProgress,
  onShareReport,
  isShared,
  currentCaseDisplayName,
}) => {
  const [batchExportOpen, setBatchExportOpen] = useState(false);
  const [selectedCases, setSelectedCases] = useState<string[]>([]);
  const [selectedFormats, setSelectedFormats] = useState<
    ("markdown" | "csv" | "json" | "pdf")[]
  >(["markdown"]);
  const [includeRawText, setIncludeRawText] = useState(false);
  const [includeAnalysisData, setIncludeAnalysisData] = useState(false);

  const handleBatchExportSubmit = () => {
    if (!onBatchExport) return;

    const selectedCaseObjects = displayableCases.filter((case_) =>
      selectedCases.includes(case_.id)
    );

    onBatchExport({
      cases: selectedCaseObjects,
      formats: selectedFormats,
      includeRawText,
      includeAnalysisData,
    });

    setBatchExportOpen(false);
  };

  const toggleCaseSelection = (caseId: string) => {
    setSelectedCases((prev) =>
      prev.includes(caseId)
        ? prev.filter((id) => id !== caseId)
        : [...prev, caseId]
    );
  };

  const toggleFormatSelection = (
    format: "markdown" | "csv" | "json" | "pdf"
  ) => {
    setSelectedFormats((prev) =>
      prev.includes(format)
        ? prev.filter((f) => f !== format)
        : [...prev, format]
    );
  };

  const selectAllCases = () => {
    setSelectedCases(displayableCases.map((case_) => case_.id));
  };

  const clearCaseSelection = () => {
    setSelectedCases([]);
  };

  return (
    <div className="flex items-center justify-end">
      <div className="flex space-x-3">
        <Select value={selectedCaseId} onValueChange={onSelectCase}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select an assessment case" />
          </SelectTrigger>
          <SelectContent>
            {displayableCases.map((case_) => (
              <SelectItem key={case_.id} value={case_.id}>
                {case_.display_name || "Student"}
                {case_.status !== "completed" && (
                  <Badge variant="outline" className="ml-2 text-xs">
                    {case_.status}
                  </Badge>
                )}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Export Progress Indicator */}
        {exportProgress && exportProgress.status === "processing" && (
          <div className="flex items-center space-x-2 px-3 py-2 bg-blue-50 rounded-md border">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            <div className="text-sm">
              <div className="font-medium text-blue-900">Exporting...</div>
              <div className="text-blue-700">{exportProgress.currentFile}</div>
              {exportProgress.total > 1 && (
                <Progress
                  value={(exportProgress.current / exportProgress.total) * 100}
                  className="w-32 h-2 mt-1"
                />
              )}
            </div>
          </div>
        )}

        <Button
          variant="outline"
          onClick={onDownloadMarkdown}
          disabled={!hasAnalysisResult}
        >
          <FileText className="h-4 w-4 mr-2" />
          Download Markdown
        </Button>

        <Button
          variant="outline"
          onClick={onShareReport}
          disabled={!hasAnalysisResult}
          className={isShared ? "border-green-500 text-green-700" : ""}
        >
          <Share2 className="h-4 w-4 mr-2" />
          {isShared ? "Shared" : "Share"}
        </Button>

        {onDownloadItemMaster && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={!hasAnalysisResult}>
                <Database className="h-4 w-4 mr-2" />
                Export Analysis Data
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => onDownloadItemMaster("csv")}>
                <Download className="h-4 w-4 mr-2" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDownloadItemMaster("json")}>
                <Download className="h-4 w-4 mr-2" />
                Export as JSON
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDownloadItemMaster("markdown")}
              >
                <Download className="h-4 w-4 mr-2" />
                Export as Markdown
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Batch Export Dialog */}
        {onBatchExport && displayableCases.length > 1 && (
          <Dialog open={batchExportOpen} onOpenChange={setBatchExportOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Package className="h-4 w-4 mr-2" />
                Batch Export
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Batch Export Reports</DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                {/* Case Selection */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium">Select Cases</h3>
                    <div className="space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={selectAllCases}
                      >
                        Select All
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearCaseSelection}
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-md p-3">
                    {displayableCases.map((case_) => (
                      <div
                        key={case_.id}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={`case-${case_.id}`}
                          checked={selectedCases.includes(case_.id)}
                          onCheckedChange={() => toggleCaseSelection(case_.id)}
                        />
                        <label
                          htmlFor={`case-${case_.id}`}
                          className="text-sm cursor-pointer truncate"
                        >
                          {case_.display_name || "Student"}
                        </label>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {selectedCases.length} of {displayableCases.length} cases
                    selected
                  </p>
                </div>

                {/* Format Selection */}
                <div>
                  <h3 className="text-sm font-medium mb-3">Export Formats</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      {
                        id: "markdown",
                        label: "Markdown Report",
                        icon: FileText,
                      },
                      { id: "csv", label: "CSV Data", icon: Database },
                      { id: "json", label: "JSON Data", icon: Database },
                      { id: "pdf", label: "PDF (Prepared)", icon: FileText },
                    ].map((format) => (
                      <div
                        key={format.id}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={`format-${format.id}`}
                          checked={selectedFormats.includes(format.id as any)}
                          onCheckedChange={() =>
                            toggleFormatSelection(format.id as any)
                          }
                        />
                        <label
                          htmlFor={`format-${format.id}`}
                          className="text-sm cursor-pointer flex items-center space-x-2"
                        >
                          <format.icon className="h-4 w-4" />
                          <span>{format.label}</span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Additional Options */}
                <div>
                  <h3 className="text-sm font-medium mb-3">
                    Additional Options
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="include-raw-text"
                        checked={includeRawText}
                        onCheckedChange={(checked) =>
                          setIncludeRawText(checked === true)
                        }
                      />
                      <label
                        htmlFor="include-raw-text"
                        className="text-sm cursor-pointer"
                      >
                        Include raw extracted text files
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="include-analysis-data"
                        checked={includeAnalysisData}
                        onCheckedChange={(checked) =>
                          setIncludeAnalysisData(checked === true)
                        }
                      />
                      <label
                        htmlFor="include-analysis-data"
                        className="text-sm cursor-pointer"
                      >
                        Include structured analysis data
                      </label>
                    </div>
                  </div>
                </div>

                {/* Export Summary */}
                <div className="bg-gray-50 p-3 rounded-md">
                  <h4 className="text-sm font-medium mb-2">Export Summary</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>Cases: {selectedCases.length}</div>
                    <div>Formats: {selectedFormats.length}</div>
                    <div>
                      Total files:{" "}
                      {selectedCases.length *
                        (selectedFormats.length +
                          (includeRawText ? 1 : 0) +
                          (includeAnalysisData ? 1 : 0))}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setBatchExportOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleBatchExportSubmit}
                    disabled={
                      selectedCases.length === 0 || selectedFormats.length === 0
                    }
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Start Export
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
};

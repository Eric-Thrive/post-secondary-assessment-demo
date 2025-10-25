
import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Download, FileText, Database, Share2 } from "lucide-react";
import { AssessmentCase } from '@/types/assessmentCase';
import { ShareReportModal } from './ShareReportModal';

interface ReportHeaderProps {
  selectedCaseId: string;
  displayableCases: AssessmentCase[];
  onSelectCase: (caseId: string) => void;
  onDownloadReport: () => void;
  onDownloadMarkdown: () => void;
  onDownloadRawText: () => void;
  onDownloadItemMaster?: (format: 'csv' | 'json' | 'markdown') => void;
  hasAnalysisResult: boolean;
  // Sharing props
  onShareReport: () => void;
  isShared?: boolean;
  currentCaseDisplayName?: string;
}

export const ReportHeader: React.FC<ReportHeaderProps> = ({
  selectedCaseId,
  displayableCases,
  onSelectCase,
  onDownloadReport,
  onDownloadMarkdown,
  onDownloadRawText,
  onDownloadItemMaster,
  hasAnalysisResult,
  onShareReport,
  isShared,
  currentCaseDisplayName
}) => {
  return (
    <div className="flex items-center justify-end">
      <div className="flex space-x-3">
        <Select value={selectedCaseId} onValueChange={onSelectCase}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select an assessment case" />
          </SelectTrigger>
          <SelectContent>
            {displayableCases.map(case_ => (
              <SelectItem key={case_.id} value={case_.id}>
                {case_.display_name || 'Student'}
                {case_.status !== 'completed' && (
                  <Badge variant="outline" className="ml-2 text-xs">
                    {case_.status}
                  </Badge>
                )}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Button variant="outline" onClick={onDownloadMarkdown} disabled={!hasAnalysisResult}>
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
              <DropdownMenuItem onClick={() => onDownloadItemMaster('csv')}>
                <Download className="h-4 w-4 mr-2" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDownloadItemMaster('json')}>
                <Download className="h-4 w-4 mr-2" />
                Export as JSON
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDownloadItemMaster('markdown')}>
                <Download className="h-4 w-4 mr-2" />
                Export as Markdown
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
};

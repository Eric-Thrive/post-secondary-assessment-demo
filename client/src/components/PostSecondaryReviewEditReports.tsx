import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, Edit, Save, X, Check, AlertCircle, RotateCcw } from "lucide-react";
// We'll use fetch directly instead of apiRequest
import { EditableReportContent } from './report/EditableReportContent';
import { ChangeTracker } from './report/ChangeTracker';
import { toast } from "@/hooks/use-toast";

interface AssessmentCase {
  id: string;
  student_name?: string;
  created_at: string;
  status: string;
  analysis_result?: any;
  report_data?: any;
  edit_status?: 'draft' | 'in_review' | 'finalized';
  edit_version?: number;
  edit_changes?: any[];
}

export const PostSecondaryReviewEditReports: React.FC = () => {
  const [selectedCaseId, setSelectedCaseId] = useState<string>('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [changes, setChanges] = useState<any[]>([]);
  const [isDirty, setIsDirty] = useState(false);

  // Fetch assessment cases - using direct endpoint with inline fetcher
  const { data: cases = [], isLoading: isLoadingCases, refetch } = useQuery<AssessmentCase[]>({
    queryKey: ['/api/assessment-cases-direct/post_secondary'],
    queryFn: async () => {
      const response = await fetch('/api/assessment-cases-direct/post_secondary');
      if (!response.ok) {
        throw new Error('Failed to fetch cases');
      }
      return response.json();
    },
  });

  // Debug logging
  console.log('Review & Edit - Raw cases:', cases);
  console.log('Review & Edit - Cases count:', cases.length);

  // Filter cases that have completed reports
  const completedCases = cases.filter(c => 
    c.status === 'completed' && 
    (c.analysis_result || c.report_data)
  );

  console.log('Review & Edit - Completed cases:', completedCases);
  console.log('Review & Edit - Completed count:', completedCases.length);

  // Get selected case
  const selectedCase = completedCases.find(c => c.id === selectedCaseId);

  const handleCaseSelect = (caseId: string) => {
    if (isDirty) {
      if (!confirm('You have unsaved changes. Are you sure you want to switch cases?')) {
        return;
      }
    }
    setSelectedCaseId(caseId);
    setIsEditMode(false);
    setChanges([]); // Clear pending changes
    setIsDirty(false);
    
    console.log('🔄 Case selected:', {
      newCaseId: caseId,
      clearedChanges: true
    });
  };

  const handleEditToggle = () => {
    if (isEditMode && isDirty) {
      if (!confirm('You have unsaved changes. Are you sure you want to cancel editing?')) {
        return;
      }
    }
    setIsEditMode(!isEditMode);
    if (!isEditMode) {
      // Entering edit mode
      setChanges([]);
      setIsDirty(false);
    }
  };

  const [currentContent, setCurrentContent] = useState<string>('');
  
  // Update current content when selected case changes
  useEffect(() => {
    if (selectedCase) {
      const content = selectedCase.analysis_result?.markdown_report || 
                     selectedCase.report_data?.markdown_report || 
                     selectedCase.analysis_result || 
                     selectedCase.report_data || 
                     '';
      setCurrentContent(content);
      console.log('🔄 Content updated for case:', {
        caseId: selectedCase.id,
        contentLength: content.length
      });
    }
  }, [selectedCase]);
  
  const handleContentChange = (newContent: string, changeInfo: any) => {
    setIsDirty(true);
    setCurrentContent(newContent);
    const change = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      caseId: selectedCase?.id, // Link change to specific case
      ...changeInfo
    };
    setChanges(prev => [...prev, change]);
  };

  const handleSaveChanges = async () => {
    if (!selectedCase || !isDirty) return;

    console.log('💾 Saving changes...', {
      caseId: selectedCase.id,
      hasCurrentContent: !!currentContent,
      currentContentLength: currentContent?.length || 0,
      changesCount: changes.length,
      hasBackup: !!selectedCase.report_data?.backup_report,
      isEdited: selectedCase.report_data?.is_edited
    });
    


    try {
      // Save changes to the database
      const response = await fetch('/api/assessment-cases/edit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          caseId: selectedCase.id,
          changes,
          status: 'in_review',
          reportContent: currentContent,
          createBackup: !selectedCase.report_data?.backup_report  // Create backup if none exists
        })
      });

      const result = await response.json();
      console.log('💾 Save response:', result);

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save changes');
      }

      toast({
        title: "Changes saved",
        description: "Your changes have been saved successfully.",
      });

      setIsEditMode(false);
      setIsDirty(false);
      setChanges([]);
      
      // Refresh the cases to show updated content
      console.log('🔄 Refreshing cases after save...');
      await refetch();
      console.log('✅ Cases refreshed');
    } catch (error) {
      console.error('❌ Save error:', error);
      toast({
        title: "Error saving changes",
        description: `Failed to save your changes: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    }
  };

  const handleRestoreReport = async () => {
    if (!selectedCase) return;

    if (!confirm('Are you sure you want to restore this report to its original version? All edits will be lost.')) {
      return;
    }

    try {
      const response = await fetch('/api/assessment-cases/restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          caseId: selectedCase.id
        })
      });

      if (!response.ok) {
        throw new Error('Failed to restore report');
      }

      toast({
        title: "Report restored",
        description: "The report has been restored to its original version.",
      });

      setIsEditMode(false);
      setIsDirty(false);
      
      // Refresh the cases to show restored content
      await refetch();
    } catch (error) {
      toast({
        title: "Error restoring report",
        description: "Failed to restore the report. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleFinalizeReport = async () => {
    if (!selectedCase) return;

    if (!confirm('Are you sure you want to finalize this report? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch('/api/assessment-cases/finalize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          caseId: selectedCase.id
        })
      });

      if (!response.ok) {
        throw new Error('Failed to finalize report');
      }

      toast({
        title: "Report finalized",
        description: "The report has been finalized and locked.",
      });
    } catch (error) {
      toast({
        title: "Error finalizing report",
        description: "Failed to finalize the report. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleRevertChange = async (changeId: string) => {
    if (!selectedCase) return;

    if (!confirm('Are you sure you want to revert this specific change? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch('/api/assessment-cases/revert-change', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          caseId: selectedCase.id,
          changeId: changeId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to revert change');
      }

      toast({
        title: "Change reverted",
        description: "The specific change has been reverted successfully.",
      });

      setIsEditMode(false);
      setIsDirty(false);
      
      // Refresh the cases to show reverted content
      await refetch();
    } catch (error) {
      toast({
        title: "Error reverting change",
        description: "Failed to revert the change. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleResolveFlaggedItem = async (itemId: string, action: 'approve' | 'edit' | 'investigate') => {
    if (!selectedCase) return;

    console.log(`Resolving flagged item ${itemId} with action: ${action}`);

    switch (action) {
      case 'approve':
        toast({
          title: "Item approved",
          description: "The flagged item has been approved and marked as reviewed.",
        });
        break;
      case 'edit':
        // Switch to edit mode and focus on the flagged content
        setIsEditMode(true);
        toast({
          title: "Edit mode activated",
          description: "Edit mode has been activated. Locate and edit the flagged content.",
        });
        break;
      case 'investigate':
        toast({
          title: "Investigation noted",
          description: "The item has been flagged for further investigation.",
        });
        break;
    }

    // In a real implementation, you would make an API call to update the item status
    // For now, we'll just show the user feedback
  };

  if (isLoadingCases) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
        <span className="ml-2 text-gray-500">Loading assessment cases...</span>
      </div>
    );
  }

  if (completedCases.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No completed assessment reports found. Complete an assessment first to review and edit reports.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Case Selection */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Select value={selectedCaseId} onValueChange={handleCaseSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Select a completed assessment case to review" />
            </SelectTrigger>
            <SelectContent>
              {completedCases.map((assessmentCase) => (
                <SelectItem key={assessmentCase.id} value={assessmentCase.id}>
                  {(assessmentCase as any).display_name || assessmentCase.student_name || 'Student'} - {assessmentCase.report_data?.analysis_date ? new Date(assessmentCase.report_data.analysis_date).toLocaleDateString() : 'No date'}
                  {assessmentCase.report_data?.is_edited ? ' (Edited)' : ''}
                  {assessmentCase.edit_status && (
                    <Badge className="ml-2" variant={
                      assessmentCase.edit_status === 'finalized' ? 'default' :
                      assessmentCase.edit_status === 'in_review' ? 'secondary' : 'outline'
                    }>
                      {assessmentCase.edit_status}
                    </Badge>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {selectedCase && (
          <div className="flex gap-2">
            {!isEditMode ? (
              <Button 
                onClick={handleEditToggle}
                disabled={selectedCase.edit_status === 'finalized'}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Report
              </Button>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  onClick={handleEditToggle}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveChanges}
                  disabled={!isDirty}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </>
            )}
            
            {selectedCase.status === 'completed' && !isEditMode && selectedCase.report_data?.status !== 'finalized' && (
              <Button 
                variant="default"
                onClick={handleFinalizeReport}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Check className="h-4 w-4 mr-2" />
                Finalize Report
              </Button>
            )}
            
            {(() => {
              const isEdited = selectedCase.report_data?.is_edited;
              const hasBackup = !!selectedCase.report_data?.backup_report;
              
              console.log('🔍 Restore button visibility check:', {
                caseId: selectedCase.id,
                isEdited: isEdited,
                hasBackup: hasBackup,
                isEditMode: isEditMode,
                shouldShowRestore: isEdited && !isEditMode,
                reportData: selectedCase.report_data
              });
              
              if (isEdited && !isEditMode) {
                return (
                  <Button 
                    variant="outline"
                    onClick={handleRestoreReport}
                    className="border-amber-300 text-amber-700 hover:bg-amber-50"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Restore Original
                  </Button>
                );
              }
              
              if (!isEdited && !isEditMode) {
                return (
                  <div className="text-sm text-gray-500">
                    Edit and save this report to see restore option
                  </div>
                );
              }
              
              return null;
            })()}
          </div>
        )}
      </div>

      {/* Report Content */}
      {selectedCase && (
        <Tabs defaultValue="report" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="report">Report</TabsTrigger>
            <TabsTrigger value="changes">Change History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="report" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Assessment Report</CardTitle>
                <CardDescription>
                  {selectedCase.report_data?.analysis_date && (
                    <span className="block mb-1">
                      Report Generated: {new Date(selectedCase.report_data.analysis_date).toLocaleDateString()} at {new Date(selectedCase.report_data.analysis_date).toLocaleTimeString()}
                    </span>
                  )}
                  {isEditMode ? 'Editing mode - make changes to the report content' : 'View mode - click Edit Report to make changes'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EditableReportContent
                  content={currentContent}
                  isEditMode={isEditMode}
                  onChange={handleContentChange}
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="changes" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Smart Review & Change History</CardTitle>
                <CardDescription>
                  Review flagged items and track all changes made to this report
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChangeTracker 
                  changes={changes}
                  savedChanges={selectedCase.report_data?.edit_changes || []}
                  reportContent={currentContent}
                  onRevertChange={handleRevertChange}
                  onResolveFlaggedItem={handleResolveFlaggedItem}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, Edit, Save, X, Check, AlertCircle, Clock, FileCheck } from "lucide-react";
// We'll use fetch directly instead of apiRequest
import { EditableReportContent } from './report/EditableReportContent';
import { TutoringCardReportEditable } from './report/TutoringCardReportEditable';
import { ChangeTracker } from './report/ChangeTracker';
import { toast } from "@/hooks/use-toast";

interface TutoringAssessmentCase {
  id: string;
  student_name?: string;
  grade?: string;
  created_at: string;
  status: string;
  analysis_result?: any;
  report_data?: any;
  edit_status?: 'draft' | 'in_review' | 'finalized';
  edit_version?: number;
  edit_changes?: any[];
  documents?: Array<{id: string, name: string, type: string, size: string, uploadDate: string, status: string}>;
}

// Helper function to parse markdown sections
const parseMarkdownSections = (markdown: string) => {
  if (!markdown) return [];
  
  const sections: Array<{title: string, content: string}> = [];
  const lines = markdown.split('\n');
  let currentSection: {title: string, content: string} | null = null;
  
  for (const line of lines) {
    // Check if this is a section header (## Title)
    if (line.startsWith('## ')) {
      // Save previous section if it exists
      if (currentSection) {
        sections.push(currentSection);
      }
      // Start new section
      currentSection = {
        title: line.replace('## ', '').trim(),
        content: ''
      };
    } else if (currentSection && !line.startsWith('# ') && line !== '---') {
      // Add content to current section (skip main title and separators)
      if (currentSection.content) {
        currentSection.content += '\n' + line;
      } else {
        currentSection.content = line;
      }
    }
  }
  
  // Add the last section
  if (currentSection) {
    sections.push(currentSection);
  }
  
  return sections.map(section => ({
    ...section,
    content: section.content.trim()
  }));
};

export const TutoringReviewEditReports: React.FC = () => {
  const [selectedCaseId, setSelectedCaseId] = useState<string>('');
  const [changes, setChanges] = useState<any[]>([]);
  const [stagingMarkdownReport, setStagingMarkdownReport] = useState<string>(''); // Staging copy for editing
  const [liveMarkdownReport, setLiveMarkdownReport] = useState<string>(''); // Live report data
  const [versionInfo, setVersionInfo] = useState<any>({ versions: [], currentVersion: 'Original', isFinalized: false });
  const [isLoadingVersions, setIsLoadingVersions] = useState(false);

  // Fetch tutoring assessment cases with inline fetcher
  const { data: cases = [], isLoading: isLoadingCases } = useQuery<TutoringAssessmentCase[]>({
    queryKey: ['/api/assessment-cases', 'tutoring'],
    queryFn: async () => {
      const response = await fetch('/api/assessment-cases/tutoring');
      if (!response.ok) {
        throw new Error('Failed to fetch cases');
      }
      return response.json();
    },
  });

  // Filter cases that have completed reports
  const completedCases = cases.filter(c => 
    c.status === 'completed' && 
    (c.analysis_result || c.report_data)
  );

  // Get selected case
  const selectedCase = completedCases.find(c => c.id === selectedCaseId);
  
  // Initialize staging and live markdown reports when case changes
  React.useEffect(() => {
    if (selectedCase) {
      let originalMarkdown = selectedCase.analysis_result?.markdown_report || 
                            selectedCase.report_data?.markdown_report || 
                            selectedCase.analysis_result || 
                            selectedCase.report_data || 
                            '';
      
      // Ensure we always have a string
      if (typeof originalMarkdown !== 'string') {
        originalMarkdown = '';
      }
      
      // Set both staging (for editing) and live (for reference) data
      setStagingMarkdownReport(originalMarkdown);
      setLiveMarkdownReport(originalMarkdown);
    }
  }, [selectedCase?.id]);

  const handleCaseSelect = async (caseId: string) => {
    setSelectedCaseId(caseId);
    setChanges([]);
    
    // Fetch version information for the selected case
    if (caseId) {
      await fetchVersions(caseId);
    }
  };
  
  // Fetch version information
  const fetchVersions = async (caseId: string) => {
    try {
      setIsLoadingVersions(true);
      console.log('🔍 Frontend: Fetching versions for case:', caseId);
      const response = await fetch(`/api/assessment-cases/${caseId}/versions`);
      if (response.ok) {
        const versions = await response.json();
        console.log('🔍 Frontend: Received versions data:', versions);
        console.log('🔍 Frontend: Versions array length:', versions?.versions?.length || 0);
        console.log('🔍 Frontend: Current version:', versions?.currentVersion);
        console.log('🔍 Frontend: Is finalized:', versions?.isFinalized);
        setVersionInfo(versions);
        console.log('🔍 Frontend: Version info state updated');
      } else {
        console.error('🔍 Frontend: Failed to fetch versions, status:', response.status);
      }
    } catch (error) {
      console.error('Error fetching versions:', error);
    } finally {
      setIsLoadingVersions(false);
    }
  };

  const handleContentChange = async (newContent: string, changeInfo: any) => {
    const changeId = crypto.randomUUID();
    const newChange = {
      id: changeId,
      timestamp: new Date().toISOString(),
      sectionTitle: changeInfo.sectionTitle,
      oldContent: changeInfo.oldContent,
      newContent: changeInfo.newContent, // Use the actual section content, not the full markdown
      status: 'pending',
      action: 'edit'
    };
    
    // Immediately save the change
    try {
      const response = await fetch('/api/tutoring-assessment-cases/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          caseId: selectedCaseId,
          changes: [newChange],
          status: 'in_review'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save change');
      }

      // Update the staging markdown report with the new content (not live)
      setStagingMarkdownReport(newContent);
      
      // Add to change history
      setChanges(prev => [...prev, newChange]);

      toast({
        title: "Changes saved",
        description: `${changeInfo.sectionTitle} has been updated.`,
      });
    } catch (error) {
      toast({
        title: "Error saving changes",
        description: "Failed to save your changes. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleApproveChange = async (changeId: string) => {
    try {
      // Check if this is a finalized report that needs version auto-creation
      const isFinalized = versionInfo.isFinalized;
      
      if (isFinalized) {
        // Auto-finalize to create next version when approving changes on finalized reports
        const finalizeResponse = await fetch(`/api/assessment-cases/${selectedCase?.id}/finalize`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: liveMarkdownReport
          })
        });
        
        if (!finalizeResponse.ok) {
          throw new Error('Failed to create new version');
        }
        
        // Refresh version info to get new version number
        await fetchVersions(selectedCase?.id || '');
      }
      
      const response = await fetch('/api/tutoring-assessment-cases/approve-change', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          caseId: selectedCase?.id,
          changeId,
          action: 'approve'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to approve change');
      }

      // Find the change that was approved
      const approvedChange = changes.find(change => change.id === changeId);
      if (approvedChange) {
        // Rebuild the full markdown report with the approved section change
        const sections = parseMarkdownSections(liveMarkdownReport);
        const sectionIndex = sections.findIndex(s => s.title === approvedChange.sectionTitle);
        
        if (sectionIndex !== -1) {
          sections[sectionIndex].content = approvedChange.newContent;
          const newMarkdown = `# Student Support Report — Tutor Orientation\n\n` +
            sections.map(section => {
              return `## ${section.title}\n\n${section.content}`;
            }).join('\n\n---\n\n');
          setLiveMarkdownReport(newMarkdown);
        }
      }

      setChanges(prev => prev.map(change => 
        change.id === changeId ? { ...change, status: 'approved' } : change
      ));

      toast({
        title: "Change approved",
        description: isFinalized ? 
          `Change approved and new version created (${versionInfo.currentVersion}).` :
          "The change has been approved and applied to the report.",
      });
    } catch (error) {
      toast({
        title: "Error approving change",
        description: "Failed to approve the change. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleRejectChange = async (changeId: string) => {
    try {
      const response = await fetch('/api/tutoring-assessment-cases/reject-change', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          caseId: selectedCase?.id,
          changeId,
          action: 'reject'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to reject change');
      }

      // Find the change that was rejected
      const rejectedChange = changes.find(change => change.id === changeId);
      if (rejectedChange) {
        // Restore the original content for this section in staging
        const sections = parseMarkdownSections(stagingMarkdownReport);
        const sectionIndex = sections.findIndex(s => s.title === rejectedChange.sectionTitle);
        
        if (sectionIndex !== -1) {
          sections[sectionIndex].content = rejectedChange.oldContent;
          const newMarkdown = `# Student Support Report — Tutor Orientation\n\n` +
            sections.map(section => {
              return `## ${section.title}\n\n${section.content}`;
            }).join('\n\n---\n\n');
          setStagingMarkdownReport(newMarkdown);
        }
      }

      setChanges(prev => prev.map(change => 
        change.id === changeId ? { ...change, status: 'rejected' } : change
      ));

      toast({
        title: "Change rejected",
        description: "The change has been rejected and the original content restored.",
      });
    } catch (error) {
      toast({
        title: "Error rejecting change",
        description: "Failed to reject the change. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleFinalizeReport = async () => {
    if (!selectedCase) return;

    if (!confirm('Are you sure you want to finalize this report? This will create a new version.')) {
      return;
    }

    try {
      console.log('🔄 Tutoring Finalizing report...');
      
      // Call the finalize endpoint to create a finalized version
      const response = await fetch(`/api/assessment-cases/${selectedCase.id}/finalize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: liveMarkdownReport
        })
      });

      if (!response.ok) {
        throw new Error('Failed to finalize report');
      }

      const result = await response.json();
      console.log('✅ Tutoring Finalization result:', result);
      
      // Refresh version info to show the new finalized status and version picker
      await fetchVersions(selectedCase.id);
      
      // Clear changes after finalizing
      setChanges([]);

      toast({
        title: "Report finalized",
        description: `Report has been finalized as version ${result.version || versionInfo.currentVersion}. You can now make new edits to create additional versions.`,
      });
    } catch (error) {
      console.error('❌ Tutoring Finalization error:', error);
      toast({
        title: "Error finalizing report",
        description: "Failed to finalize the report. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Switch to a different version
  const handleVersionSwitch = async (version: string) => {
    if (!selectedCase) return;
    
    try {
      console.log(`🔄 Tutoring: Switching to version ${version}`);
      
      if (version === 'original') {
        // For 'original', load the base report content
        let originalMarkdown = selectedCase.analysis_result?.markdown_report || 
                              selectedCase.report_data?.markdown_report || 
                              selectedCase.analysis_result || 
                              selectedCase.report_data || 
                              '';
        
        if (typeof originalMarkdown !== 'string') {
          originalMarkdown = '';
        }
        
        setStagingMarkdownReport(originalMarkdown);
        setLiveMarkdownReport(originalMarkdown);
        setChanges([]);
        
        // Update version info
        setVersionInfo((prev: any) => ({ ...prev, currentVersion: 'original' }));
        
        toast({
          title: "Version switched",
          description: "Switched to Original version",
        });
        return;
      }
      
      // For finalized versions (V2, V3, V4, etc.), call the API
      const response = await fetch(`/api/assessment-cases/${selectedCase.id}/switch-version`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ version })
      });

      if (!response.ok) {
        throw new Error('Failed to switch version');
      }

      const result = await response.json();
      console.log(`🔄 Tutoring: Frontend received content for version ${version}:`, result.content?.substring(0, 100));
      
      // Update staging data when switching versions (for editing)
      setStagingMarkdownReport(result.content);
      // Also update live data reference
      setLiveMarkdownReport(result.content);
      setChanges([]);
      
      // Update version info
      setVersionInfo((prev: any) => ({ ...prev, currentVersion: version }));
      
      toast({
        title: "Version switched",
        description: `Switched to version ${version}`,
      });
    } catch (error) {
      console.error('❌ Tutoring: Version switch error:', error);
      toast({
        title: "Error switching version",
        description: "Failed to switch version. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (isLoadingCases) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
        <span className="ml-2 text-gray-500">Loading tutoring assessment cases...</span>
      </div>
    );
  }

  if (completedCases.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No completed tutoring assessment reports found. Complete an assessment first to review and edit reports.
        </AlertDescription>
      </Alert>
    );
  }

  // Helper function to extract display date from case ID
  const getDisplayDate = (caseItem: TutoringAssessmentCase) => {
    // Try to extract timestamp from case ID (e.g., "analysis-1756910898735")
    const match = caseItem.id.match(/analysis-(\d+)$/);
    if (match) {
      const timestamp = parseInt(match[1]);
      return new Date(timestamp).toLocaleDateString();
    }
    return caseItem.created_at ? new Date(caseItem.created_at).toLocaleDateString() : 'No date';
  };

  return (
    <div className="space-y-6">
      {/* Case Selection */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Select value={selectedCaseId} onValueChange={handleCaseSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Select a completed tutoring assessment case to review" />
            </SelectTrigger>
            <SelectContent>
              {completedCases.map((assessmentCase) => (
                <SelectItem key={assessmentCase.id} value={assessmentCase.id}>
                  {(assessmentCase as any).display_name || assessmentCase.student_name || 'Student'}
                  {assessmentCase.grade && ` - Grade ${assessmentCase.grade}`} 
                  {' - '}{getDisplayDate(assessmentCase)}
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
          <div className="flex gap-4">
            {/* Debug: Log version info state */}
            {console.log('🔍 Frontend: Render check - versionInfo:', versionInfo)}
            {console.log('🔍 Frontend: Render check - versions length:', versionInfo?.versions?.length || 0)}
            {console.log('🔍 Frontend: Render check - should show picker:', (versionInfo?.versions?.length || 0) > 0)}
            
            {/* Version Selector */}
            {versionInfo.versions.length > 0 && (
              <div className="flex items-center gap-2">
                {console.log('🔍 Frontend: Rendering version picker!')}
                <Clock className="h-4 w-4 text-gray-500" />
                <Select value={versionInfo.currentVersion} onValueChange={handleVersionSwitch}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="original">Original</SelectItem>
                    {versionInfo.versions.map((version: any) => (
                      <SelectItem key={version.version} value={version.version}>
                        {version.version}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button 
                variant="default"
                onClick={handleFinalizeReport}
              >
                <Check className="h-4 w-4 mr-2" />
                Finalize Report
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Report Content */}
      {selectedCase && stagingMarkdownReport && (
        <Tabs defaultValue="report" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="report">Report</TabsTrigger>
            <TabsTrigger value="changes">
              Change History
              {changes.filter(c => c.status === 'pending').length > 0 && (
                <Badge className="ml-1 h-5 w-5 p-0 text-xs">
                  {changes.filter(c => c.status === 'pending').length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="report" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Tutoring Assessment Report</CardTitle>
                    <CardDescription>
                      {selectedCase.report_data?.analysis_date && (
                        <span className="block mb-1">
                          Report Generated: {new Date(selectedCase.report_data.analysis_date).toLocaleDateString()} at {new Date(selectedCase.report_data.analysis_date).toLocaleTimeString()}
                        </span>
                      )}
                      Click the pencil icon on any section to edit it directly
                    </CardDescription>
                  </div>
                  {versionInfo.currentVersion !== 'Original' && versionInfo.currentVersion !== 'original' && (
                    <div className="flex items-center gap-2">
                      <FileCheck className="h-4 w-4 text-blue-500" />
                      <Badge variant="secondary">
                        {versionInfo.currentVersion === 'original' ? 'Original' : versionInfo.currentVersion}
                      </Badge>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="p-6">
                  <TutoringCardReportEditable 
                    markdownReport={stagingMarkdownReport}
                    isEditMode={true}
                    onChange={handleContentChange}
                    currentCaseId={selectedCase.id}
                    documents={selectedCase.documents || []}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="changes" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Change History</CardTitle>
                <CardDescription>
                  Track all changes made to this report
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChangeTracker 
                  changes={changes}
                  savedChanges={selectedCase.edit_changes || []}
                  onApproveChange={handleApproveChange}
                  onRejectChange={handleRejectChange}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};
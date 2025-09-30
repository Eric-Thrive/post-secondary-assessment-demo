import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Clock, FileText, User, AlertTriangle, RotateCcw, ChevronDown, ChevronRight, Flag, Eye, Check, X } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Change {
  id: string;
  timestamp: string;
  type: string;
  sectionId?: string;
  sectionTitle?: string;
  oldContent?: string;
  newContent?: string;
  user?: string;
  status?: 'pending' | 'approved' | 'rejected';
  canRevert?: boolean;
}

interface FlaggedItem {
  id: string;
  type: 'ai_generated' | 'inference' | 'quality_check' | 'validation_needed';
  content: string;
  location: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  suggested_action?: string;
  original_content?: string;
}

interface ChangeTrackerProps {
  changes: Change[];
  savedChanges?: Change[];
  flaggedItems?: FlaggedItem[];
  reportContent?: string;
  onRevertChange?: (changeId: string) => void;
  onApproveChange?: (changeId: string) => void;
  onRejectChange?: (changeId: string) => void;
  onResolveFlaggedItem?: (itemId: string, action: 'approve' | 'edit' | 'investigate') => void;
}

export const ChangeTracker: React.FC<ChangeTrackerProps> = ({ 
  changes, 
  savedChanges = [], 
  flaggedItems = [], 
  reportContent = '',
  onRevertChange,
  onApproveChange,
  onRejectChange,
  onResolveFlaggedItem
}) => {
  const [expandedSections, setExpandedSections] = useState<string[]>(['flagged', 'recent']);
  const [expandedChanges, setExpandedChanges] = useState<string[]>([]);
  
  const allChanges = [...savedChanges, ...changes].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const recentChanges = allChanges.slice(0, 5);
  const olderChanges = allChanges.slice(5);

  // Auto-detect flagged items from report content if not provided
  const detectedFlaggedItems = flaggedItems.length > 0 ? flaggedItems : detectFlaggedItems(reportContent);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const toggleChangeExpansion = (changeId: string) => {
    setExpandedChanges(prev =>
      prev.includes(changeId)
        ? prev.filter(id => id !== changeId)
        : [...prev, changeId]
    );
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Helper to clean and format content for display
  const formatContent = (content: string, maxLength: number = 800, isExpanded: boolean = false) => {
    if (!content) return '';
    
    // Clean asterisks but preserve checkmarks and x marks
    const cleaned = content.replace(/\*+/g, '');
    const shouldTruncate = !isExpanded && cleaned.length > maxLength;
    const displayContent = shouldTruncate ? cleaned.substring(0, maxLength) + '...' : cleaned;
    
    return (
      <div className="prose prose-sm max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ node, ...props }) => <h1 className="text-sm font-bold mb-1" {...props} />,
            h2: ({ node, ...props }) => <h2 className="text-xs font-semibold mb-1" {...props} />,
            h3: ({ node, ...props }) => <h3 className="text-xs font-medium mb-1" {...props} />,
            p: ({ node, ...props }) => <p className="mb-1 text-xs leading-relaxed" {...props} />,
            ul: ({ node, ...props }) => <ul className="list-disc pl-4 mb-1 text-xs" {...props} />,
            li: ({ node, ...props }) => <li className="mb-0.5" {...props} />,
            strong: ({ node, ...props }) => <strong className="font-semibold" {...props} />,
            table: ({ node, ...props }) => (
              <div className="overflow-x-auto mb-2">
                <table className="w-full border-collapse text-xs" {...props} />
              </div>
            ),
            thead: ({ node, ...props }) => <thead {...props} />,
            tbody: ({ node, ...props }) => <tbody className="divide-y divide-gray-100" {...props} />,
            tr: ({ node, ...props }) => <tr className="border-b border-gray-100" {...props} />,
            th: ({ node, ...props }) => (
              <th className="px-1 py-1 text-left text-xs font-semibold text-gray-800 bg-gray-50/50" {...props} />
            ),
            td: ({ node, ...props }) => (
              <td className="px-1 py-1 text-xs text-gray-700 align-top" {...props} />
            ),
          }}
        >
          {displayContent}
        </ReactMarkdown>
        {shouldTruncate && (
          <div className="text-xs text-blue-600 hover:text-blue-800 cursor-pointer mt-1">
            (content truncated - click expand to see full content)
          </div>
        )}
      </div>
    );
  };

  const getChangeTypeBadge = (type: string) => {
    switch (type) {
      case 'section_edit':
        return <Badge variant="default">Section Edit</Badge>;
      case 'content_addition':
        return <Badge variant="secondary">Content Added</Badge>;
      case 'content_deletion':
        return <Badge variant="destructive">Content Removed</Badge>;
      default:
        return <Badge variant="outline">Change</Badge>;
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="default" className="bg-green-500">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'pending':
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">High Priority</Badge>;
      case 'medium':
        return <Badge variant="secondary">Medium</Badge>;
      case 'low':
      default:
        return <Badge variant="outline">Low</Badge>;
    }
  };

  const getFlaggedTypeBadge = (type: string) => {
    switch (type) {
      case 'ai_generated':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">AI Generated</Badge>;
      case 'inference':
        return <Badge variant="secondary" className="bg-purple-100 text-purple-800">Inference</Badge>;
      case 'quality_check':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Quality Check</Badge>;
      case 'validation_needed':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Validation Needed</Badge>;
      default:
        return <Badge variant="outline">Review Required</Badge>;
    }
  };

  if (allChanges.length === 0 && detectedFlaggedItems.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        No changes or review items found.
      </div>
    );
  }

  return (
    <ScrollArea className="h-[600px] pr-4">
      <div className="space-y-6">
        
        {/* Flagged Items Section */}
        {detectedFlaggedItems.length > 0 && (
          <div>
            <Collapsible 
              open={expandedSections.includes('flagged')} 
              onOpenChange={() => toggleSection('flagged')}
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full p-2 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
                <div className="flex items-center gap-2">
                  <Flag className="h-4 w-4 text-red-600" />
                  <span className="font-medium text-red-800">Requires Review</span>
                  <Badge variant="destructive" className="text-xs">{detectedFlaggedItems.length}</Badge>
                </div>
                {expandedSections.includes('flagged') ? 
                  <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
                }
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3 space-y-3">
                {detectedFlaggedItems.map((item) => (
                  <Card key={item.id} className="border-red-200">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {getFlaggedTypeBadge(item.type)}
                            {getPriorityBadge(item.priority)}
                          </div>
                          <CardTitle className="text-sm text-red-800">
                            <AlertTriangle className="inline h-4 w-4 mr-1" />
                            {item.location}
                          </CardTitle>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="text-sm">
                          <strong>Reason:</strong> {item.reason}
                        </div>
                        <div className="bg-yellow-50 p-3 rounded text-sm">
                          <strong>Content:</strong>
                          <div className="mt-1 text-gray-700">
                            {item.content.substring(0, 150)}
                            {item.content.length > 150 && '...'}
                          </div>
                        </div>
                        {item.suggested_action && (
                          <div className="text-sm text-blue-700">
                            <strong>Suggested Action:</strong> {item.suggested_action}
                          </div>
                        )}
                        <div className="flex gap-2 pt-2">
                          <Button 
                            size="sm" 
                            variant="default"
                            onClick={() => onResolveFlaggedItem?.(item.id, 'approve')}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Approve
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => onResolveFlaggedItem?.(item.id, 'edit')}
                          >
                            Edit
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => onResolveFlaggedItem?.(item.id, 'investigate')}
                          >
                            Investigate
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}

        {detectedFlaggedItems.length > 0 && allChanges.length > 0 && <Separator />}

        {/* Recent Changes Section */}
        {recentChanges.length > 0 && (
          <div>
            <Collapsible 
              open={expandedSections.includes('recent')} 
              onOpenChange={() => toggleSection('recent')}
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full p-2 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-800">Recent Changes</span>
                  <Badge variant="secondary" className="text-xs">{recentChanges.length}</Badge>
                </div>
                {expandedSections.includes('recent') ? 
                  <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
                }
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3 space-y-3">
                {recentChanges.map((change) => (
                  <Card key={change.id} className="relative">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {getChangeTypeBadge(change.type)}
                            {change.status && getStatusBadge(change.status)}
                          </div>
                          {change.sectionTitle && (
                            <CardTitle className="text-sm">
                              <FileText className="inline h-4 w-4 mr-1" />
                              {change.sectionTitle}
                            </CardTitle>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-xs text-gray-500 flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatTimestamp(change.timestamp)}
                          </div>
                          <div className="flex gap-1">
                            {change.status === 'pending' && onApproveChange && (
                              <Button 
                                size="sm" 
                                variant="default"
                                onClick={() => onApproveChange(change.id)}
                                className="text-xs px-2 py-1 bg-green-600 hover:bg-green-700"
                              >
                                <Check className="h-3 w-3 mr-1" />
                                Approve
                              </Button>
                            )}
                            {change.status === 'pending' && onRejectChange && (
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => onRejectChange(change.id)}
                                className="text-xs px-2 py-1"
                              >
                                <X className="h-3 w-3 mr-1" />
                                Reject
                              </Button>
                            )}
                            {change.canRevert !== false && onRevertChange && (
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => onRevertChange(change.id)}
                                className="text-xs px-2 py-1"
                              >
                                <RotateCcw className="h-3 w-3 mr-1" />
                                Revert
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {change.user && (
                        <div className="text-sm text-gray-600 mb-2 flex items-center">
                          <User className="h-3 w-3 mr-1" />
                          Modified by: {change.user}
                        </div>
                      )}
                      

                      
                      {change.oldContent && change.newContent && (
                        <div className="space-y-2">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-semibold text-gray-700">Change Details</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => toggleChangeExpansion(change.id)}
                              className="text-xs px-2 py-1"
                            >
                              {expandedChanges.includes(change.id) ? 'Collapse' : 'Expand'}
                              {expandedChanges.includes(change.id) ? 
                                <ChevronDown className="h-3 w-3 ml-1" /> : 
                                <ChevronRight className="h-3 w-3 ml-1" />
                              }
                            </Button>
                          </div>
                          <div className="bg-red-50 p-3 rounded text-sm">
                            <strong className="text-red-700">Previous:</strong>
                            <div className="mt-1 text-red-600">
                              {formatContent(change.oldContent, 800, expandedChanges.includes(change.id))}
                            </div>
                          </div>
                          <div className="bg-green-50 p-3 rounded text-sm">
                            <strong className="text-green-700">Updated:</strong>
                            <div className="mt-1 text-green-600">
                              {formatContent(change.newContent, 800, expandedChanges.includes(change.id))}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Show fallback if missing oldContent or newContent */}
                      {(!change.oldContent || !change.newContent) && (
                        <div className="bg-gray-50 p-3 rounded text-sm">
                          <strong className="text-gray-700">Content:</strong>
                          <div className="mt-1 text-gray-600">
                            {formatContent(change.newContent || change.oldContent || 'No content available', 800, expandedChanges.includes(change.id))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}

        {/* Older Changes Section */}
        {olderChanges.length > 0 && (
          <>
            <Separator />
            <div>
              <Collapsible 
                open={expandedSections.includes('timeline')} 
                onOpenChange={() => toggleSection('timeline')}
              >
                <CollapsibleTrigger className="flex items-center justify-between w-full p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-600" />
                    <span className="font-medium text-gray-800">Change Timeline</span>
                    <Badge variant="outline" className="text-xs">{olderChanges.length}</Badge>
                  </div>
                  {expandedSections.includes('timeline') ? 
                    <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
                  }
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-3 space-y-3">
                  {olderChanges.map((change) => (
                    <Card key={change.id} className="relative border-gray-200">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              {getChangeTypeBadge(change.type)}
                              {change.status && getStatusBadge(change.status)}
                            </div>
                            {change.sectionTitle && (
                              <CardTitle className="text-xs text-gray-600">
                                {change.sectionTitle}
                              </CardTitle>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-xs text-gray-400">
                              {formatTimestamp(change.timestamp)}
                            </div>
                            <div className="flex gap-1">
                              {change.status === 'pending' && onApproveChange && (
                                <Button 
                                  size="sm" 
                                  variant="default"
                                  onClick={() => onApproveChange(change.id)}
                                  className="text-xs px-1 py-0.5 bg-green-600 hover:bg-green-700"
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                              )}
                              {change.status === 'pending' && onRejectChange && (
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => onRejectChange(change.id)}
                                  className="text-xs px-1 py-0.5"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              )}
                              {change.canRevert !== false && onRevertChange && (
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => onRevertChange(change.id)}
                                  className="text-xs px-1 py-0.5"
                                >
                                  <RotateCcw className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        {change.user && (
                          <div className="text-xs text-gray-500 mb-2 flex items-center">
                            <User className="h-3 w-3 mr-1" />
                            Modified by: {change.user}
                          </div>
                        )}
                        
                        {change.oldContent && change.newContent && (
                          <div className="space-y-1">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs font-semibold text-gray-700">Change Details</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => toggleChangeExpansion(change.id)}
                                className="text-xs px-1 py-0.5"
                              >
                                {expandedChanges.includes(change.id) ? 'Collapse' : 'Expand'}
                                {expandedChanges.includes(change.id) ? 
                                  <ChevronDown className="h-3 w-3 ml-1" /> : 
                                  <ChevronRight className="h-3 w-3 ml-1" />
                                }
                              </Button>
                            </div>
                            <div className="bg-red-50 p-2 rounded text-xs">
                              <strong className="text-red-700">Previous:</strong>
                              <div className="mt-1 text-red-600">
                                {formatContent(change.oldContent, 600, expandedChanges.includes(change.id))}
                              </div>
                            </div>
                            <div className="bg-green-50 p-2 rounded text-xs">
                              <strong className="text-green-700">Updated:</strong>
                              <div className="mt-1 text-green-600">
                                {formatContent(change.newContent, 600, expandedChanges.includes(change.id))}
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {(!change.oldContent || !change.newContent) && (
                          <div className="bg-gray-50 p-2 rounded text-xs">
                            <strong className="text-gray-700">Content:</strong>
                            <div className="mt-1 text-gray-600">
                              {formatContent(change.newContent || change.oldContent || 'No content available', 600, expandedChanges.includes(change.id))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            </div>
          </>
        )}
      </div>
    </ScrollArea>
  );
};

// Helper function to detect flagged items from report content
function detectFlaggedItems(content: string): FlaggedItem[] {
  const flaggedItems: FlaggedItem[] = [];
  
  // Detect AI-generated markers
  const aiGeneratedMatches = Array.from(content.matchAll(/\*(AI-generated)\*/g));
  for (const match of aiGeneratedMatches) {
    const index = match.index || 0;
    const contextStart = Math.max(0, index - 50);
    const contextEnd = Math.min(content.length, index + 100);
    const context = content.substring(contextStart, contextEnd);
    
    flaggedItems.push({
      id: `ai-${index}`,
      type: 'ai_generated',
      content: context,
      location: 'AI-generated content detected',
      reason: 'This content was generated by AI and requires human review',
      priority: 'medium',
      suggested_action: 'Review and validate the accuracy of this AI-generated content'
    });
  }
  
  // Detect inference markers
  const inferenceMatches = Array.from(content.matchAll(/\*(.*inference.*)\*/gi));
  for (const match of inferenceMatches) {
    const index = match.index || 0;
    const contextStart = Math.max(0, index - 50);
    const contextEnd = Math.min(content.length, index + 100);
    const context = content.substring(contextStart, contextEnd);
    
    flaggedItems.push({
      id: `inference-${index}`,
      type: 'inference',
      content: context,
      location: 'Inferred content detected',
      reason: 'This content was inferred and may need verification',
      priority: 'medium',
      suggested_action: 'Verify this inferred content against source documents'
    });
  }
  
  // Detect items requiring review or flagged for review
  const reviewMatches = Array.from(content.matchAll(/\*(.*(?:requiring.*review|flagged.*for.*review).*)\*/gi));
  for (const match of reviewMatches) {
    const index = match.index || 0;
    
    // Find the start of the barrier (look backwards for **X:** pattern)
    const beforeMatch = content.substring(0, index);
    const barrierStart = beforeMatch.lastIndexOf('**');
    const contextStart = barrierStart >= 0 ? barrierStart : Math.max(0, index - 80);
    
    // Extend context to include full sentence after the flag
    const afterMatch = content.substring(index);
    const nextBarrierMatch = afterMatch.match(/\n\n\*\*\d+:\*\*/);
    const contextEnd = nextBarrierMatch && nextBarrierMatch.index !== undefined ? 
      index + nextBarrierMatch.index : 
      Math.min(content.length, index + 200);
    
    const context = content.substring(contextStart, contextEnd).trim();
    
    flaggedItems.push({
      id: `review-${index}`,
      type: 'quality_check',
      content: context,
      location: 'Content flagged for review',
      reason: 'This content has been flagged for quality review',
      priority: 'high',
      suggested_action: 'Conduct thorough review of this content'
    });
  }
  
  return flaggedItems;
}
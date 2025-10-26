import React, { useRef, useState, useEffect, useCallback } from "react";
import { useReactToPrint } from "react-to-print";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FormattedEditor } from "./FormattedEditor";
import { useAuth } from "@/contexts/AuthContext";
import {
  BookOpen,
  Target,
  Star,
  AlertCircle,
  Printer,
  FileText,
  CheckCircle,
  XCircle,
  User,
  Brain,
  Heart,
  Lightbulb,
  Edit2,
  Check,
  X,
  GraduationCap,
  Users,
  History,
  Clock,
  Eye,
  MessageSquare,
  Save,
  Undo,
  Redo,
  GitBranch,
  UserCheck,
  AlertTriangle,
  Plus,
} from "lucide-react";

interface Change {
  id: string;
  type: "edit" | "add" | "delete" | "comment";
  sectionIndex?: number;
  sectionTitle?: string;
  oldContent?: string;
  newContent?: string;
  comment?: string;
  author: string;
  timestamp: string;
  status: "pending" | "accepted" | "rejected";
  position?: { start: number; end: number };
}

interface Version {
  id: string;
  version: number;
  content: string;
  author: string;
  timestamp: string;
  description: string;
  changes: Change[];
}

interface Comment {
  id: string;
  sectionIndex: number;
  position?: { start: number; end: number };
  content: string;
  author: string;
  timestamp: string;
  resolved: boolean;
  replies: Comment[];
}

interface UnifiedCardReportEditableProps {
  markdownReport: string;
  studentName?: string;
  isEditMode?: boolean;
  onChange?: (newContent: string, changeInfo?: any) => void;
  moduleType: "k12" | "post_secondary" | "tutoring";
  currentCaseId?: string;
  documents?: Array<{
    id: string;
    name: string;
    type: string;
    size: string;
    uploadDate: string;
    status: string;
  }>;
  initialChanges?: Change[];
  initialVersions?: Version[];
  initialComments?: Comment[];
  onSaveVersion?: (version: Version) => void;
  onAcceptChange?: (changeId: string) => void;
  onRejectChange?: (changeId: string) => void;
  onAddComment?: (comment: Comment) => void;
}

interface ReportSection {
  title: string;
  content: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  iconBg: string;
  changes: Change[];
  comments: Comment[];
}

export const UnifiedCardReportEditable: React.FC<
  UnifiedCardReportEditableProps
> = ({
  markdownReport,
  studentName = "Student",
  isEditMode = false,
  onChange,
  moduleType,
  currentCaseId,
  documents = [],
  initialChanges = [],
  initialVersions = [],
  initialComments = [],
  onSaveVersion,
  onAcceptChange,
  onRejectChange,
  onAddComment,
}) => {
  const componentRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  // State management
  const [editingSectionIndex, setEditingSectionIndex] = useState<number | null>(
    null
  );
  const [editedContent, setEditedContent] = useState<string>("");
  const [changes, setChanges] = useState<Change[]>(initialChanges);
  const [versions, setVersions] = useState<Version[]>(initialVersions);
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showChanges, setShowChanges] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [commentingSectionIndex, setCommentingSectionIndex] = useState<
    number | null
  >(null);
  const [versionDescription, setVersionDescription] = useState("");
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  const [currentContent, setCurrentContent] = useState(markdownReport);
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(
    null
  );

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `${studentName} Assessment Report`,
  });

  // Module-specific configurations
  const moduleConfig = {
    k12: {
      primaryColor: "from-green-500 to-emerald-600",
      accentColor: "bg-green-100",
      textColor: "text-green-700",
      icon: BookOpen,
    },
    post_secondary: {
      primaryColor: "from-blue-500 to-indigo-600",
      accentColor: "bg-blue-100",
      textColor: "text-blue-700",
      icon: GraduationCap,
    },
    tutoring: {
      primaryColor: "from-purple-500 to-violet-600",
      accentColor: "bg-purple-100",
      textColor: "text-purple-700",
      icon: Users,
    },
  };

  const config = moduleConfig[moduleType];

  // Auto-save functionality
  useEffect(() => {
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
    }

    const timer = setTimeout(() => {
      if (currentContent !== markdownReport) {
        handleAutoSave();
      }
    }, 2000); // Auto-save after 2 seconds of inactivity

    setAutoSaveTimer(timer);

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [currentContent]);

  const handleAutoSave = useCallback(() => {
    const autoSaveChange: Change = {
      id: `auto-save-${Date.now()}`,
      type: "edit",
      oldContent: markdownReport,
      newContent: currentContent,
      author: user?.username || "Unknown",
      timestamp: new Date().toISOString(),
      status: "pending",
    };

    setChanges((prev) => [...prev, autoSaveChange]);
    onChange?.(currentContent, autoSaveChange);
  }, [currentContent, markdownReport, user, onChange]);

  // Parse markdown into sections with change tracking
  const parseMarkdownSections = (markdown: string): ReportSection[] => {
    if (!markdown) return [];

    const sections: ReportSection[] = [];
    const lines = markdown.split("\n");
    let currentSection: Partial<ReportSection> | null = null;
    let sectionIndex = 0;

    // Icon mapping for different section types
    const getIconForSection = (
      title: string
    ): React.ComponentType<{ className?: string }> => {
      const lowerTitle = title.toLowerCase();
      if (lowerTitle.includes("strength") || lowerTitle.includes("asset"))
        return Star;
      if (
        lowerTitle.includes("challenge") ||
        lowerTitle.includes("barrier") ||
        lowerTitle.includes("difficulty")
      )
        return AlertCircle;
      if (
        lowerTitle.includes("recommendation") ||
        lowerTitle.includes("support") ||
        lowerTitle.includes("strategy")
      )
        return Lightbulb;
      if (
        lowerTitle.includes("cognitive") ||
        lowerTitle.includes("academic") ||
        lowerTitle.includes("learning")
      )
        return Brain;
      if (
        lowerTitle.includes("social") ||
        lowerTitle.includes("emotional") ||
        lowerTitle.includes("behavioral")
      )
        return Heart;
      if (lowerTitle.includes("summary") || lowerTitle.includes("overview"))
        return FileText;
      if (lowerTitle.includes("student") || lowerTitle.includes("profile"))
        return User;
      return Target; // Default icon
    };

    const getGradientForSection = (title: string): string => {
      const lowerTitle = title.toLowerCase();
      if (lowerTitle.includes("strength") || lowerTitle.includes("asset"))
        return "from-green-400 to-emerald-500";
      if (
        lowerTitle.includes("challenge") ||
        lowerTitle.includes("barrier") ||
        lowerTitle.includes("difficulty")
      )
        return "from-red-400 to-rose-500";
      if (
        lowerTitle.includes("recommendation") ||
        lowerTitle.includes("support") ||
        lowerTitle.includes("strategy")
      )
        return "from-blue-400 to-indigo-500";
      if (
        lowerTitle.includes("cognitive") ||
        lowerTitle.includes("academic") ||
        lowerTitle.includes("learning")
      )
        return "from-purple-400 to-violet-500";
      if (
        lowerTitle.includes("social") ||
        lowerTitle.includes("emotional") ||
        lowerTitle.includes("behavioral")
      )
        return "from-pink-400 to-rose-500";
      if (lowerTitle.includes("summary") || lowerTitle.includes("overview"))
        return config.primaryColor;
      return "from-gray-400 to-slate-500";
    };

    const getIconBgForSection = (title: string): string => {
      const lowerTitle = title.toLowerCase();
      if (lowerTitle.includes("strength") || lowerTitle.includes("asset"))
        return "bg-green-100";
      if (
        lowerTitle.includes("challenge") ||
        lowerTitle.includes("barrier") ||
        lowerTitle.includes("difficulty")
      )
        return "bg-red-100";
      if (
        lowerTitle.includes("recommendation") ||
        lowerTitle.includes("support") ||
        lowerTitle.includes("strategy")
      )
        return "bg-blue-100";
      if (
        lowerTitle.includes("cognitive") ||
        lowerTitle.includes("academic") ||
        lowerTitle.includes("learning")
      )
        return "bg-purple-100";
      if (
        lowerTitle.includes("social") ||
        lowerTitle.includes("emotional") ||
        lowerTitle.includes("behavioral")
      )
        return "bg-pink-100";
      if (lowerTitle.includes("summary") || lowerTitle.includes("overview"))
        return config.accentColor;
      return "bg-gray-100";
    };

    for (const line of lines) {
      if (line.startsWith("## ")) {
        // Save previous section if it exists
        if (currentSection && currentSection.title) {
          const title = currentSection.title;
          const sectionChanges = changes.filter(
            (c) => c.sectionIndex === sectionIndex
          );
          const sectionComments = comments.filter(
            (c) => c.sectionIndex === sectionIndex
          );

          sections.push({
            title,
            content: currentSection.content || "",
            icon: getIconForSection(title),
            gradient: getGradientForSection(title),
            iconBg: getIconBgForSection(title),
            changes: sectionChanges,
            comments: sectionComments,
          });
          sectionIndex++;
        }
        // Start new section
        const title = line.replace("## ", "").trim();
        currentSection = {
          title,
          content: "",
        };
      } else if (currentSection && !line.startsWith("# ") && line !== "---") {
        // Add content to current section (skip main title and separators)
        if (currentSection.content) {
          currentSection.content += "\n" + line;
        } else {
          currentSection.content = line;
        }
      }
    }

    // Don't forget the last section
    if (currentSection && currentSection.title) {
      const title = currentSection.title;
      const sectionChanges = changes.filter(
        (c) => c.sectionIndex === sectionIndex
      );
      const sectionComments = comments.filter(
        (c) => c.sectionIndex === sectionIndex
      );

      sections.push({
        title,
        content: currentSection.content || "",
        icon: getIconForSection(title),
        gradient: getGradientForSection(title),
        iconBg: getIconBgForSection(title),
        changes: sectionChanges,
        comments: sectionComments,
      });
    }

    return sections;
  };

  const sections = parseMarkdownSections(currentContent);

  // Change tracking functions
  const createChange = (
    type: Change["type"],
    sectionIndex?: number,
    oldContent?: string,
    newContent?: string
  ): Change => {
    return {
      id: `change-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      sectionIndex,
      sectionTitle:
        sectionIndex !== undefined ? sections[sectionIndex]?.title : undefined,
      oldContent,
      newContent,
      author: user?.username || "Unknown",
      timestamp: new Date().toISOString(),
      status: "pending",
    };
  };

  const handleEditSection = (index: number) => {
    setEditingSectionIndex(index);
    setEditedContent(sections[index].content);
  };

  const handleSaveSection = () => {
    if (editingSectionIndex === null) return;

    // Add to undo stack
    setUndoStack((prev) => [...prev, currentContent]);
    setRedoStack([]); // Clear redo stack when new change is made

    const updatedSections = [...sections];
    const oldContent = updatedSections[editingSectionIndex].content;
    updatedSections[editingSectionIndex].content = editedContent;

    // Reconstruct markdown
    const newMarkdown = updatedSections
      .map((section) => `## ${section.title}\n${section.content}`)
      .join("\n\n");

    // Create change record
    const change = createChange(
      "edit",
      editingSectionIndex,
      oldContent,
      editedContent
    );
    setChanges((prev) => [...prev, change]);

    // Update current content
    setCurrentContent(newMarkdown);
    onChange?.(newMarkdown, change);

    setEditingSectionIndex(null);
    setEditedContent("");
  };

  const handleCancelEdit = () => {
    setEditingSectionIndex(null);
    setEditedContent("");
  };

  const handleAcceptChange = (changeId: string) => {
    setChanges((prev) =>
      prev.map((c) => (c.id === changeId ? { ...c, status: "accepted" } : c))
    );
    onAcceptChange?.(changeId);
  };

  const handleRejectChange = (changeId: string) => {
    setChanges((prev) =>
      prev.map((c) => (c.id === changeId ? { ...c, status: "rejected" } : c))
    );
    onRejectChange?.(changeId);
  };

  const handleAddComment = (sectionIndex: number) => {
    if (!newComment.trim()) return;

    const comment: Comment = {
      id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sectionIndex,
      content: newComment,
      author: user?.username || "Unknown",
      timestamp: new Date().toISOString(),
      resolved: false,
      replies: [],
    };

    setComments((prev) => [...prev, comment]);
    onAddComment?.(comment);
    setNewComment("");
    setCommentingSectionIndex(null);
  };

  const handleSaveVersion = () => {
    if (!versionDescription.trim()) return;

    const version: Version = {
      id: `version-${Date.now()}`,
      version: versions.length + 1,
      content: currentContent,
      author: user?.username || "Unknown",
      timestamp: new Date().toISOString(),
      description: versionDescription,
      changes: changes.filter((c) => c.status === "accepted"),
    };

    setVersions((prev) => [...prev, version]);
    onSaveVersion?.(version);
    setVersionDescription("");
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;

    const previousContent = undoStack[undoStack.length - 1];
    setRedoStack((prev) => [...prev, currentContent]);
    setUndoStack((prev) => prev.slice(0, -1));
    setCurrentContent(previousContent);
    onChange?.(previousContent, { type: "undo" });
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;

    const nextContent = redoStack[redoStack.length - 1];
    setUndoStack((prev) => [...prev, currentContent]);
    setRedoStack((prev) => prev.slice(0, -1));
    setCurrentContent(nextContent);
    onChange?.(nextContent, { type: "redo" });
  };

  const pendingChangesCount = changes.filter(
    (c) => c.status === "pending"
  ).length;
  const unresolvedCommentsCount = comments.filter((c) => !c.resolved).length;

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Change Tracking Controls */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${config.accentColor}`}>
            <config.icon className={`h-6 w-6 ${config.textColor}`} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {studentName} - Assessment Report
            </h2>
            <div className="flex items-center space-x-4 mt-1">
              <p className="text-gray-600 capitalize">
                {moduleType.replace("_", " ")} Module
              </p>
              {pendingChangesCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {pendingChangesCount} pending changes
                </Badge>
              )}
              {unresolvedCommentsCount > 0 && (
                <Badge variant="outline" className="text-xs">
                  {unresolvedCommentsCount} comments
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Undo/Redo Controls */}
          <Button
            onClick={handleUndo}
            disabled={undoStack.length === 0}
            variant="outline"
            size="sm"
            className="flex items-center space-x-1"
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            onClick={handleRedo}
            disabled={redoStack.length === 0}
            variant="outline"
            size="sm"
            className="flex items-center space-x-1"
          >
            <Redo className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-6" />

          {/* Change Tracking Controls */}
          <Dialog open={showChanges} onOpenChange={setShowChanges}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
              >
                <GitBranch className="h-4 w-4" />
                <span>Changes</span>
                {pendingChangesCount > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {pendingChangesCount}
                  </Badge>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh]">
              <DialogHeader>
                <DialogTitle>Change Tracking</DialogTitle>
                <DialogDescription>
                  Review and manage all changes made to this report
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {changes.map((change) => (
                    <Card key={change.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge
                              variant={
                                change.status === "accepted"
                                  ? "default"
                                  : change.status === "rejected"
                                  ? "destructive"
                                  : "secondary"
                              }
                            >
                              {change.type}
                            </Badge>
                            <span className="text-sm text-gray-600">
                              by {change.author}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(change.timestamp).toLocaleString()}
                            </span>
                          </div>
                          {change.sectionTitle && (
                            <p className="text-sm font-medium mb-2">
                              Section: {change.sectionTitle}
                            </p>
                          )}
                          {change.oldContent && change.newContent && (
                            <div className="space-y-2">
                              <div className="p-2 bg-red-50 border border-red-200 rounded text-sm">
                                <span className="font-medium text-red-700">
                                  Removed:
                                </span>
                                <p className="text-red-600 mt-1">
                                  {change.oldContent}
                                </p>
                              </div>
                              <div className="p-2 bg-green-50 border border-green-200 rounded text-sm">
                                <span className="font-medium text-green-700">
                                  Added:
                                </span>
                                <p className="text-green-600 mt-1">
                                  {change.newContent}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                        {change.status === "pending" && (
                          <div className="flex space-x-2 ml-4">
                            <Button
                              onClick={() => handleAcceptChange(change.id)}
                              size="sm"
                              variant="outline"
                              className="text-green-600 hover:text-green-700"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              onClick={() => handleRejectChange(change.id)}
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                  {changes.length === 0 && (
                    <p className="text-center text-gray-500 py-8">
                      No changes yet
                    </p>
                  )}
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>

          {/* Version History */}
          <Dialog
            open={showVersionHistory}
            onOpenChange={setShowVersionHistory}
          >
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
              >
                <History className="h-4 w-4" />
                <span>Versions</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh]">
              <DialogHeader>
                <DialogTitle>Version History</DialogTitle>
                <DialogDescription>
                  View and manage document versions
                </DialogDescription>
              </DialogHeader>
              <Tabs defaultValue="history" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="history">History</TabsTrigger>
                  <TabsTrigger value="save">Save Version</TabsTrigger>
                </TabsList>
                <TabsContent value="history">
                  <ScrollArea className="h-80">
                    <div className="space-y-4">
                      {versions.map((version) => (
                        <Card key={version.id} className="p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center space-x-2 mb-2">
                                <Badge>v{version.version}</Badge>
                                <span className="text-sm text-gray-600">
                                  by {version.author}
                                </span>
                              </div>
                              <p className="font-medium mb-1">
                                {version.description}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(version.timestamp).toLocaleString()}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {version.changes.length} changes included
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setCurrentContent(version.content);
                                onChange?.(version.content, {
                                  type: "version_restore",
                                  version,
                                });
                              }}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Restore
                            </Button>
                          </div>
                        </Card>
                      ))}
                      {versions.length === 0 && (
                        <p className="text-center text-gray-500 py-8">
                          No versions saved yet
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
                <TabsContent value="save" className="space-y-4">
                  <div>
                    <Label htmlFor="version-description">
                      Version Description
                    </Label>
                    <Input
                      id="version-description"
                      value={versionDescription}
                      onChange={(e) => setVersionDescription(e.target.value)}
                      placeholder="Describe the changes in this version..."
                    />
                  </div>
                  <Button
                    onClick={handleSaveVersion}
                    disabled={!versionDescription.trim()}
                    className="w-full"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Version
                  </Button>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>

          <Separator orientation="vertical" className="h-6" />

          <Button
            onClick={handlePrint}
            variant="outline"
            size="sm"
            className="flex items-center space-x-2"
          >
            <Printer className="h-4 w-4" />
            <span>Print</span>
          </Button>
        </div>
      </div>

      {/* Report Content with Enhanced Change Tracking */}
      <div ref={componentRef} className="space-y-6 print:space-y-4">
        {sections.map((section, index) => (
          <Card
            key={index}
            className="overflow-hidden shadow-sm hover:shadow-md transition-shadow"
          >
            <CardHeader
              className={`bg-gradient-to-r ${section.gradient} text-white`}
            >
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className={`p-2 rounded-lg ${section.iconBg} bg-opacity-20`}
                  >
                    <section.icon className="h-5 w-5 text-white" />
                  </div>
                  <span>{section.title}</span>
                  {section.changes.length > 0 && (
                    <Badge
                      variant="secondary"
                      className="bg-white bg-opacity-20 text-white"
                    >
                      {
                        section.changes.filter((c) => c.status === "pending")
                          .length
                      }{" "}
                      changes
                    </Badge>
                  )}
                  {section.comments.length > 0 && (
                    <Badge
                      variant="outline"
                      className="border-white text-white"
                    >
                      {section.comments.filter((c) => !c.resolved).length}{" "}
                      comments
                    </Badge>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {isEditMode && editingSectionIndex !== index && (
                    <>
                      <Button
                        onClick={() => setCommentingSectionIndex(index)}
                        variant="ghost"
                        size="sm"
                        className="text-white hover:bg-white hover:bg-opacity-20"
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => handleEditSection(index)}
                        variant="ghost"
                        size="sm"
                        className="text-white hover:bg-white hover:bg-opacity-20"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {editingSectionIndex === index ? (
                <div className="space-y-4">
                  <FormattedEditor
                    content={editedContent}
                    onChange={setEditedContent}
                  />
                  <div className="flex space-x-2">
                    <Button
                      onClick={handleSaveSection}
                      size="sm"
                      className="flex items-center space-x-2"
                    >
                      <Check className="h-4 w-4" />
                      <span>Save Changes</span>
                    </Button>
                    <Button
                      onClick={handleCancelEdit}
                      variant="outline"
                      size="sm"
                      className="flex items-center space-x-2"
                    >
                      <X className="h-4 w-4" />
                      <span>Cancel</span>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {section.content}
                    </ReactMarkdown>
                  </div>

                  {/* Comments Section */}
                  {section.comments.length > 0 && (
                    <div className="border-t pt-4 space-y-3">
                      <h4 className="font-medium text-gray-900 flex items-center space-x-2">
                        <MessageSquare className="h-4 w-4" />
                        <span>Comments</span>
                      </h4>
                      {section.comments.map((comment) => (
                        <div
                          key={comment.id}
                          className="bg-gray-50 p-3 rounded-lg"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="text-sm font-medium">
                                  {comment.author}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(comment.timestamp).toLocaleString()}
                                </span>
                                {comment.resolved && (
                                  <Badge variant="outline" className="text-xs">
                                    Resolved
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-700">
                                {comment.content}
                              </p>
                            </div>
                            {!comment.resolved && (
                              <Button
                                onClick={() => {
                                  setComments((prev) =>
                                    prev.map((c) =>
                                      c.id === comment.id
                                        ? { ...c, resolved: true }
                                        : c
                                    )
                                  );
                                }}
                                variant="ghost"
                                size="sm"
                                className="text-green-600 hover:text-green-700"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Comment Form */}
                  {commentingSectionIndex === index && (
                    <div className="border-t pt-4 space-y-3">
                      <Label htmlFor={`comment-${index}`}>Add Comment</Label>
                      <Textarea
                        id={`comment-${index}`}
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add your comment..."
                        rows={3}
                      />
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => handleAddComment(index)}
                          size="sm"
                          disabled={!newComment.trim()}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Comment
                        </Button>
                        <Button
                          onClick={() => setCommentingSectionIndex(null)}
                          variant="outline"
                          size="sm"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Documents Section for Tutoring Module */}
      {moduleType === "tutoring" && documents.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Associated Documents</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                >
                  <FileText className="h-4 w-4 text-gray-500" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {doc.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {doc.size} • {doc.uploadDate}
                    </p>
                  </div>
                  <div
                    className={`px-2 py-1 rounded-full text-xs ${
                      doc.status === "processed"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {doc.status}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

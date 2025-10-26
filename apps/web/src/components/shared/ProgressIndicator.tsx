import React from "react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import {
  Loader2,
  CheckCircle,
  AlertCircle,
  Upload,
  FileText,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ModuleType, moduleColors } from "./DesignSystem";

export interface ProgressStep {
  id: string;
  label: string;
  status: "pending" | "processing" | "completed" | "error";
  progress?: number;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface ProgressIndicatorProps {
  moduleType: ModuleType;
  steps: ProgressStep[];
  currentStep?: string;
  showOverallProgress?: boolean;
  compact?: boolean;
  className?: string;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  moduleType,
  steps,
  currentStep,
  showOverallProgress = true,
  compact = false,
  className,
}) => {
  const colors = moduleColors[moduleType];

  const completedSteps = steps.filter(
    (step) => step.status === "completed"
  ).length;
  const overallProgress = (completedSteps / steps.length) * 100;

  const getStatusIcon = (status: ProgressStep["status"]) => {
    switch (status) {
      case "pending":
        return (
          <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
        );
      case "processing":
        return <Loader2 className="w-4 h-4 animate-spin text-blue-600" />;
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-600" />;
    }
  };

  const getStatusColor = (status: ProgressStep["status"]) => {
    switch (status) {
      case "pending":
        return "text-gray-500";
      case "processing":
        return colors.text;
      case "completed":
        return "text-green-700";
      case "error":
        return "text-red-700";
    }
  };

  if (compact) {
    return (
      <div className={cn("space-y-2", className)}>
        {showOverallProgress && (
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Progress</span>
            <span className={colors.text}>{Math.round(overallProgress)}%</span>
          </div>
        )}
        <Progress
          value={overallProgress}
          className={cn("h-2", `[&>div]:bg-[${colors.primary}]`)}
        />
        <div className="text-xs text-gray-600">
          {completedSteps} of {steps.length} steps completed
        </div>
      </div>
    );
  }

  return (
    <Card className={cn(colors.border, className)}>
      <CardContent className="p-6">
        {showOverallProgress && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className={cn("text-lg font-semibold", colors.text)}>
                Overall Progress
              </h3>
              <span className={cn("text-sm font-medium", colors.text)}>
                {Math.round(overallProgress)}%
              </span>
            </div>
            <Progress
              value={overallProgress}
              className={cn("h-3", `[&>div]:bg-[${colors.primary}]`)}
            />
            <p className="text-sm text-gray-600 mt-2">
              {completedSteps} of {steps.length} steps completed
            </p>
          </div>
        )}

        <div className="space-y-4">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={cn(
                "flex items-start space-x-3 p-3 rounded-lg transition-colors",
                step.id === currentStep && colors.background,
                step.status === "processing" && "ring-2 ring-blue-200"
              )}
            >
              <div className="flex-shrink-0 mt-0.5">
                {step.icon ? (
                  <step.icon
                    className={cn("w-5 h-5", getStatusColor(step.status))}
                  />
                ) : (
                  getStatusIcon(step.status)
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4
                    className={cn(
                      "text-sm font-medium",
                      getStatusColor(step.status)
                    )}
                  >
                    {step.label}
                  </h4>
                  {step.status === "processing" &&
                    step.progress !== undefined && (
                      <span className="text-xs text-gray-500">
                        {step.progress}%
                      </span>
                    )}
                </div>

                {step.description && (
                  <p className="text-xs text-gray-600 mt-1">
                    {step.description}
                  </p>
                )}

                {step.status === "processing" &&
                  step.progress !== undefined && (
                    <Progress value={step.progress} className="h-1 mt-2" />
                  )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Document upload progress component
interface DocumentUploadProgressProps {
  moduleType: ModuleType;
  uploadProgress: number;
  processingProgress: number;
  currentFile?: string;
  totalFiles?: number;
  processedFiles?: number;
  className?: string;
}

export const DocumentUploadProgress: React.FC<DocumentUploadProgressProps> = ({
  moduleType,
  uploadProgress,
  processingProgress,
  currentFile,
  totalFiles = 1,
  processedFiles = 0,
  className,
}) => {
  const steps: ProgressStep[] = [
    {
      id: "upload",
      label: "Uploading Documents",
      status:
        uploadProgress === 100
          ? "completed"
          : uploadProgress > 0
          ? "processing"
          : "pending",
      progress: uploadProgress,
      description: currentFile ? `Uploading: ${currentFile}` : undefined,
      icon: Upload,
    },
    {
      id: "extract",
      label: "Extracting Text",
      status:
        processingProgress === 100
          ? "completed"
          : processingProgress > 0
          ? "processing"
          : "pending",
      progress: processingProgress,
      description:
        totalFiles > 1
          ? `Processing ${processedFiles} of ${totalFiles} files`
          : undefined,
      icon: FileText,
    },
    {
      id: "analyze",
      label: "AI Analysis",
      status: "pending",
      description: "Waiting for text extraction to complete",
      icon: Zap,
    },
  ];

  return (
    <ProgressIndicator
      moduleType={moduleType}
      steps={steps}
      currentStep={
        uploadProgress < 100
          ? "upload"
          : processingProgress < 100
          ? "extract"
          : "analyze"
      }
      showOverallProgress={true}
      className={className}
    />
  );
};

// Real-time status updates component
interface RealTimeStatusProps {
  moduleType: ModuleType;
  status:
    | "idle"
    | "uploading"
    | "processing"
    | "analyzing"
    | "completed"
    | "error";
  message?: string;
  progress?: number;
  className?: string;
}

export const RealTimeStatus: React.FC<RealTimeStatusProps> = ({
  moduleType,
  status,
  message,
  progress,
  className,
}) => {
  const colors = moduleColors[moduleType];

  const statusConfig = {
    idle: {
      color: "text-gray-500",
      bg: "bg-gray-50",
      icon: "⏸️",
      label: "Ready",
    },
    uploading: {
      color: colors.text,
      bg: colors.background,
      icon: "📤",
      label: "Uploading",
    },
    processing: {
      color: colors.text,
      bg: colors.background,
      icon: "⚙️",
      label: "Processing",
    },
    analyzing: {
      color: colors.text,
      bg: colors.background,
      icon: "🧠",
      label: "Analyzing",
    },
    completed: {
      color: "text-green-700",
      bg: "bg-green-50",
      icon: "✅",
      label: "Completed",
    },
    error: {
      color: "text-red-700",
      bg: "bg-red-50",
      icon: "❌",
      label: "Error",
    },
  };

  const config = statusConfig[status];

  return (
    <div
      className={cn(
        "flex items-center space-x-3 p-4 rounded-lg border",
        config.bg,
        colors.border,
        className
      )}
    >
      <div className="flex-shrink-0">
        {status === "uploading" ||
        status === "processing" ||
        status === "analyzing" ? (
          <Loader2 className={cn("w-5 h-5 animate-spin", config.color)} />
        ) : (
          <span className="text-lg">{config.icon}</span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className={cn("font-medium", config.color)}>
            {config.label}
          </span>
          {progress !== undefined && (
            <span className={cn("text-sm", config.color)}>{progress}%</span>
          )}
        </div>

        {message && (
          <p className="text-sm text-gray-600 mt-1 truncate">{message}</p>
        )}

        {progress !== undefined && (
          <Progress
            value={progress}
            className={cn("h-2 mt-2", `[&>div]:bg-[${colors.primary}]`)}
          />
        )}
      </div>
    </div>
  );
};

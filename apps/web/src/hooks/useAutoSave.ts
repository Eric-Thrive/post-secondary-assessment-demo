import { useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

export interface AutoSaveOptions {
  delay?: number; // Auto-save delay in milliseconds (default: 2000)
  enabled?: boolean; // Whether auto-save is enabled (default: true)
  onSave?: (content: string) => Promise<void> | void; // Save callback
  onError?: (error: Error) => void; // Error callback
  conflictResolution?: "overwrite" | "merge" | "prompt"; // How to handle conflicts (default: 'prompt')
}

export interface AutoSaveState {
  isSaving: boolean;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
  saveError: string | null;
  conflictDetected: boolean;
}

export const useAutoSave = (content: string, options: AutoSaveOptions = {}) => {
  const {
    delay = 2000,
    enabled = true,
    onSave,
    onError,
    conflictResolution = "prompt",
  } = options;

  const { toast } = useToast();
  const [autoSaveState, setAutoSaveState] = useState<AutoSaveState>({
    isSaving: false,
    lastSaved: null,
    hasUnsavedChanges: false,
    saveError: null,
    conflictDetected: false,
  });

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedContentRef = useRef<string>(content);
  const isInitialRender = useRef(true);

  const showUserFriendlyError = useCallback(
    (error: Error) => {
      let title = "Auto-Save Failed";
      let description = "Unable to automatically save your changes.";
      let actionableGuidance = "";

      if (
        error.message.includes("network") ||
        error.message.includes("fetch")
      ) {
        title = "Connection Lost";
        description = "Auto-save failed due to network issues.";
        actionableGuidance =
          "Your changes are preserved locally. Please check your connection and try saving manually.";
      } else if (
        error.message.includes("permission") ||
        error.message.includes("access")
      ) {
        title = "Permission Denied";
        description = "You don't have permission to save changes.";
        actionableGuidance =
          "Please contact your administrator or try refreshing the page.";
      } else if (error.message.includes("conflict")) {
        title = "Save Conflict";
        description = "Another user may have modified this content.";
        actionableGuidance =
          "Please refresh the page to see the latest version and reapply your changes.";
      } else if (
        error.message.includes("storage") ||
        error.message.includes("quota")
      ) {
        title = "Storage Full";
        description = "Unable to save due to insufficient storage space.";
        actionableGuidance =
          "Please free up some space or contact your administrator.";
      } else {
        actionableGuidance = "Please try saving manually or refresh the page.";
      }

      toast({
        title,
        description: `${description} ${actionableGuidance}`,
        variant: "destructive",
      });

      console.error("Auto-save error:", error);
    },
    [toast]
  );

  const performSave = useCallback(
    async (contentToSave: string) => {
      if (!onSave || !enabled) return;

      try {
        setAutoSaveState((prev) => ({
          ...prev,
          isSaving: true,
          saveError: null,
        }));

        await onSave(contentToSave);

        lastSavedContentRef.current = contentToSave;
        setAutoSaveState((prev) => ({
          ...prev,
          isSaving: false,
          lastSaved: new Date(),
          hasUnsavedChanges: false,
          saveError: null,
        }));

        // Show success toast only after recovering from errors
        if (autoSaveState.saveError) {
          toast({
            title: "Auto-Save Restored",
            description: "Your changes are now being saved automatically.",
          });
        }
      } catch (error) {
        const saveError =
          error instanceof Error ? error : new Error("Unknown save error");

        setAutoSaveState((prev) => ({
          ...prev,
          isSaving: false,
          saveError: saveError.message,
          conflictDetected: saveError.message.includes("conflict"),
        }));

        showUserFriendlyError(saveError);
        onError?.(saveError);
      }
    },
    [onSave, enabled, toast, showUserFriendlyError, onError]
  );

  const manualSave = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    await performSave(content);
  }, [content, performSave]);

  const handleConflictResolution = useCallback(
    async (resolution: "overwrite" | "merge" | "discard") => {
      if (resolution === "overwrite") {
        await performSave(content);
      } else if (resolution === "discard") {
        // Reset to last saved content
        setAutoSaveState((prev) => ({
          ...prev,
          hasUnsavedChanges: false,
          conflictDetected: false,
          saveError: null,
        }));
      }
      // For 'merge', the parent component should handle the merge logic
    },
    [content, performSave]
  );

  // Auto-save effect
  useEffect(() => {
    // Skip auto-save on initial render
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }

    // Skip if auto-save is disabled or content hasn't changed
    if (!enabled || content === lastSavedContentRef.current) {
      return;
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Mark as having unsaved changes
    setAutoSaveState((prev) => ({ ...prev, hasUnsavedChanges: true }));

    // Set new timeout for auto-save
    timeoutRef.current = setTimeout(() => {
      performSave(content);
    }, delay);

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [content, enabled, delay, performSave]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Browser beforeunload warning for unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (autoSaveState.hasUnsavedChanges) {
        event.preventDefault();
        event.returnValue =
          "You have unsaved changes. Are you sure you want to leave?";
        return event.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [autoSaveState.hasUnsavedChanges]);

  return {
    autoSaveState,
    manualSave,
    handleConflictResolution,
    isAutoSaveEnabled: enabled,
  };
};

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Share2, Link, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ShareReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEnableSharing: () => void;
  onDisableSharing: () => void;
  onCopyUrl: () => void;
  shareUrl: string | null;
  isSharing: boolean;
  isShared: boolean;
  reportTitle?: string;
}

export const ShareReportModal: React.FC<ShareReportModalProps> = ({
  isOpen,
  onClose,
  onEnableSharing,
  onDisableSharing,
  onCopyUrl,
  shareUrl,
  isSharing,
  isShared,
  reportTitle = "Assessment Report"
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Report
          </DialogTitle>
          <DialogDescription>
            {isShared 
              ? "This report is publicly accessible via the link below."
              : "Create a public link to share this report with others."
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="report-title" className="text-sm font-medium">
              Report
            </Label>
            <p className="text-sm text-muted-foreground mt-1">
              {reportTitle}
            </p>
          </div>

          {isShared && shareUrl && (
            <div className="space-y-2">
              <Label htmlFor="share-url" className="text-sm font-medium">
                Share Link
              </Label>
              <div className="flex space-x-2">
                <Input
                  id="share-url"
                  value={shareUrl}
                  readOnly
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onCopyUrl}
                  className="px-3"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {isShared 
                ? "Anyone with this link can view the full report. The link will remain active until you disable sharing."
                : "Once enabled, anyone with the link will be able to view this report without logging in."
              }
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {isShared ? (
            <>
              <Button
                variant="outline"
                onClick={onDisableSharing}
                disabled={isSharing}
                className="w-full sm:w-auto"
              >
                Disable Sharing
              </Button>
              <Button
                onClick={onCopyUrl}
                disabled={!shareUrl}
                className="w-full sm:w-auto"
              >
                <Link className="h-4 w-4 mr-2" />
                Copy Link
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={onClose}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                onClick={onEnableSharing}
                disabled={isSharing}
                className="w-full sm:w-auto"
              >
                {isSharing ? "Enabling..." : "Enable Sharing"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
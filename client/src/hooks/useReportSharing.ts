import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/apiClient';

interface UseReportSharingReturn {
  isShareModalOpen: boolean;
  shareUrl: string | null;
  isSharing: boolean;
  isShared: boolean;
  openShareModal: () => void;
  closeShareModal: () => void;
  enableSharing: (caseId: string) => void;
  disableSharing: (caseId: string) => void;
  copyShareUrl: () => void;
}

export const useReportSharing = (currentCaseId?: string, initialIsShared?: boolean, initialShareToken?: string): UseReportSharingReturn => {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(
    initialShareToken ? `${window.location.origin}/shared/${initialShareToken}` : null
  );
  const [isShared, setIsShared] = useState(initialIsShared || false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const enableSharingMutation = useMutation({
    mutationFn: async (caseId: string) => {
      const response = await apiClient.request(`/reports/${caseId}/share`, {
        method: 'POST'
      });
      return response;
    },
    onSuccess: (data) => {
      const fullShareUrl = `${window.location.origin}/shared/${data.shareToken}`;
      setShareUrl(fullShareUrl);
      setIsShared(true);
      toast({
        title: "Sharing enabled",
        description: "Anyone with the link can now view this report.",
      });
      // Invalidate queries to refresh the report data
      queryClient.invalidateQueries({ queryKey: ['/api/assessment-cases'] });
    },
    onError: (error) => {
      console.error('Error enabling sharing:', error);
      toast({
        title: "Error",
        description: "Failed to enable sharing. Please try again.",
        variant: "destructive",
      });
    }
  });

  const disableSharingMutation = useMutation({
    mutationFn: async (caseId: string) => {
      await apiClient.request(`/reports/${caseId}/share`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      setShareUrl(null);
      setIsShared(false);
      toast({
        title: "Sharing disabled",
        description: "The report is no longer publicly accessible.",
      });
      // Invalidate queries to refresh the report data
      queryClient.invalidateQueries({ queryKey: ['/api/assessment-cases'] });
    },
    onError: (error) => {
      console.error('Error disabling sharing:', error);
      toast({
        title: "Error",
        description: "Failed to disable sharing. Please try again.",
        variant: "destructive",
      });
    }
  });

  const openShareModal = () => setIsShareModalOpen(true);
  const closeShareModal = () => setIsShareModalOpen(false);

  const enableSharing = (caseId: string) => {
    enableSharingMutation.mutate(caseId);
  };

  const disableSharing = (caseId: string) => {
    disableSharingMutation.mutate(caseId);
  };

  const copyShareUrl = async () => {
    if (shareUrl) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast({
          title: "Link copied",
          description: "Share link copied to clipboard.",
        });
      } catch (error) {
        console.error('Error copying to clipboard:', error);
        toast({
          title: "Error",
          description: "Failed to copy link. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  return {
    isShareModalOpen,
    shareUrl,
    isSharing: enableSharingMutation.isPending || disableSharingMutation.isPending,
    isShared,
    openShareModal,
    closeShareModal,
    enableSharing,
    disableSharing,
    copyShareUrl,
  };
};
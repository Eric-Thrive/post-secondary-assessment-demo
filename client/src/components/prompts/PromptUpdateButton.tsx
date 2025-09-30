
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { PromptUpdateService } from '@/services/prompt/promptUpdateService';
import { RefreshCw, CheckCircle } from 'lucide-react';

export const PromptUpdateButton: React.FC = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const handleUpdatePrompts = async () => {
    setIsUpdating(true);
    
    try {
      await PromptUpdateService.updatePostSecondaryPrompts();
      
      toast({
        title: "Prompts Updated Successfully",
        description: "Post-secondary prompts have been updated to use the rich content approach",
      });
    } catch (error) {
      console.error('Failed to update prompts:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update post-secondary prompts. Check console for details.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Button
      onClick={handleUpdatePrompts}
      disabled={isUpdating}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      {isUpdating ? (
        <RefreshCw className="h-4 w-4 animate-spin" />
      ) : (
        <CheckCircle className="h-4 w-4" />
      )}
      {isUpdating ? 'Updating...' : 'Update Rich Content Prompts'}
    </Button>
  );
};

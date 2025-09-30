import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { PromptUpdateService } from '@/services/prompt/promptUpdateService';
import { RefreshCw, CheckCircle, BookOpen, GraduationCap } from 'lucide-react';

interface ModulePromptUpdateButtonProps {
  moduleType?: 'k12' | 'post_secondary' | 'all';
  variant?: 'outline' | 'default';
  size?: 'sm' | 'default';
}

export const ModulePromptUpdateButton: React.FC<ModulePromptUpdateButtonProps> = ({
  moduleType = 'all',
  variant = 'outline',
  size = 'sm'
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const getButtonConfig = () => {
    switch (moduleType) {
      case 'k12':
        return {
          icon: BookOpen,
          text: isUpdating ? 'Updating K-12...' : 'Update K-12 Rich Content',
          updateFn: PromptUpdateService.updateK12Prompts,
          successMessage: 'K-12 prompts have been updated to use the rich content approach'
        };
      case 'post_secondary':
        return {
          icon: GraduationCap,
          text: isUpdating ? 'Updating Post-Secondary...' : 'Update Post-Secondary Rich Content',
          updateFn: PromptUpdateService.updatePostSecondaryPrompts,
          successMessage: 'Post-secondary prompts have been updated to use the rich content approach'
        };
      default:
        return {
          icon: CheckCircle,
          text: isUpdating ? 'Updating All Modules...' : 'Update All Rich Content Prompts',
          updateFn: PromptUpdateService.updateAllModulePrompts,
          successMessage: 'All module prompts have been updated to use the rich content approach'
        };
    }
  };

  const handleUpdatePrompts = async () => {
    setIsUpdating(true);
    const config = getButtonConfig();
    
    try {
      await config.updateFn();
      
      toast({
        title: "Prompts Updated Successfully",
        description: config.successMessage,
      });
    } catch (error) {
      console.error('Failed to update prompts:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update prompts. Check console for details.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const config = getButtonConfig();
  const IconComponent = config.icon;

  return (
    <Button
      onClick={handleUpdatePrompts}
      disabled={isUpdating}
      variant={variant}
      size={size}
      className="gap-2"
    >
      {isUpdating ? (
        <RefreshCw className="h-4 w-4 animate-spin" />
      ) : (
        <IconComponent className="h-4 w-4" />
      )}
      {config.text}
    </Button>
  );
};
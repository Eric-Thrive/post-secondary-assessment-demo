
import React from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { promptService } from '@/services/promptService';
import { RefreshCw } from "lucide-react";

const UpdateSystemInstructions: React.FC = () => {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = React.useState(false);

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      console.log('Updating system instructions...');
      const promptSectionsService = (promptService as any).promptSectionsService;
      await promptSectionsService.updateSystemInstructions();
      
      toast({
        title: "System Instructions Updated",
        description: "The system instructions have been successfully updated with anonymization guidelines.",
      });
      
      // Refresh the page to show the updated content
      window.location.reload();
      
    } catch (error) {
      console.error('Failed to update system instructions:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update system instructions. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Button 
      onClick={handleUpdate} 
      disabled={isUpdating}
      className="bg-green-600 hover:bg-green-700 text-white"
    >
      {isUpdating ? (
        <>
          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          Updating...
        </>
      ) : (
        'Update System Instructions'
      )}
    </Button>
  );
};

export default UpdateSystemInstructions;

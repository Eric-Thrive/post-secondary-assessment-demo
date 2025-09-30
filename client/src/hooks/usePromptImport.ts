
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { promptService } from '@/services/promptService';
import { useModule } from '@/contexts/ModuleContext';
import { parsePromptSeries as parsePromptSeriesUtil } from '@/utils/promptSeriesParser';

export interface ParsedComponent {
  type: 'system_prompt' | 'prompt_section' | 'lookup_table' | 'ai_config';
  key: string;
  title: string;
  content: string | any;
  action: 'create' | 'update';
  preview: string;
  size?: string;
  executionOrder?: number;
  isSystemPrompt?: boolean;
}

export const usePromptImport = () => {
  const { toast } = useToast();
  const { activeModule } = useModule();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const parsePromptSeries = async (text: string): Promise<ParsedComponent[]> => {
    setIsProcessing(true);
    try {
      const components = await parsePromptSeriesUtil(text);
      return components;
    } finally {
      setIsProcessing(false);
    }
  };

  const importComponents = async (components: ParsedComponent[]): Promise<{ success: number; failed: number }> => {
    setIsImporting(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const component of components) {
        try {
          switch (component.type) {
            case 'system_prompt':
            case 'prompt_section':
              await promptService.savePromptSection(
                component.key, 
                component.content as string,
                component.executionOrder,
                component.isSystemPrompt,
                activeModule
              );
              successCount++;
              break;
            
            case 'lookup_table':
              await promptService.saveLookupTable(component.key, component.content, activeModule);
              successCount++;
              break;
            
            case 'ai_config':
              await promptService.saveAIConfig(component.content, activeModule);
              successCount++;
              break;
          }
        } catch (error) {
          console.error(`Failed to save component ${component.key}:`, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast({
          title: "Import Completed",
          description: `Successfully imported ${successCount} component(s).${errorCount > 0 ? ` ${errorCount} failed.` : ''}`,
          variant: successCount === components.length ? "default" : "destructive"
        });
      } else {
        toast({
          title: "Import Failed",
          description: "All components failed to import.",
          variant: "destructive"
        });
      }

      return { success: successCount, failed: errorCount };
    } finally {
      setIsImporting(false);
    }
  };

  return {
    parsePromptSeries,
    importComponents,
    isProcessing,
    isImporting
  };
};

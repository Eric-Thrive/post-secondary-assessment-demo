
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings } from 'lucide-react';
import { AIConfigCard } from '../AIConfigCard';
import PromptCardSkeleton from '../PromptCardSkeleton';
import { ErrorAlert } from './ErrorAlert';

interface AIConfigurationSectionProps {
  aiConfig: any;
  aiConfigLoading: boolean;
  aiConfigError: any;
  handleSaveAIConfig: (config: any) => Promise<void>;
}

export const AIConfigurationSection: React.FC<AIConfigurationSectionProps> = ({
  aiConfig,
  aiConfigLoading,
  aiConfigError,
  handleSaveAIConfig,
}) => {
  return (
    <Card className="border-purple-200 bg-gradient-to-r from-purple-50/50 to-violet-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-purple-900">
          <Settings className="h-5 w-5" />
          AI Configuration
          <Badge variant="secondary" className="ml-2">Config</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {aiConfigError && <ErrorAlert error={aiConfigError} />}
        {aiConfigLoading ? (
          <PromptCardSkeleton />
        ) : aiConfig ? (
          <AIConfigCard 
            config={aiConfig}
            onUpdate={handleSaveAIConfig}
          />
        ) : (
          <div className="text-center text-muted-foreground py-8">
            No AI configuration found. Check console for debugging info.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

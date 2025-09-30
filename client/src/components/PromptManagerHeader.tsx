
import React from 'react';
import { Button } from "@/components/ui/button";
import { Upload, RefreshCw, TestTube, Database } from "lucide-react";
import { ModulePromptUpdateButton } from './prompts/ModulePromptUpdateButton';

interface PromptManagerHeaderProps {
  onImportPrompts: () => void;
  onRestoreOriginal: () => void;
  onTestPrompts: () => void;
  onSyncToDatabase: () => void;
  isRestoring: boolean;
}

const PromptManagerHeader: React.FC<PromptManagerHeaderProps> = ({
  onImportPrompts,
  onRestoreOriginal,
  onTestPrompts,
  onSyncToDatabase,
  isRestoring
}) => {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Prompt Manager
          </h1>
          <p className="text-gray-600 mt-1">
            Configure AI prompts, lookup tables, and system settings
          </p>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={onImportPrompts}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <Upload className="h-4 w-4" />
          Import Prompts
        </Button>
        
        <Button
          onClick={onRestoreOriginal}
          variant="outline"
          size="sm"
          disabled={isRestoring}
          className="gap-2"
        >
          {isRestoring ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          {isRestoring ? 'Restoring...' : 'Restore Original'}
        </Button>
        
        <Button
          onClick={onTestPrompts}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <TestTube className="h-4 w-4" />
          Test Prompts
        </Button>
        
        <Button
          onClick={onSyncToDatabase}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <Database className="h-4 w-4" />
          Sync to Database
        </Button>

        <ModulePromptUpdateButton moduleType="k12" />
        <ModulePromptUpdateButton moduleType="post_secondary" />
        <ModulePromptUpdateButton moduleType="all" />
      </div>
    </div>
  );
};

export default PromptManagerHeader;

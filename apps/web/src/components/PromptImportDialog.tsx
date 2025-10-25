
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, RefreshCw } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { usePromptImport, ParsedComponent } from '@/hooks/usePromptImport';
import ImportTextarea from './ImportTextarea';
import ParsedComponentsList from './ParsedComponentsList';

interface PromptImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

const PromptImportDialog: React.FC<PromptImportDialogProps> = ({
  isOpen,
  onClose,
  onImportComplete
}) => {
  const { toast } = useToast();
  const { parsePromptSeries, importComponents, isProcessing, isImporting } = usePromptImport();
  const [importText, setImportText] = useState('');
  const [parsedComponents, setParsedComponents] = useState<ParsedComponent[]>([]);

  const handleParse = async () => {
    try {
      const parsed = await parsePromptSeries(importText);
      setParsedComponents(parsed);
      
      if (parsed.length === 0) {
        toast({
          title: "No Components Found",
          description: "Could not identify any valid prompt components in the provided text.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Components Parsed",
          description: `Found ${parsed.length} component(s) ready for import.`,
        });
      }
    } catch (error) {
      toast({
        title: "Parse Error",
        description: "Failed to parse the prompt series text.",
        variant: "destructive"
      });
    }
  };

  const handleImport = async () => {
    if (parsedComponents.length === 0) return;
    
    const result = await importComponents(parsedComponents);
    
    if (result.success > 0) {
      onImportComplete();
      onClose();
      setImportText('');
      setParsedComponents([]);
    }
  };

  const handleClose = () => {
    onClose();
    setImportText('');
    setParsedComponents([]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Import Complete Prompt Series
          </DialogTitle>
          <DialogDescription>
            Paste your complete prompt series text below. The system will automatically detect and parse:
            <br />• System Initial Prompt • Prompt Sections (1-5) • Lookup Tables • AI Configuration
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <ImportTextarea
            value={importText}
            onChange={setImportText}
            onParse={handleParse}
            isProcessing={isProcessing}
          />

          <ParsedComponentsList components={parsedComponents} />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={parsedComponents.length === 0 || isImporting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isImporting ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Importing...
              </>
            ) : (
              `Import ${parsedComponents.length} Component(s)`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PromptImportDialog;

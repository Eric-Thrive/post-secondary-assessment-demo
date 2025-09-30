
import React from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RefreshCw } from "lucide-react";

interface ImportTextareaProps {
  value: string;
  onChange: (value: string) => void;
  onParse: () => void;
  isProcessing: boolean;
}

const ImportTextarea: React.FC<ImportTextareaProps> = ({
  value,
  onChange,
  onParse,
  isProcessing
}) => {
  return (
    <div className="space-y-2">
      <div className="space-y-2">
        <label className="text-sm font-medium">Complete Prompt Series Text</label>
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Paste your complete prompt series text here..."
          className="min-h-32 font-mono text-sm"
        />
      </div>

      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-600">
          {value.length} characters
        </span>
        <Button
          onClick={onParse}
          disabled={!value.trim() || isProcessing}
          variant="outline"
        >
          {isProcessing ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Parsing...
            </>
          ) : (
            'Parse Components'
          )}
        </Button>
      </div>
    </div>
  );
};

export default ImportTextarea;

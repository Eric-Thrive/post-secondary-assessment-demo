
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Edit, Save, RefreshCw, Trash2 } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { MappingConfiguration } from '@/types/promptService';

interface MappingConfigurationCardProps {
  mapping: MappingConfiguration;
  onSave: (mappingKey: string, mappingRules: any) => Promise<void>;
  isSaving: boolean;
}

const MappingConfigurationCard: React.FC<MappingConfigurationCardProps> = ({
  mapping,
  onSave,
  isSaving
}) => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [tempContent, setTempContent] = useState('');

  const handleEdit = () => {
    setIsEditing(true);
    const jsonString = JSON.stringify(mapping.mapping_rules, null, 2);
    setTempContent(jsonString);
    console.log('Setting mapping configuration content for editing:', {
      mappingKey: mapping.mapping_key,
      contentLength: jsonString.length,
      preview: jsonString.substring(0, 200) + '...'
    });
  };

  const handleSave = async () => {
    try {
      console.log('Saving mapping configuration with content length:', tempContent.length);
      const parsedContent = JSON.parse(tempContent);
      await onSave(mapping.mapping_key, parsedContent);
      setIsEditing(false);
      setTempContent('');
    } catch (error) {
      console.error('Invalid JSON format');
      toast({
        title: "Invalid JSON",
        description: "Please check your JSON formatting",
        variant: "destructive"
      });
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setTempContent('');
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">{mapping.title}</h3>
        {!isEditing && (
          <Button 
            onClick={handleEdit}
            size="sm"
            variant="outline"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        )}
      </div>
      
      {mapping.description && (
        <p className="text-sm text-gray-600">{mapping.description}</p>
      )}

      {isEditing ? (
        <div className="space-y-3">
          <div className="text-sm text-gray-600">
            Content length: {tempContent.length} characters
          </div>
          <ScrollArea className="h-[800px] w-full border rounded-md">
            <Textarea
              value={tempContent}
              onChange={(e) => setTempContent(e.target.value)}
              className="font-mono text-xs min-h-[800px] border-0 resize-none"
              placeholder="JSON mapping configuration data..."
            />
          </ScrollArea>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={handleCancel}
              size="sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              size="sm"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </>
              )}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="text-xs text-gray-500">
            Last updated: {new Date(mapping.last_updated).toLocaleString()}
          </div>
          <ScrollArea className="h-[800px] w-full border rounded-md p-4 bg-gray-50">
            <pre className="text-xs whitespace-pre-wrap font-mono">
              {JSON.stringify(mapping.mapping_rules, null, 2)}
            </pre>
          </ScrollArea>
        </div>
      )}
    </div>
  );
};

export default MappingConfigurationCard;

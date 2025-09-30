
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Edit, Save, RefreshCw, Trash2, Eye } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { InferenceTrigger } from '@/types/promptService';

interface InferenceTriggersCardProps {
  trigger: InferenceTrigger;
  onSave: (id: string, data: Partial<InferenceTrigger>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isSaving: boolean;
}

const InferenceTriggersCard: React.FC<InferenceTriggersCardProps> = ({
  trigger,
  onSave,
  onDelete,
  isSaving
}) => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [showRawData, setShowRawData] = useState(false);
  const [tempContent, setTempContent] = useState('');

  const handleEdit = () => {
    setIsEditing(true);
    const jsonString = JSON.stringify({
      trigger_type: trigger.trigger_type,
      description: trigger.description,
      keywords: trigger.keywords,
      inference_logic: trigger.inference_logic
    }, null, 2);
    setTempContent(jsonString);
    console.log('Editing inference trigger:', {
      id: trigger.id,
      trigger_type: trigger.trigger_type,
      descriptionLength: trigger.description?.length || 0,
      keywordsLength: trigger.keywords?.length || 0,
      logicLength: trigger.inference_logic?.length || 0
    });
  };

  const handleSave = async () => {
    try {
      const parsedContent = JSON.parse(tempContent);
      await onSave(trigger.id, parsedContent);
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

  const displayData = {
    trigger_type: trigger.trigger_type,
    description: trigger.description,
    keywords: trigger.keywords,
    inference_logic: trigger.inference_logic,
    last_updated: trigger.last_updated,
    created_at: trigger.created_at
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">{trigger.trigger_type.replace('_', ' ')}</h3>
          <div className="text-xs text-gray-500 mt-1">
            Keywords: {trigger.keywords?.length || 0} chars | 
            Logic: {trigger.inference_logic?.length || 0} chars |
            Updated: {new Date(trigger.last_updated).toLocaleDateString()}
          </div>
        </div>
        {!isEditing && (
          <div className="flex space-x-2">
            <Button 
              onClick={() => setShowRawData(!showRawData)}
              size="sm"
              variant="ghost"
            >
              <Eye className="h-4 w-4 mr-2" />
              {showRawData ? 'Formatted' : 'Raw Data'}
            </Button>
            <Button 
              onClick={() => onDelete(trigger.id)}
              size="sm"
              variant="outline"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
            <Button 
              onClick={handleEdit}
              size="sm"
              variant="outline"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-3">
          <div className="text-sm text-gray-600">
            Content length: {tempContent.length} characters
          </div>
          <ScrollArea className="h-[600px] w-full border rounded-md">
            <Textarea
              value={tempContent}
              onChange={(e) => setTempContent(e.target.value)}
              className="font-mono text-xs min-h-[600px] border-0 resize-none"
              placeholder="JSON inference trigger data..."
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
      ) : showRawData ? (
        <ScrollArea className="h-[600px] w-full border rounded-md p-4 bg-gray-50">
          <pre className="text-xs whitespace-pre-wrap font-mono">
            {JSON.stringify(displayData, null, 2)}
          </pre>
        </ScrollArea>
      ) : (
        <div className="space-y-4">
          <div className="border rounded-lg p-4 bg-blue-50">
            <h4 className="font-medium text-blue-900 mb-2">Description</h4>
            <p className="text-sm text-blue-800 whitespace-pre-wrap">{trigger.description}</p>
          </div>
          <div className="border rounded-lg p-4 bg-yellow-50">
            <h4 className="font-medium text-yellow-900 mb-2">Keywords</h4>
            <p className="text-sm text-yellow-800 whitespace-pre-wrap">{trigger.keywords}</p>
          </div>
          <div className="border rounded-lg p-4 bg-purple-50">
            <h4 className="font-medium text-purple-900 mb-2">Inference Logic</h4>
            <p className="text-sm text-purple-800 whitespace-pre-wrap">{trigger.inference_logic}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default InferenceTriggersCard;


import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Edit, Save, RefreshCw, Trash2, Eye } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { PlainLanguageMapping } from '@/types/promptService';

interface PlainLanguageMappingCardProps {
  mapping: PlainLanguageMapping;
  onSave: (id: string, data: Partial<PlainLanguageMapping>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isSaving: boolean;
}

const PlainLanguageMappingCard: React.FC<PlainLanguageMappingCardProps> = ({
  mapping,
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
      technical_term: mapping.technical_term,
      plain_language_version: mapping.plain_language_version
    }, null, 2);
    setTempContent(jsonString);
    console.log('Editing plain language mapping:', {
      id: mapping.id,
      technical_term: mapping.technical_term,
      technicalLength: mapping.technical_term?.length || 0,
      plainLength: mapping.plain_language_version?.length || 0
    });
  };

  const handleSave = async () => {
    try {
      const parsedContent = JSON.parse(tempContent);
      await onSave(mapping.id, parsedContent);
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
    technical_term: mapping.technical_term,
    plain_language_version: mapping.plain_language_version,
    last_updated: mapping.last_updated,
    created_at: mapping.created_at
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">{mapping.technical_term}</h3>
          <div className="text-xs text-gray-500 mt-1">
            Technical: {mapping.technical_term?.length || 0} chars | 
            Plain: {mapping.plain_language_version?.length || 0} chars |
            Updated: {new Date(mapping.last_updated).toLocaleDateString()}
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
              onClick={() => onDelete(mapping.id)}
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
          <ScrollArea className="h-[400px] w-full border rounded-md">
            <Textarea
              value={tempContent}
              onChange={(e) => setTempContent(e.target.value)}
              className="font-mono text-xs min-h-[400px] border-0 resize-none"
              placeholder="JSON plain language mapping data..."
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
        <ScrollArea className="h-[400px] w-full border rounded-md p-4 bg-gray-50">
          <pre className="text-xs whitespace-pre-wrap font-mono">
            {JSON.stringify(displayData, null, 2)}
          </pre>
        </ScrollArea>
      ) : (
        <div className="space-y-4">
          <div className="border rounded-lg p-4 bg-red-50">
            <h4 className="font-medium text-red-900 mb-2">Technical Term</h4>
            <p className="text-sm text-red-800 font-mono">{mapping.technical_term}</p>
          </div>
          <div className="border rounded-lg p-4 bg-green-50">
            <h4 className="font-medium text-green-900 mb-2">Plain Language Version</h4>
            <p className="text-sm text-green-800 whitespace-pre-wrap">{mapping.plain_language_version}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlainLanguageMappingCard;

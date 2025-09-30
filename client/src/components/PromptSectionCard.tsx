
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Edit, Save, RefreshCw } from "lucide-react";
import { PromptSection } from '@/services/promptService';

interface PromptSectionCardProps {
  section: PromptSection;
  onSave: (sectionKey: string, content: string) => Promise<void>;
  isSaving: boolean;
}

const PromptSectionCard: React.FC<PromptSectionCardProps> = ({
  section,
  onSave,
  isSaving
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempContent, setTempContent] = useState('');

  const handleEdit = () => {
    setIsEditing(true);
    setTempContent(section.content);
  };

  const handleSave = async () => {
    await onSave(section.section_key, tempContent);
    setIsEditing(false);
    setTempContent('');
  };

  const handleCancel = () => {
    setIsEditing(false);
    setTempContent('');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              {section.title}
              <Badge variant="outline">v{section.version}</Badge>
            </CardTitle>
            <CardDescription>
              {section.description} • Last updated: {new Date(section.last_updated).toLocaleDateString()}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={isEditing ? handleCancel : handleEdit}
          >
            <Edit className="h-4 w-4 mr-2" />
            {isEditing ? 'Cancel' : 'Edit'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-4">
            <Textarea
              value={tempContent}
              onChange={(e) => setTempContent(e.target.value)}
              rows={15}
              className="font-mono text-sm"
            />
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={handleCancel}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <pre className="text-sm bg-gray-50 p-4 rounded-lg overflow-x-auto whitespace-pre-wrap">
            {section.content}
          </pre>
        )}
      </CardContent>
    </Card>
  );
};

export default PromptSectionCard;

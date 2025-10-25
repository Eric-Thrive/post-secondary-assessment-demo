
import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Edit, Save, RefreshCw, Settings } from "lucide-react";
import { PromptSection } from '@/types/promptService';
import UpdateSystemInstructions from '../UpdateSystemInstructions';

interface SystemInstructionsCardProps {
  section: PromptSection;
  onSave: (sectionKey: string, content: string) => Promise<void>;
  isSaving: boolean;
}

const SystemInstructionsCard: React.FC<SystemInstructionsCardProps> = ({
  section,
  onSave,
  isSaving
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempContent, setTempContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = 'auto';
      
      // Calculate the new height based on content
      const newHeight = Math.max(
        textarea.scrollHeight,
        240 // Minimum height (approximately 10 rows)
      );
      
      // Set maximum height to 80vh to prevent taking up entire screen
      const maxHeight = Math.min(newHeight, window.innerHeight * 0.8);
      
      textarea.style.height = `${maxHeight}px`;
    }
  };

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      // Adjust height when entering edit mode
      setTimeout(adjustTextareaHeight, 0);
    }
  }, [isEditing, tempContent]);

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

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTempContent(e.target.value);
    // Adjust height on content change
    setTimeout(adjustTextareaHeight, 0);
  };

  return (
    <Card className="border-purple-200 bg-gradient-to-r from-purple-50/50 to-violet-50/50">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2 text-purple-900">
              <Settings className="h-5 w-5" />
              System Instructions
              <Badge variant="outline" className="bg-purple-100">v{section.version}</Badge>
            </CardTitle>
            <CardDescription>
              Core system prompt that defines AI behavior and constraints
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <UpdateSystemInstructions />
            <Button
              variant="outline"
              size="sm"
              onClick={isEditing ? handleCancel : handleEdit}
              className="border-purple-300 hover:bg-purple-50"
            >
              <Edit className="h-4 w-4 mr-2" />
              {isEditing ? 'Cancel' : 'Edit'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-4">
            <Textarea
              ref={textareaRef}
              value={tempContent}
              onChange={handleContentChange}
              className="font-mono text-sm resize-y min-h-[240px] overflow-y-auto"
              placeholder="Enter system instructions..."
              style={{ height: 'auto' }}
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
                className="bg-purple-600 hover:bg-purple-700 text-white"
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
          <pre className="text-sm bg-purple-50/50 p-4 rounded-lg overflow-x-auto whitespace-pre-wrap max-h-96 overflow-y-auto">
            {section.content}
          </pre>
        )}
      </CardContent>
    </Card>
  );
};

export default SystemInstructionsCard;

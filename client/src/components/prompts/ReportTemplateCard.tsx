
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Edit, Save, RefreshCw, FileText } from "lucide-react";
import { PromptSection } from '@/types/promptService';

interface ReportTemplateCardProps {
  section: PromptSection;
  onSave: (sectionKey: string, content: string) => Promise<void>;
  isSaving: boolean;
}

const ReportTemplateCard: React.FC<ReportTemplateCardProps> = ({
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
    <Card className="border-green-200 bg-gradient-to-r from-green-50/50 to-emerald-50/50">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2 text-green-900">
              <FileText className="h-5 w-5" />
              Report Template
              <Badge variant="outline" className="bg-green-100">v{section.version}</Badge>
            </CardTitle>
            <CardDescription>
              Markdown template for generating disability accommodation reports
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={isEditing ? handleCancel : handleEdit}
            className="border-green-300 hover:bg-green-50"
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
              placeholder="Enter report template markdown..."
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
                className="bg-green-600 hover:bg-green-700 text-white"
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
          <pre className="text-sm bg-green-50/50 p-4 rounded-lg overflow-x-auto whitespace-pre-wrap max-h-96 overflow-y-auto">
            {section.content}
          </pre>
        )}
      </CardContent>
    </Card>
  );
};

export default ReportTemplateCard;

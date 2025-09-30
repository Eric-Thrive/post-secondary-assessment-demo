
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Trash2, Save, FileText } from 'lucide-react';

interface K12ObservationTemplateCardProps {
  template: {
    canonical_key: string;
    grade_band: string;
    subject_area: string;
    observation_label: string;
    classroom_observation?: string;
    table_type: string;
  };
  onSave: (canonical_key: string, grade_band: string, data: any) => Promise<void>;
  onDelete: (canonical_key: string, grade_band: string) => Promise<void>;
  isSaving: boolean;
}

const K12ObservationTemplateCard: React.FC<K12ObservationTemplateCardProps> = ({
  template,
  onSave,
  onDelete,
  isSaving
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTemplate, setEditedTemplate] = useState(template);

  const handleSave = async () => {
    try {
      await onSave(template.canonical_key, template.grade_band, editedTemplate);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save observation template:', error);
    }
  };

  const handleCancel = () => {
    setEditedTemplate(template);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this observation template?')) {
      try {
        await onDelete(template.canonical_key, template.grade_band);
      } catch (error) {
        console.error('Failed to delete observation template:', error);
      }
    }
  };

  return (
    <Card className="border-purple-200 bg-gradient-to-r from-purple-50/50 to-indigo-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-purple-900">
            <FileText className="h-5 w-5" />
            K-12 {template.canonical_key}
            <Badge variant="outline" className="ml-2 bg-purple-100 text-purple-800">
              {template.grade_band}
            </Badge>
            <Badge variant="secondary" className="bg-indigo-100 text-indigo-800">
              {template.subject_area}
            </Badge>
          </CardTitle>
          <div className="flex gap-2">
            {!isEditing ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="text-purple-600 border-purple-200 hover:bg-purple-50"
                >
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Save className="h-4 w-4 mr-1" />
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEditing ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="subject_area">Subject Area</Label>
              <Input
                id="subject_area"
                value={editedTemplate.subject_area}
                onChange={(e) => setEditedTemplate({...editedTemplate, subject_area: e.target.value})}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="observation_label">Observation Label</Label>
              <Textarea
                id="observation_label"
                value={editedTemplate.observation_label}
                onChange={(e) => setEditedTemplate({...editedTemplate, observation_label: e.target.value})}
                className="mt-1 min-h-[100px]"
              />
            </div>

            <div>
              <Label htmlFor="classroom_observation">Classroom Observation</Label>
              <Textarea
                id="classroom_observation"
                value={editedTemplate.classroom_observation || ''}
                onChange={(e) => setEditedTemplate({...editedTemplate, classroom_observation: e.target.value})}
                className="mt-1 min-h-[100px]"
                placeholder="Additional classroom observation details..."
              />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <span className="font-medium text-purple-900">Observation Label:</span>
              <p className="text-gray-700 mt-1 whitespace-pre-wrap leading-relaxed bg-purple-50 p-3 rounded-md border border-purple-100">
                {template.observation_label}
              </p>
            </div>
            
            {template.classroom_observation && (
              <div>
                <span className="font-medium text-purple-900">Classroom Observation:</span>
                <p className="text-gray-700 mt-1 whitespace-pre-wrap text-sm leading-relaxed">
                  {template.classroom_observation}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default K12ObservationTemplateCard;

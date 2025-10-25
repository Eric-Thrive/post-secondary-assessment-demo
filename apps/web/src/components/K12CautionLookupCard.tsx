
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Trash2, Save, AlertTriangle } from 'lucide-react';

interface K12CautionLookupCardProps {
  caution: {
    caution_id: string;
    canonical_key: string;
    grade_band: string;
    caution_text: string;
    framework_tag: string;
  };
  onSave: (caution_id: string, data: any) => Promise<void>;
  onDelete: (caution_id: string) => Promise<void>;
  isSaving: boolean;
}

const K12CautionLookupCard: React.FC<K12CautionLookupCardProps> = ({
  caution,
  onSave,
  onDelete,
  isSaving
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedCaution, setEditedCaution] = useState(caution);

  const handleSave = async () => {
    try {
      await onSave(caution.caution_id, editedCaution);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save caution lookup:', error);
    }
  };

  const handleCancel = () => {
    setEditedCaution(caution);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this caution lookup entry?')) {
      try {
        await onDelete(caution.caution_id);
      } catch (error) {
        console.error('Failed to delete caution lookup:', error);
      }
    }
  };

  return (
    <Card className="border-orange-200 bg-gradient-to-r from-orange-50/50 to-red-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-orange-900">
            <AlertTriangle className="h-5 w-5" />
            K-12 {caution.canonical_key}
            <Badge variant="outline" className="ml-2 bg-orange-100 text-orange-800">
              {caution.grade_band}
            </Badge>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              {caution.caution_id}
            </Badge>
            <Badge variant="secondary" className="bg-purple-100 text-purple-800">
              {caution.framework_tag}
            </Badge>
          </CardTitle>
          <div className="flex gap-2">
            {!isEditing ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="text-orange-600 border-orange-200 hover:bg-orange-50"
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
                  className="bg-orange-600 hover:bg-orange-700"
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
              <Label htmlFor="caution_id">Caution ID</Label>
              <Input
                id="caution_id"
                value={editedCaution.caution_id}
                onChange={(e) => setEditedCaution({...editedCaution, caution_id: e.target.value})}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="canonical_key">Canonical Key</Label>
              <Input
                id="canonical_key"
                value={editedCaution.canonical_key}
                onChange={(e) => setEditedCaution({...editedCaution, canonical_key: e.target.value})}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="grade_band">Grade Band</Label>
              <Input
                id="grade_band"
                value={editedCaution.grade_band}
                onChange={(e) => setEditedCaution({...editedCaution, grade_band: e.target.value})}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="framework_tag">Framework Tag</Label>
              <Input
                id="framework_tag"
                value={editedCaution.framework_tag}
                onChange={(e) => setEditedCaution({...editedCaution, framework_tag: e.target.value})}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="caution_text">Caution Text</Label>
              <Textarea
                id="caution_text"
                value={editedCaution.caution_text}
                onChange={(e) => setEditedCaution({...editedCaution, caution_text: e.target.value})}
                className="mt-1 min-h-[100px]"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <span className="font-medium text-orange-900">Caution Text:</span>
              <p className="text-gray-700 mt-1 whitespace-pre-wrap leading-relaxed bg-red-50 p-3 rounded-md border border-red-100">
                {caution.caution_text}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default K12CautionLookupCard;

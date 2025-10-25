
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Save, BookOpen } from 'lucide-react';

interface K12InferenceTriggersCardProps {
  trigger: {
    canonical_key: string;
    parent_friendly: string;
    synonym_list?: string;
    notes?: string;
  };
  onSave: (canonical_key: string, data: any) => Promise<void>;
  onDelete: (canonical_key: string) => Promise<void>;
  isSaving: boolean;
}

const K12InferenceTriggersCard: React.FC<K12InferenceTriggersCardProps> = ({
  trigger,
  onSave,
  onDelete,
  isSaving
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTrigger, setEditedTrigger] = useState(trigger);

  const handleSave = async () => {
    try {
      await onSave(trigger.canonical_key, editedTrigger);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save K-12 inference trigger:', error);
    }
  };

  const handleCancel = () => {
    setEditedTrigger(trigger);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this inference trigger?')) {
      try {
        await onDelete(trigger.canonical_key);
      } catch (error) {
        console.error('Failed to delete K-12 inference trigger:', error);
      }
    }
  };

  return (
    <Card className="border-amber-200 bg-gradient-to-r from-amber-50/50 to-yellow-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-amber-900">
            <BookOpen className="h-5 w-5" />
            {trigger.canonical_key}
          </CardTitle>
          <div className="flex gap-2">
            {!isEditing ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="text-amber-600 border-amber-200 hover:bg-amber-50"
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
                  className="bg-amber-600 hover:bg-amber-700"
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
              <Label htmlFor="canonical_key">Canonical Key</Label>
              <Input
                id="canonical_key"
                value={editedTrigger.canonical_key}
                onChange={(e) => setEditedTrigger({...editedTrigger, canonical_key: e.target.value})}
                className="mt-1"
                placeholder="Enter canonical key..."
              />
            </div>
            
            <div>
              <Label htmlFor="parent_friendly">Parent Friendly Description</Label>
              <Textarea
                id="parent_friendly"
                value={editedTrigger.parent_friendly}
                onChange={(e) => setEditedTrigger({...editedTrigger, parent_friendly: e.target.value})}
                className="mt-1 min-h-[100px]"
                placeholder="Enter parent-friendly description..."
              />
            </div>

            <div>
              <Label htmlFor="synonym_list">Synonym List</Label>
              <Textarea
                id="synonym_list"
                value={editedTrigger.synonym_list || ''}
                onChange={(e) => setEditedTrigger({...editedTrigger, synonym_list: e.target.value})}
                className="mt-1 min-h-[80px]"
                placeholder="Enter synonyms (comma-separated or one per line)..."
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={editedTrigger.notes || ''}
                onChange={(e) => setEditedTrigger({...editedTrigger, notes: e.target.value})}
                className="mt-1 min-h-[100px]"
                placeholder="Enter additional notes..."
              />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <span className="font-medium text-amber-900">Parent Friendly Description:</span>
              <p className="text-gray-700 mt-1 whitespace-pre-wrap">{trigger.parent_friendly}</p>
            </div>
            
            {trigger.synonym_list && (
              <div>
                <span className="font-medium text-amber-900">Synonyms:</span>
                <p className="text-gray-700 mt-1 whitespace-pre-wrap">{trigger.synonym_list}</p>
              </div>
            )}

            {trigger.notes && (
              <div>
                <span className="font-medium text-amber-900">Notes:</span>
                <p className="text-gray-700 mt-1 whitespace-pre-wrap text-sm">{trigger.notes}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default K12InferenceTriggersCard;

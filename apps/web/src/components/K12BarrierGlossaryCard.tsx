
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Trash2, Save, Shield } from 'lucide-react';

interface K12BarrierGlossaryCardProps {
  glossary: {
    canonical_key: string;
    one_sentence_definition: string;
    parent_friendly: string;
  };
  onSave: (canonical_key: string, data: any) => Promise<void>;
  onDelete: (canonical_key: string) => Promise<void>;
  isSaving: boolean;
}

const K12BarrierGlossaryCard: React.FC<K12BarrierGlossaryCardProps> = ({
  glossary,
  onSave,
  onDelete,
  isSaving
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedGlossary, setEditedGlossary] = useState(glossary);

  const handleSave = async () => {
    try {
      await onSave(glossary.canonical_key, editedGlossary);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save K-12 barrier glossary:', error);
    }
  };

  const handleCancel = () => {
    setEditedGlossary(glossary);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this barrier glossary entry?')) {
      try {
        await onDelete(glossary.canonical_key);
      } catch (error) {
        console.error('Failed to delete K-12 barrier glossary:', error);
      }
    }
  };

  return (
    <Card className="border-teal-200 bg-gradient-to-r from-teal-50/50 to-cyan-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-teal-900">
            <Shield className="h-5 w-5" />
            {glossary.canonical_key}
            <Badge variant="outline" className="ml-2 bg-teal-100 text-teal-800">
              K-12 Barrier
            </Badge>
          </CardTitle>
          <div className="flex gap-2">
            {!isEditing ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="text-teal-600 border-teal-200 hover:bg-teal-50"
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
                  className="bg-teal-600 hover:bg-teal-700"
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
                value={editedGlossary.canonical_key}
                onChange={(e) => setEditedGlossary({...editedGlossary, canonical_key: e.target.value})}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="one_sentence_definition">One Sentence Definition</Label>
              <Textarea
                id="one_sentence_definition"
                value={editedGlossary.one_sentence_definition}
                onChange={(e) => setEditedGlossary({...editedGlossary, one_sentence_definition: e.target.value})}
                className="mt-1 min-h-[80px]"
                placeholder="Enter a concise, one-sentence definition..."
              />
            </div>

            <div>
              <Label htmlFor="parent_friendly">Parent Friendly</Label>
              <Textarea
                id="parent_friendly"
                value={editedGlossary.parent_friendly}
                onChange={(e) => setEditedGlossary({...editedGlossary, parent_friendly: e.target.value})}
                className="mt-1 min-h-[80px]"
                placeholder="Enter parent-friendly explanation..."
              />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <span className="font-medium text-teal-900">One Sentence Definition:</span>
              <p className="text-gray-700 mt-1">{glossary.one_sentence_definition}</p>
            </div>
            
            <div>
              <span className="font-medium text-teal-900">Parent Friendly:</span>
              <p className="text-gray-700 mt-1 whitespace-pre-wrap bg-teal-50 p-3 rounded-md border border-teal-100">
                {glossary.parent_friendly}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default K12BarrierGlossaryCard;

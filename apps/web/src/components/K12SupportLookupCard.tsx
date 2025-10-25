
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Trash2, Save, Heart } from 'lucide-react';

interface K12SupportLookupCardProps {
  support: {
    id: string;
    canonical_key: string;
    grade_band: string;
    support_id?: string;
    support_type?: string;
    description?: string;
    implementation_note?: string;
  };
  onSave: (id: string, data: any) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isSaving: boolean;
}

const K12SupportLookupCard: React.FC<K12SupportLookupCardProps> = ({
  support,
  onSave,
  onDelete,
  isSaving
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedSupport, setEditedSupport] = useState(support);

  const handleSave = async () => {
    try {
      await onSave(support.id, editedSupport);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save support lookup:', error);
    }
  };

  const handleCancel = () => {
    setEditedSupport(support);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this support lookup entry?')) {
      try {
        await onDelete(support.id);
      } catch (error) {
        console.error('Failed to delete support lookup:', error);
      }
    }
  };

  return (
    <Card className="border-green-200 bg-gradient-to-r from-green-50/50 to-emerald-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-green-900">
            <Heart className="h-5 w-5" />
            {support.canonical_key}
            <Badge variant="outline" className="ml-2 bg-green-100 text-green-800">
              {support.grade_band}
            </Badge>
            {support.support_id && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {support.support_id}
              </Badge>
            )}
          </CardTitle>
          <div className="flex gap-2">
            {!isEditing ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="text-green-600 border-green-200 hover:bg-green-50"
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
                  className="bg-green-600 hover:bg-green-700"
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
              <Label htmlFor="support_id">Support ID</Label>
              <Input
                id="support_id"
                value={editedSupport.support_id || ''}
                onChange={(e) => setEditedSupport({...editedSupport, support_id: e.target.value})}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="support_type">Support Type</Label>
              <Input
                id="support_type"
                value={editedSupport.support_type || ''}
                onChange={(e) => setEditedSupport({...editedSupport, support_type: e.target.value})}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={editedSupport.description || ''}
                onChange={(e) => setEditedSupport({...editedSupport, description: e.target.value})}
                className="mt-1 min-h-[100px]"
              />
            </div>

            <div>
              <Label htmlFor="implementation_note">Implementation Note</Label>
              <Textarea
                id="implementation_note"
                value={editedSupport.implementation_note || ''}
                onChange={(e) => setEditedSupport({...editedSupport, implementation_note: e.target.value})}
                className="mt-1 min-h-[100px]"
                placeholder="Detailed notes for implementing this support..."
              />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {support.support_id && (
              <div>
                <span className="font-medium text-green-900">Support ID:</span>
                <p className="text-gray-700 mt-1">{support.support_id}</p>
              </div>
            )}

            {support.support_type && (
              <div>
                <span className="font-medium text-green-900">Support Type:</span>
                <p className="text-gray-700 mt-1">{support.support_type}</p>
              </div>
            )}

            {support.description && (
              <div>
                <span className="font-medium text-green-900">Description:</span>
                <p className="text-gray-700 mt-1 whitespace-pre-wrap leading-relaxed">{support.description}</p>
              </div>
            )}
            
            {support.implementation_note && (
              <div>
                <span className="font-medium text-green-900">Implementation Note:</span>
                <p className="text-gray-700 mt-1 whitespace-pre-wrap text-sm leading-relaxed bg-green-50 p-3 rounded-md border border-green-100">
                  {support.implementation_note}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default K12SupportLookupCard;

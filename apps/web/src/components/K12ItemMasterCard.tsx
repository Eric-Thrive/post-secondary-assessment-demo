
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Trash2, Save, BookOpen } from 'lucide-react';

interface K12ItemMasterCardProps {
  item: {
    id: string;
    item_id?: string;
    item_type?: string;
    canonical_key: string;
    teacher_label: string;
    parent_friendly_label?: string;
    evidence_basis?: string;
    classroom_observation?: string;
    support_1?: string;
    support_2?: string;
    caution_note?: string;
    qc_flag?: string;
    source_table?: string;
    source_id?: string;
  };
  onSave: (id: string, data: any) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isSaving: boolean;
}

const K12ItemMasterCard: React.FC<K12ItemMasterCardProps> = ({
  item,
  onSave,
  onDelete,
  isSaving
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedItem, setEditedItem] = useState(item);

  const handleSave = async () => {
    try {
      await onSave(item.id, editedItem);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save item master:', error);
    }
  };

  const handleCancel = () => {
    setEditedItem(item);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this item master entry?')) {
      try {
        await onDelete(item.id);
      } catch (error) {
        console.error('Failed to delete item master:', error);
      }
    }
  };

  return (
    <Card className="border-blue-200 bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <BookOpen className="h-5 w-5" />
            {item.canonical_key}
            {item.item_type && (
              <Badge variant="outline" className="ml-2 bg-blue-100 text-blue-800">
                {item.item_type}
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
                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
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
                  className="bg-blue-600 hover:bg-blue-700"
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="item_id">Item ID</Label>
                <Input
                  id="item_id"
                  value={editedItem.item_id || ''}
                  onChange={(e) => setEditedItem({...editedItem, item_id: e.target.value})}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="item_type">Item Type</Label>
                <Input
                  id="item_type"
                  value={editedItem.item_type || ''}
                  onChange={(e) => setEditedItem({...editedItem, item_type: e.target.value})}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="teacher_label">Teacher Label</Label>
              <Input
                id="teacher_label"
                value={editedItem.teacher_label}
                onChange={(e) => setEditedItem({...editedItem, teacher_label: e.target.value})}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="parent_friendly_label">Parent Friendly Label</Label>
              <Input
                id="parent_friendly_label"
                value={editedItem.parent_friendly_label || ''}
                onChange={(e) => setEditedItem({...editedItem, parent_friendly_label: e.target.value})}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="classroom_observation">Classroom Observation</Label>
              <Textarea
                id="classroom_observation"
                value={editedItem.classroom_observation || ''}
                onChange={(e) => setEditedItem({...editedItem, classroom_observation: e.target.value})}
                className="mt-1 min-h-[80px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="support_1">Support 1</Label>
                <Textarea
                  id="support_1"
                  value={editedItem.support_1 || ''}
                  onChange={(e) => setEditedItem({...editedItem, support_1: e.target.value})}
                  className="mt-1 min-h-[60px]"
                />
              </div>
              <div>
                <Label htmlFor="support_2">Support 2</Label>
                <Textarea
                  id="support_2"
                  value={editedItem.support_2 || ''}
                  onChange={(e) => setEditedItem({...editedItem, support_2: e.target.value})}
                  className="mt-1 min-h-[60px]"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="caution_note">Caution Note</Label>
              <Textarea
                id="caution_note"
                value={editedItem.caution_note || ''}
                onChange={(e) => setEditedItem({...editedItem, caution_note: e.target.value})}
                className="mt-1 min-h-[60px]"
              />
            </div>

            <div>
              <Label htmlFor="evidence_basis">Evidence Basis</Label>
              <Textarea
                id="evidence_basis"
                value={editedItem.evidence_basis || ''}
                onChange={(e) => setEditedItem({...editedItem, evidence_basis: e.target.value})}
                className="mt-1 min-h-[60px]"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="qc_flag">QC Flag</Label>
                <Input
                  id="qc_flag"
                  value={editedItem.qc_flag || ''}
                  onChange={(e) => setEditedItem({...editedItem, qc_flag: e.target.value})}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="source_table">Source Table</Label>
                <Input
                  id="source_table"
                  value={editedItem.source_table || ''}
                  onChange={(e) => setEditedItem({...editedItem, source_table: e.target.value})}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="source_id">Source ID</Label>
                <Input
                  id="source_id"
                  value={editedItem.source_id || ''}
                  onChange={(e) => setEditedItem({...editedItem, source_id: e.target.value})}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              {item.item_id && (
                <div>
                  <span className="font-medium text-blue-900">Item ID:</span>
                  <p className="text-gray-700 mt-1">{item.item_id}</p>
                </div>
              )}
              {item.item_type && (
                <div>
                  <span className="font-medium text-blue-900">Item Type:</span>
                  <p className="text-gray-700 mt-1">{item.item_type}</p>
                </div>
              )}
            </div>

            <div>
              <span className="font-medium text-blue-900">Teacher Label:</span>
              <p className="text-gray-700 mt-1">{item.teacher_label}</p>
            </div>
            
            {item.parent_friendly_label && (
              <div>
                <span className="font-medium text-blue-900">Parent Friendly Label:</span>
                <p className="text-gray-700 mt-1">{item.parent_friendly_label}</p>
              </div>
            )}

            {item.classroom_observation && (
              <div>
                <span className="font-medium text-blue-900">Classroom Observation:</span>
                <p className="text-gray-700 mt-1 whitespace-pre-wrap">{item.classroom_observation}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {item.support_1 && (
                <div>
                  <span className="font-medium text-blue-900">Support 1:</span>
                  <p className="text-gray-700 mt-1 text-sm">{item.support_1}</p>
                </div>
              )}
              {item.support_2 && (
                <div>
                  <span className="font-medium text-blue-900">Support 2:</span>
                  <p className="text-gray-700 mt-1 text-sm">{item.support_2}</p>
                </div>
              )}
            </div>

            {item.caution_note && (
              <div>
                <span className="font-medium text-red-700">Caution Note:</span>
                <p className="text-red-600 mt-1 text-sm">{item.caution_note}</p>
              </div>
            )}

            {item.evidence_basis && (
              <div>
                <span className="font-medium text-blue-900">Evidence Basis:</span>
                <p className="text-gray-700 mt-1 text-sm">{item.evidence_basis}</p>
              </div>
            )}

            <div className="flex items-center gap-4 text-sm text-gray-500 pt-2 border-t">
              {item.source_table && <span>Source: {item.source_table}</span>}
              {item.source_id && <span>ID: {item.source_id}</span>}
              {item.qc_flag && <Badge variant="secondary">{item.qc_flag}</Badge>}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default K12ItemMasterCard;

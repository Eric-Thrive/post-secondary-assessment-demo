
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface GradeSelectionProps {
  selectedGrade: string;
  onGradeChange: (grade: string) => void;
  error?: string;
}

const GRADE_OPTIONS = [
  { value: 'kindergarten', label: 'Kindergarten' },
  { value: '1st', label: '1st Grade' },
  { value: '2nd', label: '2nd Grade' },
  { value: '3rd', label: '3rd Grade' },
  { value: '4th', label: '4th Grade' },
  { value: '5th', label: '5th Grade' },
  { value: '6th', label: '6th Grade' },
  { value: '7th', label: '7th Grade' },
  { value: '8th', label: '8th Grade' },
  { value: '9th', label: '9th Grade' },
  { value: '10th', label: '10th Grade' },
  { value: '11th', label: '11th Grade' },
  { value: '12th', label: '12th Grade' }
];

export const GradeSelection: React.FC<GradeSelectionProps> = ({ 
  selectedGrade, 
  onGradeChange, 
  error 
}) => {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        Student Grade Level *
      </label>
      <div>
        <Select value={selectedGrade} onValueChange={onGradeChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select student's grade level" />
          </SelectTrigger>
          <SelectContent className="max-h-[300px] overflow-y-auto z-50">
            {GRADE_OPTIONS.map((grade) => (
              <SelectItem key={grade.value} value={grade.value}>
                {grade.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {error && (
        <span className="text-sm font-medium text-destructive">
          {error}
        </span>
      )}
    </div>
  );
};

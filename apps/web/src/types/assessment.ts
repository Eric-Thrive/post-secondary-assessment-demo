
export interface DocumentFile {
  id: string;
  name: string;
  type: 'student_form' | 'psychoed_eval' | 'medical_eval' | 'other';
  size: string;
  uploadDate: string;
  status: 'uploaded' | 'processing' | 'analyzed';
  finalized?: boolean;
}

export interface DocumentType {
  id: string;
  label: string;
  required: boolean;
}

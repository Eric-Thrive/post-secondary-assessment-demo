// @ts-nocheck

import Papa from 'papaparse';
import { toast } from '@/hooks/use-toast';

export interface CSVProcessingResult<T> {
  data: T[];
  errors: CSVError[];
  totalRows: number;
  validRows: number;
}

export interface CSVError {
  row: number;
  field: string;
  value: any;
  message: string;
}

export interface CSVUploadOptions {
  mode: 'replace' | 'append' | 'update';
  validateOnly?: boolean;
}

class CSVProcessingService {
  async parseCSV<T>(file: File, tableType?: string): Promise<CSVProcessingResult<T>> {
    return new Promise((resolve) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const errors: CSVError[] = [];
          const validData: T[] = [];

          results.data.forEach((row: any, index: number) => {
            const rowErrors = this.validateRow(row, index + 1, tableType);
            if (rowErrors.length > 0) {
              errors.push(...rowErrors);
            } else {
              validData.push(row as T);
            }
          });

          resolve({
            data: validData,
            errors,
            totalRows: results.data.length,
            validRows: validData.length
          });
        },
        error: (error) => {
          resolve({
            data: [],
            errors: [{ row: 0, field: 'file', value: file.name, message: error.message }],
            totalRows: 0,
            validRows: 0
          });
        }
      });
    });
  }

  private validateRow(row: any, rowNumber: number, tableType?: string): CSVError[] {
    const errors: CSVError[] = [];
    
    // Basic validation - check for empty required fields
    Object.entries(row).forEach(([field, value]) => {
      if (this.isRequiredField(field, tableType) && (!value || String(value).trim() === '')) {
        errors.push({
          row: rowNumber,
          field,
          value,
          message: `Required field '${field}' is empty`
        });
      }
    });

    return errors;
  }

  private isRequiredField(field: string, tableType?: string): boolean {
    const requiredFieldsByTable: Record<string, string[]> = {
      'item-master': [
        'canonical_key', 'teacher_label'
      ],
      'support-lookup': [
        'canonical_key', 'grade_band'
      ],
      'caution-lookup': [
        'caution_id', 'canonical_key', 'grade_band', 'caution_text', 'framework_tag'
      ],
      'observation-template': [
        'canonical_key', 'grade_band', 'subject_area', 'observation_label'
      ],
      'k12-barriers': [
        'canonical_key', 'one_sentence_definition', 'parent_friendly'
      ],
      'k12-triggers': [
        'canonical_key', 'parent_friendly'
      ],
      'lookup-tables': [
        'table_key', 'title', 'content'
      ],
      'barriers': [
        'canonical_key', 'definition'
      ],
      'triggers': [
        'trigger_type', 'description', 'keywords', 'inference_logic'
      ],
      'language': [
        'technical_term', 'plain_language_version'
      ],
      'mappings': [
        'mapping_key', 'title', 'mapping_rules'
      ]
    };

    if (!tableType || !requiredFieldsByTable[tableType]) {
      // Fallback to basic validation for unknown table types
      return false;
    }

    return requiredFieldsByTable[tableType].includes(field);
  }

  generateTemplate(tableType: string): string {
    const templates: Record<string, string[]> = {
      'item-master': [
        'item_id', 'item_type', 'canonical_key', 'teacher_label', 'parent_friendly_label',
        'evidence_basis', 'classroom_observation', 'support_1', 'support_2', 'caution_note',
        'qc_flag', 'source_table', 'source_id'
      ],
      'support-lookup': [
        'support_id', 'grade_band', 'canonical_key', 'implementation_note'
      ],
      'caution-lookup': [
        'caution_id', 'canonical_key', 'grade_band', 'caution_text', 'framework_tag'
      ],
      'observation-template': [
        'canonical_key', 'grade_band', 'subject_area', 'observation_label', 'classroom_observation', 'table_type'
      ],
      'k12-barriers': [
        'canonical_key', 'one_sentence_definition', 'parent_friendly'
      ],
      'k12-triggers': [
        'canonical_key', 'parent_friendly', 'synonym_list', 'notes'
      ],
      'lookup-tables': [
        'table_key', 'title', 'description', 'content'
      ],
      'barriers': [
        'canonical_key', 'definition', 'examples'
      ],
      'triggers': [
        'trigger_type', 'description', 'keywords', 'inference_logic'
      ],
      'language': [
        'technical_term', 'plain_language_version'
      ],
      'mappings': [
        'mapping_key', 'title', 'description', 'mapping_rules'
      ]
    };

    const headers = templates[tableType] || [];
    return Papa.unparse([headers]);
  }

  downloadTemplate(tableType: string, fileName: string) {
    const csv = this.generateTemplate(tableType);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}

export const csvProcessingService = new CSVProcessingService();


import { apiClient } from '@/lib/apiClient';

export interface K12ObservationTemplate {
  canonical_key: string;
  grade_band: string;
  subject_area: string;
  observation_label: string;
  classroom_observation?: string;
  table_type: string;
  module_type: string;
}

export interface K12ObservationTemplateInput {
  canonical_key: string;
  grade_band: string;
  subject_area: string;
  observation_label: string;
  classroom_observation?: string;
  module_type?: string;
}

class K12ObservationTemplateService {
  async loadAll(moduleType: string = 'k12'): Promise<K12ObservationTemplate[]> {
    console.log('Loading K-12 observation templates for module:', moduleType);
    
    const { data, error } = await database
      .from('observation_template')
      .select('*')
      .eq('module_type', moduleType)
      .order('canonical_key')
      .order('grade_band');
    
    if (error) {
      console.error('Error loading K-12 observation templates:', error);
      throw error;
    }
    
    return data || [];
  }

  async save(input: K12ObservationTemplateInput, moduleType: string = 'k12'): Promise<K12ObservationTemplate> {
    console.log('Saving K-12 observation template:', input);
    
    const saveData = {
      ...input,
      table_type: moduleType,
      module_type: moduleType
    };
    
    const { data: result, error } = await database
      .from('observation_template')
      .upsert(saveData)
      .select()
      .single();
    
    if (error) {
      console.error('Error saving K-12 observation template:', error);
      throw error;
    }
    
    return result;
  }

  async update(canonical_key: string, grade_band: string, updates: Partial<K12ObservationTemplateInput>): Promise<K12ObservationTemplate> {
    console.log('Updating K-12 observation template:', canonical_key, grade_band, updates);
    
    const { data: result, error } = await database
      .from('observation_template')
      .update(updates)
      .eq('canonical_key', canonical_key)
      .eq('grade_band', grade_band)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating K-12 observation template:', error);
      throw error;
    }
    
    return result;
  }

  async delete(canonical_key: string, grade_band: string): Promise<void> {
    console.log('Deleting K-12 observation template:', canonical_key, grade_band);
    
    const { error } = await database
      .from('observation_template')
      .delete()
      .eq('canonical_key', canonical_key)
      .eq('grade_band', grade_band);
    
    if (error) {
      console.error('Error deleting K-12 observation template:', error);
      throw error;
    }
  }
}

export const k12ObservationTemplateService = new K12ObservationTemplateService();

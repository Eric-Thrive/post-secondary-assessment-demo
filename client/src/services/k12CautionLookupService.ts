// @ts-nocheck

import { apiClient } from '@/lib/apiClient';

export interface K12CautionLookup {
  caution_id: string;
  canonical_key: string;
  grade_band: string;
  caution_text: string;
  framework_tag: string;
  module_type: string;
}

export interface K12CautionLookupInput {
  caution_id: string;
  canonical_key: string;
  grade_band: string;
  caution_text: string;
  framework_tag: string;
  module_type?: string;
}

class K12CautionLookupService {
  async loadAll(moduleType: string = 'k12'): Promise<K12CautionLookup[]> {
    console.log('Loading K-12 caution lookup entries for module:', moduleType);
    
    const { data, error } = await database
      .from('caution_lookup')
      .select('*')
      .eq('module_type', moduleType)
      .order('canonical_key')
      .order('grade_band');
    
    if (error) {
      console.error('Error loading K-12 caution lookup entries:', error);
      throw error;
    }
    
    return data || [];
  }

  async save(input: K12CautionLookupInput, moduleType: string = 'k12'): Promise<K12CautionLookup> {
    console.log('Saving K-12 caution lookup entry:', input);
    
    const saveData = {
      ...input,
      module_type: moduleType
    };
    
    const { data: result, error } = await database
      .from('caution_lookup')
      .upsert(saveData)
      .select()
      .single();
    
    if (error) {
      console.error('Error saving K-12 caution lookup entry:', error);
      throw error;
    }
    
    return result;
  }

  async update(caution_id: string, updates: Partial<K12CautionLookupInput>): Promise<K12CautionLookup> {
    console.log('Updating K-12 caution lookup entry:', caution_id, updates);
    
    const { data: result, error } = await database
      .from('caution_lookup')
      .update(updates)
      .eq('caution_id', caution_id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating K-12 caution lookup entry:', error);
      throw error;
    }
    
    return result;
  }

  async delete(caution_id: string): Promise<void> {
    console.log('Deleting K-12 caution lookup entry:', caution_id);
    
    const { error } = await database
      .from('caution_lookup')
      .delete()
      .eq('caution_id', caution_id);
    
    if (error) {
      console.error('Error deleting K-12 caution lookup entry:', error);
      throw error;
    }
  }
}

export const k12CautionLookupService = new K12CautionLookupService();

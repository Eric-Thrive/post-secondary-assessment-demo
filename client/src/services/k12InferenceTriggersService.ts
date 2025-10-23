// @ts-nocheck

import { apiClient } from '@/lib/apiClient';

export interface K12InferenceTriggers {
  canonical_key: string;
  parent_friendly: string;
  synonym_list?: string;
  notes?: string;
}

export interface K12InferenceTriggersInput {
  canonical_key: string;
  parent_friendly: string;
  synonym_list?: string;
  notes?: string;
}

class K12InferenceTriggersService {
  async loadAll(): Promise<K12InferenceTriggers[]> {
    console.log('Loading K-12 inference triggers');
    
    const { data, error } = await database
      .from('inference_triggers_k12')
      .select('*')
      .order('canonical_key');
    
    if (error) {
      console.error('Error loading K-12 inference triggers:', error);
      throw error;
    }
    
    return data || [];
  }

  async save(input: K12InferenceTriggersInput): Promise<K12InferenceTriggers> {
    console.log('Saving K-12 inference trigger:', input);
    
    const { data: result, error } = await database
      .from('inference_triggers_k12')
      .upsert(input)
      .select()
      .single();
    
    if (error) {
      console.error('Error saving K-12 inference trigger:', error);
      throw error;
    }
    
    return result;
  }

  async update(canonical_key: string, updates: Partial<K12InferenceTriggersInput>): Promise<K12InferenceTriggers> {
    console.log('Updating K-12 inference trigger:', canonical_key, updates);
    
    const { data: result, error } = await database
      .from('inference_triggers_k12')
      .update(updates)
      .eq('canonical_key', canonical_key)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating K-12 inference trigger:', error);
      throw error;
    }
    
    return result;
  }

  async delete(canonical_key: string): Promise<void> {
    console.log('Deleting K-12 inference trigger:', canonical_key);
    
    const { error } = await database
      .from('inference_triggers_k12')
      .delete()
      .eq('canonical_key', canonical_key);
    
    if (error) {
      console.error('Error deleting K-12 inference trigger:', error);
      throw error;
    }
  }
}

export const k12InferenceTriggersService = new K12InferenceTriggersService();

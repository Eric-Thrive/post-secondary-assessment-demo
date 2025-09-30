
import { apiClient } from '@/lib/apiClient';

export interface K12BarrierGlossary {
  canonical_key: string;
  one_sentence_definition: string;
  parent_friendly: string;
}

export interface K12BarrierGlossaryInput {
  canonical_key: string;
  one_sentence_definition: string;
  parent_friendly: string;
}

class K12BarrierGlossaryService {
  async loadAll(moduleType: string = 'k12'): Promise<K12BarrierGlossary[]> {
    console.log('Loading K-12 barrier glossary entries for module:', moduleType);
    
    const { data, error } = await database
      .from('barrier_glossary_k12')
      .select('*')
      .order('canonical_key');
    
    if (error) {
      console.error('Error loading K-12 barrier glossary entries:', error);
      throw error;
    }
    
    return data || [];
  }

  async save(input: K12BarrierGlossaryInput): Promise<K12BarrierGlossary> {
    console.log('Saving K-12 barrier glossary entry:', input);
    
    const { data: result, error } = await database
      .from('barrier_glossary_k12')
      .upsert(input)
      .select()
      .single();
    
    if (error) {
      console.error('Error saving K-12 barrier glossary entry:', error);
      throw error;
    }
    
    return result;
  }

  async update(canonical_key: string, updates: Partial<K12BarrierGlossaryInput>): Promise<K12BarrierGlossary> {
    console.log('Updating K-12 barrier glossary entry:', canonical_key, updates);
    
    const { data: result, error } = await database
      .from('barrier_glossary_k12')
      .update(updates)
      .eq('canonical_key', canonical_key)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating K-12 barrier glossary entry:', error);
      throw error;
    }
    
    return result;
  }

  async delete(canonical_key: string): Promise<void> {
    console.log('Deleting K-12 barrier glossary entry:', canonical_key);
    
    const { error } = await database
      .from('barrier_glossary_k12')
      .delete()
      .eq('canonical_key', canonical_key);
    
    if (error) {
      console.error('Error deleting K-12 barrier glossary entry:', error);
      throw error;
    }
  }
}

export const k12BarrierGlossaryService = new K12BarrierGlossaryService();

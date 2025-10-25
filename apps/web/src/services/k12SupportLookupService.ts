
import { apiClient } from '@/lib/apiClient';

export interface K12SupportLookup {
  id: string;
  canonical_key: string;
  grade_band: string;
  support_id?: string;
  support_type?: string;
  description?: string;
  implementation_note?: string;
  module_type: string;
  created_at: string;
  last_updated: string;
}

export interface K12SupportLookupInput {
  canonical_key: string;
  grade_band: string;
  support_id?: string;
  support_type?: string;
  description?: string;
  implementation_note?: string;
}

class K12SupportLookupService {
  async loadAll(moduleType: string = 'k12'): Promise<K12SupportLookup[]> {
    console.log('Loading K-12 support lookup entries for module:', moduleType);
    
    try {
      const response = await fetch(`/api/support-lookup/${moduleType}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      console.log(`Loaded ${data?.length || 0} K-12 support lookup entries`);
      return data || [];
    } catch (error) {
      console.error('Error loading K-12 support lookup entries:', error);
      throw error;
    }
  }

  async save(input: K12SupportLookupInput, moduleType: string = 'k12'): Promise<K12SupportLookup> {
    console.log('Saving K-12 support lookup entry:', input);
    
    // TODO: Implement API call for K-12 support lookup save
    throw new Error('K-12 support lookup save not implemented - use tutoring module');
  }

  async update(id: string, updates: Partial<K12SupportLookupInput>, moduleType: string = 'k12'): Promise<K12SupportLookup> {
    console.log('Updating K-12 support lookup entry:', id, updates);
    
    // TODO: Implement API call for K-12 support lookup update
    throw new Error('K-12 support lookup update not implemented - use tutoring module');
  }

  async delete(id: string): Promise<void> {
    console.log('Deleting K-12 support lookup entry:', id);
    
    // TODO: Implement API call for K-12 support lookup delete
    throw new Error('K-12 support lookup delete not implemented - use tutoring module');
  }
}

export const k12SupportLookupService = new K12SupportLookupService();

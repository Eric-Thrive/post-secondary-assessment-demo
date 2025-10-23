// @ts-nocheck

import { apiClient } from '@/lib/apiClient';
import { PlainLanguageMapping } from '@/types/promptService';

export class PlainLanguageMappingsService {
  async loadPlainLanguageMappings(moduleType: string = 'post_secondary'): Promise<PlainLanguageMapping[]> {
    try {
      console.log('Loading plain language mappings from API for module:', moduleType);
      
      const data = await apiClient.getPlainLanguageMappings(moduleType);

      console.log('Loaded', data?.length || 0, 'plain language mappings from API for', moduleType);
      return data || [];
      
    } catch (error) {
      console.error('Failed to load plain language mappings:', error);
      throw error;
    }
  }

  async savePlainLanguageMapping(id: string, data: Partial<PlainLanguageMapping>): Promise<PlainLanguageMapping> {
    try {
      console.log('Saving plain language mapping:', id);
      
      const { data: updatedMapping, error } = await database
        .from('plain_language_mappings' as any)
        .update({
          ...data,
          last_updated: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error saving plain language mapping:', error);
        throw error;
      }

      console.log('Successfully saved plain language mapping');
      return updatedMapping as unknown as PlainLanguageMapping;
      
    } catch (error) {
      console.error('Failed to save plain language mapping:', error);
      throw error;
    }
  }

  async deletePlainLanguageMapping(id: string): Promise<void> {
    try {
      console.log('Deleting plain language mapping:', id);
      
      const { error } = await database
        .from('plain_language_mappings' as any)
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting plain language mapping:', error);
        throw error;
      }

      console.log('Successfully deleted plain language mapping');
      
    } catch (error) {
      console.error('Failed to delete plain language mapping:', error);
      throw error;
    }
  }
}

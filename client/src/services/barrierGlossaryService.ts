
import { apiClient } from '@/lib/apiClient';
import { BarrierGlossary } from '@/types/promptService';

export class BarrierGlossaryService {
  async loadBarrierGlossary(moduleType: string = 'post_secondary'): Promise<BarrierGlossary[]> {
    try {
      console.log('Loading barrier glossary from API for module:', moduleType);
      
      const data = await apiClient.getBarrierGlossary(moduleType);

      console.log('Loaded', data?.length || 0, 'barrier glossary entries from API for', moduleType);
      return data || [];
      
    } catch (error) {
      console.error('Failed to load barrier glossary:', error);
      throw error;
    }
  }

  async saveBarrierGlossary(id: string, data: Partial<BarrierGlossary>): Promise<BarrierGlossary> {
    try {
      console.log('Saving barrier glossary entry:', id);
      
      const { data: updatedGlossary, error } = await database
        .from('barrier_glossary' as any)
        .update({
          ...data,
          last_updated: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error saving barrier glossary:', error);
        throw error;
      }

      console.log('Successfully saved barrier glossary entry');
      return updatedGlossary as unknown as BarrierGlossary;
      
    } catch (error) {
      console.error('Failed to save barrier glossary:', error);
      throw error;
    }
  }

  async deleteBarrierGlossary(id: string): Promise<void> {
    try {
      console.log('Deleting barrier glossary entry:', id);
      
      const { error } = await database
        .from('barrier_glossary' as any)
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting barrier glossary:', error);
        throw error;
      }

      console.log('Successfully deleted barrier glossary entry');
      
    } catch (error) {
      console.error('Failed to delete barrier glossary:', error);
      throw error;
    }
  }
}

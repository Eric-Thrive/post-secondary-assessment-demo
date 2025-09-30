
import { apiClient } from '@/lib/apiClient';
import { InferenceTrigger } from '@/types/promptService';

export class InferenceTriggersService {
  async loadInferenceTriggers(moduleType: string = 'post_secondary'): Promise<InferenceTrigger[]> {
    try {
      console.log('Loading inference triggers from API for module:', moduleType);
      
      const data = await apiClient.getInferenceTriggers(moduleType);

      console.log('Loaded', data?.length || 0, 'inference triggers from API for', moduleType);
      return data || [];
      
    } catch (error) {
      console.error('Failed to load inference triggers:', error);
      throw error;
    }
  }

  async saveInferenceTrigger(id: string, data: Partial<InferenceTrigger>): Promise<InferenceTrigger> {
    try {
      console.log('Saving inference trigger:', id);
      
      const { data: updatedTrigger, error } = await database
        .from('inference_triggers' as any)
        .update({
          ...data,
          last_updated: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error saving inference trigger:', error);
        throw error;
      }

      console.log('Successfully saved inference trigger');
      return updatedTrigger as unknown as InferenceTrigger;
      
    } catch (error) {
      console.error('Failed to save inference trigger:', error);
      throw error;
    }
  }

  async deleteInferenceTrigger(id: string): Promise<void> {
    try {
      console.log('Deleting inference trigger:', id);
      
      const { error } = await database
        .from('inference_triggers' as any)
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting inference trigger:', error);
        throw error;
      }

      console.log('Successfully deleted inference trigger');
      
    } catch (error) {
      console.error('Failed to delete inference trigger:', error);
      throw error;
    }
  }
}

import { apiClient } from '@/lib/apiClient';

export interface PostSecondaryItemMaster {
  id: string;
  canonical_key: string | null;
  surface_term: string | null;
  mapping_method: string | null;
  qc_flag: string | null;
  evidence_basis: string | null;
  barrier_definition: string | null;
  barrier_examples: string | null;
  plain_language_explanation: string | null;
  accommodation_text: string | null;
  accommodation_category: string | null;
  similarity_score: number | null;
  module_type: string;
  created_at: string;
  last_updated: string;
}

class PostSecondaryItemMasterService {
  async loadAll(moduleType: string = 'post_secondary'): Promise<PostSecondaryItemMaster[]> {
    try {
      console.log('Loading post-secondary item master data for module:', moduleType);
      
      const { data, error } = await database
        .from('post_secondary_item_master')
        .select('*')
        .eq('module_type', moduleType)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading post-secondary item master data:', error);
        return [];
      }

      console.log(`Loaded ${data?.length || 0} post-secondary item master records`);
      return data || [];
    } catch (error) {
      console.error('Failed to load post-secondary item master data:', error);
      return [];
    }
  }
}

export const postSecondaryItemMasterService = new PostSecondaryItemMasterService();
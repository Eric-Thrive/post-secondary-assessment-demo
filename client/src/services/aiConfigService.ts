import { apiClient } from '@/lib/apiClient';

export interface AIConfig {
  id: string;
  model_name: string;
  temperature: number;
  max_tokens: number;
  api_provider: string;
  created_at: string;
  last_updated: string;
}

export class AIConfigService {
  async loadAiConfig(): Promise<AIConfig | null> {
    try {
      console.log('Loading AI config from API...');
      
      const data = await apiClient.getAiConfig();
      
      console.log('Loaded AI config from API:', data);
      return data || null;
      
    } catch (error) {
      console.error('Failed to load AI config:', error);
      throw error;
    }
  }

  async saveAiConfig(config: Partial<AIConfig>): Promise<AIConfig> {
    try {
      console.log('Saving AI config:', config);
      
      const data = await apiClient.updateAiConfig(config);
      
      console.log('Successfully saved AI config');
      return data;
      
    } catch (error) {
      console.error('Failed to save AI config:', error);
      throw error;
    }
  }
}

export const aiConfigService = new AIConfigService();
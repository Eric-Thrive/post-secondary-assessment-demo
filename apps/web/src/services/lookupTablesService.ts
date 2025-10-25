// @ts-nocheck

import { apiClient } from '@/lib/apiClient';
import { LookupTable, MappingConfiguration } from '@/types/promptService';

export class LookupTablesService {
  async loadLookupTables(moduleType: string = 'post_secondary'): Promise<LookupTable[]> {
    try {
      console.log('Loading lookup tables from API for module:', moduleType);
      
      const data = await apiClient.getLookupTables(moduleType);

      console.log('Loaded', data?.length || 0, 'lookup tables from API for', moduleType);
      return data || [];
      
    } catch (error) {
      console.error('Failed to load lookup tables:', error);
      throw error;
    }
  }

  async saveLookupTable(tableKey: string, content: any, moduleType: string = 'post_secondary'): Promise<LookupTable> {
    try {
      console.log('Saving lookup table:', tableKey, 'for module:', moduleType);
      
      const { data, error } = await database
        .from('lookup_tables' as any)
        .update({
          content,
          last_updated: new Date().toISOString()
        })
        .eq('table_key', tableKey)
        .eq('module_type', moduleType)
        .select()
        .single();

      if (error) {
        console.error('Error saving lookup table:', error);
        throw error;
      }

      console.log('Successfully saved lookup table');
      return data as unknown as LookupTable;
      
    } catch (error) {
      console.error('Failed to save lookup table:', error);
      throw error;
    }
  }

  async loadMappingConfigurations(moduleType: string = 'post_secondary'): Promise<MappingConfiguration[]> {
    try {
      console.log('Loading mapping configurations from API for module:', moduleType);
      
      const data = await apiClient.getMappingConfigurations(moduleType);

      console.log('Loaded', data?.length || 0, 'mapping configurations from API for', moduleType);
      return data || [];
      
    } catch (error) {
      console.error('Failed to load mapping configurations:', error);
      throw error;
    }
  }

  async saveMappingConfiguration(mappingKey: string, mappingRules: any, moduleType: string = 'post_secondary'): Promise<MappingConfiguration> {
    try {
      console.log('Saving mapping configuration:', mappingKey, 'for module:', moduleType);
      
      const { data, error } = await database
        .from('mapping_configurations' as any)
        .update({
          mapping_rules: mappingRules,
          last_updated: new Date().toISOString()
        })
        .eq('mapping_key', mappingKey)
        .eq('module_type', moduleType)
        .select()
        .single();

      if (error) {
        console.error('Error saving mapping configuration:', error);
        throw error;
      }

      console.log('Successfully saved mapping configuration');
      return data as unknown as MappingConfiguration;
      
    } catch (error) {
      console.error('Failed to save mapping configuration:', error);
      throw error;
    }
  }
}

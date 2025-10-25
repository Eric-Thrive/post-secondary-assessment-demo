
import { PromptSectionsService } from './promptSectionsService';
import { LookupTablesService } from './lookupTablesService';
import { BarrierGlossaryService } from './barrierGlossaryService';
import { InferenceTriggersService } from './inferenceTriggersService';
import { PlainLanguageMappingsService } from './plainLanguageMappingsService';
import { PromptValidationService } from './promptValidationService';
import { PromptRestoreService } from './promptRestoreService';
import { aiConfigService } from './aiConfigService';

// Import K-12 services
import { k12BarrierGlossaryService } from './k12BarrierGlossaryService';
import { k12InferenceTriggersService } from './k12InferenceTriggersService';
import { k12ItemMasterService } from './k12ItemMasterService';
import { k12SupportLookupService } from './k12SupportLookupService';
import { k12CautionLookupService } from './k12CautionLookupService';
import { k12ObservationTemplateService } from './k12ObservationTemplateService';

// Re-export types for backward compatibility
export type {
  PromptSection,
  LookupTable,
  AIConfig,
  MappingConfiguration,
  BarrierGlossary,
  InferenceTrigger,
  PlainLanguageMapping
} from '@/types/promptService';

export class PromptService {
  private promptSectionsService = new PromptSectionsService();
  private lookupTablesService = new LookupTablesService();
  private barrierGlossaryService = new BarrierGlossaryService();
  private inferenceTriggersService = new InferenceTriggersService();
  private plainLanguageMappingsService = new PlainLanguageMappingsService();
  private promptValidationService = new PromptValidationService();
  private promptRestoreService = new PromptRestoreService();

  // Delegate to prompt sections service with module support
  async loadPromptSections(moduleType: string = 'post_secondary') {
    try {
      console.log('PromptService: Loading prompt sections for module:', moduleType);
      const result = await this.promptSectionsService.loadPromptSections(moduleType);
      console.log('PromptService: Prompt sections loaded successfully:', result?.length || 0);
      return result;
    } catch (error) {
      console.error('PromptService: Failed to load prompt sections:', error);
      throw error;
    }
  }

  async savePromptSection(sectionKey: string, content: string, executionOrder?: number, isSystemPrompt?: boolean, moduleType: string = 'post_secondary') {
    return this.promptSectionsService.savePromptSection(sectionKey, content, executionOrder, isSystemPrompt, moduleType);
  }

  async updatePromptOrder(sectionKey: string, newOrder: number, moduleType: string = 'post_secondary') {
    return this.promptSectionsService.updatePromptOrder(sectionKey, newOrder, moduleType);
  }

  async getExecutionFlow(moduleType: string = 'post_secondary') {
    return this.promptSectionsService.getExecutionFlow(moduleType);
  }

  async previewCombinedPrompt(moduleType: string = 'post_secondary') {
    return this.promptSectionsService.previewCombinedPrompt(moduleType);
  }

  // Delegate to lookup tables service with module support
  async loadLookupTables(moduleType: string = 'post_secondary') {
    try {
      console.log('PromptService: Loading lookup tables for module:', moduleType);
      const result = await this.lookupTablesService.loadLookupTables(moduleType);
      console.log('PromptService: Lookup tables loaded successfully:', result?.length || 0);
      return result;
    } catch (error) {
      console.error('PromptService: Failed to load lookup tables:', error);
      throw error;
    }
  }

  async saveLookupTable(tableKey: string, content: any, moduleType: string = 'post_secondary') {
    return this.lookupTablesService.saveLookupTable(tableKey, content, moduleType);
  }

  async loadMappingConfigurations(moduleType: string = 'post_secondary') {
    return this.lookupTablesService.loadMappingConfigurations(moduleType);
  }

  async saveMappingConfiguration(mappingKey: string, mappingRules: any, moduleType: string = 'post_secondary') {
    return this.lookupTablesService.saveMappingConfiguration(mappingKey, mappingRules, moduleType);
  }

  // Barrier glossary methods with K-12 routing
  async loadBarrierGlossary(moduleType: string = 'post_secondary') {
    try {
      console.log('PromptService: Loading barrier glossary for module:', moduleType);
      
      if (moduleType === 'k12') {
        const result = await k12BarrierGlossaryService.loadAll(moduleType);
        console.log('PromptService: K-12 barrier glossary loaded successfully:', result?.length || 0);
        return result;
      } else {
        const result = await this.barrierGlossaryService.loadBarrierGlossary(moduleType);
        console.log('PromptService: Post-Secondary barrier glossary loaded successfully:', result?.length || 0);
        return result;
      }
    } catch (error) {
      console.error('PromptService: Failed to load barrier glossary:', error);
      throw error;
    }
  }

  async saveBarrierGlossary(id: string, data: any, moduleType: string = 'post_secondary') {
    if (moduleType === 'k12') {
      return k12BarrierGlossaryService.update(id, data);
    } else {
      return this.barrierGlossaryService.saveBarrierGlossary(id, data);
    }
  }

  async deleteBarrierGlossary(id: string, moduleType: string = 'post_secondary') {
    if (moduleType === 'k12') {
      return k12BarrierGlossaryService.delete(id);
    } else {
      return this.barrierGlossaryService.deleteBarrierGlossary(id);
    }
  }

  // Inference triggers methods with K-12 routing
  async loadInferenceTriggers(moduleType: string = 'post_secondary') {
    try {
      console.log('PromptService: Loading inference triggers for module:', moduleType);
      
      if (moduleType === 'k12') {
        const result = await k12InferenceTriggersService.loadAll();
        console.log('PromptService: K-12 inference triggers loaded successfully:', result?.length || 0);
        return result;
      } else {
        const result = await this.inferenceTriggersService.loadInferenceTriggers(moduleType);
        console.log('PromptService: Post-Secondary inference triggers loaded successfully:', result?.length || 0);
        return result;
      }
    } catch (error) {
      console.error('PromptService: Failed to load inference triggers:', error);
      throw error;
    }
  }

  async saveInferenceTrigger(id: string, data: any, moduleType: string = 'post_secondary') {
    if (moduleType === 'k12') {
      return k12InferenceTriggersService.update(id, data);
    } else {
      return this.inferenceTriggersService.saveInferenceTrigger(id, data);
    }
  }

  async deleteInferenceTrigger(id: string, moduleType: string = 'post_secondary') {
    if (moduleType === 'k12') {
      return k12InferenceTriggersService.delete(id);
    } else {
      return this.inferenceTriggersService.deleteInferenceTrigger(id);
    }
  }

  // Delegate to plain language mappings service with module support
  async loadPlainLanguageMappings(moduleType: string = 'post_secondary') {
    try {
      console.log('PromptService: Loading plain language mappings for module:', moduleType);
      const result = await this.plainLanguageMappingsService.loadPlainLanguageMappings(moduleType);
      console.log('PromptService: Plain language mappings loaded successfully:', result?.length || 0);
      return result;
    } catch (error) {
      console.error('PromptService: Failed to load plain language mappings:', error);
      throw error;
    }
  }

  async savePlainLanguageMapping(id: string, data: any, moduleType: string = 'post_secondary') {
    return this.plainLanguageMappingsService.savePlainLanguageMapping(id, data);
  }

  async deletePlainLanguageMapping(id: string, moduleType: string = 'post_secondary') {
    return this.plainLanguageMappingsService.deletePlainLanguageMapping(id);
  }

  // K-12 specific methods for K-12-only tables
  async loadItemMaster(moduleType: string = 'k12') {
    try {
      console.log('PromptService: Loading item master for module:', moduleType);
      const result = await k12ItemMasterService.loadAll(moduleType);
      console.log('PromptService: Item master loaded successfully:', result?.length || 0);
      return result;
    } catch (error) {
      console.error('PromptService: Failed to load item master:', error);
      throw error;
    }
  }

  async saveItemMaster(id: string, data: any, moduleType: string = 'k12') {
    return k12ItemMasterService.update(id, data);
  }

  async deleteItemMaster(id: string, moduleType: string = 'k12') {
    return k12ItemMasterService.delete(id);
  }

  async loadSupportLookup(moduleType: string = 'k12') {
    try {
      console.log('PromptService: Loading support lookup for module:', moduleType);
      const result = await k12SupportLookupService.loadAll(moduleType);
      console.log('PromptService: Support lookup loaded successfully:', result?.length || 0);
      return result;
    } catch (error) {
      console.error('PromptService: Failed to load support lookup:', error);
      throw error;
    }
  }

  async saveSupportLookup(id: string, data: any, moduleType: string = 'k12') {
    return k12SupportLookupService.update(id, data);
  }

  async deleteSupportLookup(id: string, moduleType: string = 'k12') {
    return k12SupportLookupService.delete(id);
  }

  async loadCautionLookup(moduleType: string = 'k12') {
    try {
      console.log('PromptService: Loading caution lookup for module:', moduleType);
      const result = await k12CautionLookupService.loadAll();
      console.log('PromptService: Caution lookup loaded successfully:', result?.length || 0);
      return result;
    } catch (error) {
      console.error('PromptService: Failed to load caution lookup:', error);
      throw error;
    }
  }

  async saveCautionLookup(id: string, data: any, moduleType: string = 'k12') {
    return k12CautionLookupService.update(id, data);
  }

  async deleteCautionLookup(id: string, moduleType: string = 'k12') {
    return k12CautionLookupService.delete(id);
  }

  async loadObservationTemplate(moduleType: string = 'k12') {
    try {
      console.log('PromptService: Loading observation template for module:', moduleType);
      const result = await k12ObservationTemplateService.loadAll(moduleType);
      console.log('PromptService: Observation template loaded successfully:', result?.length || 0);
      return result;
    } catch (error) {
      console.error('PromptService: Failed to load observation template:', error);
      throw error;
    }
  }

  async saveObservationTemplate(canonical_key: string, grade_band: string, data: any, moduleType: string = 'k12') {
    return k12ObservationTemplateService.update(canonical_key, grade_band, data);
  }

  async deleteObservationTemplate(canonical_key: string, grade_band: string, moduleType: string = 'k12') {
    return k12ObservationTemplateService.delete(canonical_key, grade_band);
  }

  // AI config methods with module support
  async loadAIConfig(moduleType: string = 'post_secondary') {
    try {
      console.log('PromptService: Loading AI config for module:', moduleType);
      const result = await aiConfigService.loadAiConfig();
      console.log('PromptService: AI config loaded successfully:', !!result);
      return result;
    } catch (error) {
      console.error('PromptService: Failed to load AI config:', error);
      throw error;
    }
  }

  async saveAIConfig(config: any, moduleType: string = 'post_secondary') {
    return aiConfigService.saveAiConfig(config);
  }

  // Delegate to validation service - updated signature to accept optional moduleType
  async testPrompts(moduleType: string = 'post_secondary'): Promise<{ success: boolean; message: string }> {
    return this.promptValidationService.testPrompts(moduleType);
  }

  // Delegate to restore service - updated signature to accept optional moduleType
  async restoreOriginalPrompts(moduleType: string = 'post_secondary'): Promise<{ success: boolean; message: string }> {
    return this.promptRestoreService.restoreOriginalPrompts(moduleType);
  }
}

export const promptService = new PromptService();

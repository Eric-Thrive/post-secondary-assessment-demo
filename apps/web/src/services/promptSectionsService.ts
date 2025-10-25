
import { PromptSection } from '@/types/promptService';
import { BaseSectionsService } from './prompt/baseSectionsService';
import { SystemInstructionsService } from './prompt/systemInstructionsService';
import { TemplateService } from './prompt/templateService';
import { FlowService } from './prompt/flowService';

export class PromptSectionsService {
  private baseSectionsService = new BaseSectionsService();
  private systemInstructionsService = new SystemInstructionsService();
  private templateService = new TemplateService();
  private flowService = new FlowService();

  // Delegate to base sections service with module support
  async loadPromptSections(moduleType: string = 'post_secondary'): Promise<PromptSection[]> {
    return this.baseSectionsService.loadPromptSections(moduleType);
  }

  async savePromptSection(sectionKey: string, content: string, executionOrder?: number, isSystemPrompt?: boolean, moduleType: string = 'post_secondary'): Promise<PromptSection> {
    return this.baseSectionsService.savePromptSection(sectionKey, content, executionOrder, isSystemPrompt, moduleType);
  }

  async updatePromptOrder(sectionKey: string, newOrder: number, moduleType: string = 'post_secondary'): Promise<void> {
    return this.baseSectionsService.updatePromptOrder(sectionKey, newOrder, moduleType);
  }

  // Delegate to system instructions service
  async updateSystemInstructions(moduleType: string = 'post_secondary'): Promise<PromptSection> {
    return this.systemInstructionsService.updateSystemInstructions(moduleType);
  }

  // Delegate to template service
  async updateMarkdownTemplate(moduleType: string = 'post_secondary'): Promise<PromptSection> {
    return this.templateService.updateMarkdownTemplate(moduleType);
  }

  async updateTemplateWithQCSection(moduleType: string = 'post_secondary'): Promise<PromptSection> {
    return this.templateService.updateTemplateWithQCSection(moduleType);
  }

  // Delegate to flow service
  async getExecutionFlow(moduleType: string = 'post_secondary'): Promise<{ systemPrompts: PromptSection[]; instructionPrompts: PromptSection[] }> {
    return this.flowService.getExecutionFlow(moduleType);
  }

  async previewCombinedPrompt(moduleType: string = 'post_secondary'): Promise<string> {
    return this.flowService.previewCombinedPrompt(moduleType);
  }
}

import { K12ItemMaster, k12ItemMasterService } from '@/services/k12ItemMasterService';
import { PostSecondaryItemMaster, postSecondaryItemMasterService } from '@/services/postSecondaryItemMasterService';
import { AssessmentCase } from '@/types/assessmentCase';

export interface ExportMetadata {
  exportTimestamp: string;
  exportFormat: 'csv' | 'json' | 'markdown';
  caseId: string;
  caseName: string;
  moduleType: string;
  totalItems: number;
  gradeBandBreakdown?: Record<string, number>;
  qcStatusBreakdown: Record<string, number>;
  accommodationCategoryBreakdown?: Record<string, number>;
  dataSource: 'stored_case_data' | 'live_table_fallback' | 'no_data';
}

type UniversalItemMaster = K12ItemMaster | PostSecondaryItemMaster;

class UniversalItemMasterExportService {
  async getItemsForCase(currentCase: AssessmentCase): Promise<UniversalItemMaster[]> {
    console.log('Getting item master data for case:', currentCase.id, 'Module:', currentCase.module_type);
    
    // First, try to get data from stored case analysis result (check multiple possible locations)
    let storedItems = null;
    if (currentCase.analysis_result) {
      storedItems = (currentCase.analysis_result as any).item_master_data || (currentCase.analysis_result as any).itemMasterData;
    }
    if (!storedItems && currentCase.report_data) {
      storedItems = (currentCase.report_data as any).item_master_data || (currentCase.report_data as any).itemMasterData;
    }
    
    if (storedItems && storedItems.length > 0) {
      console.log(`✅ Using stored item master data: ${storedItems.length} items`);
      return storedItems;
    }
    
    // Try case-specific API endpoint
    console.log('⚠️ No stored item master data found, trying case-specific API endpoint');
    try {
      const response = await fetch(`/api/case-item-master/${currentCase.id}/${currentCase.module_type}`);
      if (response.ok) {
        const caseSpecificItems = await response.json();
        if (caseSpecificItems.length > 0) {
          console.log(`✅ Found ${caseSpecificItems.length} case-specific items from API`);
          return caseSpecificItems;
        }
      }
    } catch (error) {
      console.error('Failed to fetch case-specific item master data:', error);
    }
    
    // Fallback to live table query based on module type
    console.log('⚠️ No case-specific data found, falling back to live table query');
    
    if (currentCase.module_type === 'k12') {
      const items = await k12ItemMasterService.loadAll(currentCase.module_type);
      return this.filterByAnalysisDate(items, currentCase);
    } else {
      const items = await postSecondaryItemMasterService.loadAll(currentCase.module_type);
      return this.filterByAnalysisDate(items, currentCase);
    }
  }

  private filterByAnalysisDate(items: UniversalItemMaster[], currentCase: AssessmentCase): UniversalItemMaster[] {
    if (currentCase.analysis_result?.analysis_date) {
      const analysisDate = new Date(currentCase.analysis_result.analysis_date);
      const startDate = new Date(analysisDate.getTime() - 24 * 60 * 60 * 1000);
      const endDate = new Date(analysisDate.getTime() + 24 * 60 * 60 * 1000);
      
      const filteredItems = items.filter(item => {
        const itemDate = new Date(item.created_at);
        return itemDate >= startDate && itemDate <= endDate;
      });
      
      console.log(`📊 Live table fallback: ${filteredItems.length} items found (filtered from ${items.length} total)`);
      return filteredItems;
    }
    
    console.log(`📊 Live table fallback: ${items.length} items found (no date filtering)`);
    return items;
  }

  generateMetadata(items: UniversalItemMaster[], currentCase: AssessmentCase, format: 'csv' | 'json' | 'markdown'): ExportMetadata {
    const qcStatusBreakdown: Record<string, number> = {};
    const gradeBandBreakdown: Record<string, number> = {};
    const accommodationCategoryBreakdown: Record<string, number> = {};
    
    items.forEach(item => {
      // QC status breakdown (common to both types)
      const qcStatus = item.qc_flag || 'unset';
      qcStatusBreakdown[qcStatus] = (qcStatusBreakdown[qcStatus] || 0) + 1;
      
      // K12-specific breakdowns
      if (currentCase.module_type === 'k12' && 'grade_band' in item) {
        const gradeBand = item.grade_band || 'unknown';
        gradeBandBreakdown[gradeBand] = (gradeBandBreakdown[gradeBand] || 0) + 1;
      }
      
      // Post-secondary specific breakdowns
      if (currentCase.module_type === 'post_secondary' && 'accommodation_category' in item) {
        const category = item.accommodation_category || 'unknown';
        accommodationCategoryBreakdown[category] = (accommodationCategoryBreakdown[category] || 0) + 1;
      }
    });

    // Determine data source
    let dataSource: 'stored_case_data' | 'live_table_fallback' | 'no_data' = 'no_data';
    if (items.length > 0) {
      if (currentCase.analysis_result && (currentCase.analysis_result as any).item_master_data) {
        dataSource = 'stored_case_data';
      } else {
        dataSource = 'live_table_fallback';
      }
    }

    const metadata: ExportMetadata = {
      exportTimestamp: new Date().toISOString(),
      exportFormat: format,
      caseId: currentCase.id,
      caseName: currentCase.display_name,
      moduleType: currentCase.module_type,
      totalItems: items.length,
      qcStatusBreakdown,
      dataSource
    };

    // Add module-specific breakdowns
    if (currentCase.module_type === 'k12') {
      metadata.gradeBandBreakdown = gradeBandBreakdown;
    } else {
      metadata.accommodationCategoryBreakdown = accommodationCategoryBreakdown;
    }

    return metadata;
  }

  formatAsCSV(items: UniversalItemMaster[], metadata: ExportMetadata): string {
    console.log(`Formatting ${items.length} items as CSV for ${metadata.moduleType} module`);
    
    let headers: string[];
    if (metadata.moduleType === 'k12') {
      headers = [
        'id', 'canonical_key', 'teacher_label', 'parent_friendly_label', 'evidence_basis',
        'mapping_method', 'grade_band', 'qc_flag', 'classroom_observation', 'support_1',
        'support_2', 'caution_note', 'source_table', 'source_id', 'created_at', 'last_updated'
      ];
    } else {
      headers = [
        'id', 'canonical_key', 'surface_term', 'mapping_method', 'qc_flag', 'evidence_basis',
        'barrier_definition', 'barrier_examples', 'plain_language_explanation',
        'accommodation_text', 'accommodation_category', 'similarity_score', 'created_at', 'last_updated'
      ];
    }

    const csvContent = [
      `# Analysis Data Export - ${metadata.caseName}`,
      `# Generated: ${metadata.exportTimestamp}`,
      `# Case ID: ${metadata.caseId}`,
      `# Module Type: ${metadata.moduleType}`,
      `# Total Items: ${metadata.totalItems}`,
      `# Data Source: ${metadata.dataSource}`,
      '#',
      headers.join(','),
      ...items.map(item => this.formatItemAsCSVRow(item, metadata.moduleType, headers))
    ].join('\n');

    return csvContent;
  }

  private formatItemAsCSVRow(item: UniversalItemMaster, moduleType: string, headers: string[]): string {
    const escapeCSV = (value: any) => `"${(value || '').toString().replace(/"/g, '""')}"`;
    
    if (moduleType === 'k12') {
      const k12Item = item as K12ItemMaster;
      return [
        k12Item.id,
        escapeCSV(k12Item.canonical_key),
        escapeCSV(k12Item.teacher_label),
        escapeCSV(k12Item.parent_friendly_label),
        escapeCSV(k12Item.evidence_basis),
        escapeCSV(k12Item.mapping_method),
        escapeCSV(k12Item.grade_band),
        escapeCSV(k12Item.qc_flag),
        escapeCSV(k12Item.classroom_observation),
        escapeCSV(k12Item.support_1),
        escapeCSV(k12Item.support_2),
        escapeCSV(k12Item.caution_note),
        escapeCSV(k12Item.source_table),
        escapeCSV(k12Item.source_id),
        k12Item.created_at,
        k12Item.last_updated
      ].join(',');
    } else {
      const psItem = item as PostSecondaryItemMaster;
      return [
        psItem.id,
        escapeCSV(psItem.canonical_key),
        escapeCSV(psItem.surface_term),
        escapeCSV(psItem.mapping_method),
        escapeCSV(psItem.qc_flag),
        escapeCSV(psItem.evidence_basis),
        escapeCSV(psItem.barrier_definition),
        escapeCSV(psItem.barrier_examples),
        escapeCSV(psItem.plain_language_explanation),
        escapeCSV(psItem.accommodation_text),
        escapeCSV(psItem.accommodation_category),
        psItem.similarity_score || '',
        psItem.created_at,
        psItem.last_updated
      ].join(',');
    }
  }

  formatAsJSON(items: UniversalItemMaster[], metadata: ExportMetadata): string {
    console.log(`Formatting ${items.length} items as JSON for ${metadata.moduleType} module`);
    
    const exportData = {
      metadata,
      summary: {
        totalItems: metadata.totalItems,
        ...(metadata.gradeBandBreakdown && { gradeBandBreakdown: metadata.gradeBandBreakdown }),
        ...(metadata.accommodationCategoryBreakdown && { accommodationCategoryBreakdown: metadata.accommodationCategoryBreakdown }),
        qcStatusBreakdown: metadata.qcStatusBreakdown,
        dataSource: metadata.dataSource
      },
      items
    };

    return JSON.stringify(exportData, null, 2);
  }

  formatAsMarkdown(items: UniversalItemMaster[], metadata: ExportMetadata): string {
    console.log(`Formatting ${items.length} items as Markdown for ${metadata.moduleType} module`);
    
    let markdown = `# Analysis Data Export - ${metadata.caseName}\n\n`;
    markdown += `**Generated:** ${new Date(metadata.exportTimestamp).toLocaleString()}\n`;
    markdown += `**Case ID:** ${metadata.caseId}\n`;
    markdown += `**Module Type:** ${metadata.moduleType}\n`;
    markdown += `**Total Items:** ${metadata.totalItems}\n`;
    markdown += `**Data Source:** ${metadata.dataSource}\n\n`;

    // Add data source explanation
    if (metadata.dataSource === 'stored_case_data') {
      markdown += `> ✅ **Reliable Data**: This export uses data captured and stored with the original analysis.\n\n`;
    } else if (metadata.dataSource === 'live_table_fallback') {
      markdown += `> ⚠️ **Fallback Data**: This export uses live table data (older case without stored data).\n\n`;
    } else {
      markdown += `> ❌ **No Data**: No analysis data available for this case.\n\n`;
    }

    // Summary statistics
    markdown += `## Summary Statistics\n\n`;
    
    if (metadata.moduleType === 'k12' && metadata.gradeBandBreakdown) {
      markdown += `### By Grade Band\n`;
      Object.entries(metadata.gradeBandBreakdown).forEach(([gradeBand, count]) => {
        markdown += `- **${gradeBand}:** ${count} items\n`;
      });
      markdown += '\n';
    }

    if (metadata.moduleType === 'post_secondary' && metadata.accommodationCategoryBreakdown) {
      markdown += `### By Accommodation Category\n`;
      Object.entries(metadata.accommodationCategoryBreakdown).forEach(([category, count]) => {
        markdown += `- **${category}:** ${count} items\n`;
      });
      markdown += '\n';
    }

    markdown += `### By QC Status\n`;
    Object.entries(metadata.qcStatusBreakdown).forEach(([status, count]) => {
      markdown += `- **${status}:** ${count} items\n`;
    });

    // Items details
    if (items.length > 0) {
      markdown += `\n## Recorded Items\n\n`;
      items.forEach((item, index) => {
        if (metadata.moduleType === 'k12') {
          markdown += this.formatK12ItemMarkdown(item as K12ItemMaster, index + 1);
        } else {
          markdown += this.formatPostSecondaryItemMarkdown(item as PostSecondaryItemMaster, index + 1);
        }
      });
    } else {
      markdown += `\n## No Items Found\n\nNo analysis data was captured for this case.\n`;
    }

    return markdown;
  }

  private formatK12ItemMarkdown(item: K12ItemMaster, index: number): string {
    let markdown = `### ${index}. ${item.teacher_label}\n\n`;
    markdown += `- **Canonical Key:** ${item.canonical_key}\n`;
    markdown += `- **Parent-Friendly Label:** ${item.parent_friendly_label || 'N/A'}\n`;
    markdown += `- **Grade Band:** ${item.grade_band || 'N/A'}\n`;
    markdown += `- **Mapping Method:** ${item.mapping_method || 'N/A'}\n`;
    markdown += `- **QC Flag:** ${item.qc_flag || 'N/A'}\n`;
    markdown += `- **Evidence Basis:** ${item.evidence_basis || 'N/A'}\n`;
    
    if (item.classroom_observation) {
      markdown += `- **Classroom Observation:** ${item.classroom_observation}\n`;
    }
    if (item.support_1) {
      markdown += `- **Support 1:** ${item.support_1}\n`;
    }
    if (item.support_2) {
      markdown += `- **Support 2:** ${item.support_2}\n`;
    }
    if (item.caution_note) {
      markdown += `- **Caution Note:** ${item.caution_note}\n`;
    }
    
    markdown += `- **Created:** ${new Date(item.created_at).toLocaleString()}\n`;
    markdown += `- **Last Updated:** ${new Date(item.last_updated).toLocaleString()}\n\n`;
    
    return markdown;
  }

  private formatPostSecondaryItemMarkdown(item: PostSecondaryItemMaster, index: number): string {
    let markdown = `### ${index}. ${item.surface_term || item.canonical_key}\n\n`;
    markdown += `- **Canonical Key:** ${item.canonical_key || 'N/A'}\n`;
    markdown += `- **Surface Term:** ${item.surface_term || 'N/A'}\n`;
    markdown += `- **Mapping Method:** ${item.mapping_method || 'N/A'}\n`;
    markdown += `- **QC Flag:** ${item.qc_flag || 'N/A'}\n`;
    markdown += `- **Evidence Basis:** ${item.evidence_basis || 'N/A'}\n`;
    
    if (item.barrier_definition) {
      markdown += `- **Barrier Definition:** ${item.barrier_definition}\n`;
    }
    if (item.barrier_examples) {
      markdown += `- **Barrier Examples:** ${item.barrier_examples}\n`;
    }
    if (item.plain_language_explanation) {
      markdown += `- **Plain Language Explanation:** ${item.plain_language_explanation}\n`;
    }
    if (item.accommodation_text) {
      markdown += `- **Accommodation Text:** ${item.accommodation_text}\n`;
    }
    if (item.accommodation_category) {
      markdown += `- **Accommodation Category:** ${item.accommodation_category}\n`;
    }
    if (item.similarity_score !== null) {
      markdown += `- **Similarity Score:** ${item.similarity_score}\n`;
    }
    
    markdown += `- **Created:** ${new Date(item.created_at).toLocaleString()}\n`;
    markdown += `- **Last Updated:** ${new Date(item.last_updated).toLocaleString()}\n\n`;
    
    return markdown;
  }

  async exportItems(currentCase: AssessmentCase, format: 'csv' | 'json' | 'markdown'): Promise<string> {
    console.log('Exporting item master data for case:', currentCase.id, 'Module:', currentCase.module_type, 'Format:', format);
    
    const items = await this.getItemsForCase(currentCase);
    const metadata = this.generateMetadata(items, currentCase, format);
    
    console.log('Export metadata:', {
      totalItems: metadata.totalItems,
      dataSource: metadata.dataSource,
      moduleType: metadata.moduleType
    });
    
    switch (format) {
      case 'csv':
        return this.formatAsCSV(items, metadata);
      case 'json':
        return this.formatAsJSON(items, metadata);
      case 'markdown':
        return this.formatAsMarkdown(items, metadata);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }
}

export const universalItemMasterExportService = new UniversalItemMasterExportService();
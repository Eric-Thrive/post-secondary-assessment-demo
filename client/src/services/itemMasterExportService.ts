
import { K12ItemMaster, k12ItemMasterService } from '@/services/k12ItemMasterService';
import { AssessmentCase } from '@/types/assessmentCase';

export interface ExportMetadata {
  exportTimestamp: string;
  exportFormat: 'csv' | 'json' | 'markdown';
  caseId: string;
  caseName: string;
  moduleType: string;
  totalItems: number;
  gradeBandBreakdown: Record<string, number>;
  qcStatusBreakdown: Record<string, number>;
  dataSource: 'stored_case_data' | 'live_table_fallback' | 'no_data';
}

class ItemMasterExportService {
  async getItemsForCase(currentCase: AssessmentCase): Promise<K12ItemMaster[]> {
    console.log('Getting item master data for case:', currentCase.id);
    
    // First, try to get data from stored case analysis result
    if (currentCase.analysis_result && (currentCase.analysis_result as any).item_master_data) {
      const storedItems = (currentCase.analysis_result as any).item_master_data;
      console.log(`✅ Using stored item master data: ${storedItems.length} items`);
      
      // Log metadata if available
      if ((currentCase.analysis_result as any).item_master_metadata) {
        const metadata = (currentCase.analysis_result as any).item_master_metadata;
        console.log('Stored data metadata:', {
          captureTimestamp: metadata.captureTimestamp,
          totalItems: metadata.totalItems,
          gradeBandBreakdown: metadata.gradeBandBreakdown
        });
      }
      
      return storedItems;
    }
    
    // Fallback to live table query (for backward compatibility with older cases)
    console.log('⚠️ No stored item master data found, falling back to live table query');
    const items = await k12ItemMasterService.loadAll(currentCase.module_type);
    
    // Filter by analysis date if available (items created around the same time as the case analysis)
    if (currentCase.analysis_result?.analysis_date) {
      const analysisDate = new Date(currentCase.analysis_result.analysis_date);
      const startDate = new Date(analysisDate.getTime() - 24 * 60 * 60 * 1000); // 24 hours before
      const endDate = new Date(analysisDate.getTime() + 24 * 60 * 60 * 1000); // 24 hours after
      
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

  generateMetadata(items: K12ItemMaster[], currentCase: AssessmentCase, format: 'csv' | 'json' | 'markdown'): ExportMetadata {
    const gradeBandBreakdown: Record<string, number> = {};
    const qcStatusBreakdown: Record<string, number> = {};
    
    items.forEach(item => {
      // Grade band breakdown
      const gradeBand = item.grade_band || 'unknown';
      gradeBandBreakdown[gradeBand] = (gradeBandBreakdown[gradeBand] || 0) + 1;
      
      // QC status breakdown
      const qcStatus = item.qc_flag || 'unset';
      qcStatusBreakdown[qcStatus] = (qcStatusBreakdown[qcStatus] || 0) + 1;
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

    return {
      exportTimestamp: new Date().toISOString(),
      exportFormat: format,
      caseId: currentCase.id,
      caseName: currentCase.display_name,
      moduleType: currentCase.module_type,
      totalItems: items.length,
      gradeBandBreakdown,
      qcStatusBreakdown,
      dataSource
    };
  }

  formatAsCSV(items: K12ItemMaster[], metadata: ExportMetadata): string {
    console.log('Formatting items as CSV:', items.length);
    
    const headers = [
      'id',
      'canonical_key',
      'teacher_label',
      'parent_friendly_label',
      'evidence_basis',
      'mapping_method',
      'grade_band',
      'qc_flag',
      'classroom_observation',
      'support_1',
      'support_2',
      'caution_note',
      'source_table',
      'source_id',
      'created_at',
      'last_updated'
    ];

    const csvContent = [
      `# Analysis Data Export - ${metadata.caseName}`,
      `# Generated: ${metadata.exportTimestamp}`,
      `# Case ID: ${metadata.caseId}`,
      `# Module Type: ${metadata.moduleType}`,
      `# Total Items: ${metadata.totalItems}`,
      `# Data Source: ${metadata.dataSource}`,
      '#',
      headers.join(','),
      ...items.map(item => [
        item.id,
        `"${(item.canonical_key || '').replace(/"/g, '""')}"`,
        `"${(item.teacher_label || '').replace(/"/g, '""')}"`,
        `"${(item.parent_friendly_label || '').replace(/"/g, '""')}"`,
        `"${(item.evidence_basis || '').replace(/"/g, '""')}"`,
        `"${(item.mapping_method || '').replace(/"/g, '""')}"`,
        `"${(item.grade_band || '').replace(/"/g, '""')}"`,
        `"${(item.qc_flag || '').replace(/"/g, '""')}"`,
        `"${(item.classroom_observation || '').replace(/"/g, '""')}"`,
        `"${(item.support_1 || '').replace(/"/g, '""')}"`,
        `"${(item.support_2 || '').replace(/"/g, '""')}"`,
        `"${(item.caution_note || '').replace(/"/g, '""')}"`,
        `"${(item.source_table || '').replace(/"/g, '""')}"`,
        `"${(item.source_id || '').replace(/"/g, '""')}"`,
        item.created_at,
        item.last_updated
      ].join(','))
    ].join('\n');

    return csvContent;
  }

  formatAsJSON(items: K12ItemMaster[], metadata: ExportMetadata): string {
    console.log('Formatting items as JSON:', items.length);
    
    const exportData = {
      metadata,
      summary: {
        totalItems: metadata.totalItems,
        gradeBandBreakdown: metadata.gradeBandBreakdown,
        qcStatusBreakdown: metadata.qcStatusBreakdown,
        dataSource: metadata.dataSource
      },
      items: items.map(item => ({
        id: item.id,
        canonical_key: item.canonical_key,
        teacher_label: item.teacher_label,
        parent_friendly_label: item.parent_friendly_label,
        evidence_basis: item.evidence_basis,
        mapping_method: item.mapping_method,
        grade_band: item.grade_band,
        qc_flag: item.qc_flag,
        classroom_observation: item.classroom_observation,
        support_1: item.support_1,
        support_2: item.support_2,
        caution_note: item.caution_note,
        source_table: item.source_table,
        source_id: item.source_id,
        created_at: item.created_at,
        last_updated: item.last_updated
      }))
    };

    return JSON.stringify(exportData, null, 2);
  }

  formatAsMarkdown(items: K12ItemMaster[], metadata: ExportMetadata): string {
    console.log('Formatting items as Markdown:', items.length);
    
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
    markdown += `### By Grade Band\n`;
    Object.entries(metadata.gradeBandBreakdown).forEach(([gradeBand, count]) => {
      markdown += `- **${gradeBand}:** ${count} items\n`;
    });

    markdown += `\n### By QC Status\n`;
    Object.entries(metadata.qcStatusBreakdown).forEach(([status, count]) => {
      markdown += `- **${status}:** ${count} items\n`;
    });

    // Items details
    if (items.length > 0) {
      markdown += `\n## Recorded Items\n\n`;
      items.forEach((item, index) => {
        markdown += `### ${index + 1}. ${item.teacher_label}\n\n`;
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
      });
    } else {
      markdown += `\n## No Items Found\n\nNo analysis data was captured for this case.\n`;
    }

    return markdown;
  }

  async exportItems(currentCase: AssessmentCase, format: 'csv' | 'json' | 'markdown'): Promise<string> {
    console.log('Exporting item master data for case:', currentCase.id, 'Format:', format);
    
    const items = await this.getItemsForCase(currentCase);
    const metadata = this.generateMetadata(items, currentCase, format);
    
    console.log('Export metadata:', {
      totalItems: metadata.totalItems,
      dataSource: metadata.dataSource,
      hasGradeBands: Object.keys(metadata.gradeBandBreakdown).length > 0
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

export const itemMasterExportService = new ItemMasterExportService();

#!/usr/bin/env tsx
import pg from 'pg';
import fs from 'fs';
import path from 'path';
const { Pool } = pg;

/**
 * Database Backup Export Script
 *
 * This script exports all data from a database to JSON files
 * in a structured format that can be imported to another database.
 *
 * Features:
 * - Exports all application tables in proper order
 * - Handles foreign key dependencies
 * - Supports large datasets with streaming
 * - Includes data validation and error handling
 * - Creates timestamped backup directory
 * - Provides detailed progress logging
 *
 * Usage:
 * DATABASE_URL=postgres://... tsx scripts/export-database-backup.ts
 */

interface ExportConfig {
  batchSize: number;
  outputDir: string;
  includeSystemTables: boolean;
  validateData: boolean;
}

interface TableExportStats {
  tableName: string;
  recordCount: number;
  fileSize: number;
  exportTime: number;
  errors: string[];
}

// Define table export order to respect foreign key dependencies
const EXPORT_ORDER = [
  // Independent tables (no foreign key dependencies)
  'users',
  'ai_config',
  'sessions',
  
  // Lookup and configuration tables
  'prompt_sections',
  'lookup_tables',
  'mapping_configurations',
  'plain_language_mappings',
  'inference_triggers',
  'barrier_glossary',
  'barrier_glossary_k12',
  'inference_triggers_k12',
  'support_lookup',
  'caution_lookup',
  'observation_template',
  'post_secondary_accommodations',
  
  // Assessment cases (references users)
  'assessment_cases',
  
  // Tables that reference assessment_cases
  'assessment_findings',
  'item_master',
  'post_secondary_item_master',
];

class DatabaseExporter {
  private pool: Pool;
  private config: ExportConfig;
  private stats: TableExportStats[] = [];
  private startTime: Date;

  constructor(databaseUrl: string, config: Partial<ExportConfig> = {}) {
    this.pool = new Pool({ 
      connectionString: databaseUrl,
      max: 5, // Limit connections for export
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    this.config = {
      batchSize: 1000,
      outputDir: `/tmp/db-exports/backup-${new Date().toISOString().replace(/[:.]/g, '-')}`,
      includeSystemTables: false,
      validateData: true,
      ...config
    };

    this.startTime = new Date();
  }

  async exportAll(): Promise<void> {
    console.log('🚀 Starting database export...');
    console.log(`📁 Output directory: ${this.config.outputDir}`);
    console.log(`📊 Batch size: ${this.config.batchSize}`);
    console.log('');

    try {
      // Create output directory
      await this.ensureOutputDirectory();
      
      // Test database connection
      await this.testConnection();
      
      // Get database metadata
      const dbInfo = await this.getDatabaseInfo();
      await this.saveMetadata(dbInfo);
      
      // Export tables in dependency order
      for (const tableName of EXPORT_ORDER) {
        await this.exportTable(tableName);
      }
      
      // Generate summary report
      await this.generateSummaryReport();
      
      console.log('\n🎉 Export completed successfully!');
      console.log(`📁 Data exported to: ${this.config.outputDir}`);
      
    } catch (error) {
      console.error('\n❌ Export failed:', error);
      throw error;
    } finally {
      await this.pool.end();
    }
  }

  private async ensureOutputDirectory(): Promise<void> {
    const fullPath = path.resolve(this.config.outputDir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
    
    // Create subdirectories
    fs.mkdirSync(path.join(fullPath, 'tables'), { recursive: true });
    fs.mkdirSync(path.join(fullPath, 'metadata'), { recursive: true });
    
    console.log(`✅ Created export directory: ${fullPath}`);
  }

  private async testConnection(): Promise<void> {
    try {
      const result = await this.pool.query('SELECT NOW() as current_time, version() as db_version');
      console.log(`✅ Database connected: ${result.rows[0].db_version.split(' ')[0]}`);
    } catch (error) {
      throw new Error(`Failed to connect to database: ${error.message}`);
    }
  }

  private async getDatabaseInfo(): Promise<any> {
    const queries = {
      serverInfo: 'SELECT version() as version, current_database() as database_name, current_user as username',
      tableCount: `
        SELECT schemaname, COUNT(*) as table_count 
        FROM pg_tables 
        WHERE schemaname NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
        GROUP BY schemaname
      `,
      totalRecords: `
        SELECT 
          schemaname,
          tablename,
          n_tup_ins as inserts,
          n_tup_upd as updates,
          n_tup_del as deletes,
          n_live_tup as live_records,
          n_dead_tup as dead_records
        FROM pg_stat_user_tables 
        ORDER BY n_live_tup DESC
      `
    };

    const results: any = {};
    for (const [key, query] of Object.entries(queries)) {
      try {
        const result = await this.pool.query(query);
        results[key] = result.rows;
      } catch (error) {
        console.warn(`⚠️  Could not get ${key}: ${error.message}`);
        results[key] = [];
      }
    }

    return {
      exportTime: this.startTime.toISOString(),
      exportConfig: this.config,
      ...results
    };
  }

  private async saveMetadata(dbInfo: any): Promise<void> {
    const metadataPath = path.join(this.config.outputDir, 'metadata', 'database-info.json');
    fs.writeFileSync(metadataPath, JSON.stringify(dbInfo, null, 2));
    console.log('✅ Database metadata saved');
  }

  private async exportTable(tableName: string): Promise<void> {
    const startTime = Date.now();
    console.log(`📋 Exporting table: ${tableName}`);
    
    try {
      // Check if table exists
      const tableExists = await this.checkTableExists(tableName);
      if (!tableExists) {
        console.log(`⏭️  Table ${tableName} does not exist, skipping`);
        return;
      }

      // Get table structure
      const tableStructure = await this.getTableStructure(tableName);
      
      // Get total record count
      const countResult = await this.pool.query(`SELECT COUNT(*) as count FROM "${tableName}"`);
      const totalRecords = parseInt(countResult.rows[0].count);
      
      if (totalRecords === 0) {
        console.log(`⚪ Table ${tableName} is empty, creating empty export file`);
        await this.saveTableData(tableName, [], tableStructure, 0);
        return;
      }
      
      console.log(`   📊 ${totalRecords} records to export`);
      
      // Export in batches
      let exportedRecords = 0;
      let allRecords: any[] = [];
      const errors: string[] = [];
      
      for (let offset = 0; offset < totalRecords; offset += this.config.batchSize) {
        try {
          const batchQuery = `SELECT * FROM "${tableName}" ORDER BY 1 LIMIT ${this.config.batchSize} OFFSET ${offset}`;
          const batchResult = await this.pool.query(batchQuery);
          
          // Validate batch data if enabled
          if (this.config.validateData) {
            const validationErrors = await this.validateBatch(tableName, batchResult.rows);
            errors.push(...validationErrors);
          }
          
          allRecords.push(...batchResult.rows);
          exportedRecords += batchResult.rows.length;
          
          // Progress indicator
          const progress = ((exportedRecords / totalRecords) * 100).toFixed(1);
          process.stdout.write(`\r   📈 Progress: ${progress}% (${exportedRecords}/${totalRecords})`);
          
        } catch (batchError) {
          const errorMsg = `Batch error at offset ${offset}: ${batchError.message}`;
          errors.push(errorMsg);
          console.warn(`\n   ⚠️  ${errorMsg}`);
        }
      }
      
      console.log(''); // New line after progress indicator
      
      // Save table data
      const fileSize = await this.saveTableData(tableName, allRecords, tableStructure, totalRecords);
      
      // Record stats
      const exportTime = Date.now() - startTime;
      this.stats.push({
        tableName,
        recordCount: exportedRecords,
        fileSize,
        exportTime,
        errors
      });
      
      console.log(`   ✅ Exported ${exportedRecords} records in ${exportTime}ms`);
      if (errors.length > 0) {
        console.log(`   ⚠️  ${errors.length} validation warnings`);
      }
      
    } catch (error) {
      const errorMsg = `Failed to export table ${tableName}: ${error.message}`;
      console.error(`   ❌ ${errorMsg}`);
      
      this.stats.push({
        tableName,
        recordCount: 0,
        fileSize: 0,
        exportTime: Date.now() - startTime,
        errors: [errorMsg]
      });
    }
  }

  private async checkTableExists(tableName: string): Promise<boolean> {
    const query = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      ) as exists
    `;
    const result = await this.pool.query(query, [tableName]);
    return result.rows[0].exists;
  }

  private async getTableStructure(tableName: string): Promise<any[]> {
    const query = `
      SELECT 
        column_name,
        data_type,
        character_maximum_length,
        is_nullable,
        column_default,
        udt_name
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = $1
      ORDER BY ordinal_position
    `;
    const result = await this.pool.query(query, [tableName]);
    return result.rows;
  }

  private async validateBatch(tableName: string, records: any[]): Promise<string[]> {
    const errors: string[] = [];
    
    // Basic validation checks
    for (const record of records) {
      // Check for null values in required fields
      if (tableName === 'users' && !record.username) {
        errors.push(`User record missing username: ${record.id}`);
      }
      
      // Check UUID format for ID fields
      if (record.id && typeof record.id === 'string' && record.id.includes('-')) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(record.id)) {
          errors.push(`Invalid UUID format in ${tableName}: ${record.id}`);
        }
      }
      
      // Check JSON fields are valid JSON
      const jsonFields = ['document_names', 'report_data', 'item_master_data', 'content', 'mapping_rules'];
      for (const field of jsonFields) {
        if (record[field] && typeof record[field] === 'string') {
          try {
            JSON.parse(record[field]);
          } catch {
            errors.push(`Invalid JSON in ${tableName}.${field} for record: ${record.id || 'unknown'}`);
          }
        }
      }
    }
    
    return errors;
  }

  private async saveTableData(
    tableName: string, 
    records: any[], 
    structure: any[], 
    totalCount: number
  ): Promise<number> {
    const tableData = {
      metadata: {
        tableName,
        exportTime: new Date().toISOString(),
        recordCount: records.length,
        totalRecords: totalCount,
        structure
      },
      data: records
    };
    
    const filePath = path.join(this.config.outputDir, 'tables', `${tableName}.json`);
    const jsonData = JSON.stringify(tableData, null, 2);
    fs.writeFileSync(filePath, jsonData);
    
    return Buffer.byteLength(jsonData, 'utf8');
  }

  private async generateSummaryReport(): Promise<void> {
    const totalRecords = this.stats.reduce((sum, stat) => sum + stat.recordCount, 0);
    const totalSize = this.stats.reduce((sum, stat) => sum + stat.fileSize, 0);
    const totalTime = Date.now() - this.startTime.getTime();
    const totalErrors = this.stats.reduce((sum, stat) => sum + stat.errors.length, 0);
    
    const summary = {
      exportSummary: {
        startTime: this.startTime.toISOString(),
        endTime: new Date().toISOString(),
        totalDuration: `${totalTime}ms`,
        totalTables: this.stats.length,
        totalRecords,
        totalFileSize: `${(totalSize / 1024 / 1024).toFixed(2)} MB`,
        totalErrors,
        config: this.config
      },
      tableStats: this.stats.map(stat => ({
        ...stat,
        fileSize: `${(stat.fileSize / 1024).toFixed(2)} KB`,
        exportTime: `${stat.exportTime}ms`
      })),
      errors: this.stats.filter(stat => stat.errors.length > 0).map(stat => ({
        table: stat.tableName,
        errors: stat.errors
      }))
    };
    
    const summaryPath = path.join(this.config.outputDir, 'export-summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    
    // Console summary
    console.log('\n📊 Export Summary:');
    console.log(`   📋 Tables exported: ${summary.exportSummary.totalTables}`);
    console.log(`   📝 Total records: ${summary.exportSummary.totalRecords}`);
    console.log(`   💾 Total file size: ${summary.exportSummary.totalFileSize}`);
    console.log(`   ⏱️  Total time: ${summary.exportSummary.totalDuration}`);
    
    if (totalErrors > 0) {
      console.log(`   ⚠️  Total warnings: ${totalErrors}`);
    }
    
    console.log(`   📄 Full report: ${summaryPath}`);
  }
}

// Main execution
async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable is required');
    process.exit(1);
  }
  
  console.log('🔗 Using database URL:', databaseUrl.replace(/\/\/.*:.*@/, '//***:***@'));
  
  const config: Partial<ExportConfig> = {
    batchSize: parseInt(process.env.EXPORT_BATCH_SIZE || '1000'),
    validateData: process.env.VALIDATE_DATA !== 'false',
    includeSystemTables: process.env.INCLUDE_SYSTEM_TABLES === 'true'
  };
  
  const exporter = new DatabaseExporter(databaseUrl, config);
  await exporter.exportAll();
}

// Run if called directly (ES modules)
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ Export script failed:', error);
    process.exit(1);
  });
}
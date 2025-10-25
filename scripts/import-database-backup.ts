#!/usr/bin/env tsx
import pg from 'pg';
import fs from 'fs';
import path from 'path';
const { Pool } = pg;

/**
 * Database Backup Import Script
 *
 * This script imports data from JSON backup files into a target database.
 * It handles foreign key constraints, transactions, and data validation.
 *
 * Features:
 * - Imports all tables in proper dependency order
 * - Handles foreign key constraint management
 * - Transaction support with rollback on error
 * - Data validation and conflict resolution
 * - Detailed progress logging and error reporting
 * - Batch processing for large datasets
 * - Schema verification before import
 *
 * Usage:
 * TARGET_DATABASE_URL=postgres://... tsx scripts/import-database-backup.ts /tmp/db-exports/backup-2024-01-01
 */

interface ImportConfig {
  batchSize: number;
  validateSchema: boolean;
  handleConflicts: 'skip' | 'overwrite' | 'error';
  cleanTarget: boolean;
  enableConstraints: boolean;
  dryRun: boolean;
}

interface TableImportStats {
  tableName: string;
  recordsProcessed: number;
  recordsInserted: number;
  recordsSkipped: number;
  recordsUpdated: number;
  importTime: number;
  errors: string[];
}

// Import order should match export order for dependency handling
const IMPORT_ORDER = [
  'users',
  'ai_config',
  'sessions',
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
  'assessment_cases',
  'assessment_findings',
  'item_master',
  'post_secondary_item_master',
];

class DatabaseImporter {
  private pool: Pool;
  private config: ImportConfig;
  private importDir: string;
  private stats: TableImportStats[] = [];
  private startTime: Date;
  private client: pg.PoolClient | null = null;

  constructor(targetDatabaseUrl: string, importDir: string, config: Partial<ImportConfig> = {}) {
    this.pool = new Pool({
      connectionString: targetDatabaseUrl,
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    this.importDir = path.resolve(importDir);
    this.config = {
      batchSize: 500,
      validateSchema: true,
      handleConflicts: 'skip',
      cleanTarget: false,
      enableConstraints: true,
      dryRun: false,
      ...config
    };

    this.startTime = new Date();
  }

  async importAll(): Promise<void> {
    console.log('🚀 Starting database import...');
    console.log(`📁 Import directory: ${this.importDir}`);
    console.log(`🔧 Configuration:`, this.config);
    console.log('');

    try {
      // Validate import directory and files
      await this.validateImportDirectory();
      
      // Get database client for transaction management
      this.client = await this.pool.connect();
      
      // Test connection and get database info
      await this.testConnection();
      
      // Validate target database schema if enabled
      if (this.config.validateSchema) {
        await this.validateTargetSchema();
      }
      
      // Start transaction
      await this.client.query('BEGIN');
      console.log('📋 Transaction started');
      
      try {
        // Clean target tables if requested
        if (this.config.cleanTarget) {
          await this.cleanTargetTables();
        }
        
        // Disable foreign key constraints during import
        if (this.config.enableConstraints) {
          await this.disableForeignKeyConstraints();
        }
        
        // Import tables in dependency order
        for (const tableName of IMPORT_ORDER) {
          await this.importTable(tableName);
        }
        
        // Re-enable foreign key constraints
        if (this.config.enableConstraints) {
          await this.enableForeignKeyConstraints();
        }
        
        // Validate imported data
        await this.validateImportedData();
        
        if (this.config.dryRun) {
          console.log('\n🔄 DRY RUN: Rolling back transaction (no changes made)');
          await this.client.query('ROLLBACK');
        } else {
          // Commit transaction
          await this.client.query('COMMIT');
          console.log('✅ Transaction committed');
        }
        
        // Generate summary report
        await this.generateImportReport();
        
        console.log('\n🎉 Import completed successfully!');
        
      } catch (error) {
        console.error('\n❌ Import failed, rolling back transaction:', error.message);
        await this.client.query('ROLLBACK');
        throw error;
      }
      
    } catch (error) {
      console.error('\n❌ Import setup failed:', error);
      throw error;
    } finally {
      if (this.client) {
        this.client.release();
      }
      await this.pool.end();
    }
  }

  private async validateImportDirectory(): Promise<void> {
    if (!fs.existsSync(this.importDir)) {
      throw new Error(`Import directory does not exist: ${this.importDir}`);
    }
    
    const tablesDir = path.join(this.importDir, 'tables');
    if (!fs.existsSync(tablesDir)) {
      throw new Error(`Tables directory not found: ${tablesDir}`);
    }
    
    const summaryFile = path.join(this.importDir, 'export-summary.json');
    if (!fs.existsSync(summaryFile)) {
      console.warn('⚠️  Export summary file not found, proceeding without validation');
    } else {
      const summary = JSON.parse(fs.readFileSync(summaryFile, 'utf8'));
      console.log(`📊 Export info: ${summary.exportSummary.totalTables} tables, ${summary.exportSummary.totalRecords} records`);
    }
    
    console.log(`✅ Import directory validated: ${this.importDir}`);
  }

  private async testConnection(): Promise<void> {
    try {
      const result = await this.client!.query('SELECT NOW() as current_time, current_database() as db_name');
      console.log(`✅ Connected to development database: ${result.rows[0].db_name}`);
    } catch (error) {
      throw new Error(`Failed to connect to development database: ${error.message}`);
    }
  }

  private async validateTargetSchema(): Promise<void> {
    console.log('🔍 Validating target database schema...');
    
    try {
      const existingTables = await this.client!.query(`
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY tablename
      `);
      
      const tableNames = existingTables.rows.map(row => row.tablename);
      console.log(`📋 Found ${tableNames.length} existing tables in target database`);
      
      // Check that all import tables exist in target schema
      const missingTables = IMPORT_ORDER.filter(table => !tableNames.includes(table));
      if (missingTables.length > 0) {
        console.warn(`⚠️  Missing tables in target schema: ${missingTables.join(', ')}`);
        console.warn('   These tables will be skipped during import');
      }
      
      console.log('✅ Schema validation completed');
      
    } catch (error) {
      console.warn(`⚠️  Schema validation failed: ${error.message}`);
      console.warn('   Proceeding with import, but may encounter errors');
    }
  }

  private async cleanTargetTables(): Promise<void> {
    console.log('🧹 Cleaning target tables...');
    
    try {
      // Clean tables in reverse order to respect foreign keys
      const cleanOrder = [...IMPORT_ORDER].reverse();
      
      for (const tableName of cleanOrder) {
        const tableExists = await this.checkTableExists(tableName);
        if (tableExists) {
          await this.client!.query(`TRUNCATE TABLE "${tableName}" CASCADE`);
          console.log(`   🗑️  Cleaned table: ${tableName}`);
        }
      }
      
      console.log('✅ Target tables cleaned');
      
    } catch (error) {
      throw new Error(`Failed to clean target tables: ${error.message}`);
    }
  }

  private async disableForeignKeyConstraints(): Promise<void> {
    console.log('🔓 Disabling foreign key constraints...');
    
    try {
      // Get all foreign key constraints
      const constraints = await this.client!.query(`
        SELECT 
          tc.constraint_name,
          tc.table_name,
          tc.constraint_type
        FROM information_schema.table_constraints tc
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
      `);
      
      // Disable each constraint
      for (const constraint of constraints.rows) {
        await this.client!.query(`
          ALTER TABLE "${constraint.table_name}" 
          DISABLE TRIGGER ALL
        `);
      }
      
      console.log(`✅ Disabled constraints for ${constraints.rows.length} foreign keys`);
      
    } catch (error) {
      console.warn(`⚠️  Could not disable foreign key constraints: ${error.message}`);
      console.warn('   Import may fail if foreign key violations occur');
    }
  }

  private async enableForeignKeyConstraints(): Promise<void> {
    console.log('🔒 Re-enabling foreign key constraints...');
    
    try {
      // Get all tables
      const tables = await this.client!.query(`
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
      `);
      
      // Re-enable triggers for each table
      for (const table of tables.rows) {
        await this.client!.query(`
          ALTER TABLE "${table.tablename}" 
          ENABLE TRIGGER ALL
        `);
      }
      
      console.log(`✅ Re-enabled constraints for ${tables.rows.length} tables`);
      
    } catch (error) {
      console.warn(`⚠️  Could not re-enable foreign key constraints: ${error.message}`);
      console.warn('   Manual constraint re-enabling may be required');
    }
  }

  private async importTable(tableName: string): Promise<void> {
    const startTime = Date.now();
    console.log(`📋 Importing table: ${tableName}`);
    
    try {
      // Check if table exists in target database
      const tableExists = await this.checkTableExists(tableName);
      if (!tableExists) {
        console.log(`⏭️  Table ${tableName} does not exist in target, skipping`);
        return;
      }
      
      // Check if export file exists
      const exportFile = path.join(this.importDir, 'tables', `${tableName}.json`);
      if (!fs.existsSync(exportFile)) {
        console.log(`⏭️  Export file for ${tableName} not found, skipping`);
        return;
      }
      
      // Load export data
      const exportData = JSON.parse(fs.readFileSync(exportFile, 'utf8'));
      const records = exportData.data;
      
      if (!records || records.length === 0) {
        console.log(`⚪ Table ${tableName} export is empty, skipping`);
        return;
      }
      
      console.log(`   📊 ${records.length} records to import`);
      
      // Import in batches
      let processed = 0;
      let inserted = 0;
      let skipped = 0;
      let updated = 0;
      const errors: string[] = [];
      
      for (let i = 0; i < records.length; i += this.config.batchSize) {
        const batch = records.slice(i, i + this.config.batchSize);
        
        try {
          const batchResult = await this.importBatch(tableName, batch);
          processed += batchResult.processed;
          inserted += batchResult.inserted;
          skipped += batchResult.skipped;
          updated += batchResult.updated;
          errors.push(...batchResult.errors);
          
          // Progress indicator
          const progress = ((i + batch.length) / records.length * 100).toFixed(1);
          process.stdout.write(`\r   📈 Progress: ${progress}% (${i + batch.length}/${records.length})`);
          
        } catch (batchError) {
          const errorMsg = `Batch error at offset ${i}: ${batchError.message}`;
          errors.push(errorMsg);
          console.warn(`\n   ⚠️  ${errorMsg}`);
        }
      }
      
      console.log(''); // New line after progress indicator
      
      // Record stats
      const importTime = Date.now() - startTime;
      this.stats.push({
        tableName,
        recordsProcessed: processed,
        recordsInserted: inserted,
        recordsSkipped: skipped,
        recordsUpdated: updated,
        importTime,
        errors
      });
      
      console.log(`   ✅ Imported ${inserted} records (${skipped} skipped, ${updated} updated) in ${importTime}ms`);
      if (errors.length > 0) {
        console.log(`   ⚠️  ${errors.length} errors/warnings`);
      }
      
    } catch (error) {
      const errorMsg = `Failed to import table ${tableName}: ${error.message}`;
      console.error(`   ❌ ${errorMsg}`);
      
      this.stats.push({
        tableName,
        recordsProcessed: 0,
        recordsInserted: 0,
        recordsSkipped: 0,
        recordsUpdated: 0,
        importTime: Date.now() - startTime,
        errors: [errorMsg]
      });
    }
  }

  private async importBatch(tableName: string, records: any[]): Promise<{
    processed: number;
    inserted: number;
    skipped: number;
    updated: number;
    errors: string[];
  }> {
    let processed = 0;
    let inserted = 0;
    let skipped = 0;
    let updated = 0;
    const errors: string[] = [];
    
    for (const record of records) {
      try {
        processed++;
        
        // Get table columns
        const columns = Object.keys(record);
        const values = Object.values(record);
        const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
        
        // Check if record already exists (for tables with unique constraints)
        const primaryKeyField = await this.getPrimaryKeyField(tableName);
        let existingRecord = null;
        
        if (primaryKeyField && record[primaryKeyField]) {
          const checkQuery = `SELECT 1 FROM "${tableName}" WHERE "${primaryKeyField}" = $1`;
          const checkResult = await this.client!.query(checkQuery, [record[primaryKeyField]]);
          existingRecord = checkResult.rows.length > 0;
        }
        
        if (existingRecord) {
          if (this.config.handleConflicts === 'skip') {
            skipped++;
            continue;
          } else if (this.config.handleConflicts === 'overwrite') {
            // Update existing record
            const setClauses = columns
              .filter(col => col !== primaryKeyField)
              .map((col, i) => `"${col}" = $${i + 2}`)
              .join(', ');
            
            if (setClauses) {
              const updateQuery = `UPDATE "${tableName}" SET ${setClauses} WHERE "${primaryKeyField}" = $1`;
              const updateValues = [record[primaryKeyField], ...values.filter((_, i) => columns[i] !== primaryKeyField)];
              
              if (!this.config.dryRun) {
                await this.client!.query(updateQuery, updateValues);
              }
              updated++;
            } else {
              skipped++;
            }
            continue;
          } else {
            errors.push(`Duplicate key for ${tableName}: ${record[primaryKeyField]}`);
            continue;
          }
        }
        
        // Insert new record
        const insertQuery = `INSERT INTO "${tableName}" (${columns.map(col => `"${col}"`).join(', ')}) VALUES (${placeholders})`;
        
        if (!this.config.dryRun) {
          await this.client!.query(insertQuery, values);
        }
        inserted++;
        
      } catch (recordError) {
        const errorMsg = `Record error in ${tableName}: ${recordError.message}`;
        errors.push(errorMsg);
        
        // For critical errors, we might want to stop the batch
        if (recordError.message.includes('does not exist')) {
          throw recordError; // Re-throw schema errors
        }
      }
    }
    
    return { processed, inserted, skipped, updated, errors };
  }

  private async checkTableExists(tableName: string): Promise<boolean> {
    const query = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      ) as exists
    `;
    const result = await this.client!.query(query, [tableName]);
    return result.rows[0].exists;
  }

  private async getPrimaryKeyField(tableName: string): Promise<string | null> {
    const query = `
      SELECT column_name
      FROM information_schema.key_column_usage kcu
      JOIN information_schema.table_constraints tc ON kcu.constraint_name = tc.constraint_name
      WHERE tc.table_name = $1
      AND tc.constraint_type = 'PRIMARY KEY'
      AND tc.table_schema = 'public'
    `;
    const result = await this.client!.query(query, [tableName]);
    return result.rows.length > 0 ? result.rows[0].column_name : null;
  }

  private async validateImportedData(): Promise<void> {
    console.log('🔍 Validating imported data...');
    
    try {
      let totalRecords = 0;
      
      for (const stat of this.stats) {
        if (stat.recordsInserted > 0 || stat.recordsUpdated > 0) {
          const countResult = await this.client!.query(`SELECT COUNT(*) as count FROM "${stat.tableName}"`);
          const actualCount = parseInt(countResult.rows[0].count);
          totalRecords += actualCount;
          
          if (actualCount === 0 && stat.recordsInserted > 0) {
            console.warn(`⚠️  No records found in ${stat.tableName} after claiming ${stat.recordsInserted} inserts`);
          }
        }
      }
      
      console.log(`✅ Data validation completed: ${totalRecords} total records in database`);
      
    } catch (error) {
      console.warn(`⚠️  Data validation failed: ${error.message}`);
    }
  }

  private async generateImportReport(): Promise<void> {
    const totalProcessed = this.stats.reduce((sum, stat) => sum + stat.recordsProcessed, 0);
    const totalInserted = this.stats.reduce((sum, stat) => sum + stat.recordsInserted, 0);
    const totalSkipped = this.stats.reduce((sum, stat) => sum + stat.recordsSkipped, 0);
    const totalUpdated = this.stats.reduce((sum, stat) => sum + stat.recordsUpdated, 0);
    const totalTime = Date.now() - this.startTime.getTime();
    const totalErrors = this.stats.reduce((sum, stat) => sum + stat.errors.length, 0);
    
    const report = {
      importSummary: {
        startTime: this.startTime.toISOString(),
        endTime: new Date().toISOString(),
        totalDuration: `${totalTime}ms`,
        importDirectory: this.importDir,
        config: this.config,
        results: {
          tablesProcessed: this.stats.length,
          recordsProcessed: totalProcessed,
          recordsInserted: totalInserted,
          recordsSkipped: totalSkipped,
          recordsUpdated: totalUpdated,
          totalErrors
        }
      },
      tableStats: this.stats.map(stat => ({
        ...stat,
        importTime: `${stat.importTime}ms`
      })),
      errors: this.stats.filter(stat => stat.errors.length > 0).map(stat => ({
        table: stat.tableName,
        errors: stat.errors
      }))
    };
    
    const reportPath = path.join(this.importDir, 'import-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Console summary
    console.log('\n📊 Import Summary:');
    console.log(`   📋 Tables processed: ${report.importSummary.results.tablesProcessed}`);
    console.log(`   📝 Records processed: ${report.importSummary.results.recordsProcessed}`);
    console.log(`   ➕ Records inserted: ${report.importSummary.results.recordsInserted}`);
    console.log(`   ⏭️  Records skipped: ${report.importSummary.results.recordsSkipped}`);
    console.log(`   🔄 Records updated: ${report.importSummary.results.recordsUpdated}`);
    console.log(`   ⏱️  Total time: ${report.importSummary.totalDuration}`);
    
    if (totalErrors > 0) {
      console.log(`   ⚠️  Total errors: ${totalErrors}`);
    }
    
    console.log(`   📄 Full report: ${reportPath}`);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('❌ Usage: tsx scripts/import-database-backup.ts <backup-directory>');
    console.error('   Example: tsx scripts/import-database-backup.ts /tmp/db-exports/backup-2024-01-01');
    process.exit(1);
  }

  const importDir = args[0];
  const targetDatabaseUrl = process.env.TARGET_DATABASE_URL || process.env.DATABASE_URL;

  if (!targetDatabaseUrl) {
    console.error('❌ TARGET_DATABASE_URL or DATABASE_URL environment variable is required');
    process.exit(1);
  }

  console.log('🔗 Using target database URL:', targetDatabaseUrl.replace(/\/\/.*:.*@/, '//***:***@'));

  const config: Partial<ImportConfig> = {
    batchSize: parseInt(process.env.IMPORT_BATCH_SIZE || '500'),
    handleConflicts: (process.env.HANDLE_CONFLICTS as any) || 'skip',
    cleanTarget: process.env.CLEAN_TARGET === 'true',
    dryRun: process.env.DRY_RUN === 'true',
    validateSchema: process.env.VALIDATE_SCHEMA !== 'false'
  };

  const importer = new DatabaseImporter(targetDatabaseUrl, importDir, config);
  await importer.importAll();
}

// Run if called directly (ES modules)
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ Import script failed:', error);
    process.exit(1);
  });
}
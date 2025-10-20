#!/usr/bin/env tsx
/**
 * Database Migration Script: Neon (Replit) → Railway
 *
 * This script copies all data from your Neon database to Railway PostgreSQL
 */

import pg from 'pg';
const { Client } = pg;

const NEON_URL = 'postgresql://neondb_owner:npg_4mHBtfowpI6Q@ep-dark-breeze-aezh6e7z.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';
const RAILWAY_URL = process.env.DATABASE_URL || 'postgresql://postgres:rcsVOXsDpIACNtFTOveKEnTSkxhGEmGU@shuttle.proxy.rlwy.net:59310/railway';

async function migrateDatabase() {
  console.log('🚀 Starting database migration from Neon to Railway...\n');

  // Connect to both databases
  const sourceClient = new Client({ connectionString: NEON_URL });
  const targetClient = new Client({ connectionString: RAILWAY_URL });

  try {
    console.log('📡 Connecting to Neon (source)...');
    await sourceClient.connect();
    console.log('✅ Connected to Neon\n');

    console.log('📡 Connecting to Railway (target)...');
    await targetClient.connect();
    console.log('✅ Connected to Railway\n');

    // Get list of all tables
    console.log('📋 Fetching table list...');
    const tablesResult = await sourceClient.query(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);

    const tables = tablesResult.rows.map(r => r.tablename);
    console.log(`Found ${tables.length} tables:`, tables.join(', '));
    console.log('');

    // For each table, copy data
    for (const table of tables) {
      console.log(`🔄 Migrating table: ${table}`);

      // Get row count
      const countResult = await sourceClient.query(`SELECT COUNT(*) FROM "${table}"`);
      const rowCount = parseInt(countResult.rows[0].count);
      console.log(`   Rows to copy: ${rowCount}`);

      if (rowCount === 0) {
        console.log(`   ⏭️  Skipping empty table\n`);
        continue;
      }

      // Get all data
      const dataResult = await sourceClient.query(`SELECT * FROM "${table}"`);

      if (dataResult.rows.length === 0) {
        console.log(`   ⏭️  No data to copy\n`);
        continue;
      }

      // Get column names
      const columns = Object.keys(dataResult.rows[0]);

      // Disable triggers and constraints temporarily
      await targetClient.query(`ALTER TABLE "${table}" DISABLE TRIGGER ALL`);

      // Insert data in batches
      let inserted = 0;
      for (const row of dataResult.rows) {
        const values = columns.map(col => row[col]);
        const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

        try {
          await targetClient.query(
            `INSERT INTO "${table}" (${columns.map(c => `"${c}"`).join(', ')})
             VALUES (${placeholders})
             ON CONFLICT DO NOTHING`,
            values
          );
          inserted++;
        } catch (err: any) {
          console.log(`   ⚠️  Error inserting row: ${err.message}`);
        }
      }

      // Re-enable triggers
      await targetClient.query(`ALTER TABLE "${table}" ENABLE TRIGGER ALL`);

      console.log(`   ✅ Copied ${inserted}/${rowCount} rows\n`);
    }

    console.log('🎉 Migration completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Tables migrated: ${tables.length}`);

  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await sourceClient.end();
    await targetClient.end();
  }
}

// Run migration
migrateDatabase().catch(console.error);

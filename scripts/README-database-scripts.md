# Database Backup and Restore Scripts

This directory contains comprehensive scripts for database backup and restore operations.

**Note**: These scripts are for backup/restore and optional local testing workflows. The application uses a **single shared cloud database** (Neon PostgreSQL via `DATABASE_URL`) for all environments. See [../claude.md](../claude.md) for architecture details.

## Overview

- **export-database-backup.ts** (formerly export-production-data.ts) - Exports database to JSON files
- **import-database-backup.ts** (formerly import-to-development.ts) - Imports JSON backup to target database

## Features

### Export Script Features
- ✅ Exports all application tables in proper dependency order
- ✅ Handles large datasets with batch processing (configurable batch size)
- ✅ Includes data validation and error reporting
- ✅ Creates timestamped backup directories
- ✅ Generates comprehensive export reports
- ✅ Supports streaming for memory efficiency
- ✅ Includes database metadata and structure information

### Import Script Features
- ✅ Imports data in proper dependency order (respects foreign keys)
- ✅ Transaction support with rollback on errors
- ✅ Foreign key constraint management (disable/enable during import)
- ✅ Conflict resolution (skip, overwrite, or error on duplicates)
- ✅ Schema validation before import
- ✅ Data validation after import
- ✅ Dry-run mode for testing
- ✅ Batch processing for performance

## Quick Start

### 1. Export Database Backup

```bash
# Export from your cloud database
DATABASE_URL="postgres://username:password@host:port/database" \
npx tsx scripts/export-database-backup.ts
```

**Output**: Creates timestamped directory in `/tmp/db-exports/backup-YYYYMMDD-HHMMSS/`

### 2. Import Database Backup

```bash
# Import to target database (e.g., local testing database)
TARGET_DATABASE_URL="postgres://username:password@localhost:5432/local_test" \
npx tsx scripts/import-database-backup.ts /tmp/db-exports/backup-2024-01-01T12-00-00-000Z
```

**Use Cases**:
- Restore from backup
- Copy data to local PostgreSQL for isolated testing
- Migrate between database providers

## Configuration Options

### Export Configuration (Environment Variables)

```bash
# Batch size for processing (default: 1000)
export EXPORT_BATCH_SIZE=1000

# Enable/disable data validation (default: true)
export VALIDATE_DATA=true

# Include system tables (default: false)
export INCLUDE_SYSTEM_TABLES=false
```

### Import Configuration (Environment Variables)

```bash
# Batch size for processing (default: 500)
export IMPORT_BATCH_SIZE=500

# How to handle conflicting records: skip, overwrite, error (default: skip)
export HANDLE_CONFLICTS=skip

# Clean target tables before import (default: false)
export CLEAN_TARGET=false

# Test import without making changes (default: false)
export DRY_RUN=false

# Validate target schema before import (default: true)
export VALIDATE_SCHEMA=true
```

## Examples

### Basic Export
```bash
# Export from cloud database
DATABASE_URL="postgres://user:pass@host:5432/mydb" \
npx tsx scripts/export-database-backup.ts
```

### Export with Custom Batch Size
```bash
DATABASE_URL="postgres://user:pass@host:5432/mydb" \
EXPORT_BATCH_SIZE=2000 \
npx tsx scripts/export-database-backup.ts
```

### Import with Clean Target
```bash
# Import to local database, cleaning existing data
TARGET_DATABASE_URL="postgres://user:pass@localhost:5432/local_test" \
CLEAN_TARGET=true \
HANDLE_CONFLICTS=overwrite \
npx tsx scripts/import-database-backup.ts /tmp/db-exports/backup-2024-01-01T12-00-00-000Z
```

### Dry Run Import (Test Without Changes)
```bash
TARGET_DATABASE_URL="postgres://user:pass@localhost:5432/local_test" \
DRY_RUN=true \
npx tsx scripts/import-database-backup.ts /tmp/db-exports/backup-2024-01-01T12-00-00-000Z
```

## Output Structure

### Export Directory Structure
```
/tmp/db-exports/backup-2024-01-01T12-00-00-000Z/
├── export-summary.json          # Overall export statistics
├── metadata/
│   └── database-info.json       # Database metadata and schema info
└── tables/
    ├── users.json               # User accounts
    ├── ai_config.json           # AI configuration
    ├── assessment_cases.json    # Assessment cases
    ├── prompt_sections.json     # Prompt templates
    ├── lookup_tables.json       # Lookup data
    └── ...                      # All other tables
```

**Note**: Exports are stored in `/tmp/db-exports/` to prevent PII data from being committed to version control.

### JSON File Format
```json
{
  "metadata": {
    "tableName": "users",
    "exportTime": "2024-01-01T12:00:00.000Z",
    "recordCount": 150,
    "totalRecords": 150,
    "structure": [...] // Table schema information
  },
  "data": [
    // Array of records
    {"id": 1, "username": "admin", ...},
    {"id": 2, "username": "user", ...}
  ]
}
```

## Table Export Order

Tables are exported and imported in dependency order to handle foreign key relationships:

1. **Independent Tables**: users, ai_config, sessions
2. **Lookup Tables**: prompt_sections, lookup_tables, mapping_configurations, plain_language_mappings, inference_triggers, barrier_glossary, etc.
3. **Assessment Tables**: assessment_cases (references users)
4. **Dependent Tables**: assessment_findings, item_master (reference assessment_cases)

## Error Handling

### Export Errors
- **Connection Issues**: Script validates connection before starting
- **Permission Issues**: Detailed error messages for access problems
- **Large Dataset Issues**: Batch processing with progress tracking
- **Validation Issues**: Optional data validation with detailed reporting

### Import Errors
- **Schema Mismatches**: Pre-import schema validation
- **Foreign Key Violations**: Constraint management during import
- **Duplicate Records**: Configurable conflict resolution
- **Transaction Issues**: Automatic rollback on errors

## Monitoring and Logging

### Progress Tracking
Both scripts provide real-time progress updates:
- Table-by-table progress
- Record count progress within each table
- Time estimates and performance metrics

### Reports
- **Export Summary**: Complete statistics and file sizes
- **Import Report**: Records processed, inserted, skipped, updated
- **Error Logs**: Detailed error information for troubleshooting

## Safety Features

### Export Safety
- Read-only operations (no modifications to source database)
- Connection timeouts and limits
- Memory-efficient streaming for large tables
- Detailed validation and error reporting

### Import Safety
- Transaction management with rollback capability
- Dry-run mode for testing
- Schema validation before import
- Foreign key constraint management
- Configurable conflict resolution

## Troubleshooting

### Common Issues

1. **Connection Timeout**
   ```bash
   # Increase connection timeout
   export CONNECTION_TIMEOUT=30000
   ```

2. **Memory Issues with Large Tables**
   ```bash
   # Reduce batch size
   export EXPORT_BATCH_SIZE=500
   export IMPORT_BATCH_SIZE=250
   ```

3. **Foreign Key Violations**
   ```bash
   # The scripts handle this automatically, but if issues persist:
   # Check that tables are being imported in proper order
   ```

4. **Duplicate Key Errors**
   ```bash
   # Configure conflict handling
   export HANDLE_CONFLICTS=skip  # or overwrite
   ```

5. **Permission Denied**
   ```bash
   # Ensure database user has appropriate permissions
   # For export: SELECT on all tables
   # For import: INSERT, UPDATE, DELETE, ALTER on all tables
   ```

## Requirements

- Node.js with TypeScript support (`npx tsx`)
- PostgreSQL database access
- Appropriate database permissions
- Sufficient disk space for export files

## Development

To modify or extend the scripts:

1. **Adding New Tables**: Update `EXPORT_ORDER` and `IMPORT_ORDER` arrays in both scripts
2. **Custom Validation**: Modify the `validateBatch()` method in the export script
3. **Custom Conflict Resolution**: Extend the `importBatch()` method in the import script
4. **Performance Tuning**: Adjust batch sizes and connection pool settings

## Security Considerations

- Database URLs in logs are sanitized (credentials masked)
- Export files may contain sensitive data - secure appropriately
- Use environment variables for database credentials
- Consider encrypting export files for sensitive data
- Limit database user permissions to minimum required

## Performance Notes

- **Export Performance**: ~1000-2000 records/second (varies by table complexity)
- **Import Performance**: ~500-1000 records/second (due to validation and constraints)
- **Memory Usage**: Batch processing keeps memory usage reasonable
- **Disk Usage**: JSON format is human-readable but larger than binary formats
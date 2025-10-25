# Development Database Setup Guide

⚠️ **DEPRECATION NOTICE**: This guide describes an **optional** setup for a separate local testing database. The default application architecture uses a **single shared database** (Neon PostgreSQL via `DATABASE_URL`) for all environments. `APP_ENVIRONMENT` controls behavior (demo=read-only, dev/prod=full access), not which database is used.

**When to use this guide:**
- You want a completely isolated local PostgreSQL instance for destructive testing
- You need to test database migrations without affecting the shared database
- You're working offline without access to the cloud database

**Default setup (recommended):** Use the single shared database as documented in [claude.md](../claude.md).

⚠️ **SECURITY WARNING**: This guide handles potentially sensitive data exports. All exports now use `/tmp/db-exports/` directory outside the repository to prevent PII data leaks through version control.

---

This guide walks you through setting up an **optional** separate development database for isolated testing, while keeping your production database intact.

## Overview

This optional setup supports two database environments:
- **Primary**: Your cloud application database (`DATABASE_URL` - Neon/Railway/Supabase)
- **Local Testing (optional)**: A separate local database for isolated testing (`DEV_DATABASE_URL`)

## Step 1: Create Local Development Database

**Option A: Local PostgreSQL (Recommended for local development)**
```bash
# macOS (using Homebrew)
brew install postgresql@16
brew services start postgresql@16
createdb local_dev_database

# Your connection string:
# postgresql://localhost:5432/local_dev_database
```

**Option B: Docker**
```bash
docker run --name local-postgres \
  -e POSTGRES_PASSWORD=localdev \
  -e POSTGRES_DB=local_dev_database \
  -p 5432:5432 -d postgres:16

# Your connection string:
# postgresql://postgres:localdev@localhost:5432/local_dev_database
```

**Option C: Cloud Database Provider**
- Create a separate database on Neon, Supabase, or Railway
- Note the connection URL provided

**Set Environment Variable:**
```bash
# Add to your .env file (NOT committed to git)
DEV_DATABASE_URL=postgresql://localhost:5432/local_dev_database
```

## Step 2: Copy Production Data to Development

Now you'll copy all your current production data to the new development database.

### Export Production Data

⚠️ **SECURITY NOTICE**: Exports are stored in `/tmp/db-exports/` to prevent PII data from being committed to version control.

```bash
# Export all data from your cloud database to JSON files
DATABASE_URL="your-cloud-database-url" npx tsx scripts/export-database-backup.ts
```

This creates a timestamped export directory with all your data:
- `/tmp/db-exports/backup-YYYYMMDD-HHMMSS/tables/` - All table data as JSON
- `/tmp/db-exports/backup-YYYYMMDD-HHMMSS/metadata/` - Export metadata and statistics

### Import to Local Development Database
```bash
# Import the exported data to your local test database
TARGET_DATABASE_URL="postgresql://localhost:5432/local_dev_database" \
npx tsx scripts/import-database-backup.ts /tmp/db-exports/backup-YYYYMMDD-HHMMSS
```

The import script will:
- Create all necessary tables (if they don't exist)
- Import all data with proper foreign key handling
- Validate data integrity after import
- Provide detailed import statistics

## Step 3: Configure Application to Use Local Database

**Important**: The application does NOT automatically switch databases based on `APP_ENVIRONMENT`. You must explicitly configure it to use `DEV_DATABASE_URL`.

### Method 1: Temporary Override (For Current Session)
```bash
# Use local database temporarily
DATABASE_URL="postgresql://localhost:5432/local_dev_database" npm run dev
```

### Method 2: Modify .env (For Persistent Local Development)
```bash
# In your .env file, temporarily comment out cloud database:
# DATABASE_URL=postgresql://cloud-db-url...
DATABASE_URL=postgresql://localhost:5432/local_dev_database

# Then run normally:
npm run dev
```

### Method 3: Application Code Modification (Advanced)
Modify [server/config/database.ts](../server/config/database.ts) to check for `DEV_DATABASE_URL` when in development mode.

## Environment Variables Reference

### Standard Setup (Default):
- `DATABASE_URL`: Cloud database connection string (Neon/Railway/Supabase)
- `OPENAI_API_KEY`: Your OpenAI API key
- `APP_ENVIRONMENT`: Controls behavior (`development`, `production`, `*-demo` for read-only)

### Optional Local Testing Setup:
- `DATABASE_URL`: Set to local database URL (e.g., `postgresql://localhost:5432/local_dev_database`)
- `DEV_DATABASE_URL`: Not used by application code (only by backup/import scripts)

## Database Features Supported

Both databases support all application features:
- **All Report Types**: Tutoring, K-12, and Post-Secondary assessments
- **Dual Pathways**: Simple and Complex analysis for K-12 and Post-Secondary
- **AI Configurations**: Model settings, prompts, lookup tables
- **User Authentication**: Login sessions and user management
- **Demo Environments**: K-12 and Post-Secondary demo modes

## Safety Features

### Development Database Isolation
- **Independent Data**: Development changes never affect production
- **No Auto-Sync**: Development database never automatically updates from production
- **Safe Testing**: Test new features, prompts, and configurations without risk

### Export/Import Safety
- **Transaction Support**: Import operations are fully transactional (rollback on error)
- **Validation**: Data integrity checking before and after import
- **Dry Run Mode**: Test imports without making changes
- **Conflict Resolution**: Configurable handling of duplicate data

## Troubleshooting

### "No database URL configured" Error
**Cause**: Missing or incorrect `DATABASE_URL`
**Solution**: Ensure `DATABASE_URL` is set in your `.env` file or environment

### Import Fails with Foreign Key Constraints
**Cause**: Managed databases (like Neon) may restrict constraint modifications
**Solution**: The import script handles this automatically with transaction-based imports

### Large Export/Import Times
**Cause**: Large amounts of data being transferred
**Solution**: Scripts use batch processing and are optimized for large datasets. Be patient with large databases.

### Local Database Not Connecting
**Cause**: Local PostgreSQL not running or incorrect connection string
**Solution**:
1. Verify PostgreSQL is running: `brew services list` (macOS) or `docker ps` (Docker)
2. Check connection string format: `postgresql://user:password@host:port/database`
3. Test connection: `psql postgresql://localhost:5432/local_dev_database`

## Best Practices

### When to Use Local Database
1. **Destructive Testing**: Testing migrations, bulk deletes, or schema changes
2. **Offline Development**: Working without internet access
3. **Performance Testing**: Need to reset database state frequently

### Data Management
1. **Keep Separate**: Local database is for testing only, not for production-like data
2. **Regular Refreshes**: Export from cloud database when you need fresh test data
3. **Clean Regularly**: Drop and recreate local database as needed

### Security
1. **Never Commit**: Keep local database URLs in `.env` (gitignored)
2. **PII Handling**: Be careful with sensitive data in local exports
3. **Connection Security**: Use SSL connections for cloud databases

## Need Help?

If you encounter issues:
1. Check the application logs for database connection messages
2. Verify `DATABASE_URL` is set correctly in `.env`
3. Test database connectivity: `psql $DATABASE_URL`
4. Review the export/import script logs for detailed error information
5. Refer to [claude.md](../claude.md) for standard setup documentation
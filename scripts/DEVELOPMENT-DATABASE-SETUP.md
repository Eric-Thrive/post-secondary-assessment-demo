# Development Database Setup Guide

⚠️ **SECURITY WARNING**: This guide handles potentially sensitive data exports. All exports now use `/tmp/db-exports/` directory outside the repository to prevent PII data leaks through version control.

This guide walks you through setting up a separate development database for testing features and development work, while keeping your production database intact.

## Overview

Your application now supports two primary database environments:
- **Production**: Your live application database (`DATABASE_URL`)  
- **Development**: A separate database for testing and feature development (`DEV_DATABASE_URL`)

## Step 1: Create Development Database in Replit

1. **Open Replit Database Tool**:
   - Go to the left Tool dock and select "All tools" icon
   - Choose "Database" from the tools list
   - Or use search bar → type "Replit Database" → select it

2. **Create New Database**:
   - Click "Create Database" button
   - Replit will automatically create a new PostgreSQL database
   - Note the connection credentials that appear

3. **Set Environment Variable**:
   - Copy the database connection URL
   - Go to your Replit project's environment variables (Secrets tool)
   - Add new secret: `DEV_DATABASE_URL` = `your-new-database-connection-string`

## Step 2: Copy Production Data to Development

Now you'll copy all your current production data to the new development database.

### Export Production Data

⚠️ **SECURITY NOTICE**: Exports are stored in `/tmp/db-exports/` to prevent PII data from being committed to version control.

```bash
# Export all production data to JSON files
DATABASE_URL="your-production-database-url" npx tsx scripts/export-production-data.ts
```

This creates a timestamped export directory with all your data:
- `/tmp/db-exports/production-YYYYMMDD-HHMMSS/tables/` - All table data as JSON
- `/tmp/db-exports/production-YYYYMMDD-HHMMSS/metadata/` - Export metadata and statistics

### Import to Development Database
```bash
# Import the exported data to development database
DEV_DATABASE_URL="your-development-database-url" npx tsx scripts/import-to-development.ts /tmp/db-exports/production-YYYYMMDD-HHMMSS
```

The import script will:
- Create all necessary tables (if they don't exist)
- Import all data with proper foreign key handling
- Validate data integrity after import
- Provide detailed import statistics

## Step 3: Switch Between Environments

### Development Mode
```bash
# Set environment to use development database
export APP_ENVIRONMENT=development
npm run dev
```

You'll see in the logs: `Using database: Replit Development PostgreSQL`

### Production Mode
```bash
# Set environment to use production database (default)
export APP_ENVIRONMENT=production
npm run dev
```

Or simply don't set `APP_ENVIRONMENT` (defaults to production)
You'll see in the logs: `Using database: Replit Production PostgreSQL`

## Environment Variables Reference

### Required for Development:
- `DEV_DATABASE_URL`: Connection string for your development database
- `DATABASE_URL`: Connection string for your production database (already set)
- `OPENAI_API_KEY`: Your OpenAI API key (shared across environments)

### Optional Environment Controls:
- `APP_ENVIRONMENT`: Set to `development` or `production` (defaults to `production`)

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
**Cause**: Missing `DEV_DATABASE_URL` when `APP_ENVIRONMENT=development`
**Solution**: Set the `DEV_DATABASE_URL` environment variable with your development database connection string

### Import Fails with Foreign Key Constraints
**Cause**: Managed databases (like Neon) may restrict constraint modifications
**Solution**: The import script handles this automatically with transaction-based imports

### Large Export/Import Times
**Cause**: Large amounts of data being transferred
**Solution**: Scripts use batch processing and are optimized for large datasets. Be patient with large databases.

### Environment Not Switching
**Cause**: Environment variable not properly set or cached
**Solution**: 
1. Ensure `APP_ENVIRONMENT` is set correctly
2. Restart your application server
3. Check logs for "Using database: ..." message to confirm

## Best Practices

### Development Workflow
1. **Start Development**: Set `APP_ENVIRONMENT=development` and work on new features
2. **Test Thoroughly**: Use development database for all testing
3. **Deploy to Production**: Only deploy tested code to production environment

### Data Management
1. **Keep Separate**: Never mix development and production data
2. **Regular Exports**: Export production data periodically for development refreshes (if needed)
3. **Clean Development**: Periodically clean up test data in development database

### Security
1. **Environment Variables**: Keep database URLs in environment variables (never in code)
2. **Access Control**: Limit who can access production database credentials
3. **Connection Security**: Both databases use secure SSL connections through Replit

## Cost Optimization

Replit databases are serverless and cost-optimized:
- **Auto-Suspend**: Databases suspend after 5 minutes of inactivity
- **Instant Activation**: Databases activate instantly when queried
- **Pay for Usage**: You only pay for compute time when databases are active

## Need Help?

If you encounter issues:
1. Check the application logs for database connection messages
2. Verify environment variables are set correctly
3. Ensure both databases are accessible from your Replit environment
4. Review the export/import script logs for detailed error information
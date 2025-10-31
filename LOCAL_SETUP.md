# Local Development Setup Guide

This guide will help you set up a local development environment for faster development and reduced latency.

## Prerequisites

- Node.js 20+
- npm or pnpm
- macOS, Linux, or Windows with WSL2

## Option 1: Local PostgreSQL Setup (Recommended for Active Development)

### Why Use Local PostgreSQL?

- **50-200ms faster queries** - No network latency to remote database
- **Work offline** - Develop without internet connection
- **Faster iterations** - Instant schema changes without waiting for remote DB
- **No database costs** during development

### Installation

#### macOS (using Homebrew)

```bash
# Install PostgreSQL 16
brew install postgresql@16

# Start PostgreSQL service
brew services start postgresql@16

# Verify installation
psql --version
```

#### Ubuntu/Debian Linux

```bash
# Install PostgreSQL 16
sudo apt update
sudo apt install postgresql-16 postgresql-contrib-16

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify installation
psql --version
```

#### Windows (using WSL2)

Follow the Ubuntu/Debian instructions in WSL2.

### Database Setup

```bash
# Create local database
createdb post_secondary_demo

# Test connection
psql post_secondary_demo -c "SELECT version();"
```

### Update Environment Variables

Create or update your `.env` file for local development:

```bash
# Local PostgreSQL (no password needed for local development)
DATABASE_URL=postgresql://localhost:5432/assessment_app

# Or with your username
DATABASE_URL=postgresql://$(whoami)@localhost:5432/assessment_app

# Other required variables
OPENAI_API_KEY=your-openai-api-key
SESSION_SECRET=your-random-session-secret
APP_ENVIRONMENT=development
NODE_ENV=development
PORT=5001

# Email Configuration (for testing email verification)
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=dev@thriveiep.com
EMAIL_VERIFICATION_EXPIRY_HOURS=24
EMAIL_VERIFICATION_BASE_URL=http://localhost:5001

# Rate Limiting (higher limits for development)
REGISTRATION_RATE_LIMIT=10
RESEND_VERIFICATION_RATE_LIMIT=5
SUPPORT_SALES_RATE_LIMIT=20

# Admin Notifications (disabled for development to avoid spam)
ADMIN_NOTIFICATION_ENABLED=false
```

**Note:** For complete environment variable documentation, see [DEPLOYMENT.md](DEPLOYMENT.md).

### Initialize Database Schema

```bash
# Push schema to local database
npm run db:push

# Verify tables were created
psql post_secondary_demo -c "\dt"
```

### Seed Data (Optional)

If you need demo data for development:

```bash
# Connect to database
psql post_secondary_demo

# Run any seed scripts in scripts/ directory
\i scripts/seed-demo-data.sql
```

## Option 2: Continue Using Remote Neon Database

If you prefer to keep using the remote Neon database, simply keep your existing `DATABASE_URL` in `.env`. The optimizations we've made will still improve performance:

- Connection pooling (20 connections)
- Reduced logging overhead
- Request timeouts
- Session store optimization

## Switching Between Databases

You can easily switch between local and remote databases by changing the `DATABASE_URL` in your `.env` file:

```bash
# For local development
DATABASE_URL=postgresql://localhost:5432/assessment_app

# For testing against production data
DATABASE_URL=postgresql://user:password@your-neon-host/database?sslmode=require
```

## Verifying Your Setup

1. **Start the development server:**

   ```bash
   npm run dev
   ```

2. **Check the startup logs:**

   ```
   📊 Database Connection:
     - App Environment: development
     - Node Environment: development
     - Is Demo: false
     - Database: Neon PostgreSQL (shared) OR Local PostgreSQL
   ```

3. **Test the health endpoint:**

   ```bash
   curl http://localhost:5001/health
   ```

   Expected response:

   ```json
   {
     "status": "healthy",
     "database": "connected",
     "timestamp": "2025-01-..."
   }
   ```

4. **Check database connection:**
   ```bash
   psql post_secondary_demo -c "SELECT COUNT(*) FROM users;"
   ```

## Troubleshooting

### PostgreSQL won't start

**macOS:**

```bash
# Check if already running
brew services list

# Restart service
brew services restart postgresql@16

# Check logs
tail -f /opt/homebrew/var/log/postgresql@16.log
```

**Linux:**

```bash
# Check status
sudo systemctl status postgresql

# Restart service
sudo systemctl restart postgresql

# Check logs
sudo journalctl -u postgresql -f
```

### Connection refused

Make sure PostgreSQL is running and the port (5432) is not blocked:

```bash
# Check if PostgreSQL is listening
lsof -i :5432

# Or on Linux
sudo netstat -tlnp | grep 5432
```

### Database doesn't exist

```bash
# List all databases
psql -l

# Create if missing
createdb post_secondary_demo
```

### Permission denied

```bash
# On macOS/Linux, you may need to create a PostgreSQL user
psql postgres -c "CREATE USER $(whoami) SUPERUSER;"
```

## Performance Comparison

| Operation        | Remote Neon DB | Local PostgreSQL |
| ---------------- | -------------- | ---------------- |
| Simple SELECT    | 50-100ms       | 1-5ms            |
| Session lookup   | 60-120ms       | 2-8ms            |
| Complex query    | 150-300ms      | 20-50ms          |
| Schema migration | 200-500ms      | 10-30ms          |

## Next Steps

- [ ] Set up local Redis for background job processing (see below)
- [ ] Configure IDE database tools (TablePlus, DBeaver, pgAdmin)
- [ ] Set up database backups for local development data

## Redis Setup (For Background Jobs)

If you installed background job processing:

### macOS

```bash
brew install redis
brew services start redis
```

### Ubuntu/Debian

```bash
sudo apt install redis-server
sudo systemctl start redis
sudo systemctl enable redis
```

### Verify Redis

```bash
redis-cli ping
# Should return: PONG
```

## IDE Database Tools

### VS Code Extensions

- **PostgreSQL by Chris Kolkman** - Database management in VS Code
- **Database Client by Weijan Chen** - Multi-database support

### Standalone Tools

- **TablePlus** (macOS/Windows) - Beautiful UI, fast, free tier available
- **DBeaver** (Cross-platform) - Open source, feature-rich
- **pgAdmin** (Cross-platform) - Official PostgreSQL GUI

### Connection Details

- **Host:** localhost
- **Port:** 5432
- **Database:** assessment_app
- **Username:** Your system username
- **Password:** (leave empty for local development)

## Backup and Restore

### Create Backup

```bash
pg_dump post_secondary_demo > backup.sql
```

### Restore Backup

```bash
psql post_secondary_demo < backup.sql
```

### Copy Production Data to Local

```bash
# Dump from remote
pg_dump $REMOTE_DATABASE_URL > prod_backup.sql

# Restore to local
psql post_secondary_demo < prod_backup.sql
```

## Additional Resources

- [PostgreSQL Official Documentation](https://www.postgresql.org/docs/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Neon Database Documentation](https://neon.tech/docs)

# Email Verification System Migrations

This directory contains database migrations for the email verification system.

## Migration Files

### 0000_spotty_doorman.sql

Initial schema generation including:

- All existing tables
- New `email_verified`, `email_verification_token`, `email_verification_expiry` columns in `users` table
- New `support_requests` table
- New `sales_inquiries` table

### 0001_add_email_verification_indexes.sql

Performance and backward compatibility updates:

- Indexes for email verification token lookups
- Indexes for system admin queries
- Indexes for support requests and sales inquiries
- Updates existing users to `email_verified = true` for backward compatibility

## Running Migrations

### Option 1: Using Drizzle Kit Push (Recommended for Development)

```bash
npm run db:push
```

This will apply all schema changes to the database.

### Option 2: Using the Migration Script

```bash
tsx scripts/run-email-verification-migration.ts
```

This script will:

1. Apply the index migration
2. Update existing users for backward compatibility
3. Verify the changes

## Verification

After running migrations, verify the changes:

```sql
-- Check users table structure
\d users

-- Verify existing users are marked as verified
SELECT COUNT(*) FROM users WHERE email_verified = true;

-- Check new tables exist
\d support_requests
\d sales_inquiries

-- Verify indexes
\di idx_users_email_verification_token
\di idx_users_role
\di idx_support_requests_status
\di idx_sales_inquiries_status
```

## Rollback

If you need to rollback these changes:

```sql
-- Remove indexes
DROP INDEX IF EXISTS idx_users_email_verification_token;
DROP INDEX IF EXISTS idx_users_role;
DROP INDEX IF EXISTS idx_support_requests_status;
DROP INDEX IF EXISTS idx_support_requests_created_at;
DROP INDEX IF EXISTS idx_sales_inquiries_status;
DROP INDEX IF EXISTS idx_sales_inquiries_created_at;

-- Drop new tables
DROP TABLE IF EXISTS sales_inquiries;
DROP TABLE IF EXISTS support_requests;

-- Remove email verification columns from users
ALTER TABLE users DROP COLUMN IF EXISTS email_verified;
ALTER TABLE users DROP COLUMN IF EXISTS email_verification_token;
ALTER TABLE users DROP COLUMN IF EXISTS email_verification_expiry;
```

## Notes

- Existing users are automatically marked as `email_verified = true` to maintain backward compatibility
- New users will have `email_verified = false` by default and must verify their email
- The migration is safe to run multiple times (uses `IF NOT EXISTS` and `IF EXISTS` clauses)

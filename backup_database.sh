#!/bin/bash

# Database Backup Script
# Created: $(date)

echo "🔄 Starting database backup..."

# Create backup directory
BACKUP_DIR="database_backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR

# Export tables as SQL INSERT statements
echo "📊 Backing up assessment cases..."
psql $DATABASE_URL -c "\copy (SELECT * FROM assessment_cases) TO '$BACKUP_DIR/assessment_cases.csv' WITH CSV HEADER"

echo "📊 Backing up post-secondary item master..."
psql $DATABASE_URL -c "\copy (SELECT * FROM post_secondary_item_master) TO '$BACKUP_DIR/post_secondary_item_master.csv' WITH CSV HEADER"

echo "📊 Backing up K-12 item master..."
psql $DATABASE_URL -c "\copy (SELECT * FROM k12_item_master) TO '$BACKUP_DIR/k12_item_master.csv' WITH CSV HEADER"

echo "📊 Backing up prompt sections..."
psql $DATABASE_URL -c "\copy (SELECT * FROM prompt_sections) TO '$BACKUP_DIR/prompt_sections.csv' WITH CSV HEADER"

echo "📊 Backing up accommodations data..."
psql $DATABASE_URL -c "\copy (SELECT * FROM post_secondary_accommodations) TO '$BACKUP_DIR/post_secondary_accommodations.csv' WITH CSV HEADER"

echo "📊 Backing up K-12 support lookup..."
psql $DATABASE_URL -c "\copy (SELECT * FROM k12_support_lookup) TO '$BACKUP_DIR/k12_support_lookup.csv' WITH CSV HEADER"

echo "📊 Backing up other critical tables..."
psql $DATABASE_URL -c "\copy (SELECT * FROM k12_caution_lookup) TO '$BACKUP_DIR/k12_caution_lookup.csv' WITH CSV HEADER"
psql $DATABASE_URL -c "\copy (SELECT * FROM k12_observation_lookup) TO '$BACKUP_DIR/k12_observation_lookup.csv' WITH CSV HEADER"
psql $DATABASE_URL -c "\copy (SELECT * FROM barrier_glossary) TO '$BACKUP_DIR/barrier_glossary.csv' WITH CSV HEADER"

# Create a summary file
echo "Creating backup summary..."
cat > $BACKUP_DIR/backup_info.txt << EOF
Database Backup Summary
=======================
Date: $(date)
Environment: Replit Production
Database: PostgreSQL

Tables Backed Up:
- assessment_cases
- post_secondary_item_master
- k12_item_master
- prompt_sections
- post_secondary_accommodations
- k12_support_lookup
- k12_caution_lookup
- k12_observation_lookup
- barrier_glossary

To restore:
1. Create tables with same schema
2. Import CSV files using psql \copy command
EOF

echo "✅ Database backup completed!"
echo "📁 Backup location: $BACKUP_DIR"
echo ""
echo "⚠️  IMPORTANT: Download this backup folder to your local machine!"
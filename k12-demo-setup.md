# K-12 Demo Environment Setup Guide

## Overview
The K-12 Demo environment is a completely independent environment designed specifically for demonstrating K-12 assessment capabilities. It has its own database and prompts, separate from all other environments.

## Environment Configuration

### 1. Database Setup
The K-12 demo requires its own PostgreSQL database. You have two options:

#### Option A: Create a New Replit PostgreSQL Database
1. In Replit, create a new PostgreSQL database for K-12 demo
2. Set the connection URL as `K12_DEMO_DATABASE_URL` in your environment

#### Option B: Use Neon Database (Recommended for Demo)
1. Create a new Neon database specifically for K-12 demo
2. Name it something like `k12-demo-db`
3. Set the connection URL as `K12_DEMO_DATABASE_URL`

### 2. Environment Variables
Add to your `.env` file:
```bash
# K-12 Demo Database (Independent)
K12_DEMO_DATABASE_URL=postgresql://your-k12-demo-database-url
```

### 3. Database Schema
The K-12 demo database needs the same schema as other environments. Run:
```bash
# Apply schema to K-12 demo database
APP_ENVIRONMENT=k12-demo npm run db:push
```

## K-12 Demo Features

### Module Locking
- Environment automatically locks to K-12 module
- Post-secondary options are hidden
- Module switcher is disabled

### K-12 Specific Prompts
The K-12 demo uses specialized prompts focused on educational language:
- **System Instructions**: Educational assessment focus
- **Report Template**: Strengths, challenges, support strategies
- **Terminology**: Grade-appropriate language (no medical terms)

### Demo-Specific Behaviors
Similar to post-secondary demo:
- Can implement auto-flagging for specific findings
- Customizable demo scenarios
- Preset example cases

## Switching to K-12 Demo

1. Use the environment switcher in the UI
2. Select "K-12 Demo"
3. System will:
   - Switch to K-12 demo database
   - Lock interface to K-12 module
   - Load K-12 specific prompts

## Populating K-12 Demo Data

Once the database is set up, populate it with K-12 specific data:

```sql
-- AI Configuration for K-12
INSERT INTO ai_config (config_key, model_name, temperature, max_tokens, timeout_seconds, module_type)
VALUES ('k12_config', 'gpt-4-0125-preview', '0.2', 16000, 900, 'k12');

-- K-12 System Instructions
INSERT INTO prompt_sections (section_key, module_type, content, prompt_type)
VALUES ('system_instructions_k12', 'k12', 'K-12 specific instructions...', 'system');

-- K-12 Report Template
INSERT INTO prompt_sections (section_key, module_type, content, prompt_type)
VALUES ('markdown_report_template_k12', 'k12', 'K-12 report template...', 'report_format');
```

## Differences from Post-Secondary Demo

| Feature | Post-Secondary Demo | K-12 Demo |
|---------|-------------------|-----------|
| Database | Uses replit-prod | Independent database |
| Module Lock | Post-secondary only | K-12 only |
| Language | Clinical/medical terms | Educational terms |
| Focus | Barriers & accommodations | Strengths & support |
| Grade Selection | Hidden | Required |

## Maintenance

### Updating Prompts
K-12 demo prompts are completely independent. Updates to production prompts won't affect demo prompts.

### Database Backups
Remember to backup K-12 demo database separately from other environments.

### Demo Reset
To reset demo data, truncate assessment_cases table in K-12 demo database only.
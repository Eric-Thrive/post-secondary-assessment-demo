# Railway Migration Guide

Complete guide for migrating from Replit to Railway with VS Code development environment.

## Prerequisites

- Node.js 20+ installed locally
- Git configured with GitHub access
- [Railway CLI](https://docs.railway.app/guides/cli) installed: `npm i -g @railway/cli`
- VS Code with recommended extensions (see below)

## Part 1: Railway Project Setup

### Step 1: Create Railway Account & Project

1. Go to [railway.app](https://railway.app) and sign up with GitHub
2. Click "New Project"
3. Select "Provision PostgreSQL" first
4. Click "New" again and select "GitHub Repo"
5. Connect your `post-secondary-assessment-demo` repository
6. Railway will auto-detect your Node.js app

### Step 2: Configure PostgreSQL Database

Railway automatically provisions PostgreSQL. To get your connection string:

```bash
# Login to Railway CLI
railway login

# Link to your project
railway link

# Get database URL
railway variables
```

Or from the Railway dashboard:
1. Click on your PostgreSQL service
2. Go to "Variables" tab
3. Copy the `DATABASE_URL` (it will look like: `postgresql://postgres:...@...railway.app:5432/railway`)

### Step 3: Set Environment Variables on Railway

In Railway dashboard, go to your app service → Variables tab and add:

```bash
# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key-here

# PI Redactor URL (if still using this service)
VITE_PI_REDACTOR_URL=https://rewrk-929-text-redactor-eric677.replit.app/

# Environment Selection
APP_ENVIRONMENT=railway

# Node Environment
NODE_ENV=production

# Session Secret (generate with: openssl rand -base64 32)
SESSION_SECRET=your-secure-random-string-here

# Database URL (should auto-populate from PostgreSQL service)
DATABASE_URL=${{Postgres.DATABASE_URL}}
```

**Note**: Railway automatically injects `DATABASE_URL` from your PostgreSQL service if they're linked.

### Step 4: Configure Build & Start Commands

Railway should auto-detect from your `package.json`, but verify:

**Build Command**: `npm run build`
**Start Command**: `npm run start`

Or set in `railway.toml`:

```toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "npm run start"
buildCommand = "npm run build"
```

### Step 5: Push Database Schema

Before your first deployment:

```bash
# Set Railway database URL locally for migration
railway run npm run db:push
```

This pushes your Drizzle schema to the Railway PostgreSQL database.

## Part 2: Local Development Setup (VS Code)

### Step 1: Install VS Code Extensions

Recommended extensions:
- **ES7+ React/Redux/React-Native snippets** (`dsznajder.es7-react-js-snippets`)
- **Tailwind CSS IntelliSense** (`bradlc.vscode-tailwindcss`)
- **ESLint** (`dbaeumer.vscode-eslint`)
- **Prettier** (`esbenp.prettier-vscode`)
- **PostgreSQL** (`ckolkman.vscode-postgres`)
- **GitLens** (`eamodio.gitlens`)
- **Thunder Client** (optional, for API testing)

### Step 2: Create Local `.env` File

Create `.env` in your project root (already gitignored):

```bash
# Copy from example
cp .env.example .env
```

Edit `.env` with your local/Railway values:

```bash
# Use Railway database for dev (or local PostgreSQL)
DATABASE_URL=postgresql://postgres:password@localhost:5432/assessment_dev
# OR use Railway database directly:
# DATABASE_URL=postgresql://postgres:...@...railway.app:5432/railway

OPENAI_API_KEY=your-openai-api-key

VITE_PI_REDACTOR_URL=https://rewrk-929-text-redactor-eric677.replit.app/

APP_ENVIRONMENT=local

NODE_ENV=development

SESSION_SECRET=local-dev-secret-change-in-production
```

### Step 3: Install Dependencies

```bash
npm install
```

### Step 4: Set Up Local PostgreSQL (Optional)

**Option A: Use Railway Database Directly** (Recommended for dev)
- Just use the Railway `DATABASE_URL` in your local `.env`
- No local PostgreSQL setup needed
- Always in sync with production schema

**Option B: Local PostgreSQL** (For offline development)
```bash
# macOS (Homebrew)
brew install postgresql@16
brew services start postgresql@16

# Create database
createdb assessment_dev

# Push schema
npm run db:push
```

### Step 5: Start Development Server

```bash
npm run dev
```

Opens on `http://localhost:5000`

**Hot reload enabled**: Changes to client and server code will auto-reload.

## Part 3: Remove Replit Dependencies

### Step 1: Remove Replit Vite Plugins

Edit `package.json` and remove:

```json
"@replit/vite-plugin-cartographer": "^0.3.0",
"@replit/vite-plugin-runtime-error-modal": "^0.0.3",
```

Run:
```bash
npm uninstall @replit/vite-plugin-cartographer @replit/vite-plugin-runtime-error-modal
```

### Step 2: Update `vite.config.ts`

Replace Replit plugins with simpler config (see updated file in next step).

### Step 3: Delete Replit Configuration Files

```bash
# Keep for reference initially, delete later
mv .replit .replit.backup
```

### Step 4: Update App Environment Detection

Update `shared/schema.ts` or environment config to support `railway` environment:

```typescript
// In your environment configuration
export type AppEnvironment = 'local' | 'railway' | 'neon' | 'supabase';
```

## Part 4: Development Workflow with Railway

### Local Development

```bash
# 1. Pull latest code
git pull origin main

# 2. Create feature branch
git checkout -b feature/your-feature

# 3. Start dev server
npm run dev

# 4. Make changes and test locally

# 5. Type check
npm run check

# 6. Commit and push
git add .
git commit -m "feat: your feature description"
git push origin feature/your-feature

# 7. Create PR on GitHub
```

### Deploying to Railway

Railway auto-deploys on push to `main`:

1. Merge PR to `main` on GitHub
2. Railway automatically detects the push
3. Runs `npm run build`
4. Deploys with `npm run start`
5. Check deployment logs in Railway dashboard

### Manual Deployment

```bash
# Deploy current branch to Railway
railway up

# Or deploy specific environment
railway up -e production
```

### Database Migrations

```bash
# When you change schema in shared/schema.ts

# For development (local or Railway)
npm run db:push

# For production (generate migration first)
npx drizzle-kit generate
# Review migration files in migrations/
railway run npx drizzle-kit migrate
```

### View Logs

```bash
# Real-time logs
railway logs

# Or view in Railway dashboard
```

## Part 5: VS Code Configuration

### Create `.vscode/settings.json`

```json
{
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
    ["cn\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ]
}
```

### Create `.vscode/extensions.json`

```json
{
  "recommendations": [
    "dsznajder.es7-react-js-snippets",
    "bradlc.vscode-tailwindcss",
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "ckolkman.vscode-postgres",
    "eamodio.gitlens"
  ]
}
```

### Create `.vscode/launch.json` (for debugging)

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Server",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev"],
      "skipFiles": ["<node_internals>/**"],
      "envFile": "${workspaceFolder}/.env"
    }
  ]
}
```

## Part 6: Google Cloud Storage Setup

Railway doesn't provide object storage, so continue using Google Cloud Storage:

### Option 1: Existing Setup (No changes needed)
Your code already uses `@google-cloud/storage`. Just ensure:

```bash
# Set environment variable pointing to credentials JSON
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
```

### Option 2: Set Credentials in Railway

1. Get your GCP service account JSON key
2. In Railway, add environment variable:
   ```
   GOOGLE_APPLICATION_CREDENTIALS_JSON=<paste entire JSON here>
   ```
3. Update server code to use JSON string instead of file path

## Part 7: Comparison: Replit vs Railway

| Feature | Replit | Railway |
|---------|--------|---------|
| **Dev Environment** | Cloud-based IDE | Local VS Code |
| **Database** | Managed PostgreSQL 16 | Managed PostgreSQL 16 |
| **Auto-deploy** | Yes (on save) | Yes (on git push) |
| **Build time** | ~2-3 min | ~1-2 min |
| **Cold starts** | Yes (~10s) | Minimal (~2s) |
| **Custom domain** | Yes | Yes (free SSL) |
| **Environment vars** | Built-in | Built-in |
| **Logs** | Built-in viewer | Built-in viewer + CLI |
| **Pricing** | $20+/mo | $5+/mo (usage-based) |
| **Object storage** | Replit integrations | Use GCP/AWS S3 |
| **CI/CD** | Built-in | GitHub Actions |

## Part 8: Troubleshooting

### Port Issues

Railway assigns `PORT` dynamically. Update `server/index.ts`:

```typescript
const PORT = process.env.PORT || 5000;
```

### Database Connection Issues

```bash
# Test connection
railway run node -e "console.log(process.env.DATABASE_URL)"

# Test with psql
railway run psql $DATABASE_URL
```

### Build Failures

Check Railway logs:
```bash
railway logs --build
```

Common issues:
- Missing environment variables
- TypeScript errors (run `npm run check`)
- Dependency installation failures

### Environment Variable Not Working

Railway variables format:
```bash
# Reference other services
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Plain values
OPENAI_API_KEY=sk-...
```

## Part 9: Optional Enhancements

### Add Health Check Endpoint

Create `server/health.ts`:

```typescript
export function setupHealthCheck(app: Express) {
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });
}
```

### Add GitHub Actions (CI/CD)

Create `.github/workflows/test.yml`:

```yaml
name: Test
on: [pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm install
      - run: npm run check
      - run: npm run build
```

### Add Monitoring

Railway integrates with:
- **Sentry** for error tracking
- **LogTail** for log management
- **Datadog** for APM

## Part 10: Migration Checklist

- [ ] Create Railway account and project
- [ ] Provision PostgreSQL database on Railway
- [ ] Configure environment variables on Railway
- [ ] Push database schema to Railway
- [ ] Test deployment on Railway
- [ ] Install VS Code extensions locally
- [ ] Create local `.env` file
- [ ] Install dependencies locally
- [ ] Test local development server
- [ ] Remove Replit Vite plugins
- [ ] Update `vite.config.ts`
- [ ] Update environment type definitions
- [ ] Archive `.replit` file
- [ ] Update `CLAUDE.md` documentation
- [ ] Set up Google Cloud Storage credentials
- [ ] Configure Railway auto-deploy from GitHub
- [ ] Test full deployment pipeline
- [ ] Update team documentation
- [ ] Monitor first production deployment

## Next Steps

After migration:
1. Monitor Railway logs for first 24 hours
2. Test all critical user flows in production
3. Update DNS if using custom domain
4. Set up monitoring and alerting
5. Configure backup strategy for PostgreSQL
6. Document Railway-specific workflows for team

## Support Resources

- **Railway Docs**: https://docs.railway.app
- **Railway Discord**: https://discord.gg/railway
- **Railway Status**: https://status.railway.app
- **CLI Reference**: https://docs.railway.app/guides/cli

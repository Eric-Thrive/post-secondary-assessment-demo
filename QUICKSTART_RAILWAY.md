# Quick Start: Railway Migration (15 minutes)

Fast-track guide to get your app running on Railway with local VS Code development.

## Prerequisites Checklist

```bash
# Check Node.js version (need 20+)
node --version

# Install Railway CLI
npm install -g @railway/cli

# Verify Git and GitHub access
git --version
gh --version  # Optional but helpful
```

## Part 1: Railway Setup (5 minutes)

### 1. Create Railway Project

```bash
# Login to Railway
railway login

# In your project directory
cd /Users/ericfalke/Documents/post-secondary-assessment-demo

# Initialize Railway project
railway init

# This will:
# - Connect to your GitHub repo
# - Create a new Railway project
# - Link your local directory
```

Or via web:
1. Go to [railway.app/new](https://railway.app/new)
2. Click "Deploy from GitHub repo"
3. Select `Eric-Thrive/post-secondary-assessment-demo`

### 2. Add PostgreSQL

```bash
# Add PostgreSQL to your project
railway add --database postgres
```

Or via web:
1. In Railway dashboard, click "New"
2. Select "Database"
3. Choose "PostgreSQL"

### 3. Set Environment Variables

```bash
# Set variables via CLI
railway variables set OPENAI_API_KEY="your-key-here"
railway variables set SESSION_SECRET="$(openssl rand -base64 32)"
railway variables set APP_ENVIRONMENT="railway"
railway variables set NODE_ENV="production"
railway variables set VITE_PI_REDACTOR_URL="https://rewrk-929-text-redactor-eric677.replit.app/"
```

Or set them in Railway dashboard → Variables tab.

### 4. Deploy!

```bash
# Deploy your app
railway up

# Get your app URL
railway domain
```

Your app will be live at `https://your-app.railway.app`

## Part 2: Local Development (5 minutes)

### 1. Create `.env` File

```bash
# Copy template
cp .env.example .env

# Edit .env with your values
nano .env
```

Add these values:

```bash
# Get Railway database URL
railway variables get DATABASE_URL

# Use that URL or set up local PostgreSQL
DATABASE_URL=postgresql://postgres:password@localhost:5432/assessment_dev

OPENAI_API_KEY=your-openai-api-key
SESSION_SECRET=local-dev-secret
APP_ENVIRONMENT=local
NODE_ENV=development
VITE_PI_REDACTOR_URL=https://rewrk-929-text-redactor-eric677.replit.app/
```

### 2. Install Dependencies & Push Schema

```bash
# Install all packages
npm install

# Push database schema (use Railway DB or local)
npm run db:push
# Or push to Railway specifically:
railway run npm run db:push
```

### 3. Start Development Server

```bash
npm run dev
```

Open [http://localhost:5000](http://localhost:5000)

## Part 3: Remove Replit Dependencies (2 minutes)

### Option A: Automated (Recommended)

```bash
# Remove Replit packages
npm uninstall @replit/vite-plugin-cartographer @replit/vite-plugin-runtime-error-modal

# Backup .replit file
mv .replit .replit.backup

# Replace vite.config.ts
cp vite.config.railway.ts vite.config.ts
```

### Option B: Manual

1. Open `package.json`
2. Remove these lines from `devDependencies`:
   ```json
   "@replit/vite-plugin-cartographer": "^0.3.0",
   "@replit/vite-plugin-runtime-error-modal": "^0.0.3",
   ```
3. Run `npm install`
4. Update `vite.config.ts` (see `vite.config.railway.ts` for reference)

### Update Vite Config

Replace your current [vite.config.ts](vite.config.ts) with:

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    strictPort: false,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
```

## Part 4: Verify Everything Works (3 minutes)

### 1. Test Local Build

```bash
# Type check
npm run check

# Build production assets
npm run build

# Test production mode locally
npm run start
```

### 2. Test Railway Deployment

```bash
# Push to GitHub (triggers Railway deploy)
git add .
git commit -m "chore: migrate to Railway"
git push origin main

# Watch deployment
railway logs --follow
```

### 3. Verify Production

Visit your Railway app URL and test:
- [ ] Login works
- [ ] Database queries work
- [ ] File uploads work (if using GCS)
- [ ] OpenAI API calls work

## Daily Workflow

### Development

```bash
# Start working
git checkout -b feature/new-feature
npm run dev

# Make changes, test locally

# Commit and push
git add .
git commit -m "feat: add new feature"
git push origin feature/new-feature

# Create PR on GitHub
gh pr create  # if you have GitHub CLI
```

### Deployment

Railway auto-deploys when you merge to `main`:

```bash
# Merge PR on GitHub
# Railway automatically:
# 1. Detects the push
# 2. Runs npm run build
# 3. Deploys with npm run start
```

### View Logs

```bash
# Real-time logs
railway logs --follow

# Or visit Railway dashboard
railway open
```

## VS Code Setup (Bonus)

VS Code configuration files have been created in `.vscode/`:

### Recommended Extensions

Open VS Code and install recommended extensions (will prompt automatically):
- Tailwind CSS IntelliSense
- ESLint
- Prettier
- ES7+ React snippets

Or install via command:
```bash
code --install-extension bradlc.vscode-tailwindcss
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension dsznajder.es7-react-js-snippets
```

### Debugging

Press F5 in VS Code to start debugging, or:

1. Go to "Run and Debug" panel (Cmd+Shift+D)
2. Select "Debug Server"
3. Press F5

## Troubleshooting

### Port Already in Use

```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Or use a different port
PORT=5001 npm run dev
```

### Database Connection Fails

```bash
# Test Railway database connection
railway run psql $DATABASE_URL -c "SELECT version();"

# Or connect to Railway database from local
railway run npm run dev
```

### Railway Build Fails

```bash
# View build logs
railway logs --build

# Common fix: ensure environment variables are set
railway variables
```

### Can't Push Schema

```bash
# Make sure DATABASE_URL is set
echo $DATABASE_URL

# Use Railway database
railway run npm run db:push

# Or set it in .env and run locally
npm run db:push
```

## Next Steps

- [ ] Read full [RAILWAY_SETUP.md](RAILWAY_SETUP.md) for detailed documentation
- [ ] Set up custom domain in Railway dashboard
- [ ] Configure monitoring (Sentry, LogTail)
- [ ] Set up database backups
- [ ] Add GitHub Actions for CI/CD
- [ ] Update team documentation

## Need Help?

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Check [RAILWAY_SETUP.md](RAILWAY_SETUP.md) for detailed guides

## Cost Estimate

Railway pricing (as of 2025):
- **Hobby Plan**: $5/month + usage
- **PostgreSQL**: ~$5-10/month (based on storage)
- **Web Service**: ~$5-15/month (based on usage)

**Total**: ~$15-30/month (vs Replit's $20+/month)

Free tier: $5 credit/month (good for small projects)

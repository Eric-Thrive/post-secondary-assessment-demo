# Migration Summary: Replit → Railway + VS Code

## What's Been Prepared

### 1. Documentation Created ✅

- **[QUICKSTART_RAILWAY.md](QUICKSTART_RAILWAY.md)** - 15-minute fast-track setup guide
- **[RAILWAY_SETUP.md](RAILWAY_SETUP.md)** - Comprehensive migration guide with troubleshooting
- **[MIGRATION_SUMMARY.md](MIGRATION_SUMMARY.md)** - This file (overview)

### 2. VS Code Configuration ✅

Created in [.vscode/](.vscode/):
- **settings.json** - TypeScript, Prettier, ESLint, Tailwind config
- **extensions.json** - Recommended extensions list
- **launch.json** - Debug configurations for Node.js

### 3. Railway Configuration ✅

- **[railway.toml](railway.toml)** - Railway build and deploy configuration
- **[vite.config.railway.ts](vite.config.railway.ts)** - Clean Vite config without Replit plugins

### 4. Updated Documentation ✅

- **[CLAUDE.md](CLAUDE.md)** - Added Railway deployment info
- **[README.md](README.md)** - Updated with Railway quick start
- **[.gitignore](.gitignore)** - Updated to preserve VS Code config files

## What You Need to Do

### Phase 1: Railway Setup (15 minutes)

Follow [QUICKSTART_RAILWAY.md](QUICKSTART_RAILWAY.md):

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **Create Railway Project**
   ```bash
   railway login
   railway init
   ```

3. **Add PostgreSQL Database**
   ```bash
   railway add --database postgres
   ```

4. **Set Environment Variables**
   ```bash
   railway variables set OPENAI_API_KEY="your-key"
   railway variables set SESSION_SECRET="$(openssl rand -base64 32)"
   railway variables set APP_ENVIRONMENT="railway"
   railway variables set NODE_ENV="production"
   ```

5. **Deploy**
   ```bash
   railway up
   ```

### Phase 2: Local Development (10 minutes)

1. **Create Local `.env`**
   ```bash
   cp .env.example .env
   # Edit with your values
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Push Database Schema**
   ```bash
   # Option A: Use Railway database
   railway run npm run db:push

   # Option B: Use local PostgreSQL
   npm run db:push
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

### Phase 3: Remove Replit Dependencies (5 minutes)

1. **Remove Replit Packages**
   ```bash
   npm uninstall @replit/vite-plugin-cartographer @replit/vite-plugin-runtime-error-modal
   ```

2. **Replace Vite Config**
   ```bash
   cp vite.config.railway.ts vite.config.ts
   ```

3. **Archive .replit File**
   ```bash
   mv .replit .replit.backup
   ```

4. **Test Build**
   ```bash
   npm run check
   npm run build
   ```

### Phase 4: Verify & Deploy (5 minutes)

1. **Commit Changes**
   ```bash
   git add .
   git commit -m "chore: migrate to Railway and VS Code"
   git push origin main
   ```

2. **Watch Deployment**
   ```bash
   railway logs --follow
   ```

3. **Test Production**
   - Visit your Railway URL
   - Test login functionality
   - Test document upload
   - Test AI report generation

## Key Differences: Replit vs Railway

| Aspect | Replit | Railway |
|--------|--------|---------|
| **Development** | Cloud IDE | Local VS Code |
| **Database** | Managed PostgreSQL 16 | Managed PostgreSQL 16 |
| **Deployment** | Auto (on save) | Auto (on git push) |
| **Cost** | $20+/month | $15-30/month |
| **Build Speed** | 2-3 min | 1-2 min |
| **Cold Start** | ~10s | ~2s |
| **Custom Domain** | Yes | Yes (free SSL) |
| **CLI** | Limited | Full-featured |

## Files Modified

### New Files
- `.vscode/settings.json`
- `.vscode/extensions.json`
- `.vscode/launch.json`
- `railway.toml`
- `vite.config.railway.ts`
- `QUICKSTART_RAILWAY.md`
- `RAILWAY_SETUP.md`
- `MIGRATION_SUMMARY.md`

### Updated Files
- `CLAUDE.md` - Added Railway deployment info
- `README.md` - Added Railway quick start
- `.gitignore` - Updated to preserve VS Code config

### Files to Archive (Don't Delete Yet)
- `.replit` → `.replit.backup` (after successful migration)

### Files to Remove Eventually
- `@replit/vite-plugin-cartographer` (from package.json)
- `@replit/vite-plugin-runtime-error-modal` (from package.json)

## Environment Variable Mapping

| Replit | Railway | Description |
|--------|---------|-------------|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` | Auto-injected by Railway |
| `OPENAI_API_KEY` | `OPENAI_API_KEY` | Set manually |
| `SESSION_SECRET` | `SESSION_SECRET` | Generate new for production |
| `APP_ENVIRONMENT=replit-prod` | `APP_ENVIRONMENT=railway` | Update value |
| `NODE_ENV` | `NODE_ENV` | Same |

## Development Workflow Changes

### Old (Replit)
1. Edit code in Replit IDE
2. Auto-save triggers reload
3. Test in Replit preview
4. Commit via Replit Git panel

### New (Railway + VS Code)
1. Edit code in VS Code locally
2. Hot reload via Vite (instant)
3. Test at `localhost:5000`
4. Commit and push to GitHub
5. Railway auto-deploys on push to `main`

## VS Code Extensions to Install

Open VS Code and install these (will prompt automatically):

1. **Tailwind CSS IntelliSense** - Autocomplete for Tailwind classes
2. **ESLint** - Linting and code quality
3. **Prettier** - Code formatting
4. **ES7+ React/Redux snippets** - React code snippets
5. **GitLens** - Enhanced Git integration
6. **PostgreSQL** - Database management (optional)

Or install via CLI:
```bash
code --install-extension bradlc.vscode-tailwindcss
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension dsznajder.es7-react-js-snippets
code --install-extension eamodio.gitlens
```

## Debugging in VS Code

Press **F5** to start debugging, or:

1. Open "Run and Debug" panel (⇧⌘D)
2. Select "Debug Server"
3. Press F5
4. Set breakpoints in your code
5. Step through execution

## Common Commands Reference

### Railway
```bash
# Login
railway login

# Link project
railway link

# View environment variables
railway variables

# Set variable
railway variables set KEY=value

# Deploy
railway up

# Logs (real-time)
railway logs --follow

# Open dashboard
railway open

# Run command with Railway env
railway run npm run db:push
```

### Local Development
```bash
# Start dev server
npm run dev

# Type check
npm run check

# Build for production
npm run build

# Start production locally
npm run start

# Database operations
npm run db:push                # Push schema
npx drizzle-kit generate       # Generate migrations
npx drizzle-kit studio         # Open DB GUI
```

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/your-feature

# Make changes and commit
git add .
git commit -m "feat: your feature"

# Push and create PR
git push origin feature/your-feature

# Merge to main (triggers Railway deploy)
git checkout main
git merge feature/your-feature
git push origin main
```

## Testing Checklist

After migration, test these critical paths:

- [ ] Homepage loads correctly
- [ ] User login/authentication works
- [ ] K-12 assessment creation
- [ ] Post-secondary assessment creation
- [ ] Document upload (PDF, DOCX)
- [ ] AI report generation
- [ ] Report export (PDF, Word)
- [ ] Database queries (lookup tables)
- [ ] Session persistence
- [ ] Environment switcher
- [ ] PI Redactor integration (if using)

## Rollback Plan

If something goes wrong:

1. **Railway Issues**
   - Replit is still running (don't shut down yet)
   - Railway dashboard has rollback feature
   - Or redeploy previous commit: `railway up --service <service-id>`

2. **Local Development Issues**
   - Restore `.replit` file: `mv .replit.backup .replit`
   - Restore Replit plugins: `npm install @replit/vite-plugin-cartographer @replit/vite-plugin-runtime-error-modal`
   - Restore old `vite.config.ts` from git history

3. **Database Issues**
   - Railway PostgreSQL is separate from Replit
   - Can switch `DATABASE_URL` back to Replit temporarily
   - Export data: `pg_dump $DATABASE_URL > backup.sql`
   - Import data: `psql $NEW_DATABASE_URL < backup.sql`

## Support & Resources

### Railway
- Docs: https://docs.railway.app
- Discord: https://discord.gg/railway
- Status: https://status.railway.app
- CLI Docs: https://docs.railway.app/guides/cli

### VS Code
- Docs: https://code.visualstudio.com/docs
- TypeScript: https://code.visualstudio.com/docs/languages/typescript
- Debugging: https://code.visualstudio.com/docs/editor/debugging

### Project
- Main Docs: [CLAUDE.md](CLAUDE.md)
- Quick Start: [QUICKSTART_RAILWAY.md](QUICKSTART_RAILWAY.md)
- Full Guide: [RAILWAY_SETUP.md](RAILWAY_SETUP.md)

## Next Steps After Migration

1. **Monitor Performance**
   - Watch Railway logs for first 24 hours
   - Compare cold start times vs Replit
   - Monitor database connection pooling

2. **Set Up Custom Domain** (Optional)
   - Add domain in Railway dashboard
   - Configure DNS records
   - Railway provides free SSL

3. **Add Monitoring** (Optional)
   - Sentry for error tracking
   - LogTail for log management
   - Datadog for APM

4. **Database Backups**
   - Railway provides automatic backups
   - Set up additional backup strategy if needed
   - Test restore process

5. **CI/CD Pipeline** (Optional)
   - Add GitHub Actions for tests
   - Run `npm run check` on PRs
   - Add build verification

6. **Team Onboarding**
   - Share this migration guide with team
   - Update internal documentation
   - Schedule training session if needed

## Estimated Timeline

- **Phase 1 (Railway Setup)**: 15 minutes
- **Phase 2 (Local Dev)**: 10 minutes
- **Phase 3 (Remove Replit)**: 5 minutes
- **Phase 4 (Verify & Deploy)**: 5 minutes

**Total**: ~35 minutes for full migration

## Cost Comparison

### Replit
- Base: $20/month
- PostgreSQL: Included
- Compute: Included
- **Total**: ~$20-30/month

### Railway
- Hobby Plan: $5/month
- PostgreSQL: ~$5-10/month (usage-based)
- Web Service: ~$5-15/month (usage-based)
- **Total**: ~$15-30/month

**Savings**: Similar cost, but Railway offers better performance and flexibility

## Success Criteria

Migration is successful when:

✅ Railway app is live and accessible
✅ Database schema is migrated
✅ All environment variables are configured
✅ Local development works in VS Code
✅ Auto-deploy from GitHub works
✅ All critical user flows tested
✅ Replit dependencies removed
✅ Team members can develop locally
✅ CI/CD pipeline is functional (if implemented)
✅ Documentation is updated

## Questions or Issues?

If you encounter problems:

1. Check [RAILWAY_SETUP.md](RAILWAY_SETUP.md) troubleshooting section
2. Check Railway logs: `railway logs --follow`
3. Verify environment variables: `railway variables`
4. Test database connection: `railway run psql $DATABASE_URL`
5. Ask in Railway Discord: https://discord.gg/railway

---

**Ready to start?** → [QUICKSTART_RAILWAY.md](QUICKSTART_RAILWAY.md)

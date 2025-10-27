# Project Overview
AI-powered educational accessibility platform that dynamically adapts support resources for diverse learning needs through intelligent semantic matching and personalized recommendations. Generates comprehensive accommodation reports for K-12 and post-secondary educational contexts.

**Core Modules:**
- **K-12 Module**: Grade-specific analysis (K-5, 6-8, 9-12, Special Ed), observation templates, barrier identification
- **Post-Secondary Module**: Higher education accommodations across Academic, Testing, Technology, and Additional Resources
- **Tutoring Module**: Specialized tutoring assessment and support recommendations
- **AI Processing Pipeline**: Multi-format document upload (PDF, DOCX, images), OCR, GPT-4 integration with function calling
- **Report Management**: Version tracking, share tokens, multi-format export (PDF, Word, JSON)

## Unified Assessment UI
- `UnifiedAssessmentForm` now supports `"k12"`, `"post_secondary"`, and `"tutoring"` modules with identical THRIVE branding (logo, gradient header, progress sidebar, gradient background, spacious white card layout).
- Tutoring assessments route through `NewTutoringAssessment`, which mirrors the post-secondary/K-12 structure and relies on `PathwaySelector` auto-selecting the simple pathway.
- Module-specific navigation still points to `/new-k12-assessment`, `/new-post-secondary-assessment`, and `/new-tutoring-assessment`; the legacy `NewAssessment` component has been removed.
- Finalized document enforcement remains in `UnifiedAssessmentForm`; users must finalize at least one upload via the PI Redactor before submission.

# Tech Stack

## Frontend
- **React 18.3.1** with **TypeScript 5.6**
- **Vite 5.4** for build/dev server
- **Tailwind CSS 3.4** with **shadcn/ui** components
- **React Router DOM 7.6** for routing
- **React Hook Form + Zod** for form validation
- **React Query 5.60** for server state
- **Framer Motion** for animations
- **Tesseract.js** for OCR, **PDF.js** for PDF extraction, **Mammoth.js** for Word docs

## Backend
- **Node.js 20+** with **Express.js 4.21**
- **TypeScript 5.6**
- **Drizzle ORM 0.39** with **PostgreSQL**
- **express-session** with PostgreSQL store
- **bcryptjs** for password hashing
- **OpenAI API 5.8** (GPT-4.1 / GPT-4o)
- **SendGrid** for email notifications
- **Google Cloud Storage** for document uploads

## Database
- **PostgreSQL 16** (Railway or Replit-managed)
- **Drizzle ORM** with migrations
- Multi-tenancy support with customer isolation
- Session-based authentication

## Deployment & Hosting
- **Railway** (recommended) - Managed PostgreSQL, auto-deploy from GitHub
- **Alternative**: Replit (legacy), Neon, Supabase
- **Local Development**: VS Code with Railway CLI

## Build & Dev Tools
- **Vite** (frontend), **esbuild** (backend)
- **drizzle-kit** for migrations
- **tsx** for TypeScript execution
- **PostCSS + Autoprefixer**

# Code Style & Conventions
- Use **TypeScript** strictly across full stack
- Prefer **functional React components** with hooks
- Use **Tailwind CSS** utility classes (avoid inline styles)
- Follow **shadcn/ui** component patterns
- Name branches: `feature/<topic>`, `fix/<issue>`, `refactor/<area>`
- Use **Conventional Commits** format:
  - `feat:` new features
  - `fix:` bug fixes
  - `refactor:` code restructuring
  - `docs:` documentation changes
  - `test:` adding/updating tests
- Keep functions small and focused (single responsibility)
- Use descriptive variable names (avoid abbreviations)
- Add JSDoc comments for complex functions
- Prefer `const` over `let`, avoid `var`

# Environment Setup

## Quick Start Options

### Option 1: Railway (Recommended)
See [QUICKSTART_RAILWAY.md](QUICKSTART_RAILWAY.md) for 15-minute setup guide.

### Option 2: Local Development

## Prerequisites
- Node.js 20+
- PostgreSQL 16 (optional if using Railway database)
- npm or pnpm
- Railway CLI (optional): `npm install -g @railway/cli`

## Initial Setup
```bash
# Clone repository
git clone <repo-url>
cd post-secondary-assessment-demo

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Configure .env with your values:
# - DATABASE_URL (Neon PostgreSQL connection string)
# - OPENAI_API_KEY
# - SESSION_SECRET (random string)
# - APP_ENVIRONMENT (development, production, post-secondary-demo, k12-demo, tutoring-demo)
# - NODE_ENV (development or production)
# - PORT (5001 - to avoid macOS ControlCenter conflict on 5000)

# Push database schema
npm run db:push

# Start development server
npm run dev
# Runs on http://localhost:5001
```

## Environment Variables
Required in `.env`:
- `DATABASE_URL` - Neon PostgreSQL connection string (all environments use same database)
- `OPENAI_API_KEY` - OpenAI API key for GPT-4
- `SESSION_SECRET` - Random string for session encryption
- `APP_ENVIRONMENT` - Options: `development`, `production`, `post-secondary-demo`, `k12-demo`, `tutoring-demo`
- `NODE_ENV` - `development` or `production`
- `PORT` - Default: `5001` (avoid macOS ControlCenter conflict on port 5000)
- `VITE_PI_REDACTOR_URL` - URL to PI Redactor tool (optional)

**Login redirects & cookies**:
- `LOGIN_REDIRECT_DEFAULT_URL` – fallback path when no demo/role match
- `LOGIN_REDIRECT_POST_SECONDARY_DEMO_URL`, `LOGIN_REDIRECT_K12_DEMO_URL`, `LOGIN_REDIRECT_TUTORING_DEMO_URL`
- `LOGIN_REDIRECT_ROLE_SYSTEM_ADMIN_URL`, `LOGIN_REDIRECT_ROLE_CUSTOMER_ADMIN_URL`, `LOGIN_REDIRECT_ROLE_TUTOR_URL`
- Optional cross-subdomain session config: `SESSION_COOKIE_DOMAIN`, `SESSION_COOKIE_SAMESITE`

**Note**: All environments (dev, prod, demo) use the same Neon database. The `APP_ENVIRONMENT` variable controls application behavior (demo mode = read-only, production = full access).

# Testing Guidelines

## Current Status
⚠️ **No formal testing framework currently configured**

## Testing Recommendations (To Be Implemented)
- Add **Vitest** for frontend unit/integration tests
- Add **React Testing Library** for component tests
- Add **Playwright** or **Cypress** for E2E tests
- Target 80%+ coverage for new code
- Tests should live alongside source files or in `__tests__/` directories

## Manual Testing Artifacts
- `test-ai-handler.sh` - Bash script for AI response testing
- `test-cascade-inference.md` - Test documentation
- `test-k12-simple-pathway.md` - Test scenario docs
- Scripts in `scripts/` for data testing

# Development Workflow

## Daily Development
1. Pull latest from `main` before starting work
2. Create feature branch: `git checkout -b feature/<name>`
3. Make changes and test locally
4. Run type checking: `npm run check`
5. Commit with descriptive messages
6. Push and create PR to `main`
7. Ensure PR passes all checks before merging
8. Always sync from `main` before PR submission

## Database Changes
```bash
# Modify schema in shared/schema.ts
# Push changes to database (applies to the single shared database)
npm run db:push

# For production deployments, generate migration files for version control
npx drizzle-kit generate
# Review migration SQL in migrations/
# Apply migration: npm run db:push (or run migration in production CI/CD)
```

**Note**: All environments use the same database. Schema changes via `db:push` apply to that database immediately. Migrations are for version control and reproducible deployments, not for separating dev/prod databases.

## Code Review Checklist
- TypeScript types are properly defined
- No `any` types unless absolutely necessary
- Components follow existing patterns
- Error handling is comprehensive
- Database queries use Drizzle ORM properly
- Authentication/authorization checks in place
- Customer isolation maintained (multi-tenancy)
- No sensitive data in logs or responses

# Common Commands

```bash
# Development
npm run dev              # Start dev server (port 5000)
npm run check            # TypeScript type checking

# Database
npm run db:push          # Push schema changes to database
npx drizzle-kit generate # Generate migration files
npx drizzle-kit studio   # Open Drizzle Studio (DB GUI)

# Production Build
npm run build            # Build frontend (Vite) + backend (esbuild)
npm run start            # Start production server

# Utilities
npx tsx scripts/<script>.ts  # Run TypeScript scripts
```

# Database Schema Overview

## Core Tables
- `users` - User accounts with role-based access (system_admin, customer_admin, tutor)
- `sessions` - Express session store
- `assessmentCases` - Main case records with UUID-based tracking
- `promptSections` - Database-driven AI prompt management
- `aiConfig` - OpenAI configuration and model settings
- `lookupTables` - K-12 and post-secondary lookup data
- `accommodationMappings` - Barrier-to-accommodation mappings
- `reportVersions` - Finalized report versions with change history

## Key Features
- **Multi-tenancy**: Customer isolation via `customerId`
- **Version tracking**: Report versions with finalization workflow
- **Role-based access**: System admin, customer admin, tutor roles
- **Demo permissions**: JSON-based flexible access control
- **Type safety**: Drizzle-zod integration

# Migration from Replit

## Replit-Specific Dependencies to Remove/Replace

### 1. Vite Plugins (Dev Dependencies)
```json
// Remove from package.json devDependencies:
"@replit/vite-plugin-cartographer": "^0.3.0"
"@replit/vite-plugin-runtime-error-modal": "^0.0.3"
```
**Action**: Remove from `vite.config.ts` and uninstall

### 2. Replit Configuration Files
```
.replit           # Delete after migration
.env.replit       # Delete (if exists)
```

### 3. Database Migration
**Current**: Replit PostgreSQL 16
**Options**:
- **Neon** (recommended): Serverless PostgreSQL, already supported in code
- **Supabase**: Already supported in code
- **Railway/Render**: Managed PostgreSQL
- **Self-hosted**: AWS RDS, GCP Cloud SQL, etc.

**Steps**:
1. Export data: `pg_dump $DATABASE_URL > backup.sql`
2. Create new database on target platform
3. Import data: `psql $NEW_DATABASE_URL < backup.sql`
4. Update `DATABASE_URL` in `.env`
5. Update `APP_ENVIRONMENT` to match new platform

### 4. Google Cloud Storage
**Current**: Via Replit integration `javascript_object_storage`
**Migration**: Already using `@google-cloud/storage` directly
**Action**:
- Obtain GCP service account credentials JSON
- Set `GOOGLE_APPLICATION_CREDENTIALS` environment variable
- Or set credentials in code via `new Storage({ keyFilename: '...' })`

### 5. SendGrid
**Current**: Via Replit integration `javascript_sendgrid`
**Migration**: Already using `@sendgrid/mail` directly
**Action**:
- Ensure `SENDGRID_API_KEY` is set in environment
- No code changes needed

### 6. Port Configuration
**Current**: Multiple port mappings in `.replit`
**Action**: Single port deployment (default 5000)
- Remove port configuration complexity
- Most platforms auto-assign ports

## Target Platform Recommendations

### Option A: Railway (Easiest Migration)
✅ Node.js + Express works out of the box
✅ Managed PostgreSQL included
✅ GitHub auto-deploy
✅ Environment variable management
✅ No code changes needed

### Option B: Render
✅ Similar to Railway
✅ Free tier for PostgreSQL
✅ Native Dockerfile support
✅ Health checks built-in

### Option C: Vercel
⚠️ Requires serverless refactor OR standalone mode
✅ Excellent for frontend + Neon PostgreSQL
✅ Fastest CDN and edge network
⚠️ Long-running processes (AI calls) may hit timeout limits

### Option D: AWS/GCP/Azure
✅ Production-grade scalability
✅ Full control
⚠️ More complex setup (ECS, App Engine, Cloud Run)
✅ Already using Google Cloud Storage

## Migration Checklist

- [ ] Remove Replit Vite plugins from `package.json` and `vite.config.ts`
- [ ] Delete `.replit` file
- [ ] Set up new PostgreSQL database (Neon/Supabase/Railway)
- [ ] Export and migrate database data
- [ ] Update `DATABASE_URL` in new environment
- [ ] Update `APP_ENVIRONMENT` variable
- [ ] Configure Google Cloud Storage credentials
- [ ] Configure SendGrid API key
- [ ] Set `SESSION_SECRET` for production
- [ ] Update `NODE_ENV=production`
- [ ] Test build process: `npm run build`
- [ ] Test production start: `npm run start`
- [ ] Configure health check endpoint (if needed)
- [ ] Set up CI/CD pipeline (GitHub Actions recommended)
- [ ] Configure domain and SSL
- [ ] Set up monitoring and error tracking
- [ ] Add formal testing framework (Vitest + Playwright)
- [ ] Update documentation with new deployment process

# Review Process

Before merging PRs:
1. **Type checking passes**: `npm run check`
2. **Build succeeds**: `npm run build`
3. **Manual testing complete**: Test affected user flows
4. **Code review approved**: At least one reviewer
5. **Naming and structure follow conventions**
6. **Database migrations reviewed** (if applicable)
7. **No sensitive data exposed** (check logs, responses)
8. **Customer isolation maintained** (multi-tenancy checks)
9. **Update documentation** as needed
10. **No Replit-specific dependencies introduced**

# Security & Compliance

## Critical Security Rules
- **Never commit** `.env`, credentials, API keys
- **Never log** sensitive user data (PII, assessment details)
- **Always validate** user input with Zod schemas
- **Always enforce** customer isolation in queries
- **Always use** parameterized queries (Drizzle handles this)
- **Always check** authentication and authorization
- **Hash passwords** with bcryptjs (never store plaintext)
- **Use HTTPS** in production (required)

## PII Handling
This application processes educational assessments containing:
- Student names and identifiers
- Medical/psychological information
- Educational records

**Requirements**:
- Encrypt data at rest and in transit
- Implement audit logging for access
- Follow FERPA/COPPA compliance guidelines
- Provide data export/deletion capabilities

## Dependency Management
```bash
# Check for vulnerabilities regularly
npm audit

# Update dependencies
npm update

# Review breaking changes before major updates
```

# Architecture Notes

## Monorepo Structure (October 2025 Refactor)
The project was refactored in October 2025 to use a tool-driven monorepo structure managed by **Turborepo**. This provides significant performance gains via caching and improves organization and scalability.

The structure is now organized into `apps` and `packages`:
```
/
├── apps/
│   ├── web/      # The React frontend application
│   └── server/   # The Express backend server
├── packages/
│   ├── db/       # Drizzle ORM schema and database utilities
│   ├── ui/       # Shared React components (e.g., buttons, cards)
│   └── config/   # Shared configurations (ESLint, TSConfig, etc.)
├── package.json  # Root configuration
└── turbo.json    # Turborepo pipeline configuration
```

- **`apps`**: Contain the actual runnable applications.
- **`packages`**: Contain reusable code (libraries, configs) that the apps depend on.

## Key Design Patterns
- **Multi-tenancy**: Customer isolation at database level
- **Session-based auth**: PostgreSQL session store
- **Database-driven prompts**: Real-time AI prompt updates
- **Function calling**: OpenAI function calling for structured output
- **Client-side processing**: PDF/OCR processing in browser
- **Cascade inference**: Multi-stage AI content generation
- **Version control**: Report finalization with history

## Performance Considerations

### Long-Running Operations
- OpenAI API calls can be long-running (30s-2min for full reports)
- Consider implementing job queue for async processing (Bull, BullMQ)
- PDF processing in browser reduces server load
- Use connection pooling for PostgreSQL
- Implement caching for lookup tables and static data

### Caching & Performance Optimizations (Oct 2025)

**Browser Caching Strategy**
- HTML files: `no-cache` headers (always fresh)
- JS/CSS assets: 1-day cache with ETags for smart validation
- Static assets: Optimized with proper cache headers
- Prevents stale content issues during development

**Code Splitting**
- React vendor bundle: ~350KB (React, React DOM, React Router)
- UI vendor bundle: ~112KB (Radix UI components)
- Query vendor bundle: React Query separate
- Markdown vendor bundle: react-markdown + remark-gfm separate
- Main app bundle: Smaller, faster initial load

**Build Optimizations**
- esbuild minification for fastest builds
- ES2020 target for modern browsers
- Optimized dependency pre-bundling
- Removed Replit-specific scripts (banner, etc.)

**Development Server**
- Cache-busting query parameters on HTML
- Proper cache control headers on all responses
- Hot Module Replacement (HMR) for fast iteration

### Performance Troubleshooting

**Slow Loading Without Cache Clear?**
See [PERFORMANCE_TIPS.md](PERFORMANCE_TIPS.md) for:
- Hard refresh shortcuts (Cmd+Shift+R / Ctrl+Shift+R)
- Browser cache clearing methods
- Environment reset procedures
- Server management commands

**Kill Multiple Dev Servers**
```bash
# Kill all processes on port 5001
lsof -ti:5001 | xargs kill -9

# Clean restart sequence
lsof -ti:5001 | xargs kill -9
sleep 2
unset APP_ENVIRONMENT
npm run dev
```

**Unstyled/No CSS Rendering Issues**

If you see content without styling (text squeezed in a column, no colors/spacing):

1. **Check Browser Console for JavaScript Errors**
   - Open DevTools (F12) → Console tab
   - Scroll to top or clear console and refresh
   - Look for RED error messages
   - JavaScript errors can prevent React components from rendering properly

2. **Verify CSS is Loading**
   - Open DevTools (F12) → Network tab
   - Refresh page (Cmd/Ctrl+R)
   - Filter by "css"
   - Look for `index.css` - should show Status 200 or 304
   - If missing or failed (red), check Vite server logs

3. **Check Element Classes**
   - Open DevTools (F12) → Elements tab
   - Use element picker (cursor icon) to select visible element
   - Verify elements have Tailwind classes (e.g., `class="p-12 cursor-pointer"`)
   - If no classes, React components aren't rendering
   - If classes exist but no styling, CSS isn't being applied

4. **Force CSS Rebuild**
   ```bash
   # Touch CSS file to trigger rebuild
   touch apps/web/src/index.css

   # Hard refresh browser
   # Mac: Cmd+Shift+R
   # Windows/Linux: Ctrl+Shift+R
   ```

5. **Common Root Causes**
   - JavaScript errors in Console preventing component render
   - Browser cache serving stale/broken CSS (hard refresh needed)
   - Multiple dev servers running (kill and restart)
   - Vite not processing Tailwind directives (check Vite logs)

**Common Issues**
- Multiple server instances causing port conflicts
- Stale localStorage causing wrong environment
- Shell environment variables overriding .env
- Browser cache showing old version
- JavaScript errors preventing React component rendering
- CSS file loaded but Tailwind classes not applied

# Support & Documentation

## Useful Resources
- **Drizzle ORM**: https://orm.drizzle.team/
- **shadcn/ui**: https://ui.shadcn.com/
- **OpenAI API**: https://platform.openai.com/docs
- **React Query**: https://tanstack.com/query/latest

## Getting Help
- Check existing documentation in `docs/` (if exists)
- Review test scenarios in `test-*.md` files
- Check scripts in `scripts/` for examples
- Review existing similar features for patterns

## Contributing
When adding new features:
1. Follow existing patterns in the codebase
2. Add TypeScript types for everything
3. Update this document if adding new conventions
4. Consider multi-tenancy implications
5. Test with different user roles
6. Verify customer isolation works correctly

# THRIVE AI-Powered Educational Accessibility Platform - Project Context

## Project Overview

AI-powered educational accessibility platform that dynamically adapts support resources for diverse learning needs through intelligent semantic matching and personalized recommendations. Generates comprehensive accommodation reports for K-12 and post-secondary educational contexts.

## Core Architecture

### Three-Module System

1. **K-12 Module**: Grade-specific analysis (K-5, 6-8, 9-12, Special Ed), observation templates, barrier identification
2. **Post-Secondary Module**: Higher education accommodations across Academic, Testing, Technology, and Additional Resources
3. **Tutoring Module**: Specialized tutoring assessment and support recommendations

### Technology Stack

- **Frontend**: React 18.3.1 + TypeScript 5.6, Vite 5.4, Tailwind CSS + shadcn/ui, React Router DOM 7.6
- **Backend**: Node.js 20+ + Express.js 4.21, TypeScript 5.6, Drizzle ORM 0.39 + PostgreSQL
- **AI**: OpenAI API 5.8 (GPT-4.1 / GPT-4o) with function calling
- **Database**: PostgreSQL 16 (Railway/Neon), multi-tenancy with customer isolation
- **Deployment**: Railway (primary), Vercel/Neon (alternative)

### Monorepo Structure (October 2025 Refactor)

```
/
├── apps/
│   ├── web/      # React frontend application
│   └── server/   # Express backend server
├── packages/
│   ├── db/       # Drizzle ORM schema and database utilities
│   ├── ui/       # Shared React components
│   └── config/   # Shared configurations
├── turbo.json    # Turborepo pipeline configuration
```

## Key Features Implemented

### Authentication & User Management

- **Session-based authentication** with PostgreSQL store
- **Role-based access control**: system_admin, customer_admin, tutor, customer, demo
- **Multi-tenancy**: Customer isolation at database level
- **Demo environments**: K-12, Post-Secondary, Tutoring demos

### UI/UX Design System

- **THRIVE Branding**: Consistent orange/blue color scheme, custom logo
- **Unified Assessment Form**: Identical branding across all modules
- **Home Screen**: Standardized design with "New Report" and "View Reports" cards
- **Module Dashboard**: Admin interface for module selection
- **Responsive Design**: Mobile-friendly across all components

### Assessment Processing Pipeline

- **Multi-format uploads**: PDF, DOCX, images with client-side processing
- **PI Redaction**: Mandatory PII redaction via external service
- **AI Processing**: GPT-4 with function calling for structured output
- **Cascade Inference**: Multi-stage AI content generation
- **Report Management**: Version tracking, share tokens, multi-format export

### Current Implementation Status

#### ✅ Completed Features

- **Authentication System**: Login/logout, session management, role-based access
- **Home Screen**: THRIVE-branded dashboard with navigation cards
- **Module Architecture**: Three-module system with shared components
- **Database Schema**: Multi-tenant PostgreSQL with Drizzle ORM
- **AI Integration**: OpenAI GPT-4 with function calling
- **Document Processing**: PDF/DOCX upload and text extraction
- **Report Generation**: AI-powered accommodation reports
- **Admin Features**: Environment switching, user management
- **Deployment**: Railway hosting with automated CI/CD

#### 🚧 In Progress (Current Session)

- **Login Flow**: Fixed authentication redirect issues
- **Module Dashboard**: Implementing proper admin module selector
- **User Role Detection**: System admin users see module picker vs regular dashboard

#### 📋 Planned Features (From Specs)

- **Registration System**: Email confirmation, role selection (demo vs customer)
- **Stripe Integration**: Payment processing for customer accounts
- **Module Selection**: Enhanced module picker for multi-module users
- **Enhanced Admin Features**: User management, organization management
- **Testing Framework**: Vitest + Playwright for comprehensive testing

## Design Patterns & Conventions

### Code Style

- **TypeScript strict mode** across full stack
- **Functional React components** with hooks
- **Tailwind CSS utility classes** (avoid inline styles)
- **shadcn/ui component patterns**
- **Conventional Commits**: feat:, fix:, refactor:, docs:, test:

### Security & Compliance

- **FERPA compliance** for educational data
- **HIPAA compliance preparation** for healthcare data
- **Mandatory PI redaction** via external service
- **Customer data isolation** in multi-tenant setup
- **Session-based auth** with secure cookies

### Performance Optimizations

- **Code splitting**: React vendor, UI vendor, query vendor bundles
- **Caching strategy**: Browser caching with ETags, connection pooling
- **Build optimizations**: esbuild minification, ES2020 target
- **Client-side processing**: PDF/OCR processing reduces server load

## Environment Configuration

### Production

```bash
APP_ENVIRONMENT=production
NODE_ENV=production
DATABASE_URL=postgresql://...
OPENAI_API_KEY=sk-...
SESSION_SECRET=random-string
PORT=5001
```

### Demo Environments

- `k12-demo`: K-12 module demonstration
- `post-secondary-demo`: Post-secondary module demonstration
- `tutoring-demo`: Tutoring module demonstration

## Migration History

- **October 2025**: Migrated from Replit to Railway hosting
- **October 2025**: Refactored to Turborepo monorepo structure
- **October 2025**: Implemented unified THRIVE branding across all modules
- **October 2025**: Enhanced performance with code splitting and caching

## Current Development Context

### User Roles & Access

- **system_admin** (like Pippa): Should see ModuleDashboard with module picker
- **Regular users**: See WelcomeDashboard with New Report/View Reports cards
- **Demo users**: Limited access with read-only permissions

### Recent Changes Made

1. **Fixed login redirect**: Removed server redirect URL to prevent routing to non-existent pages
2. **Enhanced Index component**: Detects admin users and shows appropriate dashboard
3. **Updated ProtectedRoute**: Now redirects to /login instead of inline form
4. **Created SimpleLogin**: New unified login page with THRIVE branding

### Known Issues Being Addressed

- **Module Dashboard Types**: Need to properly handle legacy user types vs AuthenticatedUser
- **Registration Flow**: Need to implement email confirmation and Stripe integration
- **Admin Features**: Need to complete admin dashboard functionality

## Development Workflow

### Daily Development

1. Pull latest from `main`
2. Create feature branch: `git checkout -b feature/<name>`
3. Make changes and test locally with `npm run dev`
4. Run type checking: `npm run check`
5. Commit with descriptive messages
6. Push and create PR to `main`

### Database Changes

```bash
# Modify schema in packages/db/schema.ts
npm run db:push  # Push changes to database
npx drizzle-kit generate  # Generate migration files
```

### Common Commands

```bash
npm run dev              # Start dev server
npm run check            # TypeScript type checking
npm run build            # Build for production
npm run start            # Start production server
npx drizzle-kit studio   # Open database GUI
```

## Support Resources

- **Drizzle ORM**: https://orm.drizzle.team/
- **shadcn/ui**: https://ui.shadcn.com/
- **OpenAI API**: https://platform.openai.com/docs
- **React Query**: https://tanstack.com/query/latest

---

_Last Updated: October 28, 2025_
_Context compiled from project specifications and current implementation_

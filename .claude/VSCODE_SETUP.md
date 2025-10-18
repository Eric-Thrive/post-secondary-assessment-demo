# VS Code Development Environment Setup

This document describes the comprehensive VS Code setup configured for this project, optimized for Claude Code AI-assisted development.

## Overview

This project has been configured with a Replit-like development experience, including:
- Auto-save and live preview
- Visual development tools (color pickers, Tailwind IntelliSense)
- Project-specific extensions and snippets
- Optimized settings for AI-assisted development

## Quick Start

1. **Install Recommended Extensions**
   - VS Code will prompt you when opening the project
   - Or: `Cmd+Shift+P` → "Extensions: Show Recommended Extensions"
   - Click "Install All" for the best experience

2. **Start Development**
   ```
   Cmd+Enter      → Start dev server
   Cmd+K Cmd+P    → Open live preview
   Cmd+'          → Toggle terminal
   ```

3. **Files Auto-Save**
   - Changes save automatically after 1 second
   - No need to manually save!

## Features Added

### 1. Replit-Like Experience
- **Auto-save**: Files save after 1 second of inactivity
- **Live Preview**: See changes instantly in VS Code
- **Integrated Terminal**: Always accessible with `Cmd+'`
- **Quick Run**: `Cmd+Enter` to start dev server
- **Tasks Menu**: Quick access to common commands

### 2. Visual Development Tools
- **Color Swatches**: Inline color previews in code
- **Color Picker**: `Cmd+Shift+C` to pick colors visually
- **Tailwind IntelliSense**: Auto-complete + hover for values
- **Auto-Sort Classes**: Tailwind classes sort on save
- **Component Snippets**: Quick component generation
- **Image Preview**: See images in code gutter
- **SVG Preview**: View SVG files inline

### 3. Project-Specific Extensions (35+)

#### Backend Development
- Node.js Azure Pack - Node.js tooling
- NPM IntelliSense - Package autocomplete
- NPM Script Runner - Run scripts from sidebar
- OpenAPI Tools - API schema validation

#### Database (PostgreSQL + Drizzle)
- PostgreSQL - Database connection
- SQL Tools - Query database directly
- Drizzle ORM support

#### React/Frontend
- React Snippets (multiple)
- Auto-close/rename JSX tags
- Tailwind CSS IntelliSense
- shadcn/ui component support

#### Visual Tools
- Color Picker & Highlight
- CSS Peek - View CSS definitions
- Image Gutter Preview
- SVG Tools

#### API Testing
- Thunder Client - Test APIs in VS Code
- REST Client - `.http` file support

#### Git & Productivity
- GitLens - Enhanced Git
- Git Graph - Visual commit history
- Error Lens - Inline errors
- Path IntelliSense

### 4. Code Snippets (25+)

#### UI Components
- `rfc` - React functional component
- `twcard` - Tailwind card
- `twbtn` - Tailwind button
- `twcontainer` - Container layout
- `twflex` - Flex center layout
- `twgrid` - Grid layout
- `shadcnDialog` - shadcn Dialog
- `shadcnInput` - Input with validation
- `cardForm` - Card with form

#### Backend Patterns
- `apiRoute` - Express API route
- `expressSession` - Route with session auth
- `authRoute` - Authenticated route
- `openaiCall` - OpenAI API call

#### Database
- `drizzleQuery` - Drizzle select
- `drizzleInsert` - Drizzle insert
- `drizzleUpdate` - Drizzle update
- `drizzleSelect` - Query with customer isolation

#### React Query
- `useQuery` - React Query hook
- `useMutation` - React Query mutation
- `useApiQuery` - API query hook
- `useMutationApi` - API mutation

#### Forms & Validation
- `shadcnForm` - Form setup
- `zodSchema` - Zod validation schema
- `zodForm` - Zod + react-hook-form

### 5. Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd+Enter` | Start dev server |
| `Cmd+K Cmd+P` | Open live preview |
| `Cmd+Shift+C` | Color picker |
| `Alt+W` | Wrap with HTML tag |
| `Ctrl+Shift+W` | Emmet wrap |
| `Alt+F12` | Peek CSS definition |
| `Cmd+'` | Toggle terminal |
| `Cmd+Shift+D` | Open Drizzle Studio |
| `Cmd+Shift+T` | Check TypeScript |
| `Cmd+Shift+B` | Build |

### 6. Project-Specific Settings

#### Path Aliases (Auto-complete)
```typescript
import { Component } from '@/components/...'  // client/src
import { schema } from '@shared/...'          // shared
import { asset } from '@assets/...'           // attached_assets
```

#### Database Connection
- Pre-configured SQLTools connection
- Uses environment variables from `.env`
- Connect to local or Railway PostgreSQL

#### NPM Scripts
- Visible in sidebar
- Quick run from Explorer
- Scripts: `dev`, `build`, `check`, `db:push`

#### REST Client
- Environment variables configured
- `local`: http://localhost:5000
- `production`: from env variable

## Configuration Files

All configuration is in `.vscode/`:
- `settings.json` - Editor and tool settings
- `extensions.json` - Recommended extensions (35+)
- `tasks.json` - Quick tasks (run, build, db, etc.)
- `launch.json` - Debug configurations
- `keybindings.json` - Custom keyboard shortcuts
- `project.code-snippets` - Project-specific code snippets
- `README.md` - Complete usage guide

## How It Helps Claude Code

### Context Awareness
Claude Code can now:
- Use project-specific patterns (Express routes, Drizzle queries)
- Reference correct import paths (@, @shared, @assets)
- Apply consistent code style (auto-format, Tailwind sorting)
- Generate code matching your tech stack

### Better Code Generation
When you ask Claude to:
- "Create an Express route" → Uses `expressSession` pattern
- "Add database query" → Uses `drizzleSelect` with customer isolation
- "Build a form" → Uses `zodForm` + `cardForm` patterns
- "Call OpenAI API" → Uses `openaiCall` pattern

### Visual Feedback Loop
1. Ask Claude to create/modify UI
2. Code appears → Auto-saves
3. Preview updates instantly
4. See colors/spacing → Ask for adjustments
5. Repeat until perfect

## Tech Stack Reference

This setup is optimized for:
- **Backend**: Express.js + TypeScript + Drizzle ORM
- **Frontend**: React 18 + Vite + shadcn/ui + Tailwind CSS
- **Database**: PostgreSQL with Drizzle ORM
- **AI**: OpenAI API (GPT-4/GPT-4o)
- **Auth**: Passport.js + express-session
- **State**: React Query (TanStack Query)
- **Forms**: react-hook-form + Zod
- **Deployment**: Railway

## Troubleshooting

### Extensions Not Loading
1. `Cmd+Shift+P` → "Extensions: Show Recommended Extensions"
2. Click "Install All"
3. Reload VS Code

### Tasks Not Working
1. Ensure you're in workspace root
2. Check `.env` file exists
3. Run `npm install` if needed

### Preview Not Updating
1. Ensure dev server is running (`Cmd+Enter`)
2. Check port 5000 is available
3. Reload preview (`Cmd+R` in preview)

### Database Connection Failed
1. Check `.env` has correct DATABASE_URL
2. Ensure PostgreSQL is running
3. For Railway: run `railway link` first

## Additional Resources

- [VS Code Tips & Tricks](https://code.visualstudio.com/docs/getstarted/tips-and-tricks)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Drizzle ORM Docs](https://orm.drizzle.team/)
- [React Query Docs](https://tanstack.com/query/latest)

## Maintenance

This setup was created on **Oct 18, 2024**.

If you need to update:
1. Extensions: Check for updates regularly
2. Settings: Edit `.vscode/settings.json`
3. Snippets: Edit `.vscode/project.code-snippets`
4. Tasks: Edit `.vscode/tasks.json`

All changes are version controlled in the `railway-deployment` branch.

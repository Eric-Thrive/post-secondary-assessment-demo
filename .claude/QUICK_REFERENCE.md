# Quick Reference - Claude Code Cheat Sheet

> One-page reference for common tasks and shortcuts

## 🚀 Quick Start

```bash
Cmd+Enter          # Start dev server
Cmd+K Cmd+P        # Open preview
Cmd+'              # Toggle terminal
Cmd+Shift+D        # Open Drizzle Studio
```

## 📝 Code Snippets (Type → Tab)

### UI Components
| Snippet | Creates |
|---------|---------|
| `rfc` | React functional component |
| `twcard` | Tailwind card |
| `twbtn` | Tailwind button |
| `cardForm` | shadcn Card with form |
| `shadcnDialog` | shadcn Dialog |
| `shadcnInput` | Input with validation |

### Backend
| Snippet | Creates |
|---------|---------|
| `expressSession` | Express route + auth |
| `apiRoute` | Express API route |
| `openaiCall` | OpenAI API call |
| `drizzleSelect` | Database query |

### React Query
| Snippet | Creates |
|---------|---------|
| `useApiQuery` | React Query hook |
| `useMutationApi` | React Query mutation |
| `zodForm` | Zod + react-hook-form |

## ⌨️ Keyboard Shortcuts

### Development
- `Cmd+Enter` - Start dev server
- `Cmd+K Cmd+P` - Live preview
- `Cmd+Shift+B` - Build
- `Cmd+Shift+T` - Type check

### Visual Tools
- `Cmd+Shift+C` - Color picker
- `Alt+W` - Wrap with tag
- `Ctrl+Shift+W` - Emmet wrap
- `Alt+F12` - Peek CSS

### Navigation
- `Cmd+P` - Quick file open
- `Cmd+Shift+F` - Search all files
- `Cmd+Click` - Go to definition
- `Cmd+B` - Toggle sidebar

### Terminal
- `Cmd+'` - Toggle terminal
- `Cmd+Shift+'` - New terminal
- `Cmd+J` - Toggle panel

## 🎯 Common Tasks

### Create New Page
```typescript
// 1. Create file: client/src/pages/NewPage.tsx
// 2. Type: rfc → Tab
// 3. Add route in App.tsx
```

### Create API Endpoint
```typescript
// 1. Open: server/routes.ts
// 2. Type: expressSession → Tab
// 3. Add your logic
```

### Create Form
```typescript
// 1. Type: zodForm → Tab (schema + setup)
// 2. Type: cardForm → Tab (UI structure)
// 3. Connect form.handleSubmit()
```

### Database Query
```typescript
// Type: drizzleSelect → Tab
// Always includes customer isolation
```

### Call OpenAI API
```typescript
// Type: openaiCall → Tab
```

## 📦 Import Paths

```typescript
import { X } from '@/components/...'  // client/src
import { Y } from '@shared/...'       // shared
import { Z } from '@assets/...'       // attached_assets
```

## 🗄️ Database (Drizzle ORM)

### Query
```typescript
const results = await db
  .select()
  .from(table)
  .where(and(
    eq(table.customerId, customerId),  // ← Always include!
    eq(table.id, id)
  ));
```

### Insert
```typescript
const [result] = await db
  .insert(table)
  .values({ ...data })
  .returning();
```

### Update
```typescript
const [result] = await db
  .update(table)
  .set({ field: value })
  .where(eq(table.id, id))
  .returning();
```

## 🎨 Styling (Tailwind)

### Common Patterns
```tsx
// Container
<div className="container mx-auto px-4 py-8">

// Card
<div className="rounded-lg border bg-card shadow-sm p-6">

// Button
<button className="bg-primary text-primary-foreground rounded-md px-4 py-2 hover:bg-primary/90">

// Flex Center
<div className="flex items-center justify-center gap-4">

// Grid
<div className="grid grid-cols-3 gap-4">
```

## 🔐 Authentication Pattern

```typescript
// Every protected route:
if (!req.session?.userId) {
  return res.status(401).json({ error: 'Not authenticated' });
}

const userId = req.session.userId;
const customerId = req.session.customerId;
```

## 🔍 Testing Tools

### Thunder Client (API)
1. Click Thunder Client icon
2. New Request
3. `GET http://localhost:5000/api/...`
4. Test!

### Drizzle Studio (Database)
```bash
Cmd+Shift+D
# or
npx drizzle-kit studio
```

### Live Preview (UI)
```bash
Cmd+K Cmd+P
# Opens in VS Code
```

## 🤖 Claude Code Commands

### UI Development
```
"Create a user profile card with avatar, name, and email"
"Add a form to update user settings with Zod validation"
"Make this component responsive for mobile"
"Change the button color to blue-600"
```

### Backend Development
```
"Create an Express route to fetch all assessments"
"Add a Drizzle query to get cases by user ID"
"Implement session authentication for this endpoint"
"Call OpenAI API to analyze this text"
```

### Forms & Validation
```
"Create a Zod schema for user registration"
"Build a form with email, password, and name fields"
"Add validation error messages to this form"
```

## 📚 Tech Stack Quick Ref

| Category | Technology |
|----------|-----------|
| Backend | Express.js + TypeScript |
| Database | PostgreSQL + Drizzle ORM |
| Frontend | React 18 + Vite |
| UI | shadcn/ui + Tailwind CSS |
| Forms | react-hook-form + Zod |
| State | React Query (TanStack) |
| AI | OpenAI API (GPT-4o) |
| Auth | Passport.js + sessions |

## 🛠️ NPM Scripts

```bash
npm run dev       # Start development
npm run build     # Build for production
npm run check     # TypeScript check
npm run db:push   # Push DB schema
```

## 🎯 VS Code Tasks (Cmd+Shift+P → "Tasks")

- Dev: Start Development Server
- Build: Production Build
- DB: Push Schema
- DB: Drizzle Studio
- TypeScript: Check Types
- Railway: Run with Railway DB

## 💡 Pro Tips

1. **Auto-save enabled** - No need to save manually
2. **Tailwind classes auto-sort** - Just type, it sorts on save
3. **Color swatches inline** - See colors next to class names
4. **Snippet tab completion** - Type prefix → Tab
5. **Live preview** - See changes instantly
6. **Multi-tenancy** - Always include `customerId` in queries
7. **Import autocomplete** - Use `@/`, `@shared/`, `@assets/`
8. **Error lens** - Errors show inline, no need to check panel

## 🚨 Common Mistakes to Avoid

❌ **Don't:**
- Forget `customerId` in database queries
- Skip input validation (use Zod)
- Use inline styles (use Tailwind)
- Forget error handling in try/catch
- Trust client-provided user IDs

✅ **Do:**
- Use snippets for consistency
- Validate all user input
- Use Tailwind utility classes
- Handle errors gracefully
- Use session data for auth

## 📍 File Locations

```
.vscode/              # All VS Code config
.claude/              # This documentation
client/src/           # React code
server/               # Express code
shared/schema.ts      # Database schema
migrations/           # DB migrations
```

## 🆘 Help

- Full guide: `.claude/VSCODE_SETUP.md`
- Claude instructions: `.claude/CLAUDE_INSTRUCTIONS.md`
- VS Code README: `.vscode/README.md`
- GitHub Issues: Report problems

---

**Last Updated**: Oct 18, 2024
**Setup Version**: 5 commits (Replit-like + Visual Tools + AI Optimized + Project-Specific)

# Instructions for Claude Code

This document provides context and instructions for Claude Code when working on this project.

## Session Documentation (IMPORTANT)

**At the end of each significant session**, you MUST update `.claude/SESSION_HISTORY.md`:

1. **Add a new session entry** using the template at the bottom of SESSION_HISTORY.md
2. **Document**:
   - Date and goal of the session
   - What was accomplished (with ✅ checkmarks)
   - Key decisions made and rationale
   - Code changes (files, commits)
   - Questions answered during session
   - Next steps or TODOs

3. **Commit the update**:
   ```bash
   git add .claude/SESSION_HISTORY.md
   git commit -m "docs: update session history - [brief description]"
   ```

**When to update**:
- After completing a significant feature
- After making important architectural decisions
- At the end of a coding session
- When answering important questions about the project

**Do NOT update** for:
- Minor bug fixes
- Trivial changes
- In-progress work (wait until completion)

## Project Context

This is an **AI-powered educational accessibility platform** that generates comprehensive accommodation reports for K-12 and post-secondary students. The platform uses GPT-4 to analyze student assessments and recommend evidence-based accommodations.

### Core Purpose
- Analyze student assessment documents (PDF, DOCX, images)
- Match student needs to appropriate accommodations
- Generate professional reports for educators/administrators
- Support both K-12 and post-secondary educational contexts

## Tech Stack (Use These)

### Backend
- **Framework**: Express.js 4.21 with TypeScript
- **Database**: PostgreSQL with Drizzle ORM 0.39
- **Auth**: Passport.js + express-session
- **AI**: OpenAI API (GPT-4o, GPT-4.1)
- **Document Processing**: PDF.js, Mammoth.js, Tesseract.js (OCR)
- **Email**: SendGrid
- **Storage**: Google Cloud Storage

### Frontend
- **Framework**: React 18.3 with TypeScript
- **Build Tool**: Vite 5.4
- **UI Library**: shadcn/ui (Radix UI primitives)
- **Styling**: Tailwind CSS 3.4
- **Forms**: react-hook-form + Zod validation
- **State Management**: React Query 5.60 (TanStack Query)
- **Routing**: React Router DOM 7.6
- **Animations**: Framer Motion

### Key Packages
- `drizzle-orm` + `drizzle-zod` - Database + validation
- `class-variance-authority` + `clsx` - Styling utilities
- `@tanstack/react-query` - Server state
- `openai` - AI integration
- `date-fns` - Date formatting

## Code Patterns to Follow

### 1. Express Routes (Backend)

**ALWAYS use session authentication:**
```typescript
app.get('/api/endpoint', async (req, res) => {
  // Check authentication
  if (!req.session?.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const userId = req.session.userId;
  const customerId = req.session.customerId; // Multi-tenancy

  try {
    // Your logic here
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

**Use snippet**: `expressSession`

### 2. Database Queries (Drizzle ORM)

**ALWAYS include customer isolation:**
```typescript
import { db } from './db';
import { eq, and } from 'drizzle-orm';

const results = await db
  .select()
  .from(tableName)
  .where(
    and(
      eq(tableName.customerId, customerId), // Multi-tenancy
      eq(tableName.id, id)
    )
  );
```

**Use snippet**: `drizzleSelect`

### 3. React Components (Frontend)

**Use TypeScript interfaces:**
```typescript
import { FC } from 'react';

interface ComponentProps {
  title: string;
  onSubmit: (data: FormData) => void;
}

export const Component: FC<ComponentProps> = ({ title, onSubmit }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Content */}
      </CardContent>
    </Card>
  );
};
```

**Use snippet**: `rfc`, `cardForm`

### 4. React Query (API Calls)

**For fetching data:**
```typescript
export const useResource = (id: string) => {
  return useQuery({
    queryKey: ['resource', id],
    queryFn: async () => {
      const response = await fetch(`/api/resource/${id}`);
      if (!response.ok) throw new Error('Failed to fetch');
      return response.json();
    },
  });
};
```

**Use snippet**: `useApiQuery`

**For mutations:**
```typescript
const mutation = useMutation({
  mutationFn: async (data: DataType) => {
    const response = await fetch('/api/endpoint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed');
    return response.json();
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['resource'] });
  },
});
```

**Use snippet**: `useMutationApi`

### 5. Forms with Validation

**Use Zod + react-hook-form:**
```typescript
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
});

type FormData = z.infer<typeof formSchema>;

const form = useForm<FormData>({
  resolver: zodResolver(formSchema),
  defaultValues: { name: '', email: '' },
});
```

**Use snippet**: `zodForm`

### 6. OpenAI API Calls

**Follow this pattern:**
```typescript
const completion = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [
    { role: 'system', content: 'System prompt...' },
    { role: 'user', content: userMessage }
  ],
  temperature: 0.7,
});

const response = completion.choices[0].message.content;
```

**Use snippet**: `openaiCall`

## Import Paths (Use These)

```typescript
// Client-side imports
import { Component } from '@/components/...'
import { useHook } from '@/hooks/...'
import { utility } from '@/utils/...'

// Shared types/schemas
import { schema } from '@shared/...'

// Assets
import { asset } from '@assets/...'
```

## Styling Guidelines

### Use Tailwind Classes
```tsx
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm">
  <h2 className="text-xl font-semibold text-gray-900">Title</h2>
</div>
```

### shadcn/ui Components
Prefer shadcn/ui components over custom HTML:
```tsx
// Good
<Button variant="default" size="lg">Click Me</Button>

// Avoid
<button className="...">Click Me</button>
```

### Component Structure
```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
  <CardFooter>
    {/* Actions */}
  </CardFooter>
</Card>
```

**Use snippet**: `twcard`, `cardForm`

## Multi-Tenancy (CRITICAL)

**ALWAYS enforce customer isolation in database queries:**

```typescript
// Every query MUST include customerId
const data = await db
  .select()
  .from(table)
  .where(
    and(
      eq(table.customerId, customerId), // ← REQUIRED
      eq(table.id, id)
    )
  );
```

**Users belong to customers. Never show data from other customers.**

## File Structure

```
project/
├── client/              # React frontend
│   └── src/
│       ├── components/  # React components
│       ├── hooks/       # Custom React hooks
│       ├── pages/       # Page components
│       ├── services/    # API service functions
│       ├── types/       # TypeScript types
│       └── utils/       # Utility functions
├── server/              # Express backend
│   ├── routes/          # API route handlers
│   ├── config/          # Configuration
│   ├── ai-service.ts    # OpenAI integration
│   ├── auth.ts          # Authentication
│   └── db.ts            # Database connection
├── shared/              # Shared code
│   └── schema.ts        # Drizzle schema + types
├── migrations/          # Database migrations
└── .vscode/             # VS Code configuration
```

## Common Tasks

### Creating a New Page
1. Create component in `client/src/pages/`
2. Add route in `client/src/App.tsx`
3. Use `rfc` snippet for component structure
4. Use shadcn/ui components for UI

### Creating a New API Endpoint
1. Add route in `server/routes.ts`
2. Use `expressSession` snippet
3. Include customer isolation in queries
4. Handle errors properly

### Creating a Form
1. Define Zod schema
2. Use `zodForm` snippet
3. Use shadcn Form components
4. Use `useMutationApi` for submission

### Adding Database Table
1. Define schema in `shared/schema.ts`
2. Add `customerId` column (multi-tenancy)
3. Run `npm run db:push` to update database
4. Create TypeScript types with Drizzle-Zod

## AI-Specific Features

### Assessment Analysis
The platform uses GPT-4 to analyze student assessments. When working with AI features:

**Prompt Structure:**
- System prompt defines role/context
- User prompt includes assessment data
- Use function calling for structured output
- Temperature 0.7 for balanced creativity/consistency

**Key AI Endpoints:**
- `/api/ai/analyze` - Analyze assessment document
- `/api/ai/recommendations` - Generate recommendations
- `/api/ai/report` - Generate full report

## Security & Best Practices

### Authentication
- **Always** check `req.session?.userId`
- **Never** trust client-provided user/customer IDs
- Use session data for authorization

### Validation
- **Always** validate input with Zod
- Sanitize user input before database queries
- Validate file uploads (type, size)

### Error Handling
```typescript
try {
  // Operation
  res.json({ success: true, data: result });
} catch (error) {
  console.error('Error context:', error);
  res.status(500).json({ error: 'User-friendly message' });
}
```

### Logging
- Log errors with context
- **Don't** log sensitive data (passwords, PII)
- Use descriptive error messages

## Testing Recommendations

**When modifying code:**
1. Check TypeScript types: `npm run check`
2. Test in browser with live preview
3. Test API endpoints with Thunder Client
4. Verify database queries in Drizzle Studio

**Common test scenarios:**
- User authentication flow
- Form submission and validation
- API error handling
- Multi-tenancy isolation
- Document upload and processing

## Performance Considerations

- Use React Query for caching
- Lazy load components with `React.lazy()`
- Optimize images and assets
- Use database indexes for common queries
- Batch OpenAI API calls when possible

## Available Code Snippets

Use these shortcuts (type prefix → press Tab):

**UI Components:**
- `rfc` - React component
- `twcard`, `twbtn`, `twcontainer`, `twflex`, `twgrid`
- `shadcnDialog`, `shadcnInput`, `cardForm`

**Backend:**
- `apiRoute`, `expressSession`, `authRoute`
- `openaiCall`, `openaiFunction`

**Database:**
- `drizzleQuery`, `drizzleInsert`, `drizzleUpdate`, `drizzleSelect`
- `customerQuery`

**React Query:**
- `useQuery`, `useMutation`, `useApiQuery`, `useMutationApi`

**Forms:**
- `shadcnForm`, `zodSchema`, `zodForm`

## Questions to Ask the User

When implementing new features, consider asking:

1. **Scope**: "Should this be available for K-12, post-secondary, or both?"
2. **Permissions**: "Which user roles should access this? (admin, tutor, etc.)"
3. **Multi-tenancy**: "Should this be customer-specific or system-wide?"
4. **UI/UX**: "Where should this appear in the interface?"
5. **Validation**: "What validation rules should apply?"
6. **AI**: "Should this use AI analysis or direct data processing?"

## Summary

When working on this project:
- ✅ Use TypeScript everywhere
- ✅ Follow established patterns (use snippets!)
- ✅ Enforce multi-tenancy (customer isolation)
- ✅ Use shadcn/ui + Tailwind for UI
- ✅ Validate with Zod
- ✅ Use React Query for server state
- ✅ Handle errors properly
- ✅ Test changes before committing
- ✅ **Update SESSION_HISTORY.md at end of session**

## End of Session Checklist

Before ending a significant session:
1. ✅ All changes committed to git
2. ✅ Documentation updated if needed
3. ✅ SESSION_HISTORY.md updated with session notes
4. ✅ Pushed to remote (if appropriate)
5. ✅ User informed of what was accomplished

This setup provides everything you need to write high-quality, consistent code for this educational platform.

This setup provides everything you need to write high-quality, consistent code for this educational platform.

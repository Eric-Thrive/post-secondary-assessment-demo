# VS Code Setup - Replit-like Experience

This folder contains VS Code configurations to provide a Replit-like development experience.

## Features

### 🔄 Auto-Save
Files automatically save after 1 second of inactivity (just like Replit).

### 🖥️ Live Preview (Replit-like)
View your app inside VS Code while coding:

**Method 1: Simple Browser (Built-in)**
- Press `Cmd+K Cmd+P` to open preview
- Or Command Palette → "Simple Browser: Show" → `http://localhost:5000`
- Auto-refreshes with Vite HMR

**Method 2: Live Preview Extension (Recommended)**
- Install the "Live Server" extension (recommended)
- Click the preview icon in the status bar
- Or right-click in editor → "Open with Live Server"
- Embedded browser with better controls

**Method 3: External Browser**
- Dev server automatically serves frontend on `http://localhost:5000`
- Changes auto-reload via Vite HMR
- Open in Chrome/Safari/Firefox

### ⚡ Quick Tasks
Access common tasks via:
- **Command Palette** (`Cmd+Shift+P` → "Tasks: Run Task")
- **Keyboard Shortcuts** (see below)

Available tasks:
- `Dev: Start Development Server` - Start the app
- `Build: Production Build` - Build for production
- `DB: Push Schema` - Push database schema changes
- `DB: Drizzle Studio` - Open database GUI
- `TypeScript: Check Types` - Run type checking
- `Railway: *` - Railway-specific commands

### 🎹 Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd+Enter` | Start dev server (like Replit's Run) |
| `Cmd+K Cmd+P` | Open preview in Simple Browser |
| `Cmd+Shift+C` | Open color picker (on color) |
| `Alt+W` | Wrap selection with HTML tag |
| `Ctrl+Shift+W` | Emmet wrap with abbreviation |
| `Alt+F12` | Peek CSS definition |
| `Cmd+'` | Toggle terminal |
| `Cmd+Shift+'` | New terminal |
| `Cmd+J` | Toggle bottom panel |
| `Cmd+B` | Toggle sidebar |
| `Cmd+Shift+B` | Run build task |
| `Cmd+Shift+D` | Open Drizzle Studio |
| `Cmd+Shift+T` | Check TypeScript types |
| `Cmd+Alt+S` | Save all files |
| `Cmd+.` | Quick fix / Stop task |

### 🐛 Debug Configurations

Press `F5` or go to Run & Debug panel to start:

- **🚀 Start Dev Server** - Launch app in debug mode
- **🔍 Debug Server (tsx)** - Debug backend with breakpoints
- **🔧 Debug Current TypeScript File** - Debug any .ts file
- **🧪 Debug Script** - Debug scripts from `/scripts` folder
- **🌐 Chrome: Debug Frontend** - Debug React in Chrome
- **🚂 Railway: Debug with Railway DB** - Debug with Railway database

### 📦 Recommended Extensions

VS Code will prompt you to install recommended extensions when you open the workspace. Key extensions:

**Essential:**
- Prettier - Code formatting
- ESLint - Linting
- Tailwind CSS IntelliSense - Tailwind autocomplete
- PostgreSQL - Database management
- **Live Server** - In-editor browser preview (Replit-like)

**Productivity:**
- Error Lens - Inline error messages
- GitLens - Enhanced Git
- Thunder Client - API testing (like Postman)
- Path Intellisense - File path autocomplete

**Optional:**
- GitHub Copilot - AI assistance

## Quick Start

1. **Install recommended extensions** when prompted
2. Press `Cmd+Enter` to start the dev server
3. Press `Cmd+K Cmd+P` to open preview in VS Code
4. Press `Cmd+'` to open terminal if needed
5. Start coding - files auto-save and preview auto-updates!

## Visual Development Tools

### 🎨 Color Tools
- **Color Swatches**: Colors in code show inline previews
- **Color Picker**: `Cmd+Shift+C` on any color to open picker
- **Tailwind Colors**: Hover over Tailwind classes to see color values
- **Color Highlight**: All color formats (hex, rgb, hsl) highlighted

### ✏️ Tailwind CSS Features
- **IntelliSense**: Auto-complete for all Tailwind classes
- **Class Sorting**: Auto-sort Tailwind classes on save (Headwind)
- **Pixel Equivalents**: Hover over `rem`/`em` to see pixel values
- **Conflict Detection**: Warns about conflicting Tailwind classes
- **Color Decorators**: See color swatches next to Tailwind color classes

### 🏗️ Component Shortcuts

**Snippets** (type these prefixes and press Tab):
- `twcard` - Tailwind card component
- `twbtn` - Tailwind button
- `twcontainer` - Container with padding
- `twflex` - Flex container centered
- `twgrid` - Grid layout
- `shadcnDialog` - shadcn Dialog
- `shadcnInput` - shadcn Input with label and error
- `rfc` - React functional component
- `useQuery` - React Query hook

**Quick Actions**:
- `Alt+W` - Wrap selection with HTML tag
- `Ctrl+Shift+W` - Emmet wrap with abbreviation
- `Alt+F12` - Peek CSS definition
- Auto-rename paired HTML/JSX tags

### 🖼️ Asset Preview
- **Image Gutter Preview**: See images inline in code
- **SVG Preview**: Click SVG files to preview

### 📐 HTML/JSX Tools
- **Matching Tag Highlight**: Paired tags highlighted
- **Auto-Rename Tags**: Edit opening tag, closing tag updates automatically
- **Emmet in JSX**: Use Emmet shortcuts in React components

## Visual Development Workflow

1. **Type snippet prefix** (e.g., `twcard`) → Press Tab
2. **Edit Tailwind classes** → See color swatches inline
3. **Hover classes** → See CSS values and pixel equivalents
4. **Save** → Auto-sorts Tailwind classes, formats code
5. **Preview updates** → See changes instantly in browser

## Working with Claude Code on UI 🤖

### Best Workflow for AI-Assisted UI Development:

**1. Describe What You Want**
- Tell Claude Code: "Create a user profile card with avatar, name, and bio"
- Be specific about layout, colors, and interactions
- Reference existing components: "Make it look like the dashboard card"

**2. Claude Creates the Component**
- Claude writes the JSX/TSX code
- Uses your project's patterns (shadcn/ui, Tailwind)
- Includes TypeScript types

**3. See It Live Immediately**
- `Cmd+K Cmd+P` - Open preview
- Auto-saves → Preview updates
- See exactly what Claude created

**4. Iterate Visually**
- "Make the avatar larger"
- "Change the background to blue-500"
- "Add a hover effect"
- See color swatches → Know exact values

**5. Refine with Visual Feedback**
- Use color picker (`Cmd+Shift+C`) to try colors
- Copy the hex value
- Tell Claude: "Use #3b82f6 instead"

### Claude Code UI Commands:

**Component Creation:**
- "Create a responsive navbar with logo and menu"
- "Build a form with email and password fields"
- "Make a card grid showing user posts"

**Styling:**
- "Make this button primary colored with rounded corners"
- "Add a subtle shadow to the card"
- "Make the layout responsive for mobile"

**Refactoring:**
- "Extract this form into a separate component"
- "Convert these inline styles to Tailwind classes"
- "Make this component reusable with props"

### Tips for Best Results:

✅ **Be specific**: "Create a blue button" → "Create a primary button with bg-blue-500, white text, rounded-lg, px-4 py-2"

✅ **Reference existing patterns**: "Use the same card style as Dashboard.tsx"

✅ **Describe interactions**: "Button should show loading spinner when clicked"

✅ **Use visual feedback**: See the preview, then ask Claude to adjust

✅ **Leverage snippets**: Ask Claude to use `twcard` or `shadcnDialog` patterns

### What Claude Code Can Do:

- ✅ Write complete React components with TypeScript
- ✅ Apply Tailwind CSS classes correctly
- ✅ Use your existing shadcn/ui components
- ✅ Handle responsive design
- ✅ Add animations and transitions
- ✅ Integrate with your API routes
- ✅ Follow your project's patterns
- ✅ Refactor and improve existing UI

### What You Do (The Visual Part):

- 🎨 Pick exact colors with color picker
- 👀 Verify spacing and layout in preview
- 🖱️ Test interactions (clicks, hovers)
- 📱 Check responsive breakpoints
- ✨ Spot visual bugs quickly

## Terminal Experience

Like Replit, the integrated terminal is always accessible:
- Terminal tabs appear on the right side
- Multiple terminals supported
- Auto-completes for npm scripts

## Tasks Menu

Access the tasks menu:
1. `Cmd+Shift+P` → "Tasks: Run Task"
2. Or use the **Terminal** menu → **Run Task**
3. Or use keyboard shortcuts (see above)

## File Navigation

- `Cmd+P` - Quick open files (fuzzy search)
- `Cmd+Shift+F` - Search across all files
- `Cmd+Click` on imports - Jump to definition

## Git Integration

- `Cmd+Shift+G` - Open source control panel
- Built-in diff viewer
- GitLens for enhanced Git features

## Database Management

Two options:
1. **Drizzle Studio** (recommended): `Cmd+Shift+D` or run task "DB: Drizzle Studio"
2. **PostgreSQL Extension**: Connect directly in VS Code sidebar

## Railway Integration

If using Railway:
- Tasks configured for Railway CLI commands
- Debug configuration for Railway database
- Run `railway link` first to connect your project

## Customization

All files in this folder can be customized:
- `settings.json` - Workspace settings
- `tasks.json` - Custom tasks
- `launch.json` - Debug configurations
- `keybindings.json` - Keyboard shortcuts
- `extensions.json` - Extension recommendations

## Tips

1. **Split Editors**: `Cmd+\` to split editor side-by-side
2. **Multi-cursor**: `Cmd+D` to select next occurrence
3. **Command Palette**: `Cmd+Shift+P` for all commands
4. **Zen Mode**: `Cmd+K Z` for distraction-free coding
5. **Toggle Minimap**: View → Show Minimap

## Troubleshooting

**Tasks not working?**
- Ensure you're in the workspace root directory
- Check that dependencies are installed (`npm install`)

**Extensions not loading?**
- Open Command Palette → "Extensions: Show Recommended Extensions"
- Install manually if needed

**Debugging not working?**
- Ensure `.env` file exists with required variables
- Check that ports are available (5000 for dev server)

**Railway commands failing?**
- Install Railway CLI: `npm install -g @railway/cli`
- Run `railway login` and `railway link`

## Additional Resources

- [VS Code Keyboard Shortcuts](https://code.visualstudio.com/shortcuts/keyboard-shortcuts-macos.pdf)
- [VS Code Tips & Tricks](https://code.visualstudio.com/docs/getstarted/tips-and-tricks)
- [Debugging in VS Code](https://code.visualstudio.com/docs/editor/debugging)

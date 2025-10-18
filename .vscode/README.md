# VS Code Setup - Replit-like Experience

This folder contains VS Code configurations to provide a Replit-like development experience.

## Features

### 🔄 Auto-Save
Files automatically save after 1 second of inactivity (just like Replit).

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
3. Press `Cmd+'` to open terminal if needed
4. Start coding - files auto-save!

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

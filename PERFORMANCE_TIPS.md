# Performance & Caching Quick Reference

This document provides quick solutions for common performance and caching issues during development.

## 🐌 Website Loading Slowly Without Cache Clear?

### Quick Fixes

**Option 1: Hard Refresh (Fastest)**
- **Mac**: `Cmd + Shift + R` or `Cmd + F5`
- **Windows/Linux**: `Ctrl + Shift + R` or `Ctrl + F5`
- Forces browser to bypass cache and reload everything

**Option 2: Empty Cache and Hard Reload**
1. Open DevTools (`F12` or `Cmd/Ctrl + Option + I`)
2. **Right-click** the refresh button (next to address bar)
3. Select "Empty Cache and Hard Reload"
4. Works in Chrome, Edge, and most browsers

**Option 3: Clear Browser Cache**
- **Chrome/Edge**: Settings → Privacy → Clear browsing data → Cached images and files
- **Firefox**: Settings → Privacy → Clear Data → Cached Web Content
- **Safari**: Develop menu → Empty Caches (or enable Develop menu first)

**Option 4: Use Incognito/Private Mode**
- Fresh session with no cached data
- Great for testing changes

---

## 🔄 Reset Environment to Default (Replit Prod)

If your app is stuck showing the wrong environment (Post-Secondary instead of Replit Prod home screen):

### Browser Console Method (Fastest)
1. Open DevTools (`F12`)
2. Go to **Console** tab
3. Paste this code and press Enter:
```javascript
localStorage.removeItem('app-environment');
localStorage.removeItem('activeModule');
location.reload();
```

### Manual Method
1. Open DevTools (`F12`)
2. Go to **Application** tab (Chrome/Edge) or **Storage** tab (Firefox)
3. Expand **Local Storage** → `http://localhost:5001`
4. Delete these keys:
   - `app-environment`
   - `activeModule`
5. Refresh the page

---

## 🏗️ Performance Optimizations Implemented

### What We Fixed (Oct 2025)

**Cache Control Headers**
- HTML files: Never cached (always fresh)
- JS/CSS assets: 1-day cache with smart ETags
- Prevents stale content without manual clearing

**Code Splitting**
- React vendor bundle (350KB)
- UI components bundle (112KB)
- Query vendor bundle (separate)
- Markdown vendor bundle (separate)
- Main app bundle (smaller, loads faster)

**Build Optimizations**
- esbuild minification (fastest)
- ES2020 target (modern browsers)
- Optimized dependencies
- Removed Replit banner script

**Server Improvements**
- Cache-busting query parameters
- Proper cache headers on all responses
- Static asset optimization

---

## 🚀 Development Server Commands

### Start Server (Production Mode)
```bash
npm run dev
```
Server uses `.env` file with `APP_ENVIRONMENT=production`

### Start Server (Specific Environment)
If you need to override the .env file:
```bash
# K-12 Demo Mode
unset APP_ENVIRONMENT
# Edit .env to set APP_ENVIRONMENT=k12-demo
npm run dev

# Post-Secondary Demo Mode
unset APP_ENVIRONMENT
# Edit .env to set APP_ENVIRONMENT=post-secondary-demo
npm run dev

# Development Mode (Full Access)
unset APP_ENVIRONMENT
# Edit .env to set APP_ENVIRONMENT=development
npm run dev
```

**Important**: Always `unset APP_ENVIRONMENT` before starting to avoid shell variable conflicts.

### Check What's Running
```bash
# Check if server is running on port 5001
lsof -ti:5001

# Kill process on port 5001
lsof -ti:5001 | xargs kill -9
```

---

## 🌍 Environment Modes Explained

| Mode | Database Access | Features | Use Case |
|------|----------------|----------|----------|
| **production** | Full read/write | All features unlocked | Production deployment |
| **development** | Full read/write | All features unlocked | Local development |
| **replit-prod** | Full read/write | All features unlocked | Replit production (default home) |
| **post-secondary-demo** | Read-only | Premium feature notices | Demos/presentations |
| **k12-demo** | Read-only | Premium feature notices | K-12 demos |
| **tutoring-demo** | Read-only | Premium feature notices | Tutoring demos |

---

## 🔧 Common Issues & Solutions

### Issue: "Port 5001 already in use"
```bash
# Kill process and restart
lsof -ti:5001 | xargs kill -9
sleep 2
npm run dev
```

### Issue: Environment not changing
1. Check `.env` file: `cat .env | grep APP_ENVIRONMENT`
2. Unset shell variable: `unset APP_ENVIRONMENT`
3. Restart server: `npm run dev`
4. Clear browser localStorage (see above)

### Issue: Changes not showing in browser
1. Hard refresh: `Cmd+Shift+R` / `Ctrl+Shift+R`
2. Check DevTools Console for errors
3. Verify server is running: `lsof -ti:5001`
4. Check Vite compilation in terminal

### Issue: Slow page loads
1. Clear browser cache (see Quick Fixes above)
2. Check Network tab in DevTools for slow assets
3. Verify all images in `attached_assets` are optimized
4. Consider using incognito mode for clean testing

---

## 📦 Build & Deploy

### Local Build Test
```bash
npm run build
npm run start
```

### Type Check
```bash
npm run check
```

### Railway Deployment
```bash
# Push to Railway branch
git push origin railway-deployment

# Railway auto-deploys on push
```

---

## 💡 Pro Tips

1. **Use Incognito for Testing**: Always test major changes in incognito mode first
2. **Hard Refresh Often**: Get in the habit of hard refreshing during active development
3. **Check DevTools Network Tab**: See exactly what's loading slowly
4. **Monitor Server Logs**: Terminal shows API calls and timing
5. **Clear localStorage Regularly**: Prevents environment confusion
6. **Keep .env in Sync**: Make sure your `.env` matches your intended mode

---

## 🆘 Need Help?

**Server Logs**: Check terminal where `npm run dev` is running
**Browser Console**: Press `F12` → Console tab
**Network Activity**: Press `F12` → Network tab
**Application State**: Press `F12` → Application tab → Local Storage

---

*Last Updated: October 2025*
*Railway Migration - Post-Secondary Assessment Platform*

# How to Access the "All Users" View

## Quick Access from Module Picker (Your Current Page)

You're currently on the **Module Picker** page (`localhost:5173/module-picker`).

### Option 1: Admin Quick Actions Panel (Easiest)

Look for the **"Admin Quick Actions"** section on your current page. You should now see a card labeled:

**"View All Users"**

- Description: "Browse complete user directory with roles and modules"
- Click this card to go directly to the all-users page

### Option 2: Via Admin Dashboard

1. Click the **"Settings"** button (top right, next to your name)
2. This takes you to `/admin/dashboard`
3. In the "Quick Actions" section, click **"View All Users"**

### Option 3: Direct URL

Simply navigate to: `http://localhost:5173/admin/all-users`

## What You'll See

The "All Users" page displays:

- **Search bar** - Filter by username, email, role, or module
- **Statistics cards** - Total users, active users, filtered results
- **User table** with columns:
  - ID
  - Username
  - Email
  - Role (with badges)
  - Assigned Modules (with badges)
  - Status (Active/Inactive)
  - Organization ID
- **Export CSV button** - Download the user list
- **Refresh button** - Manually refresh data

## Admin Quick Actions Panel

The Admin Quick Actions panel now includes 4 cards:

1. **Admin Dashboard** - View system statistics
2. **View All Users** ← NEW! Direct link to user directory
3. **Manage Users** - Edit user permissions
4. **Organizations** - Manage organizations

All cards are clickable and will navigate you to the respective pages.

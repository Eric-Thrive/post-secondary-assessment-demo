# RBAC Implementation Plan

## Summary of Requirements

Based on your clarifications:

1. **Customer users** → See only their own reports
2. **Tutor users** → Same as customers (see only their own reports), only access tutoring module
3. **Org Admin users** → See only their assigned modules
4. **Admin users** → See all reports across all modules
5. **System Admin/Developer users** → See all reports
6. **Module filtering** → All roles filtered by assigned modules (except admins/devs)

## Migration Steps

### Step 1: Run Database Migration

```bash
node run-rbac-migration.js
```

This will:

- Add `organization_id` to `assessment_cases`
- Create individual organizations for each user
- Link users to their organizations
- Migrate existing reports to use `organization_id`
- Add foreign key constraints

### Step 2: Update Report Filtering API

File: `apps/server/routes/assessment-case-routes.ts`

```typescript
// Get all assessment cases with proper RBAC filtering
app.get("/api/assessment-cases", requireAuth, async (req, res) => {
  try {
    const user = req.user;

    let query = db.select().from(assessmentCases);

    // Apply role-based filtering
    switch (user.role) {
      case "customer":
      case "demo":
      case "tutor":
        // Customers, tutors, and demo users see only their own reports
        query = query.where(eq(assessmentCases.createdByUserId, user.id));
        break;

      case "org_admin":
        // Org admins see all reports in their organization
        if (user.organizationId) {
          query = query.where(
            eq(assessmentCases.organizationId, user.organizationId)
          );
        } else {
          // No organization = no reports
          return res.json([]);
        }
        break;

      case "admin":
      case "system_admin":
      case "developer":
        // Admins and developers see all reports (no filter)
        break;

      default:
        // Unknown role = no access
        return res.status(403).json({ error: "Invalid user role" });
    }

    const results = await query;

    // Apply module filtering (except for system_admin, developer, and admin)
    let filteredResults = results;
    if (
      user.role !== "system_admin" &&
      user.role !== "developer" &&
      user.role !== "admin"
    ) {
      filteredResults = results.filter(
        (report) =>
          user.assignedModules &&
          user.assignedModules.includes(report.moduleType)
      );
    }

    res.json(filteredResults);
  } catch (error) {
    console.error("Error fetching assessment cases:", error);
    res.status(500).json({ error: "Failed to fetch assessment cases" });
  }
});
```

### Step 3: Update Registration to Create Organizations

File: `apps/server/routes/auth-routes.ts`

```typescript
app.post("/api/auth/register", async (req, res) => {
  try {
    // ... existing validation ...

    const hashedPassword = await hashPassword(password);
    const registrationToken = generateRegistrationToken();

    let assignedRole = role || "customer";
    let assignedOrganizationId = null;

    // Create organization for non-admin users
    if (assignedRole !== "system_admin" && assignedRole !== "developer") {
      const orgId = `org-${trimmedUsername.toLowerCase()}-${Date.now()}`;
      const customerId = `customer-${trimmedUsername.toLowerCase()}-${Date.now()}`;

      const [newOrg] = await db.insert(organizations).values({
        id: orgId,
        name: `${trimmedUsername}'s Organization`,
        customerId: customerId,
        assignedModules: assignedModules || ["post_secondary"],
        maxUsers: assignedRole === "demo" ? 1 : 10,
        isActive: true,
      }).returning();

      assignedOrganizationId = newOrg.id;
    }

    // Create user
    const [newUser] = await db.insert(users).values({
      username: trimmedUsername,
      password: hashedPassword,
      email: trimmedEmail,
      role: assignedRole,
      assignedModules: assignedModules || ["post_secondary"],
      organizationId: assignedOrganizationId,
      customerId: assignedOrganizationId ? `customer-${trimmedUsername.toLowerCase()}-${Date.now()}` : "system",
      isActive: true,
      registrationToken,
      reportCount: 0,
      maxReports: assignedRole === "demo" ? 5 : -1,
    }).returning({
      id: users.id,
      username: users.username,
      email: users.email,
      organizationId: users.organizationId,
      role: users.role,
    });

    // ... rest of registration logic ...
  }
});
```

### Step 4: Update Report Creation

File: `apps/server/routes/assessment-case-routes.ts`

```typescript
app.post("/api/assessment-cases", requireAuth, async (req, res) => {
  try {
    const user = req.user;

    // ... existing validation ...

    const [newCase] = await db
      .insert(assessmentCases)
      .values({
        caseId: generateCaseId(),
        displayName: req.body.displayName,
        moduleType: req.body.moduleType,
        status: "pending",
        organizationId: user.organizationId, // Use user's organization
        createdByUserId: user.id,
        customerId: user.customerId, // Keep for backward compatibility
        documentNames: [],
        reportData: {},
        itemMasterData: {},
      })
      .returning();

    res.status(201).json(newCase);
  } catch (error) {
    console.error("Error creating assessment case:", error);
    res.status(500).json({ error: "Failed to create assessment case" });
  }
});
```

### Step 5: Update Module Switching

File: `apps/server/routes/module-routes.ts`

```typescript
app.get("/api/user/module-access", requireAuth, async (req, res) => {
  try {
    const user = req.user;

    // Determine if user can switch modules
    const canSwitchModules =
      user.role === "system_admin" ||
      user.role === "developer" ||
      user.role === "admin";

    // Get available modules
    const availableModules = canSwitchModules
      ? ["k12", "post_secondary", "tutoring"] // All modules
      : user.assignedModules || ["post_secondary"]; // Only assigned modules

    res.json({
      canSwitchModules,
      availableModules,
      currentModule: req.session.currentModule || availableModules[0],
      assignedModules: user.assignedModules,
    });
  } catch (error) {
    console.error("Error getting module access:", error);
    res.status(500).json({ error: "Failed to get module access" });
  }
});
```

## Testing Checklist

After migration, test these scenarios:

### Customer Role

- [ ] Can only see their own reports
- [ ] Cannot see other customers' reports
- [ ] Reports filtered by assigned modules
- [ ] Can create new reports in their organization
- [ ] Cannot access admin features

### Org Admin Role

- [ ] Can see all reports in their organization
- [ ] Cannot see reports from other organizations
- [ ] Reports filtered by assigned modules only
- [ ] Can manage users in their organization
- [ ] Cannot access system admin features

### System Admin/Developer Role

- [ ] Can see all reports across all organizations
- [ ] Can see reports from all modules
- [ ] Can switch between modules
- [ ] Can access admin dashboards
- [ ] Can manage all users

### Demo Role

- [ ] Can only see their own reports
- [ ] Limited to 5 reports maximum
- [ ] Reports filtered by assigned modules
- [ ] Cannot exceed report limit

## Rollback Plan

If migration fails:

```sql
BEGIN;

-- Remove foreign key constraints
ALTER TABLE assessment_cases DROP CONSTRAINT IF EXISTS fk_assessment_organization;
ALTER TABLE assessment_cases DROP CONSTRAINT IF EXISTS fk_assessment_created_by_user;
ALTER TABLE users DROP CONSTRAINT IF EXISTS fk_user_organization;

-- Remove organization_id column
ALTER TABLE assessment_cases DROP COLUMN IF EXISTS organization_id;

-- Clear user organization links
UPDATE users SET organization_id = NULL;

-- Delete created organizations
DELETE FROM organizations WHERE id LIKE 'org-%';

COMMIT;
```

## Next Steps

1. **Backup database** before running migration
2. **Run migration** with `node run-rbac-migration.js`
3. **Update API routes** with new filtering logic
4. **Test thoroughly** with each role type
5. **Monitor** for any access issues
6. **Remove legacy fields** after confirming everything works

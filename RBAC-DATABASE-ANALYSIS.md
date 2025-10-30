# RBAC Database Implementation Analysis

## Executive Summary

The RBAC migration is **partially complete** with critical gaps that affect multi-tenancy, report isolation, and module filtering. This document identifies all issues and provides a migration plan.

---

## Current State vs. Intended Design

### ✅ COMPLETED

1. **Organizations Table** - Exists and matches spec
2. **Users Table** - Has both `organizationId` (new) and `customerId` (legacy)
3. **Role-Based Access** - `role` and `assignedModules` fields implemented
4. **Module Types** - K12, Post-Secondary, Tutoring enums defined

### ❌ INCOMPLETE / BROKEN

1. **Assessment Cases** - Still uses `customerId` instead of `organizationId`
2. **Report Filtering** - No proper organization-based isolation
3. **Module Filtering** - Reports not filtered by `moduleType`
4. **Legacy Fields** - `customerId` and `demoPermissions` still in users table
5. **Foreign Keys** - Missing proper references between tables

---

## Critical Issues

### Issue 1: Assessment Cases Missing organizationId

**Current Schema:**

```typescript
export const assessmentCases = pgTable("assessment_cases", {
  // ...
  customerId: text("customer_id").notNull().default("system"),
  createdByUserId: integer("created_by_user_id"),
  // ...
});
```

**Intended Schema:**

```typescript
export const assessmentCases = pgTable("assessment_cases", {
  // ...
  organizationId: text("organization_id").references(() => organizations.id),
  createdByUserId: integer("created_by_user_id").references(() => users.id),
  moduleType: text("module_type").notNull(),
  // ...
});
```

**Impact:**

- ❌ No proper multi-tenant isolation
- ❌ Users see reports from other organizations
- ❌ Org Admins can't manage organization reports
- ❌ Workaround: Generating unique `customer_id` per user (defeats org purpose)

---

### Issue 2: Module Type Not Used for Filtering

**Current State:**

- `moduleType` field exists in `assessment_cases`
- Users have `assignedModules` in their profile
- **BUT**: No filtering logic connects them

**Impact:**

- ❌ Users with only K12 access can see Post-Secondary reports
- ❌ Module switching doesn't filter reports properly
- ❌ Cross-module data leakage

**Required:**

- Reports must be filtered by: `user.assignedModules.includes(report.moduleType)`

---

### Issue 3: Report Access Logic Unclear

**Questions:**

1. Should **Customer** users see:
   - Only their own reports? (`createdByUserId = user.id`)
   - All reports in their organization? (`organizationId = user.organizationId`)
2. Should **Org Admin** users see:

   - All reports in their organization? (Yes, per spec)
   - Reports from all modules or only assigned modules?

3. Should **Admin/Developer** users see:
   - All reports across all organizations? (Yes, per spec)
   - Filtered by module or all modules?

**Current Behavior:**

- Filtering by `customerId` (broken multi-tenancy)
- No module filtering
- No role-based access control

---

### Issue 4: Legacy Fields Still Present

**Users Table:**

```typescript
customerId: text("customer_id").notNull().default("system"),  // Should be removed
customerName: text("customer_name"),                          // Should be removed
demoPermissions: jsonb("demo_permissions").default({}),       // Should be removed
```

**Impact:**

- Confusion about which field to use
- Registration code uses `customerId` instead of `organizationId`
- Inconsistent data model

---

## Proposed Migration Plan

### Phase 1: Add organizationId to Assessment Cases

```sql
-- 1. Add the new column
ALTER TABLE assessment_cases
ADD COLUMN organization_id TEXT;

-- 2. Create organizations for existing customer_ids
INSERT INTO organizations (id, name, customer_id, assigned_modules, max_users, is_active)
SELECT
  'org-' || customer_id as id,
  'Organization ' || customer_id as name,
  customer_id,
  '["post_secondary"]'::jsonb as assigned_modules,
  10 as max_users,
  true as is_active
FROM (
  SELECT DISTINCT customer_id
  FROM assessment_cases
  WHERE customer_id != 'system'
) AS distinct_customers
ON CONFLICT (customer_id) DO NOTHING;

-- 3. Migrate data: Map customer_id to organization_id
UPDATE assessment_cases ac
SET organization_id = o.id
FROM organizations o
WHERE ac.customer_id = o.customer_id;

-- 4. Handle 'system' customer_id (no organization)
UPDATE assessment_cases
SET organization_id = NULL
WHERE customer_id = 'system';

-- 5. Add foreign key constraint
ALTER TABLE assessment_cases
ADD CONSTRAINT fk_assessment_organization
FOREIGN KEY (organization_id) REFERENCES organizations(id);
```

### Phase 2: Update Users to Use Organizations

```sql
-- 1. Create organizations for users with unique customer_ids
INSERT INTO organizations (id, name, customer_id, assigned_modules, max_users, is_active)
SELECT
  'org-user-' || id as id,
  username || '''s Organization' as name,
  customer_id,
  assigned_modules,
  1 as max_users,
  is_active
FROM users
WHERE customer_id NOT IN (SELECT customer_id FROM organizations)
  AND customer_id != 'system'
ON CONFLICT (customer_id) DO NOTHING;

-- 2. Link users to organizations
UPDATE users u
SET organization_id = o.id
FROM organizations o
WHERE u.customer_id = o.customer_id
  AND u.organization_id IS NULL;
```

### Phase 3: Update Report Filtering Logic

**File: `apps/server/routes/assessment-case-routes.ts`**

```typescript
// Get reports based on user role and organization
app.get("/api/assessment-cases", requireAuth, async (req, res) => {
  const user = req.user;

  let query = db.select().from(assessmentCases);

  // Filter by role
  if (user.role === "customer") {
    // Customers see only their own reports
    query = query.where(eq(assessmentCases.createdByUserId, user.id));
  } else if (user.role === "org_admin") {
    // Org Admins see all reports in their organization
    if (user.organizationId) {
      query = query.where(
        eq(assessmentCases.organizationId, user.organizationId)
      );
    }
  }
  // Admins and Developers see all reports (no filter)

  // Filter by assigned modules
  const results = await query;
  const filteredResults = results.filter((report) =>
    user.assignedModules.includes(report.moduleType)
  );

  res.json(filteredResults);
});
```

### Phase 4: Update Registration Logic

```typescript
// In auth-routes.ts registration endpoint
if (assignedRole === "customer") {
  // Create a new organization for this customer
  const [newOrg] = await db
    .insert(organizations)
    .values({
      id: `org-${trimmedUsername.toLowerCase()}-${Date.now()}`,
      name: `${trimmedUsername}'s Organization`,
      customerId: `customer-${trimmedUsername.toLowerCase()}-${Date.now()}`,
      assignedModules: assignedModules || ["post_secondary"],
      maxUsers: 1,
      isActive: true,
    })
    .returning();

  assignedOrganizationId = newOrg.id;
}

// Then create user with organizationId
await db.insert(users).values({
  // ...
  organizationId: assignedOrganizationId,
  // Remove customerId assignment
});
```

### Phase 5: Remove Legacy Fields

```sql
-- After migration is complete and tested
ALTER TABLE users DROP COLUMN customer_id;
ALTER TABLE users DROP COLUMN customer_name;
ALTER TABLE users DROP COLUMN demo_permissions;

ALTER TABLE assessment_cases DROP COLUMN customer_id;
```

---

## Report Filtering Rules (Clarification Needed)

### Customer Role

- **Own Reports Only**: `createdByUserId = user.id`
- **Module Filter**: `moduleType IN user.assignedModules`

### Org Admin Role

- **Organization Reports**: `organizationId = user.organizationId`
- **Module Filter**: `moduleType IN user.assignedModules` OR all modules?

### Admin/Developer Role

- **All Reports**: No organization filter
- **Module Filter**: All modules (can switch)

### Demo Role

- **Own Reports Only**: `createdByUserId = user.id`
- **Module Filter**: `moduleType IN user.assignedModules`
- **Limit**: Max 5 reports

---

## Questions for Clarification

1. **Org Admin Module Access**: Should Org Admins see reports from all modules in their org, or only their assigned modules?

2. **Customer Organization Sharing**: Should multiple Customer users be able to join the same organization and share reports?

3. **Demo Users**: Should demo users have their own organizations, or all share a single "demo" organization?

4. **Migration Timing**: Should we migrate existing data or start fresh with new schema?

5. **Backward Compatibility**: Do we need to maintain `customerId` for any legacy integrations?

---

## Recommended Next Steps

1. **Clarify Requirements** - Answer the questions above
2. **Create Migration Script** - Implement Phase 1-2 migrations
3. **Update API Routes** - Implement Phase 3 filtering logic
4. **Update Registration** - Implement Phase 4 organization creation
5. **Test Thoroughly** - Verify multi-tenant isolation
6. **Remove Legacy Fields** - Clean up Phase 5

---

## Risk Assessment

**High Risk:**

- Data loss if migration script has bugs
- Report access violations if filtering is wrong
- Breaking existing user workflows

**Mitigation:**

- Backup database before migration
- Test on staging environment first
- Implement gradual rollout with feature flags
- Keep legacy fields until fully tested

# RBAC Database Performance Optimization

This document describes the database performance optimizations implemented for the Role-Based Access Control (RBAC) system.

## Overview

The RBAC system requires efficient database queries for:

- User authentication and role checking
- Organization-based data filtering (multi-tenancy)
- Module access control
- Demo user management
- Permission boundary enforcement

## Performance Indexes

### Core RBAC Indexes

#### Users Table

- `idx_users_role_active`: Optimizes role-based user queries and authentication
- `idx_users_org_role`: Optimizes organization-based user filtering and permission checks
- `idx_users_demo_reports`: Optimizes demo user report limit checking and cleanup
- `idx_users_active_created`: Optimizes user activity and creation date queries
- `idx_users_org_role_modules`: Composite index for complex RBAC permission queries

#### Organizations Table

- `idx_organizations_active_modules`: Optimizes organization module assignment queries
- `idx_organizations_customer_id`: Backward compatibility for customer ID lookups

#### Assessment Cases Table

- `idx_assessment_cases_org_module`: Optimizes multi-tenant assessment case filtering
- `idx_assessment_cases_org_created`: Optimizes organization-based date sorting
- `idx_assessment_cases_user_status`: Optimizes user-specific case queries
- `idx_assessment_cases_org_user_module`: Composite index for complex filtering

### Module-Specific Indexes

#### Prompt Management

- `idx_prompt_sections_module_type`: Optimizes module-based prompt loading
- `idx_prompt_sections_key_module`: Optimizes prompt key lookups

#### Configuration Tables

- `idx_ai_config_module_key`: Module-based AI configuration access
- `idx_lookup_tables_module_key`: Module-based lookup table access
- `idx_mapping_configurations_module_key`: Module-based mapping access

### Demo User Management

- `idx_demo_users_near_limit`: Optimizes demo user upgrade prompt queries
- `idx_demo_users_expired`: Optimizes demo user cleanup queries

## Query Optimization Patterns

### 1. Role-Based Filtering

```sql
-- Optimized with idx_users_role_active
SELECT * FROM users
WHERE role = 'customer' AND is_active = true;
```

### 2. Organization-Based Multi-Tenancy

```sql
-- Optimized with idx_users_org_role
SELECT * FROM users
WHERE organization_id = 'org-123' AND role = 'customer' AND is_active = true;
```

### 3. Assessment Case Filtering

```sql
-- Optimized with idx_assessment_cases_org_module
SELECT * FROM assessment_cases
WHERE organization_id = 'org-123' AND module_type = 'post_secondary';
```

### 4. Demo User Management

```sql
-- Optimized with idx_demo_users_near_limit
SELECT * FROM users
WHERE role = 'demo' AND is_active = true AND report_count >= 4;
```

## Performance Monitoring

### Optimized Query Service

The `OptimizedQueries` class provides pre-optimized queries for common RBAC operations:

- `getUserWithOrganization()`: Single query for user authentication with org data
- `getUsersByOrganization()`: Efficient organization user listing
- `getAssessmentCasesByOrganization()`: Multi-tenant case filtering
- `getDemoUsersNearLimit()`: Demo user upgrade prompts
- `getOrganizationStats()`: Admin dashboard aggregations

### Performance Middleware

The performance monitoring middleware tracks:

- Query execution times
- Database connection usage
- Cache hit rates
- Slow query detection

### Database Performance Service

The `DatabasePerformanceService` provides:

- Query performance analysis
- Connection pool monitoring
- Cache management
- Database optimization recommendations

## Usage

### Apply Performance Indexes

```bash
npm run apply-indexes
```

### Run Performance Tests

```bash
npm run test-performance
```

### Full Database Optimization

```bash
npm run optimize-db
```

## Performance Targets

### Query Performance Goals

- User authentication: >100 queries/second
- Organization filtering: >50 queries/second
- Role-based queries: >100 queries/second
- Complex aggregations: >10 queries/second

### Connection Pool Settings

- Max connections: 20
- Min connections: 2
- Connection timeout: 5 seconds
- Statement timeout: 60 seconds

### Cache Configuration

- Query cache TTL: 5 minutes
- Max cache size: 100 entries
- Target cache hit rate: >85%

## Monitoring and Maintenance

### Regular Maintenance Tasks

1. **Index Usage Analysis**: Monitor index scan counts and effectiveness
2. **Table Statistics**: Keep table statistics up to date with ANALYZE
3. **Vacuum Management**: Clean up dead tuples in high-activity tables
4. **Connection Pool Monitoring**: Track pool utilization and adjust as needed

### Performance Alerts

- Slow queries (>1 second)
- High connection pool utilization (>80%)
- Low cache hit rate (<80%)
- High dead tuple ratio (>10%)

### Optimization Recommendations

1. **Missing Indexes**: Create additional indexes for new query patterns
2. **Query Optimization**: Rewrite inefficient queries using optimized patterns
3. **Connection Scaling**: Adjust pool size based on load patterns
4. **Cache Tuning**: Optimize cache TTL and size based on usage patterns

## Migration Considerations

### Backward Compatibility

- Legacy `customer_id` indexes maintained during migration
- Gradual transition from customer-based to organization-based filtering
- Fallback queries for users without organization assignments

### Index Creation Strategy

- Use `CREATE INDEX CONCURRENTLY` to avoid blocking operations
- Create indexes during low-traffic periods
- Monitor index creation progress and impact

### Performance Validation

- Run performance tests before and after optimization
- Compare query execution plans
- Monitor production metrics for improvements

## Troubleshooting

### Common Performance Issues

1. **Slow Authentication**: Check `idx_users_role_active` usage
2. **Slow Organization Queries**: Verify `idx_users_org_role` effectiveness
3. **Slow Assessment Filtering**: Check `idx_assessment_cases_org_module` usage
4. **High Connection Usage**: Monitor and adjust pool settings

### Diagnostic Queries

```sql
-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Check slow queries (requires pg_stat_statements)
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Check table statistics
SELECT schemaname, tablename, n_live_tup, n_dead_tup, last_analyze
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;
```

## Future Optimizations

### Potential Improvements

1. **Partitioning**: Consider table partitioning for large assessment_cases table
2. **Read Replicas**: Implement read replicas for analytics queries
3. **Connection Pooling**: External connection pooler (PgBouncer) for high load
4. **Query Caching**: Redis-based query result caching for expensive operations

### Monitoring Enhancements

1. **Real-time Metrics**: Implement real-time performance dashboards
2. **Automated Optimization**: Automatic index recommendations
3. **Predictive Scaling**: Load-based connection pool adjustment
4. **Performance Regression Detection**: Automated performance regression alerts

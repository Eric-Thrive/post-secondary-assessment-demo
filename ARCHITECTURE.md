# Platform Architecture Documentation

## Overview

The AI-Powered Educational Accessibility Platform is a modern, cloud-native application designed for scalable deployment across multiple hosting environments. This document outlines the current production architecture and deployment strategies.

## Current Architecture

### Technology Stack

**Frontend**

- React 18 with TypeScript
- Vite for build tooling and development
- Tailwind CSS with shadcn/ui components
- React Query for state management
- PDF.js for client-side document processing

**Backend**

- Node.js with Express.js
- TypeScript for type safety
- Session-based authentication
- RESTful API design with `/api` prefix

**Database**

- PostgreSQL (version 14+)
- Drizzle ORM for type-safe database operations
- Connection pooling for performance
- Multi-tenant architecture with customer isolation

**AI Integration**

- OpenAI GPT-4 with function calling
- Cascade inference system
- Dynamic database queries
- Smart token management

### Deployment Architecture

**Primary Deployment: Railway**

- Nixpacks builder for automatic deployment
- Managed PostgreSQL database
- Automatic SSL certificates
- Health check monitoring at `/health`
- Environment variable management
- GitHub integration for CI/CD

**Alternative Deployments**

- Vercel (frontend) + separate backend hosting
- Neon Database for PostgreSQL
- Supabase for full-stack deployment
- Self-hosted with Docker

### Environment Configuration

**Production Environment**

```bash
APP_ENVIRONMENT=production
NODE_ENV=production
DATABASE_URL=postgresql://...
OPENAI_API_KEY=sk-...
VITE_PI_REDACTOR_URL=https://...
SESSION_SECRET=random-string
PORT=5001
```

**Development Environment**

```bash
APP_ENVIRONMENT=development
NODE_ENV=development
DATABASE_URL=postgresql://localhost:5432/...
# Same other variables as production
```

**Demo Environments**

- `k12-demo`: K-12 module demonstration
- `post-secondary-demo`: Post-secondary module demonstration
- `tutoring-demo`: Tutoring module demonstration

## Module Architecture

### Three-Module System

**K-12 Assessment Module**

- Grade-specific analysis (K-12)
- Support lookup strategies
- Caution warnings and observation templates
- Educational accommodation focus

**Post-Secondary Module**

- Higher education context
- Accommodation mappings
- Barrier resolution strategies
- Transition planning support

**Tutoring Module**

- One-on-one tutoring context
- Personalized learning strategies
- Progress tracking capabilities
- Adaptive instruction recommendations

### Shared Components

**AI Processing Pipeline**

- Multi-file document upload
- Client-side PDF text extraction
- OpenAI GPT-4 integration with function calling
- Cascade inference for comprehensive analysis
- Template enforcement and validation

**Database Schema**

- Shared types across client/server
- UUID-based case management
- Audit logging for compliance
- Customer data isolation

## Security Architecture

### Authentication & Authorization

- Session-based authentication with secure cookies
- Role-based access control (RBAC)
- Multi-factor authentication support
- Session timeout management

### Data Protection

- Mandatory PI redaction via external service
- Encryption at rest for PII data
- HTTPS/TLS for data in transit
- Customer data isolation in multi-tenant setup

### Compliance

- FERPA compliance for educational data
- HIPAA compliance preparation for healthcare data
- Comprehensive audit logging
- Data retention and deletion policies

## Performance Architecture

### Optimization Strategies

- Connection pooling (20 connections)
- Redis caching for sessions and frequent queries
- Code splitting and lazy loading
- Asset optimization and CDN usage
- Response compression

### Monitoring

- Health check endpoint (`/health`)
- Performance metrics collection
- Error tracking and alerting
- Database query optimization
- AI processing cost tracking

## Development Workflow

### Local Development

- Local PostgreSQL for faster development
- Hot module replacement with Vite
- TypeScript strict mode
- ESLint and Prettier for code quality

### Testing Strategy

- Jest for unit testing
- React Testing Library for component testing
- Playwright for end-to-end testing
- 80% minimum code coverage requirement

### CI/CD Pipeline

- GitHub Actions for automated testing
- Automated deployment on Railway
- Environment-specific configurations
- Database migration automation

## Deployment Strategies

### Railway Deployment (Recommended)

1. **Setup**

   - Connect GitHub repository to Railway
   - Configure environment variables
   - Railway auto-detects Node.js and builds with Nixpacks

2. **Database**

   - Railway PostgreSQL addon
   - Automatic backups and scaling
   - Connection pooling included

3. **Monitoring**
   - Built-in metrics and logging
   - Health check integration
   - Automatic restarts on failure

### Alternative Deployments

**Vercel + Neon**

- Frontend on Vercel
- Backend on Railway/Render
- Database on Neon

**Self-Hosted**

- Docker containerization
- Kubernetes orchestration
- Manual database management

## Migration History

### From Replit (Completed)

- Migrated from Replit hosting to Railway
- Updated all environment configurations
- Removed Replit-specific dependencies
- Updated documentation and references
- Validated all functionality in new environment

### Key Changes Made

- Removed Replit Vite plugins
- Updated database connection strings
- Modified environment variable handling
- Updated deployment scripts
- Cleaned up legacy configuration files

## Future Architecture Considerations

### Scalability

- Horizontal scaling with load balancers
- Database read replicas
- CDN for static assets
- Microservices architecture consideration

### Enhanced Security

- OAuth 2.0 integration
- Advanced threat detection
- Enhanced audit logging
- Zero-trust architecture

### Performance

- GraphQL API consideration
- Advanced caching strategies
- Database sharding for large datasets
- AI processing optimization

## Support and Maintenance

### Monitoring

- Application performance monitoring (APM)
- Database performance tracking
- Error tracking and alerting
- User analytics and usage patterns

### Backup and Recovery

- Automated database backups
- Point-in-time recovery
- Disaster recovery procedures
- Data integrity validation

### Updates and Maintenance

- Rolling deployments
- Blue-green deployment strategy
- Database migration procedures
- Security patch management

---

_Last Updated: October 2025_
_Current Version: Production-ready with Railway deployment_

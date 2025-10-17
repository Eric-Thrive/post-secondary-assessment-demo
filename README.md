# Educational Accessibility Platform

An advanced AI-powered educational accessibility platform that dynamically adapts support resources for diverse learning needs through intelligent semantic matching and personalized recommendations.

## Deployment Options

- **Railway** (Recommended) - [15-Minute Quick Start](QUICKSTART_RAILWAY.md)
- **Replit** (Legacy) - Original deployment platform
- **Local Development** - VS Code with Railway CLI

## Overview

This sophisticated assessment report generator creates comprehensive accommodation reports for both K-12 and post-secondary educational contexts. The system uses advanced OpenAI integration with function calling to analyze uploaded documents and produce structured reports with barrier identification, accommodation mappings, and evidence-based recommendations.

## Key Features

### Dual-Module Architecture
- **K-12 Assessment Module**: Grade-specific analysis with support lookup strategies, caution warnings, and observation templates
- **Post-Secondary Module**: Higher education focus with accommodation mappings and barrier resolution

### AI Processing Pipeline
- Multi-file document upload with drag-and-drop support
- Client-side PDF text extraction using PDF.js
- Advanced OpenAI GPT-4 integration with function calling
- Cascade inference system for comprehensive content generation
- Template enforcement with automatic validation

### Database Architecture
- **ORM**: Drizzle with PostgreSQL
- **Connection**: Replit PostgreSQL with connection pooling
- **Schema**: Shared types across client/server for consistency
- **Migrations**: Managed via drizzle-kit

## Technology Stack

### Frontend
- **Framework**: React with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: React Context API and React Query
- **Build Tool**: Vite for development and production

### Backend
- **Runtime**: Node.js with Express.js
- **Database**: PostgreSQL (Railway, Replit, Neon, or Supabase)
- **Authentication**: Session-based with connect-pg-simple
- **API**: RESTful with `/api` prefix
- **Deployment**: Railway auto-deploy from GitHub

### AI Integration
- **Model**: OpenAI GPT-4 with function calling
- **Features**: Dynamic database queries, expert inference, smart token management
- **Lookup Tables**: Real-time barrier and accommodation resolution

## Getting Started

### Quick Start (Railway - 15 minutes)

See [QUICKSTART_RAILWAY.md](QUICKSTART_RAILWAY.md) for step-by-step Railway deployment guide.

### Prerequisites
- Node.js 20+
- PostgreSQL database (or use Railway's managed PostgreSQL)
- OpenAI API key
- Railway CLI (optional): `npm install -g @railway/cli`

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Eric-Thrive/post-secondary-assessment-demo.git
   cd post-secondary-assessment-demo
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your values:
   # - DATABASE_URL (PostgreSQL connection string)
   # - OPENAI_API_KEY
   # - SESSION_SECRET (generate with: openssl rand -base64 32)
   # - APP_ENVIRONMENT (local, railway, neon, supabase)
   # - VITE_PI_REDACTOR_URL (optional PI Redactor tool URL)
   ```

   **Deployment Notes**:
   - **Railway**: Set environment variables in Railway dashboard or via `railway variables set`
   - **Replit**: Use Replit Secrets manager (Tools → Secrets)
   - See [PI_REDACTOR_SETUP.md](PI_REDACTOR_SETUP.md) for PI Redactor integration

4. Run database migrations:
   ```bash
   npm run db:push
   # Or with Railway: railway run npm run db:push
   ```

5. Start the development server:
   ```bash
   npm run dev
   # Runs on http://localhost:5000
   ```

## Usage

### K-12 Assessment Analysis
1. Navigate to the K-12 module
2. Upload assessment documents (PDF supported)
3. Select student grade level
4. Generate comprehensive analysis report
5. Export results in multiple formats

### Post-Secondary Analysis
1. Access the Post-Secondary module
2. Upload relevant documentation
3. Process through AI analysis pipeline
4. Review accommodation recommendations
5. Generate structured reports

## Architecture

### Report Generation Workflow
1. **Document Upload**: Multi-file support with client-side processing
2. **AI Analysis**: Advanced function calling with database integration
3. **Template Validation**: Strict Section 2/3 separation enforcement
4. **Content Generation**: Evidence-based recommendations
5. **Database Storage**: Complete analysis persistence
6. **Export Options**: PDF, Word, and structured data formats

### Key Components
- **Assessment Cases**: UUID-based case management
- **Item Master**: Structured educational data extraction
- **Cascade Inference**: AI-generated content for missing database entries
- **Quality Control**: Validation status tracking and transparency

## Development

### Available Scripts
- `npm run dev`: Start development server (localhost:5000)
- `npm run build`: Build for production (Vite + esbuild)
- `npm run start`: Start production server
- `npm run check`: TypeScript type checking
- `npm run db:push`: Push schema changes to database
- `npx drizzle-kit studio`: Open Drizzle Studio (database GUI)

### Railway Deployment
- **Auto-deploy**: Push to `main` branch triggers automatic deployment
- **Manual deploy**: `railway up`
- **View logs**: `railway logs --follow`
- **Database access**: `railway run psql $DATABASE_URL`

### Project Structure
```
├── client/          # React frontend
├── server/          # Express backend
├── shared/          # Shared types and schemas
└── scripts/         # Database and utility scripts
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please contact the development team or create an issue in the repository.
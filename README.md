# Replit Accommodation Engine

An advanced AI-powered educational accessibility platform that dynamically adapts support resources for diverse learning needs through intelligent semantic matching and personalized recommendations.

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
- **Database**: Replit PostgreSQL
- **Authentication**: Session-based with connect-pg-simple
- **API**: RESTful with `/api` prefix

### AI Integration
- **Model**: OpenAI GPT-4 with function calling
- **Features**: Dynamic database queries, expert inference, smart token management
- **Lookup Tables**: Real-time barrier and accommodation resolution

## Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- OpenAI API key

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Eric-Thrive/replit-accommodation-engine.git
   cd replit-accommodation-engine
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Add your DATABASE_URL and OPENAI_API_KEY
   # Add your VITE_PI_REDACTOR_URL (PI Redactor tool URL)
   ```
   
   **Note for Replit Users**: Use the Replit Secrets manager (Tools → Secrets) to add environment variables instead of editing `.env` files directly. See [PI_REDACTOR_SETUP.md](PI_REDACTOR_SETUP.md) for detailed PI Redactor integration instructions.

4. Run database migrations:
   ```bash
   npm run db:push
   ```

5. Start the development server:
   ```bash
   npm run dev
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
- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run db:push`: Push schema changes
- `npm run db:studio`: Open database studio

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
# Assessment Report Generator

## Overview
This project is an AI-powered educational assessment application that generates comprehensive accommodation reports for K-12 and post-secondary educational contexts. It analyzes uploaded documents using advanced AI function calling to produce structured reports, including barrier identification, accommodation mappings, and evidence-based recommendations. The system aims to streamline assessment processes and provide tailored support plans for students.

## Recent Changes (October 16, 2025)
- **Finalized Document Review Workflow**: Implemented document review page for pre-analysis validation
  - **Document Finalization Detection**: Automatic detection of finalized documents via filename pattern `_FINALIZED_YYYYMMDD_HHMM`
    - DocumentUpload component now checks for `_FINALIZED_` pattern in filenames from PI Redactor
    - Documents marked with `finalized: true` flag in DocumentFile type
    - Only finalized documents are processed by AI analysis
  - **Review Page Component**: New ReviewDocumentsPage displays finalized documents before analysis
    - Shows assessment information (unique ID, report author, grade level)
    - Lists only documents marked as finalized with timestamp parsing
    - "Proceed to Analysis" button enabled only when finalized documents exist
    - Pathway-aware back navigation (K12 simple vs complex pathways)
    - Clear visual indicators (checkmarks, badges) for finalized status
  - **Updated Assessment Workflow**: Modified flow to include review step
    - Assessment form → Review finalized documents → AI analysis → Reports
    - FileList converted to File array for proper state serialization
    - No breaking changes to existing analysis functionality
  - **PI Redactor Integration**: Full integration with new redactor version
    - Environment variable `VITE_PI_REDACTOR_URL` configured for redactor popup
    - PostMessage API receives redacted files with finalized naming convention
    - Security validation ensures messages only accepted from configured redactor origin

## Recent Changes (October 8, 2025)
- **Dual-Access Architecture Implementation**: Established separate customer and developer access modes for improved user experience
  - **Customer Experience Shell**: Created dedicated routes at `/post-secondary-demo/*`, `/k12-demo/*`, `/tutoring-demo/*`
    - Environment locked to respective demo modes with no switching capability
    - Environment switcher component automatically hidden
    - Backend API errors handled gracefully without disrupting user experience
    - Module automatically locked based on demo type (post-secondary, k12, or tutoring)
  - **Developer Shell**: Maintained full functionality at standard routes (`/`, `/reports`, etc.)
    - Complete environment switching capability preserved
    - Environment switcher visible with all demo and production options
    - Backend environment API called with graceful failure handling
    - Module switching remains flexible for development and testing
  - **EnvironmentContext Enhancements**: Updated context to support forced environments
    - Added `forcedEnvironment` prop for customer-facing routes
    - Implemented `isCustomerMode` and `isDeveloperMode` properties
    - Backend `/api/environment` errors now handled gracefully with fallback to client-side switching
    - Client-side environment switching works even when backend is unavailable
  - **Performance Optimizations**: Resolved page reload issues with React Router navigation
    - Replaced `window.location.href` with `useNavigate` for client-side routing
    - Implemented sessionStorage caching for instant report display when navigating
    - Eliminated full page reloads when switching between Report Viewer and Review & Edit pages

## Recent Changes (September 19, 2025)
- **Centralized Post-Secondary Report Parsing**: Created dedicated parsing utility for post-secondary reports at `client/src/utils/postSecondaryReportParser.ts`
  - Extracted all markdown parsing logic from FigmaEnhancedReportViewer into reusable functions
  - Improved maintainability by centralizing parsing functions for sections, accommodations, and barriers
  - Standardized parsing of all 4 required accommodation categories (Academic, Testing, Technology Support, Additional Resources/Services)
- **Isolated Pathway Configuration**: Implemented dedicated configuration module for post-secondary pathway settings at `server/config/postSecondaryPathways.ts`
  - Isolated post-secondary module configuration to prevent interference with other report types (K-12, tutoring)
  - Enhanced demo environment support with automatic simple pathway selection
  - Validation functions ensure all 4 accommodation categories are generated in reports
  - Strict separation between demo and production environments maintained

## Recent Changes (September 13, 2025)
- **Enhanced Document Processing System**: Implemented comprehensive multi-format document support with advanced OCR capabilities
  - **PDF Processing with OCR Fallback**: Enhanced PDFExtractionService with intelligent OCR fallback using Tesseract.js
    - Automatic detection of scanned PDFs when text extraction yields minimal content (<50 characters)
    - PDF-to-image conversion using PDF.js canvas rendering at 2.0x scale for optimal OCR accuracy
    - Sequential page processing with 10-page limit to balance functionality with performance
    - Comprehensive error handling and progress logging throughout the OCR pipeline
  - **Word Document Support**: Added complete Microsoft Word document processing using Mammoth.js
    - Client-side text extraction from .docx and .docm files
    - Removed .doc support with clear user guidance to convert to modern formats
    - Robust validation and error handling for document processing failures
  - **Image OCR Processing**: Integrated Tesseract.js for extracting text from scanned images
    - Support for multiple image formats: JPG, PNG, GIF, BMP, TIFF, WEBP
    - Confidence scoring and validation of OCR results
    - Progress tracking and detailed logging for troubleshooting
  - **Enhanced File Upload Interface**: Updated DocumentUpload component to support expanded file types
    - Accepts: .pdf, .docx, .jpg, .jpeg, .png, .gif, .bmp, .tiff, .webp, .txt
    - Maintained 4-document upload limit with improved user feedback
    - All processing remains client-side for maximum security and data privacy
- **Previous Database Migration Completed (September 12, 2025)**: Full Supabase to Replit PostgreSQL migration with comprehensive development database setup and enhanced security controls

## User Preferences
Preferred communication style: Simple, everyday language.
Report formatting:
- Serial numbering required for all barriers (e.g., "Observed Barrier 1:", "Observed Barrier 2:", etc.)
- Sequential numbering required for all accommodations within each category (e.g., Academic Accommodations: 1., 2., 3.)
Prompt Management:
- No changes to prompts or templates without explicit user permission
- User must approve all modifications to system instructions, report templates, and database content
- Always ask before updating any prompt-related content

## System Architecture
The application features a dual-module architecture for K-12 and Post-Secondary assessments, each with distinct AI configurations, database schemas, and report generation workflows.

**Frontend:**
-   **Framework:** React with TypeScript
-   **Styling:** Tailwind CSS with shadcn/ui components
-   **State Management:** React Context API, React Query
-   **PDF Processing:** Client-side text extraction using PDF.js worker

**Backend:**
-   **Runtime:** Node.js with Express.js
-   **AI Processing:** Direct OpenAI integration (GPT-4.1 primary, GPT-4o fallback)
-   **Database:** Replit PostgreSQL (unified for dev and production)
-   **ORM:** Drizzle with PostgreSQL dialect
-   **API:** RESTful API with `/api` prefix

**Key Features & Design Patterns:**
-   **Dual-Module Architecture:** Separate K-12 and Post-Secondary modules with tailored configurations, prompts, and lookup tables.
-   **AI Processing Pipeline:** Handles multi-file document upload, client-side PDF extraction, direct OpenAI analysis, template enforcement, and structured report generation.
-   **Advanced AI Configuration:** Strict model enforcement (GPT-4.1 primary, GPT-4o fallback), dynamic function calling for database queries, comprehensive system prompts (6,371+ characters), expert inference for missing data, and smart token management.
-   **Report Generation:** Markdown output with export options (PDF, Word, raw text), including structured data extraction for educational assessments.
-   **Review & Edit Workflow:** Allows users to review, edit, and restore original versions of generated reports with change tracking.
-   **Prompt Management:** System prompts and report templates are database-driven for real-time updates and flexibility.

## External Dependencies
-   **OpenAI GPT-4.1 / GPT-4o:** AI models for analysis, content generation, and function calling.
-   **Replit PostgreSQL:** Primary database for development and production data storage.
-   **@neondatabase/serverless:** PostgreSQL client for database interaction.
-   **pdfjs-dist:** For client-side PDF text extraction.
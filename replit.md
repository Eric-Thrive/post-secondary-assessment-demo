# Assessment Report Generator

## Overview
This project is an AI-powered educational assessment application designed to generate comprehensive accommodation reports for K-12 and post-secondary educational contexts. It analyzes uploaded documents using advanced AI function calling to produce structured reports, including barrier identification, accommodation mappings, and evidence-based recommendations. The system aims to streamline assessment processes and provide tailored support plans for students, improving efficiency and personalization in educational support.

## Recent Changes (October 21, 2025)
- **Fixed Data Flash During Dashboard Refresh**: Eliminated visual flash showing "0 reports available" when navigating back to dashboard
  - **Smart Loading States**: Updated assessment case hooks to distinguish between initial load and background refreshes
    - Added useRef tracking (hasInitiallyLoaded) to prevent clearing data during refreshes
    - Only show loading state on first mount, not on subsequent data refetches
    - Previous data remains visible while new data loads in the background
  - **Optimized Hook Dependencies**: Fixed double-fetch regression by maintaining stable loadCases reference
    - Removed isLoading from useCallback dependency arrays to prevent recreation on state changes
    - Unconditional setIsLoading(false) in finally block (React optimizes no-ops automatically)
    - Applied pattern consistently across all four assessment hooks (K12, Post-Secondary, Tutoring, General)
  - **Impact**: Smooth user experience when returning to dashboard - report counts update seamlessly without flashing zero, reducing cognitive load and improving perceived performance
- **Streamlined Assessment Workflow**: Removed redundant Review Documents page to create a more efficient two-step workflow
  - **Direct Analysis Trigger**: Modified UnifiedAssessmentForm to start AI analysis immediately when "Start Analysis" is clicked
    - Moved all analysis logic from ReviewDocumentsPage into UnifiedAssessmentForm's handleSubmit function
    - Analysis now validates finalized documents and starts processing without intermediate navigation
    - Document Upload → AI Analysis → Reports (reduced from three steps to two)
  - **Preserved Validation**: All document validation logic maintained in the streamlined flow
    - Finalized document checks occur before analysis starts
    - Text extraction from finalized files only (skips non-finalized documents)
    - Error handling for missing documents, non-finalized files, and API failures
  - **TypeScript Compliance**: Fixed module type routing to align with component's declared union types
    - Reports routing now correctly handles only k12 and post_secondary module types
    - Resolved TS2367 build error by removing tutoring case check from UnifiedAssessmentForm
  - **Impact**: Faster workflow with fewer clicks, reduced cognitive load for users, and immediate feedback when starting analysis

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
-   **Document Processing:** Client-side text extraction using PDF.js worker, Mammoth.js for Word documents, and Tesseract.js for image OCR.
-   **UI/UX:** Streamlined two-step assessment workflow (Document Upload → AI Analysis → Reports), enhanced document upload UI with confirmation and disabled states for workflow control, prominent PI Redactor button.
-   **Accessibility:** WCAG AA compliant elements (e.g., contrast ratios, focus rings).

**Backend:**
-   **Runtime:** Node.js with Express.js
-   **AI Processing:** Direct OpenAI integration (GPT-4.1 primary, GPT-4o fallback)
-   **Database:** Replit PostgreSQL (unified for dev and production)
-   **ORM:** Drizzle with PostgreSQL dialect
-   **API:** RESTful API with `/api` prefix

**Key Features & Design Patterns:**
-   **Dual-Module Architecture:** Separate K-12 and Post-Secondary modules with tailored configurations, prompts, and lookup tables. Includes dedicated customer-facing demo environments with locked configurations and a developer shell with full functionality.
-   **AI Processing Pipeline:** Handles multi-format document upload (PDF, DOCX, images, TXT), client-side text extraction with OCR fallback, direct OpenAI analysis, template enforcement, and structured report generation.
-   **Advanced AI Configuration:** Strict model enforcement, dynamic function calling for database queries, comprehensive system prompts, expert inference for missing data, and smart token management.
-   **Report Generation:** Markdown output with export options (PDF, Word, raw text), including structured data extraction for educational assessments. Centralized parsing utilities for post-secondary reports.
-   **Review & Edit Workflow:** Allows users to review, edit, and restore original versions of generated reports with change tracking.
-   **Prompt Management:** System prompts and report templates are database-driven for real-time updates and flexibility.
-   **Document Finalization:** Automatic detection of finalized documents via filename patterns for pre-analysis validation.
-   **Environment Persistence:** Demo environments maintain state across logout/login cycles and navigation through URL-based detection and protected routes.

## External Dependencies
-   **OpenAI GPT-4.1 / GPT-4o:** AI models for analysis, content generation, and function calling.
-   **Replit PostgreSQL:** Primary database for development and production data storage.
-   **@neondatabase/serverless:** PostgreSQL client for database interaction.
-   **pdfjs-dist:** For client-side PDF text extraction.
-   **Mammoth.js:** For client-side Word document (.docx, .docm) text extraction.
-   **Tesseract.js:** For client-side OCR processing of scanned PDFs and images.
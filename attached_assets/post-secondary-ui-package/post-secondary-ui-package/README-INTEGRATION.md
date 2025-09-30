# THRIVE Post-Secondary UI Package - Integration Guide

## Overview
This package contains the complete Figma-enhanced post-secondary UI system used in THRIVE's accommodation report viewer. It provides a comprehensive, professional interface with THRIVE branding, custom Figma icons, and complete data isolation from K-12 systems.

## Package Contents

### Components
- **FigmaEnhancedReportViewer.tsx** - Main report viewer with Figma-designed interface (2000+ lines)
- **PostSecondaryReportGenerator.tsx** - Main page component with URL parameter handling
- **BaseReportGenerator.tsx** - Base component for reusable report logic
- **ReportHeader.tsx** - Header with case selection and download controls
- **ReportContent.tsx** - Standard content viewer (fallback for enhanced view)

### Hooks
- **useModuleAssessmentData.ts** - Module-aware data fetching
- **usePostSecondaryAssessmentData.ts** - Post-secondary specific data handling
- **useMarkdownReport.ts** - Markdown report processing and validation

### Assets (11 Files)
- **Custom Figma Icons** - 8 professionally designed navigation icons
- **THRIVE Logo** - Official brand logo (isotype Y-NB)
- **Illustrations** - Barrier illustration and completion background
- **Total Size** - ~4.5MB of high-quality assets

### Database Schema
- **postSecondaryReports.sql** - Complete database schema for post-secondary reports
- **Complete isolation** from K-12 assessment_cases table

### Styling
- **post-secondary.css** - THRIVE brand styles with official color palette

### Types
- **assessmentCase.ts** - Assessment case interface definitions
- **moduleConfig.ts** - Module configuration with feature flags

## Key Features

### 🎨 Figma-Enhanced Interface
- Professional design system with THRIVE brand colors
- Custom navigation icons designed specifically for the system
- Responsive layout with mobile support
- Smooth animations and transitions

### 🔐 Complete Data Isolation
- Post-secondary reports stored in separate `post_secondary_reports` table
- Zero risk of K-12 versioning changes affecting post-secondary data
- Smart routing system maintains compatibility

### 📱 Responsive Design
- Mobile-optimized sidebar navigation
- Adaptive content areas
- Touch-friendly interface elements

### 🎯 Demo URL Support
- Shareable demo links: `/post-secondary-reports?case={id}&view=figma&autoload=true`
- Auto-detects URL parameters for seamless navigation
- Clean demo experience with hidden controls

### 🎨 THRIVE Brand Integration
- **Navy Blue (#1297D2)** - Primary actions and branding
- **Sky Blue (#96D7E1)** - Secondary elements and highlights
- **Orange (#F89E54)** - Accent color for interactions
- **Yellow (#FDE677)** - Active states and selections

## Installation Requirements

### Dependencies
```json
{
  "react": "^18.0.0",
  "react-router-dom": "^6.0.0",
  "@radix-ui/react-*": "Latest versions",
  "tailwindcss": "^3.0.0",
  "lucide-react": "Latest",
  "react-markdown": "^8.0.0",
  "remark-gfm": "^3.0.0"
}
```

### Database Requirements
- PostgreSQL with UUID support
- Drizzle ORM setup
- Separate post-secondary reports table (see schema/)

### Framework Integration
- **Vite** - Asset import system configured
- **Tailwind CSS** - For styling system
- **shadcn/ui** - Component library

## Integration Steps

### Step 1: Install Dependencies
```bash
npm install @radix-ui/react-* tailwindcss lucide-react react-markdown remark-gfm
```

### Step 2: Copy Files
```bash
# Copy all components
cp -r post-secondary-ui-package/components/* your-project/src/components/

# Copy hooks
cp -r post-secondary-ui-package/hooks/* your-project/src/hooks/

# Copy assets (configure import paths as needed)
cp -r post-secondary-ui-package/assets/* your-project/src/assets/

# Copy types
cp -r post-secondary-ui-package/types/* your-project/src/types/

# Copy styles
cp post-secondary-ui-package/styles/post-secondary.css your-project/src/styles/
```

### Step 3: Configure Asset Imports
Update your Vite config to support asset imports:
```typescript
// vite.config.ts
export default defineConfig({
  resolve: {
    alias: {
      '@assets': path.resolve(__dirname, './src/assets'),
      '@': path.resolve(__dirname, './src'),
    }
  }
});
```

### Step 4: Database Setup
```sql
-- Run the post-secondary schema
\i post-secondary-ui-package/schema/postSecondaryReports.sql
```

### Step 5: Configure Routing
```typescript
// App.tsx or your router
import PostSecondaryReportsPage from './pages/PostSecondaryReportsPage';

// Add route
<Route path="/post-secondary-reports" component={PostSecondaryReportsPage} />
```

### Step 6: Import Styles
```css
/* your main CSS file */
@import './styles/post-secondary.css';
```

## Customization Guide

### Brand Colors
Update the CSS variables in `post-secondary.css`:
```css
:root {
  --thrive-navy: #1297D2;      /* Primary brand color */
  --thrive-sky-blue: #96D7E1;  /* Secondary color */
  --thrive-orange: #F89E54;    /* Accent color */
  --thrive-yellow: #FDE677;    /* Highlight color */
}
```

### Custom Icons
Replace icons in the assets folder and update import paths in `FigmaEnhancedReportViewer.tsx`:
```typescript
import CustomIcon from '@assets/your-custom-icon.png';
```

### Database Configuration
Modify the database connection and table names as needed:
```typescript
// Update table references in hooks and components
const tableName = 'your_post_secondary_table';
```

## API Requirements

### Expected Data Structure
```typescript
interface PostSecondaryCase {
  id: string;
  display_name: string;
  status: 'draft' | 'processing' | 'completed' | 'error';
  analysis_result?: {
    markdown_report: string;
    item_master_data: any[];
  };
  created_date: string;
  last_updated: string;
  module_type: 'post_secondary';
}
```

### Required Endpoints
- `GET /api/post-secondary-cases` - List all cases
- `GET /api/post-secondary-cases/:id` - Get specific case
- `POST /api/post-secondary-cases` - Create new case
- `PUT /api/post-secondary-cases/:id` - Update case

## Advanced Features

### Demo URL Integration
The system supports shareable demo URLs:
```
/post-secondary-reports?case=123&view=figma&autoload=true
```

### Multi-Document Support
- Supports multiple PDF uploads per case
- Client-side PDF text extraction
- Document name tracking

### Export Options
- Markdown export with proper formatting
- PDF generation support
- Raw text export
- Item master data export (CSV, JSON, Markdown)

## Troubleshooting

### Common Issues

#### Asset Import Errors
- Ensure Vite alias configuration is correct
- Check asset file paths and extensions
- Verify assets are copied to correct directory

#### Database Connection Issues
- Confirm post_secondary_reports table exists
- Check database connection string
- Verify PostgreSQL UUID extension is enabled

#### Styling Issues
- Import post-secondary.css in your main CSS file
- Check Tailwind CSS configuration
- Ensure CSS custom properties are supported

### Type Errors
- Update import paths for types
- Install required @types packages
- Check TypeScript configuration

## Support and Maintenance

### File Structure
```
post-secondary-ui-package/
├── components/           # React components
│   ├── FigmaEnhancedReportViewer.tsx
│   ├── PostSecondaryReportGenerator.tsx
│   └── report/          # Supporting components
├── hooks/               # Custom React hooks
├── assets/              # Images, icons, and media
├── types/               # TypeScript definitions
├── schema/              # Database schemas
├── styles/              # CSS and styling
└── README-INTEGRATION.md # This file
```

### Version Compatibility
- **React**: 18+ required for hooks
- **TypeScript**: 4.5+ for type definitions  
- **Node.js**: 16+ for development server
- **PostgreSQL**: 12+ for database features

### Performance Considerations
- Assets total ~4.5MB - consider CDN for production
- Component is ~2000+ lines - code splitting recommended
- Database queries optimized with indexes

## Demo Integration Example

```typescript
// Quick integration example
import PostSecondaryReportGenerator from './components/PostSecondaryReportGenerator';
import './styles/post-secondary.css';

export default function App() {
  return (
    <div className="app">
      <PostSecondaryReportGenerator />
    </div>
  );
}
```

## License and Attribution
This package contains THRIVE proprietary assets and branding. Please ensure proper licensing for commercial use.

---

**Package Version**: 1.0.0  
**Last Updated**: September 2025  
**Compatibility**: React 18+, TypeScript 4.5+
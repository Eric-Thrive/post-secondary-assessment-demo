# Post-Secondary Report Design Specification

**Document Type:** Design Specification for Figma  
**Last Updated:** October 29, 2025  
**Status:** Ready for Design Implementation

---

## Overview

This document provides the design specification for the Post-Secondary Disability Accommodation Report interface. It includes the content structure, component requirements, and layout guidelines for Figma design implementation.

---

## Report Structure

### 1. Header Section

- **Report Title:** "Post-Secondary Disability Accommodation Report"
- **Metadata Fields:**
  - Analysis Date
  - Student Level (always "Post-Secondary")
  - Total Findings count
- **Visual Style:** Professional, accessible, clean typography

### 2. Executive Summary

- **Purpose:** High-level overview of findings and recommendations
- **Content:** 2-3 paragraph summary
- **Key Elements:**
  - Total barrier count breakdown (validated/review/flagged)
  - Key accommodation recommendations
  - Overall impact statement

### 3. Section 1: Functional Impact Summary

#### 3.1 Validated Functional Barriers

**Component Type:** Expandable card list

**Card Structure:**

- **Header:**
  - Index number
  - Canonical barrier name
  - Barrier ID (e.g., "B-001")
- **Content Sections:**
  - Evidence (with citations)
  - Functional Impact
  - Barrier Definition
  - Academic/Environmental Impact
  - Quality Control metadata

**Visual Treatment:**

- Status indicator: Green/validated
- Collapsible sections for readability
- Clear visual hierarchy

#### 3.2 Barriers Requiring Review

**Component Type:** Same as validated, different status indicator

**Visual Treatment:**

- Status indicator: Yellow/needs review
- Additional "Recommendation" section
- Clear call-to-action for next steps

#### 3.3 Flagged Barriers

**Component Type:** Same structure, warning status

**Visual Treatment:**

- Status indicator: Red/flagged
- Prominent "Recommendation" section
- Clear explanation of why flagged

### 4. Section 2: Academic Accommodations

**Component Type:** Detailed accommodation cards

**Card Structure:**

- **Header:** Accommodation name with index
- **Content Sections:**
  - Barriers Addressed (with clickable barrier IDs linking to Section 1)
  - Accommodation Details
  - Evidence Base
  - Implementation Notes
  - Accommodation Category badge
  - Legal Basis reference

**Visual Treatment:**

- Category badges (Academic/Instructional/Auxiliary Aid)
- Cross-reference links to barriers
- Implementation notes in distinct visual style

### 5. Section 3: Support Services (Optional)

**Component Type:** Support service cards

**Card Structure:**

- Service name
- Purpose
- Connection to barriers
- Service description
- Referral process
- Expected outcomes

### 6. Implementation Recommendations

**Component Type:** Tabbed or accordion section

**Tabs:**

- For Disability Services Staff
- For Faculty and Instructors
- For Students
- Quality Assurance Summary

### 7. Next Steps Section

**Component Type:** Action checklist

**Visual Treatment:**

- Numbered list with checkboxes
- Clear action items
- Timeline indicators if applicable

---

## Component Inventory

### Core Components Needed

1. **Report Header**

   - Title typography
   - Metadata grid
   - Date formatting

2. **Summary Card**

   - Multi-paragraph text container
   - Statistics display
   - Key findings highlight

3. **Barrier Card (3 variants)**

   - Validated (green)
   - Needs Review (yellow)
   - Flagged (red)
   - Expandable/collapsible
   - Status badge
   - Metadata footer

4. **Accommodation Card**

   - Category badge
   - Cross-reference links
   - Multi-section content
   - Implementation notes callout

5. **Support Service Card**

   - Service header
   - Multi-field content
   - Referral information

6. **Section Headers**

   - H1, H2, H3 hierarchy
   - Section numbering
   - Item counts

7. **Status Indicators**

   - Validated badge (green)
   - Needs Review badge (yellow)
   - Flagged badge (red)
   - Category badges

8. **Navigation Elements**

   - Table of contents
   - Section jump links
   - Barrier ID cross-references

9. **Action Components**
   - Checklist items
   - Call-to-action buttons
   - Recommendation boxes

---

## Layout Guidelines

### Desktop Layout (1200px+)

- Two-column layout for barrier cards
- Sidebar navigation for sections
- Sticky header with report metadata

### Tablet Layout (768px - 1199px)

- Single column layout
- Collapsible navigation
- Full-width cards

### Mobile Layout (<768px)

- Stacked single column
- Hamburger navigation
- Simplified card view
- Collapsible sections by default

---

## Typography Hierarchy

### Headings

- **H1 (Report Title):** 32px, Bold, Primary Color
- **H2 (Section Headers):** 24px, Semibold, Primary Color
- **H3 (Subsection Headers):** 20px, Semibold, Secondary Color
- **H4 (Card Headers):** 18px, Medium, Text Color

### Body Text

- **Body Large:** 16px, Regular (Executive Summary)
- **Body Regular:** 14px, Regular (Main content)
- **Body Small:** 12px, Regular (Metadata, footnotes)

### Special Text

- **Evidence Citations:** 14px, Italic
- **Implementation Notes:** 14px, Medium
- **Legal References:** 12px, Regular, Muted

---

## Color Palette

### Status Colors

- **Validated:** #10B981 (Green)
- **Needs Review:** #F59E0B (Amber)
- **Flagged:** #EF4444 (Red)

### Category Colors

- **Academic:** #3B82F6 (Blue)
- **Instructional:** #8B5CF6 (Purple)
- **Auxiliary Aid:** #06B6D4 (Cyan)

### Base Colors

- **Primary:** #1E40AF (Dark Blue)
- **Secondary:** #64748B (Slate)
- **Background:** #F8FAFC (Light Gray)
- **Surface:** #FFFFFF (White)
- **Text Primary:** #0F172A (Near Black)
- **Text Secondary:** #475569 (Gray)
- **Text Muted:** #94A3B8 (Light Gray)

### Borders

- **Default:** #E2E8F0
- **Hover:** #CBD5E1
- **Focus:** #3B82F6

---

## Accessibility Requirements

### WCAG 2.1 AA Compliance

- Color contrast ratio minimum 4.5:1 for body text
- Color contrast ratio minimum 3:1 for large text
- Status not conveyed by color alone (use icons + text)
- Keyboard navigation support
- Screen reader friendly structure
- Focus indicators on interactive elements

### Semantic Structure

- Proper heading hierarchy
- ARIA labels for status indicators
- Landmark regions for navigation
- Alt text for any icons or graphics

---

## Interactive Behaviors

### Expandable Sections

- Click header to expand/collapse
- Smooth animation (300ms)
- Icon rotation indicator
- Keyboard accessible (Enter/Space)

### Cross-References

- Barrier IDs are clickable links
- Smooth scroll to referenced section
- Highlight target on arrival
- Back-to-top button for long reports

### Filtering/Sorting (Future Enhancement)

- Filter by status (validated/review/flagged)
- Filter by accommodation category
- Sort barriers alphabetically or by severity

---

## Content Examples

### Sample Barrier Card Content

```
#### 1. Reading Comprehension Deficit - Barrier ID: B-001

**Evidence:** WAIS-IV Verbal Comprehension Index score of 82
(12th percentile), significantly below average. Woodcock-Johnson IV
Reading Comprehension subtest score of 78 (7th percentile).

**Functional Impact:** The student struggles to extract meaning from
college-level textbooks and academic articles, requiring 2-3 times
longer than peers to complete reading assignments.

**Quality Control:**
- Status: validated
- Mapping Method: Standardized assessment scores
- Documentation Currency: Current
```

### Sample Accommodation Card Content

```
#### 1. Extended Time for Exams (1.5x standard time)

**Barriers Addressed:** B-001, B-002, B-004, B-008

**Accommodation Details:** Student will receive 50% additional time
for all quizzes, tests, midterms, and final exams.

**Implementation Notes:**
- Exams administered in Testing Center
- Student must schedule 5 business days in advance
- Applies to all timed assessments including online exams

**Category:** Testing Accommodation
**Legal Basis:** ADA Title II, Section 504
```

---

## Data Structure Reference

The report is generated from structured data with these key fields:

### Barrier Object

- `barrier_id`: Unique identifier (B-001, B-002, etc.)
- `canonical_key`: Standard barrier name
- `evidence_basis`: Assessment citations
- `functional_impact`: Plain language description
- `barrier_definition`: Technical definition
- `academic_impact`: College-level impact
- `qc_flag`: Status (validated/needs_review/flagged)
- `mapping_method`: How barrier was identified

### Accommodation Object

- `accommodation_name`: Display name
- `barriers_addressed`: Array of barrier IDs
- `accommodation_text`: Detailed description
- `evidence_base`: Supporting research
- `implementation_notes`: Practical guidance
- `category`: Academic/Instructional/Auxiliary Aid
- `legal_basis`: ADA/504 reference

---

## Design Deliverables Checklist

- [ ] Complete component library
- [ ] Desktop layout (1200px+)
- [ ] Tablet layout (768-1199px)
- [ ] Mobile layout (<768px)
- [ ] Interactive prototype with expandable sections
- [ ] Cross-reference link behavior
- [ ] Status indicator variants
- [ ] Category badge variants
- [ ] Print-friendly version
- [ ] Accessibility annotations
- [ ] Developer handoff documentation

---

## Notes for Designers

1. **Content is Dynamic:** All content is populated from database, so designs should accommodate variable content lengths
2. **Scalability:** Reports may have 1-20+ barriers and accommodations
3. **Professional Context:** This is a formal legal document used by disability services offices
4. **Print Consideration:** Design should work well in both digital and printed formats
5. **Branding:** Should align with institutional accessibility and disability services branding

---

## Related Files

- Content Template: `correct-post-secondary-template.md`
- Sample Report: `demo-post-secondary-report.md`
- Implementation Docs: `POST_SECONDARY_DEV_ROUTING.md`

---

_This design specification is maintained in the GitHub repository and synced with Figma for collaborative design work._

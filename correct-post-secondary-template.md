# Post-Secondary Disability Accommodation Report

**Analysis Date:** [Date]  
**Student Level:** Post-Secondary  
**Total Findings:** [Total Count]

---

## Executive Summary

This post-secondary disability assessment analysis identifies functional barriers and provides evidence-based accommodation recommendations for academic success. Each finding is supported by assessment evidence and includes comprehensive accommodation guidance populated directly from rich content analysis.

---

## Section 1: Functional Impact Summary

### Validated Functional Barriers ([Validated Count] items)

[For each validated functional barrier, the following format will be populated from rich content fields:]

#### [Index]. [Canonical Key from item master] - Barrier ID: B-[Number]

**Evidence:** [Evidence basis with specific citations from assessment documents]

**Functional Impact:** [Plain language explanation of how this barrier affects academic performance]

**Barrier Definition:** [Technical definition from barrier glossary]

**Academic/Environmental Impact:** [Detailed description of how this affects college-level work]

**Quality Control:**
- Status: validated
- Mapping Method: [Mapping method]
- Documentation Currency: [Current/needs update]

---

### Barriers Requiring Review ([Review Count] items)

[Same format as validated barriers, but with qc_flag = 'needs_review']

---

### Flagged Barriers ([Flagged Count] items)

[Same format as validated barriers, but with qc_flag = 'flagged']

---

## Section 2: Academic Accommodations

### Formal Accommodations ([Accommodation Count] items)

[For each accommodation, reference the barrier ID from Section 1:]

#### [Index]. [Accommodation Name]

**Barriers Addressed:** [Reference barrier IDs from Section 1: B-001, B-002, etc.]

**Accommodation Details:** [Specific accommodation from accommodation_text field]

**Evidence Base:** [Evidence supporting this accommodation]

**Implementation Notes:** [Specific guidance for faculty and staff]

**Accommodation Category:** [Academic/Instructional/Auxiliary Aid]

**Legal Basis:** [ADA/504 compliance reference]

---

## Section 3: Support Services and Referrals

### Non-Accommodation Supports ([Support Count] items)

[For support services that are not formal accommodations:]

#### [Index]. [Support Service Name]

**Purpose:** [What this support addresses]

**Connection to Barriers:** [How this relates to identified barriers]

**Service Description:** [Detailed description of the support]

**Referral Process:** [How to access this service]

**Expected Outcomes:** [What this support should achieve]

---

## Implementation Recommendations

### For Disability Services Staff
- **Validated Accommodations**: Ready for immediate implementation in accommodation letters
- **Items Requiring Review**: Schedule follow-up assessment or documentation review  
- **Flagged Items**: Require additional validation before accommodation approval

### For Faculty and Instructors
- **Understanding Accommodations**: Review accommodation letters and implementation notes
- **Classroom Implementation**: Apply accommodations consistently across all coursework
- **Communication**: Contact disability services with questions or concerns

### For Students
- **Self-Advocacy**: Understand your accommodations and how to request them
- **Communication**: Work with professors to ensure proper implementation
- **Support Services**: Utilize recommended support services for additional assistance

### Quality Assurance Summary

**Analysis Methods:**
[List of unique mapping methods used]

**Accommodation Categories:**
[Distribution across Academic, Instructional, Auxiliary Aid categories]

**Confidence Distribution:**
- High confidence (validated): [Validated count] items
- Medium confidence (needs review): [Review count] items  
- Low confidence (flagged): [Flagged count] items

---

## Next Steps

1. **Accommodation Letters**: Generate formal accommodation letters for validated items
2. **Faculty Notification**: Inform relevant instructors of approved accommodations
3. **Student Meeting**: Schedule follow-up meeting to review accommodations and supports
4. **Progress Monitoring**: Track accommodation effectiveness and student success

---

## Post-Secondary Considerations

**Academic Level Factors:**
[College-level academic demands and expectations]

**Independence Requirements:**
[Self-advocacy and independence skills needed]

**Career Preparation:**
[How accommodations prepare student for workplace success]

---

## Technical Data (JSON Format) - Optional

```json
{
  "analysis_metadata": {
    "module_type": "post_secondary",
    "analysis_date": "[Date]",
    "total_barriers": "[Total count]",
    "total_accommodations": "[Accommodation count]",
    "total_supports": "[Support count]",
    "validated_count": "[Validated count]",
    "review_count": "[Review count]", 
    "flagged_count": "[Flagged count]"
  },
  "barriers": [
    {
      "barrier_id": "B-[Number]",
      "canonical_key": "[Item identifier]",
      "evidence_basis": "[Evidence citations]",
      "functional_impact": "[Impact description]",
      "mapping_method": "[Method used]",
      "qc_flag": "[Quality control status]"
    }
  ],
  "accommodations": [
    {
      "accommodation_name": "[Accommodation]",
      "barriers_addressed": ["B-001", "B-002"],
      "category": "[Category]",
      "evidence_base": "[Supporting evidence]"
    }
  ],
  "supports": [
    {
      "support_name": "[Support service]",
      "purpose": "[What it addresses]",
      "referral_process": "[How to access]"
    }
  ]
}
```

---

*Report generated by AI Analysis System using Rich Content Population (Post-Secondary Disability Services Focus)*
// Centralized markdown parsing utilities for Post-Secondary reports ONLY
// Does not affect K-12, Tutoring, or other report types

export interface ReportSection {
  title: string;
  content: string;
  index: number;
}

export interface AccommodationSubsection {
  id: string;
  title: string;
  content: string;
  index: number;
}

export interface ParsedBarrier {
  number: number;
  title: string;
  description: string;
  evidence?: string;
}

export interface ParsedAccommodation {
  number: string;
  title: string;
  barrier: string;
  implementation: string;
}

/**
 * Parse the main sections of a post-secondary markdown report
 * Expected sections: Student Information, Document Review, Functional Impact, Accommodations
 */
export function parsePostSecondaryReportSections(markdownReport: string): ReportSection[] {
  if (!markdownReport || typeof markdownReport !== 'string') {
    return [];
  }

  console.log('📄 Parsing markdown report, length:', markdownReport.length);
  
  const sections: ReportSection[] = [];
  
  // Remove the main title if present (# or ## at start)
  const processedReport = markdownReport.replace(/^#{1,2}\s+.*?\n+/m, '');
  
  // Handle multiple formats with robust try-in-order approach
  
  // Strategy A: Try ### Section N: Title format (actual AI format)
  console.log('📄 Strategy A: Trying ### Section N: Title format');
  let parts = processedReport.split(/(?=^### Section \d+:)/m);
  
  if (parts.length > 1) {
    parts.forEach((part, index) => {
      const trimmedPart = part.trim();
      if (!trimmedPart) return;
      
      // Extract section title from ### Section N: Title header
      const titleMatch = trimmedPart.match(/^### Section \d+:\s*(.+?)(?:\n|$)/);
      if (!titleMatch) return;
      
      const title = titleMatch[1].trim();
      const content = trimmedPart.substring(titleMatch[0].length).trim();
      
      sections.push({
        title,
        content,
        index: index + 1
      });
      
      console.log(`📋 Strategy A found section ${index + 1}: "${title}" (${content.length} chars)`);
    });
  }
  
  // Strategy B: Try ### N. Title format if Strategy A found no sections
  if (sections.length === 0 && processedReport.includes('### ')) {
    console.log('📄 Strategy B: Trying ### N. Title format');
    parts = processedReport.split(/(?=^### \d+\.)/m);
    
    parts.forEach((part, index) => {
      const trimmedPart = part.trim();
      if (!trimmedPart) return;
      
      // Extract section title from ### N. Title header
      const titleMatch = trimmedPart.match(/^### \d+\.\s*(.+?)(?:\n|$)/);
      if (!titleMatch) return;
      
      const title = titleMatch[1].trim();
      const content = trimmedPart.substring(titleMatch[0].length).trim();
      
      sections.push({
        title,
        content,
        index: index + 1
      });
      
      console.log(`📋 Strategy B found section ${index + 1}: "${title}" (${content.length} chars)`);
    });
  } else if (processedReport.includes('**Section ')) {
    console.log('📄 Using **Section N:** format parser');
    const parts = processedReport.split(/(?=\*\*Section \d+:)/);
    
    parts.forEach((part, index) => {
      const trimmedPart = part.trim();
      if (!trimmedPart) return;
      
      // Extract section title from **Section N: Title** header
      const titleMatch = trimmedPart.match(/^\*\*Section \d+:\s*(.+?)\*\*/);
      if (!titleMatch) return;
      
      const title = titleMatch[1].trim();
      const content = trimmedPart.substring(titleMatch[0].length).trim();
      
      sections.push({
        title,
        content,
        index: index + 1
      });
      
      console.log(`📋 Section ${index + 1}: "${title}" (${content.length} chars)`);
    });
  } else {
    // Fall back to old format (## headers)
    console.log('📄 Using legacy ## format parser');
    const parts = processedReport.split(/(?=^## )/m);
    
    parts.forEach((part, index) => {
      const trimmedPart = part.trim();
      if (!trimmedPart) return;
      
      // Extract section title from ## header
      const titleMatch = trimmedPart.match(/^## (.+?)(?:\n|$)/);
      if (!titleMatch) return;
      
      const title = titleMatch[1].trim();
      const content = trimmedPart.substring(titleMatch[0].length).trim();
      
      sections.push({
        title,
        content,
        index: index + 1
      });
      
      console.log(`📋 Section ${index + 1}: "${title}" (${content.length} chars)`);
    });
  }
  
  console.log('📋 Final sections:', sections.map(s => ({ title: s.title, index: s.index })));
  return sections;
}

/**
 * Parse accommodation subsections (Academic, Testing, Technology, Additional Resources)
 * Specific to post-secondary report format with 4 required categories
 */
export function parseAccommodationSubsections(accommodationContent: string): AccommodationSubsection[] {
  if (!accommodationContent) return [];
  
  const subsections: AccommodationSubsection[] = [];
  
  // First try to find ### headers for subsections
  const parts = accommodationContent.split(/^### /m);
  
  if (parts.length > 1) {
    // We have subsections with ### headers
    for (let i = 1; i < parts.length; i++) {
      const subsectionContent = parts[i];
      const titleMatch = subsectionContent.match(/^([^\n]+)/);
      const rawTitle = titleMatch ? titleMatch[1].trim() : `Subsection 3.${i}`;
      // Remove section numbers like "3.1", "3.2" from the beginning of titles
      const title = rawTitle.replace(/^3\.\d+\s*/, '');
      const content = subsectionContent.substring((titleMatch ? titleMatch[1] : rawTitle).length).trim();
      
      subsections.push({ 
        id: `3.${i}`,
        title, 
        content,
        index: i 
      });
    }
  }
  
  // Ensure we always have all 4 required accommodation categories for post-secondary
  // Must match server/config/postSecondaryPathways.ts exactly
  const requiredCategories = [
    { id: '3.1', title: 'Academic Accommodations', defaultContent: 'Academic accommodations will be determined based on individual needs.' },
    { id: '3.2', title: 'Instructional / Program Accommodations', defaultContent: 'Instructional and program accommodations will be determined based on individual needs.' },
    { id: '3.3', title: 'Auxiliary Aids & Services', defaultContent: 'Auxiliary aids and services will be determined based on individual needs.' },
    { id: '3.4', title: 'Non-Accommodation Supports / Referrals', defaultContent: 'Non-accommodation supports and referrals will be determined based on individual needs.' }
  ];
  
  // If we found subsections, make sure all 4 are present
  if (subsections.length > 0 && subsections.length < 4) {
    requiredCategories.forEach(required => {
      const exists = subsections.find(s => 
        s.title.toLowerCase().includes(required.title.toLowerCase().split(' ')[0])
      );
      if (!exists) {
        subsections.push({
          id: required.id,
          title: required.title,
          content: required.defaultContent,
          index: parseInt(required.id.split('.')[1])
        });
      }
    });
    subsections.sort((a, b) => a.index - b.index);
  } else if (subsections.length === 0) {
    // No subsections found, create all 4 with distributed content
    const contentLines = accommodationContent.split('\n').filter(line => line.trim());
    const quarter = Math.ceil(contentLines.length / 4);
    
    requiredCategories.forEach((category, idx) => {
      subsections.push({
        id: category.id,
        title: category.title,
        content: contentLines.slice(idx * quarter, (idx + 1) * quarter).join('\n') || category.defaultContent,
        index: idx + 1
      });
    });
  }
  
  console.log('Parsed subsections:', subsections.map(s => ({ id: s.id, title: s.title })));
  return subsections;
}

/**
 * Parse functional impact barriers from post-secondary report format
 * Handles both old format (**Observed Barrier N:**) and new format (1. **Title**)
 */
export function parseFunctionalImpactBarriers(functionalImpactContent: string): ParsedBarrier[] {
  if (!functionalImpactContent) return [];
  
  console.log('🔍 Parsing functional impact content:', functionalImpactContent.slice(0, 500));
  
  const barriers: ParsedBarrier[] = [];
  
  // Strategy A: Try **N.N. Title** format (actual AI format)
  console.log('📋 Strategy A: Looking for **N.N. Title** format barriers');
  
  // Look for **2.1. Title**, **2.2. Title** etc. format
  const numberedBoldMatch = functionalImpactContent.match(/\*\*\d+\.\d+\.\s*[^*]+\*\*/g);
  
  if (numberedBoldMatch && numberedBoldMatch.length > 0) {
    console.log('📋 Found barriers with **N.N. Title** format');
    
    // Split by each numbered bold barrier
    const barrierSections = functionalImpactContent.split(/(?=\*\*\d+\.\d+\.)/);
    
    barrierSections.forEach((section, index) => {
      const trimmedSection = section.trim();
      if (!trimmedSection) return;
      
      // Extract barrier title from **2.1. Title** format
      const titleMatch = trimmedSection.match(/^\*\*(\d+)\.(\d+)\.\s*([^*]+)\*\*/);
      if (!titleMatch) return;
      
      const barrierNumber = parseInt(titleMatch[2]); // Use sub-number (1, 2, 3...)
      const barrierTitle = titleMatch[3].trim();
      
      console.log('🎯 Strategy A found barrier:', barrierNumber, 'title:', barrierTitle);
      
      // Get content after the title (everything until next barrier or end)
      const contentAfterTitle = trimmedSection.substring(titleMatch[0].length).trim();
      
      // Extract first line as description (remove "- " prefix if present)
      const lines = contentAfterTitle.split('\n');
      let description = barrierTitle; // fallback
      let evidence = '';
      
      if (lines.length > 0) {
        description = lines[0].replace(/^-\s*/, '').trim();
        // Remove any markdown formatting and prefixes
        description = description.replace(/^\*\*[^*]+\*\*\s*/, '').trim();
        console.log('💡 Strategy A found functional impact:', description);
        
        // Look for evidence in subsequent lines
        for (const line of lines.slice(1)) {
          if (line.includes('(') && line.includes(')') && line.includes('[') && line.includes(']')) {
            evidence = line.trim();
            console.log('📋 Strategy A found evidence:', evidence);
            break;
          }
        }
      }
      
      console.log('✅ Strategy A added barrier:', barrierNumber, 'with description:', description);
      
      barriers.push({
        number: barrierNumber,
        title: barrierTitle,
        description,
        evidence
      });
    });
  }
  
  // Strategy B: Try numbered list format (1. **Title**) if Strategy A found no barriers
  if (barriers.length === 0 && functionalImpactContent.match(/^\d+\.\s*\*\*/m)) {
    console.log('📋 Strategy B: Using numbered list format parser');
    
    // Split by numbered list items
    const numberedItems = functionalImpactContent.split(/(?=^\d+\.\s*\*\*)/m);
    
    numberedItems.forEach((item, index) => {
      const trimmedItem = item.trim();
      if (!trimmedItem) return;
      
      // Extract barrier number and title from: "1. **Title**"
      const titleMatch = trimmedItem.match(/^(\d+)\.\s*\*\*([^*]+)\*\*/);
      if (!titleMatch) return;
      
      const barrierNumber = parseInt(titleMatch[1]);
      const barrierTitle = titleMatch[2].trim();
      
      console.log('🎯 Strategy B found barrier:', barrierNumber, 'title:', barrierTitle);
      
      // Extract description (everything after the title line, starting with "- ")
      const contentAfterTitle = trimmedItem.substring(titleMatch[0].length).trim();
      const descriptionMatch = contentAfterTitle.match(/^-\s*(.+?)(?=\s*\([^)]+\)\s*\[[^\]]+\]|$)/);
      
      let description = '';
      let evidence = '';
      
      if (descriptionMatch) {
        description = descriptionMatch[1].trim().replace(/\s+/g, ' ');
        // Remove "**Functional Impact:**" prefix if present
        description = description.replace(/^\*\*Functional Impact:\*\*\s*/i, '').trim();
        console.log('💡 Strategy B found functional impact:', description);
        
        // Extract evidence from parentheses and brackets
        const evidenceMatch = contentAfterTitle.match(/\(([^)]+)\)\s*\[([^\]]+)\]/);
        if (evidenceMatch) {
          evidence = `${evidenceMatch[1].trim()} [${evidenceMatch[2].trim()}]`;
          console.log('📋 Strategy B found evidence:', evidence);
        }
      } else {
        // Fallback to using title as description if no separate description found
        description = barrierTitle;
      }
      
      console.log('✅ Strategy B added barrier:', barrierNumber, 'with description:', description);
      
      barriers.push({
        number: barrierNumber,
        title: barrierTitle,
        description,
        evidence
      });
    });
  } else {
    // Fall back to old format (**Observed Barrier N:**)
    console.log('📋 Using legacy **Observed Barrier N:** format parser');
    
    const barrierRegex = /\*\*Observed Barrier (\d+):\*\*\s*([^\n]+)/g;
    let match;
    
    while ((match = barrierRegex.exec(functionalImpactContent)) !== null) {
      const barrierNumber = parseInt(match[1]);
      const barrierTitle = match[2].trim();
      
      console.log('🎯 Found barrier:', barrierNumber, 'title:', barrierTitle);
      
      // Extract the content after this barrier until the next barrier or end
      const startIndex = match.index + match[0].length;
      const nextBarrierMatch = functionalImpactContent.slice(startIndex).match(/\*\*Observed Barrier \d+:/);
      const endIndex = nextBarrierMatch && nextBarrierMatch.index !== undefined ? startIndex + nextBarrierMatch.index : functionalImpactContent.length;
      const barrierContent = functionalImpactContent.slice(startIndex, endIndex);
      
      // Extract functional impact
      const impactMatch = barrierContent.match(/\*\*Functional Impact:\*\*\s*([^\n]+(?:\n(?!- \*\*)[^\n]+)*)/);
      let functionalImpact = '';
      if (impactMatch) {
        functionalImpact = impactMatch[1].trim().replace(/\s+/g, ' ');
        console.log('💡 Found functional impact:', functionalImpact);
      }
      
      // Extract evidence
      const evidenceMatch = barrierContent.match(/\*\*Evidence:\*\*\s*([^\n]+(?:\n(?!- \*\*)[^\n]+)*)/);
      let evidence = '';
      if (evidenceMatch) {
        evidence = evidenceMatch[1].trim();
        console.log('📋 Found evidence:', evidence);
      }
      
      // Use functional impact as description if available, otherwise use title
      const description = functionalImpact || barrierTitle;
      console.log('✅ Added barrier:', barrierNumber, 'with description:', description);
      
      barriers.push({
        number: barrierNumber,
        title: barrierTitle,
        description,
        evidence
      });
    }
  }
  
  console.log('🎯 Total parsed barriers:', barriers.length);
  return barriers;
}

/**
 * Strip markdown formatting from text (removes **, *, etc.)
 */
export function stripMarkdownFormatting(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold formatting
    .replace(/\*(.*?)\*/g, '$1')     // Remove italic formatting  
    .replace(/^\s*:\s*/, '')         // Remove leading colons and spaces
    .replace(/:\s*$/, '')            // Remove trailing colons and spaces
    .trim();
}

/**
 * Parse individual accommodations from a subsection content
 * Handles multiple formats commonly seen in post-secondary reports
 */
export function parseAccommodations(content: string): ParsedAccommodation[] {
  const accommodations: ParsedAccommodation[] = [];
  const lines = content.split('\n');
  let currentAccommodation: { number: string; title: string } | null = null;
  let currentDescription = '';
  
  for (const line of lines) {
    // Check multiple accommodation title formats:
    // Format 1: "1. **Extended Time:** Description..." - most common format
    const titleColonMatch = line.match(/^(\d+)\.\s+\*\*(.+?)\*\*:\s*(.*)$/);
    // Format 2: "**1. Extended Time on Assignments and Exams**"
    const boldTitleMatch = line.match(/^\*\*(\d+)\.\s+(.+?)\*\*\s*$/);
    // Format 3: "**1.** Extended time description..."
    const boldNumberMatch = line.match(/^\*\*(\d+)\.\*\*\s+(.+)/);
    // Format 4: Simple "1. Extended time"
    const simpleMatch = line.match(/^(\d+)\.\s+(.+)/);
    
    const accommodationMatch = titleColonMatch || boldTitleMatch || boldNumberMatch || simpleMatch;
    
    if (accommodationMatch) {
      // Save previous accommodation if it exists
      if (currentAccommodation) {
        accommodations.push({
          number: currentAccommodation.number,
          title: currentAccommodation.title,
          barrier: getBarrierFromDescription(currentDescription),
          implementation: getImplementationFromDescription(currentDescription)
        });
      }
      
      // Extract clean title based on match type
      let cleanTitle;
      if (titleColonMatch) {
        // Format: "1. **Title:** Description"
        cleanTitle = stripMarkdownFormatting(accommodationMatch[2]);
        currentDescription = accommodationMatch[3] ? accommodationMatch[3].trim() : accommodationMatch[2];
      } else {
        // Other formats
        cleanTitle = stripMarkdownFormatting(accommodationMatch[2]);
        currentDescription = accommodationMatch[2].trim();
      }
      
      // Start new accommodation
      currentAccommodation = {
        number: accommodationMatch[1],
        title: cleanTitle
      };
    } else if (currentAccommodation && line.trim() && !line.startsWith('**') && !line.startsWith('#')) {
      // Continue building the description
      currentDescription += ' ' + line.trim();
    }
  }
  
  // Add the last accommodation
  if (currentAccommodation) {
    accommodations.push({
      number: currentAccommodation.number,
      title: currentAccommodation.title,
      barrier: getBarrierFromDescription(currentDescription),
      implementation: getImplementationFromDescription(currentDescription)
    });
  }
  
  console.log('Parsed accommodations:', accommodations);
  return accommodations;
}

// Helper functions for accommodation processing
function getBarrierFromDescription(description: string): string {
  const lowerDesc = description.toLowerCase();
  
  if (lowerDesc.includes('reading') || lowerDesc.includes('comprehension')) {
    return 'Reading comprehension and processing difficulties';
  } else if (lowerDesc.includes('test') || lowerDesc.includes('exam') || lowerDesc.includes('assessment')) {
    return 'Test anxiety and time management challenges';
  } else if (lowerDesc.includes('writing') || lowerDesc.includes('spelling') || lowerDesc.includes('grammar')) {
    return 'Written expression and language processing difficulties';
  } else if (lowerDesc.includes('distraction') || lowerDesc.includes('quiet') || lowerDesc.includes('focus')) {
    return 'Attention and concentration challenges';
  } else if (lowerDesc.includes('instruction') || lowerDesc.includes('verbal') || lowerDesc.includes('direction')) {
    return 'Auditory processing and working memory difficulties';
  } else if (lowerDesc.includes('deadline') || lowerDesc.includes('scheduling') || lowerDesc.includes('flexible')) {
    return 'Executive functioning and time management challenges';
  } else {
    return 'Academic processing and learning differences';
  }
}

function getImplementationFromDescription(description: string): string {
  const lowerDesc = description.toLowerCase();
  
  if (lowerDesc.includes('technology') || lowerDesc.includes('software') || lowerDesc.includes('assistive')) {
    return 'Provide access to assistive technology as specified';
  } else if (lowerDesc.includes('quiet') || lowerDesc.includes('private') || lowerDesc.includes('separate')) {
    return 'Arrange for appropriate testing environment';
  } else if (lowerDesc.includes('time') || lowerDesc.includes('extended') || lowerDesc.includes('deadline')) {
    return 'Allow time extensions as specified in accommodation letter';
  } else if (lowerDesc.includes('format') || lowerDesc.includes('alternative') || lowerDesc.includes('modified')) {
    return 'Provide materials in specified alternative formats';
  } else if (lowerDesc.includes('notes') || lowerDesc.includes('recording') || lowerDesc.includes('scribe')) {
    return 'Allow note-taking accommodations as specified';
  } else {
    return 'Implement on case-by-case basis in consultation with disability services';
  }
}
// Post-Secondary Module Pathway Configuration
// This file isolates pathway settings for the post-secondary module
// to ensure changes don't affect other report types (K-12, tutoring, etc.)

export interface PathwayConfig {
  moduleType: string;
  defaultPathway: 'simple' | 'complex';
  allowedPathways: ('simple' | 'complex')[];
  forcePathway?: 'simple' | 'complex'; // Force a specific pathway regardless of request
  pathwaySettings: {
    simple: {
      useFunctionCalls: boolean;
      directReportGeneration: boolean;
      accommodationCategories: string[];
      requiredSections: string[];
    };
    complex: {
      useFunctionCalls: boolean;
      directReportGeneration: boolean;
      functionSequence?: string[];
    };
  };
}

// Post-Secondary Module Configuration
// Isolated from other modules to prevent cross-module interference
export const postSecondaryPathwayConfig: PathwayConfig = {
  moduleType: 'post_secondary',
  defaultPathway: 'simple', // Default to simple for demos as requested
  allowedPathways: ['simple', 'complex'], // Both pathways available
  
  pathwaySettings: {
    simple: {
      useFunctionCalls: false,
      directReportGeneration: true,
      // All 4 required accommodation categories for post-secondary
      accommodationCategories: [
        'Academic Accommodations',
        'Instructional / Program Accommodations',
        'Auxiliary Aids & Services',
        'Non-Accommodation Supports / Referrals'
      ],
      // Required sections in the generated report
      requiredSections: [
        'Student Information & Report Details',
        'Document Review', 
        'Functional Impact Summary',
        'Accommodations'
      ]
    },
    complex: {
      useFunctionCalls: true,
      directReportGeneration: false,
      functionSequence: [
        'identifyFunctionalBarriers',
        'populatePostSecondaryItemMaster'
      ]
    }
  }
};

// Demo Environment Configuration
// Special settings for demo environments to ensure proper demonstration
export const demoEnvironmentConfig = {
  forceSimplePathway: true, // Always use simple pathway for demos
  enableMockData: false, // Use real analysis, not mock data
  maxProcessingTime: 180000, // 3 minutes max for demo generation
  requireAllCategories: true, // Ensure all 4 accommodation categories are generated
  strictSeparation: true // Maintain strict separation from production data
};

// Get effective pathway based on environment and request
export function getEffectivePathway(
  requestedPathway?: string,
  isDemo: boolean = false
): 'simple' | 'complex' {
  // Demo environments always use simple pathway
  if (isDemo && demoEnvironmentConfig.forceSimplePathway) {
    return 'simple';
  }
  
  // Check if requested pathway is allowed
  if (requestedPathway && postSecondaryPathwayConfig.allowedPathways.includes(requestedPathway as any)) {
    return requestedPathway as 'simple' | 'complex';
  }
  
  // Return default pathway
  return postSecondaryPathwayConfig.defaultPathway;
}

// Validate that generated report includes all required categories
export function validateReportCategories(reportContent: string): {
  isValid: boolean;
  missingCategories: string[];
} {
  const requiredCategories = postSecondaryPathwayConfig.pathwaySettings.simple.accommodationCategories;
  const missingCategories: string[] = [];
  
  for (const category of requiredCategories) {
    // Check for various forms of the category name
    const categoryVariants = [
      category,
      category.replace('/', ' and '),
      category.replace('/', ' '),
      category.replace('Support', 'Supports'),
      category.replace('Technology Support', 'Technology and Assistive Supports'),
      category.replace('Resources/Services', 'Resources and Services'),
      category.replace('Resources/Services', 'Resources Services')
    ];
    
    const found = categoryVariants.some(variant => 
      reportContent.toLowerCase().includes(variant.toLowerCase())
    );
    
    if (!found) {
      missingCategories.push(category);
    }
  }
  
  return {
    isValid: missingCategories.length === 0,
    missingCategories
  };
}

export default postSecondaryPathwayConfig;

export interface ModuleConfig {
  moduleType: 'k12' | 'post_secondary' | 'general' | 'tutoring';
  title: string;
  description: string;
  noDataTitle: string;
  noDataDescription: string;
  noCaseSelectedTitle: string;
  noCaseSelectedDescription: string;
  features: {
    multiDocument?: boolean;
    itemMasterExport?: boolean;
  };
}

export const MODULE_CONFIGS: Record<string, ModuleConfig> = {
  k12: {
    moduleType: 'k12',
    title: 'K-12 Assessment Reports',
    description: 'View and download your K-12 student assessment reports',
    noDataTitle: 'No K-12 assessment cases available',
    noDataDescription: 'Create a K-12 assessment case to generate reports.',
    noCaseSelectedTitle: 'No K-12 case selected',
    noCaseSelectedDescription: 'Select a K-12 case to view the assessment report.',
    features: {
      itemMasterExport: true
    }
  },
  post_secondary: {
    moduleType: 'post_secondary',
    title: 'Post-Secondary Assessment Reports',
    description: 'View and download your post-secondary assessment reports',
    noDataTitle: 'No post-secondary assessment cases available',
    noDataDescription: 'Create a post-secondary assessment case to generate reports.',
    noCaseSelectedTitle: 'No post-secondary case selected',
    noCaseSelectedDescription: 'Select a post-secondary case to view the assessment report.',
    features: {
      multiDocument: true,
      itemMasterExport: true
    }
  },
  general: {
    moduleType: 'general',
    title: 'Assessment Reports',
    description: 'View and download accommodation assessment reports',
    noDataTitle: 'No assessment cases available',
    noDataDescription: 'Create an assessment case to generate reports.',
    noCaseSelectedTitle: 'No case selected',
    noCaseSelectedDescription: 'Select a case to view the assessment report.',
    features: {
      itemMasterExport: true
    }
  },
  tutoring: {
    moduleType: 'tutoring',
    title: 'Tutoring Assessment Reports',
    description: 'View and download your tutoring business assessment reports',
    noDataTitle: 'No tutoring assessment cases available',
    noDataDescription: 'Create a tutoring assessment case to generate reports.',
    noCaseSelectedTitle: 'No tutoring case selected',
    noCaseSelectedDescription: 'Select a tutoring case to view the assessment report.',
    features: {
      itemMasterExport: true
    }
  }
};

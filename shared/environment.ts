export type EnvironmentType = 
  | 'production'
  | 'development'
  | 'replit-prod' 
  | 'replit-dev' 
  | 'post-secondary-demo' 
  | 'k12-demo' 
  | 'tutoring-demo'
  | 'post-secondary-dev'
  | 'k12-dev'
  | 'tutoring-dev'
  | 'tutoring';

export interface Environment {
  id: EnvironmentType;
  name: string;
  description: string;
  isActive: boolean;
  demoMode?: boolean;
  lockedModule?: 'post_secondary' | 'k12' | 'tutoring';
}

export const environments: Environment[] = [
  // Production environments
  {
    id: 'production',
    name: 'Production',
    description: 'Primary production database',
    isActive: false
  },
  {
    id: 'replit-prod',
    name: 'Replit Production',
    description: 'Production PostgreSQL database on Replit',
    isActive: true
  },
  {
    id: 'tutoring',
    name: 'Tutoring Production',
    description: 'Authenticated tutoring business environment with full features',
    isActive: false,
    lockedModule: 'tutoring'
  },
  // Development environments
  {
    id: 'development',
    name: 'Development',
    description: 'Primary development database for testing and feature development',
    isActive: false
  },
  {
    id: 'replit-dev',
    name: 'Replit Development',
    description: 'Development PostgreSQL database on Replit',
    isActive: false
  },
  {
    id: 'post-secondary-dev',
    name: 'Post-Secondary Dev',
    description: 'Development environment for post-secondary module testing',
    isActive: false,
    lockedModule: 'post_secondary'
  },
  {
    id: 'k12-dev',
    name: 'K-12 Dev',
    description: 'Development environment for K-12 module testing',
    isActive: false,
    lockedModule: 'k12'
  },
  {
    id: 'tutoring-dev',
    name: 'Tutoring Dev',
    description: 'Development environment for tutoring module testing',
    isActive: false,
    lockedModule: 'tutoring'
  },
  // Demo environments (all share the same demo database)
  {
    id: 'post-secondary-demo',
    name: 'Post-Secondary Demo',
    description: 'Demo environment for post-secondary assessments (shared demo database)',
    isActive: false,
    demoMode: true,
    lockedModule: 'post_secondary'
  },
  {
    id: 'k12-demo',
    name: 'K-12 Demo',
    description: 'Demo environment for K-12 assessments (shared demo database)',
    isActive: false,
    demoMode: true,
    lockedModule: 'k12'
  },
  {
    id: 'tutoring-demo',
    name: 'Tutoring Demo',
    description: 'Demo environment for tutoring business assessments (shared demo database)',
    isActive: false,
    demoMode: true,
    lockedModule: 'tutoring'
  }
];
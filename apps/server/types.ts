/**
 * TypeScript module augmentation for Express Request interface
 * Adds custom properties used by the security middleware
 */

declare global {
  namespace Express {
    interface Request {
      /**
       * Flag indicating if this is a demo operation
       * Set by security middleware to identify demo analysis workflows
       */
      isDemoOperation?: boolean;
      
      /**
       * Flag to enforce demo customer isolation
       * Ensures demo operations only access demo customer data
       */
      enforceDemoCustomer?: boolean;
    }
  }
}

// This export is required for module augmentation to work
export {};
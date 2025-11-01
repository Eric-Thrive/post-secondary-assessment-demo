/**
 * TypeScript module augmentation for Express Request interface
 * Adds custom properties used by the security middleware
 */

import "express-session";
import { UserRole, ModuleType } from "@shared/schema";

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

declare module "express-session" {
  interface SessionData {
    userId?: number;
    user?: {
      id: number;
      username: string;
      email: string;
      emailVerified: boolean;
      role: UserRole;
      assignedModules: ModuleType[];
      organizationId?: string;
      customerId: string;
      customerName?: string;
      demoPermissions?: Record<string, boolean>;
    };
  }
}

// This export is required for module augmentation to work
export {};

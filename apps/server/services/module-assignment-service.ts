import { UserRole, ModuleType } from "@shared/schema";
import { db } from "../db";
import { users, organizations } from "@shared/schema";
import { eq } from "drizzle-orm";

/**
 * Service for managing module assignments and switching logic
 */
export class ModuleAssignmentService {
  /**
   * Get assigned modules for a user based on their role and organization settings
   * @param user - The user to get module assignments for
   * @returns Promise<ModuleType[]> - Array of modules the user has access to
   */
  public static async getAssignedModules(
    user: Express.User
  ): Promise<ModuleType[]> {
    // Developer and System Admin roles have access to all modules
    if (
      user.role === UserRole.DEVELOPER ||
      user.role === UserRole.SYSTEM_ADMIN
    ) {
      return [ModuleType.K12, ModuleType.POST_SECONDARY, ModuleType.TUTORING];
    }

    // For other roles, use their assigned modules from the database
    if (user.assignedModules && user.assignedModules.length > 0) {
      return user.assignedModules;
    }

    // If user has an organization, get modules from organization settings
    if (user.organizationId) {
      try {
        const [organization] = await db
          .select({ assignedModules: organizations.assignedModules })
          .from(organizations)
          .where(eq(organizations.id, user.organizationId));

        if (organization && organization.assignedModules) {
          return organization.assignedModules as ModuleType[];
        }
      } catch (error) {
        console.error(
          `Error fetching organization modules for user ${user.id}:`,
          error
        );
      }
    }

    // Default fallback to post-secondary module
    return [ModuleType.POST_SECONDARY];
  }

  /**
   * Check if a user can switch between modules
   * @param user - The user to check
   * @returns boolean - true if user can switch modules, false otherwise
   */
  public static canSwitchModules(user: Express.User): boolean {
    // Only Developer and System Admin roles can switch between modules
    return (
      user.role === UserRole.DEVELOPER || user.role === UserRole.SYSTEM_ADMIN
    );
  }

  /**
   * Validate if a user has access to a specific module
   * @param user - The user to validate
   * @param moduleType - The module to check access for
   * @returns Promise<boolean> - true if user has access, false otherwise
   */
  public static async validateModuleAccess(
    user: Express.User,
    moduleType: ModuleType
  ): Promise<boolean> {
    const assignedModules = await this.getAssignedModules(user);
    return assignedModules.includes(moduleType);
  }

  /**
   * Update module assignments for a user
   * @param userId - The user ID to update
   * @param moduleTypes - Array of modules to assign
   * @returns Promise<void>
   */
  public static async updateUserModuleAssignments(
    userId: number,
    moduleTypes: ModuleType[]
  ): Promise<void> {
    try {
      await db
        .update(users)
        .set({
          assignedModules: moduleTypes,
          lastLogin: new Date(), // Update timestamp to track changes
        })
        .where(eq(users.id, userId));

      console.log(
        `Updated module assignments for user ${userId}:`,
        moduleTypes
      );
    } catch (error) {
      console.error(
        `Error updating module assignments for user ${userId}:`,
        error
      );
      throw new Error("Failed to update module assignments");
    }
  }

  /**
   * Update module assignments for an organization
   * @param organizationId - The organization ID to update
   * @param moduleTypes - Array of modules to assign
   * @returns Promise<void>
   */
  public static async updateOrganizationModuleAssignments(
    organizationId: string,
    moduleTypes: ModuleType[]
  ): Promise<void> {
    try {
      await db
        .update(organizations)
        .set({
          assignedModules: moduleTypes,
          lastUpdated: new Date(),
        })
        .where(eq(organizations.id, organizationId));

      console.log(
        `Updated module assignments for organization ${organizationId}:`,
        moduleTypes
      );
    } catch (error) {
      console.error(
        `Error updating module assignments for organization ${organizationId}:`,
        error
      );
      throw new Error("Failed to update organization module assignments");
    }
  }

  /**
   * Get the default module for a user based on their assignments
   * @param user - The user to get default module for
   * @returns Promise<ModuleType> - The default module for the user
   */
  public static async getDefaultModule(
    user: Express.User
  ): Promise<ModuleType> {
    const assignedModules = await this.getAssignedModules(user);

    // Return the first assigned module, or post-secondary as fallback
    return assignedModules.length > 0
      ? assignedModules[0]
      : ModuleType.POST_SECONDARY;
  }

  /**
   * Get module assignment summary for a user
   * @param user - The user to get summary for
   * @returns Promise<ModuleAssignmentSummary>
   */
  public static async getModuleAssignmentSummary(
    user: Express.User
  ): Promise<ModuleAssignmentSummary> {
    const assignedModules = await this.getAssignedModules(user);
    const canSwitch = this.canSwitchModules(user);
    const defaultModule = await this.getDefaultModule(user);

    return {
      userId: user.id,
      role: user.role,
      assignedModules,
      canSwitchModules: canSwitch,
      defaultModule,
      organizationId: user.organizationId,
      totalModulesAvailable: assignedModules.length,
    };
  }

  /**
   * Validate and sanitize module assignments when user role changes
   * @param userId - The user ID whose role changed
   * @param newRole - The new role assigned to the user
   * @returns Promise<ModuleType[]> - The updated module assignments
   */
  public static async handleRoleChange(
    userId: number,
    newRole: UserRole
  ): Promise<ModuleType[]> {
    let newModuleAssignments: ModuleType[];

    switch (newRole) {
      case UserRole.DEVELOPER:
      case UserRole.SYSTEM_ADMIN:
        // Full access to all modules
        newModuleAssignments = [
          ModuleType.K12,
          ModuleType.POST_SECONDARY,
          ModuleType.TUTORING,
        ];
        break;

      case UserRole.ORG_ADMIN:
      case UserRole.CUSTOMER:
      case UserRole.DEMO:
        // Get current user to check organization settings
        const [currentUser] = await db
          .select()
          .from(users)
          .where(eq(users.id, userId));

        if (currentUser?.organizationId) {
          // Use organization's assigned modules
          const [organization] = await db
            .select({ assignedModules: organizations.assignedModules })
            .from(organizations)
            .where(eq(organizations.id, currentUser.organizationId));

          newModuleAssignments =
            (organization?.assignedModules as ModuleType[]) || [
              ModuleType.POST_SECONDARY,
            ];
        } else {
          // Default to post-secondary for users without organization
          newModuleAssignments = [ModuleType.POST_SECONDARY];
        }
        break;

      default:
        newModuleAssignments = [ModuleType.POST_SECONDARY];
    }

    // Update the user's module assignments
    await this.updateUserModuleAssignments(userId, newModuleAssignments);

    return newModuleAssignments;
  }
}

/**
 * Interface for module assignment summary
 */
export interface ModuleAssignmentSummary {
  userId: number;
  role: UserRole;
  assignedModules: ModuleType[];
  canSwitchModules: boolean;
  defaultModule: ModuleType;
  organizationId?: string;
  totalModulesAvailable: number;
}

/**
 * Interface for module switching request
 */
export interface ModuleSwitchRequest {
  userId: number;
  targetModule: ModuleType;
  currentModule?: ModuleType;
}

/**
 * Interface for module switching response
 */
export interface ModuleSwitchResponse {
  success: boolean;
  newModule: ModuleType;
  message: string;
  canSwitch: boolean;
  assignedModules: ModuleType[];
}

import { ModuleInfo, ModuleType, ThemeColor } from "@/types/unified-auth";
import { MODULE_ROUTES } from "./routes";

// THRIVE brand color configuration
export const THRIVE_COLORS = {
  NAVY: "#1297d2",
  SKY_BLUE: "#96d7e1",
  ORANGE: "#f89e54",
  YELLOW: "#fde677",
} as const;

// Module configuration with THRIVE branding
export const MODULE_CONFIG: Record<ModuleType, ModuleInfo> = {
  [ModuleType.K12]: {
    id: "k12",
    name: "k12",
    displayName: "K-12 Education",
    description:
      "Deliver consistent, student-centered plans across your K-12 program.",
    icon: "School",
    color: "sky-blue",
    route: MODULE_ROUTES.K12.HOME,
    features: [
      "Student Support Plans",
      "IEP Management",
      "Progress Tracking",
      "Parent Communication",
    ],
  },
  [ModuleType.POST_SECONDARY]: {
    id: "post_secondary",
    name: "post_secondary",
    displayName: "Post-Secondary",
    description:
      "Streamline disability services reporting for colleges and universities.",
    icon: "GraduationCap",
    color: "navy",
    route: MODULE_ROUTES.POST_SECONDARY.HOME,
    features: [
      "Accommodation Reports",
      "Disability Services",
      "Student Assessment",
      "Compliance Tracking",
    ],
  },
  [ModuleType.TUTORING]: {
    id: "tutoring",
    name: "tutoring",
    displayName: "Tutoring Services",
    description:
      "Personalize tutoring sessions and keep progress aligned across your team.",
    icon: "Users",
    color: "orange",
    route: MODULE_ROUTES.TUTORING.HOME,
    features: [
      "Session Planning",
      "Progress Reports",
      "Resource Management",
      "Student Tracking",
    ],
  },
};

// Helper function to get module configuration
export const getModuleConfig = (moduleType: ModuleType): ModuleInfo => {
  return MODULE_CONFIG[moduleType];
};

// Helper function to get all module configurations
export const getAllModuleConfigs = (): ModuleInfo[] => {
  return Object.values(MODULE_CONFIG);
};

// Helper function to get module color
export const getModuleColor = (moduleType: ModuleType): string => {
  const config = getModuleConfig(moduleType);
  switch (config.color) {
    case "navy":
      return THRIVE_COLORS.NAVY;
    case "sky-blue":
      return THRIVE_COLORS.SKY_BLUE;
    case "orange":
      return THRIVE_COLORS.ORANGE;
    case "yellow":
      return THRIVE_COLORS.YELLOW;
    default:
      return THRIVE_COLORS.NAVY;
  }
};

import React from "react";

// THRIVE Custom Icon Components
interface IconProps {
  className?: string;
  size?: number;
  alt?: string;
}

// Import THRIVE custom icons
import StudentIcon from "@/assets/icon7.7_1755100209288.png";
import DocumentIcon from "@/assets/icon4.2_1754532094463.png";
import FunctionalIcon from "@/assets/icon4.2_1754532094463.png";
import AccommodationsIcon from "@/assets/icon2.6_1755100497953.png";
import ThriveIsotype from "@/assets/isotype Y-NB_1754494460165.png";
import ThrivePrimaryLogo from "@/assets/primary logo O-W png_1760911234604.png";

// Student Information Icon
export const ThriveStudentIcon: React.FC<IconProps> = ({
  className = "",
  size = 24,
  alt = "Student Information",
}) => (
  <img
    src={StudentIcon}
    alt={alt}
    className={`thrive-icon ${className}`}
    style={{ width: size, height: size }}
  />
);

// Document Review Icon
export const ThriveDocumentIcon: React.FC<IconProps> = ({
  className = "",
  size = 24,
  alt = "Document Review",
}) => (
  <img
    src={DocumentIcon}
    alt={alt}
    className={`thrive-icon ${className}`}
    style={{ width: size, height: size }}
  />
);

// Functional Impact Icon
export const ThriveFunctionalIcon: React.FC<IconProps> = ({
  className = "",
  size = 24,
  alt = "Functional Impact",
}) => (
  <img
    src={FunctionalIcon}
    alt={alt}
    className={`thrive-icon ${className}`}
    style={{ width: size, height: size }}
  />
);

// Accommodations Icon
export const ThriveAccommodationsIcon: React.FC<IconProps> = ({
  className = "",
  size = 24,
  alt = "Accommodations",
}) => (
  <img
    src={AccommodationsIcon}
    alt={alt}
    className={`thrive-icon ${className}`}
    style={{ width: size, height: size }}
  />
);

// THRIVE Logo Components
export const ThriveLogoIsotype: React.FC<IconProps> = ({
  className = "",
  size = 32,
  alt = "THRIVE",
}) => (
  <img
    src={ThriveIsotype}
    alt={alt}
    className={`thrive-logo ${className}`}
    style={{ width: size, height: size }}
  />
);

export const ThriveLogoPrimary: React.FC<IconProps & { height?: number }> = ({
  className = "",
  size = 120,
  height,
  alt = "THRIVE",
}) => (
  <img
    src={ThrivePrimaryLogo}
    alt={alt}
    className={`thrive-logo-primary ${className}`}
    style={{
      width: size,
      height: height || "auto",
      objectFit: "contain",
    }}
  />
);

// Module-specific icon mapping
export const ModuleIcons = {
  student: ThriveStudentIcon,
  document: ThriveDocumentIcon,
  functional: ThriveFunctionalIcon,
  accommodations: ThriveAccommodationsIcon,
} as const;

// Navigation icon component with consistent sizing
export const ThriveNavIcon: React.FC<{
  type: keyof typeof ModuleIcons;
  className?: string;
  isActive?: boolean;
}> = ({ type, className = "", isActive = false }) => {
  const IconComponent = ModuleIcons[type];

  return (
    <IconComponent
      className={`
        thrive-nav-icon 
        ${isActive ? "active" : ""} 
        ${className}
      `}
      size={20}
    />
  );
};

// Icon wrapper for consistent styling
export const ThriveIconWrapper: React.FC<{
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "accent";
  size?: "sm" | "md" | "lg";
  className?: string;
}> = ({ children, variant = "primary", size = "md", className = "" }) => {
  const sizeClasses = {
    sm: "w-8 h-8 p-1",
    md: "w-10 h-10 p-2",
    lg: "w-12 h-12 p-2",
  };

  const variantClasses = {
    primary: "bg-thrive-primary text-white",
    secondary: "bg-thrive-secondary text-thrive-text-primary",
    accent: "bg-thrive-accent text-white",
  };

  return (
    <div
      className={`
      thrive-icon-wrapper
      ${sizeClasses[size]}
      ${variantClasses[variant]}
      rounded-lg
      flex items-center justify-center
      ${className}
    `}
    >
      {children}
    </div>
  );
};

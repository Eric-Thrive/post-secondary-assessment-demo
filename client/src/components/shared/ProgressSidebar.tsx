import { Button } from "@/components/ui/button";
import { User, LogOut, CheckCircle, FileText, Eye, Zap, Home, Plus } from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface ProgressStep {
  id: string;
  label: string;
  icon: React.ElementType;
  status: 'completed' | 'active' | 'pending';
  iconColor?: string;
}

interface ProgressSidebarProps {
  steps: ProgressStep[];
  activeSection?: string;
  onSectionClick?: (sectionId: string) => void;
  className?: string;
}

// Shared button styling component
const SidebarButton: React.FC<{
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  isActive?: boolean;
  variant?: 'default' | 'primary';
  iconColor?: string;
  testId?: string;
}> = ({ icon: Icon, label, onClick, isActive = false, variant = 'default', iconColor, testId }) => {
  const brandColors = {
    navyBlue: '#1297D2',
    skyBlue: '#96D7E1',
    orange: '#F89E54',
    yellow: '#FDE677',
  };

  const getStyle = () => {
    if (variant === 'primary') {
      return {
        backgroundColor: brandColors.navyBlue,
        borderColor: '#0f7ab8', // Slightly darker for visible border
        textColor: '#ffffff',
        iconColor: '#ffffff',
        hoverBg: '#0f7ab8'
      };
    }

    if (isActive) {
      return {
        backgroundColor: brandColors.yellow,
        borderColor: '#fbbf24',
        textColor: '#78350f',
        iconColor: iconColor || '#78350f',
        hoverBg: '#fde68a'
      };
    }

    return {
      backgroundColor: '#f9fafb',
      borderColor: '#e5e7eb',
      textColor: '#374151',
      iconColor: iconColor || '#6b7280',
      hoverBg: '#f3f4f6'
    };
  };

  const style = getStyle();

  return (
    <button
      onClick={onClick}
      className="w-full rounded-lg p-4 border-2 transition-all duration-200 hover:shadow-sm text-left"
      style={{
        backgroundColor: style.backgroundColor,
        borderColor: style.borderColor
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = style.hoverBg;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = style.backgroundColor;
      }}
      data-testid={testId}
    >
      <div className="flex items-center gap-3">
        <Icon 
          className="w-5 h-5 flex-shrink-0" 
          style={{ color: style.iconColor }}
        />
        <p 
          className="text-base font-semibold"
          style={{ color: style.textColor }}
        >
          {label}
        </p>
      </div>
    </button>
  );
};

export const ProgressSidebar: React.FC<ProgressSidebarProps> = ({ 
  steps, 
  activeSection,
  onSectionClick,
  className = '' 
}) => {
  const { logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleNewReport = () => {
    navigate('/new-post-secondary-assessment');
  };

  const handleHome = () => {
    navigate('/');
  };

  return (
    <div 
      className={`w-64 h-screen bg-white border-r border-gray-200 flex flex-col ${className}`}
      style={{ position: 'fixed', left: 0, top: 0 }}
    >
      {/* Section Buttons */}
      <div className="flex-1 p-4 space-y-3 overflow-y-auto pt-6">
        {steps.map((step) => {
          const isActive = activeSection === step.id || step.status === 'active';
          
          return (
            <SidebarButton
              key={step.id}
              icon={step.icon}
              label={step.label}
              onClick={() => onSectionClick?.(step.id)}
              isActive={isActive}
              iconColor={step.iconColor}
              testId={`progress-step-${step.id}`}
            />
          );
        })}
      </div>

      {/* Bottom Action Buttons */}
      {isAuthenticated && (
        <div className="p-4 space-y-3 border-t border-gray-200">
          {/* New Report Button */}
          <SidebarButton
            icon={Plus}
            label="New Report"
            onClick={handleNewReport}
            variant="primary"
            testId="button-new-report"
          />

          {/* Home Button */}
          <SidebarButton
            icon={Home}
            label="Home"
            onClick={handleHome}
            testId="button-home"
          />

          {/* Logout Button */}
          <SidebarButton
            icon={LogOut}
            label="Logout"
            onClick={logout}
            testId="button-logout"
          />
        </div>
      )}
    </div>
  );
};

// Default export for convenience
export default ProgressSidebar;

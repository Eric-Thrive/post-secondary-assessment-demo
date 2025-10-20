import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { User, LogOut, CheckCircle, FileText, Eye, Zap } from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import ThriveLogo from "@assets/primary logo O-W png_1760911234604.png";

interface ProgressStep {
  id: string;
  label: string;
  icon: React.ElementType;
  status: 'completed' | 'active' | 'pending';
}

interface ProgressSidebarProps {
  steps: ProgressStep[];
  className?: string;
}

export const ProgressSidebar: React.FC<ProgressSidebarProps> = ({ steps, className = '' }) => {
  const { user, logout, isAuthenticated } = useAuth();

  // THRIVE brand colors
  const brandColors = {
    navyBlue: '#1297D2',
    skyBlue: '#96D7E1',
    orange: '#F89E54',
    yellow: '#FDE677',
  };

  const getStepStyle = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          backgroundColor: '#f0fdf4',
          borderColor: '#86efac',
          textColor: '#166534'
        };
      case 'active':
        return {
          backgroundColor: brandColors.yellow,
          borderColor: brandColors.orange,
          textColor: '#78350f'
        };
      case 'pending':
        return {
          backgroundColor: '#f9fafb',
          borderColor: '#e5e7eb',
          textColor: '#6b7280'
        };
      default:
        return {
          backgroundColor: '#f9fafb',
          borderColor: '#e5e7eb',
          textColor: '#6b7280'
        };
    }
  };

  return (
    <div 
      className={`w-64 h-screen bg-white border-r border-gray-200 flex flex-col ${className}`}
      style={{ position: 'fixed', left: 0, top: 0 }}
    >
      {/* Logo Section */}
      <div className="p-6 border-b border-gray-200">
        <Link to="/">
          <img 
            src={ThriveLogo}
            alt="THRIVE"
            className="h-16 w-auto object-contain"
          />
        </Link>
      </div>

      {/* Progress Steps */}
      <div className="flex-1 p-4 space-y-3 overflow-y-auto">
        {steps.map((step, index) => {
          const style = getStepStyle(step.status);
          const Icon = step.icon;
          
          return (
            <div
              key={step.id}
              className="rounded-lg p-4 border-2 transition-all duration-200"
              style={{
                backgroundColor: style.backgroundColor,
                borderColor: style.borderColor
              }}
              data-testid={`progress-step-${step.id}`}
            >
              <div className="flex items-center gap-3">
                <div 
                  className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: step.status === 'completed' ? '#86efac' : 
                                   step.status === 'active' ? brandColors.orange : '#e5e7eb'
                  }}
                >
                  {step.status === 'completed' ? (
                    <CheckCircle 
                      className="w-5 h-5" 
                      style={{ color: '#166534' }}
                    />
                  ) : (
                    <Icon 
                      className="w-5 h-5" 
                      style={{ color: step.status === 'active' ? '#ffffff' : '#9ca3af' }}
                    />
                  )}
                </div>
                <div className="flex-1">
                  <p 
                    className="text-sm font-semibold"
                    style={{ color: style.textColor }}
                  >
                    {step.label}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* User Profile Section */}
      {isAuthenticated && (
        <div className="p-4 border-t border-gray-200">
          <div className="space-y-2">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
              <User className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">{user?.username}</span>
            </div>
            <Button
              onClick={logout}
              variant="outline"
              size="sm"
              className="w-full flex items-center justify-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

// Default export for convenience
export default ProgressSidebar;

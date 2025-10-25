import { useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useModule } from '@/contexts/ModuleContext';
import { useModuleAssessmentData } from '@/hooks/useModuleAssessmentData';
import { useAuth } from '@/contexts/AuthContext';
import { FileText, Plus, ChevronDown, User, LogOut, LogIn } from 'lucide-react';
import ThriveLogo from '@assets/primary logo O-W png_1760911234604.png';

const WelcomeDashboard = () => {
  const navigate = useNavigate();
  const { activeModule } = useModule();
  const { assessmentCases, isLoading, refreshCases } = useModuleAssessmentData(activeModule);
  const { user, logout } = useAuth();
  
  // Preserve previous data to prevent flash during refreshes
  const previousCompletedReports = useRef<any[]>([]);
  const [displayedReports, setDisplayedReports] = useState<any[]>([]);

  // Refresh cases when dashboard mounts
  useEffect(() => {
    console.log('WelcomeDashboard mounted - refreshing assessment cases');
    if (refreshCases) {
      refreshCases();
    }
  }, [refreshCases]);

  // Refresh cases when window regains focus (user returns to the tab/window)
  useEffect(() => {
    const handleFocus = () => {
      console.log('Window focused - refreshing assessment cases');
      if (refreshCases) {
        refreshCases();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refreshCases]);

  // THRIVE brand colors
  const brandColors = {
    navyBlue: '#1297D2',
    skyBlue: '#96D7E1',
    orange: '#F89E54',
    yellow: '#FDE677',
  };

  // Memoize completed reports to avoid creating new array on every render
  const completedReports = useMemo(() => 
    assessmentCases.filter(
      (report) => report.status === 'completed' && report.analysis_result
    ),
    [assessmentCases]
  );

  // Update displayed reports, preserving previous data during refreshes
  useEffect(() => {
    // Helper to compare report arrays by IDs
    const arraysEqual = (a: any[], b: any[]) => {
      if (a.length !== b.length) return false;
      const aIds = new Set(a.map(r => r.id));
      const bIds = new Set(b.map(r => r.id));
      return a.every(r => bIds.has(r.id)) && b.every(r => aIds.has(r.id));
    };

    if (completedReports.length > 0) {
      // We have new data - only update if it's actually different
      if (!arraysEqual(completedReports, displayedReports)) {
        setDisplayedReports(completedReports);
        previousCompletedReports.current = completedReports;
      }
    } else if (previousCompletedReports.current.length > 0 && isLoading) {
      // We're loading and data is temporarily empty - keep showing previous data
      if (!arraysEqual(previousCompletedReports.current, displayedReports)) {
        setDisplayedReports(previousCompletedReports.current);
      }
    } else if (completedReports.length === 0 && !isLoading) {
      // Confirmed no data and not loading - clear display
      if (displayedReports.length > 0) {
        setDisplayedReports([]);
        previousCompletedReports.current = [];
      }
    }
  }, [completedReports, isLoading, displayedReports]);

  // Get new assessment route based on module
  const getNewReportRoute = () => {
    if (activeModule === 'k12') {
      return '/new-k12-assessment';
    } else if (activeModule === 'tutoring') {
      return '/new-tutoring-assessment';
    } else {
      return '/new-post-secondary-assessment';
    }
  };

  // Get reports route based on module
  const getReportsRoute = (reportId: string) => {
    if (activeModule === 'k12') {
      return `/k12-reports?caseId=${reportId}`;
    } else if (activeModule === 'tutoring') {
      return `/tutoring-reports?caseId=${reportId}`;
    } else {
      return `/post-secondary-reports?caseId=${reportId}`;
    }
  };

  return (
    <div 
      className="min-h-screen w-full relative"
      style={{
        background: `linear-gradient(to right, rgba(150, 215, 225, 0.2), rgba(150, 215, 225, 0.3), rgba(150, 215, 225, 0.1))`
      }}
    >
      {/* Logo - Fixed at Absolute Top Left */}
      <div className="absolute top-6 left-6 z-10">
        <img 
          src={ThriveLogo}
          alt="THRIVE"
          className="h-32 w-auto object-contain"
        />
      </div>

      {/* User Indicator - Fixed at Absolute Top Right */}
      {user && (
        <div className="absolute top-6 right-6 z-10 flex items-center gap-4" data-testid="user-indicator">
          <div className="flex items-center gap-2 px-4 py-2 bg-white/80 rounded-lg backdrop-blur-sm shadow-sm">
            <User className="h-5 w-5 text-gray-700" />
            <span className="text-gray-800 font-medium" data-testid="text-username">{user.username || 'User'}</span>
          </div>
          <Button
            onClick={logout}
            variant="outline"
            size="sm"
            className="bg-white/80 border-gray-300 text-gray-700 hover:bg-white hover:text-gray-900 backdrop-blur-sm shadow-sm"
            data-testid="button-logout-header"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      )}

      {/* Login Button - Fixed at Absolute Top Right (when NOT logged in) */}
      {!user && (
        <div className="absolute top-6 right-6 z-10">
          <Button
            onClick={() => navigate('/post-secondary-demo-login')}
            variant="default"
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
            data-testid="button-login-header"
          >
            <LogIn className="h-4 w-4 mr-2" />
            Login
          </Button>
        </div>
      )}

      {/* Centered Content Container */}
      <div className="min-h-screen w-full flex items-center justify-center p-6">
        <div className="max-w-5xl w-full">
          {/* Action Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* New Report Card - Now First */}
          <Card
            onClick={() => navigate(getNewReportRoute())}
            className="p-12 cursor-pointer transition-all duration-200 hover:shadow-xl border-2"
            style={{
              backgroundColor: brandColors.navyBlue,
              borderColor: brandColors.navyBlue,
            }}
            data-testid="card-new-report"
          >
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              <div 
                className="p-4 rounded-full"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
              >
                <Plus 
                  className="h-12 w-12"
                  style={{ color: '#ffffff' }}
                />
              </div>
              <div>
                <h3 
                  className="text-lg font-bold mb-2 text-white"
                  style={{ 
                    fontFamily: 'Avenir, "Avenir Next", -apple-system, BlinkMacSystemFont, sans-serif'
                  }}
                >
                  New Report
                </h3>
                <p className="text-white text-opacity-90 text-base">
                  Start a new assessment
                </p>
              </div>
            </div>
          </Card>

          {/* View Reports Card with Dropdown - Now Second */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Card
                className="p-12 cursor-pointer transition-all duration-200 hover:shadow-xl border-2"
                style={{
                  backgroundColor: brandColors.orange,
                  borderColor: brandColors.orange,
                }}
                data-testid="card-view-reports"
              >
                <div className="flex flex-col items-center justify-center text-center space-y-4">
                  <div 
                    className="p-4 rounded-full"
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
                  >
                    <FileText 
                      className="h-12 w-12"
                      style={{ color: '#ffffff' }}
                    />
                  </div>
                  <div>
                    <h3 
                      className="text-lg font-bold mb-2 text-white"
                      style={{ 
                        fontFamily: 'Avenir, "Avenir Next", -apple-system, BlinkMacSystemFont, sans-serif'
                      }}
                    >
                      View Reports
                    </h3>
                    <p className="text-white text-opacity-90 text-base">
                      {displayedReports.length} report{displayedReports.length !== 1 ? 's' : ''} available
                    </p>
                  </div>
                  <ChevronDown className="h-5 w-5 text-white text-opacity-70" />
                </div>
              </Card>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              className="w-80 max-h-96 overflow-y-auto"
              align="center"
            >
              {isLoading && displayedReports.length === 0 ? (
                <DropdownMenuItem disabled>Loading reports...</DropdownMenuItem>
              ) : displayedReports.length === 0 ? (
                <DropdownMenuItem disabled>No reports available</DropdownMenuItem>
              ) : (
                displayedReports.map((report) => (
                  <DropdownMenuItem
                    key={report.id}
                    onClick={() => navigate(getReportsRoute(report.id))}
                    className="cursor-pointer"
                    data-testid={`report-${report.id}`}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {report.display_name || 'Untitled Report'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(report.created_date).toLocaleDateString()}
                      </span>
                    </div>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeDashboard;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from '@/contexts/AuthContext';
import { useModule } from '@/contexts/ModuleContext';
import { useModuleAssessmentData } from '@/hooks/useModuleAssessmentData';
import { FileText, Plus, Edit2, LogOut, ChevronDown } from 'lucide-react';
import ThriveLogo from '@assets/isotype Y-NB_1754494460165.png';

const WelcomeDashboard = () => {
  const navigate = useNavigate();
  const { logout, isAuthenticated, user, getLogoutRedirectPath } = useAuth();
  const { activeModule } = useModule();
  const { assessmentCases, isLoading } = useModuleAssessmentData(activeModule);

  // THRIVE brand colors
  const brandColors = {
    navyBlue: '#1297D2',
    skyBlue: '#96D7E1',
    orange: '#F89E54',
    yellow: '#F5E6A3',
  };

  // Get completed reports only
  const completedReports = assessmentCases.filter(
    (report) => report.status === 'completed' && report.analysis_result
  );

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

  // Get review edit route based on module
  const getReviewEditRoute = () => {
    if (activeModule === 'k12') {
      return '/k12-review-edit';
    } else if (activeModule === 'tutoring') {
      return '/tutoring-review-edit';
    } else {
      return '/post-secondary-review-edit';
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

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      // Redirect to appropriate path based on current environment
      const redirectPath = getLogoutRedirectPath();
      navigate(redirectPath);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div 
      className="min-h-screen w-full flex items-center justify-center p-6"
      style={{
        background: `linear-gradient(to right, rgba(150, 215, 225, 0.2), rgba(150, 215, 225, 0.3), rgba(150, 215, 225, 0.1))`
      }}
    >
      <div className="max-w-4xl w-full">
        {/* Welcome Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <img 
              src={ThriveLogo}
              alt="THRIVE Logo"
              className="h-24 w-24 object-contain"
            />
          </div>
          <h1 
            className="text-4xl font-bold mb-2"
            style={{ 
              fontFamily: 'Avenir, "Avenir Next", -apple-system, BlinkMacSystemFont, sans-serif',
              color: brandColors.navyBlue
            }}
          >
            Welcome to THRIVE
          </h1>
          <p className="text-gray-600 text-lg">
            {user?.username ? `Hello, ${user.username}!` : 'Assessment Portal'}
          </p>
        </div>

        {/* Action Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* View Reports Card with Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Card
                className="p-8 cursor-pointer transition-all duration-200 hover:shadow-xl border-2"
                style={{
                  backgroundColor: '#ffffff',
                  borderColor: brandColors.skyBlue,
                }}
                data-testid="card-view-reports"
              >
                <div className="flex flex-col items-center text-center space-y-4">
                  <div 
                    className="p-4 rounded-full"
                    style={{ backgroundColor: `${brandColors.skyBlue}40` }}
                  >
                    <FileText 
                      className="h-12 w-12"
                      style={{ color: brandColors.navyBlue }}
                    />
                  </div>
                  <div>
                    <h3 
                      className="text-xl font-bold mb-2"
                      style={{ 
                        fontFamily: 'Avenir, "Avenir Next", -apple-system, BlinkMacSystemFont, sans-serif',
                        color: brandColors.navyBlue
                      }}
                    >
                      View Reports
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {completedReports.length} report{completedReports.length !== 1 ? 's' : ''} available
                    </p>
                  </div>
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                </div>
              </Card>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              className="w-80 max-h-96 overflow-y-auto"
              align="center"
            >
              {isLoading ? (
                <DropdownMenuItem disabled>Loading reports...</DropdownMenuItem>
              ) : completedReports.length === 0 ? (
                <DropdownMenuItem disabled>No reports available</DropdownMenuItem>
              ) : (
                completedReports.map((report) => (
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

          {/* New Report Card */}
          <Card
            onClick={() => navigate(getNewReportRoute())}
            className="p-8 cursor-pointer transition-all duration-200 hover:shadow-xl border-2"
            style={{
              backgroundColor: brandColors.navyBlue,
              borderColor: brandColors.navyBlue,
            }}
            data-testid="card-new-report"
          >
            <div className="flex flex-col items-center text-center space-y-4">
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
                  className="text-xl font-bold mb-2 text-white"
                  style={{ 
                    fontFamily: 'Avenir, "Avenir Next", -apple-system, BlinkMacSystemFont, sans-serif'
                  }}
                >
                  New Report
                </h3>
                <p className="text-white text-opacity-90 text-sm">
                  Start a new assessment
                </p>
              </div>
            </div>
          </Card>

          {/* Review & Edit Card */}
          <Card
            onClick={() => navigate(getReviewEditRoute())}
            className="p-8 cursor-pointer transition-all duration-200 hover:shadow-xl border-2"
            style={{
              backgroundColor: '#ffffff',
              borderColor: brandColors.orange,
            }}
            data-testid="card-review-edit"
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div 
                className="p-4 rounded-full"
                style={{ backgroundColor: `${brandColors.orange}40` }}
              >
                <Edit2 
                  className="h-12 w-12"
                  style={{ color: brandColors.orange }}
                />
              </div>
              <div>
                <h3 
                  className="text-xl font-bold mb-2"
                  style={{ 
                    fontFamily: 'Avenir, "Avenir Next", -apple-system, BlinkMacSystemFont, sans-serif',
                    color: brandColors.navyBlue
                  }}
                >
                  Review & Edit
                </h3>
                <p className="text-gray-600 text-sm">
                  Modify existing reports
                </p>
              </div>
            </div>
          </Card>

          {/* Logout Card */}
          {isAuthenticated && (
            <Card
              onClick={handleLogout}
              className="p-8 cursor-pointer transition-all duration-200 hover:shadow-xl border-2"
              style={{
                backgroundColor: '#ffffff',
                borderColor: '#d1d5db',
              }}
              data-testid="card-logout"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div 
                  className="p-4 rounded-full"
                  style={{ backgroundColor: '#f3f4f6' }}
                >
                  <LogOut 
                    className="h-12 w-12"
                    style={{ color: '#6b7280' }}
                  />
                </div>
                <div>
                  <h3 
                    className="text-xl font-bold mb-2"
                    style={{ 
                      fontFamily: 'Avenir, "Avenir Next", -apple-system, BlinkMacSystemFont, sans-serif',
                      color: '#374151'
                    }}
                  >
                    Logout
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Sign out of your account
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default WelcomeDashboard;


import React from 'react';
import { Card } from "@/components/ui/card";
import { Plus, FileText, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { useModule } from '@/contexts/ModuleContext';
import { useEnvironment } from '@/contexts/EnvironmentContext';

export const QuickActions = () => {
  const { activeModule, isK12 } = useModule();
  const { currentEnvironment } = useEnvironment();
  
  // Check if we're in a demo environment
  const isDemoEnv = currentEnvironment.includes('-demo');
  
  // Build environment-aware routes
  let assessmentRoute: string;
  let reportsRoute: string;
  
  if (isDemoEnv) {
    // Demo environments use /demo-env-name/assessment pattern
    assessmentRoute = `/${currentEnvironment}/assessment`;
    reportsRoute = `/${currentEnvironment}/reports`;
  } else {
    // Developer mode uses traditional routes
    assessmentRoute = isK12 ? '/new-k12-assessment' : 
                     activeModule === 'tutoring' ? '/new-tutoring-assessment' : 
                     '/new-post-secondary-assessment';
    reportsRoute = isK12 ? '/k12-reports' : 
                  activeModule === 'tutoring' ? '/tutoring-reports' : 
                  '/post-secondary-reports';
  }
  
  const assessmentTitle = isK12 ? 'Start New K-12 Assessment' : 'Start New Post-Secondary Assessment';
  const assessmentDescription = isK12 
    ? 'Begin a new K-12 student accommodation evaluation with document upload and analysis.'
    : 'Begin a new post-secondary student accommodation evaluation with document upload and analysis.';
  
  const cardColor = isK12 ? 'from-green-600 to-green-700 hover:from-green-700 hover:to-green-800' : 'from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800';

  return (
    <div className={`mt-8 grid grid-cols-1 ${isK12 && !isDemoEnv ? 'md:grid-cols-4' : 'md:grid-cols-3'} gap-6`}>
      <Link to={assessmentRoute} data-testid="link-new-assessment">
        <Card className={`bg-gradient-to-br ${cardColor} text-white cursor-pointer transition-all p-6`}>
          <div className="flex items-center text-white font-semibold">
            <Plus className="h-5 w-5 mr-2" />
            {assessmentTitle}
          </div>
        </Card>
      </Link>

      {isK12 && !isDemoEnv && (
        <Link to="/new-k12-complex-assessment" data-testid="link-k12-complex">
          <Card className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white cursor-pointer hover:from-emerald-700 hover:to-emerald-800 transition-all p-6">
            <div className="flex items-center text-white font-semibold">
              <Plus className="h-5 w-5 mr-2" />
              K-12 Complex Analysis
            </div>
          </Card>
        </Link>
      )}

      <Link to={reportsRoute} data-testid="link-reports">
        <Card className="bg-gradient-to-br from-green-600 to-green-700 text-white cursor-pointer hover:from-green-700 hover:to-green-800 transition-all p-6">
          <div className="flex items-center text-white font-semibold">
            <FileText className="h-5 w-5 mr-2" />
            Generate Reports
          </div>
        </Card>
      </Link>

      {!isDemoEnv && (
        <Link to="/prompts" data-testid="link-prompts">
          <Card className="bg-gradient-to-br from-purple-600 to-purple-700 text-white cursor-pointer hover:from-purple-700 hover:to-purple-800 transition-all p-6">
            <div className="flex items-center text-white font-semibold">
              <Users className="h-5 w-5 mr-2" />
              Manage Prompts
            </div>
          </Card>
        </Link>
      )}
    </div>
  );
};

import React from 'react';
import { useEnvironment } from '@/contexts/EnvironmentContext';
import thriveLogo from "@assets/primary logo NB-W png_1752592774951.png";

export const SplashScreen = () => {
  const { currentEnvironment } = useEnvironment();
  
  const isDemoMode = currentEnvironment === 'post-secondary-demo' || currentEnvironment === 'k12-demo';
  const isK12Demo = currentEnvironment === 'k12-demo';

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="text-center">
        {/* Logo Section */}
        <div className="mb-8">
          <div className="mx-auto w-fit">
            <img 
              src={thriveLogo} 
              alt="THRIVE Logo" 
              className="h-32 w-auto mx-auto filter brightness-0 invert"
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Call to Action */}
          <div className="mt-12">
            <p className="text-white/70 text-sm">
              {isK12Demo 
                ? 'Use the navigation menu above to explore our K-12 educational assessment capabilities'
                : isDemoMode 
                ? 'Use the navigation menu above to explore our assessment capabilities'
                : 'Navigate using the menu above'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
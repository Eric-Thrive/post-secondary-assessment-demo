import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AppNavigation } from '@/components/shared/AppNavigation';
import { K12ReviewEditReports } from '@/components/K12ReviewEditReports';

const K12ReviewEditPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <AppNavigation />
      <div className="container mx-auto px-4 py-6">
        <Card className="w-full max-w-6xl mx-auto">
          <CardHeader>
            <CardTitle>Review & Edit Reports</CardTitle>
            <CardDescription>
              Edit and finalize your K-12 assessment reports. Changes are tracked and require approval before finalizing.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <K12ReviewEditReports />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default K12ReviewEditPage;
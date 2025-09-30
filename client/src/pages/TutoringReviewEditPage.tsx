import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AppNavigation } from '@/components/shared/AppNavigation';
import { TutoringReviewEditReports } from '@/components/TutoringReviewEditReports';

const TutoringReviewEditPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <AppNavigation />
      <div className="container mx-auto px-4 py-6">
        <Card className="w-full max-w-6xl mx-auto">
          <CardHeader>
            <CardTitle>Review & Edit Reports</CardTitle>
            <CardDescription>
              Edit and finalize your tutoring assessment reports. Changes are tracked and require approval before finalizing.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TutoringReviewEditReports />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TutoringReviewEditPage;
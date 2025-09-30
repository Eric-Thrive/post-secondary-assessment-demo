import { BookOpen } from 'lucide-react';
import DemoLandingPage from './DemoLandingPage';

export default function K12DemoLandingPage() {
  return (
    <DemoLandingPage
      environment="k12-demo"
      title="K-12 Demo"
      description="Discover our specialized K-12 assessment system designed for elementary and secondary schools. Help students thrive with personalized support plans."
      icon={BookOpen}
      features={[
        "Grade-appropriate assessments",
        "Special education focus",
        "IEP and 504 plan support",
        "Evidence-based interventions",
        "Parent-friendly reporting",
        "School district compliance"
      ]}
      primaryColor="bg-green-600"
    />
  );
}
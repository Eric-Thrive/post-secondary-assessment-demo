import { Users } from 'lucide-react';
import DemoLandingPage from './DemoLandingPage';

export default function TutoringDemoLandingPage() {
  return (
    <DemoLandingPage
      environment="tutoring-demo"
      title="Tutoring Demo"
      description="Explore our tutoring business assessment system. Generate professional reports with strict formatting perfect for tracking student progress and billing."
      icon={Users}
      features={[
        "Strict schema formatting",
        "Professional billing reports",
        "Progress tracking tools", 
        "Client communication ready",
        "Special education expertise",
        "Consistent JSON structure"
      ]}
      primaryColor="bg-purple-600"
    />
  );
}
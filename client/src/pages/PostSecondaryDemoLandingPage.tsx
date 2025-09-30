import { GraduationCap } from 'lucide-react';
import DemoLandingPage from './DemoLandingPage';

export default function PostSecondaryDemoLandingPage() {
  return (
    <DemoLandingPage
      environment="post-secondary-demo"
      title="Post-Secondary Demo"
      description="Experience our AI-powered accommodation assessment system designed for colleges and universities. See how we help students succeed in higher education."
      icon={GraduationCap}
      features={[
        "Comprehensive accommodation analysis",
        "Evidence-based recommendations", 
        "Professional report formatting",
        "Higher education focused",
        "Multiple assessment pathways",
        "Detailed diagnostic insights"
      ]}
      primaryColor="bg-blue-600"
    />
  );
}
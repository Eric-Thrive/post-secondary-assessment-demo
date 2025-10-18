import { GraduationCap } from 'lucide-react';
import DemoLandingPage from './DemoLandingPage';

export default function PostSecondaryDemoLandingPage() {
  return (
    <DemoLandingPage
      environment="post-secondary-demo"
      title="Post-Secondary Portal"
      description="Comprehensive assessment and analysis platform for post-secondary education success"
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
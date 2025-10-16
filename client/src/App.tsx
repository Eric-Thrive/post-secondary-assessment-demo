import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ModuleProvider, useModule } from "@/contexts/ModuleContext";
import { EnvironmentProvider } from "@/contexts/EnvironmentContext";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import NewAssessmentPage from "./pages/NewAssessmentPage";
import NewK12AssessmentPage from "./pages/NewK12AssessmentPage";
import NewK12ComplexAssessmentPage from "./pages/NewK12ComplexAssessmentPage";
import NewPostSecondaryAssessmentPage from "./pages/NewPostSecondaryAssessmentPage";
import NewTutoringAssessmentPage from "./pages/NewTutoringAssessmentPage";
import ReportPage from "./pages/ReportPage";
import PostSecondaryReportsPage from "./pages/PostSecondaryReportsPage";
import K12ReportsPage from "./pages/K12ReportsPage";
import TutoringReportsPage from "./pages/TutoringReportsPage";
import PostSecondaryReviewEditPage from "./pages/PostSecondaryReviewEditPage";
import K12ReviewEditPage from "./pages/K12ReviewEditPage";
import TutoringReviewEditPage from "./pages/TutoringReviewEditPage";
import PromptsPage from "./pages/PromptsPage";
import AdminPage from "./pages/AdminPage";
import TutoringDemoPage from "./pages/TutoringDemoPage";
import PostSecondaryDemoLandingPage from "./pages/PostSecondaryDemoLandingPage";
import K12DemoLandingPage from "./pages/K12DemoLandingPage";
import TutoringDemoLandingPage from "./pages/TutoringDemoLandingPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import ReviewDocumentsPage from "./pages/ReviewDocumentsPage";
import { SharedReport } from "./pages/SharedReport";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Component to handle smart report routing based on module context
const ReportRouteHandler = () => {
  const { activeModule } = useModule();
  
  // Redirect to module-specific report page
  if (activeModule === 'k12') {
    return <Navigate to="/k12-reports" replace />;
  } else if (activeModule === 'tutoring') {
    return <Navigate to="/tutoring-reports" replace />;
  } else {
    return <Navigate to="/post-secondary-reports" replace />;
  }
};

// Redirect legacy assessment route to module-specific routes
const AssessmentRouteHandler = () => {
  const { activeModule } = useModule();
  
  // Redirect to module-specific assessment page
  if (activeModule === 'k12') {
    return <Navigate to="/new-k12-assessment" replace />;
  } else if (activeModule === 'tutoring') {
    return <Navigate to="/new-tutoring-assessment" replace />;
  } else {
    return <Navigate to="/new-post-secondary-assessment" replace />;
  }
};

// Customer Experience Shell - Locked Environment
const CustomerExperienceShell = ({ children, forcedEnvironment }: { children: React.ReactNode; forcedEnvironment: any }) => (
  <QueryClientProvider client={queryClient}>
    <EnvironmentProvider forcedEnvironment={forcedEnvironment}>
      <AuthProvider>
        <ModuleProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            {children}
          </TooltipProvider>
        </ModuleProvider>
      </AuthProvider>
    </EnvironmentProvider>
  </QueryClientProvider>
);

// Developer Shell - Full Environment Switching
const DeveloperShell = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <EnvironmentProvider>
      <AuthProvider>
        <ModuleProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            {children}
          </TooltipProvider>
        </ModuleProvider>
      </AuthProvider>
    </EnvironmentProvider>
  </QueryClientProvider>
);

const App = () => (
  <BrowserRouter>
    <Routes>
      {/* Customer-Facing Demo Routes (Locked Environments) */}
      <Route path="/post-secondary-demo/*" element={
        <CustomerExperienceShell forcedEnvironment="post-secondary-demo">
          <Routes>
            <Route index element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="assessment" element={<ProtectedRoute><NewPostSecondaryAssessmentPage /></ProtectedRoute>} />
            <Route path="review-documents" element={<ProtectedRoute><ReviewDocumentsPage /></ProtectedRoute>} />
            <Route path="reports" element={<ProtectedRoute><PostSecondaryReportsPage /></ProtectedRoute>} />
            <Route path="review-edit" element={<ProtectedRoute><PostSecondaryReviewEditPage /></ProtectedRoute>} />
          </Routes>
        </CustomerExperienceShell>
      } />
      
      <Route path="/k12-demo/*" element={
        <CustomerExperienceShell forcedEnvironment="k12-demo">
          <Routes>
            <Route index element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="assessment" element={<ProtectedRoute><NewK12AssessmentPage /></ProtectedRoute>} />
            <Route path="review-documents" element={<ProtectedRoute><ReviewDocumentsPage /></ProtectedRoute>} />
            <Route path="reports" element={<ProtectedRoute><K12ReportsPage /></ProtectedRoute>} />
            <Route path="review-edit" element={<ProtectedRoute><K12ReviewEditPage /></ProtectedRoute>} />
          </Routes>
        </CustomerExperienceShell>
      } />
      
      <Route path="/tutoring-demo/*" element={
        <CustomerExperienceShell forcedEnvironment="tutoring-demo">
          <Routes>
            <Route index element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="assessment" element={<ProtectedRoute><NewTutoringAssessmentPage /></ProtectedRoute>} />
            <Route path="review-documents" element={<ProtectedRoute><ReviewDocumentsPage /></ProtectedRoute>} />
            <Route path="reports" element={<ProtectedRoute><TutoringReportsPage /></ProtectedRoute>} />
            <Route path="review-edit" element={<ProtectedRoute><TutoringReviewEditPage /></ProtectedRoute>} />
          </Routes>
        </CustomerExperienceShell>
      } />

      {/* Developer/Integrated App Routes (Full Environment Switching) */}
      <Route path="/*" element={
        <DeveloperShell>
          <Routes>
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/new-assessment" element={<ProtectedRoute><AssessmentRouteHandler /></ProtectedRoute>} />
            <Route path="/new-k12-assessment" element={<ProtectedRoute><NewK12AssessmentPage /></ProtectedRoute>} />
            <Route path="/new-k12-complex-assessment" element={<ProtectedRoute><NewK12ComplexAssessmentPage /></ProtectedRoute>} />
            <Route path="/new-post-secondary-assessment" element={<ProtectedRoute><NewPostSecondaryAssessmentPage /></ProtectedRoute>} />
            <Route path="/new-tutoring-assessment" element={<ProtectedRoute><NewTutoringAssessmentPage /></ProtectedRoute>} />
            <Route path="/review-documents" element={<ProtectedRoute><ReviewDocumentsPage /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><ReportRouteHandler /></ProtectedRoute>} />
            <Route path="/post-secondary-reports" element={<ProtectedRoute><PostSecondaryReportsPage /></ProtectedRoute>} />
            <Route path="/k12-reports" element={<ProtectedRoute><K12ReportsPage /></ProtectedRoute>} />
            <Route path="/tutoring-reports" element={<ProtectedRoute><TutoringReportsPage /></ProtectedRoute>} />
            <Route path="/post-secondary-review-edit" element={<ProtectedRoute><PostSecondaryReviewEditPage /></ProtectedRoute>} />
            <Route path="/k12-review-edit" element={<ProtectedRoute><K12ReviewEditPage /></ProtectedRoute>} />
            <Route path="/tutoring-review-edit" element={<ProtectedRoute><TutoringReviewEditPage /></ProtectedRoute>} />
            <Route path="/prompts" element={<ProtectedRoute><PromptsPage /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
            <Route path="/tutoring-demo" element={<TutoringDemoPage />} />
            
            {/* Demo Landing Pages (Authentication Required) */}
            <Route path="/login" element={<PostSecondaryDemoLandingPage />} />
            <Route path="/register" element={<PostSecondaryDemoLandingPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/post-secondary-demo-login" element={<PostSecondaryDemoLandingPage />} />
            <Route path="/k12-demo-login" element={<K12DemoLandingPage />} />
            <Route path="/tutoring-demo-login" element={<TutoringDemoLandingPage />} />
            
            <Route path="/shared/:shareToken" element={<SharedReport />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </DeveloperShell>
      } />
    </Routes>
  </BrowserRouter>
);

export default App;
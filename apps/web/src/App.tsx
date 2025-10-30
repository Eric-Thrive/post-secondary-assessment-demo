import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ModuleProvider, useModule } from "@/contexts/ModuleContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { PerformanceWrapper } from "@/components/performance/PerformanceWrapper";
import {
  RouteMigration,
  LegacyRouteRedirect,
} from "@/components/routing/RouteMigration";
import { AUTH_ROUTES } from "@/config/routes";
import UnifiedLoginPage from "@/components/auth/UnifiedLoginPage";
import Index from "./pages/Index";
import K12HomePage from "./pages/K12HomePage";
import PostSecondaryHomePage from "./pages/PostSecondaryHomePage";
import TutoringHomePage from "./pages/TutoringHomePage";
import NewK12AssessmentPage from "./pages/NewK12AssessmentPage";
import NewK12ComplexAssessmentPage from "./pages/NewK12ComplexAssessmentPage";
import NewPostSecondaryAssessmentPage from "./pages/NewPostSecondaryAssessmentPage";
import NewTutoringAssessmentPage from "./pages/NewTutoringAssessmentPage";
import K12ReportsPage from "./pages/K12ReportsPage";
import PostSecondaryReportsPage from "./pages/PostSecondaryReportsPage";
import TutoringReportsPage from "./pages/TutoringReportsPage";
import PostSecondaryReviewEditPage from "./pages/PostSecondaryReviewEditPage";
import K12ReviewEditPage from "./pages/K12ReviewEditPage";
import TutoringReviewEditPage from "./pages/TutoringReviewEditPage";
import PromptsPage from "./pages/PromptsPage";
import AdminPage from "./pages/AdminPage";
import AdminDashboard from "./pages/AdminDashboard";
import UserManagementPage from "./pages/UserManagementPage";
import OrganizationManagementPage from "./pages/OrganizationManagementPage";
import TutoringDemoPage from "./pages/TutoringDemoPage";
import PostSecondaryDemoLandingPage from "./pages/PostSecondaryDemoLandingPage";
import K12DemoLandingPage from "./pages/K12DemoLandingPage";
import TutoringDemoLandingPage from "./pages/TutoringDemoLandingPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import PostSecondaryLoginPage from "./pages/PostSecondaryLoginPage";
import K12LoginPage from "./pages/K12LoginPage";
import TutorLoginPage from "./pages/TutorLoginPage";
import ReviewDocumentsPage from "./pages/ReviewDocumentsPage";
import { SharedReport } from "./pages/SharedReport";
import NotFound from "./pages/NotFound";
import AuthenticationGuard from "@/components/auth/AuthenticationGuard";
import { ModuleType } from "@/types/unified-auth";
import { ModuleDashboard } from "@/components/dashboard/ModuleDashboard";

const queryClient = new QueryClient();

// Component to handle smart report routing based on module context
const ReportRouteHandler = () => {
  const { activeModule } = useModule();

  // Redirect to module-specific report page
  if (activeModule === "k12") {
    return <Navigate to="/k12-reports" replace />;
  } else if (activeModule === "tutoring") {
    return <Navigate to="/tutoring-reports" replace />;
  } else {
    return <Navigate to="/post-secondary-reports" replace />;
  }
};

// Component to handle authenticated user routing
const AuthenticatedRoute = () => {
  const { user, isLoading, isAuthenticated } = useAuth();

  console.log("AuthenticatedRoute - isLoading:", isLoading);
  console.log("AuthenticatedRoute - isAuthenticated:", isAuthenticated);
  console.log("AuthenticatedRoute - user:", user);

  if (isLoading) {
    console.log("Still loading, showing loading screen");
    return <div>Loading...</div>;
  }

  if (!isAuthenticated || !user) {
    console.log("Not authenticated, redirecting to login");
    return <Navigate to="/login" replace />;
  }

  // Debug: Log user object to see the actual structure
  console.log("User object:", user);
  console.log("User role:", user.role);

  // Check if user is system admin or developer (try different possible role formats)
  const isSystemAdminOrDev =
    user.role === "SYSTEM_ADMIN" ||
    user.role === "system_admin" ||
    user.role === "DEVELOPER" ||
    user.role === "developer" ||
    user.role === "SystemAdmin" ||
    user.role === "Developer";

  if (isSystemAdminOrDev) {
    // System admins and developers go to module picker
    console.log("Routing system admin/dev to module picker");
    return <Navigate to="/module-picker" replace />;
  }

  // For other users, determine their enrolled module
  console.log("Routing regular user based on role");
  if (user.role === "K12_TEACHER" || user.role === "K12_ADMIN") {
    return <Navigate to="/k12" replace />;
  } else if (user.role === "TUTOR" || user.role === "TUTORING_ADMIN") {
    return <Navigate to="/tutoring" replace />;
  } else {
    // Default to post-secondary for other roles
    return <Navigate to="/post-secondary" replace />;
  }
};

// Component to handle post-secondary route with admin redirect
const PostSecondaryRoute = () => {
  const { user, isLoading, isAuthenticated } = useAuth();

  console.log("PostSecondaryRoute - isLoading:", isLoading);
  console.log("PostSecondaryRoute - isAuthenticated:", isAuthenticated);
  console.log("PostSecondaryRoute - user:", user);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  console.log("User object:", user);
  console.log("User role:", user.role);

  // Check if user is system admin or developer - they should go to module picker
  const isSystemAdminOrDev =
    user.role === "SYSTEM_ADMIN" ||
    user.role === "system_admin" ||
    user.role === "DEVELOPER" ||
    user.role === "developer" ||
    user.role === "SystemAdmin" ||
    user.role === "Developer";

  if (isSystemAdminOrDev) {
    console.log(
      "System admin/dev accessing post-secondary, redirecting to module picker"
    );
    return <Navigate to="/module-picker" replace />;
  }

  return <div>Post-Secondary Module - Coming Soon</div>;
};

// Component to render the module picker for system admins
const ModulePickerRoute = () => {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Get user's available modules - for system admins, this should include all modules
  const availableModules = user.moduleAccess || [];

  console.log("ModulePickerRoute - availableModules:", availableModules);

  try {
    return <ModuleDashboard user={user} availableModules={availableModules} />;
  } catch (error) {
    console.error("Error rendering ModuleDashboard:", error);
    return (
      <div style={{ padding: "20px", color: "red" }}>
        Error loading module picker: {String(error)}
      </div>
    );
  }
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ModuleProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<UnifiedLoginPage />} />
              <Route path="/" element={<AuthenticatedRoute />} />
              <Route path="/module-picker" element={<ModulePickerRoute />} />
              <Route path="/k12" element={<K12HomePage />} />
              <Route
                path="/post-secondary"
                element={<PostSecondaryHomePage />}
              />
              <Route path="/tutoring" element={<TutoringHomePage />} />

              {/* Assessment Routes */}
              <Route
                path="/new-k12-assessment"
                element={<NewK12AssessmentPage />}
              />
              <Route
                path="/new-post-secondary-assessment"
                element={<NewPostSecondaryAssessmentPage />}
              />
              <Route
                path="/new-tutoring-assessment"
                element={<NewTutoringAssessmentPage />}
              />

              {/* Reports Routes */}
              <Route path="/k12-reports" element={<K12ReportsPage />} />
              <Route
                path="/post-secondary-reports"
                element={<PostSecondaryReportsPage />}
              />
              <Route
                path="/tutoring-reports"
                element={<TutoringReportsPage />}
              />

              {/* Review/Edit Routes */}
              <Route path="/k12-review-edit" element={<K12ReviewEditPage />} />
              <Route
                path="/post-secondary-review-edit"
                element={<PostSecondaryReviewEditPage />}
              />
              <Route
                path="/tutoring-review-edit"
                element={<TutoringReviewEditPage />}
              />

              {/* Admin Routes */}
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<UserManagementPage />} />
              <Route
                path="/admin/organizations"
                element={<OrganizationManagementPage />}
              />
              <Route path="/prompts" element={<PromptsPage />} />
            </Routes>
          </BrowserRouter>
        </ModuleProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

const AppOriginal = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ModuleProvider>
          <BrowserRouter>
            <Routes>
              <Route
                path="/login"
                element={
                  <div
                    style={{
                      padding: "20px",
                      background: "red",
                      color: "white",
                    }}
                  >
                    LOGIN TEST - If you see this, routing works
                  </div>
                }
              />
              <Route
                path="/post-secondary-demo-login"
                element={<UnifiedLoginPage />}
              />
              <Route
                path="/post-secondary-demo"
                element={<Navigate to="/" replace />}
              />
              <Route path="/k12-demo" element={<Navigate to="/" replace />} />
              <Route
                path="/tutoring-demo"
                element={<Navigate to="/" replace />}
              />

              {/* Module Home Routes */}
              <Route
                path="/k12"
                element={
                  <AuthenticationGuard allowedModules={[ModuleType.K12]}>
                    <K12HomePage />
                  </AuthenticationGuard>
                }
              />
              <Route
                path="/post-secondary"
                element={
                  <AuthenticationGuard
                    allowedModules={[ModuleType.POST_SECONDARY]}
                  >
                    <PostSecondaryHomePage />
                  </AuthenticationGuard>
                }
              />
              <Route
                path="/tutoring"
                element={
                  <AuthenticationGuard allowedModules={[ModuleType.TUTORING]}>
                    <TutoringHomePage />
                  </AuthenticationGuard>
                }
              />

              {/* Assessment Routes */}
              <Route
                path="/new-k12-assessment"
                element={
                  <AuthenticationGuard allowedModules={[ModuleType.K12]}>
                    <NewK12AssessmentPage />
                  </AuthenticationGuard>
                }
              />
              <Route
                path="/new-post-secondary-assessment"
                element={
                  <AuthenticationGuard
                    allowedModules={[ModuleType.POST_SECONDARY]}
                  >
                    <NewPostSecondaryAssessmentPage />
                  </AuthenticationGuard>
                }
              />
              <Route
                path="/new-tutoring-assessment"
                element={
                  <AuthenticationGuard allowedModules={[ModuleType.TUTORING]}>
                    <NewTutoringAssessmentPage />
                  </AuthenticationGuard>
                }
              />

              {/* Reports Routes */}
              <Route
                path="/k12-reports"
                element={
                  <AuthenticationGuard allowedModules={[ModuleType.K12]}>
                    <K12ReportsPage />
                  </AuthenticationGuard>
                }
              />
              <Route
                path="/post-secondary-reports"
                element={
                  <AuthenticationGuard
                    allowedModules={[ModuleType.POST_SECONDARY]}
                  >
                    <PostSecondaryReportsPage />
                  </AuthenticationGuard>
                }
              />
              <Route
                path="/tutoring-reports"
                element={
                  <AuthenticationGuard allowedModules={[ModuleType.TUTORING]}>
                    <TutoringReportsPage />
                  </AuthenticationGuard>
                }
              />

              <Route
                path="/"
                element={
                  <AuthenticationGuard>
                    <Index />
                  </AuthenticationGuard>
                }
              />
              <Route
                path="*"
                element={<div>Route not found: {window.location.pathname}</div>}
              />
            </Routes>
          </BrowserRouter>
        </ModuleProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;

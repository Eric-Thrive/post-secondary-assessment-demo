import { useNavigate } from "react-router-dom";
import { useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useModule } from "@/contexts/ModuleContext";
import { useModuleAssessmentData } from "@/hooks/useModuleAssessmentData";
import { useAuth } from "@/contexts/AuthContext";
import { FileText, Plus, LogOut, ChevronDown } from "lucide-react";

// THRIVE Logo Component - Updated Brand Design
const ThriveLogo = () => (
  <div className="flex items-center space-x-4">
    {/* Network/Connection Icon - Updated Design */}
    <div className="relative w-20 h-16">
      <svg
        width="80"
        height="64"
        viewBox="0 0 80 64"
        style={{ color: "#F89E54" }}
        fill="currentColor"
      >
        {/* Main network structure - refined design */}

        {/* Primary connection lines */}
        <path
          d="M12 32 L28 16 M12 32 L28 48 M28 16 L44 32 M28 48 L44 32 M44 32 L60 16 M44 32 L60 48"
          stroke="currentColor"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Secondary connection lines */}
        <path
          d="M60 16 L68 20 M60 48 L68 44 M68 20 L68 44"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />

        {/* Network nodes - main structure */}
        <circle cx="12" cy="32" r="4.5" />
        <circle cx="28" cy="16" r="4" />
        <circle cx="28" cy="48" r="4" />
        <circle cx="44" cy="32" r="4.5" />
        <circle cx="60" cy="16" r="4" />
        <circle cx="60" cy="48" r="4" />

        {/* End nodes */}
        <circle cx="68" cy="20" r="3" />
        <circle cx="68" cy="44" r="3" />

        {/* Additional small connection nodes */}
        <circle cx="20" cy="24" r="2" />
        <circle cx="20" cy="40" r="2" />
        <circle cx="52" cy="24" r="2" />
        <circle cx="52" cy="40" r="2" />

        {/* Small connector lines */}
        <path
          d="M16 28 L20 24 M16 36 L20 40 M48 28 L52 24 M48 36 L52 40"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    </div>

    {/* THRIVE Text */}
    <h1
      className="text-5xl font-bold tracking-wide"
      style={{ color: "#F89E54" }}
    >
      THRIVE
    </h1>
  </div>
);

interface ThriveHomeScreenProps {
  className?: string;
}

export default function ThriveHomeScreen({
  className = "",
}: ThriveHomeScreenProps) {
  const navigate = useNavigate();
  const { activeModule } = useModule();
  const { assessmentCases, isLoading, refreshCases } =
    useModuleAssessmentData(activeModule);
  const { user, logout } = useAuth();

  // Refresh cases when component mounts
  useEffect(() => {
    if (refreshCases) {
      refreshCases();
    }
  }, [refreshCases]);

  // Calculate completed reports
  const completedReports = useMemo(
    () =>
      assessmentCases.filter(
        (report) => report.status === "completed" && report.analysis_result
      ),
    [assessmentCases]
  );

  // Get new assessment route based on module
  const getNewReportRoute = () => {
    if (activeModule === "k12") {
      return "/new-k12-assessment";
    } else if (activeModule === "tutoring") {
      return "/new-tutoring-assessment";
    } else {
      return "/new-post-secondary-assessment";
    }
  };

  // Get reports route based on module
  const getReportsRoute = (reportId?: string) => {
    const baseRoute =
      activeModule === "k12"
        ? "/k12-reports"
        : activeModule === "tutoring"
        ? "/tutoring-reports"
        : "/post-secondary-reports";

    return reportId ? `${baseRoute}?caseId=${reportId}` : baseRoute;
  };

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col ${className}`}
    >
      <div className="container mx-auto px-6 py-8 max-w-5xl flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <ThriveLogo />

          <div className="flex items-center space-x-4">
            {/* User Info */}
            {user && (
              <div className="flex items-center space-x-3">
                <span className="text-gray-700 font-medium">
                  {user.username}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={logout}
                  className="flex items-center space-x-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Main Navigation Cards - Vertically Centered */}
        <div className="flex-1 flex items-center justify-center">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
            {/* New Report Card - SUNWASHED Blue #1297D2 */}
            <Card
              onClick={() => navigate(getNewReportRoute())}
              className="group p-12 cursor-pointer transition-all duration-300 hover:shadow-2xl border-0 text-white"
              style={{
                background: "#1297D2",
                boxShadow: "0 10px 25px rgba(18, 151, 210, 0.3)",
              }}
              data-testid="card-new-report"
            >
              <div className="flex flex-col items-center justify-center text-center space-y-6">
                <div className="p-6 bg-white/20 rounded-full group-hover:bg-white/30 transition-all duration-300 group-hover:scale-110">
                  <Plus className="h-12 w-12 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold mb-3">New Report</h2>
                  <p className="text-white/90 text-lg leading-relaxed">
                    Start a new assessment
                  </p>
                </div>
              </div>
            </Card>

            {/* View Reports Card - SUNWASHED Orange #F89E54 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Card
                  className="group p-12 cursor-pointer transition-all duration-300 hover:shadow-2xl border-0 text-white"
                  style={{
                    background: "#F89E54",
                    boxShadow: "0 10px 25px rgba(248, 158, 84, 0.3)",
                  }}
                  data-testid="card-view-reports"
                >
                  <div className="flex flex-col items-center justify-center text-center space-y-6">
                    <div className="p-6 bg-white/20 rounded-full group-hover:bg-white/30 transition-all duration-300 group-hover:scale-110">
                      <FileText className="h-12 w-12 text-white" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold mb-3">View Reports</h2>
                      <p className="text-white/90 text-lg leading-relaxed">
                        {isLoading
                          ? "Loading reports..."
                          : `${completedReports.length} report${
                              completedReports.length !== 1 ? "s" : ""
                            } available`}
                      </p>
                    </div>
                    <ChevronDown className="h-6 w-6 text-white/80 group-hover:translate-y-1 transition-transform" />
                  </div>
                </Card>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-80 max-h-96 overflow-y-auto shadow-xl border-0 bg-white rounded-xl"
                align="center"
              >
                {isLoading ? (
                  <DropdownMenuItem disabled className="p-4">
                    <div className="flex items-center space-x-2">
                      <div
                        className="animate-spin rounded-full h-4 w-4 border-b-2"
                        style={{ borderColor: "#F89E54" }}
                      ></div>
                      <span>Loading reports...</span>
                    </div>
                  </DropdownMenuItem>
                ) : completedReports.length === 0 ? (
                  <DropdownMenuItem disabled className="p-4 text-center">
                    <div className="text-gray-500">No reports available</div>
                  </DropdownMenuItem>
                ) : (
                  <>
                    {/* View All Reports Option */}
                    <DropdownMenuItem
                      onClick={() => navigate(getReportsRoute())}
                      className="cursor-pointer p-4 hover:bg-gray-50 transition-colors border-b"
                    >
                      <div className="flex items-center space-x-3 w-full">
                        <div
                          className="p-2 rounded-lg"
                          style={{ backgroundColor: "rgba(248, 158, 84, 0.1)" }}
                        >
                          <FileText
                            className="h-4 w-4"
                            style={{ color: "#F89E54" }}
                          />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            View All Reports
                          </div>
                          <div className="text-sm text-gray-500">
                            Browse all {completedReports.length} report
                            {completedReports.length !== 1 ? "s" : ""}
                          </div>
                        </div>
                      </div>
                    </DropdownMenuItem>

                    {/* Individual Reports */}
                    {completedReports.slice(0, 5).map((report) => (
                      <DropdownMenuItem
                        key={report.id}
                        onClick={() => navigate(getReportsRoute(report.id))}
                        className="cursor-pointer p-4 hover:bg-gray-50 transition-colors"
                        data-testid={`report-${report.id}`}
                      >
                        <div className="flex items-center space-x-3 w-full">
                          <div
                            className="p-2 rounded-lg"
                            style={{
                              backgroundColor: "rgba(18, 151, 210, 0.1)",
                            }}
                          >
                            <FileText
                              className="h-4 w-4"
                              style={{ color: "#1297D2" }}
                            />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">
                              {report.display_name || "Untitled Report"}
                            </div>
                            <div className="text-sm text-gray-500">
                              Created{" "}
                              {new Date(
                                report.created_date
                              ).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </DropdownMenuItem>
                    ))}

                    {completedReports.length > 5 && (
                      <DropdownMenuItem
                        onClick={() => navigate(getReportsRoute())}
                        className="cursor-pointer p-4 hover:bg-gray-50 transition-colors text-center"
                      >
                        <div className="text-gray-600 font-medium">
                          View {completedReports.length - 5} more report
                          {completedReports.length - 5 !== 1 ? "s" : ""}...
                        </div>
                      </DropdownMenuItem>
                    )}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
}

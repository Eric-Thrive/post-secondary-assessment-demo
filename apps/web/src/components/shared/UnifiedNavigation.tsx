import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Home,
  FileText,
  Plus,
  Settings,
  Shield,
  LogOut,
  User,
  LogIn,
  Menu,
  X,
  ChevronRight,
  GraduationCap,
  BookOpen,
  Users,
} from "lucide-react";
import { useModule } from "@/contexts/ModuleContext";
import { useAuth } from "@/contexts/AuthContext";
import thriveIsotype from "@assets/isotype B-W png_1752593825075.png";
import ThriveLogo from "@assets/primary logo O-W png_1760911234604.png";

interface UnifiedNavigationProps {
  variant?: "sidebar" | "header";
  className?: string;
}

export const UnifiedNavigation: React.FC<UnifiedNavigationProps> = ({
  variant = "sidebar",
  className = "",
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { activeModule, isDemoMode } = useModule();
  const { user, logout, isAuthenticated } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isAdmin = user?.role === "system_admin";

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path);
  };

  const getLoginPath = () => {
    // Default to post-secondary login since we no longer have environment-based routing
    return "/login/post-secondary";
  };

  const handleLogin = () => {
    navigate(getLoginPath());
  };

  // Get module-specific routes
  const getNewAssessmentRoute = () => {
    if (activeModule === "k12") {
      return "/new-k12-assessment";
    } else if (activeModule === "tutoring") {
      return "/new-tutoring-assessment";
    } else {
      return "/new-post-secondary-assessment";
    }
  };

  const getReportsRoute = () => {
    if (activeModule === "k12") {
      return "/k12-reports";
    } else if (activeModule === "tutoring") {
      return "/tutoring-reports";
    } else {
      return "/post-secondary-reports";
    }
  };

  // Module configuration
  const moduleConfig = {
    post_secondary: {
      name: "Post-Secondary",
      icon: GraduationCap,
      color: "bg-blue-600",
      textColor: "text-blue-600",
    },
    k12: {
      name: "K-12",
      icon: BookOpen,
      color: "bg-green-600",
      textColor: "text-green-600",
    },
    tutoring: {
      name: "Tutoring",
      icon: Users,
      color: "bg-purple-600",
      textColor: "text-purple-600",
    },
  };

  const currentModuleConfig =
    moduleConfig[activeModule as keyof typeof moduleConfig];

  // Navigation items
  const navigationItems = [
    {
      label: "Home",
      path: "/",
      icon: Home,
      isActive: isActive("/"),
    },
    {
      label: "New Assessment",
      path: getNewAssessmentRoute(),
      icon: Plus,
      isActive: isActive("/new-"),
    },
    {
      label: "View Reports",
      path: getReportsRoute(),
      icon: FileText,
      isActive:
        isActive("/reports") ||
        isActive("/k12-reports") ||
        isActive("/tutoring-reports") ||
        isActive("/post-secondary-reports"),
    },
  ];

  // Admin navigation items
  const adminItems = [
    {
      label: "Prompt Manager",
      path: "/prompts",
      icon: Settings,
      isActive: isActive("/prompts"),
      show: !isDemoMode,
    },
    {
      label: "Admin",
      path: "/admin",
      icon: Shield,
      isActive: isActive("/admin"),
      show: isAdmin,
    },
  ].filter((item) => item.show);

  if (variant === "header") {
    // Header navigation (fallback for mobile or specific cases)
    return (
      <nav className={`bg-white border-b border-gray-200 ${className}`}>
        <div className="container mx-auto px-4">
          <div className="flex items-center h-16 space-x-8">
            <Link to="/" className="flex items-center">
              <img
                src={thriveIsotype}
                alt="THRIVE Logo"
                className="h-12 w-12"
              />
            </Link>

            <div className="flex items-center space-x-2 ml-auto">
              {/* Module Switcher */}
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-xs">
                  {currentModuleConfig.name}
                </Badge>
                {isDemoMode && (
                  <Badge variant="secondary" className="text-xs">
                    Demo
                  </Badge>
                )}
              </div>

              {adminItems.map((item) => (
                <Link key={item.path} to={item.path}>
                  <Button
                    variant={item.isActive ? "default" : "ghost"}
                    className="flex items-center space-x-2"
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Button>
                </Link>
              ))}

              {isAuthenticated ? (
                <div className="flex items-center space-x-2 ml-4 pl-4 border-l border-gray-200">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <User className="h-4 w-4" />
                    <span>{user?.username}</span>
                  </div>
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
              ) : (
                <div className="ml-4 pl-4 border-l border-gray-200">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleLogin}
                    className="flex items-center space-x-2"
                  >
                    <LogIn className="h-4 w-4" />
                    <span>Login</span>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
    );
  }

  // Sidebar navigation (default) - Post-Secondary Demo Design
  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="bg-white shadow-md"
        >
          {isMobileMenuOpen ? (
            <X className="h-4 w-4" />
          ) : (
            <Menu className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Sidebar - Enhanced Post-Secondary Demo Design */}
      <div
        className={`
        fixed left-0 top-0 h-full w-80 bg-gradient-to-b from-white to-gray-50 border-r border-gray-200 shadow-lg z-40 transform transition-transform duration-300 ease-in-out
        ${
          isMobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        }
        ${className}
      `}
      >
        {/* Logo Section - Enhanced */}
        <div className="p-6 border-b border-gray-100 bg-white">
          <Link to="/" className="flex items-center space-x-3 group">
            <img
              src={ThriveLogo}
              alt="THRIVE"
              className="h-16 w-auto object-contain transition-transform group-hover:scale-105"
            />
          </Link>
        </div>

        {/* Module Selector - Enhanced with Post-Secondary Demo Style */}
        <div className="p-6 border-b border-gray-100 bg-white">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider">
              Current Module
            </h3>
            <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 shadow-sm">
              <div
                className={`p-3 rounded-xl ${currentModuleConfig.color} shadow-md`}
              >
                <currentModuleConfig.icon className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900 text-lg">
                  {currentModuleConfig.name}
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  {isDemoMode && (
                    <Badge variant="secondary" className="text-xs px-2 py-1">
                      Demo Mode
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs px-2 py-1">
                    Active
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Items - Button-Based Menu Design */}
        <div className="p-6 space-y-3 flex-1 overflow-y-auto">
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-4">
            Navigation
          </h3>
          <div className="space-y-2">
            {navigationItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Button
                  variant={item.isActive ? "default" : "ghost"}
                  className={`
                    w-full justify-start h-12 px-4 text-left font-medium transition-all duration-200
                    ${
                      item.isActive
                        ? `${currentModuleConfig.color} text-white shadow-md hover:shadow-lg`
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    }
                  `}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  <span className="flex-1">{item.label}</span>
                  {item.isActive && <ChevronRight className="h-4 w-4 ml-2" />}
                </Button>
              </Link>
            ))}
          </div>

          {/* Admin Section - Enhanced Button Design */}
          {adminItems.length > 0 && (
            <div className="pt-6 mt-6 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-4">
                Administration
              </h3>
              <div className="space-y-2">
                {adminItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Button
                      variant={item.isActive ? "default" : "ghost"}
                      className={`
                        w-full justify-start h-12 px-4 text-left font-medium transition-all duration-200
                        ${
                          item.isActive
                            ? "bg-gray-900 text-white shadow-md hover:shadow-lg hover:bg-gray-800"
                            : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                        }
                      `}
                    >
                      <item.icon className="h-5 w-5 mr-3" />
                      <span className="flex-1">{item.label}</span>
                      {item.isActive && (
                        <ChevronRight className="h-4 w-4 ml-2" />
                      )}
                    </Button>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Section - Enhanced Design */}
        <div className="p-6 border-t border-gray-200 bg-white">
          {isAuthenticated ? (
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <User className="h-5 w-5 text-gray-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900 truncate">
                    {user?.username}
                  </div>
                  <div className="text-xs text-gray-500">
                    {user?.role === "system_admin" ? "Administrator" : "User"}
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={logout}
                className="w-full h-10 flex items-center justify-center space-x-2 hover:bg-red-50 hover:border-red-200 hover:text-red-700 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleLogin}
              className="w-full h-12 flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all"
            >
              <LogIn className="h-4 w-4" />
              <span>Login</span>
            </Button>
          )}
        </div>
      </div>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
};

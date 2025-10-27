import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Settings, LogOut, User, Shield, LogIn } from "lucide-react";
import { ModuleSwitcher } from "../ModuleSwitcher";
import { useModule } from "@/contexts/ModuleContext";
import { useAuth } from "@/contexts/AuthContext";
import thriveIsotype from "@assets/isotype B-W png_1752593825075.png";

export const AppNavigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { activeModule, isDemoMode } = useModule();
  const { user, logout, isAuthenticated } = useAuth();
  const isAdmin = user?.role === "system_admin";

  const showLogout = isAuthenticated;

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const getLoginPath = () => {
    // Default to post-secondary login since we no longer have environment-based routing
    return "/login/post-secondary";
  };

  const handleLogin = () => {
    navigate(getLoginPath());
  };

  return (
    <nav className="bg-white border-b border-gray-200 mb-6">
      <div className="container mx-auto px-4">
        <div className="flex items-center h-16 space-x-8">
          <Link to="/" className="flex items-center">
            <img src={thriveIsotype} alt="THRIVE Logo" className="h-12 w-12" />
          </Link>

          <div className="flex items-center space-x-2 ml-auto">
            <ModuleSwitcher variant="full" />

            {!isDemoMode && (
              <Link to="/prompts">
                <Button
                  variant={isActive("/prompts") ? "default" : "ghost"}
                  className="flex items-center space-x-2"
                >
                  <Settings className="h-4 w-4" />
                  <span>Prompt Manager</span>
                </Button>
              </Link>
            )}

            {user?.role === "system_admin" && (
              <Link to="/admin">
                <Button
                  variant={isActive("/admin") ? "default" : "ghost"}
                  className="flex items-center space-x-2"
                  data-testid="admin-nav-link"
                >
                  <Shield className="h-4 w-4" />
                  <span>Admin</span>
                </Button>
              </Link>
            )}

            {showLogout ? (
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
                  data-testid="login-button"
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
};

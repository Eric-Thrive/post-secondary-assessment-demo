import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, LogIn, UserPlus, Shield, AlertCircle } from "lucide-react";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";
import { LoginCredentials } from "@/types/unified-auth";
import { THRIVE_COLORS } from "@/config/modules";

interface UnifiedLoginPageProps {
  onAuthSuccess?: (user: any) => void;
  redirectPath?: string;
  theme?: "light" | "dark";
}

const UnifiedLoginPage: React.FC<UnifiedLoginPageProps> = ({
  onAuthSuccess,
  redirectPath,
  theme = "light",
}) => {
  const { login, authError, clearAuthError, isLoading } = useUnifiedAuth();
  const [loginData, setLoginData] = useState<LoginCredentials>({
    username: "",
    password: "",
  });
  const [emailNotVerified, setEmailNotVerified] = useState<{
    email: string;
  } | null>(null);
  const [registerData, setRegisterData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    email: "",
    module: "post_secondary", // Default module
  });
  const [activeTab, setActiveTab] = useState("login");
  const [showCredentialsDialog, setShowCredentialsDialog] = useState(false);
  const [activeRecoveryView, setActiveRecoveryView] = useState<
    "options" | "password" | "username"
  >("options");
  const [error, setError] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isRateLimited, setIsRateLimited] = useState(false);

  const handleCloseCredentialsDialog = () => {
    setShowCredentialsDialog(false);
    setActiveRecoveryView("options");
    setResetEmail("");
    setRecoveryEmail("");
  };

  const openCredentialsDialog = (
    view: "options" | "password" | "username" = "options"
  ) => {
    setActiveRecoveryView(view);
    setShowCredentialsDialog(true);
  };

  // Rate limiting configuration
  const MAX_LOGIN_ATTEMPTS = 5;
  const RATE_LIMIT_DURATION = 15 * 60 * 1000; // 15 minutes

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginData.username || !loginData.password) return;

    // Check rate limiting
    if (isRateLimited) {
      return;
    }

    clearAuthError();

    try {
      const success = await login(loginData);

      if (success) {
        setLoginAttempts(0);
        onAuthSuccess?.(null); // User will be available through context
      } else {
        // Increment login attempts on failure
        const newAttempts = loginAttempts + 1;
        setLoginAttempts(newAttempts);

        // Apply rate limiting after max attempts
        if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
          setIsRateLimited(true);
          setTimeout(() => {
            setIsRateLimited(false);
            setLoginAttempts(0);
          }, RATE_LIMIT_DURATION);
        }
      }
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerData.username || !registerData.password || !registerData.email)
      return;

    if (registerData.password !== registerData.confirmPassword) {
      return;
    }

    setIsRegistering(true);
    setError("");

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: registerData.username.trim(),
          email: registerData.email.trim(),
          password: registerData.password,
          role: "customer",
          assignedModules: [registerData.module],
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(
          "Account created successfully! Please check your email and click the activation link before logging in."
        );
        // Switch to login tab
        setRegisterData({
          email: "",
          username: "",
          password: "",
          confirmPassword: "",
          module: "post_secondary",
        });
        // Optionally auto-fill login form
        setLoginData({
          username: registerData.username.trim(),
          password: "",
        });
      } else {
        setError(data.error || "Registration failed. Please try again.");
      }
    } catch (error) {
      console.error("Registration error:", error);
      setError("Registration failed. Please try again.");
    } finally {
      setIsRegistering(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) return;

    try {
      const response = await fetch("/api/auth/reset-password-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: resetEmail.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(
          "Password reset instructions have been sent to your email address if an account exists."
        );
        handleCloseCredentialsDialog();
      } else {
        alert(
          data.error || "Failed to send password reset email. Please try again."
        );
      }
    } catch (error) {
      console.error("Password reset error:", error);
      alert("Failed to send password reset email. Please try again.");
    }
  };

  const handleUsernameRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryEmail.trim()) return;

    try {
      const response = await fetch("/api/auth/forgot-username", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: recoveryEmail.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(
          "If an account exists with this email, your username has been sent to your email address."
        );
        handleCloseCredentialsDialog();
      } else {
        alert(
          data.error ||
            "Failed to send username recovery email. Please try again."
        );
      }
    } catch (error) {
      console.error("Username recovery error:", error);
      alert("Failed to send username recovery email. Please try again.");
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.1fr_0.9fr] grid-cols-1">
      {/* Brand Panel - Left Side */}
      <div
        className="bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 flex flex-col justify-center items-center p-8 text-white relative overflow-hidden"
        style={{
          background: THRIVE_COLORS.NAVY,
        }}
      >
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 max-w-md text-center">
          <div className="mx-auto w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-8">
            <Shield className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-4">THRIVE Assessment Portal</h1>
          <p className="text-lg text-white/80">
            Empowering educational accessibility through AI-powered assessment
            tools.
          </p>
        </div>
      </div>

      {/* Form Panel - Right Side */}
      <div className="bg-white flex flex-col justify-center p-8 lg:p-12">
        <div className="w-full max-w-md mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome Back
            </h2>
            <p className="text-gray-600">
              Sign in to access your assessment portal
            </p>
          </div>

          {/* Error Display */}
          {authError && (
            <Alert className="mb-6" variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {authError}
                {authError.includes("verify your email") && (
                  <div className="mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Navigate to resend verification page
                        window.location.href = "/verify-email-pending";
                      }}
                      className="w-full"
                    >
                      Resend Verification Email
                    </Button>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Rate Limiting Warning */}
          {isRateLimited && (
            <Alert className="mb-6" variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Too many failed login attempts. Please wait 15 minutes before
                trying again.
              </AlertDescription>
            </Alert>
          )}

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger
                value="login"
                className="transition-colors data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                Login
              </TabsTrigger>
              <TabsTrigger
                value="register"
                className="transition-colors data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                Register
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    value={loginData.username}
                    onChange={(e) =>
                      setLoginData((prev) => ({
                        ...prev,
                        username: e.target.value,
                      }))
                    }
                    placeholder="Enter your username"
                    required
                    disabled={isRateLimited}
                    data-testid="input-username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={loginData.password}
                    onChange={(e) =>
                      setLoginData((prev) => ({
                        ...prev,
                        password: e.target.value,
                      }))
                    }
                    placeholder="Enter your password"
                    required
                    disabled={isRateLimited}
                    data-testid="input-password"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading || isRateLimited}
                  data-testid="button-sign-in"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing In...
                    </>
                  ) : (
                    <>
                      <LogIn className="mr-2 h-4 w-4" />
                      Sign In
                    </>
                  )}
                </Button>
                {!isRateLimited && (
                  <div className="text-center mt-4">
                    <button
                      type="button"
                      onClick={() => openCredentialsDialog()}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      data-testid="link-forgot-credentials"
                    >
                      Forgot your credentials?
                    </button>
                  </div>
                )}
                {loginAttempts > 0 && loginAttempts < MAX_LOGIN_ATTEMPTS && (
                  <div className="text-center mt-2">
                    <p className="text-sm text-amber-600">
                      {MAX_LOGIN_ATTEMPTS - loginAttempts} attempts remaining
                    </p>
                  </div>
                )}
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="reg-username">Username</Label>
                  <Input
                    id="reg-username"
                    type="text"
                    value={registerData.username}
                    onChange={(e) =>
                      setRegisterData((prev) => ({
                        ...prev,
                        username: e.target.value,
                      }))
                    }
                    placeholder="Choose a username"
                    required
                    data-testid="input-reg-username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-email">Email</Label>
                  <Input
                    id="reg-email"
                    type="email"
                    value={registerData.email}
                    onChange={(e) =>
                      setRegisterData((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    placeholder="Enter your email"
                    required
                    data-testid="input-reg-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-password">Password</Label>
                  <Input
                    id="reg-password"
                    type="password"
                    value={registerData.password}
                    onChange={(e) =>
                      setRegisterData((prev) => ({
                        ...prev,
                        password: e.target.value,
                      }))
                    }
                    placeholder="Create a password"
                    required
                    data-testid="input-reg-password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={registerData.confirmPassword}
                    onChange={(e) =>
                      setRegisterData((prev) => ({
                        ...prev,
                        confirmPassword: e.target.value,
                      }))
                    }
                    placeholder="Confirm your password"
                    required
                    data-testid="input-reg-confirm-password"
                  />
                  {registerData.password &&
                    registerData.confirmPassword &&
                    registerData.password !== registerData.confirmPassword && (
                      <Alert>
                        <AlertDescription>
                          Passwords do not match
                        </AlertDescription>
                      </Alert>
                    )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="module-select">Select Module</Label>
                  <select
                    id="module-select"
                    value={registerData.module}
                    onChange={(e) =>
                      setRegisterData((prev) => ({
                        ...prev,
                        module: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    data-testid="select-module"
                  >
                    <option value="post_secondary">
                      Post-Secondary (College/University)
                    </option>
                    <option value="k12">
                      K-12 (Elementary/Middle/High School)
                    </option>
                    <option value="tutoring">Tutoring</option>
                  </select>
                  <p className="text-xs text-gray-500">
                    Choose the module you'll be using. This determines which
                    types of reports you can create.
                  </p>
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={
                    isRegistering ||
                    !registerData.username ||
                    !registerData.password ||
                    !registerData.email ||
                    registerData.password !== registerData.confirmPassword
                  }
                  data-testid="button-create-account"
                >
                  {isRegistering ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Create Account
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          {/* Helper Links */}
          <div className="mt-8 text-center space-y-2">
            <p className="text-sm text-gray-500">
              Don't have an account?{" "}
              <a
                href="/register"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Sign up
              </a>
            </p>
            <p className="text-sm text-gray-500">
              Need help accessing your account?{" "}
              <a
                href="#"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Contact Support
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Credentials Recovery Modal */}
      <Dialog
        open={showCredentialsDialog}
        onOpenChange={(open) => {
          if (open) {
            setShowCredentialsDialog(true);
          } else {
            handleCloseCredentialsDialog();
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          {activeRecoveryView === "options" && (
            <>
              <DialogHeader>
                <DialogTitle>Need help signing in?</DialogTitle>
                <DialogDescription>
                  Choose the option that best matches what you need to recover.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <Button
                  className="w-full"
                  onClick={() => setActiveRecoveryView("password")}
                  data-testid="button-start-password-reset"
                >
                  Reset Password
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setActiveRecoveryView("username")}
                  data-testid="button-start-username-recovery"
                >
                  Recover Username
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-4 text-center">
                Still need help?{" "}
                <a
                  href="#"
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Contact Support
                </a>
              </p>
            </>
          )}

          {activeRecoveryView === "password" && (
            <>
              <DialogHeader>
                <DialogTitle>Reset Password</DialogTitle>
                <DialogDescription>
                  Enter your email address and we'll send you instructions to
                  reset your password.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handlePasswordReset} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email Address</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="Enter your email address"
                    required
                    data-testid="input-reset-email"
                  />
                </div>
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveRecoveryView("options")}
                    className="flex-1"
                    data-testid="button-back-to-credentials-options"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading || !resetEmail.trim()}
                    className="flex-1"
                    data-testid="button-send-reset"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Send Reset Link"
                    )}
                  </Button>
                </div>
              </form>
            </>
          )}

          {activeRecoveryView === "username" && (
            <>
              <DialogHeader>
                <DialogTitle>Recover Username</DialogTitle>
                <DialogDescription>
                  Enter your email address and we'll send you your username if
                  an account exists.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleUsernameRecovery} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="recovery-email">Email Address</Label>
                  <Input
                    id="recovery-email"
                    type="email"
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                    placeholder="Enter your email address"
                    required
                    data-testid="input-recovery-email"
                  />
                </div>
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveRecoveryView("options")}
                    className="flex-1"
                    data-testid="button-back-to-credentials-options-from-username"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading || !recoveryEmail.trim()}
                    className="flex-1"
                    data-testid="button-send-recovery"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Send Username"
                    )}
                  </Button>
                </div>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UnifiedLoginPage;

import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const SimpleLogin = () => {
  const [activeTab, setActiveTab] = useState("login");
  const [loginData, setLoginData] = useState({
    username: "",
    password: "",
  });
  const [registerData, setRegisterData] = useState({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    role: "demo", // 'demo' or 'customer'
    module: "post-secondary", // 'k12', 'post-secondary', 'tutoring'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCredentialsDialog, setShowCredentialsDialog] = useState(false);
  const [activeRecoveryView, setActiveRecoveryView] = useState<
    "options" | "password" | "username"
  >("options");
  const [resetEmail, setResetEmail] = useState("");
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [isProcessingRecovery, setIsProcessingRecovery] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleCloseCredentialsDialog = () => {
    setShowCredentialsDialog(false);
    setActiveRecoveryView("options");
    setResetEmail("");
    setRecoveryEmail("");
    setIsProcessingRecovery(false);
  };

  const openCredentialsDialog = (
    view: "options" | "password" | "username" = "options"
  ) => {
    setActiveRecoveryView(view);
    setShowCredentialsDialog(true);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement registration logic
    console.log("Registration data:", registerData);
    setError("Registration functionality coming soon!");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const success = await login(loginData.username, loginData.password);
      if (success) {
        // Login successful - navigate to home
        navigate("/");
      } else {
        // Login failed - show error message
        setError(
          "Invalid username or password. Please check your credentials and try again."
        );
      }
    } catch (err: any) {
      // Network or other errors
      setError(err.message || "Failed to connect to server. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) return;

    try {
      setIsProcessingRecovery(true);
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
    } catch (err) {
      console.error("Password reset error:", err);
      alert("Failed to send password reset email. Please try again.");
    } finally {
      setIsProcessingRecovery(false);
    }
  };

  const handleUsernameRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryEmail.trim()) return;

    try {
      setIsProcessingRecovery(true);
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
    } catch (err) {
      console.error("Username recovery error:", err);
      alert("Failed to send username recovery email. Please try again.");
    } finally {
      setIsProcessingRecovery(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.1fr_0.9fr] grid-cols-1">
      {/* Brand Panel - Left Side - Solid THRIVE Navy */}
      <div
        className="flex flex-col justify-center items-center p-8 text-white relative"
        style={{ backgroundColor: "#1297d2" }}
      >
        <div className="max-w-md text-center">
          <div className="mx-auto w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mb-8">
            <svg
              className="h-10 w-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <h1 className="text-4xl font-bold mb-4">THRIVE Assessment Portal</h1>
          <p className="text-lg text-white/90">
            Empowering educational accessibility through AI-powered assessment
            tools.
          </p>
        </div>
      </div>

      {/* Form Panel - Right Side - Clean White */}
      <div className="bg-white flex flex-col justify-center p-8 lg:p-12">
        <div className="w-full max-w-md mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {activeTab === "login" ? "Welcome Back" : "Create Account"}
            </h2>
            <p className="text-gray-600">
              {activeTab === "login"
                ? "Sign in to access your assessment portal"
                : "Join THRIVE to get started with assessments"}
            </p>
          </div>

          {/* Tab Navigation - Clean solid colors */}
          <div className="flex mb-6 bg-gray-50 rounded-lg p-1 border">
            <button
              onClick={() => setActiveTab("login")}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === "login"
                  ? "text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
              style={{
                backgroundColor:
                  activeTab === "login" ? "#1297d2" : "transparent",
              }}
            >
              Sign In
            </button>
            <button
              onClick={() => setActiveTab("register")}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === "register"
                  ? "text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
              style={{
                backgroundColor:
                  activeTab === "register" ? "#1297d2" : "transparent",
              }}
            >
              Register
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Login Form */}
          {activeTab === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="username"
                  className="text-sm font-medium text-gray-700"
                >
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={loginData.username}
                  onChange={(e) =>
                    setLoginData({ ...loginData, username: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
                  style={{ focusRingColor: "#1297d2" }}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-gray-700"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={loginData.password}
                  onChange={(e) =>
                    setLoginData({ ...loginData, password: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
                  style={{ focusRingColor: "#1297d2" }}
                  required
                  disabled={isLoading}
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2 px-4 text-white font-medium rounded-md transition-colors hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: "#1297d2" }}
              >
                {isLoading ? "Signing In..." : "Sign In"}
              </button>
            </form>
          )}

          {/* Registration Form */}
          {activeTab === "register" && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="reg-email"
                  className="text-sm font-medium text-gray-700"
                >
                  Email
                </label>
                <input
                  id="reg-email"
                  type="email"
                  placeholder="Enter your email"
                  value={registerData.email}
                  onChange={(e) =>
                    setRegisterData({ ...registerData, email: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
                  required
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="reg-username"
                  className="text-sm font-medium text-gray-700"
                >
                  Username
                </label>
                <input
                  id="reg-username"
                  type="text"
                  placeholder="Choose a username"
                  value={registerData.username}
                  onChange={(e) =>
                    setRegisterData({
                      ...registerData,
                      username: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
                  required
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="reg-password"
                  className="text-sm font-medium text-gray-700"
                >
                  Password
                </label>
                <input
                  id="reg-password"
                  type="password"
                  placeholder="Create a password"
                  value={registerData.password}
                  onChange={(e) =>
                    setRegisterData({
                      ...registerData,
                      password: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
                  required
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="reg-confirm"
                  className="text-sm font-medium text-gray-700"
                >
                  Confirm Password
                </label>
                <input
                  id="reg-confirm"
                  type="password"
                  placeholder="Confirm your password"
                  value={registerData.confirmPassword}
                  onChange={(e) =>
                    setRegisterData({
                      ...registerData,
                      confirmPassword: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
                  required
                />
              </div>

              {/* Account Type Selection - Clean card design */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Account Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center space-x-2 cursor-pointer p-3 border rounded-md hover:bg-gray-50 transition-colors">
                    <input
                      type="radio"
                      name="role"
                      value="demo"
                      checked={registerData.role === "demo"}
                      onChange={(e) =>
                        setRegisterData({
                          ...registerData,
                          role: e.target.value,
                        })
                      }
                      className="text-blue-600"
                      style={{ accentColor: "#1297d2" }}
                    />
                    <div>
                      <div className="text-sm font-medium">Demo</div>
                      <div className="text-xs text-gray-500">
                        Free trial access
                      </div>
                    </div>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer p-3 border rounded-md hover:bg-gray-50 transition-colors">
                    <input
                      type="radio"
                      name="role"
                      value="customer"
                      checked={registerData.role === "customer"}
                      onChange={(e) =>
                        setRegisterData({
                          ...registerData,
                          role: e.target.value,
                        })
                      }
                      className="text-blue-600"
                      style={{ accentColor: "#1297d2" }}
                    />
                    <div>
                      <div className="text-sm font-medium">Customer</div>
                      <div className="text-xs text-gray-500">Full access</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Module Selection */}
              <div className="space-y-2">
                <label
                  htmlFor="module"
                  className="text-sm font-medium text-gray-700"
                >
                  Primary Module
                </label>
                <select
                  id="module"
                  value={registerData.module}
                  onChange={(e) =>
                    setRegisterData({ ...registerData, module: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
                >
                  <option value="post-secondary">
                    Post-Secondary Education
                  </option>
                  <option value="k12">K-12 Education</option>
                  <option value="tutoring">Tutoring Services</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2 px-4 text-white font-medium rounded-md transition-colors hover:opacity-90"
                style={{ backgroundColor: "#1297d2" }}
              >
                {registerData.role === "customer"
                  ? "Continue to Payment"
                  : "Create Demo Account"}
              </button>

              {registerData.role === "customer" && (
                <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
                  <p className="text-xs text-blue-700 text-center">
                    You'll be redirected to secure payment processing via Stripe
                  </p>
                </div>
              )}
            </form>
          )}

          {/* Support Links */}
          <div className="mt-6 text-center space-y-3">
            {activeTab === "login" && (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => openCredentialsDialog()}
                  className="block w-full text-sm font-medium hover:underline"
                  style={{ color: "#1297d2" }}
                >
                  Forgot your credentials?
                </button>
              </div>
            )}
            <div className="pt-2 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-2">
                Need help accessing your account?
              </p>
              <a
                href="mailto:eric@thriveiep.com?subject=Account Support Request"
                className="text-sm font-medium hover:underline"
                style={{ color: "#1297d2" }}
              >
                Contact Support
              </a>
            </div>
          </div>
        </div>
      </div>

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
                  Choose what you need help recovering.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <Button
                  className="w-full"
                  onClick={() => setActiveRecoveryView("password")}
                >
                  Reset Password
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setActiveRecoveryView("username")}
                >
                  Recover Username
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-4 text-center">
                Still stuck? <a href="mailto:eric@thriveiep.com" className="text-blue-600 hover:text-blue-700 font-medium">Contact Support</a>
              </p>
            </>
          )}

          {activeRecoveryView === "password" && (
            <>
              <DialogHeader>
                <DialogTitle>Reset Password</DialogTitle>
                <DialogDescription>
                  Enter your email address and we'll send instructions to reset your password.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handlePasswordReset} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="simple-reset-email">Email Address</Label>
                  <Input
                    id="simple-reset-email"
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                  />
                </div>
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setActiveRecoveryView("options")}
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={isProcessingRecovery || !resetEmail.trim()}
                  >
                    {isProcessingRecovery ? (
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
                  Enter your email address and we'll send your username if an account exists.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleUsernameRecovery} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="simple-recovery-email">Email Address</Label>
                  <Input
                    id="simple-recovery-email"
                    type="email"
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                  />
                </div>
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setActiveRecoveryView("options")}
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={isProcessingRecovery || !recoveryEmail.trim()}
                  >
                    {isProcessingRecovery ? (
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

export default SimpleLogin;

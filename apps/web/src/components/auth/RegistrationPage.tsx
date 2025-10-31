import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, UserPlus, Shield, AlertCircle, Check, X } from "lucide-react";
import { DemoModeBanner } from "./DemoModeBanner";
import { THRIVE_COLORS } from "@/config/modules";

interface RegistrationFormData {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  organizationName?: string;
}

interface PasswordStrength {
  score: number; // 0-4
  label: string;
  color: string;
  requirements: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    special: boolean;
  };
}

interface RegistrationPageProps {
  onRegistrationSuccess?: (email: string) => void;
  onContactSales?: () => void;
  demoMode?: boolean;
}

/**
 * RegistrationPage - User registration interface with demo mode banner
 * Requirements: 1.1, 2.1, 2.2, 2.5
 */
export const RegistrationPage: React.FC<RegistrationPageProps> = ({
  onRegistrationSuccess,
  onContactSales,
  demoMode = true,
}) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<RegistrationFormData>({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    organizationName: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSalesModal, setShowSalesModal] = useState(false);

  // Calculate password strength
  const calculatePasswordStrength = (password: string): PasswordStrength => {
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    const metRequirements = Object.values(requirements).filter(Boolean).length;
    let score = 0;
    let label = "Weak";
    let color = "text-red-600";

    if (metRequirements >= 5) {
      score = 4;
      label = "Very Strong";
      color = "text-green-600";
    } else if (metRequirements >= 4) {
      score = 3;
      label = "Strong";
      color = "text-green-500";
    } else if (metRequirements >= 3) {
      score = 2;
      label = "Fair";
      color = "text-yellow-600";
    } else if (metRequirements >= 1) {
      score = 1;
      label = "Weak";
      color = "text-orange-600";
    }

    return { score, label, color, requirements };
  };

  const passwordStrength = formData.password
    ? calculatePasswordStrength(formData.password)
    : null;

  // Validate email format
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!formData.email || !formData.username || !formData.password) {
      setError("Please fill in all required fields");
      return;
    }

    if (!isValidEmail(formData.email)) {
      setError("Please enter a valid email address");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!passwordStrength || passwordStrength.score < 2) {
      setError("Password is too weak. Please meet the minimum requirements.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email.trim(),
          username: formData.username.trim(),
          password: formData.password,
          organizationName: formData.organizationName?.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Registration successful
        if (onRegistrationSuccess) {
          onRegistrationSuccess(formData.email);
        } else {
          // Navigate to verification pending page
          navigate("/verify-email-pending", {
            state: { email: formData.email },
          });
        }
      } else {
        setError(data.error || "Registration failed. Please try again.");
      }
    } catch (error) {
      console.error("Registration error:", error);
      setError("Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleContactSales = () => {
    if (onContactSales) {
      onContactSales();
    } else {
      setShowSalesModal(true);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.1fr_0.9fr] grid-cols-1">
      {/* Brand Panel - Left Side */}
      <div
        className="bg-gradient-to-br flex flex-col justify-center items-center p-8 text-white relative overflow-hidden"
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
              Create Your Account
            </h2>
            <p className="text-gray-600">
              Join THRIVE to access powerful assessment tools
            </p>
          </div>

          {/* Demo Mode Banner */}
          {demoMode && (
            <DemoModeBanner
              onContactSales={handleContactSales}
              showPricingLink={false}
            />
          )}

          {/* Error Display */}
          {error && (
            <Alert className="mb-6" variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">
                Email Address <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="you@example.com"
                required
                data-testid="input-email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">
                Username <span className="text-red-500">*</span>
              </Label>
              <Input
                id="username"
                type="text"
                value={formData.username}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, username: e.target.value }))
                }
                placeholder="Choose a username"
                required
                data-testid="input-username"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                Password <span className="text-red-500">*</span>
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, password: e.target.value }))
                }
                placeholder="Create a strong password"
                required
                data-testid="input-password"
              />

              {/* Password Strength Indicator */}
              {formData.password && passwordStrength && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600">
                      Password Strength:
                    </span>
                    <span
                      className={`text-xs font-medium ${passwordStrength.color}`}
                      data-testid="password-strength-label"
                    >
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="flex gap-1 mb-2">
                    {[0, 1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded ${
                          level < passwordStrength.score
                            ? passwordStrength.score >= 4
                              ? "bg-green-600"
                              : passwordStrength.score >= 3
                              ? "bg-green-500"
                              : passwordStrength.score >= 2
                              ? "bg-yellow-600"
                              : "bg-orange-600"
                            : "bg-gray-200"
                        }`}
                      />
                    ))}
                  </div>
                  <div className="space-y-1">
                    {Object.entries(passwordStrength.requirements).map(
                      ([key, met]) => (
                        <div
                          key={key}
                          className="flex items-center gap-2 text-xs"
                        >
                          {met ? (
                            <Check className="h-3 w-3 text-green-600" />
                          ) : (
                            <X className="h-3 w-3 text-gray-400" />
                          )}
                          <span
                            className={met ? "text-gray-700" : "text-gray-500"}
                          >
                            {key === "length" && "At least 8 characters"}
                            {key === "uppercase" && "One uppercase letter"}
                            {key === "lowercase" && "One lowercase letter"}
                            {key === "number" && "One number"}
                            {key === "special" && "One special character"}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                Confirm Password <span className="text-red-500">*</span>
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    confirmPassword: e.target.value,
                  }))
                }
                placeholder="Confirm your password"
                required
                data-testid="input-confirm-password"
              />
              {formData.confirmPassword &&
                formData.password !== formData.confirmPassword && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <X className="h-3 w-3" />
                    Passwords do not match
                  </p>
                )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="organizationName">
                Organization Name (Optional)
              </Label>
              <Input
                id="organizationName"
                type="text"
                value={formData.organizationName}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    organizationName: e.target.value,
                  }))
                }
                placeholder="Your school or organization"
                data-testid="input-organization"
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
              data-testid="button-create-account"
            >
              {isLoading ? (
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

          {/* Helper Links */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <button
                onClick={() => navigate("/login")}
                className="text-[#1297d2] hover:text-[#1297d2]/80 font-medium"
                data-testid="link-sign-in"
              >
                Sign In
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

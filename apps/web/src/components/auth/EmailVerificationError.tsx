import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  XCircle,
  RefreshCw,
  HelpCircle,
  Loader2,
  Shield,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { THRIVE_COLORS } from "@/config/modules";

type ErrorType = "expired" | "invalid" | "already_verified" | "unknown";

interface EmailVerificationErrorProps {
  errorType?: ErrorType;
  errorMessage?: string;
  email?: string;
  onResendEmail?: () => Promise<void>;
}

/**
 * EmailVerificationError - Failed verification handling
 * Requirements: 4.4, 8.3
 */
export const EmailVerificationError: React.FC<EmailVerificationErrorProps> = ({
  errorType: propErrorType,
  errorMessage: propErrorMessage,
  email: propEmail,
  onResendEmail,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState("");

  // Get error details from props or location state
  const state = location.state as any;
  const errorType = propErrorType || state?.errorType || "unknown";
  const errorMessage =
    propErrorMessage ||
    state?.errorMessage ||
    "An error occurred during verification";
  const email = propEmail || state?.email || "";

  // Get error-specific content
  const getErrorContent = () => {
    switch (errorType) {
      case "expired":
        return {
          icon: Clock,
          iconColor: "text-orange-600",
          bgColor: "bg-orange-100",
          title: "Verification Link Expired",
          description:
            "This verification link has expired. Verification links are valid for 24 hours for security reasons.",
          canResend: true,
        };
      case "invalid":
        return {
          icon: XCircle,
          iconColor: "text-red-600",
          bgColor: "bg-red-100",
          title: "Invalid Verification Link",
          description:
            "This verification link is invalid or has already been used. Please request a new verification email.",
          canResend: true,
        };
      case "already_verified":
        return {
          icon: AlertTriangle,
          iconColor: "text-blue-600",
          bgColor: "bg-blue-100",
          title: "Already Verified",
          description:
            "This email address has already been verified. You can proceed to login.",
          canResend: false,
        };
      default:
        return {
          icon: XCircle,
          iconColor: "text-red-600",
          bgColor: "bg-red-100",
          title: "Verification Failed",
          description:
            "We couldn't verify your email address. Please try again or contact support if the problem persists.",
          canResend: true,
        };
    }
  };

  const errorContent = getErrorContent();
  const ErrorIcon = errorContent.icon;

  // Handle resend verification email
  const handleResend = async () => {
    if (!email) {
      setResendError("Email address not found. Please try registering again.");
      return;
    }

    setIsResending(true);
    setResendError("");
    setResendSuccess(false);

    try {
      if (onResendEmail) {
        await onResendEmail();
        setResendSuccess(true);
      } else {
        const response = await fetch("/api/auth/resend-verification", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        });

        const data = await response.json();

        if (response.ok) {
          setResendSuccess(true);
        } else {
          setResendError(
            data.error ||
              "Failed to resend verification email. Please try again."
          );
        }
      }
    } catch (error) {
      console.error("Resend verification error:", error);
      setResendError("Failed to resend verification email. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  // Handle contact support
  const handleContactSupport = () => {
    navigate("/support");
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

      {/* Content Panel - Right Side */}
      <div className="bg-white flex flex-col justify-center p-8 lg:p-12">
        <div className="w-full max-w-md mx-auto">
          <div className="text-center mb-8">
            <div
              className={`mx-auto w-16 h-16 ${errorContent.bgColor} rounded-full flex items-center justify-center mb-4`}
            >
              <ErrorIcon className={`h-8 w-8 ${errorContent.iconColor}`} />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {errorContent.title}
            </h2>
            <p className="text-gray-600">{errorContent.description}</p>
          </div>

          {/* Error Details */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-700 mb-2">
              <strong>Error:</strong> {errorMessage}
            </p>
            {email && (
              <p className="text-sm text-gray-700">
                <strong>Email:</strong> {email}
              </p>
            )}
          </div>

          {/* Success Message */}
          {resendSuccess && (
            <Alert className="mb-6" variant="default">
              <AlertDescription>
                Verification email resent successfully! Please check your inbox
                and click the new verification link.
              </AlertDescription>
            </Alert>
          )}

          {/* Resend Error Message */}
          {resendError && (
            <Alert className="mb-6" variant="destructive">
              <AlertDescription>{resendError}</AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="space-y-4">
            {errorContent.canResend && email && (
              <Button
                onClick={handleResend}
                disabled={isResending}
                className="w-full"
                data-testid="button-resend-verification"
              >
                {isResending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resending...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Resend Verification Email
                  </>
                )}
              </Button>
            )}

            {errorType === "already_verified" && (
              <Button
                onClick={() => navigate("/login")}
                className="w-full"
                data-testid="button-go-to-login"
              >
                Go to Login
              </Button>
            )}

            {/* Support Link */}
            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-2">
                Still having trouble?
              </p>
              <button
                onClick={handleContactSupport}
                className="text-[#1297d2] hover:text-[#1297d2]/80 text-sm font-medium inline-flex items-center gap-1"
                data-testid="link-contact-support"
              >
                <HelpCircle className="h-4 w-4" />
                Contact Support
              </button>
            </div>

            {/* Back to Login */}
            <div className="text-center pt-2">
              <button
                onClick={() => navigate("/login")}
                className="text-gray-600 hover:text-gray-800 text-sm"
                data-testid="link-back-to-login"
              >
                Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

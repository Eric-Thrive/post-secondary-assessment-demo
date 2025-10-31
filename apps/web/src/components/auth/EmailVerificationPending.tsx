import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, Loader2, RefreshCw, HelpCircle, Shield } from "lucide-react";
import { THRIVE_COLORS } from "@/config/modules";

interface EmailVerificationPendingProps {
  email?: string;
  onResendEmail?: () => Promise<void>;
}

/**
 * EmailVerificationPending - Post-registration confirmation screen
 * Requirements: 3.5, 8.3
 */
export const EmailVerificationPending: React.FC<
  EmailVerificationPendingProps
> = ({ email: propEmail, onResendEmail }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState("");

  // Get email from props or location state
  const email = propEmail || (location.state as any)?.email || "";

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
    // This would open a support modal or navigate to support page
    // For now, we'll just navigate to a support route
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
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Mail className="h-8 w-8 text-[#1297d2]" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Check Your Email
            </h2>
            <p className="text-gray-600">
              We've sent a verification link to your email address
            </p>
          </div>

          {/* Email Display */}
          {email && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-center">
              <p className="text-sm text-gray-600 mb-1">
                Verification email sent to:
              </p>
              <p
                className="text-base font-medium text-gray-900"
                data-testid="email-display"
              >
                {email}
              </p>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">Next Steps:</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
              <li>Check your email inbox (and spam folder)</li>
              <li>Click the verification link in the email</li>
              <li>You'll be redirected to complete your registration</li>
            </ol>
          </div>

          {/* Success Message */}
          {resendSuccess && (
            <Alert className="mb-6" variant="default">
              <Mail className="h-4 w-4" />
              <AlertDescription>
                Verification email resent successfully! Please check your inbox.
              </AlertDescription>
            </Alert>
          )}

          {/* Error Message */}
          {resendError && (
            <Alert className="mb-6" variant="destructive">
              <AlertDescription>{resendError}</AlertDescription>
            </Alert>
          )}

          {/* Resend Section */}
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-3">
                Didn't receive the email?
              </p>
              <Button
                onClick={handleResend}
                disabled={isResending}
                variant="outline"
                className="w-full"
                data-testid="button-resend-email"
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
            </div>

            {/* Support Link */}
            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-2">Need help?</p>
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

import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { EmailVerificationSuccess } from "@/components/auth/EmailVerificationSuccess";
import { EmailVerificationError } from "@/components/auth/EmailVerificationError";
import { Loader2, Shield } from "lucide-react";
import { THRIVE_COLORS } from "@/config/modules";

type VerificationState = "loading" | "success" | "error";

interface VerificationResult {
  success: boolean;
  message?: string;
  code?: string;
  error?: string;
  email?: string;
}

/**
 * Email verification page that handles token validation
 * Shows success or error based on verification result
 * Requirements: 4.3, 4.4, 8.1, 8.2
 */
export default function EmailVerificationPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [state, setState] = useState<VerificationState>("loading");
  const [result, setResult] = useState<VerificationResult | null>(null);

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get("token");

      if (!token) {
        setState("error");
        setResult({
          success: false,
          code: "MISSING_TOKEN",
          error: "No verification token provided",
          message: "The verification link is invalid or incomplete.",
        });
        return;
      }

      try {
        const response = await fetch(
          `/api/auth/verify-email?token=${encodeURIComponent(token)}`
        );
        const data = await response.json();

        if (response.ok && data.success) {
          setState("success");
          setResult(data);
        } else {
          setState("error");
          setResult({
            success: false,
            code: data.code || "VERIFICATION_ERROR",
            error: data.error || "Verification failed",
            message: data.message || "An error occurred during verification",
            email: data.email,
          });
        }
      } catch (error) {
        console.error("Email verification error:", error);
        setState("error");
        setResult({
          success: false,
          code: "NETWORK_ERROR",
          error: "Network error",
          message:
            "Failed to verify email. Please check your connection and try again.",
        });
      }
    };

    verifyEmail();
  }, [searchParams]);

  // Loading state
  if (state === "loading") {
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
            <h1 className="text-4xl font-bold mb-4">
              THRIVE Assessment Portal
            </h1>
            <p className="text-lg text-white/80">
              Empowering educational accessibility through AI-powered assessment
              tools.
            </p>
          </div>
        </div>

        {/* Loading Panel - Right Side */}
        <div className="bg-white flex flex-col justify-center p-8 lg:p-12">
          <div className="w-full max-w-md mx-auto text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Loader2 className="h-8 w-8 text-[#1297d2] animate-spin" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Verifying Your Email
            </h2>
            <p className="text-gray-600">
              Please wait while we verify your email address...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (state === "success") {
    return <EmailVerificationSuccess />;
  }

  // Error state
  const errorType =
    result?.code === "EXPIRED_TOKEN"
      ? "expired"
      : result?.code === "INVALID_TOKEN"
      ? "invalid"
      : result?.code === "ALREADY_VERIFIED"
      ? "already_verified"
      : "unknown";

  return (
    <EmailVerificationError
      errorType={errorType}
      errorMessage={result?.message || result?.error || "Verification failed"}
      email={result?.email}
    />
  );
}

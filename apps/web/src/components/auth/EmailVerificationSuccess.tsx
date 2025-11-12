import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle2, LogIn, Shield } from "lucide-react";
import { THRIVE_COLORS } from "@/config/modules";

interface EmailVerificationSuccessProps {
  onGoToLogin?: () => void;
}

/**
 * EmailVerificationSuccess - Successful verification confirmation
 * Requirements: 4.3, 4.4, 10.1, 10.2, 10.3
 * - Displays demo access information (5 reports limit)
 * - Provides upgrade instructions and customer support contact
 */
export const EmailVerificationSuccess: React.FC<
  EmailVerificationSuccessProps
> = ({ onGoToLogin }) => {
  const navigate = useNavigate();

  const handleGoToLogin = () => {
    if (onGoToLogin) {
      onGoToLogin();
    } else {
      navigate("/login");
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

      {/* Content Panel - Right Side */}
      <div className="bg-white flex flex-col justify-center p-8 lg:p-12">
        <div className="w-full max-w-md mx-auto">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Email Verified!
            </h2>
            <p className="text-gray-600">
              Your account has been successfully activated
            </p>
          </div>

          {/* Success Message */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">
              Welcome to THRIVE!
            </h3>
            <p className="text-sm text-gray-700 mb-4">
              Your email has been verified and your account is now active. You
              can now sign in and start using the platform to create assessment
              reports and manage student support plans.
            </p>
            <div className="bg-white rounded-md p-3 border border-green-200">
              <p className="text-xs text-gray-600 mb-1">What's next?</p>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Sign in with your credentials</li>
                <li>• Create your first assessment</li>
              </ul>
            </div>
          </div>

          {/* Demo Access Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
              <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded mr-2">
                DEMO
              </span>
              Your Trial Access
            </h3>
            <p className="text-sm text-gray-700 mb-3">
              You have <strong>demo access to run 5 reports</strong> to explore
              the platform's capabilities. This allows you to:
            </p>
            <div className="bg-white rounded-md p-3 border border-blue-200">
              <p className="text-xs font-semibold text-gray-900 mb-1">
                Ready to upgrade?
              </p>
              <a
                href="mailto:eric@thriveiep.com"
                className="text-xs text-[#1297d2] hover:text-[#1297d2]/80 font-medium inline-block cursor-pointer"
                target="_blank"
                rel="noopener noreferrer"
              >
                Contact Customer Support →
              </a>
            </div>
          </div>

          {/* Action Button */}
          <Button
            onClick={handleGoToLogin}
            className="w-full mb-4"
            size="lg"
            data-testid="button-go-to-login"
          >
            <LogIn className="mr-2 h-5 w-5" />
            Go to Login
          </Button>

          {/* Additional Info */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Need help getting started?{" "}
              <a
                href="#"
                className="text-[#1297d2] hover:text-[#1297d2]/80 font-medium"
              >
                View Documentation
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

import React from "react";
import { Info, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DemoModeBannerProps {
  onContactSales: () => void;
  showPricingLink?: boolean;
  dismissible?: boolean;
  onDismiss?: () => void;
}

/**
 * DemoModeBanner - Displays information about demo mode with sales contact option
 * Requirements: 1.1, 1.2, 1.5
 */
export const DemoModeBanner: React.FC<DemoModeBannerProps> = ({
  onContactSales,
  showPricingLink = false,
  dismissible = false,
  onDismiss,
}) => {
  return (
    <div
      className="relative bg-blue-50 border border-[#1297d2] rounded-lg p-4 mb-6"
      role="banner"
      aria-label="Demo mode information"
    >
      <div className="flex items-start gap-3">
        <Info className="h-5 w-5 text-[#1297d2] flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Demo Mode</h3>
              <p className="text-sm text-gray-700 mb-3">
                This platform is currently in demonstration mode. Contact our
                sales team to inquire about purchasing and full access.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  onClick={onContactSales}
                  className="bg-[#f89e54] hover:bg-[#f89e54]/90 text-white"
                  size="sm"
                  data-testid="contact-sales-button"
                >
                  Contact Sales
                </Button>
                {showPricingLink && (
                  <a
                    href="#pricing"
                    className="text-sm text-[#1297d2] hover:text-[#1297d2]/80 font-medium underline"
                    data-testid="pricing-link"
                  >
                    View Pricing & Features
                  </a>
                )}
              </div>
            </div>
            {dismissible && onDismiss && (
              <button
                onClick={onDismiss}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Dismiss banner"
                data-testid="dismiss-banner-button"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

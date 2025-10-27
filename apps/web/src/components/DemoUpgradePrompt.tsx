import React, { useState, useEffect } from "react";
import { AlertTriangle, Crown, ArrowRight, X } from "lucide-react";

interface DemoUpgradePromptProps {
  show: boolean;
  title: string;
  message: string;
  currentCount: number;
  maxReports: number;
  upgradeUrl?: string;
  onClose?: () => void;
  onUpgrade?: () => void;
}

interface DemoReportStatus {
  isDemoUser: boolean;
  canCreate: boolean;
  currentCount: number;
  maxReports: number;
  isNearLimit: boolean;
  shouldShowUpgradePrompt: boolean;
}

export const DemoUpgradePrompt: React.FC<DemoUpgradePromptProps> = ({
  show,
  title,
  message,
  currentCount,
  maxReports,
  upgradeUrl = "/upgrade",
  onClose,
  onUpgrade,
}) => {
  if (!show) return null;

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      window.location.href = upgradeUrl;
    }
  };

  const reportsRemaining = maxReports - currentCount;
  const isLastReport = reportsRemaining === 1;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        )}

        <div className="flex items-center mb-4">
          <div
            className={`p-2 rounded-full mr-3 ${
              isLastReport ? "bg-red-100" : "bg-yellow-100"
            }`}
          >
            {isLastReport ? (
              <AlertTriangle className="text-red-600" size={24} />
            ) : (
              <Crown className="text-yellow-600" size={24} />
            )}
          </div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>

        <p className="text-gray-600 mb-4 leading-relaxed">{message}</p>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              Demo Progress
            </span>
            <span className="text-sm text-gray-500">
              {currentCount} of {maxReports} reports used
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                currentCount >= maxReports - 1
                  ? "bg-red-500"
                  : currentCount >= maxReports - 2
                  ? "bg-yellow-500"
                  : "bg-blue-500"
              }`}
              style={{ width: `${(currentCount / maxReports) * 100}%` }}
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Continue Demo
            </button>
          )}
          <button
            onClick={handleUpgrade}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-medium"
          >
            <Crown size={18} />
            Upgrade Now
            <ArrowRight size={16} />
          </button>
        </div>

        <div className="mt-4 text-xs text-gray-500 text-center">
          Upgrade to unlock unlimited reports and advanced features
        </div>
      </div>
    </div>
  );
};

export const useDemoReportStatus = () => {
  const [status, setStatus] = useState<DemoReportStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/demo/report-status");
      if (!response.ok) {
        throw new Error("Failed to fetch demo status");
      }
      const data = await response.json();
      setStatus(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setStatus(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return {
    status,
    loading,
    error,
    refetch: fetchStatus,
  };
};

export const useDemoUpgradePrompt = () => {
  const [prompt, setPrompt] = useState<DemoUpgradePromptProps | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrompt = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/demo/upgrade-prompt");
      if (!response.ok) {
        throw new Error("Failed to fetch upgrade prompt");
      }
      const data = await response.json();
      setPrompt(data.show ? data : null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setPrompt(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrompt();
  }, []);

  return {
    prompt,
    loading,
    error,
    refetch: fetchPrompt,
  };
};

// Demo status indicator component
export const DemoStatusIndicator: React.FC = () => {
  const { status, loading } = useDemoReportStatus();

  if (loading || !status?.isDemoUser) return null;

  const { currentCount, maxReports, isNearLimit } = status;
  const reportsRemaining = maxReports - currentCount;

  return (
    <div
      className={`px-3 py-1 rounded-full text-xs font-medium ${
        reportsRemaining === 0
          ? "bg-red-100 text-red-800"
          : isNearLimit
          ? "bg-yellow-100 text-yellow-800"
          : "bg-blue-100 text-blue-800"
      }`}
    >
      Demo: {reportsRemaining} reports remaining
    </div>
  );
};

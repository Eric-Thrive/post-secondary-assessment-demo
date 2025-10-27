import React, { useState, useEffect } from "react";
import {
  Calendar,
  Download,
  AlertTriangle,
  Clock,
  Users,
  FileText,
} from "lucide-react";

interface DemoCleanupInfo {
  isDemoUser: boolean;
  id: number;
  username: string;
  email: string;
  createdAt: string;
  expirationDate: string;
  reportCount: number;
  daysUntilExpiration: number;
  isExpired: boolean;
}

export const DemoCleanupInfo: React.FC = () => {
  const [cleanupInfo, setCleanupInfo] = useState<DemoCleanupInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchCleanupInfo();
  }, []);

  const fetchCleanupInfo = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/demo/cleanup-info");
      if (!response.ok) {
        throw new Error("Failed to fetch cleanup info");
      }
      const data = await response.json();
      setCleanupInfo(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setCleanupInfo(null);
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    try {
      setExporting(true);
      const response = await fetch("/api/demo/export-data");
      if (!response.ok) {
        throw new Error("Failed to export data");
      }

      // Trigger download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `demo-data-export-${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Export failed:", err);
      alert("Failed to export data. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !cleanupInfo?.isDemoUser) {
    return null; // Don't show for non-demo users
  }

  const {
    createdAt,
    expirationDate,
    reportCount,
    daysUntilExpiration,
    isExpired,
  } = cleanupInfo;

  const getStatusColor = () => {
    if (isExpired) return "text-red-600 bg-red-50 border-red-200";
    if (daysUntilExpiration <= 7)
      return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-blue-600 bg-blue-50 border-blue-200";
  };

  const getStatusIcon = () => {
    if (isExpired) return <AlertTriangle className="text-red-600" size={20} />;
    if (daysUntilExpiration <= 7)
      return <Clock className="text-yellow-600" size={20} />;
    return <Calendar className="text-blue-600" size={20} />;
  };

  const getStatusMessage = () => {
    if (isExpired) {
      return "Your demo account has expired. Your data will be deleted soon.";
    }
    if (daysUntilExpiration <= 7) {
      return `Your demo account expires in ${daysUntilExpiration} day${
        daysUntilExpiration === 1 ? "" : "s"
      }. Export your data or upgrade to keep it.`;
    }
    return `Your demo account expires in ${daysUntilExpiration} days.`;
  };

  return (
    <div className={`rounded-lg border-2 p-6 ${getStatusColor()}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {getStatusIcon()}
          <div>
            <h3 className="font-semibold text-lg">Demo Account Status</h3>
            <p className="text-sm opacity-90">{getStatusMessage()}</p>
          </div>
        </div>

        <button
          onClick={handleExportData}
          disabled={exporting}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-current rounded-lg hover:bg-opacity-50 transition-colors disabled:opacity-50"
        >
          <Download size={16} />
          {exporting ? "Exporting..." : "Export Data"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Calendar size={16} className="opacity-70" />
          <div>
            <div className="text-xs opacity-70">Created</div>
            <div className="font-medium">
              {new Date(createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Clock size={16} className="opacity-70" />
          <div>
            <div className="text-xs opacity-70">Expires</div>
            <div className="font-medium">
              {new Date(expirationDate).toLocaleDateString()}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <FileText size={16} className="opacity-70" />
          <div>
            <div className="text-xs opacity-70">Reports Created</div>
            <div className="font-medium">{reportCount}</div>
          </div>
        </div>
      </div>

      {(isExpired || daysUntilExpiration <= 7) && (
        <div className="border-t border-current border-opacity-20 pt-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleExportData}
              disabled={exporting}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-current rounded-lg hover:bg-opacity-50 transition-colors disabled:opacity-50"
            >
              <Download size={16} />
              {exporting ? "Exporting..." : "Export My Data"}
            </button>

            <button
              onClick={() => (window.location.href = "/upgrade")}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-current text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              <Users size={16} />
              Upgrade Account
            </button>
          </div>

          <p className="text-xs opacity-70 mt-3">
            {isExpired
              ? "Your account has expired. Export your data before it's permanently deleted."
              : "Export your data now to save your reports, or upgrade to keep your account active."}
          </p>
        </div>
      )}
    </div>
  );
};

// Hook for fetching demo cleanup info
export const useDemoCleanupInfo = () => {
  const [cleanupInfo, setCleanupInfo] = useState<DemoCleanupInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCleanupInfo = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/demo/cleanup-info");
      if (!response.ok) {
        throw new Error("Failed to fetch cleanup info");
      }
      const data = await response.json();
      setCleanupInfo(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setCleanupInfo(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCleanupInfo();
  }, []);

  return {
    cleanupInfo,
    loading,
    error,
    refetch: fetchCleanupInfo,
  };
};

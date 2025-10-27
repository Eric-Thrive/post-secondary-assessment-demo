import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useModule } from "@/contexts/ModuleContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  Copy,
  Trash2,
  RefreshCw,
  Bug,
  CheckCircle,
  XCircle,
} from "lucide-react";

export function AdminDebugPanel() {
  const { activeModule, isDemoMode, isModuleLocked } = useModule();
  const { user } = useAuth();
  const { toast } = useToast();
  const [debugLogging, setDebugLogging] = useState(
    localStorage.getItem("app-debug-logging") === "true"
  );
  const [localStorageKeys, setLocalStorageKeys] = useState<string[]>([]);

  useEffect(() => {
    // Update localStorage keys list
    const keys = Object.keys(localStorage);
    setLocalStorageKeys(keys);
  }, [debugLogging]);

  const handleToggleDebugLogging = (enabled: boolean) => {
    setDebugLogging(enabled);
    if (enabled) {
      localStorage.setItem("app-debug-logging", "true");
      console.log("🐛 Debug logging enabled");
      toast({
        title: "Debug Logging Enabled",
        description: "Verbose console logs are now visible",
      });
    } else {
      localStorage.removeItem("app-debug-logging");
      toast({
        title: "Debug Logging Disabled",
        description: "Console logs minimized",
      });
    }
  };

  const handleCopyState = () => {
    const state = {
      timestamp: new Date().toISOString(),
      user: {
        id: user?.id,
        username: user?.username,
        role: user?.role,
        customerId: user?.customerId,
      },
      module: {
        active: activeModule,
        isDemoMode,
        isModuleLocked,
      },
      localStorage: Object.fromEntries(
        Object.keys(localStorage).map((key) => [key, localStorage.getItem(key)])
      ),
    };

    navigator.clipboard.writeText(JSON.stringify(state, null, 2));
    toast({
      title: "State Copied",
      description: "Debug state copied to clipboard",
    });
  };

  const handleClearOverride = () => {
    localStorage.removeItem("app-environment-override");
    toast({
      title: "Override Cleared",
      description: "Page will reload to apply changes",
    });
    setTimeout(() => window.location.reload(), 1000);
  };

  const handleClearAllLocalStorage = () => {
    localStorage.clear();
    toast({
      title: "localStorage Cleared",
      description: "Page will reload",
    });
    setTimeout(() => window.location.reload(), 1000);
  };

  const overrideEnabled =
    localStorage.getItem("app-environment-override") === "true";

  return (
    <div className="space-y-6">
      {/* Debug Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5" />
            Debug Controls
          </CardTitle>
          <CardDescription>
            Control debug logging and manage system state
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="debug-logging">Debug Logging</Label>
              <p className="text-sm text-muted-foreground">
                Enable verbose console logging throughout the app
              </p>
            </div>
            <Switch
              id="debug-logging"
              checked={debugLogging}
              onCheckedChange={handleToggleDebugLogging}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyState}
              className="flex items-center gap-2"
            >
              <Copy className="h-4 w-4" />
              Copy State
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Reload Page
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleClearOverride}
              className="flex items-center gap-2"
            >
              <XCircle className="h-4 w-4" />
              Clear Override
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleClearAllLocalStorage}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Clear localStorage
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Current State */}
      <Card>
        <CardHeader>
          <CardTitle>Current State</CardTitle>
          <CardDescription>Real-time application state</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* User Info */}
          <div>
            <h4 className="text-sm font-semibold mb-2">User</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-muted-foreground">Username:</div>
              <div className="font-mono">{user?.username || "N/A"}</div>
              <div className="text-muted-foreground">Role:</div>
              <div>
                <Badge
                  variant={
                    user?.role === "system_admin" ? "default" : "secondary"
                  }
                >
                  {user?.role || "N/A"}
                </Badge>
              </div>
              <div className="text-muted-foreground">Customer ID:</div>
              <div className="font-mono text-xs">
                {user?.customerId || "N/A"}
              </div>
            </div>
          </div>

          {/* System Info */}
          <div>
            <h4 className="text-sm font-semibold mb-2">System</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-muted-foreground">Override Enabled:</div>
              <div className="flex items-center gap-2">
                {overrideEnabled ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <span>{overrideEnabled ? "Yes" : "No"}</span>
              </div>
            </div>
          </div>

          {/* Module Info */}
          <div>
            <h4 className="text-sm font-semibold mb-2">Module</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-muted-foreground">Active:</div>
              <div>
                <Badge variant="outline">{activeModule}</Badge>
              </div>
              <div className="text-muted-foreground">Demo Mode:</div>
              <div className="flex items-center gap-2">
                {isDemoMode ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <span>{isDemoMode ? "Yes" : "No"}</span>
              </div>
              <div className="text-muted-foreground">Module Locked:</div>
              <div className="flex items-center gap-2">
                {isModuleLocked ? (
                  <CheckCircle className="h-4 w-4 text-orange-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-gray-600" />
                )}
                <span>{isModuleLocked ? "Yes" : "No"}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* localStorage Inspector */}
      <Card>
        <CardHeader>
          <CardTitle>localStorage Inspector</CardTitle>
          <CardDescription>
            All keys stored in browser localStorage ({localStorageKeys.length}{" "}
            total)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {localStorageKeys.map((key) => {
              const value = localStorage.getItem(key);
              return (
                <div
                  key={key}
                  className="border rounded p-3 bg-gray-50 dark:bg-gray-900 space-y-1"
                >
                  <div className="font-mono text-sm font-semibold">{key}</div>
                  <div className="font-mono text-xs text-muted-foreground break-all">
                    {value}
                  </div>
                </div>
              );
            })}
            {localStorageKeys.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                No localStorage keys found
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

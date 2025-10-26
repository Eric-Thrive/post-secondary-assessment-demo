import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  Activity,
  Database,
  Zap,
  RefreshCw,
} from "lucide-react";

interface PerformanceHealth {
  endpoints: Array<{
    endpoint: string;
    count: number;
    avgDuration: number;
    p95Duration: number;
    errorRate: number;
  }>;
  slowQueries: Array<{
    endpoint: string;
    avgDuration: number;
    count: number;
  }>;
  alerts: {
    highErrorRate: boolean;
    slowResponses: boolean;
    slowQueries: boolean;
  };
}

interface DatabaseHealth {
  status: "healthy" | "warning" | "critical";
  metrics: {
    connectionPool: {
      total: number;
      idle: number;
      waiting: number;
      utilization: number;
    };
    performance: {
      avgQueryTime: number;
      slowQueries: number;
      activeConnections: number;
    };
    storage: {
      databaseSize: string;
      connectionLimit: number;
    };
  };
  alerts: string[];
}

interface AICosts {
  costs: Array<{
    moduleType: string;
    pathwayType: string;
    totalCost: number;
    totalTokens: number;
    callCount: number;
    avgCostPerCall: number;
  }>;
  thresholds: {
    DAILY_COST_LIMIT: number;
    MONTHLY_COST_LIMIT: number;
    HIGH_COST_PER_CALL: number;
    SLOW_RESPONSE_TIME: number;
  };
}

export default function PerformanceDashboard() {
  const [performanceHealth, setPerformanceHealth] =
    useState<PerformanceHealth | null>(null);
  const [databaseHealth, setDatabaseHealth] = useState<DatabaseHealth | null>(
    null
  );
  const [aiCosts, setAiCosts] = useState<AICosts | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchData = async () => {
    setLoading(true);
    try {
      const [healthRes, dbHealthRes, aiCostsRes] = await Promise.all([
        fetch("/api/performance/health"),
        fetch("/api/performance/database-health"),
        fetch("/api/performance/ai-costs"),
      ]);

      if (healthRes.ok) {
        const healthData = await healthRes.json();
        setPerformanceHealth(healthData.data);
      }

      if (dbHealthRes.ok) {
        const dbHealthData = await dbHealthRes.json();
        setDatabaseHealth(dbHealthData.data);
      }

      if (aiCostsRes.ok) {
        const aiCostsData = await aiCostsRes.json();
        setAiCosts(aiCostsData.data);
      }

      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to fetch performance data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "bg-green-500";
      case "warning":
        return "bg-yellow-500";
      case "critical":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }).format(amount);
  };

  if (loading && !performanceHealth) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading performance data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Performance Dashboard</h1>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-500">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </span>
          <Button onClick={fetchData} disabled={loading} size="sm">
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overall Health Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Health</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  performanceHealth?.alerts.highErrorRate ||
                  performanceHealth?.alerts.slowResponses
                    ? "bg-red-500"
                    : "bg-green-500"
                }`}
              />
              <span className="text-2xl font-bold">
                {performanceHealth?.alerts.highErrorRate ||
                performanceHealth?.alerts.slowResponses
                  ? "Issues"
                  : "Healthy"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Database Health
            </CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div
                className={`w-3 h-3 rounded-full ${getStatusColor(
                  databaseHealth?.status || "unknown"
                )}`}
              />
              <span className="text-2xl font-bold capitalize">
                {databaseHealth?.status || "Unknown"}
              </span>
            </div>
            {databaseHealth?.alerts.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {databaseHealth.alerts.length} alert(s)
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              AI Costs (24h)
            </CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {aiCosts?.costs.length > 0
                ? formatCurrency(
                    aiCosts.costs.reduce((sum, cost) => sum + cost.totalCost, 0)
                  )
                : "$0.00"}
            </div>
            <p className="text-xs text-muted-foreground">
              {aiCosts?.costs.reduce((sum, cost) => sum + cost.callCount, 0) ||
                0}{" "}
              API calls
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="api" className="space-y-4">
        <TabsList>
          <TabsTrigger value="api">API Performance</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="ai">AI Costs</TabsTrigger>
        </TabsList>

        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Endpoint Performance</CardTitle>
            </CardHeader>
            <CardContent>
              {performanceHealth?.endpoints.length > 0 ? (
                <div className="space-y-4">
                  {performanceHealth.endpoints.map((endpoint, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <h3 className="font-medium">{endpoint.endpoint}</h3>
                        <p className="text-sm text-gray-500">
                          {endpoint.count} requests
                        </p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {endpoint.avgDuration}ms avg
                          </p>
                          <p className="text-xs text-gray-500">
                            {endpoint.p95Duration}ms p95
                          </p>
                        </div>
                        <Badge
                          variant={
                            endpoint.errorRate > 5 ? "destructive" : "secondary"
                          }
                        >
                          {endpoint.errorRate.toFixed(1)}% errors
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">
                  No API performance data available
                </p>
              )}
            </CardContent>
          </Card>

          {performanceHealth?.slowQueries.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
                  Slow Queries
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {performanceHealth.slowQueries
                    .slice(0, 5)
                    .map((query, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg"
                      >
                        <span className="font-medium">{query.endpoint}</span>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {query.avgDuration}ms avg
                          </p>
                          <p className="text-xs text-gray-500">
                            {query.count} calls
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="database" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Connection Pool</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Total Connections:</span>
                  <span className="font-medium">
                    {databaseHealth?.metrics.connectionPool.total || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Idle Connections:</span>
                  <span className="font-medium">
                    {databaseHealth?.metrics.connectionPool.idle || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Waiting Clients:</span>
                  <span className="font-medium">
                    {databaseHealth?.metrics.connectionPool.waiting || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Utilization:</span>
                  <Badge
                    variant={
                      (databaseHealth?.metrics.connectionPool.utilization ||
                        0) > 0.8
                        ? "destructive"
                        : (databaseHealth?.metrics.connectionPool.utilization ||
                            0) > 0.6
                        ? "secondary"
                        : "outline"
                    }
                  >
                    {(
                      (databaseHealth?.metrics.connectionPool.utilization ||
                        0) * 100
                    ).toFixed(1)}
                    %
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Avg Query Time:</span>
                  <span className="font-medium">
                    {databaseHealth?.metrics.performance.avgQueryTime || 0}ms
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Slow Queries:</span>
                  <span className="font-medium">
                    {databaseHealth?.metrics.performance.slowQueries || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Active Connections:</span>
                  <span className="font-medium">
                    {databaseHealth?.metrics.performance.activeConnections || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Database Size:</span>
                  <span className="font-medium">
                    {databaseHealth?.metrics.storage.databaseSize || "0 bytes"}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {databaseHealth?.alerts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
                  Database Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {databaseHealth.alerts.map((alert, index) => (
                    <div key={index} className="p-3 bg-yellow-50 rounded-lg">
                      <p className="text-sm">{alert}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="ai" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Processing Costs by Module</CardTitle>
            </CardHeader>
            <CardContent>
              {aiCosts?.costs.length > 0 ? (
                <div className="space-y-4">
                  {aiCosts.costs.map((cost, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <h3 className="font-medium capitalize">
                          {cost.moduleType.replace("_", " ")} -{" "}
                          {cost.pathwayType}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {cost.callCount} API calls
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">
                          {formatCurrency(cost.totalCost)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatCurrency(cost.avgCostPerCall)} avg/call
                        </p>
                        <p className="text-xs text-gray-500">
                          {cost.totalTokens.toLocaleString()} tokens
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">
                  No AI cost data available
                </p>
              )}
            </CardContent>
          </Card>

          {aiCosts?.thresholds && (
            <Card>
              <CardHeader>
                <CardTitle>Cost Thresholds</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span>Daily Limit:</span>
                  <span className="font-medium">
                    {formatCurrency(aiCosts.thresholds.DAILY_COST_LIMIT)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Monthly Limit:</span>
                  <span className="font-medium">
                    {formatCurrency(aiCosts.thresholds.MONTHLY_COST_LIMIT)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>High Cost per Call:</span>
                  <span className="font-medium">
                    {formatCurrency(aiCosts.thresholds.HIGH_COST_PER_CALL)}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, Settings, Clock, Database, Brain, FileText } from 'lucide-react';

interface PathwaySelectorProps {
  onSelectPathway: (pathway: 'simple' | 'complex') => void;
  moduleType: 'k12' | 'post_secondary' | 'tutoring';
}

export const PathwaySelector: React.FC<PathwaySelectorProps> = ({ onSelectPathway, moduleType }) => {
  // Tutoring module only supports simple pathway
  if (moduleType === 'tutoring') {
    React.useEffect(() => {
      onSelectPathway('simple');
    }, [onSelectPathway]);
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Choose Analysis Method</h2>
        <p className="text-muted-foreground">
          Select the analysis approach that best fits your needs
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Simple Pathway */}
        <Card className="relative cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Zap className="h-5 w-5 text-blue-600" />
                <CardTitle>Simple Analysis</CardTitle>
              </div>
              <Badge variant="secondary">Fast</Badge>
            </div>
            <CardDescription>
              Quick, streamlined analysis using advanced AI
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-sm">
                <Clock className="h-4 w-4 text-green-600" />
                <span>Faster processing (2-3 minutes)</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Brain className="h-4 w-4 text-green-600" />
                <span>Direct AI analysis</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <FileText className="h-4 w-4 text-green-600" />
                <span>Comprehensive report generation</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Ideal for standard assessments where speed is important
            </p>
            <Button 
              className="w-full" 
              onClick={() => onSelectPathway('simple')}
            >
              Use Simple Analysis
            </Button>
          </CardContent>
        </Card>

        {/* Complex Pathway */}
        <Card className="relative cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Settings className="h-5 w-5 text-purple-600" />
                <CardTitle>Complex Analysis</CardTitle>
              </div>
              <Badge variant="outline">Comprehensive</Badge>
            </div>
            <CardDescription>
              In-depth analysis with specialized lookup tables
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-sm">
                <Database className="h-4 w-4 text-purple-600" />
                <span>Specialized lookup tables</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Brain className="h-4 w-4 text-purple-600" />
                <span>Advanced function calling</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <FileText className="h-4 w-4 text-purple-600" />
                <span>Detailed evidence mapping</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Best for detailed assessments requiring specialized databases
            </p>
            <Button 
              className="w-full" 
              variant="outline"
              onClick={() => onSelectPathway('complex')}
            >
              Use Complex Analysis
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 text-center">
        <p className="text-sm text-muted-foreground">
          Not sure which to choose? Start with Simple Analysis for faster results.
        </p>
      </div>
    </div>
  );
};
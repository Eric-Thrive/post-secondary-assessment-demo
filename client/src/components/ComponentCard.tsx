
import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Code, Database, Settings } from "lucide-react";
import { ParsedComponent } from '@/hooks/usePromptImport';

interface ComponentCardProps {
  component: ParsedComponent;
  index: number;
}

const ComponentCard: React.FC<ComponentCardProps> = ({ component, index }) => {
  const getComponentIcon = (type: string) => {
    switch (type) {
      case 'system_prompt':
        return <Code className="h-4 w-4 text-purple-500" />;
      case 'prompt_section':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'lookup_table':
        return <Database className="h-4 w-4 text-green-500" />;
      case 'ai_config':
        return <Settings className="h-4 w-4 text-orange-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getComponentBadge = (type: string) => {
    switch (type) {
      case 'system_prompt':
        return <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">System</Badge>;
      case 'prompt_section':
        return <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">Section</Badge>;
      case 'lookup_table':
        return <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">Lookup</Badge>;
      case 'ai_config':
        return <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">Config</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">Unknown</Badge>;
    }
  };

  return (
    <Card key={index} className="p-3">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {getComponentIcon(component.type)}
            <span className="font-medium text-sm">{component.title}</span>
            {getComponentBadge(component.type)}
            <Badge variant="outline" className="text-xs">
              {component.action}
            </Badge>
          </div>
          <p className="text-xs text-gray-600">
            {component.preview}
          </p>
          <p className="text-xs text-gray-500">
            {component.size}
          </p>
        </div>
      </div>
    </Card>
  );
};

export default ComponentCard;

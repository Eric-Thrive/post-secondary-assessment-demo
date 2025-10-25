
import React from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { ParsedComponent } from '@/hooks/usePromptImport';
import ComponentCard from './ComponentCard';

interface ParsedComponentsListProps {
  components: ParsedComponent[];
}

const ParsedComponentsList: React.FC<ParsedComponentsListProps> = ({ components }) => {
  if (components.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium">Detected Components ({components.length})</h3>
      <ScrollArea className="h-64">
        <div className="space-y-2">
          {components.map((component, index) => (
            <ComponentCard
              key={index}
              component={component}
              index={index}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ParsedComponentsList;

import React from 'react';
import { useModule } from '@/contexts/ModuleContext';
import { useAuth } from '@/contexts/AuthContext';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, BookOpen, Users } from 'lucide-react';

interface ModuleSwitcherProps {
  variant?: 'compact' | 'full';
  className?: string;
}

export const ModuleSwitcher: React.FC<ModuleSwitcherProps> = ({
  variant = 'compact',
  className = ''
}) => {
  const { activeModule, setActiveModule, isDemoMode, isModuleLocked } = useModule();
  const { user } = useAuth();
  const isSystemAdmin = user?.role === 'system_admin';
  const overrideEnabled = localStorage.getItem('app-environment-override') === 'true';

  if (variant === 'compact') {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Badge 
          variant={activeModule === 'post_secondary' ? 'default' : 'outline'}
          className="text-xs"
        >
          {activeModule === 'post_secondary' ? 'Post-Secondary' : 
           activeModule === 'k12' ? 'K-12' : 'Tutoring'}
        </Badge>
        {isDemoMode && (
          <Badge variant="secondary" className="text-xs">
            Demo
          </Badge>
        )}
      </div>
    );
  }

  // In demo mode with locked module, hide switcher for non-admins
  // System admins and users with override enabled can always see the switcher
  if (isModuleLocked && !isSystemAdmin && !overrideEnabled) {
    return null;
  }

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <span className="text-sm font-medium text-gray-700">Module:</span>
      <ToggleGroup 
        type="single" 
        value={activeModule} 
        onValueChange={(value) => value && setActiveModule(value as 'post_secondary' | 'k12' | 'tutoring')}
        className="bg-gray-100 rounded-lg p-1"
      >
        <ToggleGroupItem 
          value="post_secondary" 
          className="data-[state=on]:bg-blue-600 data-[state=on]:text-white flex items-center space-x-2 px-3 py-2"
        >
          <GraduationCap className="h-4 w-4" />
          <span>Post-Secondary</span>
        </ToggleGroupItem>
        <ToggleGroupItem 
          value="k12" 
          className="data-[state=on]:bg-green-600 data-[state=on]:text-white flex items-center space-x-2 px-3 py-2"
        >
          <BookOpen className="h-4 w-4" />
          <span>K-12</span>
        </ToggleGroupItem>
        <ToggleGroupItem 
          value="tutoring" 
          className="data-[state=on]:bg-purple-600 data-[state=on]:text-white flex items-center space-x-2 px-3 py-2"
        >
          <Users className="h-4 w-4" />
          <span>Tutoring</span>
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
};

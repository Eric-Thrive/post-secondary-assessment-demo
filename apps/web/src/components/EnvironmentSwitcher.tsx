import { useEffect } from 'react';
import { useEnvironment } from '@/contexts/EnvironmentContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Database, Server, Code, GraduationCap, BookOpen, Users, UserCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const iconMap: Record<string, typeof Database> = {
  'database': Database,
  'production': Server,
  'development': Code,
  'replit-prod': Server,
  'replit-dev': Code,
  'post-secondary-demo': GraduationCap,
  'post-secondary-dev': GraduationCap,
  'k12-demo': BookOpen,
  'k12-dev': BookOpen,
  'tutoring-demo': Users,
  'tutoring-dev': Users,
  'tutoring': UserCheck
};

export function EnvironmentSwitcher() {
  const { currentEnvironment, setEnvironment, isLoading, availableEnvironments, isCustomerMode, unlockCustomerMode, lockCustomerMode } = useEnvironment();
  const { user } = useAuth();
  const isAdmin = user?.role === 'system_admin';

  useEffect(() => {
    if (isAdmin) {
      unlockCustomerMode();
    } else {
      lockCustomerMode();
    }
  }, [isAdmin, unlockCustomerMode, lockCustomerMode]);

  // Hide switcher in customer mode for non-admin users
  if (isCustomerMode && !isAdmin) {
    return null;
  }
  
  const currentEnv = availableEnvironments.find(env => env.id === currentEnvironment);
  const Icon = iconMap[currentEnvironment] || Server; // Fallback to Server icon if not found

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          disabled={isLoading}
          className="gap-2"
        >
          <Icon className="h-4 w-4" />
          <span className="hidden sm:inline">{currentEnv?.name}</span>
          <Badge variant="secondary" className="text-xs">
            {currentEnvironment.includes('demo') ? 'DEMO' :
             currentEnvironment.includes('dev') ? 'DEV' :
             currentEnvironment === 'tutoring' ? 'TUTOR' : 'PROD'}
          </Badge>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Select Environment</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {availableEnvironments.map((env) => {
          const EnvIcon = iconMap[env.id] || Server; // Fallback to Server icon if not found
          return (
            <DropdownMenuItem
              key={env.id}
              onClick={() => setEnvironment(env.id)}
              disabled={env.id === currentEnvironment || isLoading}
              className="cursor-pointer"
            >
              <div className="flex items-start gap-3 w-full">
                <EnvIcon className="h-4 w-4 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <div className="font-medium">{env.name}</div>
                  <div className="text-xs text-muted-foreground">{env.description}</div>
                </div>
                {env.id === currentEnvironment && (
                  <Badge variant="default" className="text-xs shrink-0">Active</Badge>
                )}
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

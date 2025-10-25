import { EnvironmentSwitcher } from '@/components/EnvironmentSwitcher';
import { useAuth } from '@/contexts/AuthContext';

export function AdminEnvironmentControls() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'system_admin';

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-[9999] pointer-events-none">
      <div className="pointer-events-auto">
        <EnvironmentSwitcher />
      </div>
    </div>
  );
}

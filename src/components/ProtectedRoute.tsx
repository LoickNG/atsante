import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLicenseStatus } from '@/hooks/useLicense';
import { UserRole } from '@/types';
import { Loader2, ShieldX, Key } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

const DEMO_EMAIL = 'demo@atsante.td';

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, role, loading, signOut } = useAuth();
  const { isValid, hasLicense, isExpired, isSuspended, isLoading: licenseLoading } = useLicenseStatus();
  const location = useLocation();
  const hasShownToast = useRef(false);

  const isDemo = user?.email === DEMO_EMAIL;
  const isUnauthorized = allowedRoles && role && !allowedRoles.includes(role) && !isDemo;

  useEffect(() => {
    if (isUnauthorized && !hasShownToast.current) {
      hasShownToast.current = true;
      toast.error("Accès refusé", {
        description: "Vous n'avez pas les permissions nécessaires pour accéder à cette page.",
      });
    }
  }, [isUnauthorized]);

  if (loading || licenseLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Super admin bypasses license check
  if (role === 'super_admin') {
    return <>{children}</>;
  }

  // Admin can always access settings to enter license key
  const isSettingsPage = location.pathname === '/parametres';
  
  // Check license validity for non-super_admin users
  if (!isValid && !isSettingsPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md text-center space-y-6">
          <div className="flex justify-center">
            <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center">
              {!hasLicense ? (
                <Key className="h-10 w-10 text-destructive" />
              ) : (
                <ShieldX className="h-10 w-10 text-destructive" />
              )}
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2">
              {!hasLicense ? 'Licence non activée' : isExpired ? 'Licence expirée' : 'Licence suspendue'}
            </h2>
            <p className="text-muted-foreground">
              {!hasLicense
                ? "Aucune licence n'est activée pour cette clinique. Veuillez contacter votre administrateur."
                : isExpired
                ? "Votre licence a expiré. Veuillez contacter votre fournisseur pour la renouveler."
                : "Votre licence a été suspendue. Veuillez contacter votre fournisseur."}
            </p>
          </div>
          <div className="flex flex-col gap-3">
            {role === 'admin' && (
              <Button asChild>
                <Link to="/parametres">Gérer la licence</Link>
              </Button>
            )}
            <Button variant="outline" onClick={() => signOut()}>
              Se déconnecter
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isUnauthorized) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

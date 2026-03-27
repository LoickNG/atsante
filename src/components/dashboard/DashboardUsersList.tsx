import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getRoleLabel } from '@/config/navigation';

export function DashboardUsersList() {
  const { data: users, isLoading } = useQuery({
    queryKey: ['dashboard-users-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, specialty')
        .order('full_name');
      if (error) throw error;

      // Get roles
      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id, role');

      const roleMap = new Map<string, string>();
      roles?.forEach(r => roleMap.set(r.user_id, r.role));

      return (data || []).map(p => ({
        ...p,
        role: roleMap.get(p.user_id) || 'inconnu',
      }));
    },
    refetchInterval: 60000,
  });

  const roleColors: Record<string, string> = {
    admin: 'bg-primary/10 text-primary border-primary/30',
    medecin: 'bg-success/10 text-success border-success/30',
    infirmier: 'bg-info/10 text-info border-info/30',
    accueil: 'bg-warning/10 text-warning border-warning/30',
    pharmacien: 'bg-accent/50 text-accent-foreground',
    laborantin: 'bg-muted text-muted-foreground',
    imagerie: 'bg-muted text-muted-foreground',
    caissier: 'bg-success/10 text-success border-success/30',
    daf: 'bg-primary/10 text-primary border-primary/30',
    demo: 'bg-destructive/10 text-destructive border-destructive/30',
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Utilisateurs de la clinique
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/parametres" className="gap-1">
              Gérer <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : !users || users.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Aucun utilisateur</p>
        ) : (
          <div className="space-y-2">
            {users.map(u => (
              <div key={u.user_id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{u.full_name || 'Sans nom'}</p>
                  {u.specialty && <p className="text-xs text-muted-foreground">{u.specialty}</p>}
                </div>
                <Badge variant="outline" className={roleColors[u.role] || ''}>
                  {getRoleLabel(u.role)}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

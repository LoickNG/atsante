import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ImageIcon, ArrowRight, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const priorityColors: Record<string, string> = {
  urgente: 'bg-destructive/10 text-destructive border-destructive/30',
  normale: 'bg-muted text-muted-foreground',
};

const statusLabels: Record<string, string> = {
  demande: 'Demandé',
  en_cours: 'En cours',
};

export function DashboardPendingImaging() {
  const { data: requests, isLoading } = useQuery({
    queryKey: ['dashboard-pending-imaging'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('imaging_requests')
        .select('*, patients(first_name, last_name)')
        .in('status', ['demande', 'en_cours'])
        .order('requested_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000,
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-primary" />
            Examens en attente
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/imagerie" className="gap-1">
              Voir tout <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : !requests || requests.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Aucun examen en attente</p>
        ) : (
          <div className="space-y-2">
            {requests.map(req => (
              <div key={req.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {(req as any).patients?.first_name} {(req as any).patients?.last_name}
                  </p>
                  <p className="text-xs text-muted-foreground">{req.exam_type} — {req.body_part}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline" className={priorityColors[req.priority] || ''}>
                    {req.priority}
                  </Badge>
                  <Badge variant="outline">{statusLabels[req.status] || req.status}</Badge>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                    <Clock className="h-3 w-3" />
                    {format(new Date(req.requested_at), 'HH:mm', { locale: fr })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

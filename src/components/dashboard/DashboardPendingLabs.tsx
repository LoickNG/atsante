import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { FlaskConical, ArrowRight, Clock, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LabRequestWithPatient } from '@/hooks/useLabRequests';

interface DashboardPendingLabsProps {
  requests: LabRequestWithPatient[];
  isLoading?: boolean;
  className?: string;
}

export function DashboardPendingLabs({ requests, isLoading, className }: DashboardPendingLabsProps) {
  const pendingRequests = requests.filter(r => r.status === 'demande' || r.status === 'en_cours');

  if (isLoading) {
    return (
      <div className={cn('rounded-xl border bg-card', className)}>
        <div className="flex items-center justify-between border-b px-5 py-4">
          <Skeleton className="h-5 w-40" />
        </div>
        <div className="p-5 space-y-3">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('rounded-xl border bg-card', className)}>
      <div className="flex items-center justify-between border-b px-5 py-4">
        <div className="flex items-center gap-2">
          <FlaskConical className="h-5 w-5 text-info" />
          <h3 className="font-semibold">Analyses en attente</h3>
          {pendingRequests.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {pendingRequests.length}
            </Badge>
          )}
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/laboratoire">
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
      <div className="p-5">
        {pendingRequests.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground text-sm">
            Aucune analyse en attente
          </div>
        ) : (
          <div className="space-y-3">
            {pendingRequests.slice(0, 3).map((request) => {
              const patient = request.patients;
              
              return (
                <div
                  key={request.id}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg border',
                    request.priority === 'urgente' && 'border-destructive/30 bg-destructive/5'
                  )}
                >
                  <div className={cn(
                    'h-10 w-10 rounded-lg flex items-center justify-center',
                    request.priority === 'urgente' ? 'bg-destructive/10' : 'bg-info/10'
                  )}>
                    {request.priority === 'urgente' ? (
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                    ) : (
                      <FlaskConical className="h-5 w-5 text-info" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{request.test_type}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {patient ? `${patient.first_name} ${patient.last_name}` : 'Patient inconnu'}
                    </p>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={cn(
                      'text-[10px]',
                      request.status === 'en_cours' 
                        ? 'bg-info/10 text-info border-info/30' 
                        : 'bg-warning/10 text-warning-foreground border-warning/30'
                    )}
                  >
                    {request.status === 'en_cours' ? 'En cours' : 'Nouveau'}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

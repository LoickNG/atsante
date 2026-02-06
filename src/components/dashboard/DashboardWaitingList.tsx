import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { VisitWithPatient } from '@/hooks/useVisits';

interface DashboardWaitingListProps {
  visits: VisitWithPatient[];
  isLoading?: boolean;
  className?: string;
}

const statusLabels: Record<string, string> = {
  en_attente: 'En attente',
  en_cours: 'En cours',
  termine: 'Terminé',
  annule: 'Annulé',
};

const statusStyles: Record<string, string> = {
  en_attente: 'bg-warning/10 text-warning-foreground border-warning/20',
  en_cours: 'bg-info/10 text-info border-info/20',
  termine: 'bg-success/10 text-success border-success/20',
  annule: 'bg-muted text-muted-foreground',
};

const typeLabels: Record<string, string> = {
  consultation: 'Consultation',
  urgence: 'Urgence',
  suivi: 'Suivi',
};

const typeStyles: Record<string, string> = {
  consultation: 'bg-primary/10 text-primary',
  urgence: 'bg-destructive/10 text-destructive animate-pulse-soft',
  suivi: 'bg-secondary text-secondary-foreground',
};

export function DashboardWaitingList({ visits, isLoading, className }: DashboardWaitingListProps) {
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const waitingVisits = visits.filter(v => v.status === 'en_attente' || v.status === 'en_cours');

  if (isLoading) {
    return (
      <div className={cn('rounded-xl border bg-card', className)}>
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <Skeleton className="h-5 w-32 mb-1" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <div className="divide-y">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-32 mb-1" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('rounded-xl border bg-card', className)}>
      <div className="flex items-center justify-between border-b px-5 py-4">
        <div>
          <h3 className="font-semibold">File d'attente</h3>
          <p className="text-sm text-muted-foreground">
            {waitingVisits.length} patient(s) en attente
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link to="/file-attente">
            Voir tout
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Link>
        </Button>
      </div>
      <div className="divide-y">
        {waitingVisits.length === 0 ? (
          <div className="px-5 py-8 text-center text-muted-foreground">
            Aucun patient en attente
          </div>
        ) : (
          waitingVisits.slice(0, 5).map((visit, index) => {
            const patient = visit.patients;
            if (!patient) return null;

            return (
              <div
                key={visit.id}
                className="flex items-center gap-4 px-5 py-3 transition-colors hover:bg-muted/50"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                  {index + 1}
                </div>
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    {patient.first_name[0]}{patient.last_name[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {patient.first_name} {patient.last_name}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{formatTime(visit.date)}</span>
                    <span>•</span>
                    <span>{patient.code}</span>
                  </div>
                </div>
                <Badge variant="outline" className={cn('text-[10px]', typeStyles[visit.type] || '')}>
                  {typeLabels[visit.type] || visit.type}
                </Badge>
                <Badge variant="outline" className={cn('text-[10px]', statusStyles[visit.status] || '')}>
                  {statusLabels[visit.status] || visit.status}
                </Badge>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

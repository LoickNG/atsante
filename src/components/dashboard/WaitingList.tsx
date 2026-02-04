import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, ArrowRight } from 'lucide-react';
import { Visit, Patient } from '@/types';
import { mockPatients } from '@/data/mockData';
import { Link } from 'react-router-dom';

interface WaitingListProps {
  visits: Visit[];
  className?: string;
}

const statusLabels = {
  en_attente: 'En attente',
  en_cours: 'En cours',
  termine: 'Terminé',
  annule: 'Annulé',
};

const statusStyles = {
  en_attente: 'bg-warning/10 text-warning-foreground border-warning/20',
  en_cours: 'bg-info/10 text-info border-info/20',
  termine: 'bg-success/10 text-success border-success/20',
  annule: 'bg-muted text-muted-foreground',
};

const typeLabels = {
  consultation: 'Consultation',
  urgence: 'Urgence',
  suivi: 'Suivi',
};

const typeStyles = {
  consultation: 'bg-primary/10 text-primary',
  urgence: 'bg-destructive/10 text-destructive animate-pulse-soft',
  suivi: 'bg-secondary text-secondary-foreground',
};

export function WaitingList({ visits, className }: WaitingListProps) {
  const getPatient = (patientId: string): Patient | undefined => {
    return mockPatients.find(p => p.id === patientId);
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const waitingVisits = visits.filter(v => v.status === 'en_attente' || v.status === 'en_cours');

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
          waitingVisits.map((visit, index) => {
            const patient = getPatient(visit.patientId);
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
                    {patient.firstName[0]}{patient.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {patient.firstName} {patient.lastName}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{formatTime(visit.date)}</span>
                    <span>•</span>
                    <span>{patient.code}</span>
                  </div>
                </div>
                <Badge variant="outline" className={cn('text-[10px]', typeStyles[visit.type])}>
                  {typeLabels[visit.type]}
                </Badge>
                <Badge variant="outline" className={cn('text-[10px]', statusStyles[visit.status])}>
                  {statusLabels[visit.status]}
                </Badge>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, AlertTriangle, Clock } from 'lucide-react';
import { LabRequest } from '@/types';
import { mockPatients } from '@/data/mockData';
import { Link } from 'react-router-dom';

interface PendingLabsProps {
  requests: LabRequest[];
  className?: string;
}

const statusStyles = {
  demande: 'bg-warning/10 text-warning-foreground',
  en_cours: 'bg-info/10 text-info',
  termine: 'bg-success/10 text-success',
  annule: 'bg-muted text-muted-foreground',
};

export function PendingLabs({ requests, className }: PendingLabsProps) {
  const pendingRequests = requests.filter(r => r.status === 'demande' || r.status === 'en_cours');

  const getPatientName = (patientId: string) => {
    const patient = mockPatients.find(p => p.id === patientId);
    return patient ? `${patient.firstName} ${patient.lastName}` : 'Patient inconnu';
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={cn('rounded-xl border bg-card', className)}>
      <div className="flex items-center justify-between border-b px-5 py-4">
        <div>
          <h3 className="font-semibold">Analyses en attente</h3>
          <p className="text-sm text-muted-foreground">
            {pendingRequests.length} demande(s)
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link to="/laboratoire">
            Voir tout
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Link>
        </Button>
      </div>
      <div className="divide-y">
        {pendingRequests.length === 0 ? (
          <div className="px-5 py-8 text-center text-muted-foreground">
            Aucune analyse en attente
          </div>
        ) : (
          pendingRequests.map((request) => (
            <div
              key={request.id}
              className="flex items-center gap-4 px-5 py-3"
            >
              <div className={cn(
                'flex h-10 w-10 items-center justify-center rounded-lg',
                request.priority === 'urgente' 
                  ? 'bg-destructive/10 text-destructive' 
                  : 'bg-muted text-muted-foreground'
              )}>
                {request.priority === 'urgente' ? (
                  <AlertTriangle className="h-5 w-5" />
                ) : (
                  <Clock className="h-5 w-5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{request.testType}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {getPatientName(request.patientId)}
                </p>
              </div>
              <div className="text-right">
                <Badge className={cn('text-[10px]', statusStyles[request.status])}>
                  {request.status === 'demande' ? 'Nouveau' : 'En cours'}
                </Badge>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {formatTime(request.requestedAt)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

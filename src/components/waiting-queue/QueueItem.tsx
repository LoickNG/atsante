import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Clock, Check, X, Stethoscope, AlertTriangle, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QueueItemProps {
  visit: {
    id: string;
    type: string;
    status: string;
    date: string;
    assigned_doctor_id: string | null;
  };
  patient: {
    id: string;
    code: string;
    first_name: string;
    last_name: string;
  };
  doctorName?: string;
  index: number;
  onCall: (visitId: string) => void;
  onComplete: (visitId: string) => void;
  onCancel: (visitId: string) => void;
}

const statusConfig = {
  en_attente: {
    label: 'En attente',
    className: 'bg-warning/10 text-warning-foreground border-warning/30',
  },
  en_cours: {
    label: 'En consultation',
    className: 'bg-info/10 text-info border-info/30',
  },
  termine: {
    label: 'Terminé',
    className: 'bg-success/10 text-success border-success/30',
  },
  annule: {
    label: 'Annulé',
    className: 'bg-muted text-muted-foreground',
  },
};

const typeConfig = {
  consultation: {
    label: 'Consultation',
    className: 'bg-primary/10 text-primary',
  },
  urgence: {
    label: 'Urgence',
    className: 'bg-destructive/10 text-destructive',
  },
  suivi: {
    label: 'Suivi',
    className: 'bg-secondary text-secondary-foreground',
  },
};

export function QueueItem({ 
  visit, 
  patient, 
  doctorName,
  index, 
  onCall, 
  onComplete, 
  onCancel 
}: QueueItemProps) {
  const isUrgent = visit.type === 'urgence';
  const isWaiting = visit.status === 'en_attente';
  const isInProgress = visit.status === 'en_cours';

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const status = statusConfig[visit.status as keyof typeof statusConfig] || statusConfig.en_attente;
  const type = typeConfig[visit.type as keyof typeof typeConfig] || typeConfig.consultation;

  return (
    <div
      className={cn(
        'flex items-center gap-4 p-4 rounded-xl border bg-card transition-all',
        isUrgent && 'border-destructive/30 bg-destructive/5',
        isInProgress && 'border-info/30 bg-info/5'
      )}
    >
      {/* Queue Number */}
      <div className={cn(
        'flex h-12 w-12 items-center justify-center rounded-xl text-lg font-bold',
        isUrgent ? 'bg-destructive text-destructive-foreground' :
        isInProgress ? 'bg-info text-info-foreground' :
        'bg-muted text-muted-foreground'
      )}>
        {isUrgent ? (
          <AlertTriangle className="h-5 w-5" />
        ) : (
          index + 1
        )}
      </div>

      {/* Patient Info */}
      <Avatar className="h-12 w-12">
        <AvatarFallback className="bg-primary/10 text-primary">
          {patient.first_name[0]}{patient.last_name[0]}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold truncate">
            {patient.first_name} {patient.last_name}
          </p>
          <Badge variant="outline" className={cn('text-[10px]', type.className)}>
            {type.label}
          </Badge>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
          <span className="font-mono">{patient.code}</span>
          <span>•</span>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatTime(visit.date)}
          </div>
          {doctorName && (
            <>
              <span>•</span>
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                Dr. {doctorName}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Status */}
      <Badge 
        variant="outline" 
        className={cn('text-xs', status.className)}
      >
        {status.label}
      </Badge>

      {/* Actions */}
      <div className="flex gap-2">
        {isWaiting && (
          <>
            <Button size="sm" className="gap-1.5" onClick={() => onCall(visit.id)}>
              <Stethoscope className="h-4 w-4" />
              Appeler
            </Button>
            <Button size="sm" variant="outline" onClick={() => onCancel(visit.id)}>
              <X className="h-4 w-4" />
            </Button>
          </>
        )}
        {isInProgress && (
          <Button size="sm" variant="secondary" className="gap-1.5" onClick={() => onComplete(visit.id)}>
            <Check className="h-4 w-4" />
            Terminer
          </Button>
        )}
      </div>
    </div>
  );
}

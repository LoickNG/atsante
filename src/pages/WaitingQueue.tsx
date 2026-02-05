import { AppLayout, PageHeader } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Clock, 
  Check,
  X,
  ArrowRight,
  Stethoscope,
  AlertTriangle,
} from 'lucide-react';
import { mockVisits, mockPatients } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const WaitingQueue = () => {
  const visits = mockVisits;

  const getPatient = (patientId: string) => {
    return mockPatients.find(p => p.id === patientId);
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const waitingCount = visits.filter(v => v.status === 'en_attente').length;
  const inProgressCount = visits.filter(v => v.status === 'en_cours').length;

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

  return (
    <AppLayout>
      <div className="p-6 lg:p-8">
        <PageHeader
          title="File d'attente"
          description={`${waitingCount} en attente • ${inProgressCount} en consultation`}
        />

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                En attente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-warning">{waitingCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                En consultation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-info">{inProgressCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Terminés aujourd'hui
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">
                {visits.filter(v => v.status === 'termine').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Queue List */}
        <div className="space-y-4">
          {visits.map((visit, index) => {
            const patient = getPatient(visit.patientId);
            if (!patient) return null;

            const isUrgent = visit.type === 'urgence';
            const isWaiting = visit.status === 'en_attente';
            const isInProgress = visit.status === 'en_cours';

            return (
              <div
                key={visit.id}
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
                    {patient.firstName[0]}{patient.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold truncate">
                      {patient.firstName} {patient.lastName}
                    </p>
                    <Badge variant="outline" className={cn('text-[10px]', typeConfig[visit.type].className)}>
                      {typeConfig[visit.type].label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                    <span className="font-mono">{patient.code}</span>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTime(visit.date)}
                    </div>
                  </div>
                </div>

                {/* Status */}
                <Badge 
                  variant="outline" 
                  className={cn('text-xs', statusConfig[visit.status].className)}
                >
                  {statusConfig[visit.status].label}
                </Badge>

                {/* Actions */}
                <div className="flex gap-2">
                  {isWaiting && (
                    <>
                      <Button size="sm" className="gap-1.5">
                        <Stethoscope className="h-4 w-4" />
                        Appeler
                      </Button>
                      <Button size="sm" variant="outline">
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  {isInProgress && (
                    <Button size="sm" variant="secondary" className="gap-1.5">
                      <Check className="h-4 w-4" />
                      Terminer
                    </Button>
                  )}
                  {!isWaiting && !isInProgress && (
                    <Button size="sm" variant="ghost">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
};

export default WaitingQueue;

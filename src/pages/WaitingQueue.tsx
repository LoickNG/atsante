import { AppLayout, PageHeader } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Clock, 
  Check,
  X,
  ArrowRight,
  Stethoscope,
  AlertTriangle,
  Loader2,
  UserPlus,
  Thermometer,
  Heart,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useWaitingQueue, useTodayVisits, useUpdateVisit, useCreateVisit } from '@/hooks/useVisits';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState } from 'react';
import { usePatients } from '@/hooks/usePatients';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const WaitingQueue = () => {
  const { user } = useAuth();
  const { data: queueVisits, isLoading: queueLoading } = useWaitingQueue();
  const { data: todayVisits, isLoading: todayLoading } = useTodayVisits();
  const { data: patients } = usePatients();
  const updateVisit = useUpdateVisit();
  const createVisit = useCreateVisit();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [visitType, setVisitType] = useState<'consultation' | 'urgence' | 'suivi'>('consultation');
  const [searchPatient, setSearchPatient] = useState('');
  
  // Vital signs
  const [temperature, setTemperature] = useState('');
  const [bloodPressure, setBloodPressure] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const waitingCount = queueVisits?.filter(v => v.status === 'en_attente').length || 0;
  const inProgressCount = queueVisits?.filter(v => v.status === 'en_cours').length || 0;
  const completedCount = todayVisits?.filter(v => v.status === 'termine').length || 0;

  const statusConfig: Record<string, { label: string; className: string }> = {
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

  const typeConfig: Record<string, { label: string; className: string }> = {
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

  const handleCallPatient = async (visitId: string) => {
    try {
      await updateVisit.mutateAsync({
        id: visitId,
        status: 'en_cours',
        assigned_doctor_id: user?.id,
      });
      toast.success('Patient appelé');
    } catch (error) {
      toast.error('Erreur lors de l\'appel du patient');
    }
  };

  const handleCompleteVisit = async (visitId: string) => {
    try {
      await updateVisit.mutateAsync({
        id: visitId,
        status: 'termine',
      });
      toast.success('Visite terminée');
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleCancelVisit = async (visitId: string) => {
    try {
      await updateVisit.mutateAsync({
        id: visitId,
        status: 'annule',
      });
      toast.info('Visite annulée');
    } catch (error) {
      toast.error('Erreur lors de l\'annulation');
    }
  };

  const handleAddToQueue = async () => {
    if (!selectedPatientId) {
      toast.error('Veuillez sélectionner un patient');
      return;
    }

    try {
      await createVisit.mutateAsync({
        patient_id: selectedPatientId,
        type: visitType,
        status: 'en_attente',
        temperature: temperature ? parseFloat(temperature) : null,
        blood_pressure: bloodPressure || null,
        heart_rate: heartRate ? parseInt(heartRate) : null,
        weight: weight ? parseFloat(weight) : null,
        height: height ? parseFloat(height) : null,
      } as any);
      toast.success('Patient ajouté à la file d\'attente');
      setIsAddDialogOpen(false);
      setSelectedPatientId('');
      setVisitType('consultation');
      setSearchPatient('');
      setTemperature(''); setBloodPressure(''); setHeartRate(''); setWeight(''); setHeight('');
    } catch (error) {
      toast.error('Erreur lors de l\'ajout');
    }
  };

  const filteredPatients = (patients || []).filter(p => {
    const search = searchPatient.toLowerCase();
    return (
      p.first_name.toLowerCase().includes(search) ||
      p.last_name.toLowerCase().includes(search) ||
      p.code.toLowerCase().includes(search)
    );
  }).slice(0, 10);

  if (queueLoading || todayLoading) {
    return (
      <AppLayout>
        <div className="p-6 lg:p-8">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 lg:p-8">
        <PageHeader
          title="File d'attente"
          description={`${waitingCount} en attente • ${inProgressCount} en consultation`}
        >
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <UserPlus className="h-4 w-4" />
                Ajouter un patient
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ajouter à la file d'attente</DialogTitle>
                <DialogDescription>
                  Sélectionnez un patient et le type de visite
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Rechercher un patient</Label>
                  <Input
                    placeholder="Nom, prénom ou code..."
                    value={searchPatient}
                    onChange={(e) => setSearchPatient(e.target.value)}
                  />
                  {searchPatient && filteredPatients.length > 0 && (
                    <div className="border rounded-lg max-h-48 overflow-auto">
                      {filteredPatients.map((patient) => (
                        <button
                          key={patient.id}
                          type="button"
                          onClick={() => {
                            setSelectedPatientId(patient.id);
                            setSearchPatient(`${patient.first_name} ${patient.last_name}`);
                          }}
                          className={cn(
                            'w-full p-3 text-left hover:bg-muted/50 border-b last:border-b-0',
                            selectedPatientId === patient.id && 'bg-primary/10'
                          )}
                        >
                          <p className="font-medium">{patient.first_name} {patient.last_name}</p>
                          <p className="text-xs text-muted-foreground">{patient.code}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Type de visite</Label>
                  <Select value={visitType} onValueChange={(v) => setVisitType(v as typeof visitType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="consultation">Consultation</SelectItem>
                      <SelectItem value="urgence">Urgence</SelectItem>
                      <SelectItem value="suivi">Suivi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleAddToQueue} disabled={createVisit.isPending}>
                  {createVisit.isPending ? 'Ajout...' : 'Ajouter'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </PageHeader>

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
              <div className="text-3xl font-bold text-success">{completedCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Queue List */}
        <div className="space-y-4">
          {queueVisits?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium">Aucun patient dans la file d'attente</p>
              <p className="text-sm">Ajoutez un patient pour commencer</p>
            </div>
          ) : (
            queueVisits?.map((visit, index) => {
              const patient = visit.patients;
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
                      {patient.first_name[0]}{patient.last_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold truncate">
                        {patient.first_name} {patient.last_name}
                      </p>
                      <Badge variant="outline" className={cn('text-[10px]', typeConfig[visit.type]?.className)}>
                        {typeConfig[visit.type]?.label || visit.type}
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
                    className={cn('text-xs', statusConfig[visit.status]?.className)}
                  >
                    {statusConfig[visit.status]?.label || visit.status}
                  </Badge>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {isWaiting && (
                      <>
                        <Button 
                          size="sm" 
                          className="gap-1.5"
                          onClick={() => handleCallPatient(visit.id)}
                          disabled={updateVisit.isPending}
                        >
                          <Stethoscope className="h-4 w-4" />
                          Appeler
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleCancelVisit(visit.id)}
                          disabled={updateVisit.isPending}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {isInProgress && (
                      <Button 
                        size="sm" 
                        variant="secondary" 
                        className="gap-1.5"
                        onClick={() => handleCompleteVisit(visit.id)}
                        disabled={updateVisit.isPending}
                      >
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
            })
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default WaitingQueue;

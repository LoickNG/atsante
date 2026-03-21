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
  QrCode,
} from 'lucide-react';
import { QRScannerDialog } from '@/components/patient/QRScannerDialog';
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
import { useState, useEffect } from 'react';
import { usePatients } from '@/hooks/usePatients';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSpecialties, getSpecialtyLabel } from '@/config/specialties';
import { supabase } from '@/integrations/supabase/client';

const WaitingQueue = () => {
  const { user, role } = useAuth();
  const { data: queueVisits, isLoading: queueLoading } = useWaitingQueue();
  const { data: todayVisits, isLoading: todayLoading } = useTodayVisits();
  const { data: patients } = usePatients();
  const updateVisit = useUpdateVisit();
  const createVisit = useCreateVisit();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [visitType, setVisitType] = useState<'consultation' | 'urgence' | 'suivi'>('consultation');
  const [visitSpecialty, setVisitSpecialty] = useState('generaliste');
  const specialtiesList = useSpecialties();
  const [searchPatient, setSearchPatient] = useState('');
  const [doctorSpecialty, setDoctorSpecialty] = useState<string | null>(null);

  // Fetch current user's specialty if they are a doctor
  useEffect(() => {
    if (user && role === 'medecin') {
      supabase.from('profiles').select('specialty').eq('user_id', user.id).single()
        .then(({ data }) => {
          if (data?.specialty) setDoctorSpecialty(data.specialty as string);
        });
    }
  }, [user, role]);
  
  // Vital signs dialog state
  const [isVitalsDialogOpen, setIsVitalsDialogOpen] = useState(false);
  const [vitalsVisitId, setVitalsVisitId] = useState('');
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
        specialty: visitSpecialty,
      } as any);
      toast.success('Patient ajouté à la file d\'attente');
      setIsAddDialogOpen(false);
      setSelectedPatientId('');
      setVisitType('consultation');
      setVisitSpecialty('generaliste');
      setSearchPatient('');
    } catch (error) {
      toast.error('Erreur lors de l\'ajout');
    }
  };

  const openVitalsDialog = (visitId: string, visit: any) => {
    setVitalsVisitId(visitId);
    setTemperature(visit.temperature ? String(visit.temperature) : '');
    setBloodPressure(visit.blood_pressure || '');
    setHeartRate(visit.heart_rate ? String(visit.heart_rate) : '');
    setWeight(visit.weight ? String(visit.weight) : '');
    setHeight(visit.height ? String(visit.height) : '');
    setIsVitalsDialogOpen(true);
  };

  const handleSaveVitals = async () => {
    try {
      await updateVisit.mutateAsync({
        id: vitalsVisitId,
        temperature: temperature ? parseFloat(temperature) : null,
        blood_pressure: bloodPressure || null,
        heart_rate: heartRate ? parseInt(heartRate) : null,
        weight: weight ? parseFloat(weight) : null,
        height: height ? parseFloat(height) : null,
      } as any);
      toast.success('Signes vitaux enregistrés');
      setIsVitalsDialogOpen(false);
      setVitalsVisitId('');
      setTemperature(''); setBloodPressure(''); setHeartRate(''); setWeight(''); setHeight('');
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement');
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

  const canAddToQueue = role === 'accueil' || role === 'admin' || role === 'infirmier';
  const canManageVitals = role === 'infirmier' || role === 'admin' || role === 'medecin';
  const canCallPatient = role === 'medecin' || role === 'admin';

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
          {canAddToQueue && (
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2" onClick={() => setIsQRScannerOpen(true)}>
                <QrCode className="h-4 w-4" />
                Scanner QR
              </Button>
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
                  <div className="space-y-2">
                    <Label>Spécialité demandée</Label>
                    <Select value={visitSpecialty} onValueChange={setVisitSpecialty}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {specialtiesList.map(s => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
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
            <QRScannerDialog open={isQRScannerOpen} onOpenChange={setIsQRScannerOpen} />
            </div>
          )}
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
          {(() => {
            // Filter visits: doctors see only their specialty
            const visibleVisits = (queueVisits || []).filter(v => {
              if (role === 'medecin' && doctorSpecialty) {
                const visitSpec = (v as any).specialty;
                return !visitSpec || visitSpec === doctorSpecialty;
              }
              return true;
            });
            
            if (visibleVisits.length === 0) return (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium">Aucun patient dans la file d'attente</p>
              <p className="text-sm">{role === 'medecin' && doctorSpecialty ? `Pour la spécialité: ${getSpecialtyLabel(doctorSpecialty)}` : 'Ajoutez un patient pour commencer'}</p>
            </div>
            );
            return visibleVisits.map((visit, index) => {
              const patient = visit.patients;
              if (!patient) return null;

              const isUrgent = visit.type === 'urgence';
              const isWaiting = visit.status === 'en_attente';
              const isInProgress = visit.status === 'en_cours';
              const hasVitals = (visit as any).temperature || (visit as any).heart_rate || (visit as any).blood_pressure || (visit as any).weight;

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
                      {!hasVitals && isWaiting && (
                        <Badge variant="outline" className="text-[10px] bg-warning/10 text-warning-foreground border-warning/30">
                          Signes vitaux manquants
                        </Badge>
                      )}
                      {(visit as any).specialty && (
                        <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20">
                          {getSpecialtyLabel((visit as any).specialty)}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                      <span className="font-mono">{patient.code}</span>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTime(visit.date)}
                      </div>
                    </div>
                    {/* Vital signs badges */}
                    {hasVitals && (
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {(visit as any).temperature && <Badge variant="outline" className="text-[10px] gap-1"><Thermometer className="h-2.5 w-2.5" />{(visit as any).temperature}°C</Badge>}
                        {(visit as any).blood_pressure && <Badge variant="outline" className="text-[10px]">🩸 {(visit as any).blood_pressure}</Badge>}
                        {(visit as any).heart_rate && <Badge variant="outline" className="text-[10px] gap-1"><Heart className="h-2.5 w-2.5" />{(visit as any).heart_rate} bpm</Badge>}
                        {(visit as any).weight && <Badge variant="outline" className="text-[10px]">⚖️ {(visit as any).weight} kg</Badge>}
                        {(visit as any).height && <Badge variant="outline" className="text-[10px]">📏 {(visit as any).height} cm</Badge>}
                      </div>
                    )}
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
                    {/* Nurse: add/edit vital signs */}
                    {isWaiting && canManageVitals && (
                      <Button
                        size="sm"
                        variant={hasVitals ? 'outline' : 'secondary'}
                        className="gap-1.5"
                        onClick={() => openVitalsDialog(visit.id, visit)}
                      >
                        <Activity className="h-4 w-4" />
                        {hasVitals ? 'Modifier' : 'Constantes'}
                      </Button>
                    )}
                    {isWaiting && canCallPatient && (
                      <>
                        <Button 
                          size="sm" 
                          className="gap-1.5"
                          onClick={() => handleCallPatient(visit.id)}
                          disabled={updateVisit.isPending || !hasVitals}
                          title={!hasVitals ? 'Les signes vitaux doivent être pris avant l\'appel' : ''}
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
                    {isInProgress && canCallPatient && (
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
            });
          })()}
        </div>

        {/* Vital Signs Dialog */}
        <Dialog open={isVitalsDialogOpen} onOpenChange={setIsVitalsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Prise des constantes vitales
              </DialogTitle>
              <DialogDescription>
                Saisissez les signes vitaux du patient
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Thermometer className="h-3 w-3" />Température (°C)
                </Label>
                <Input type="number" step="0.1" placeholder="37.0" value={temperature} onChange={e => setTemperature(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Tension artérielle</Label>
                <Input placeholder="12/8" value={bloodPressure} onChange={e => setBloodPressure(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Heart className="h-3 w-3" />Pouls (bpm)
                </Label>
                <Input type="number" placeholder="72" value={heartRate} onChange={e => setHeartRate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Poids (kg)</Label>
                <Input type="number" step="0.1" placeholder="70" value={weight} onChange={e => setWeight(e.target.value)} />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs text-muted-foreground">Taille (cm)</Label>
                <Input type="number" placeholder="170" value={height} onChange={e => setHeight(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsVitalsDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleSaveVitals} disabled={updateVisit.isPending}>
                {updateVisit.isPending ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default WaitingQueue;

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout, PageHeader } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Loader2, AlertTriangle, Plus, Clock, Stethoscope, ArrowRight, Activity,
  Ambulance, Heart, Thermometer, User, CheckCircle2, Receipt,
} from 'lucide-react';
import { PatientSearchSelect } from '@/components/PatientSearchSelect';
import { Patient } from '@/hooks/usePatients';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  useEmergencyVisits,
  useCreateEmergencyVisit,
  useUpdateEmergencyVisit,
  type EmergencyVisit,
} from '@/hooks/useEmergency';

const TRIAGE_CONFIG = {
  critique: { label: 'Critique', color: 'bg-red-600 text-white', ring: 'ring-red-500', icon: '🔴', order: 0 },
  urgent: { label: 'Urgent', color: 'bg-orange-500 text-white', ring: 'ring-orange-400', icon: '🟠', order: 1 },
  modere: { label: 'Modéré', color: 'bg-yellow-500 text-white', ring: 'ring-yellow-400', icon: '🟡', order: 2 },
  mineur: { label: 'Mineur', color: 'bg-green-500 text-white', ring: 'ring-green-400', icon: '🟢', order: 3 },
} as const;

const STATUS_CONFIG = {
  en_attente: { label: 'En attente', className: 'bg-warning/10 text-warning border-warning/30' },
  triage: { label: 'Triage', className: 'bg-info/10 text-info border-info/30' },
  en_cours: { label: 'En cours', className: 'bg-primary/10 text-primary border-primary/30' },
  termine: { label: 'Terminé', className: 'bg-success/10 text-success border-success/30' },
};

const ARRIVAL_MODES = [
  { value: 'autonome', label: 'Autonome' },
  { value: 'ambulance', label: 'Ambulance' },
  { value: 'pompiers', label: 'Pompiers' },
  { value: 'transfert', label: 'Transfert' },
];

const ORIENTATION_OPTIONS = [
  { value: 'sortie', label: 'Sortie à domicile' },
  { value: 'hospitalisation', label: 'Hospitalisation' },
  { value: 'bloc_operatoire', label: 'Bloc opératoire' },
  { value: 'transfert_externe', label: 'Transfert externe' },
  { value: 'deces', label: 'Décès' },
];

function getWaitDuration(arrivedAt: string): string {
  const diff = Date.now() - new Date(arrivedAt).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}min`;
  const hrs = Math.floor(mins / 60);
  const remainMins = mins % 60;
  return `${hrs}h${remainMins > 0 ? String(remainMins).padStart(2, '0') : ''}`;
}

export default function Emergency() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('board');
  const [admitDialogOpen, setAdmitDialogOpen] = useState(false);
  const [triageDialogOpen, setTriageDialogOpen] = useState(false);
  const [careDialogOpen, setCareDialogOpen] = useState(false);
  const [orientDialogOpen, setOrientDialogOpen] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<EmergencyVisit | null>(null);

  // Admit form state
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [complaint, setComplaint] = useState('');
  const [arrivalMode, setArrivalMode] = useState('autonome');
  const [triageLevel, setTriageLevel] = useState('modere');
  const [vitals, setVitals] = useState({ temperature: '', heart_rate: '', blood_pressure: '', spo2: '', respiratory_rate: '', weight: '' });

  // Care form state
  const [diagnosis, setDiagnosis] = useState('');
  const [treatmentNotes, setTreatmentNotes] = useState('');

  // Orientation form state
  const [orientation, setOrientation] = useState('sortie');
  const [orientationNotes, setOrientationNotes] = useState('');

  const { data: allVisits, isLoading } = useEmergencyVisits();
  const createVisit = useCreateEmergencyVisit();
  const updateVisit = useUpdateEmergencyVisit();

  // Active visits (not terminated)
  const activeVisits = useMemo(() =>
    (allVisits || [])
      .filter(v => v.status !== 'termine')
      .sort((a, b) => TRIAGE_CONFIG[a.triage_level]?.order - TRIAGE_CONFIG[b.triage_level]?.order),
    [allVisits]
  );

  const todayVisits = useMemo(() =>
    (allVisits || []).filter(v => new Date(v.arrived_at).toDateString() === new Date().toDateString()),
    [allVisits]
  );

  const stats = useMemo(() => ({
    active: activeVisits.length,
    critique: activeVisits.filter(v => v.triage_level === 'critique').length,
    enAttente: activeVisits.filter(v => v.status === 'en_attente').length,
    todayTotal: todayVisits.length,
    todayTermine: todayVisits.filter(v => v.status === 'termine').length,
  }), [activeVisits, todayVisits]);

  const resetAdmitForm = () => {
    setSelectedPatient(null);
    setComplaint('');
    setArrivalMode('autonome');
    setTriageLevel('modere');
    setVitals({ temperature: '', heart_rate: '', blood_pressure: '', spo2: '', respiratory_rate: '', weight: '' });
  };

  const handleAdmit = async () => {
    if (!selectedPatient || !complaint.trim()) {
      toast({ title: 'Erreur', description: 'Sélectionnez un patient et renseignez le motif', variant: 'destructive' });
      return;
    }
    try {
      await createVisit.mutateAsync({
        patient_id: selectedPatient.id,
        chief_complaint: complaint.trim(),
        arrival_mode: arrivalMode,
        triage_level: triageLevel,
        ...(vitals.temperature ? { temperature: parseFloat(vitals.temperature) } : {}),
        ...(vitals.heart_rate ? { heart_rate: parseInt(vitals.heart_rate) } : {}),
        ...(vitals.blood_pressure ? { blood_pressure: vitals.blood_pressure } : {}),
        ...(vitals.spo2 ? { spo2: parseInt(vitals.spo2) } : {}),
        ...(vitals.respiratory_rate ? { respiratory_rate: parseInt(vitals.respiratory_rate) } : {}),
        ...(vitals.weight ? { weight: parseFloat(vitals.weight) } : {}),
      });
      toast({ title: 'Patient admis aux urgences' });
      setAdmitDialogOpen(false);
      resetAdmitForm();
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' });
    }
  };

  const openTriage = (visit: EmergencyVisit) => {
    setSelectedVisit(visit);
    setTriageLevel(visit.triage_level);
    setVitals({
      temperature: visit.temperature?.toString() || '',
      heart_rate: visit.heart_rate?.toString() || '',
      blood_pressure: visit.blood_pressure || '',
      spo2: visit.spo2?.toString() || '',
      respiratory_rate: visit.respiratory_rate?.toString() || '',
      weight: visit.weight?.toString() || '',
    });
    setTriageDialogOpen(true);
  };

  const handleTriage = async () => {
    if (!selectedVisit) return;
    try {
      await updateVisit.mutateAsync({
        id: selectedVisit.id,
        triage_level: triageLevel,
        status: 'triage',
        triaged_at: new Date().toISOString(),
        ...(vitals.temperature ? { temperature: parseFloat(vitals.temperature) } : {}),
        ...(vitals.heart_rate ? { heart_rate: parseInt(vitals.heart_rate) } : {}),
        ...(vitals.blood_pressure ? { blood_pressure: vitals.blood_pressure } : {}),
        ...(vitals.spo2 ? { spo2: parseInt(vitals.spo2) } : {}),
        ...(vitals.respiratory_rate ? { respiratory_rate: parseInt(vitals.respiratory_rate) } : {}),
      });
      toast({ title: 'Triage enregistré' });
      setTriageDialogOpen(false);
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' });
    }
  };

  const openCare = (visit: EmergencyVisit) => {
    setSelectedVisit(visit);
    setDiagnosis(visit.diagnosis || '');
    setTreatmentNotes(visit.treatment_notes || '');
    setCareDialogOpen(true);
  };

  const handleStartCare = async () => {
    if (!selectedVisit || !user) return;
    try {
      await updateVisit.mutateAsync({
        id: selectedVisit.id,
        status: 'en_cours',
        doctor_id: user.id,
        care_started_at: new Date().toISOString(),
        diagnosis: diagnosis || null,
        treatment_notes: treatmentNotes || null,
      });
      toast({ title: 'Prise en charge démarrée' });
      setCareDialogOpen(false);
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' });
    }
  };

  const handleSaveCare = async () => {
    if (!selectedVisit) return;
    try {
      await updateVisit.mutateAsync({
        id: selectedVisit.id,
        diagnosis: diagnosis || null,
        treatment_notes: treatmentNotes || null,
      });
      toast({ title: 'Notes enregistrées' });
      setCareDialogOpen(false);
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' });
    }
  };

  const openOrientation = (visit: EmergencyVisit) => {
    setSelectedVisit(visit);
    setOrientation(visit.orientation || 'sortie');
    setOrientationNotes(visit.orientation_notes || '');
    setOrientDialogOpen(true);
  };

  const [showInvoicePrompt, setShowInvoicePrompt] = useState(false);
  const [orientedPatientId, setOrientedPatientId] = useState<string | null>(null);

  const handleOrient = async () => {
    if (!selectedVisit) return;
    try {
      await updateVisit.mutateAsync({
        id: selectedVisit.id,
        orientation,
        orientation_notes: orientationNotes || null,
        status: 'termine',
        completed_at: new Date().toISOString(),
      });
      toast({ title: 'Patient orienté', description: ORIENTATION_OPTIONS.find(o => o.value === orientation)?.label });
      setOrientDialogOpen(false);
      // Prompt for invoice generation
      if (orientation !== 'deces') {
        setOrientedPatientId(selectedVisit.patient_id);
        setShowInvoicePrompt(true);
      }
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' });
    }
  };

  const handleGoToInvoice = (patientId: string) => {
    navigate(`/facturation?patient_id=${patientId}`);
  };

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <PageHeader title="Urgences" description="Gestion des admissions et prises en charge en urgence">
          <Button onClick={() => { resetAdmitForm(); setAdmitDialogOpen(true); }} className="gap-2">
            <Plus className="h-4 w-4" />
            Nouvelle admission
          </Button>
        </PageHeader>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Patients actifs</p>
              <p className="text-2xl font-bold">{stats.active}</p>
            </CardContent>
          </Card>
          <Card className={stats.critique > 0 ? 'border-red-500/50' : ''}>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5 text-red-500" /> Critiques
              </p>
              <p className="text-2xl font-bold text-red-600">{stats.critique}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> En attente
              </p>
              <p className="text-2xl font-bold text-warning">{stats.enAttente}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Admissions aujourd'hui</p>
              <p className="text-2xl font-bold">{stats.todayTotal}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-success" /> Terminés aujourd'hui
              </p>
              <p className="text-2xl font-bold text-success">{stats.todayTermine}</p>
            </CardContent>
          </Card>
        </div>

        {/* Main content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="board" className="gap-2">
              <Activity className="h-4 w-4" />
              Tableau de bord
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <Clock className="h-4 w-4" />
              Historique
            </TabsTrigger>
          </TabsList>

          <TabsContent value="board" className="mt-4">
            {isLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
            ) : activeVisits.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Aucun patient aux urgences actuellement
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {activeVisits.map(visit => {
                  const triage = TRIAGE_CONFIG[visit.triage_level] || TRIAGE_CONFIG.modere;
                  const statusConf = STATUS_CONFIG[visit.status] || STATUS_CONFIG.en_attente;
                  return (
                    <Card key={visit.id} className={`ring-2 ${triage.ring} ring-opacity-50`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <Badge className={`${triage.color} text-xs px-2`}>{triage.icon} {triage.label}</Badge>
                            <Badge variant="outline" className={statusConf.className}>{statusConf.label}</Badge>
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {getWaitDuration(visit.arrived_at)}
                          </span>
                        </div>
                        <div className="mt-2">
                          <p className="font-semibold truncate">
                            {visit.patients?.first_name} {visit.patients?.last_name}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono">{visit.patients?.code}</p>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Motif</p>
                          <p className="text-sm font-medium">{visit.chief_complaint}</p>
                        </div>

                        {/* Vitals summary */}
                        <div className="flex flex-wrap gap-2 text-xs">
                          {visit.temperature && (
                            <span className="flex items-center gap-1 bg-muted px-2 py-1 rounded">
                              <Thermometer className="h-3 w-3" /> {visit.temperature}°C
                            </span>
                          )}
                          {visit.heart_rate && (
                            <span className="flex items-center gap-1 bg-muted px-2 py-1 rounded">
                              <Heart className="h-3 w-3" /> {visit.heart_rate} bpm
                            </span>
                          )}
                          {visit.spo2 && (
                            <span className="flex items-center gap-1 bg-muted px-2 py-1 rounded">
                              SpO2: {visit.spo2}%
                            </span>
                          )}
                          {visit.blood_pressure && (
                            <span className="flex items-center gap-1 bg-muted px-2 py-1 rounded">
                              TA: {visit.blood_pressure}
                            </span>
                          )}
                        </div>

                        {visit.diagnosis && (
                          <div>
                            <p className="text-xs text-muted-foreground">Diagnostic</p>
                            <p className="text-sm">{visit.diagnosis}</p>
                          </div>
                        )}

                        <Separator />

                        {/* Actions */}
                        <div className="flex flex-wrap gap-2">
                          {visit.status === 'en_attente' && (
                            <Button size="sm" variant="outline" onClick={() => openTriage(visit)} className="gap-1 flex-1">
                              <Activity className="h-3.5 w-3.5" /> Triage
                            </Button>
                          )}
                          {(visit.status === 'en_attente' || visit.status === 'triage') && (
                            <Button size="sm" onClick={() => openCare(visit)} className="gap-1 flex-1">
                              <Stethoscope className="h-3.5 w-3.5" /> Prendre en charge
                            </Button>
                          )}
                          {visit.status === 'en_cours' && (
                            <>
                              <Button size="sm" variant="outline" onClick={() => openCare(visit)} className="gap-1 flex-1">
                                <Stethoscope className="h-3.5 w-3.5" /> Notes
                              </Button>
                              <Button size="sm" onClick={() => openOrientation(visit)} className="gap-1 flex-1">
                                <ArrowRight className="h-3.5 w-3.5" /> Orienter
                              </Button>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <Card>
              <CardContent className="pt-6">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Patient</TableHead>
                        <TableHead>Motif</TableHead>
                        <TableHead>Triage</TableHead>
                        <TableHead>Arrivée</TableHead>
                        <TableHead>Diagnostic</TableHead>
                        <TableHead>Orientation</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(allVisits || []).filter(v => v.status === 'termine').map(visit => {
                        const triage = TRIAGE_CONFIG[visit.triage_level] || TRIAGE_CONFIG.modere;
                        return (
                          <TableRow key={visit.id}>
                            <TableCell className="font-medium">
                              {visit.patients?.first_name} {visit.patients?.last_name}
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate">{visit.chief_complaint}</TableCell>
                            <TableCell>
                              <Badge className={`${triage.color} text-xs`}>{triage.label}</Badge>
                            </TableCell>
                            <TableCell className="text-sm">
                              {new Date(visit.arrived_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate">{visit.diagnosis || '—'}</TableCell>
                            <TableCell>
                              {visit.orientation
                                ? ORIENTATION_OPTIONS.find(o => o.value === visit.orientation)?.label || visit.orientation
                                : '—'}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-success/10 text-success border-success/30">Terminé</Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1"
                                onClick={() => handleGoToInvoice(visit.patient_id)}
                              >
                                <Receipt className="h-3.5 w-3.5" /> Facturer
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {(allVisits || []).filter(v => v.status === 'termine').length === 0 && (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                            Aucun historique
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Admit Dialog */}
      <Dialog open={admitDialogOpen} onOpenChange={setAdmitDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ambulance className="h-5 w-5 text-red-500" />
              Nouvelle admission urgence
            </DialogTitle>
            <DialogDescription>Enregistrement rapide d'un patient aux urgences</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Patient *</Label>
              <PatientSearchSelect selectedPatient={selectedPatient} onSelect={setSelectedPatient} />
            </div>

            <div>
              <Label>Motif de consultation *</Label>
              <Textarea value={complaint} onChange={e => setComplaint(e.target.value)} placeholder="Décrivez le motif principal..." rows={2} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Mode d'arrivée</Label>
                <Select value={arrivalMode} onValueChange={setArrivalMode}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ARRIVAL_MODES.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Niveau de triage</Label>
                <Select value={triageLevel} onValueChange={setTriageLevel}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TRIAGE_CONFIG).map(([val, conf]) => (
                      <SelectItem key={val} value={val}>{conf.icon} {conf.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />
            <p className="text-sm font-medium text-muted-foreground">Constantes vitales (optionnel)</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Température (°C)</Label>
                <Input type="number" step="0.1" value={vitals.temperature} onChange={e => setVitals(v => ({ ...v, temperature: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs">Fréq. cardiaque</Label>
                <Input type="number" value={vitals.heart_rate} onChange={e => setVitals(v => ({ ...v, heart_rate: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs">Tension art.</Label>
                <Input placeholder="120/80" value={vitals.blood_pressure} onChange={e => setVitals(v => ({ ...v, blood_pressure: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs">SpO2 (%)</Label>
                <Input type="number" value={vitals.spo2} onChange={e => setVitals(v => ({ ...v, spo2: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs">Fréq. respiratoire</Label>
                <Input type="number" value={vitals.respiratory_rate} onChange={e => setVitals(v => ({ ...v, respiratory_rate: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs">Poids (kg)</Label>
                <Input type="number" step="0.1" value={vitals.weight} onChange={e => setVitals(v => ({ ...v, weight: e.target.value }))} />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAdmitDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleAdmit} disabled={createVisit.isPending} className="gap-2">
              {createVisit.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Admettre
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Triage Dialog */}
      <Dialog open={triageDialogOpen} onOpenChange={setTriageDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Triage — {selectedVisit?.patients?.first_name} {selectedVisit?.patients?.last_name}</DialogTitle>
            <DialogDescription>Évaluation et classification du niveau d'urgence</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Niveau de triage</Label>
              <Select value={triageLevel} onValueChange={setTriageLevel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TRIAGE_CONFIG).map(([val, conf]) => (
                    <SelectItem key={val} value={val}>{conf.icon} {conf.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Température</Label>
                <Input type="number" step="0.1" value={vitals.temperature} onChange={e => setVitals(v => ({ ...v, temperature: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs">FC (bpm)</Label>
                <Input type="number" value={vitals.heart_rate} onChange={e => setVitals(v => ({ ...v, heart_rate: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs">TA</Label>
                <Input value={vitals.blood_pressure} onChange={e => setVitals(v => ({ ...v, blood_pressure: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs">SpO2 (%)</Label>
                <Input type="number" value={vitals.spo2} onChange={e => setVitals(v => ({ ...v, spo2: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTriageDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleTriage} disabled={updateVisit.isPending}>
              {updateVisit.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Enregistrer le triage
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Care Dialog */}
      <Dialog open={careDialogOpen} onOpenChange={setCareDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Prise en charge — {selectedVisit?.patients?.first_name} {selectedVisit?.patients?.last_name}</DialogTitle>
            <DialogDescription>Notes de diagnostic et traitement</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Diagnostic</Label>
              <Textarea value={diagnosis} onChange={e => setDiagnosis(e.target.value)} placeholder="Diagnostic..." rows={2} />
            </div>
            <div>
              <Label>Notes de traitement</Label>
              <Textarea value={treatmentNotes} onChange={e => setTreatmentNotes(e.target.value)} placeholder="Traitement administré, observations..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCareDialogOpen(false)}>Annuler</Button>
            {selectedVisit?.status === 'en_cours' ? (
              <Button onClick={handleSaveCare} disabled={updateVisit.isPending}>
                {updateVisit.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Enregistrer
              </Button>
            ) : (
              <Button onClick={handleStartCare} disabled={updateVisit.isPending}>
                {updateVisit.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Démarrer la prise en charge
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Orientation Dialog */}
      <Dialog open={orientDialogOpen} onOpenChange={setOrientDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Orientation — {selectedVisit?.patients?.first_name} {selectedVisit?.patients?.last_name}</DialogTitle>
            <DialogDescription>Décision de sortie ou transfert du patient</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Orientation</Label>
              <Select value={orientation} onValueChange={setOrientation}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ORIENTATION_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notes d'orientation</Label>
              <Textarea value={orientationNotes} onChange={e => setOrientationNotes(e.target.value)} placeholder="Instructions, motif du transfert..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOrientDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleOrient} disabled={updateVisit.isPending}>
              {updateVisit.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Confirmer l'orientation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invoice Prompt Dialog */}
      <Dialog open={showInvoicePrompt} onOpenChange={setShowInvoicePrompt}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              Générer une facture ?
            </DialogTitle>
            <DialogDescription>
              Le patient a été orienté. Souhaitez-vous générer sa facture maintenant ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowInvoicePrompt(false)}>
              Plus tard
            </Button>
            <Button
              onClick={() => {
                setShowInvoicePrompt(false);
                if (orientedPatientId) handleGoToInvoice(orientedPatientId);
              }}
              className="gap-2"
            >
              <Receipt className="h-4 w-4" />
              Générer la facture
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

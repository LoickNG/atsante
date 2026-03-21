import { useState } from 'react';
import { AppLayout, PageHeader } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Baby, Heart, Check, Plus, Loader2, AlertTriangle, BedDouble, Printer, Stethoscope, Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  useMaternityAdmissions, useActiveMaternityAdmissions,
  useCreateMaternityAdmission, useUpdateMaternityAdmission,
  useBirths, useCreateBirth,
  usePrenatalVisits, useCreatePrenatalVisit,
  MaternityAdmission,
} from '@/hooks/useMaternity';
import { useAuth } from '@/hooks/useAuth';
import { PatientSearchSelect } from '@/components/PatientSearchSelect';
import { Patient } from '@/hooks/usePatients';
import { useClinicSettings } from '@/hooks/useClinicSettings';
import { printMultiResultDocument } from '@/utils/printResult';
import { PrenatalCharts } from '@/components/maternity/PrenatalCharts';

const pregnancyTypes = [
  { value: 'simple', label: 'Grossesse simple' },
  { value: 'gemellaire', label: 'Grossesse gémellaire' },
  { value: 'multiple', label: 'Grossesse multiple' },
];

const riskLevels = [
  { value: 'normal', label: 'Normal', color: 'bg-success/10 text-success border-success/30' },
  { value: 'moyen', label: 'Moyen', color: 'bg-warning/10 text-warning border-warning/30' },
  { value: 'eleve', label: 'Élevé', color: 'bg-destructive/10 text-destructive border-destructive/30' },
];

const deliveryTypes = [
  { value: 'voie_basse', label: 'Voie basse' },
  { value: 'cesarienne', label: 'Césarienne' },
  { value: 'instrumentale', label: 'Instrumentale (forceps/ventouse)' },
];

const Maternity = () => {
  const [activeTab, setActiveTab] = useState('active');
  const [isAdmissionDialogOpen, setIsAdmissionDialogOpen] = useState(false);
  const [isBirthDialogOpen, setIsBirthDialogOpen] = useState(false);
  const [selectedAdmission, setSelectedAdmission] = useState<MaternityAdmission | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isPrenatalDialogOpen, setIsPrenatalDialogOpen] = useState(false);
  const [prenatalAdmission, setPrenatalAdmission] = useState<MaternityAdmission | null>(null);
  const [viewPrenatalAdmissionId, setViewPrenatalAdmissionId] = useState<string | null>(null);

  const { user } = useAuth();
  const { data: clinicData } = useClinicSettings();

  const { data: allAdmissions, isLoading } = useMaternityAdmissions();
  const { data: activeAdmissions } = useActiveMaternityAdmissions();
  const { data: allBirths } = useBirths();
  const { data: allPrenatalVisits } = usePrenatalVisits();
  const createAdmission = useCreateMaternityAdmission();
  const updateAdmission = useUpdateMaternityAdmission();
  const createBirth = useCreateBirth();
  const createPrenatalVisit = useCreatePrenatalVisit();

  // Admission form
  const [admForm, setAdmForm] = useState({
    expected_due_date: '',
    gestational_weeks: '',
    gravida: '1',
    para: '0',
    pregnancy_type: 'simple',
    risk_level: 'normal',
    blood_group: '',
    rhesus: '',
    notes: '',
  });

  // Birth form
  const [birthForm, setBirthForm] = useState({
    baby_first_name: '',
    baby_last_name: '',
    baby_gender: 'M',
    birth_date: new Date().toISOString().slice(0, 16),
    birth_weight_grams: '',
    birth_height_cm: '',
    apgar_1min: '',
    apgar_5min: '',
    apgar_10min: '',
    delivery_type: 'voie_basse',
    head_circumference_cm: '',
    complications: '',
    baby_status: 'vivant',
    notes: '',
  });

  // Prenatal form
  const [prenatalForm, setPrenatalForm] = useState({
    visit_date: new Date().toISOString().slice(0, 16),
    gestational_weeks: '',
    weight_kg: '',
    blood_pressure: '',
    uterine_height_cm: '',
    fetal_heart_rate: '',
    presentation: '',
    edema: '',
    urine_protein: '',
    blood_sugar: '',
    hemoglobin: '',
    ultrasound_notes: '',
    ultrasound_date: '',
    lab_notes: '',
    vaccinations: '',
    complications: '',
    recommendations: '',
    next_appointment: '',
    notes: '',
  });

  const discharged = allAdmissions?.filter(a => a.status === 'sortie') || [];

  const formatDateTime = (dateStr: string) =>
    new Date(dateStr).toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

  const handleCreateAdmission = async () => {
    if (!selectedPatient) { toast.error('Sélectionnez une patiente'); return; }
    await createAdmission.mutateAsync({
      patient_id: selectedPatient.id,
      doctor_id: user?.id || '',
      expected_due_date: admForm.expected_due_date || null,
      gestational_weeks: admForm.gestational_weeks ? parseInt(admForm.gestational_weeks) : null,
      gravida: parseInt(admForm.gravida) || 1,
      para: parseInt(admForm.para) || 0,
      pregnancy_type: admForm.pregnancy_type,
      risk_level: admForm.risk_level,
      blood_group: admForm.blood_group || null,
      rhesus: admForm.rhesus || null,
      notes: admForm.notes || null,
    } as any);
    setIsAdmissionDialogOpen(false);
    setSelectedPatient(null);
    setAdmForm({ expected_due_date: '', gestational_weeks: '', gravida: '1', para: '0', pregnancy_type: 'simple', risk_level: 'normal', blood_group: '', rhesus: '', notes: '' });
  };

  const handleOpenBirthDialog = (admission: MaternityAdmission) => {
    setSelectedAdmission(admission);
    setBirthForm(prev => ({ ...prev, baby_last_name: admission.patients?.last_name || '', birth_date: new Date().toISOString().slice(0, 16) }));
    setIsBirthDialogOpen(true);
  };

  const handleCreateBirth = async () => {
    if (!selectedAdmission) return;
    await createBirth.mutateAsync({
      maternity_admission_id: selectedAdmission.id,
      patient_id: selectedAdmission.patient_id,
      baby_first_name: birthForm.baby_first_name || null,
      baby_last_name: birthForm.baby_last_name || null,
      baby_gender: birthForm.baby_gender,
      birth_date: birthForm.birth_date,
      birth_weight_grams: birthForm.birth_weight_grams ? parseInt(birthForm.birth_weight_grams) : null,
      birth_height_cm: birthForm.birth_height_cm ? parseFloat(birthForm.birth_height_cm) : null,
      apgar_1min: birthForm.apgar_1min ? parseInt(birthForm.apgar_1min) : null,
      apgar_5min: birthForm.apgar_5min ? parseInt(birthForm.apgar_5min) : null,
      apgar_10min: birthForm.apgar_10min ? parseInt(birthForm.apgar_10min) : null,
      delivery_type: birthForm.delivery_type,
      head_circumference_cm: birthForm.head_circumference_cm ? parseFloat(birthForm.head_circumference_cm) : null,
      complications: birthForm.complications || null,
      baby_status: birthForm.baby_status,
      notes: birthForm.notes || null,
      delivered_by: user?.id || null,
    } as any);
    setIsBirthDialogOpen(false);
    setSelectedAdmission(null);
  };

  const handleDischarge = async (id: string) => {
    await updateAdmission.mutateAsync({ id, status: 'sortie', discharge_date: new Date().toISOString() } as any);
  };

  const handleOpenPrenatalDialog = (admission: MaternityAdmission) => {
    setPrenatalAdmission(admission);
    setPrenatalForm({
      visit_date: new Date().toISOString().slice(0, 16),
      gestational_weeks: admission.gestational_weeks?.toString() || '',
      weight_kg: '', blood_pressure: '', uterine_height_cm: '', fetal_heart_rate: '',
      presentation: '', edema: '', urine_protein: '', blood_sugar: '', hemoglobin: '',
      ultrasound_notes: '', ultrasound_date: '', lab_notes: '', vaccinations: '',
      complications: '', recommendations: '', next_appointment: '', notes: '',
    });
    setIsPrenatalDialogOpen(true);
  };

  const handleCreatePrenatalVisit = async () => {
    if (!prenatalAdmission) return;
    await createPrenatalVisit.mutateAsync({
      maternity_admission_id: prenatalAdmission.id,
      patient_id: prenatalAdmission.patient_id,
      visit_date: prenatalForm.visit_date,
      gestational_weeks: prenatalForm.gestational_weeks ? parseInt(prenatalForm.gestational_weeks) : null,
      weight_kg: prenatalForm.weight_kg ? parseFloat(prenatalForm.weight_kg) : null,
      blood_pressure: prenatalForm.blood_pressure || null,
      uterine_height_cm: prenatalForm.uterine_height_cm ? parseFloat(prenatalForm.uterine_height_cm) : null,
      fetal_heart_rate: prenatalForm.fetal_heart_rate ? parseInt(prenatalForm.fetal_heart_rate) : null,
      presentation: prenatalForm.presentation || null,
      edema: prenatalForm.edema || null,
      urine_protein: prenatalForm.urine_protein || null,
      blood_sugar: prenatalForm.blood_sugar ? parseFloat(prenatalForm.blood_sugar) : null,
      hemoglobin: prenatalForm.hemoglobin ? parseFloat(prenatalForm.hemoglobin) : null,
      ultrasound_notes: prenatalForm.ultrasound_notes || null,
      ultrasound_date: prenatalForm.ultrasound_date || null,
      lab_notes: prenatalForm.lab_notes || null,
      vaccinations: prenatalForm.vaccinations || null,
      complications: prenatalForm.complications || null,
      recommendations: prenatalForm.recommendations || null,
      next_appointment: prenatalForm.next_appointment || null,
      notes: prenatalForm.notes || null,
      performed_by: user?.id || null,
    } as any);
    setIsPrenatalDialogOpen(false);
    setPrenatalAdmission(null);
  };

  const printBirthCertificate = (birth: any) => {
    const motherName = birth.patients ? `${birth.patients.first_name} ${birth.patients.last_name}` : 'Inconnue';
    printMultiResultDocument({
      clinic: clinicData,
      patientName: motherName,
      patientCode: birth.patients?.code || '',
      documentTitle: 'Certificat de Naissance',
      items: [{
        title: `Bébé ${birth.baby_first_name || ''} ${birth.baby_last_name || ''}`,
        date: formatDateTime(birth.birth_date),
        content: [
          `Sexe: ${birth.baby_gender === 'M' ? 'Masculin' : 'Féminin'}`,
          `Date et heure de naissance: ${formatDateTime(birth.birth_date)}`,
          `Poids: ${birth.birth_weight_grams ? birth.birth_weight_grams + ' g' : 'Non renseigné'}`,
          `Taille: ${birth.birth_height_cm ? birth.birth_height_cm + ' cm' : 'Non renseigné'}`,
          `Périmètre crânien: ${birth.head_circumference_cm ? birth.head_circumference_cm + ' cm' : 'Non renseigné'}`,
          `Score APGAR: 1min: ${birth.apgar_1min ?? '-'} | 5min: ${birth.apgar_5min ?? '-'} | 10min: ${birth.apgar_10min ?? '-'}`,
          `Mode d'accouchement: ${deliveryTypes.find(d => d.value === birth.delivery_type)?.label || birth.delivery_type}`,
          `État du bébé: ${birth.baby_status === 'vivant' ? 'Vivant' : birth.baby_status === 'mort_ne' ? 'Mort-né' : birth.baby_status}`,
          `Mère: ${motherName}`,
          birth.complications ? `\nComplications: ${birth.complications}` : '',
          birth.notes ? `\nNotes: ${birth.notes}` : '',
        ].filter(Boolean).join('\n'),
      }],
    });
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-6 lg:p-8 flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 lg:p-8">
        <PageHeader title="Maternité" description="Gestion des admissions, naissances et suivi maternel">
          <Button className="gap-2" onClick={() => setIsAdmissionDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Nouvelle admission
          </Button>
        </PageHeader>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Patientes hospitalisées</p>
                  <p className="text-2xl font-bold text-primary">{activeAdmissions?.length || 0}</p>
                </div>
                <BedDouble className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Grossesses à risque</p>
                  <p className="text-2xl font-bold text-destructive">
                    {activeAdmissions?.filter(a => a.risk_level === 'eleve').length || 0}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Naissances (total)</p>
                  <p className="text-2xl font-bold text-success">{allBirths?.length || 0}</p>
                </div>
                <Baby className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">CPN enregistrées</p>
                  <p className="text-2xl font-bold text-accent-foreground">{allPrenatalVisits?.length || 0}</p>
                </div>
                <Stethoscope className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="active" className="gap-2">
              <Heart className="h-4 w-4" />
              En cours
              {(activeAdmissions?.length || 0) > 0 && (
                <Badge variant="destructive" className="ml-1 text-[10px]">{activeAdmissions?.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="prenatal" className="gap-2">
              <Stethoscope className="h-4 w-4" />
              Suivi prénatal
            </TabsTrigger>
            <TabsTrigger value="births" className="gap-2">
              <Baby className="h-4 w-4" />
              Naissances
            </TabsTrigger>
            <TabsTrigger value="discharged" className="gap-2">
              <Check className="h-4 w-4" />
              Sorties
            </TabsTrigger>
          </TabsList>

          {/* Active admissions */}
          <TabsContent value="active">
            <Card>
              <CardHeader>
                <CardTitle>Patientes en maternité</CardTitle>
                <CardDescription>Admissions en cours avec suivi obstétrical</CardDescription>
              </CardHeader>
              <CardContent>
                {(activeAdmissions?.length || 0) === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Heart className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p>Aucune patiente en maternité</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeAdmissions?.map(admission => {
                      const patient = admission.patients;
                      const riskCfg = riskLevels.find(r => r.value === admission.risk_level);
                      const admissionBirths = allBirths?.filter(b => b.maternity_admission_id === admission.id) || [];
                      const admPrenatal = allPrenatalVisits?.filter(v => v.maternity_admission_id === admission.id) || [];
                      return (
                        <div key={admission.id} className={cn(
                          'p-4 border rounded-lg bg-card',
                          admission.risk_level === 'eleve' && 'border-destructive/30 bg-destructive/5'
                        )}>
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <div className={cn('h-12 w-12 rounded-lg flex items-center justify-center',
                                admission.risk_level === 'eleve' ? 'bg-destructive/10' : 'bg-primary/10'
                              )}>
                                <Heart className={cn('h-6 w-6', admission.risk_level === 'eleve' ? 'text-destructive' : 'text-primary')} />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold">
                                    {patient ? `${patient.first_name} ${patient.last_name}` : 'Patiente inconnue'}
                                  </p>
                                  <Badge variant="outline" className={cn('text-xs', riskCfg?.color)}>
                                    {riskCfg?.label || admission.risk_level}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {pregnancyTypes.find(p => p.value === admission.pregnancy_type)?.label}
                                  </Badge>
                                </div>
                                <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-muted-foreground">
                                  <span className="font-mono text-xs">{patient?.code}</span>
                                  {admission.gestational_weeks && <span>SA: {admission.gestational_weeks}</span>}
                                  <span>G{admission.gravida}P{admission.para}</span>
                                  {admission.blood_group && <span>Groupe: {admission.blood_group}{admission.rhesus}</span>}
                                </div>
                                <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
                                  <span>Admise le {formatDateTime(admission.admission_date)}</span>
                                  {admission.expected_due_date && <span>• DPA: {formatDate(admission.expected_due_date)}</span>}
                                </div>
                                <div className="flex items-center gap-3 mt-2">
                                  {admissionBirths.length > 0 && (
                                    <div className="flex items-center gap-1">
                                      <Baby className="h-4 w-4 text-success" />
                                      <span className="text-sm text-success font-medium">{admissionBirths.length} naissance(s)</span>
                                    </div>
                                  )}
                                  {admPrenatal.length > 0 && (
                                    <div className="flex items-center gap-1">
                                      <Stethoscope className="h-4 w-4 text-primary" />
                                      <span className="text-sm text-primary font-medium">{admPrenatal.length} CPN</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2 flex-wrap justify-end">
                              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => handleOpenPrenatalDialog(admission)}>
                                <Stethoscope className="h-4 w-4" />
                                CPN
                              </Button>
                              <Button size="sm" className="gap-1.5" onClick={() => handleOpenBirthDialog(admission)}>
                                <Baby className="h-4 w-4" />
                                Naissance
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleDischarge(admission.id)}>
                                Sortie
                              </Button>
                            </div>
                          </div>
                          {admission.notes && (
                            <div className="mt-3 p-2 bg-muted/50 rounded text-sm text-muted-foreground">
                              {admission.notes}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Prenatal tab */}
          <TabsContent value="prenatal">
            <Card>
              <CardHeader>
                <CardTitle>Suivi prénatal (CPN)</CardTitle>
                <CardDescription>Consultations prénatales par admission</CardDescription>
              </CardHeader>
              <CardContent>
                {(activeAdmissions?.length || 0) === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Stethoscope className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p>Aucune admission active pour le suivi prénatal</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeAdmissions?.map(admission => {
                      const patient = admission.patients;
                      const admPrenatal = (allPrenatalVisits || []).filter(v => v.maternity_admission_id === admission.id);
                      const isExpanded = viewPrenatalAdmissionId === admission.id;
                      return (
                        <div key={admission.id} className="border rounded-lg overflow-hidden">
                          <div className="p-4 bg-muted/20 flex items-center justify-between cursor-pointer"
                            onClick={() => setViewPrenatalAdmissionId(isExpanded ? null : admission.id)}>
                            <div className="flex items-center gap-3">
                              <Heart className="h-5 w-5 text-primary" />
                              <div>
                                <p className="font-semibold text-sm">
                                  {patient ? `${patient.first_name} ${patient.last_name}` : 'Patiente'}
                                  <span className="text-muted-foreground font-normal ml-2">
                                    G{admission.gravida}P{admission.para} • SA: {admission.gestational_weeks || '?'}
                                  </span>
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {admPrenatal.length} consultation(s) prénatale(s)
                                  {admPrenatal.length > 0 && ` • Dernière: ${formatDate(admPrenatal[0].visit_date)}`}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="outline" className="gap-1.5"
                                onClick={e => { e.stopPropagation(); handleOpenPrenatalDialog(admission); }}>
                                <Plus className="h-3 w-3" /> Nouvelle CPN
                              </Button>
                              <Eye className={cn('h-4 w-4 transition-transform', isExpanded && 'rotate-180')} />
                            </div>
                          </div>
                          {isExpanded && (
                            <div className="p-4 space-y-3">
                              {admPrenatal.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">Aucune CPN enregistrée</p>
                              ) : (
                                admPrenatal.map((visit, idx) => (
                                  <div key={visit.id} className="p-3 border rounded-lg bg-card">
                                    <div className="flex items-center justify-between mb-2">
                                      <Badge variant="secondary" className="text-xs">
                                        CPN #{admPrenatal.length - idx}
                                      </Badge>
                                      <span className="text-xs text-muted-foreground">{formatDateTime(visit.visit_date)}</span>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                                      {visit.gestational_weeks && <div><span className="text-muted-foreground">SA:</span> {visit.gestational_weeks}</div>}
                                      {visit.weight_kg && <div><span className="text-muted-foreground">Poids:</span> {visit.weight_kg} kg</div>}
                                      {visit.blood_pressure && <div><span className="text-muted-foreground">TA:</span> {visit.blood_pressure}</div>}
                                      {visit.uterine_height_cm && <div><span className="text-muted-foreground">HU:</span> {visit.uterine_height_cm} cm</div>}
                                      {visit.fetal_heart_rate && <div><span className="text-muted-foreground">BCF:</span> {visit.fetal_heart_rate} bpm</div>}
                                      {visit.presentation && <div><span className="text-muted-foreground">Présentation:</span> {visit.presentation}</div>}
                                      {visit.edema && <div><span className="text-muted-foreground">Œdème:</span> {visit.edema}</div>}
                                      {visit.hemoglobin && <div><span className="text-muted-foreground">Hb:</span> {visit.hemoglobin} g/dL</div>}
                                    </div>
                                    {visit.ultrasound_notes && (
                                      <div className="mt-2 p-2 bg-muted/30 rounded text-xs">
                                        <span className="font-medium">Échographie:</span> {visit.ultrasound_notes}
                                      </div>
                                    )}
                                    {visit.lab_notes && (
                                      <div className="mt-1 p-2 bg-muted/30 rounded text-xs">
                                        <span className="font-medium">Analyses:</span> {visit.lab_notes}
                                      </div>
                                    )}
                                    {visit.vaccinations && (
                                      <div className="mt-1 text-xs"><span className="font-medium">Vaccinations:</span> {visit.vaccinations}</div>
                                    )}
                                    {visit.complications && (
                                      <div className="mt-1 p-2 bg-destructive/5 border border-destructive/20 rounded text-xs text-destructive">
                                        <AlertTriangle className="h-3 w-3 inline mr-1" /> {visit.complications}
                                      </div>
                                    )}
                                    {visit.recommendations && (
                                      <div className="mt-1 text-xs"><span className="font-medium">Recommandations:</span> {visit.recommendations}</div>
                                    )}
                                    {visit.next_appointment && (
                                      <div className="mt-1 text-xs text-primary font-medium">
                                        Prochain RDV: {formatDate(visit.next_appointment)}
                                      </div>
                                    )}
                                  </div>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Births */}
          <TabsContent value="births">
            <Card>
              <CardHeader>
                <CardTitle>Registre des naissances</CardTitle>
                <CardDescription>Toutes les naissances enregistrées</CardDescription>
              </CardHeader>
              <CardContent>
                {(allBirths?.length || 0) === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Baby className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p>Aucune naissance enregistrée</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {allBirths?.map(birth => {
                      const mother = birth.patients;
                      return (
                        <div key={birth.id} className="p-4 border rounded-lg bg-success/5 border-success/20">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <div className="h-12 w-12 rounded-lg bg-success/10 flex items-center justify-center text-2xl">
                                {birth.baby_gender === 'M' ? '👶🏽' : '👶🏽'}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold">
                                    {birth.baby_first_name || 'Bébé'} {birth.baby_last_name || ''}
                                  </p>
                                  <Badge variant="outline" className="text-xs">
                                    {birth.baby_gender === 'M' ? '♂ Garçon' : '♀ Fille'}
                                  </Badge>
                                  <Badge className={cn('text-[10px]',
                                    birth.baby_status === 'vivant' ? 'bg-success text-success-foreground' : 'bg-destructive text-destructive-foreground'
                                  )}>
                                    {birth.baby_status === 'vivant' ? 'Vivant' : birth.baby_status === 'mort_ne' ? 'Mort-né' : birth.baby_status}
                                  </Badge>
                                </div>
                                <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-muted-foreground">
                                  <span>Mère: {mother ? `${mother.first_name} ${mother.last_name}` : 'Inconnue'}</span>
                                  <span>•</span>
                                  <span>{formatDateTime(birth.birth_date)}</span>
                                </div>
                                <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
                                  {birth.birth_weight_grams && <span>Poids: {birth.birth_weight_grams}g</span>}
                                  {birth.birth_height_cm && <span>Taille: {birth.birth_height_cm}cm</span>}
                                  {birth.head_circumference_cm && <span>PC: {birth.head_circumference_cm}cm</span>}
                                  <span>APGAR: {birth.apgar_1min ?? '-'}/{birth.apgar_5min ?? '-'}/{birth.apgar_10min ?? '-'}</span>
                                  <span>{deliveryTypes.find(d => d.value === birth.delivery_type)?.label}</span>
                                </div>
                              </div>
                            </div>
                            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => printBirthCertificate(birth)}>
                              <Printer className="h-4 w-4" />
                              Certificat
                            </Button>
                          </div>
                          {birth.complications && (
                            <div className="mt-2 p-2 bg-destructive/5 border border-destructive/20 rounded text-sm text-destructive">
                              <AlertTriangle className="h-3.5 w-3.5 inline mr-1" />
                              {birth.complications}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Discharged */}
          <TabsContent value="discharged">
            <Card>
              <CardHeader>
                <CardTitle>Patientes sorties</CardTitle>
                <CardDescription>Historique des séjours en maternité</CardDescription>
              </CardHeader>
              <CardContent>
                {discharged.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Check className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p>Aucune sortie enregistrée</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {discharged.map(admission => {
                      const patient = admission.patients;
                      const admissionBirths = allBirths?.filter(b => b.maternity_admission_id === admission.id) || [];
                      return (
                        <div key={admission.id} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">
                                {patient ? `${patient.first_name} ${patient.last_name}` : 'Patiente'}
                              </p>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                                <span>Admise: {formatDate(admission.admission_date)}</span>
                                {admission.discharge_date && <span>Sortie: {formatDate(admission.discharge_date)}</span>}
                                <span>G{admission.gravida}P{admission.para}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {admissionBirths.length > 0 && (
                                <Badge className="bg-success text-success-foreground text-xs gap-1">
                                  <Baby className="h-3 w-3" /> {admissionBirths.length}
                                </Badge>
                              )}
                              <Badge variant="secondary">Sortie</Badge>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Admission Dialog */}
        <Dialog open={isAdmissionDialogOpen} onOpenChange={setIsAdmissionDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nouvelle admission en maternité</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Patiente *</Label>
                <PatientSearchSelect selectedPatient={selectedPatient} onSelect={setSelectedPatient} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Date prévue d'accouchement</Label>
                  <Input type="date" value={admForm.expected_due_date} onChange={e => setAdmForm(f => ({ ...f, expected_due_date: e.target.value }))} />
                </div>
                <div>
                  <Label>Semaines d'aménorrhée</Label>
                  <Input type="number" value={admForm.gestational_weeks} onChange={e => setAdmForm(f => ({ ...f, gestational_weeks: e.target.value }))} placeholder="Ex: 38" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Gestité (G)</Label>
                  <Input type="number" min="1" value={admForm.gravida} onChange={e => setAdmForm(f => ({ ...f, gravida: e.target.value }))} />
                </div>
                <div>
                  <Label>Parité (P)</Label>
                  <Input type="number" min="0" value={admForm.para} onChange={e => setAdmForm(f => ({ ...f, para: e.target.value }))} />
                </div>
                <div>
                  <Label>Type de grossesse</Label>
                  <Select value={admForm.pregnancy_type} onValueChange={v => setAdmForm(f => ({ ...f, pregnancy_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {pregnancyTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Niveau de risque</Label>
                  <Select value={admForm.risk_level} onValueChange={v => setAdmForm(f => ({ ...f, risk_level: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {riskLevels.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Groupe sanguin</Label>
                  <Select value={admForm.blood_group} onValueChange={v => setAdmForm(f => ({ ...f, blood_group: v }))}>
                    <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                    <SelectContent>
                      {['A', 'B', 'AB', 'O'].map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Rhésus</Label>
                  <Select value={admForm.rhesus} onValueChange={v => setAdmForm(f => ({ ...f, rhesus: v }))}>
                    <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="+">Positif (+)</SelectItem>
                      <SelectItem value="-">Négatif (-)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea value={admForm.notes} onChange={e => setAdmForm(f => ({ ...f, notes: e.target.value }))} placeholder="Observations, antécédents..." />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAdmissionDialogOpen(false)}>Annuler</Button>
              <Button onClick={handleCreateAdmission} disabled={!selectedPatient || createAdmission.isPending} className="gap-1.5">
                <Heart className="h-4 w-4" />
                Admettre
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Birth Dialog */}
        <Dialog open={isBirthDialogOpen} onOpenChange={setIsBirthDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Baby className="h-5 w-5" />
                Enregistrer une naissance
              </DialogTitle>
            </DialogHeader>
            {selectedAdmission && (
              <div className="p-3 bg-muted/50 rounded-lg text-sm mb-2">
                <p className="font-medium">
                  Mère: {selectedAdmission.patients?.first_name} {selectedAdmission.patients?.last_name}
                </p>
                <p className="text-muted-foreground text-xs">
                  {pregnancyTypes.find(p => p.value === selectedAdmission.pregnancy_type)?.label}
                  {' • '} G{selectedAdmission.gravida}P{selectedAdmission.para}
                </p>
              </div>
            )}
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Prénom du bébé</Label>
                  <Input value={birthForm.baby_first_name} onChange={e => setBirthForm(f => ({ ...f, baby_first_name: e.target.value }))} placeholder="Prénom" />
                </div>
                <div>
                  <Label>Nom du bébé</Label>
                  <Input value={birthForm.baby_last_name} onChange={e => setBirthForm(f => ({ ...f, baby_last_name: e.target.value }))} />
                </div>
                <div>
                  <Label>Sexe *</Label>
                  <Select value={birthForm.baby_gender} onValueChange={v => setBirthForm(f => ({ ...f, baby_gender: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M">♂ Masculin</SelectItem>
                      <SelectItem value="F">♀ Féminin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Date et heure de naissance</Label>
                  <Input type="datetime-local" value={birthForm.birth_date} onChange={e => setBirthForm(f => ({ ...f, birth_date: e.target.value }))} />
                </div>
                <div>
                  <Label>Mode d'accouchement</Label>
                  <Select value={birthForm.delivery_type} onValueChange={v => setBirthForm(f => ({ ...f, delivery_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {deliveryTypes.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Poids (grammes)</Label>
                  <Input type="number" value={birthForm.birth_weight_grams} onChange={e => setBirthForm(f => ({ ...f, birth_weight_grams: e.target.value }))} placeholder="Ex: 3200" />
                </div>
                <div>
                  <Label>Taille (cm)</Label>
                  <Input type="number" step="0.1" value={birthForm.birth_height_cm} onChange={e => setBirthForm(f => ({ ...f, birth_height_cm: e.target.value }))} placeholder="Ex: 50" />
                </div>
                <div>
                  <Label>Périmètre crânien (cm)</Label>
                  <Input type="number" step="0.1" value={birthForm.head_circumference_cm} onChange={e => setBirthForm(f => ({ ...f, head_circumference_cm: e.target.value }))} placeholder="Ex: 34" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>APGAR 1 min</Label>
                  <Input type="number" min="0" max="10" value={birthForm.apgar_1min} onChange={e => setBirthForm(f => ({ ...f, apgar_1min: e.target.value }))} />
                </div>
                <div>
                  <Label>APGAR 5 min</Label>
                  <Input type="number" min="0" max="10" value={birthForm.apgar_5min} onChange={e => setBirthForm(f => ({ ...f, apgar_5min: e.target.value }))} />
                </div>
                <div>
                  <Label>APGAR 10 min</Label>
                  <Input type="number" min="0" max="10" value={birthForm.apgar_10min} onChange={e => setBirthForm(f => ({ ...f, apgar_10min: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>État du bébé</Label>
                  <Select value={birthForm.baby_status} onValueChange={v => setBirthForm(f => ({ ...f, baby_status: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vivant">Vivant</SelectItem>
                      <SelectItem value="mort_ne">Mort-né</SelectItem>
                      <SelectItem value="transfere">Transféré</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Complications</Label>
                  <Input value={birthForm.complications} onChange={e => setBirthForm(f => ({ ...f, complications: e.target.value }))} placeholder="Le cas échéant..." />
                </div>
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea value={birthForm.notes} onChange={e => setBirthForm(f => ({ ...f, notes: e.target.value }))} placeholder="Observations supplémentaires..." />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsBirthDialogOpen(false)}>Annuler</Button>
              <Button onClick={handleCreateBirth} disabled={createBirth.isPending} className="gap-1.5">
                <Baby className="h-4 w-4" />
                Enregistrer la naissance
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Prenatal Visit Dialog */}
        <Dialog open={isPrenatalDialogOpen} onOpenChange={setIsPrenatalDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5" />
                Consultation prénatale (CPN)
              </DialogTitle>
            </DialogHeader>
            {prenatalAdmission && (
              <div className="p-3 bg-muted/50 rounded-lg text-sm mb-2">
                <p className="font-medium">
                  Patiente: {prenatalAdmission.patients?.first_name} {prenatalAdmission.patients?.last_name}
                </p>
                <p className="text-muted-foreground text-xs">
                  G{prenatalAdmission.gravida}P{prenatalAdmission.para} • SA: {prenatalAdmission.gestational_weeks || '?'}
                  {prenatalAdmission.expected_due_date && ` • DPA: ${formatDate(prenatalAdmission.expected_due_date)}`}
                </p>
              </div>
            )}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Date de la consultation</Label>
                  <Input type="datetime-local" value={prenatalForm.visit_date}
                    onChange={e => setPrenatalForm(f => ({ ...f, visit_date: e.target.value }))} />
                </div>
                <div>
                  <Label>Semaines d'aménorrhée</Label>
                  <Input type="number" value={prenatalForm.gestational_weeks}
                    onChange={e => setPrenatalForm(f => ({ ...f, gestational_weeks: e.target.value }))} placeholder="SA" />
                </div>
              </div>

              <h4 className="text-sm font-semibold text-muted-foreground border-b pb-1">Examen clinique</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Poids (kg)</Label>
                  <Input type="number" step="0.1" value={prenatalForm.weight_kg}
                    onChange={e => setPrenatalForm(f => ({ ...f, weight_kg: e.target.value }))} placeholder="Ex: 65" />
                </div>
                <div>
                  <Label>Tension artérielle</Label>
                  <Input value={prenatalForm.blood_pressure}
                    onChange={e => setPrenatalForm(f => ({ ...f, blood_pressure: e.target.value }))} placeholder="Ex: 12/8" />
                </div>
                <div>
                  <Label>Hauteur utérine (cm)</Label>
                  <Input type="number" step="0.5" value={prenatalForm.uterine_height_cm}
                    onChange={e => setPrenatalForm(f => ({ ...f, uterine_height_cm: e.target.value }))} placeholder="Ex: 28" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>BCF (bpm)</Label>
                  <Input type="number" value={prenatalForm.fetal_heart_rate}
                    onChange={e => setPrenatalForm(f => ({ ...f, fetal_heart_rate: e.target.value }))} placeholder="Ex: 140" />
                </div>
                <div>
                  <Label>Présentation</Label>
                  <Select value={prenatalForm.presentation} onValueChange={v => setPrenatalForm(f => ({ ...f, presentation: v }))}>
                    <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cephalique">Céphalique</SelectItem>
                      <SelectItem value="siege">Siège</SelectItem>
                      <SelectItem value="transverse">Transverse</SelectItem>
                      <SelectItem value="indeterminee">Indéterminée</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Œdèmes</Label>
                  <Select value={prenatalForm.edema} onValueChange={v => setPrenatalForm(f => ({ ...f, edema: v }))}>
                    <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="absent">Absent</SelectItem>
                      <SelectItem value="leger">Léger</SelectItem>
                      <SelectItem value="modere">Modéré</SelectItem>
                      <SelectItem value="important">Important</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <h4 className="text-sm font-semibold text-muted-foreground border-b pb-1">Analyses & examens</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Protéinurie</Label>
                  <Select value={prenatalForm.urine_protein} onValueChange={v => setPrenatalForm(f => ({ ...f, urine_protein: v }))}>
                    <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="negatif">Négatif</SelectItem>
                      <SelectItem value="traces">Traces</SelectItem>
                      <SelectItem value="1+">1+</SelectItem>
                      <SelectItem value="2+">2+</SelectItem>
                      <SelectItem value="3+">3+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Glycémie (g/L)</Label>
                  <Input type="number" step="0.01" value={prenatalForm.blood_sugar}
                    onChange={e => setPrenatalForm(f => ({ ...f, blood_sugar: e.target.value }))} placeholder="Ex: 0.9" />
                </div>
                <div>
                  <Label>Hémoglobine (g/dL)</Label>
                  <Input type="number" step="0.1" value={prenatalForm.hemoglobin}
                    onChange={e => setPrenatalForm(f => ({ ...f, hemoglobin: e.target.value }))} placeholder="Ex: 11.5" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Échographie — Notes</Label>
                  <Textarea value={prenatalForm.ultrasound_notes}
                    onChange={e => setPrenatalForm(f => ({ ...f, ultrasound_notes: e.target.value }))} placeholder="Résultats échographiques..." rows={2} />
                </div>
                <div>
                  <Label>Date échographie</Label>
                  <Input type="date" value={prenatalForm.ultrasound_date}
                    onChange={e => setPrenatalForm(f => ({ ...f, ultrasound_date: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label>Autres analyses</Label>
                <Textarea value={prenatalForm.lab_notes}
                  onChange={e => setPrenatalForm(f => ({ ...f, lab_notes: e.target.value }))} placeholder="NFS, sérologies, groupage..." rows={2} />
              </div>

              <h4 className="text-sm font-semibold text-muted-foreground border-b pb-1">Suivi</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Vaccinations</Label>
                  <Input value={prenatalForm.vaccinations}
                    onChange={e => setPrenatalForm(f => ({ ...f, vaccinations: e.target.value }))} placeholder="VAT, etc." />
                </div>
                <div>
                  <Label>Prochain rendez-vous</Label>
                  <Input type="date" value={prenatalForm.next_appointment}
                    onChange={e => setPrenatalForm(f => ({ ...f, next_appointment: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label>Complications</Label>
                <Input value={prenatalForm.complications}
                  onChange={e => setPrenatalForm(f => ({ ...f, complications: e.target.value }))} placeholder="Le cas échéant..." />
              </div>
              <div>
                <Label>Recommandations</Label>
                <Textarea value={prenatalForm.recommendations}
                  onChange={e => setPrenatalForm(f => ({ ...f, recommendations: e.target.value }))} placeholder="Régime, repos, médicaments..." rows={2} />
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea value={prenatalForm.notes}
                  onChange={e => setPrenatalForm(f => ({ ...f, notes: e.target.value }))} placeholder="Observations supplémentaires..." rows={2} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsPrenatalDialogOpen(false)}>Annuler</Button>
              <Button onClick={handleCreatePrenatalVisit} disabled={createPrenatalVisit.isPending} className="gap-1.5">
                <Stethoscope className="h-4 w-4" />
                Enregistrer la CPN
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default Maternity;

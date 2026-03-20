import { useState } from 'react';
import { AppLayout, PageHeader } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Search, Stethoscope, Plus, Clock, Thermometer, Heart, Activity,
  Pill, FlaskConical, ImageIcon, Save, Check, AlertTriangle, Loader2, X, Printer, BedDouble,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { AIDiagnosticAssistant } from '@/components/consultation/AIDiagnosticAssistant';
import { useWaitingQueue, useUpdateVisit, VisitWithPatient } from '@/hooks/useVisits';
import { useMedications } from '@/hooks/useMedications';
import { useCreateConsultation } from '@/hooks/useConsultations';
import { useCreateLabRequest } from '@/hooks/useLabRequests';
import { useCreateImagingRequest } from '@/hooks/useImagingRequests';
import { useCreatePrescription } from '@/hooks/usePrescriptions';
import { useAuth } from '@/hooks/useAuth';
import { useLabActs, useImagingActs } from '@/hooks/useMedicalActs';

interface PrescriptionItem {
  medicationId: string;
  medicationName: string;
  isCustom: boolean;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

const Consultations = () => {
  const { user } = useAuth();
  const { data: queueVisits, isLoading: queueLoading } = useWaitingQueue();
  const { data: medications } = useMedications();
  const { data: labActs } = useLabActs();
  const { data: imagingActs } = useImagingActs();
  const createConsultation = useCreateConsultation();
  const updateVisit = useUpdateVisit();
  const createLabRequest = useCreateLabRequest();
  const createImagingRequest = useCreateImagingRequest();
  const createPrescription = useCreatePrescription();

  const [selectedVisit, setSelectedVisit] = useState<VisitWithPatient | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [symptoms, setSymptoms] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [vitalSigns, setVitalSigns] = useState({
    temperature: '', bloodPressure: '', heartRate: '', weight: '', height: '',
  });
  
  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>([]);
  const [selectedLabTests, setSelectedLabTests] = useState<string[]>([]);
  const [selectedImagingExams, setSelectedImagingExams] = useState<string[]>([]);
  const [imagingBodyPart, setImagingBodyPart] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const selectedPatient = selectedVisit?.patients || null;

  const filteredVisits = (queueVisits || []).filter(({ patients }) => {
    if (!patients) return false;
    const searchLower = searchQuery.toLowerCase();
    return (
      patients.first_name.toLowerCase().includes(searchLower) ||
      patients.last_name.toLowerCase().includes(searchLower) ||
      patients.code.toLowerCase().includes(searchLower)
    );
  });

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  const handleSelectVisit = (visit: VisitWithPatient) => {
    setSelectedVisit(visit);
    setSymptoms(''); setDiagnosis(''); setNotes('');
    setVitalSigns({ temperature: '', bloodPressure: '', heartRate: '', weight: '', height: '' });
    setPrescriptions([]); setSelectedLabTests([]); setSelectedImagingExams([]); setImagingBodyPart('');
  };

  const addPrescription = () => {
    setPrescriptions([...prescriptions, {
      medicationId: '', medicationName: '', isCustom: false,
      dosage: '', frequency: '', duration: '', instructions: '',
    }]);
  };

  const updatePrescription = (index: number, field: string, value: string | boolean) => {
    const updated = [...prescriptions];
    updated[index] = { ...updated[index], [field]: value };
    if (field === 'isCustom' && value === true) {
      updated[index].medicationId = '';
    }
    if (field === 'isCustom' && value === false) {
      updated[index].medicationName = '';
    }
    setPrescriptions(updated);
  };

  const removePrescription = (index: number) => {
    setPrescriptions(prescriptions.filter((_, i) => i !== index));
  };

  const handlePrintPrescription = () => {
    if (!selectedPatient || prescriptions.length === 0) return;
    const html = `
      <html><head><title>Ordonnance</title>
      <style>
        body { font-family: 'Segoe UI', sans-serif; padding: 40px; max-width: 700px; margin: 0 auto; }
        h1 { font-size: 20px; color: #1a365d; border-bottom: 2px solid #1a365d; padding-bottom: 8px; }
        .header { text-align: center; margin-bottom: 30px; }
        .header h2 { margin: 0; font-size: 24px; color: #1a365d; }
        .header p { margin: 2px 0; color: #666; font-size: 12px; }
        .patient-info { background: #f7fafc; padding: 12px 16px; border-radius: 8px; margin-bottom: 20px; }
        .patient-info p { margin: 4px 0; font-size: 14px; }
        .med { padding: 12px 0; border-bottom: 1px dashed #e2e8f0; }
        .med:last-child { border-bottom: none; }
        .med-name { font-weight: 700; font-size: 15px; }
        .med-detail { color: #555; font-size: 13px; margin-top: 4px; }
        .med-instructions { font-style: italic; color: #888; font-size: 12px; margin-top: 2px; }
        .footer { margin-top: 40px; display: flex; justify-content: space-between; }
        .footer div { text-align: center; }
        .footer .line { border-top: 1px solid #333; width: 200px; margin-top: 60px; padding-top: 5px; font-size: 12px; }
        @media print { body { padding: 20px; } }
      </style></head><body>
      <div class="header">
        <h2>TétimianPro</h2>
        <p>Centre Médical</p>
        <p>Ordonnance Médicale</p>
      </div>
      <div class="patient-info">
        <p><strong>Patient :</strong> ${selectedPatient.first_name} ${selectedPatient.last_name}</p>
        <p><strong>Code :</strong> ${selectedPatient.code}</p>
        <p><strong>Date :</strong> ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
      </div>
      <h1>Prescription</h1>
      ${prescriptions.map((p, i) => {
        const medName = p.isCustom ? p.medicationName : (medications || []).find(m => m.id === p.medicationId)?.name || p.medicationName;
        return `<div class="med">
          <div class="med-name">${i + 1}. ${medName || 'Médicament'}</div>
          <div class="med-detail">${p.dosage} — ${p.frequency} — ${p.duration}</div>
          ${p.instructions ? `<div class="med-instructions">"${p.instructions}"</div>` : ''}
        </div>`;
      }).join('')}
      <div class="footer">
        <div><div class="line">Date et cachet</div></div>
        <div><div class="line">Signature du médecin</div></div>
      </div>
      </body></html>`;
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); w.print(); }
  };

  const handleSaveConsultation = async () => {
    if (!symptoms || !diagnosis) {
      toast.error('Veuillez remplir les symptômes et le diagnostic');
      return;
    }
    if (!selectedVisit || !selectedPatient || !user) {
      toast.error('Données manquantes');
      return;
    }

    setIsSaving(true);
    try {
      const consultation = await createConsultation.mutateAsync({
        visit_id: selectedVisit.id,
        patient_id: selectedPatient.id,
        doctor_id: user.id,
        symptoms, diagnosis,
        notes: notes || null,
        temperature: vitalSigns.temperature ? parseFloat(vitalSigns.temperature) : null,
        blood_pressure: vitalSigns.bloodPressure || null,
        heart_rate: vitalSigns.heartRate ? parseInt(vitalSigns.heartRate) : null,
        weight: vitalSigns.weight ? parseFloat(vitalSigns.weight) : null,
        height: vitalSigns.height ? parseFloat(vitalSigns.height) : null,
        status: 'termine',
      });

      for (const p of prescriptions) {
        const medName = p.isCustom ? p.medicationName : (medications || []).find(m => m.id === p.medicationId)?.name || '';
        if (p.medicationId || p.medicationName) {
          await createPrescription.mutateAsync({
            consultation_id: consultation.id,
            medication_id: p.isCustom ? null : (p.medicationId || null),
            medication_name: medName,
            dosage: p.dosage,
            frequency: p.frequency,
            duration: p.duration,
            instructions: p.instructions || null,
          });
        }
      }

      for (const testId of selectedLabTests) {
        const act = (labActs || []).find(a => a.id === testId);
        if (act) {
          await createLabRequest.mutateAsync({
            consultation_id: consultation.id,
            patient_id: selectedPatient.id,
            test_type: act.name,
            priority: 'normale',
          });
        }
      }

      for (const examId of selectedImagingExams) {
        const act = (imagingActs || []).find(a => a.id === examId);
        if (act) {
          await createImagingRequest.mutateAsync({
            consultation_id: consultation.id,
            patient_id: selectedPatient.id,
            exam_type: act.name,
            body_part: imagingBodyPart || 'Non précisé',
            priority: 'normale',
          });
        }
      }

      await updateVisit.mutateAsync({ id: selectedVisit.id, status: 'termine' });

      toast.success(
        <div className="flex flex-col gap-1">
          <span className="font-semibold">Consultation enregistrée</span>
          <span className="text-sm">
            {prescriptions.filter(p => p.medicationId || p.medicationName).length} prescription(s), {selectedLabTests.length} analyse(s), {selectedImagingExams.length} imagerie(s)
          </span>
        </div>
      );
      setSelectedVisit(null);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error("Erreur lors de l'enregistrement de la consultation");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleLabTest = (testId: string) => {
    setSelectedLabTests(prev =>
      prev.includes(testId) ? prev.filter(id => id !== testId) : [...prev, testId]
    );
  };

  const toggleImagingExam = (examId: string) => {
    setSelectedImagingExams(prev =>
      prev.includes(examId) ? prev.filter(id => id !== examId) : [...prev, examId]
    );
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birth = new Date(dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  if (queueLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-2rem)]">
        {/* Left Panel - Patient List */}
        <div className="w-80 border-r bg-card flex flex-col">
          <div className="p-4 border-b">
            <h2 className="font-semibold mb-3">File d'attente</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Rechercher..." className="pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
          </div>
          <div className="flex-1 overflow-auto">
            {filteredVisits.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">Aucun patient en attente</div>
            ) : (
              <div className="divide-y">
                {filteredVisits.map((visit) => {
                  const patient = visit.patients;
                  if (!patient) return null;
                  return (
                    <button
                      key={visit.id}
                      onClick={() => handleSelectVisit(visit)}
                      className={cn(
                        'w-full p-4 text-left hover:bg-muted/50 transition-colors',
                        selectedVisit?.id === visit.id && 'bg-primary/5 border-l-2 border-l-primary'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/10 text-primary text-sm">
                            {patient.first_name[0]}{patient.last_name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{patient.first_name} {patient.last_name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" /><span>{formatTime(visit.date)}</span>
                            <Badge variant="outline" className={cn('text-[10px]', visit.type === 'urgence' && 'bg-destructive/10 text-destructive animate-pulse')}>
                              {visit.type}
                            </Badge>
                          </div>
                        </div>
                        {visit.status === 'en_cours' && (
                          <Badge className="bg-info text-info-foreground text-[10px]">En cours</Badge>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Consultation Form */}
        <div className="flex-1 overflow-auto">
          {!selectedPatient ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Stethoscope className="h-16 w-16 mb-4 opacity-20" />
              <p className="text-lg">Sélectionnez un patient pour commencer</p>
              <p className="text-sm">Choisissez un patient dans la file d'attente</p>
            </div>
          ) : (
            <div className="p-6">
              {/* Patient Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-14 w-14">
                    <AvatarFallback className="bg-primary/10 text-primary text-lg">
                      {selectedPatient.first_name[0]}{selectedPatient.last_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-xl font-bold">{selectedPatient.first_name} {selectedPatient.last_name}</h2>
                    <p className="text-muted-foreground">
                      {calculateAge(selectedPatient.date_of_birth)} ans • {selectedPatient.code}
                      {selectedPatient.blood_type && ` • ${selectedPatient.blood_type}`}
                    </p>
                    {selectedPatient.allergies && selectedPatient.allergies.length > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <AlertTriangle className="h-3 w-3 text-destructive" />
                        <span className="text-xs text-destructive">Allergies: {selectedPatient.allergies.join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>
                <Button onClick={handleSaveConsultation} className="gap-2" disabled={isSaving}>
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {isSaving ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
              </div>

              <Tabs defaultValue="consultation" className="space-y-4">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="consultation" className="gap-2"><Stethoscope className="h-4 w-4" />Consultation</TabsTrigger>
                  <TabsTrigger value="prescriptions" className="gap-2">
                    <Pill className="h-4 w-4" />Ordonnance
                    {prescriptions.length > 0 && <Badge variant="secondary" className="ml-1 text-[10px]">{prescriptions.length}</Badge>}
                  </TabsTrigger>
                  <TabsTrigger value="lab" className="gap-2">
                    <FlaskConical className="h-4 w-4" />Analyses
                    {selectedLabTests.length > 0 && <Badge variant="secondary" className="ml-1 text-[10px]">{selectedLabTests.length}</Badge>}
                  </TabsTrigger>
                  <TabsTrigger value="imaging" className="gap-2">
                    <ImageIcon className="h-4 w-4" />Imagerie
                    {selectedImagingExams.length > 0 && <Badge variant="secondary" className="ml-1 text-[10px]">{selectedImagingExams.length}</Badge>}
                  </TabsTrigger>
                </TabsList>

                {/* Consultation Tab */}
                <TabsContent value="consultation" className="space-y-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2"><Activity className="h-4 w-4 text-primary" />Signes vitaux</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 sm:grid-cols-5">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-1.5 text-xs"><Thermometer className="h-3 w-3" />Température (°C)</Label>
                        <Input type="number" step="0.1" placeholder="37.0" value={vitalSigns.temperature} onChange={(e) => setVitalSigns({ ...vitalSigns, temperature: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-1.5 text-xs"><Heart className="h-3 w-3" />Tension (mmHg)</Label>
                        <Input placeholder="120/80" value={vitalSigns.bloodPressure} onChange={(e) => setVitalSigns({ ...vitalSigns, bloodPressure: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Pouls (bpm)</Label>
                        <Input type="number" placeholder="80" value={vitalSigns.heartRate} onChange={(e) => setVitalSigns({ ...vitalSigns, heartRate: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Poids (kg)</Label>
                        <Input type="number" step="0.1" placeholder="70" value={vitalSigns.weight} onChange={(e) => setVitalSigns({ ...vitalSigns, weight: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Taille (cm)</Label>
                        <Input type="number" placeholder="170" value={vitalSigns.height} onChange={(e) => setVitalSigns({ ...vitalSigns, height: e.target.value })} />
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardHeader className="pb-3"><CardTitle className="text-base">Motif & Symptômes</CardTitle></CardHeader>
                      <CardContent className="space-y-3">
                        <Textarea placeholder="Décrivez les symptômes du patient..." className="min-h-[150px]" value={symptoms} onChange={(e) => setSymptoms(e.target.value)} />
                        <AIDiagnosticAssistant
                          symptoms={symptoms}
                          vitalSigns={vitalSigns}
                          patientInfo={{
                            age: calculateAge(selectedPatient.date_of_birth),
                            gender: selectedPatient.gender,
                            bloodType: selectedPatient.blood_type || undefined,
                            allergies: selectedPatient.allergies || undefined,
                          }}
                        />
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-3"><CardTitle className="text-base">Diagnostic</CardTitle></CardHeader>
                      <CardContent>
                        <Textarea placeholder="Diagnostic établi..." className="min-h-[150px]" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} />
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader className="pb-3"><CardTitle className="text-base">Notes additionnelles</CardTitle></CardHeader>
                    <CardContent>
                      <Textarea placeholder="Observations, recommandations..." value={notes} onChange={(e) => setNotes(e.target.value)} />
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Prescriptions Tab */}
                <TabsContent value="prescriptions" className="space-y-4">
                  <Card>
                    <CardHeader className="pb-3 flex-row items-center justify-between">
                      <CardTitle className="text-base">Ordonnance médicale</CardTitle>
                      <div className="flex gap-2">
                        {prescriptions.length > 0 && (
                          <Button size="sm" variant="outline" onClick={handlePrintPrescription} className="gap-1.5">
                            <Printer className="h-4 w-4" />Imprimer
                          </Button>
                        )}
                        <Button size="sm" onClick={addPrescription} className="gap-1.5">
                          <Plus className="h-4 w-4" />Ajouter
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {prescriptions.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Pill className="h-12 w-12 mx-auto mb-2 opacity-20" />
                          <p>Aucune prescription</p>
                          <p className="text-sm">Cliquez sur "Ajouter" pour prescrire un médicament</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {prescriptions.map((prescription, index) => (
                            <div key={index} className="p-4 border rounded-lg bg-muted/30">
                              <div className="flex items-center gap-2 mb-3">
                                <Label className="text-xs">Source :</Label>
                                <Button
                                  type="button"
                                  variant={!prescription.isCustom ? 'default' : 'outline'}
                                  size="sm"
                                  className="text-xs h-7"
                                  onClick={() => updatePrescription(index, 'isCustom', false)}
                                >
                                  Pharmacie interne
                                </Button>
                                <Button
                                  type="button"
                                  variant={prescription.isCustom ? 'default' : 'outline'}
                                  size="sm"
                                  className="text-xs h-7"
                                  onClick={() => updatePrescription(index, 'isCustom', true)}
                                >
                                  Médicament externe
                                </Button>
                              </div>
                              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                                <div className="sm:col-span-2">
                                  <Label className="text-xs">Médicament</Label>
                                  {prescription.isCustom ? (
                                    <Input
                                      placeholder="Nom du médicament..."
                                      value={prescription.medicationName}
                                      onChange={(e) => updatePrescription(index, 'medicationName', e.target.value)}
                                    />
                                  ) : (
                                    <Select
                                      value={prescription.medicationId}
                                      onValueChange={(v) => updatePrescription(index, 'medicationId', v)}
                                    >
                                      <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                                      <SelectContent>
                                        {(medications || []).map(med => (
                                          <SelectItem key={med.id} value={med.id}>{med.name} ({med.stock_quantity} en stock)</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  )}
                                </div>
                                <div>
                                  <Label className="text-xs">Dosage</Label>
                                  <Input placeholder="500mg" value={prescription.dosage} onChange={(e) => updatePrescription(index, 'dosage', e.target.value)} />
                                </div>
                                <div>
                                  <Label className="text-xs">Fréquence</Label>
                                  <Input placeholder="3x/jour" value={prescription.frequency} onChange={(e) => updatePrescription(index, 'frequency', e.target.value)} />
                                </div>
                                <div>
                                  <Label className="text-xs">Durée</Label>
                                  <Input placeholder="7 jours" value={prescription.duration} onChange={(e) => updatePrescription(index, 'duration', e.target.value)} />
                                </div>
                              </div>
                              <div className="mt-3 flex items-end gap-3">
                                <div className="flex-1">
                                  <Label className="text-xs">Instructions</Label>
                                  <Input placeholder="Prendre pendant les repas..." value={prescription.instructions} onChange={(e) => updatePrescription(index, 'instructions', e.target.value)} />
                                </div>
                                <Button variant="destructive" size="sm" onClick={() => removePrescription(index)}>Supprimer</Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Lab Tests Tab - from medical_acts */}
                <TabsContent value="lab" className="space-y-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Demandes d'analyses</CardTitle>
                      <CardDescription>Sélectionnez les analyses à effectuer (depuis le catalogue des actes)</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {(!labActs || labActs.length === 0) ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <FlaskConical className="h-12 w-12 mx-auto mb-2 opacity-20" />
                          <p>Aucune analyse configurée</p>
                          <p className="text-sm">Ajoutez des actes de catégorie "Analyse" dans Paramètres → Tarifs & Actes</p>
                        </div>
                      ) : (
                        <div className="grid gap-2 sm:grid-cols-2">
                          {labActs.map(act => (
                            <label
                              key={act.id}
                              className={cn(
                                'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                                selectedLabTests.includes(act.id) ? 'bg-primary/5 border-primary' : 'hover:bg-muted/50'
                              )}
                            >
                              <Checkbox checked={selectedLabTests.includes(act.id)} onCheckedChange={() => toggleLabTest(act.id)} />
                              <div className="flex-1">
                                <p className="font-medium text-sm">{act.name}</p>
                                <p className="text-xs text-muted-foreground">{Number(act.unit_price).toLocaleString()} FCFA</p>
                              </div>
                              {selectedLabTests.includes(act.id) && <Check className="h-4 w-4 text-primary" />}
                            </label>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Imaging Tab - from medical_acts */}
                <TabsContent value="imaging" className="space-y-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Demandes d'imagerie</CardTitle>
                      <CardDescription>Sélectionnez les examens d'imagerie (depuis le catalogue des actes)</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {(!imagingActs || imagingActs.length === 0) ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-20" />
                          <p>Aucun examen d'imagerie configuré</p>
                          <p className="text-sm">Ajoutez des actes de catégorie "Imagerie" dans Paramètres → Tarifs & Actes</p>
                        </div>
                      ) : (
                        <div className="grid gap-2 sm:grid-cols-2">
                          {imagingActs.map(act => (
                            <label
                              key={act.id}
                              className={cn(
                                'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                                selectedImagingExams.includes(act.id) ? 'bg-primary/5 border-primary' : 'hover:bg-muted/50'
                              )}
                            >
                              <Checkbox checked={selectedImagingExams.includes(act.id)} onCheckedChange={() => toggleImagingExam(act.id)} />
                              <div className="flex-1">
                                <p className="font-medium text-sm">{act.name}</p>
                                <p className="text-xs text-muted-foreground">{Number(act.unit_price).toLocaleString()} FCFA</p>
                              </div>
                              {selectedImagingExams.includes(act.id) && <Check className="h-4 w-4 text-primary" />}
                            </label>
                          ))}
                        </div>
                      )}
                      
                      {selectedImagingExams.length > 0 && (
                        <div className="mt-4 p-3 bg-muted rounded-lg">
                          <Label className="text-xs">Partie du corps / Indication</Label>
                          <Input className="mt-1" placeholder="Ex: Thorax face, Abdomen complet..." value={imagingBodyPart} onChange={(e) => setImagingBodyPart(e.target.value)} />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Consultations;

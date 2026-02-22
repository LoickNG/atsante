import { useState } from 'react';
import { AppLayout, PageHeader } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Search, 
  Stethoscope,
  Plus,
  Clock,
  User,
  Thermometer,
  Heart,
  Activity,
  Pill,
  FlaskConical,
  ImageIcon,
  Save,
  FileText,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { 
  mockPatients, 
  mockVisits, 
  mockConsultations,
  mockMedications,
  labTestTypes,
  imagingExamTypes,
} from '@/data/mockData';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Patient, Visit } from '@/types';
import { AIDiagnosticAssistant } from '@/components/consultation/AIDiagnosticAssistant';

const Consultations = () => {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewConsultationOpen, setIsNewConsultationOpen] = useState(false);
  
  // Form states
  const [symptoms, setSymptoms] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [vitalSigns, setVitalSigns] = useState({
    temperature: '',
    bloodPressure: '',
    heartRate: '',
    weight: '',
    height: '',
  });
  
  // Prescriptions
  const [prescriptions, setPrescriptions] = useState<Array<{
    medicationId: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
  }>>([]);
  
  // Lab and imaging requests
  const [selectedLabTests, setSelectedLabTests] = useState<string[]>([]);
  const [selectedImagingExams, setSelectedImagingExams] = useState<string[]>([]);

  const waitingPatients = mockVisits
    .filter(v => v.status === 'en_attente' || v.status === 'en_cours')
    .map(v => ({
      visit: v,
      patient: mockPatients.find(p => p.id === v.patientId)!,
    }))
    .filter(item => item.patient);

  const filteredPatients = waitingPatients.filter(({ patient }) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      patient.firstName.toLowerCase().includes(searchLower) ||
      patient.lastName.toLowerCase().includes(searchLower) ||
      patient.code.toLowerCase().includes(searchLower)
    );
  });

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSelectPatient = (patient: Patient, visit: Visit) => {
    setSelectedPatient(patient);
    setSelectedVisit(visit);
    // Reset form
    setSymptoms('');
    setDiagnosis('');
    setNotes('');
    setVitalSigns({ temperature: '', bloodPressure: '', heartRate: '', weight: '', height: '' });
    setPrescriptions([]);
    setSelectedLabTests([]);
    setSelectedImagingExams([]);
  };

  const addPrescription = () => {
    setPrescriptions([...prescriptions, {
      medicationId: '',
      dosage: '',
      frequency: '',
      duration: '',
      instructions: '',
    }]);
  };

  const updatePrescription = (index: number, field: string, value: string) => {
    const updated = [...prescriptions];
    updated[index] = { ...updated[index], [field]: value };
    setPrescriptions(updated);
  };

  const removePrescription = (index: number) => {
    setPrescriptions(prescriptions.filter((_, i) => i !== index));
  };

  const handleSaveConsultation = () => {
    if (!symptoms || !diagnosis) {
      toast.error('Veuillez remplir les symptômes et le diagnostic');
      return;
    }

    toast.success(
      <div className="flex flex-col gap-1">
        <span className="font-semibold">Consultation enregistrée</span>
        <span className="text-sm">
          {prescriptions.length} prescription(s), {selectedLabTests.length} analyse(s), {selectedImagingExams.length} imagerie(s)
        </span>
      </div>
    );

    // Reset selection
    setSelectedPatient(null);
    setSelectedVisit(null);
  };

  const toggleLabTest = (testId: string) => {
    setSelectedLabTests(prev => 
      prev.includes(testId) 
        ? prev.filter(id => id !== testId)
        : [...prev, testId]
    );
  };

  const toggleImagingExam = (examId: string) => {
    setSelectedImagingExams(prev => 
      prev.includes(examId) 
        ? prev.filter(id => id !== examId)
        : [...prev, examId]
    );
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birth = new Date(dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-2rem)]">
        {/* Left Panel - Patient List */}
        <div className="w-80 border-r bg-card flex flex-col">
          <div className="p-4 border-b">
            <h2 className="font-semibold mb-3">File d'attente</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-auto">
            {filteredPatients.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                Aucun patient en attente
              </div>
            ) : (
              <div className="divide-y">
                {filteredPatients.map(({ patient, visit }) => (
                  <button
                    key={visit.id}
                    onClick={() => handleSelectPatient(patient, visit)}
                    className={cn(
                      'w-full p-4 text-left hover:bg-muted/50 transition-colors',
                      selectedPatient?.id === patient.id && 'bg-primary/5 border-l-2 border-l-primary'
                    )}
                  >
                    <div className="flex items-center gap-3">
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
                          <Badge 
                            variant="outline" 
                            className={cn(
                              'text-[10px]',
                              visit.type === 'urgence' && 'bg-destructive/10 text-destructive animate-pulse'
                            )}
                          >
                            {visit.type}
                          </Badge>
                        </div>
                      </div>
                      {visit.status === 'en_cours' && (
                        <Badge className="bg-info text-info-foreground text-[10px]">
                          En cours
                        </Badge>
                      )}
                    </div>
                  </button>
                ))}
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
                      {selectedPatient.firstName[0]}{selectedPatient.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-xl font-bold">
                      {selectedPatient.firstName} {selectedPatient.lastName}
                    </h2>
                    <p className="text-muted-foreground">
                      {calculateAge(selectedPatient.dateOfBirth)} ans • {selectedPatient.code}
                      {selectedPatient.bloodType && ` • ${selectedPatient.bloodType}`}
                    </p>
                    {selectedPatient.allergies && selectedPatient.allergies.length > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <AlertTriangle className="h-3 w-3 text-destructive" />
                        <span className="text-xs text-destructive">
                          Allergies: {selectedPatient.allergies.join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <Button onClick={handleSaveConsultation} className="gap-2">
                  <Save className="h-4 w-4" />
                  Enregistrer
                </Button>
              </div>

              <Tabs defaultValue="consultation" className="space-y-4">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="consultation" className="gap-2">
                    <Stethoscope className="h-4 w-4" />
                    Consultation
                  </TabsTrigger>
                  <TabsTrigger value="prescriptions" className="gap-2">
                    <Pill className="h-4 w-4" />
                    Ordonnance
                    {prescriptions.length > 0 && (
                      <Badge variant="secondary" className="ml-1 text-[10px]">
                        {prescriptions.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="lab" className="gap-2">
                    <FlaskConical className="h-4 w-4" />
                    Analyses
                    {selectedLabTests.length > 0 && (
                      <Badge variant="secondary" className="ml-1 text-[10px]">
                        {selectedLabTests.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="imaging" className="gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Imagerie
                    {selectedImagingExams.length > 0 && (
                      <Badge variant="secondary" className="ml-1 text-[10px]">
                        {selectedImagingExams.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>

                {/* Consultation Tab */}
                <TabsContent value="consultation" className="space-y-4">
                  {/* Vital Signs */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Activity className="h-4 w-4 text-primary" />
                        Signes vitaux
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 sm:grid-cols-5">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-1.5 text-xs">
                          <Thermometer className="h-3 w-3" />
                          Température (°C)
                        </Label>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="37.0"
                          value={vitalSigns.temperature}
                          onChange={(e) => setVitalSigns({ ...vitalSigns, temperature: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-1.5 text-xs">
                          <Heart className="h-3 w-3" />
                          Tension (mmHg)
                        </Label>
                        <Input
                          placeholder="120/80"
                          value={vitalSigns.bloodPressure}
                          onChange={(e) => setVitalSigns({ ...vitalSigns, bloodPressure: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Pouls (bpm)</Label>
                        <Input
                          type="number"
                          placeholder="80"
                          value={vitalSigns.heartRate}
                          onChange={(e) => setVitalSigns({ ...vitalSigns, heartRate: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Poids (kg)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="70"
                          value={vitalSigns.weight}
                          onChange={(e) => setVitalSigns({ ...vitalSigns, weight: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Taille (cm)</Label>
                        <Input
                          type="number"
                          placeholder="170"
                          value={vitalSigns.height}
                          onChange={(e) => setVitalSigns({ ...vitalSigns, height: e.target.value })}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Symptoms & Diagnosis */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Motif & Symptômes</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <Textarea
                          placeholder="Décrivez les symptômes du patient..."
                          className="min-h-[150px]"
                          value={symptoms}
                          onChange={(e) => setSymptoms(e.target.value)}
                        />
                        <AIDiagnosticAssistant
                          symptoms={symptoms}
                          vitalSigns={vitalSigns}
                          patientInfo={{
                            age: calculateAge(selectedPatient.dateOfBirth),
                            gender: selectedPatient.gender,
                            bloodType: selectedPatient.bloodType,
                            allergies: selectedPatient.allergies,
                          }}
                        />
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Diagnostic</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Textarea
                          placeholder="Diagnostic établi..."
                          className="min-h-[150px]"
                          value={diagnosis}
                          onChange={(e) => setDiagnosis(e.target.value)}
                        />
                      </CardContent>
                    </Card>
                  </div>

                  {/* Notes */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Notes additionnelles</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        placeholder="Observations, recommandations..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Prescriptions Tab */}
                <TabsContent value="prescriptions" className="space-y-4">
                  <Card>
                    <CardHeader className="pb-3 flex-row items-center justify-between">
                      <CardTitle className="text-base">Ordonnance médicale</CardTitle>
                      <Button size="sm" onClick={addPrescription} className="gap-1.5">
                        <Plus className="h-4 w-4" />
                        Ajouter
                      </Button>
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
                              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                                <div className="sm:col-span-2">
                                  <Label className="text-xs">Médicament</Label>
                                  <Select
                                    value={prescription.medicationId}
                                    onValueChange={(v) => updatePrescription(index, 'medicationId', v)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Sélectionner..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {mockMedications.map(med => (
                                        <SelectItem key={med.id} value={med.id}>
                                          {med.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label className="text-xs">Dosage</Label>
                                  <Input
                                    placeholder="500mg"
                                    value={prescription.dosage}
                                    onChange={(e) => updatePrescription(index, 'dosage', e.target.value)}
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Fréquence</Label>
                                  <Input
                                    placeholder="3x/jour"
                                    value={prescription.frequency}
                                    onChange={(e) => updatePrescription(index, 'frequency', e.target.value)}
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Durée</Label>
                                  <Input
                                    placeholder="7 jours"
                                    value={prescription.duration}
                                    onChange={(e) => updatePrescription(index, 'duration', e.target.value)}
                                  />
                                </div>
                              </div>
                              <div className="mt-3 flex items-end gap-3">
                                <div className="flex-1">
                                  <Label className="text-xs">Instructions</Label>
                                  <Input
                                    placeholder="Prendre pendant les repas..."
                                    value={prescription.instructions}
                                    onChange={(e) => updatePrescription(index, 'instructions', e.target.value)}
                                  />
                                </div>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => removePrescription(index)}
                                >
                                  Supprimer
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Lab Tests Tab */}
                <TabsContent value="lab" className="space-y-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Demandes d'analyses</CardTitle>
                      <CardDescription>
                        Sélectionnez les analyses à effectuer
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {labTestTypes.map(test => (
                          <label
                            key={test.id}
                            className={cn(
                              'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                              selectedLabTests.includes(test.id)
                                ? 'bg-primary/5 border-primary'
                                : 'hover:bg-muted/50'
                            )}
                          >
                            <Checkbox
                              checked={selectedLabTests.includes(test.id)}
                              onCheckedChange={() => toggleLabTest(test.id)}
                            />
                            <div className="flex-1">
                              <p className="font-medium text-sm">{test.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {test.price.toLocaleString()} FCFA
                              </p>
                            </div>
                            {selectedLabTests.includes(test.id) && (
                              <Check className="h-4 w-4 text-primary" />
                            )}
                          </label>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Imaging Tab */}
                <TabsContent value="imaging" className="space-y-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Demandes d'imagerie</CardTitle>
                      <CardDescription>
                        Sélectionnez les examens d'imagerie
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {imagingExamTypes.map(exam => (
                          <label
                            key={exam.id}
                            className={cn(
                              'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                              selectedImagingExams.includes(exam.id)
                                ? 'bg-primary/5 border-primary'
                                : 'hover:bg-muted/50'
                            )}
                          >
                            <Checkbox
                              checked={selectedImagingExams.includes(exam.id)}
                              onCheckedChange={() => toggleImagingExam(exam.id)}
                            />
                            <div className="flex-1">
                              <p className="font-medium text-sm">{exam.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {exam.price.toLocaleString()} FCFA
                              </p>
                            </div>
                            {selectedImagingExams.includes(exam.id) && (
                              <Check className="h-4 w-4 text-primary" />
                            )}
                          </label>
                        ))}
                      </div>
                      
                      {selectedImagingExams.length > 0 && (
                        <div className="mt-4 p-3 bg-muted rounded-lg">
                          <Label className="text-xs">Partie du corps / Indication</Label>
                          <Input
                            className="mt-1"
                            placeholder="Ex: Thorax face, Abdomen complet..."
                          />
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

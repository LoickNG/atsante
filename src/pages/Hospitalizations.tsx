import { useState } from 'react';
import { AppLayout, PageHeader } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BedDouble, Plus, Search, Clock, LogOut, Stethoscope, Loader2,
  Snowflake, Wind, CalendarDays, AlertTriangle, Pill, ClipboardList, FlaskConical, ScanLine,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import {
  useHospitalizations, useAvailableRooms, useCreateHospitalization,
  useDischargePatient, useAssignRoom, useHospitalizationCare,
  useAddCare, calculateStayDays, Hospitalization,
} from '@/hooks/useHospitalizations';
import { useMedications } from '@/hooks/useMedications';
import { useMedicalActs } from '@/hooks/useBilling';
import { useCreateLabRequest } from '@/hooks/useLabRequests';
import { useCreateImagingRequest } from '@/hooks/useImagingRequests';

import { PatientSearchSelect } from '@/components/PatientSearchSelect';
import { useSearchPatients, Patient } from '@/hooks/usePatients';



const formatDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
const formatDateTime = (d: string) => new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

const CARE_TYPES = [
  'Injection', 'Perfusion', 'Pansement', 'Prise de constantes', 'Administration médicament',
  'Toilette', 'Alimentation', 'Kinésithérapie', 'Autre',
];

const getCategoryLabel = (cat: string) => {
  const map: Record<string, string> = { '1_lit': '1 Lit', '2_lits': '2 Lits', '4_lits': '4 Lits' };
  return map[cat] || cat;
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'decimal', minimumFractionDigits: 0 }).format(amount) + ' FCFA';

export default function Hospitalizations() {
  const { user, role } = useAuth();
  const { data: activeHosps, isLoading: activeLoading } = useHospitalizations('en_cours');
  const { data: allHosps, isLoading: allLoading } = useHospitalizations();
  const { data: availableRooms } = useAvailableRooms();
  
  const createHosp = useCreateHospitalization();
  const dischargePatient = useDischargePatient();
  const assignRoom = useAssignRoom();

  const [search, setSearch] = useState('');
  const [admitDialogOpen, setAdmitDialogOpen] = useState(false);
  const [selectedHosp, setSelectedHosp] = useState<Hospitalization | null>(null);
  const [dischargeDialogOpen, setDischargeDialogOpen] = useState(false);
  const [roomDialogOpen, setRoomDialogOpen] = useState(false);
  const [careDialogOpen, setCareDialogOpen] = useState(false);
  const [examDialogOpen, setExamDialogOpen] = useState(false);

  // Exam form
  const [examCategory, setExamCategory] = useState<'laboratoire' | 'imagerie'>('laboratoire');
  const [examTestType, setExamTestType] = useState('');
  const [examBodyPart, setExamBodyPart] = useState('');
  const [examPriority, setExamPriority] = useState<'normale' | 'urgente'>('normale');

  // Admit form
  const [admitPatient, setAdmitPatient] = useState<Patient | null>(null);
  const [admitRoomId, setAdmitRoomId] = useState('');
  const [admitReason, setAdmitReason] = useState('');

  // Discharge
  const [dischargeNotes, setDischargeNotes] = useState('');

  // Room change
  const [newRoomId, setNewRoomId] = useState('');

  // Care form
  const [careType, setCareType] = useState('');
  const [careDescription, setCareDescription] = useState('');
  const [careNotes, setCareNotes] = useState('');
  const [careQuantity, setCareQuantity] = useState('1');
  const [careMedicationId, setCareMedicationId] = useState('');
  const [careMedSearch, setCareMedSearch] = useState('');

  const { data: medications } = useMedications();
  const { data: medicalActs } = useMedicalActs();

  const { data: careList } = useHospitalizationCare(selectedHosp?.id);
  const addCare = useAddCare();
  const createLabRequest = useCreateLabRequest();
  const createImagingRequest = useCreateImagingRequest();

  const handleAdmit = async () => {
    if (!admitPatient || !admitReason || !user) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }
    try {
      await createHosp.mutateAsync({
        patient_id: admitPatient.id,
        room_id: admitRoomId || undefined,
        reason: admitReason,
        doctor_id: user.id,
      });
      toast.success('Patient admis en hospitalisation');
      setAdmitDialogOpen(false);
      setAdmitPatient(null); setAdmitRoomId(''); setAdmitReason('');
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDischarge = async () => {
    if (!selectedHosp) return;
    try {
      await dischargePatient.mutateAsync({
        id: selectedHosp.id,
        discharge_notes: dischargeNotes || undefined,
        room_id: selectedHosp.room_id || undefined,
      });
      toast.success('Patient sorti');
      setDischargeDialogOpen(false);
      setSelectedHosp(null);
      setDischargeNotes('');
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleAssignRoom = async () => {
    if (!selectedHosp || !newRoomId) return;
    try {
      await assignRoom.mutateAsync({
        hospitalization_id: selectedHosp.id,
        room_id: newRoomId,
        old_room_id: selectedHosp.room_id || undefined,
      });
      toast.success('Chambre attribuée');
      setRoomDialogOpen(false);
      setNewRoomId('');
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleAddCare = async () => {
    if (!selectedHosp || !careType || !careDescription || !user) return;
    const qty = parseInt(careQuantity) || 1;
    // Auto-resolve price silently from medication or medical_acts
    let price = 0;
    if (careMedicationId) {
      const med = (medications || []).find(m => m.id === careMedicationId);
      if (med) price = Number(med.unit_price) || 0;
    } else {
      const act = (medicalActs || []).find(a => a.name.toLowerCase().includes(careType.toLowerCase()));
      if (act) price = Number(act.unit_price) || 0;
    }
    try {
      await addCare.mutateAsync({
        hospitalization_id: selectedHosp.id,
        care_type: careType,
        description: careDescription,
        administered_by: user.id,
        notes: careNotes || undefined,
        unit_price: price,
        quantity: qty,
        total_price: price * qty,
        medication_id: careMedicationId || undefined,
      });
      toast.success('Soin enregistré');
      setCareDialogOpen(false);
      setCareType(''); setCareDescription(''); setCareNotes('');
      setCareQuantity('1'); setCareMedicationId(''); setCareMedSearch('');
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleAddExam = async () => {
    if (!selectedHosp || !user || !examTestType) return;
    try {
      if (examCategory === 'laboratoire') {
        // Lab request needs a consultation_id - use the hospitalization's consultation if available
        await createLabRequest.mutateAsync({
          patient_id: selectedHosp.patient_id,
          consultation_id: selectedHosp.consultation_id || selectedHosp.id,
          test_type: examTestType,
          priority: examPriority,
          status: 'demande',
        });
      } else {
        await createImagingRequest.mutateAsync({
          patient_id: selectedHosp.patient_id,
          consultation_id: selectedHosp.consultation_id || selectedHosp.id,
          exam_type: examTestType,
          body_part: examBodyPart,
          priority: examPriority,
          status: 'demande',
        });
      }
      toast.success(`Demande d'examen envoyée`);
      setExamDialogOpen(false);
      setExamTestType(''); setExamBodyPart(''); setExamPriority('normale');
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const filteredActive = (activeHosps || []).filter(h => {
    if (!search) return true;
    const q = search.toLowerCase();
    const p = h.patients;
    return p && (p.first_name.toLowerCase().includes(q) || p.last_name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q));
  });

  // Calculate room rate directly from room's price_per_night
  const getRoomRate = (room?: { price_per_night?: number } | null) => {
    if (!room) return 0;
    return Number(room.price_per_night) || 0;
  };

  if (activeLoading) {
    return <AppLayout><div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></AppLayout>;
  }

  return (
    <AppLayout>
      <PageHeader title="Hospitalisations" description="Gestion des patients hospitalisés" />

      <Tabs defaultValue="active" className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <TabsList>
            <TabsTrigger value="active" className="gap-2">
              <BedDouble className="h-4 w-4" />En cours
              {activeHosps?.length ? <Badge variant="secondary" className="ml-1">{activeHosps.length}</Badge> : null}
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <ClipboardList className="h-4 w-4" />Historique
            </TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Rechercher un patient..." className="pl-9 w-[250px]" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Button onClick={() => setAdmitDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />Admettre un patient
            </Button>
          </div>
        </div>

        {/* Active Hospitalizations */}
        <TabsContent value="active">
          {filteredActive.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <BedDouble className="h-12 w-12 mb-4 opacity-30" />
                <p>Aucun patient hospitalisé actuellement</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredActive.map(hosp => {
                const p = hosp.patients;
                const days = calculateStayDays(hosp.admission_date, hosp.discharge_date);
                const canSeeCosts = role === 'admin' || role === 'caissier';
                const rate = canSeeCosts ? getRoomRate(hosp.rooms) : 0;
                if (!p) return null;
                return (
                  <Card key={hosp.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedHosp(hosp)}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary/10 text-primary">{p.first_name[0]}{p.last_name[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-sm">{p.first_name} {p.last_name}</CardTitle>
                            <CardDescription className="text-xs">{p.code}</CardDescription>
                          </div>
                        </div>
                        <Badge className="bg-amber-100 text-amber-800 border-amber-200">J{days}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <CalendarDays className="h-3.5 w-3.5" />
                        <span>Admis le {formatDate(hosp.admission_date)}</span>
                      </div>
                      {hosp.rooms ? (
                        <div className="flex items-center gap-2">
                          <BedDouble className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>Chambre {hosp.rooms.room_number}</span>
                          <Badge variant="outline" className="text-[10px] gap-1">
                            {hosp.rooms.comfort === 'climatise' ? <Snowflake className="h-2.5 w-2.5" /> : <Wind className="h-2.5 w-2.5" />}
                            {getCategoryLabel(hosp.rooms.category)}
                          </Badge>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-destructive">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          <span className="text-xs">Aucune chambre attribuée</span>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground line-clamp-2">{hosp.reason}</p>
                      {rate > 0 && (
                        <div className="text-xs font-medium text-right pt-1 border-t">
                          Estimation: {formatCurrency(rate * days)}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* History */}
        <TabsContent value="history">
          <Card>
            <CardContent className="pt-6">
              {allLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Patient</TableHead>
                        <TableHead>Chambre</TableHead>
                        <TableHead>Admission</TableHead>
                        <TableHead>Sortie</TableHead>
                        <TableHead>Durée</TableHead>
                        <TableHead>Statut</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(allHosps || []).map(h => {
                        const p = h.patients;
                        if (!p) return null;
                        const days = calculateStayDays(h.admission_date, h.discharge_date);
                        return (
                          <TableRow key={h.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedHosp(h)}>
                            <TableCell className="font-medium">{p.first_name} {p.last_name}</TableCell>
                            <TableCell>{h.rooms?.room_number || '-'}</TableCell>
                            <TableCell>{formatDate(h.admission_date)}</TableCell>
                            <TableCell>{h.discharge_date ? formatDate(h.discharge_date) : '-'}</TableCell>
                            <TableCell>{days} jour(s)</TableCell>
                            <TableCell>
                              <Badge variant={h.status === 'en_cours' ? 'default' : h.status === 'termine' ? 'secondary' : 'destructive'}>
                                {h.status === 'en_cours' ? 'En cours' : h.status === 'termine' ? 'Terminé' : 'Annulé'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Admit Dialog */}
      <Dialog open={admitDialogOpen} onOpenChange={setAdmitDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Admettre un patient</DialogTitle>
            <DialogDescription>Remplissez les informations d'hospitalisation</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Patient *</Label>
              <PatientSearchSelect selectedPatient={admitPatient} onSelect={setAdmitPatient} />
            </div>
            <div className="space-y-1.5">
              <Label>Chambre</Label>
              <Select value={admitRoomId} onValueChange={setAdmitRoomId}>
                <SelectTrigger><SelectValue placeholder="Sélectionner une chambre" /></SelectTrigger>
                <SelectContent>
                  {(availableRooms || []).map(r => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.room_number} — {getCategoryLabel(r.category)} ({r.comfort === 'climatise' ? 'Clim.' : 'Vent.'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Motif d'hospitalisation *</Label>
              <Textarea value={admitReason} onChange={e => setAdmitReason(e.target.value)} placeholder="Raison de l'hospitalisation..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdmitDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleAdmit} disabled={createHosp.isPending}>
              {createHosp.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Admettre
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Patient Detail Sheet */}
      <Dialog open={!!selectedHosp} onOpenChange={() => setSelectedHosp(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedHosp && selectedHosp.patients && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {selectedHosp.patients.first_name[0]}{selectedHosp.patients.last_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <span>{selectedHosp.patients.first_name} {selectedHosp.patients.last_name}</span>
                    <p className="text-sm font-normal text-muted-foreground">{selectedHosp.patients.code}</p>
                  </div>
                </DialogTitle>
                <DialogDescription>
                  Admis le {formatDate(selectedHosp.admission_date)} — {calculateStayDays(selectedHosp.admission_date, selectedHosp.discharge_date)} jour(s)
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Info cards */}
                <div className="grid grid-cols-2 gap-3">
                  <Card>
                    <CardContent className="p-3">
                      <p className="text-xs text-muted-foreground mb-1">Chambre</p>
                      {selectedHosp.rooms ? (
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{selectedHosp.rooms.room_number}</span>
                          <Badge variant="outline" className="text-[10px] gap-1">
                            {selectedHosp.rooms.comfort === 'climatise' ? <Snowflake className="h-2.5 w-2.5" /> : <Wind className="h-2.5 w-2.5" />}
                            {getCategoryLabel(selectedHosp.rooms.category)}
                          </Badge>
                        </div>
                      ) : <span className="text-destructive text-sm">Non attribuée</span>}
                    </CardContent>
                  </Card>
                  {(role === 'admin' || role === 'caissier') && (
                    <Card>
                      <CardContent className="p-3">
                        <p className="text-xs text-muted-foreground mb-1">Coût estimé</p>
                        <p className="font-semibold">
                          {(() => {
                            const rate = getRoomRate(selectedHosp.rooms);
                            const days = calculateStayDays(selectedHosp.admission_date, selectedHosp.discharge_date);
                            return rate > 0 ? formatCurrency(rate * days) : 'Tarif non configuré';
                          })()}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>

                <Card>
                  <CardContent className="p-3">
                    <p className="text-xs text-muted-foreground mb-1">Motif</p>
                    <p className="text-sm">{selectedHosp.reason}</p>
                  </CardContent>
                </Card>

                {/* Actions */}
                {selectedHosp.status === 'en_cours' && (
                  <div className="flex gap-2 flex-wrap">
                    <Button variant="outline" className="gap-2" onClick={() => { setRoomDialogOpen(true); setNewRoomId(''); }}>
                      <BedDouble className="h-4 w-4" />{selectedHosp.room_id ? 'Changer chambre' : 'Attribuer chambre'}
                    </Button>
                     <Button variant="outline" className="gap-2" onClick={() => { setCareDialogOpen(true); setCareType(''); setCareDescription(''); setCareNotes(''); setCareQuantity('1'); setCareMedicationId(''); setCareMedSearch(''); }}>
                      <Stethoscope className="h-4 w-4" />Ajouter un soin
                    </Button>
                    <Button variant="outline" className="gap-2" onClick={() => { setExamDialogOpen(true); setExamCategory('laboratoire'); setExamTestType(''); setExamBodyPart(''); setExamPriority('normale'); }}>
                      <FlaskConical className="h-4 w-4" />Demander un examen
                    </Button>
                    <Button variant="destructive" className="gap-2 ml-auto" onClick={() => { setDischargeDialogOpen(true); setDischargeNotes(''); }}>
                      <LogOut className="h-4 w-4" />Sortie du patient
                    </Button>
                  </div>
                )}

                {/* Care history */}
                <div>
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <Pill className="h-4 w-4" />Soins administrés
                  </h4>
                  {!careList?.length ? (
                    <p className="text-sm text-muted-foreground">Aucun soin enregistré</p>
                  ) : (
                    <div className="space-y-2 max-h-[250px] overflow-y-auto">
                      {careList.map(c => (
                        <div key={c.id} className="border rounded-lg p-3 text-sm">
                          <div className="flex items-center justify-between mb-1">
                            <Badge variant="outline">{c.care_type}</Badge>
                            <span className="text-xs text-muted-foreground">{formatDateTime(c.administered_at)}</span>
                          </div>
                          <p>{c.description}</p>
                          {c.notes && <p className="text-xs text-muted-foreground mt-1">{c.notes}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Discharge info */}
                {selectedHosp.status === 'termine' && selectedHosp.discharge_notes && (
                  <Card>
                    <CardContent className="p-3">
                      <p className="text-xs text-muted-foreground mb-1">Notes de sortie</p>
                      <p className="text-sm">{selectedHosp.discharge_notes}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Discharge Dialog */}
      <Dialog open={dischargeDialogOpen} onOpenChange={setDischargeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sortie du patient</DialogTitle>
            <DialogDescription>
              {selectedHosp?.patients && `${selectedHosp.patients.first_name} ${selectedHosp.patients.last_name} — ${calculateStayDays(selectedHosp.admission_date)} jour(s) d'hospitalisation`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Notes de sortie</Label>
              <Textarea value={dischargeNotes} onChange={e => setDischargeNotes(e.target.value)} placeholder="État du patient, recommandations..." rows={4} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDischargeDialogOpen(false)}>Annuler</Button>
            <Button variant="destructive" onClick={handleDischarge} disabled={dischargePatient.isPending}>
              {dischargePatient.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirmer la sortie
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Room Dialog */}
      <Dialog open={roomDialogOpen} onOpenChange={setRoomDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedHosp?.room_id ? 'Changer de chambre' : 'Attribuer une chambre'}</DialogTitle>
            <DialogDescription>Sélectionnez une chambre disponible</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Select value={newRoomId} onValueChange={setNewRoomId}>
              <SelectTrigger><SelectValue placeholder="Choisir une chambre" /></SelectTrigger>
              <SelectContent>
                {(availableRooms || []).map(r => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.room_number} — {getCategoryLabel(r.category)} ({r.comfort === 'climatise' ? 'Climatisé' : 'Ventilé'})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoomDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleAssignRoom} disabled={assignRoom.isPending || !newRoomId}>
              {assignRoom.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Attribuer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Care Dialog */}
      <Dialog open={careDialogOpen} onOpenChange={setCareDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Enregistrer un soin</DialogTitle>
            <DialogDescription>Ajoutez un soin pour ce patient</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Type de soin *</Label>
              <Select value={careType} onValueChange={(val) => {
                setCareType(val);
                if (val !== 'Administration médicament' && val !== 'Injection' && val !== 'Perfusion') {
                  setCareMedicationId(''); setCareMedSearch('');
                }
              }}>
                <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                <SelectContent>
                  {CARE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Medication selection for relevant care types */}
            {(careType === 'Administration médicament' || careType === 'Injection' || careType === 'Perfusion') && (
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <Pill className="h-3.5 w-3.5" />Médicament / Consommable
                </Label>
                <Input
                  placeholder="Rechercher un médicament..."
                  value={careMedSearch}
                  onChange={e => { setCareMedSearch(e.target.value); setCareMedicationId(''); }}
                />
                {careMedSearch && !careMedicationId && (
                  <div className="border rounded-lg max-h-40 overflow-auto">
                    {(medications || [])
                      .filter(m => m.name.toLowerCase().includes(careMedSearch.toLowerCase()))
                      .slice(0, 8)
                      .map(m => (
                        <button
                          key={m.id}
                          type="button"
                          className="w-full p-2.5 text-left hover:bg-muted/50 border-b last:border-b-0 text-sm"
                          onClick={() => {
                            setCareMedicationId(m.id);
                            setCareMedSearch(m.name);
                            setCareDescription(m.name);
                          }}
                        >
                          <span className="font-medium">{m.name}</span>
                          <div className="flex gap-2 text-xs text-muted-foreground">
                            <span>Stock: {m.stock_quantity}</span>
                            <span>•</span>
                            <span>{m.form}</span>
                          </div>
                        </button>
                      ))}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Description *</Label>
              <Textarea value={careDescription} onChange={e => setCareDescription(e.target.value)} placeholder="Détails du soin..." rows={2} />
            </div>

            <div className="space-y-1.5">
              <Label>Quantité</Label>
              <Input type="number" min="1" value={careQuantity} onChange={e => setCareQuantity(e.target.value)} placeholder="1" />
            </div>

            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Input value={careNotes} onChange={e => setCareNotes(e.target.value)} placeholder="Observations" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCareDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleAddCare} disabled={addCare.isPending || !careType || !careDescription}>
              {addCare.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Exam Dialog */}
      <Dialog open={examDialogOpen} onOpenChange={setExamDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-primary" />
              Demander un examen
            </DialogTitle>
            <DialogDescription>
              {selectedHosp?.patients && `Pour ${selectedHosp.patients.first_name} ${selectedHosp.patients.last_name}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Type d'examen *</Label>
              <Select value={examCategory} onValueChange={(v) => { setExamCategory(v as 'laboratoire' | 'imagerie'); setExamTestType(''); setExamBodyPart(''); }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="laboratoire">
                    <span className="flex items-center gap-2"><FlaskConical className="h-3.5 w-3.5" />Laboratoire</span>
                  </SelectItem>
                  <SelectItem value="imagerie">
                    <span className="flex items-center gap-2"><ScanLine className="h-3.5 w-3.5" />Imagerie</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {examCategory === 'laboratoire' ? (
              <div className="space-y-1.5">
                <Label>Type d'analyse *</Label>
                <Select value={examTestType} onValueChange={setExamTestType}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner une analyse..." /></SelectTrigger>
                  <SelectContent>
                    {(medicalActs || [])
                      .filter(a => a.category === 'laboratoire')
                      .map(a => (
                        <SelectItem key={a.id} value={a.name}>{a.name}</SelectItem>
                      ))}
                    <SelectItem value="NFS">NFS</SelectItem>
                    <SelectItem value="Glycémie">Glycémie</SelectItem>
                    <SelectItem value="Bilan hépatique">Bilan hépatique</SelectItem>
                    <SelectItem value="Bilan rénal">Bilan rénal</SelectItem>
                    <SelectItem value="Ionogramme">Ionogramme</SelectItem>
                    <SelectItem value="CRP">CRP</SelectItem>
                    <SelectItem value="VS">VS</SelectItem>
                    <SelectItem value="Hémoculture">Hémoculture</SelectItem>
                    <SelectItem value="ECBU">ECBU</SelectItem>
                    <SelectItem value="Goutte épaisse">Goutte épaisse</SelectItem>
                    <SelectItem value="Groupe sanguin">Groupe sanguin</SelectItem>
                    <SelectItem value="Sérologie">Sérologie</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <>
                <div className="space-y-1.5">
                  <Label>Type d'examen *</Label>
                  <Select value={examTestType} onValueChange={setExamTestType}>
                    <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Radiographie">Radiographie</SelectItem>
                      <SelectItem value="Échographie">Échographie</SelectItem>
                      <SelectItem value="Scanner">Scanner</SelectItem>
                      <SelectItem value="IRM">IRM</SelectItem>
                      <SelectItem value="ECG">ECG</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Partie du corps *</Label>
                  <Input value={examBodyPart} onChange={e => setExamBodyPart(e.target.value)} placeholder="Ex: Thorax, Abdomen, Genou..." />
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <Label>Priorité</Label>
              <Select value={examPriority} onValueChange={(v) => setExamPriority(v as 'normale' | 'urgente')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="normale">Normale</SelectItem>
                  <SelectItem value="urgente">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExamDialogOpen(false)}>Annuler</Button>
            <Button
              onClick={handleAddExam}
              disabled={
                (createLabRequest.isPending || createImagingRequest.isPending) ||
                !examTestType ||
                (examCategory === 'imagerie' && !examBodyPart)
              }
            >
              {(createLabRequest.isPending || createImagingRequest.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Envoyer la demande
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

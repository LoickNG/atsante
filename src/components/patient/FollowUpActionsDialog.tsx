import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquarePlus, FlaskConical, ImageIcon, Pill, BedDouble, Send, Loader2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { useCreateLabRequest } from '@/hooks/useLabRequests';
import { useCreateImagingRequest } from '@/hooks/useImagingRequests';
import { useCreatePrescription } from '@/hooks/usePrescriptions';
import { useCreateHospitalization, useAvailableRooms } from '@/hooks/useHospitalizations';
import { useUpdateConsultation } from '@/hooks/useConsultations';
import { useUpdateVisit } from '@/hooks/useVisits';
import { useMedications } from '@/hooks/useMedications';
import { useDoctors } from '@/hooks/useDoctors';
import { useAuth } from '@/hooks/useAuth';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  patientId: string;
  consultationId: string;
  visitId?: string;
  existingNotes: any[];
}

const IMAGING_TYPES = [
  { value: 'radio', label: 'Radiographie' },
  { value: 'echo', label: 'Échographie' },
  { value: 'scanner', label: 'Scanner' },
  { value: 'irm', label: 'IRM' },
  { value: 'autre', label: 'Autre' },
];

export function FollowUpActionsDialog({
  open, onOpenChange, patientId, consultationId, visitId, existingNotes,
}: Props) {
  const { user } = useAuth();
  const [tab, setTab] = useState('suivi');

  // Suivi
  const [followUpNote, setFollowUpNote] = useState('');
  const updateConsultation = useUpdateConsultation();

  // Lab
  const [labType, setLabType] = useState('');
  const [labPriority, setLabPriority] = useState('normale');
  const createLab = useCreateLabRequest();

  // Imagerie
  const [imgType, setImgType] = useState('radio');
  const [imgBodyPart, setImgBodyPart] = useState('');
  const [imgPriority, setImgPriority] = useState('normale');
  const createImg = useCreateImagingRequest();

  // Ordonnance
  const { data: medications } = useMedications();
  const [medId, setMedId] = useState<string>('');
  const [medName, setMedName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('');
  const [duration, setDuration] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [instructions, setInstructions] = useState('');
  const createPresc = useCreatePrescription();

  // Hospitalisation
  const { data: availableRooms } = useAvailableRooms();
  const [roomId, setRoomId] = useState<string>('');
  const [hospReason, setHospReason] = useState('');
  const createHosp = useCreateHospitalization();

  // Orientation / Réassignation
  const { data: doctors } = useDoctors();
  const [targetDoctorId, setTargetDoctorId] = useState<string>('');
  const [refReason, setRefReason] = useState('');
  const updateVisit = useUpdateVisit();

  const reset = () => {
    setFollowUpNote('');
    setLabType(''); setLabPriority('normale');
    setImgType('radio'); setImgBodyPart(''); setImgPriority('normale');
    setMedId(''); setMedName(''); setDosage(''); setFrequency(''); setDuration(''); setQuantity(1); setInstructions('');
    setRoomId(''); setHospReason('');
    setTargetDoctorId(''); setRefReason('');
    setTab('suivi');
  };

  const close = () => { reset(); onOpenChange(false); };

  const handleSaveFollowUp = async () => {
    if (!followUpNote.trim()) return;
    const newNote = { date: new Date().toISOString(), author: user?.email || 'Médecin', text: followUpNote.trim() };
    try {
      await updateConsultation.mutateAsync({
        id: consultationId,
        follow_up_notes: [...existingNotes, newNote] as any,
      });
      toast.success('Commentaire de suivi ajouté');
      close();
    } catch (e: any) { toast.error('Erreur: ' + e.message); }
  };

  const handleCreateLab = async () => {
    if (!labType.trim()) { toast.error('Indiquez le type d\'analyse'); return; }
    try {
      await createLab.mutateAsync({
        patient_id: patientId,
        consultation_id: consultationId,
        test_type: labType.trim(),
        priority: labPriority,
        status: 'demande',
      } as any);
      toast.success('Demande d\'analyse envoyée au laboratoire');
      close();
    } catch (e: any) { toast.error('Erreur: ' + e.message); }
  };

  const handleCreateImg = async () => {
    if (!imgBodyPart.trim()) { toast.error('Indiquez la zone à examiner'); return; }
    try {
      await createImg.mutateAsync({
        patient_id: patientId,
        consultation_id: consultationId,
        exam_type: imgType,
        body_part: imgBodyPart.trim(),
        priority: imgPriority,
        status: 'demande',
      } as any);
      toast.success('Demande d\'imagerie envoyée');
      close();
    } catch (e: any) { toast.error('Erreur: ' + e.message); }
  };

  const handleCreatePresc = async () => {
    if (!medId && !medName.trim()) { toast.error('Choisissez un médicament ou saisissez son nom'); return; }
    if (!dosage.trim() || !frequency.trim() || !duration.trim()) {
      toast.error('Posologie, fréquence et durée requises'); return;
    }
    try {
      await createPresc.mutateAsync({
        consultation_id: consultationId,
        medication_id: medId || null,
        medication_name: !medId ? medName.trim() : null,
        dosage: dosage.trim(),
        frequency: frequency.trim(),
        duration: duration.trim(),
        quantity,
        instructions: instructions.trim() || null,
      } as any);
      toast.success('Médicament ajouté à l\'ordonnance');
      close();
    } catch (e: any) { toast.error('Erreur: ' + e.message); }
  };

  const handleCreateHosp = async () => {
    if (!hospReason.trim()) { toast.error('Indiquez le motif d\'hospitalisation'); return; }
    if (!user?.id) { toast.error('Utilisateur non identifié'); return; }
    try {
      await createHosp.mutateAsync({
        patient_id: patientId,
        consultation_id: consultationId,
        visit_id: visitId,
        room_id: roomId || undefined,
        reason: hospReason.trim(),
        doctor_id: user.id,
      });
      toast.success('Hospitalisation créée');
      close();
    } catch (e: any) { toast.error('Erreur: ' + e.message); }
  };

  const doctorName = (id: string) => doctors?.find(d => d.user_id === id)?.full_name || 'le confrère';

  // Orienter : ajoute une note + remet la visite en attente sur un autre médecin
  const handleRefer = async () => {
    if (!targetDoctorId) { toast.error('Sélectionnez un médecin'); return; }
    if (!visitId) { toast.error('Visite introuvable'); return; }
    try {
      const note = {
        date: new Date().toISOString(),
        author: user?.email || 'Médecin',
        text: `Patient orienté vers ${doctorName(targetDoctorId)}${refReason.trim() ? ' — Motif: ' + refReason.trim() : ''}`,
      };
      await updateConsultation.mutateAsync({
        id: consultationId,
        follow_up_notes: [...existingNotes, note] as any,
      });
      await updateVisit.mutateAsync({
        id: visitId,
        assigned_doctor_id: targetDoctorId,
        status: 'en_attente',
      } as any);
      toast.success(`Patient orienté vers ${doctorName(targetDoctorId)}`);
      close();
    } catch (e: any) { toast.error('Erreur: ' + e.message); }
  };

  // Réassigner : change le médecin titulaire de la consultation en cours
  const handleReassign = async () => {
    if (!targetDoctorId) { toast.error('Sélectionnez un médecin'); return; }
    try {
      const note = {
        date: new Date().toISOString(),
        author: user?.email || 'Médecin',
        text: `Consultation réassignée à ${doctorName(targetDoctorId)}${refReason.trim() ? ' — ' + refReason.trim() : ''}`,
      };
      await updateConsultation.mutateAsync({
        id: consultationId,
        doctor_id: targetDoctorId,
        follow_up_notes: [...existingNotes, note] as any,
      } as any);
      if (visitId) {
        await updateVisit.mutateAsync({
          id: visitId,
          assigned_doctor_id: targetDoctorId,
        } as any);
      }
      toast.success(`Consultation réassignée à ${doctorName(targetDoctorId)}`);
      close();
    } catch (e: any) { toast.error('Erreur: ' + e.message); }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Suivi du patient</DialogTitle>
          <DialogDescription>
            Ajoutez un commentaire ou demandez des examens, une ordonnance, une hospitalisation
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab} className="mt-2">
          <TabsList className="grid grid-cols-6 w-full">
            <TabsTrigger value="suivi" className="gap-1.5"><MessageSquarePlus className="h-4 w-4" />Note</TabsTrigger>
            <TabsTrigger value="lab" className="gap-1.5"><FlaskConical className="h-4 w-4" />Analyse</TabsTrigger>
            <TabsTrigger value="img" className="gap-1.5"><ImageIcon className="h-4 w-4" />Imagerie</TabsTrigger>
            <TabsTrigger value="presc" className="gap-1.5"><Pill className="h-4 w-4" />Ordonnance</TabsTrigger>
            <TabsTrigger value="hosp" className="gap-1.5"><BedDouble className="h-4 w-4" />Hospi.</TabsTrigger>
            <TabsTrigger value="refer" className="gap-1.5"><UserPlus className="h-4 w-4" />Orienter</TabsTrigger>
          </TabsList>

          {/* Suivi */}
          <TabsContent value="suivi" className="space-y-3 pt-4">
            <Label>Commentaire de suivi</Label>
            <Textarea
              placeholder="Ex: Résultats NFS normaux, poursuivre le traitement..."
              className="min-h-[140px]"
              value={followUpNote}
              onChange={(e) => setFollowUpNote(e.target.value)}
            />
            <DialogFooter>
              <Button variant="outline" onClick={close}>Annuler</Button>
              <Button onClick={handleSaveFollowUp} disabled={!followUpNote.trim() || updateConsultation.isPending} className="gap-1.5">
                {updateConsultation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Enregistrer
              </Button>
            </DialogFooter>
          </TabsContent>

          {/* Lab */}
          <TabsContent value="lab" className="space-y-3 pt-4">
            <div>
              <Label>Type d'analyse *</Label>
              <Input
                placeholder="Ex: NFS, Glycémie, Bilan hépatique, Test paludisme..."
                value={labType}
                onChange={(e) => setLabType(e.target.value)}
              />
            </div>
            <div>
              <Label>Priorité</Label>
              <Select value={labPriority} onValueChange={setLabPriority}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="normale">Normale</SelectItem>
                  <SelectItem value="urgente">Urgente</SelectItem>
                  <SelectItem value="vitale">Vitale</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={close}>Annuler</Button>
              <Button onClick={handleCreateLab} disabled={createLab.isPending} className="gap-1.5">
                {createLab.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FlaskConical className="h-4 w-4" />}
                Demander l'analyse
              </Button>
            </DialogFooter>
          </TabsContent>

          {/* Imagerie */}
          <TabsContent value="img" className="space-y-3 pt-4">
            <div>
              <Label>Type d'examen *</Label>
              <Select value={imgType} onValueChange={setImgType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {IMAGING_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Zone / Partie du corps *</Label>
              <Input
                placeholder="Ex: Thorax, Abdomen, Genou droit..."
                value={imgBodyPart}
                onChange={(e) => setImgBodyPart(e.target.value)}
              />
            </div>
            <div>
              <Label>Priorité</Label>
              <Select value={imgPriority} onValueChange={setImgPriority}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="normale">Normale</SelectItem>
                  <SelectItem value="urgente">Urgente</SelectItem>
                  <SelectItem value="vitale">Vitale</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={close}>Annuler</Button>
              <Button onClick={handleCreateImg} disabled={createImg.isPending} className="gap-1.5">
                {createImg.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                Demander l'imagerie
              </Button>
            </DialogFooter>
          </TabsContent>

          {/* Ordonnance */}
          <TabsContent value="presc" className="space-y-3 pt-4">
            <div>
              <Label>Médicament (du stock)</Label>
              <Select value={medId || 'free'} onValueChange={(v) => setMedId(v === 'free' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">— Hors stock (libre) —</SelectItem>
                  {(medications || []).map(m => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name} ({m.dosage_unit}) — Stock: {m.stock_quantity}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {!medId && (
              <div>
                <Label>Nom du médicament libre *</Label>
                <Input value={medName} onChange={(e) => setMedName(e.target.value)} placeholder="Ex: Paracétamol 500mg" />
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Posologie *</Label>
                <Input value={dosage} onChange={(e) => setDosage(e.target.value)} placeholder="Ex: 1 comprimé" />
              </div>
              <div>
                <Label>Fréquence *</Label>
                <Input value={frequency} onChange={(e) => setFrequency(e.target.value)} placeholder="Ex: 3 fois/jour" />
              </div>
              <div>
                <Label>Durée *</Label>
                <Input value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="Ex: 7 jours" />
              </div>
              <div>
                <Label>Quantité totale</Label>
                <Input type="number" min={1} value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value) || 1)} />
              </div>
            </div>
            <div>
              <Label>Instructions</Label>
              <Textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="Ex: À prendre après les repas" />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={close}>Annuler</Button>
              <Button onClick={handleCreatePresc} disabled={createPresc.isPending} className="gap-1.5">
                {createPresc.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pill className="h-4 w-4" />}
                Ajouter à l'ordonnance
              </Button>
            </DialogFooter>
          </TabsContent>

          {/* Hospitalisation */}
          <TabsContent value="hosp" className="space-y-3 pt-4">
            <div>
              <Label>Motif d'hospitalisation *</Label>
              <Textarea
                value={hospReason}
                onChange={(e) => setHospReason(e.target.value)}
                placeholder="Ex: Surveillance post-opératoire, mise en observation..."
                className="min-h-[80px]"
              />
            </div>
            <div>
              <Label>Chambre (optionnel)</Label>
              <Select value={roomId || 'none'} onValueChange={(v) => setRoomId(v === 'none' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="Sélectionner une chambre" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Aucune (à attribuer plus tard) —</SelectItem>
                  {(availableRooms || []).map((r: any) => (
                    <SelectItem key={r.id} value={r.id}>
                      Chambre {r.room_number} — {r.category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={close}>Annuler</Button>
              <Button onClick={handleCreateHosp} disabled={createHosp.isPending} className="gap-1.5">
                {createHosp.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <BedDouble className="h-4 w-4" />}
                Hospitaliser
              </Button>
            </DialogFooter>
          </TabsContent>

          {/* Orienter / Réassigner */}
          <TabsContent value="refer" className="space-y-3 pt-4">
            <div>
              <Label>Médecin destinataire *</Label>
              <Select value={targetDoctorId} onValueChange={setTargetDoctorId}>
                <SelectTrigger><SelectValue placeholder="Choisir un médecin..." /></SelectTrigger>
                <SelectContent>
                  {(doctors || []).filter(d => d.user_id !== user?.id).map(d => (
                    <SelectItem key={d.user_id} value={d.user_id}>
                      Dr. {d.full_name}{d.specialty ? ` — ${d.specialty}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Motif / Note (optionnel)</Label>
              <Textarea
                value={refReason}
                onChange={(e) => setRefReason(e.target.value)}
                placeholder="Ex: Avis cardiologique, suite de prise en charge..."
                className="min-h-[80px]"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              <strong>Orienter</strong> : remet la visite en file d'attente pour le médecin choisi.<br />
              <strong>Réassigner</strong> : transfère la consultation en cours au médecin choisi.
            </p>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={close}>Annuler</Button>
              <Button
                variant="secondary"
                onClick={handleReassign}
                disabled={!targetDoctorId || updateConsultation.isPending}
                className="gap-1.5"
              >
                {updateConsultation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                Réassigner
              </Button>
              <Button
                onClick={handleRefer}
                disabled={!targetDoctorId || !visitId || updateVisit.isPending}
                className="gap-1.5"
              >
                {updateVisit.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Orienter
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

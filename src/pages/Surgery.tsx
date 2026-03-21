import { useState, useEffect } from 'react';
import { AppLayout, PageHeader } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Patient } from '@/hooks/usePatients';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { PatientSearchSelect } from '@/components/PatientSearchSelect';
import { Loader2, Plus, Scissors, Calendar, Clock, CheckCircle2, AlertCircle, Play, Square } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface OperatingRoom {
  id: string;
  name: string;
  room_number: string;
  is_available: boolean;
  notes: string | null;
}

interface Surgery {
  id: string;
  patient_id: string;
  operating_room_id: string;
  doctor_id: string;
  hospitalization_id: string | null;
  scheduled_date: string;
  estimated_duration_minutes: number;
  surgery_type: string;
  description: string | null;
  status: string;
  notes: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  patients?: { first_name: string; last_name: string; code: string };
  operating_rooms?: { name: string; room_number: string };
  profiles?: { full_name: string };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Calendar }> = {
  planifie: { label: 'Planifié', color: 'bg-blue-500', icon: Calendar },
  en_cours: { label: 'En cours', color: 'bg-amber-500', icon: Play },
  termine: { label: 'Terminé', color: 'bg-green-500', icon: CheckCircle2 },
  annule: { label: 'Annulé', color: 'bg-red-500', icon: AlertCircle },
};

export default function Surgery() {
  const { toast } = useToast();
  const { user, role } = useAuth();
  const [surgeries, setSurgeries] = useState<Surgery[]>([]);
  const [rooms, setRooms] = useState<OperatingRoom[]>([]);
  const [doctors, setDoctors] = useState<{ user_id: string; full_name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [roomDialogOpen, setRoomDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [formRoomId, setFormRoomId] = useState('');
  const [formDoctorId, setFormDoctorId] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formTime, setFormTime] = useState('08:00');
  const [formDuration, setFormDuration] = useState('60');
  const [formType, setFormType] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Room form
  const [roomName, setRoomName] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [roomNotes, setRoomNotes] = useState('');

  const fetchData = async () => {
    setLoading(true);
    const [surgeriesRes, roomsRes, doctorsRes] = await Promise.all([
      supabase.from('surgeries').select(`
        *,
        patients(first_name, last_name, code),
        operating_rooms(name, room_number)
      `).order('scheduled_date', { ascending: false }),
      supabase.from('operating_rooms').select('*').order('room_number'),
      supabase.from('user_roles').select('user_id').eq('role', 'medecin'),
    ]);

    if (surgeriesRes.data) {
      // Fetch doctor names
      const doctorIds = [...new Set(surgeriesRes.data.map((s: any) => s.doctor_id))];
      if (doctorIds.length > 0) {
        const { data: profiles } = await supabase.from('profiles').select('user_id, full_name').in('user_id', doctorIds);
        const profileMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);
        setSurgeries(surgeriesRes.data.map((s: any) => ({ ...s, profiles: { full_name: profileMap.get(s.doctor_id) || 'Inconnu' } })));
      } else {
        setSurgeries(surgeriesRes.data as any);
      }
    }
    if (roomsRes.data) setRooms(roomsRes.data as any);

    // Fetch doctor profiles
    if (doctorsRes.data) {
      const ids = doctorsRes.data.map(d => d.user_id);
      if (ids.length > 0) {
        const { data: profiles } = await supabase.from('profiles').select('user_id, full_name').in('user_id', ids);
        setDoctors(profiles || []);
      }
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleScheduleSurgery = async () => {
    if (!selectedPatient || !formRoomId || !formDoctorId || !formDate || !formType) {
      toast({ title: 'Erreur', description: 'Veuillez remplir tous les champs obligatoires', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const scheduledDate = new Date(`${formDate}T${formTime}`).toISOString();
      const { error } = await supabase.from('surgeries').insert({
        patient_id: selectedPatient.id,
        operating_room_id: formRoomId,
        doctor_id: formDoctorId,
        scheduled_date: scheduledDate,
        estimated_duration_minutes: parseInt(formDuration),
        surgery_type: formType,
        description: formDescription || null,
        notes: formNotes || null,
      });
      if (error) throw error;
      toast({ title: 'Intervention programmée', description: 'Les notifications ont été envoyées au personnel médical.' });
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleAddRoom = async () => {
    if (!roomName || !roomNumber) {
      toast({ title: 'Erreur', description: 'Nom et numéro requis', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('operating_rooms').insert({
        name: roomName,
        room_number: roomNumber,
        notes: roomNotes || null,
      });
      if (error) throw error;
      toast({ title: 'Bloc opératoire ajouté' });
      setRoomDialogOpen(false);
      setRoomName(''); setRoomNumber(''); setRoomNotes('');
      fetchData();
    } catch (error: any) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    const updates: any = { status: newStatus };
    if (newStatus === 'en_cours') updates.started_at = new Date().toISOString();
    if (newStatus === 'termine') updates.completed_at = new Date().toISOString();

    const { error } = await supabase.from('surgeries').update(updates).eq('id', id);
    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Statut mis à jour' });
      fetchData();
    }
  };

  const resetForm = () => {
    setSelectedPatient(null); setFormRoomId(''); setFormDoctorId('');
    setFormDate(''); setFormTime('08:00'); setFormDuration('60');
    setFormType(''); setFormDescription(''); setFormNotes('');
  };

  const todaySurgeries = surgeries.filter(s => {
    const d = new Date(s.scheduled_date);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  });

  const upcomingSurgeries = surgeries.filter(s => s.status === 'planifie' && new Date(s.scheduled_date) > new Date());
  const completedSurgeries = surgeries.filter(s => s.status === 'termine');

  const renderSurgeryRow = (s: Surgery) => {
    const cfg = STATUS_CONFIG[s.status] || STATUS_CONFIG.planifie;
    return (
      <TableRow key={s.id}>
        <TableCell className="font-medium">
          {s.patients ? `${s.patients.first_name} ${s.patients.last_name}` : 'Inconnu'}
          <div className="text-xs text-muted-foreground">{s.patients?.code}</div>
        </TableCell>
        <TableCell>{s.surgery_type}</TableCell>
        <TableCell>
          {s.operating_rooms ? `${s.operating_rooms.name} (${s.operating_rooms.room_number})` : '-'}
        </TableCell>
        <TableCell>{s.profiles?.full_name || 'Inconnu'}</TableCell>
        <TableCell>
          {format(new Date(s.scheduled_date), 'dd/MM/yyyy HH:mm', { locale: fr })}
          <div className="text-xs text-muted-foreground">{s.estimated_duration_minutes} min</div>
        </TableCell>
        <TableCell>
          <Badge className={`${cfg.color} text-white`}>{cfg.label}</Badge>
        </TableCell>
        <TableCell>
          <div className="flex gap-1">
            {s.status === 'planifie' && (
              <>
                <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(s.id, 'en_cours')}>
                  <Play className="h-3 w-3 mr-1" />Démarrer
                </Button>
                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleUpdateStatus(s.id, 'annule')}>
                  Annuler
                </Button>
              </>
            )}
            {s.status === 'en_cours' && (
              <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(s.id, 'termine')}>
                <Square className="h-3 w-3 mr-1" />Terminer
              </Button>
            )}
          </div>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <AppLayout>
      <PageHeader title="Bloc Opératoire" description="Gestion des interventions chirurgicales" />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Aujourd'hui</p>
                <p className="text-2xl font-bold">{todaySurgeries.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">À venir</p>
                <p className="text-2xl font-bold">{upcomingSurgeries.length}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Terminées</p>
                <p className="text-2xl font-bold">{completedSurgeries.length}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Blocs disponibles</p>
                <p className="text-2xl font-bold">{rooms.filter(r => r.is_available).length}/{rooms.length}</p>
              </div>
              <Scissors className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="interventions" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="interventions">Interventions</TabsTrigger>
            <TabsTrigger value="blocs">Blocs opératoires</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            {role === 'admin' && (
              <Dialog open={roomDialogOpen} onOpenChange={setRoomDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline"><Plus className="h-4 w-4 mr-2" />Ajouter un bloc</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Nouveau bloc opératoire</DialogTitle></DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Nom</Label>
                      <Input value={roomName} onChange={e => setRoomName(e.target.value)} placeholder="Bloc A" />
                    </div>
                    <div className="space-y-2">
                      <Label>Numéro de salle</Label>
                      <Input value={roomNumber} onChange={e => setRoomNumber(e.target.value)} placeholder="BO-01" />
                    </div>
                    <div className="space-y-2">
                      <Label>Notes</Label>
                      <Textarea value={roomNotes} onChange={e => setRoomNotes(e.target.value)} placeholder="Équipements disponibles..." />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setRoomDialogOpen(false)}>Annuler</Button>
                    <Button onClick={handleAddRoom} disabled={saving}>
                      {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Ajouter
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button><Scissors className="h-4 w-4 mr-2" />Programmer une intervention</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle>Programmer une intervention</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                  <div className="space-y-2">
                    <Label>Patient *</Label>
                    <PatientSearchSelect selectedPatient={selectedPatient} onSelect={setSelectedPatient} />
                  </div>
                  <div className="space-y-2">
                    <Label>Type d'intervention *</Label>
                    <Input value={formType} onChange={e => setFormType(e.target.value)} placeholder="ex: Appendicectomie" />
                  </div>
                  <div className="space-y-2">
                    <Label>Bloc opératoire *</Label>
                    <Select value={formRoomId} onValueChange={setFormRoomId}>
                      <SelectTrigger><SelectValue placeholder="Choisir un bloc" /></SelectTrigger>
                      <SelectContent>
                        {rooms.filter(r => r.is_available).map(r => (
                          <SelectItem key={r.id} value={r.id}>{r.name} ({r.room_number})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Chirurgien *</Label>
                    <Select value={formDoctorId} onValueChange={setFormDoctorId}>
                      <SelectTrigger><SelectValue placeholder="Choisir un chirurgien" /></SelectTrigger>
                      <SelectContent>
                        {doctors.map(d => (
                          <SelectItem key={d.user_id} value={d.user_id}>{d.full_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Date *</Label>
                      <Input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Heure *</Label>
                      <Input type="time" value={formTime} onChange={e => setFormTime(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Durée estimée (minutes)</Label>
                    <Input type="number" value={formDuration} onChange={e => setFormDuration(e.target.value)} min="15" step="15" />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea value={formDescription} onChange={e => setFormDescription(e.target.value)} placeholder="Détails de l'intervention..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Textarea value={formNotes} onChange={e => setFormNotes(e.target.value)} placeholder="Notes supplémentaires..." />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
                  <Button onClick={handleScheduleSurgery} disabled={saving}>
                    {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Programmer
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <TabsContent value="interventions">
          <Card>
            <CardHeader>
              <CardTitle>Interventions chirurgicales</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Patient</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Bloc</TableHead>
                        <TableHead>Chirurgien</TableHead>
                        <TableHead>Date & Durée</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {surgeries.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                            Aucune intervention programmée
                          </TableCell>
                        </TableRow>
                      ) : surgeries.map(renderSurgeryRow)}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="blocs">
          <Card>
            <CardHeader>
              <CardTitle>Blocs opératoires</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {rooms.length === 0 ? (
                  <p className="text-muted-foreground col-span-full text-center py-8">Aucun bloc opératoire configuré</p>
                ) : rooms.map(r => (
                  <Card key={r.id} className="border">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{r.name}</h3>
                        <Badge variant={r.is_available ? 'default' : 'secondary'}>
                          {r.is_available ? 'Disponible' : 'Occupé'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">Salle : {r.room_number}</p>
                      {r.notes && <p className="text-sm text-muted-foreground mt-1">{r.notes}</p>}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}

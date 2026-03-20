import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Pencil, Trash2, BedDouble, Wind, Snowflake } from 'lucide-react';
import { useRooms, useCreateRoom, useUpdateRoom, useDeleteRoom } from '@/hooks/useHospitalizations';
import { useToast } from '@/hooks/use-toast';

const CATEGORIES = [
  { value: '1_lit', label: '1 Lit (Individuelle)', beds: 1 },
  { value: '2_lits', label: '2 Lits', beds: 2 },
  { value: '4_lits', label: '4 Lits', beds: 4 },
];

const COMFORTS = [
  { value: 'climatise', label: 'Climatisé', icon: Snowflake },
  { value: 'ventile', label: 'Ventilé', icon: Wind },
];

interface RoomForm {
  room_number: string;
  category: string;
  comfort: string;
  floor: string;
  notes: string;
  price_per_night: string;
}

const emptyForm: RoomForm = { room_number: '', category: '1_lit', comfort: 'climatise', floor: '', notes: '', price_per_night: '' };

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'decimal', minimumFractionDigits: 0 }).format(amount) + ' FCFA';

export function RoomManagement() {
  const { toast } = useToast();
  const { data: rooms, isLoading } = useRooms();
  const createRoom = useCreateRoom();
  const updateRoom = useUpdateRoom();
  const deleteRoom = useDeleteRoom();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<RoomForm>(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (room: any) => {
    setEditingId(room.id);
    setForm({ room_number: room.room_number, category: room.category, comfort: room.comfort, floor: room.floor || '', notes: room.notes || '', price_per_night: String(room.price_per_night || 0) });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.room_number) {
      toast({ title: 'Erreur', description: 'Numéro de chambre requis', variant: 'destructive' });
      return;
    }
    try {
      const payload = { ...form, floor: form.floor || null, notes: form.notes || null, price_per_night: parseFloat(form.price_per_night) || 0 };
      if (editingId) {
        await updateRoom.mutateAsync({ id: editingId, ...payload });
        toast({ title: 'Chambre modifiée' });
      } else {
        await createRoom.mutateAsync(payload);
        toast({ title: 'Chambre ajoutée' });
      }
      setDialogOpen(false);
      setForm(emptyForm);
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteRoom.mutateAsync(deleteId);
      toast({ title: 'Chambre supprimée' });
      setDeleteId(null);
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' });
    }
  };

  const getCatLabel = (cat: string) => CATEGORIES.find(c => c.value === cat)?.label || cat;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2"><BedDouble className="h-5 w-5" />Gestion des Chambres</CardTitle>
          <Button onClick={openCreate} className="gap-1"><Plus className="h-4 w-4" />Ajouter</Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : !rooms?.length ? (
            <p className="text-center text-muted-foreground py-8">Aucune chambre configurée</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N° Chambre</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Confort</TableHead>
                    <TableHead>Étage</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rooms.map(room => (
                    <TableRow key={room.id}>
                      <TableCell className="font-semibold">{room.room_number}</TableCell>
                      <TableCell>{getCatLabel(room.category)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="gap-1">
                          {room.comfort === 'climatise' ? <Snowflake className="h-3 w-3" /> : <Wind className="h-3 w-3" />}
                          {room.comfort === 'climatise' ? 'Climatisé' : 'Ventilé'}
                        </Badge>
                      </TableCell>
                      <TableCell>{room.floor || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={room.is_available ? 'default' : 'secondary'}>
                          {room.is_available ? 'Disponible' : 'Occupée'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 justify-end">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(room)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteId(room.id)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Modifier' : 'Nouvelle chambre'}</DialogTitle>
            <DialogDescription>Configurez les détails de la chambre</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>N° Chambre *</Label>
                <Input value={form.room_number} onChange={e => setForm(f => ({ ...f, room_number: e.target.value }))} placeholder="CH-101" />
              </div>
              <div className="space-y-1.5">
                <Label>Étage</Label>
                <Input value={form.floor} onChange={e => setForm(f => ({ ...f, floor: e.target.value }))} placeholder="1er" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Catégorie *</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Confort *</Label>
                <Select value={form.comfort} onValueChange={v => setForm(f => ({ ...f, comfort: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {COMFORTS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optionnel" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSubmit} disabled={createRoom.isPending || updateRoom.isPending}>
              {(createRoom.isPending || updateRoom.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingId ? 'Enregistrer' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>Cette action est irréversible.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Annuler</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteRoom.isPending}>
              {deleteRoom.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

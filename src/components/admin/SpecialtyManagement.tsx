import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Stethoscope, Plus, Loader2, Pencil } from 'lucide-react';

interface Specialty {
  id: string;
  value: string;
  label: string;
  is_active: boolean;
  created_at: string;
}

export function SpecialtyManagement() {
  const { toast } = useToast();
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formValue, setFormValue] = useState('');
  const [formLabel, setFormLabel] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchSpecialties = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('specialties')
      .select('*')
      .order('label');
    if (error) {
      console.error(error);
    } else {
      setSpecialties(data || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchSpecialties(); }, []);

  const handleSave = async () => {
    if (!formValue.trim() || !formLabel.trim()) {
      toast({ title: 'Erreur', description: 'Tous les champs sont requis', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const slug = formValue.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      if (editingId) {
        const { error } = await supabase.from('specialties').update({ label: formLabel.trim(), value: slug }).eq('id', editingId);
        if (error) throw error;
        toast({ title: 'Spécialité mise à jour' });
      } else {
        const { error } = await supabase.from('specialties').insert({ value: slug, label: formLabel.trim() });
        if (error) throw error;
        toast({ title: 'Spécialité ajoutée' });
      }
      setDialogOpen(false);
      setEditingId(null);
      setFormValue('');
      setFormLabel('');
      fetchSpecialties();
    } catch (error: any) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    const { error } = await supabase.from('specialties').update({ is_active: !current }).eq('id', id);
    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      fetchSpecialties();
    }
  };

  const openEdit = (s: Specialty) => {
    setEditingId(s.id);
    setFormValue(s.value);
    setFormLabel(s.label);
    setDialogOpen(true);
  };

  const openCreate = () => {
    setEditingId(null);
    setFormValue('');
    setFormLabel('');
    setDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <CardTitle className="flex items-center gap-2">
          <Stethoscope className="h-5 w-5" />
          Spécialités médicales ({specialties.length})
        </CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Ajouter une spécialité</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Modifier la spécialité' : 'Nouvelle spécialité'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nom affiché</Label>
                <Input value={formLabel} onChange={e => setFormLabel(e.target.value)} placeholder="ex: Cardiologie" />
              </div>
              <div className="space-y-2">
                <Label>Identifiant (code)</Label>
                <Input value={formValue} onChange={e => setFormValue(e.target.value)} placeholder="ex: cardiologie" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingId ? 'Enregistrer' : 'Ajouter'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {specialties.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    Aucune spécialité définie
                  </TableCell>
                </TableRow>
              ) : specialties.map(s => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.label}</TableCell>
                  <TableCell className="text-muted-foreground">{s.value}</TableCell>
                  <TableCell>
                    <Badge variant={s.is_active ? 'default' : 'outline'}>
                      {s.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch checked={s.is_active} onCheckedChange={() => toggleActive(s.id, s.is_active)} />
                      <Button variant="ghost" size="icon" onClick={() => openEdit(s)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Pencil, Trash2, Search } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const CATEGORIES = [
  { value: 'consultation', label: 'Consultation' },
  { value: 'analyse', label: 'Analyse / Laboratoire' },
  { value: 'imagerie', label: 'Imagerie' },
  { value: 'soins', label: 'Soins / Actes médicaux' },
  { value: 'autre', label: 'Autre' },
];

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'decimal', minimumFractionDigits: 0 }).format(amount) + ' FCFA';

interface ActForm {
  code: string;
  name: string;
  category: string;
  unit_price: string;
  description: string;
}

const emptyForm: ActForm = { code: '', name: '', category: 'consultation', unit_price: '', description: '' };

export function MedicalActsManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ActForm>(emptyForm);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: acts, isLoading } = useQuery({
    queryKey: ['medical_acts'],
    queryFn: async () => {
      const { data, error } = await supabase.from('medical_acts').select('*').order('category').order('name');
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (act: ActForm & { id?: string }) => {
      const payload = {
        code: act.code,
        name: act.name,
        category: act.category,
        unit_price: parseFloat(act.unit_price),
        description: act.description || null,
      };
      if (act.id) {
        const { error } = await supabase.from('medical_acts').update(payload).eq('id', act.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('medical_acts').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medical_acts'] });
      toast({ title: editingId ? 'Acte modifié' : 'Acte ajouté' });
      closeDialog();
    },
    onError: (e: any) => toast({ title: 'Erreur', description: e.message, variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('medical_acts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medical_acts'] });
      toast({ title: 'Acte supprimé' });
      setDeleteId(null);
    },
    onError: (e: any) => toast({ title: 'Erreur', description: e.message, variant: 'destructive' }),
  });

  const openCreate = (category?: string) => {
    setEditingId(null);
    setForm({ ...emptyForm, category: category || 'consultation' });
    setDialogOpen(true);
  };

  const openEdit = (act: any) => {
    setEditingId(act.id);
    setForm({
      code: act.code,
      name: act.name,
      category: act.category,
      unit_price: String(act.unit_price),
      description: act.description || '',
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = () => {
    if (!form.code || !form.name || !form.unit_price) {
      toast({ title: 'Erreur', description: 'Remplissez tous les champs obligatoires', variant: 'destructive' });
      return;
    }
    saveMutation.mutate({ ...form, id: editingId || undefined });
  };

  const filtered = (acts || []).filter(a => {
    const q = search.toLowerCase();
    const matchSearch = !q || a.name.toLowerCase().includes(q) || a.code.toLowerCase().includes(q);
    const matchCategory = categoryFilter === 'all' || a.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  const getCategoryLabel = (cat: string) => CATEGORIES.find(c => c.value === cat)?.label || cat;

  // Group acts by category
  const groupedActs = CATEGORIES.reduce((acc, cat) => {
    acc[cat.value] = filtered.filter(a => a.category === cat.value);
    return acc;
  }, {} as Record<string, typeof filtered>);

  const CATEGORY_COLORS: Record<string, string> = {
    consultation: 'bg-blue-100 text-blue-800 border-blue-200',
    analyse: 'bg-purple-100 text-purple-800 border-purple-200',
    imagerie: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    soins: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    autre: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <CardTitle className="text-base">Catalogue des actes et tarifs</CardTitle>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 w-full sm:w-[200px]" />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={() => openCreate()} className="gap-1"><Plus className="h-4 w-4" />Ajouter</Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Quick add buttons by category */}
          <div className="flex flex-wrap gap-2 mb-6">
            {CATEGORIES.map(cat => (
              <Button
                key={cat.value}
                variant="outline"
                size="sm"
                className={`gap-1.5 ${CATEGORY_COLORS[cat.value] || ''}`}
                onClick={() => openCreate(cat.value)}
              >
                <Plus className="h-3.5 w-3.5" />
                {cat.label}
              </Button>
            ))}
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Aucun acte trouvé</p>
          ) : categoryFilter !== 'all' ? (
            /* Flat table when filtering by specific category */
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead className="text-right">Prix unitaire</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(act => (
                    <TableRow key={act.id}>
                      <TableCell className="font-mono text-sm">{act.code}</TableCell>
                      <TableCell className="font-medium">{act.name}</TableCell>
                      <TableCell><Badge variant="outline">{getCategoryLabel(act.category)}</Badge></TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(Number(act.unit_price))}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 justify-end">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(act)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteId(act.id)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            /* Grouped by category */
            <div className="space-y-6">
              {CATEGORIES.map(cat => {
                const catActs = groupedActs[cat.value] || [];
                if (catActs.length === 0) return null;
                return (
                  <div key={cat.value}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge className={CATEGORY_COLORS[cat.value]}>{cat.label}</Badge>
                        <span className="text-sm text-muted-foreground">{catActs.length} acte(s)</span>
                      </div>
                      <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => openCreate(cat.value)}>
                        <Plus className="h-3.5 w-3.5" />Ajouter
                      </Button>
                    </div>
                    <div className="overflow-x-auto border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/30">
                            <TableHead>Code</TableHead>
                            <TableHead>Nom</TableHead>
                            <TableHead className="text-right">Prix unitaire</TableHead>
                            <TableHead className="w-[80px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {catActs.map(act => (
                            <TableRow key={act.id}>
                              <TableCell className="font-mono text-sm">{act.code}</TableCell>
                              <TableCell className="font-medium">{act.name}</TableCell>
                              <TableCell className="text-right font-semibold">{formatCurrency(Number(act.unit_price))}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1 justify-end">
                                  <Button variant="ghost" size="icon" onClick={() => openEdit(act)}><Pencil className="h-4 w-4" /></Button>
                                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteId(act.id)}><Trash2 className="h-4 w-4" /></Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Modifier l\'acte' : 'Nouvel acte médical'}</DialogTitle>
            <DialogDescription>Définissez le code, nom, catégorie et prix</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Code *</Label>
                <Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="CONS-001" />
              </div>
              <div className="space-y-1.5">
                <Label>Catégorie *</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Nom *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Consultation générale" />
            </div>
            <div className="space-y-1.5">
              <Label>Prix unitaire (FCFA) *</Label>
              <Input type="number" value={form.unit_price} onChange={e => setForm(f => ({ ...f, unit_price: e.target.value }))} placeholder="5000" />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optionnel" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Annuler</Button>
            <Button onClick={handleSubmit} disabled={saveMutation.isPending}>
              {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingId ? 'Enregistrer' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>Cette action est irréversible. Supprimer cet acte médical ?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Annuler</Button>
            <Button variant="destructive" onClick={() => deleteId && deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

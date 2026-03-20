import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Plus, Building2, Shield, Handshake, Edit } from 'lucide-react';
import { toast } from 'sonner';
import {
  useInsuranceCompanies, useCreateInsuranceCompany, useUpdateInsuranceCompany,
  usePartnerCompanies, useCreatePartnerCompany, useUpdatePartnerCompany,
  useConventions, useCreateConvention, useUpdateConvention,
  type InsuranceCompany, type PartnerCompany, type ConventionWithRelations,
} from '@/hooks/useConventions';

// ─── Insurance Companies Tab ───
function InsuranceTab() {
  const { data: insurances, isLoading } = useInsuranceCompanies();
  const createMut = useCreateInsuranceCompany();
  const updateMut = useUpdateInsuranceCompany();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<InsuranceCompany | null>(null);
  const [form, setForm] = useState({ name: '', code: '', contact_name: '', contact_phone: '', contact_email: '', address: '' });

  const openCreate = () => { setEditing(null); setForm({ name: '', code: '', contact_name: '', contact_phone: '', contact_email: '', address: '' }); setDialogOpen(true); };
  const openEdit = (ins: InsuranceCompany) => { setEditing(ins); setForm({ name: ins.name, code: ins.code, contact_name: ins.contact_name || '', contact_phone: ins.contact_phone || '', contact_email: ins.contact_email || '', address: ins.address || '' }); setDialogOpen(true); };

  const handleSave = async () => {
    if (!form.name || !form.code) { toast.error('Nom et code requis'); return; }
    try {
      if (editing) {
        await updateMut.mutateAsync({ id: editing.id, ...form });
        toast.success('Assurance modifiée');
      } else {
        await createMut.mutateAsync(form);
        toast.success('Assurance créée');
      }
      setDialogOpen(false);
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" />Assurances partenaires</CardTitle>
          <CardDescription>Compagnies d'assurance avec lesquelles la clinique collabore</CardDescription>
        </div>
        <Button size="sm" className="gap-1" onClick={openCreate}><Plus className="h-4 w-4" />Ajouter</Button>
      </CardHeader>
      <CardContent>
        {isLoading ? <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div> : !insurances?.length ? (
          <p className="text-center py-8 text-muted-foreground">Aucune assurance enregistrée</p>
        ) : (
          <Table>
            <TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Nom</TableHead><TableHead>Contact</TableHead><TableHead>Téléphone</TableHead><TableHead>Statut</TableHead><TableHead></TableHead></TableRow></TableHeader>
            <TableBody>
              {insurances.map(ins => (
                <TableRow key={ins.id}>
                  <TableCell className="font-mono text-sm">{ins.code}</TableCell>
                  <TableCell className="font-medium">{ins.name}</TableCell>
                  <TableCell>{ins.contact_name || '—'}</TableCell>
                  <TableCell>{ins.contact_phone || '—'}</TableCell>
                  <TableCell><Badge variant={ins.is_active ? 'default' : 'secondary'}>{ins.is_active ? 'Actif' : 'Inactif'}</Badge></TableCell>
                  <TableCell><Button variant="ghost" size="icon" onClick={() => openEdit(ins)}><Edit className="h-4 w-4" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Modifier l\'assurance' : 'Nouvelle assurance'}</DialogTitle><DialogDescription>Renseignez les informations de l'assurance partenaire</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Nom *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Code *</Label><Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="ex: AMSA" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Contact</Label><Input value={form.contact_name} onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Téléphone</Label><Input value={form.contact_phone} onChange={e => setForm(f => ({ ...f, contact_phone: e.target.value }))} /></div>
            </div>
            <div className="space-y-1"><Label>Email</Label><Input type="email" value={form.contact_email} onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Adresse</Label><Textarea value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSave} disabled={createMut.isPending || updateMut.isPending}>
              {(createMut.isPending || updateMut.isPending) && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editing ? 'Modifier' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ─── Partner Companies Tab ───
function CompaniesTab() {
  const { data: companies, isLoading } = usePartnerCompanies();
  const createMut = useCreatePartnerCompany();
  const updateMut = useUpdatePartnerCompany();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PartnerCompany | null>(null);
  const [form, setForm] = useState({ name: '', code: '', contact_name: '', contact_phone: '', contact_email: '', address: '' });

  const openCreate = () => { setEditing(null); setForm({ name: '', code: '', contact_name: '', contact_phone: '', contact_email: '', address: '' }); setDialogOpen(true); };
  const openEdit = (c: PartnerCompany) => { setEditing(c); setForm({ name: c.name, code: c.code, contact_name: c.contact_name || '', contact_phone: c.contact_phone || '', contact_email: c.contact_email || '', address: c.address || '' }); setDialogOpen(true); };

  const handleSave = async () => {
    if (!form.name || !form.code) { toast.error('Nom et code requis'); return; }
    try {
      if (editing) {
        await updateMut.mutateAsync({ id: editing.id, ...form });
        toast.success('Société modifiée');
      } else {
        await createMut.mutateAsync(form);
        toast.success('Société créée');
      }
      setDialogOpen(false);
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" />Sociétés partenaires</CardTitle>
          <CardDescription>Entreprises ayant une convention de prise en charge avec la clinique</CardDescription>
        </div>
        <Button size="sm" className="gap-1" onClick={openCreate}><Plus className="h-4 w-4" />Ajouter</Button>
      </CardHeader>
      <CardContent>
        {isLoading ? <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div> : !companies?.length ? (
          <p className="text-center py-8 text-muted-foreground">Aucune société enregistrée</p>
        ) : (
          <Table>
            <TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Nom</TableHead><TableHead>Contact</TableHead><TableHead>Téléphone</TableHead><TableHead>Statut</TableHead><TableHead></TableHead></TableRow></TableHeader>
            <TableBody>
              {companies.map(c => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono text-sm">{c.code}</TableCell>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.contact_name || '—'}</TableCell>
                  <TableCell>{c.contact_phone || '—'}</TableCell>
                  <TableCell><Badge variant={c.is_active ? 'default' : 'secondary'}>{c.is_active ? 'Actif' : 'Inactif'}</Badge></TableCell>
                  <TableCell><Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Edit className="h-4 w-4" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Modifier la société' : 'Nouvelle société'}</DialogTitle><DialogDescription>Renseignez les informations de la société partenaire</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Nom *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Code *</Label><Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="ex: ESSO" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Contact</Label><Input value={form.contact_name} onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Téléphone</Label><Input value={form.contact_phone} onChange={e => setForm(f => ({ ...f, contact_phone: e.target.value }))} /></div>
            </div>
            <div className="space-y-1"><Label>Email</Label><Input type="email" value={form.contact_email} onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Adresse</Label><Textarea value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSave} disabled={createMut.isPending || updateMut.isPending}>
              {(createMut.isPending || updateMut.isPending) && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editing ? 'Modifier' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ─── Conventions Tab ───
function ConventionsTab() {
  const { data: conventions, isLoading } = useConventions();
  const { data: companies } = usePartnerCompanies();
  const { data: insurances } = useInsuranceCompanies();
  const createMut = useCreateConvention();
  const updateMut = useUpdateConvention();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ConventionWithRelations | null>(null);
  const [form, setForm] = useState({
    name: '', company_id: '', insurance_id: '',
    company_coverage_percent: 0, insurance_coverage_percent: 0, patient_coverage_percent: 100,
    start_date: new Date().toISOString().split('T')[0], end_date: '', notes: '',
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', company_id: '', insurance_id: '', company_coverage_percent: 0, insurance_coverage_percent: 0, patient_coverage_percent: 100, start_date: new Date().toISOString().split('T')[0], end_date: '', notes: '' });
    setDialogOpen(true);
  };

  const openEdit = (c: ConventionWithRelations) => {
    setEditing(c);
    setForm({
      name: c.name, company_id: c.company_id, insurance_id: c.insurance_id || '',
      company_coverage_percent: c.company_coverage_percent, insurance_coverage_percent: c.insurance_coverage_percent, patient_coverage_percent: c.patient_coverage_percent,
      start_date: c.start_date, end_date: c.end_date || '', notes: c.notes || '',
    });
    setDialogOpen(true);
  };

  const updatePercents = (field: string, value: number) => {
    const newForm = { ...form, [field]: value };
    if (field === 'company_coverage_percent' || field === 'insurance_coverage_percent') {
      const comp = field === 'company_coverage_percent' ? value : newForm.company_coverage_percent;
      const ins = field === 'insurance_coverage_percent' ? value : newForm.insurance_coverage_percent;
      newForm.patient_coverage_percent = Math.max(0, 100 - comp - ins);
    }
    setForm(newForm);
  };

  const handleSave = async () => {
    if (!form.name || !form.company_id) { toast.error('Nom et société requis'); return; }
    const total = form.company_coverage_percent + form.insurance_coverage_percent + form.patient_coverage_percent;
    if (total !== 100) { toast.error('Les pourcentages doivent totaliser 100%'); return; }
    try {
      const payload = {
        name: form.name,
        company_id: form.company_id,
        insurance_id: form.insurance_id || null,
        company_coverage_percent: form.company_coverage_percent,
        insurance_coverage_percent: form.insurance_coverage_percent,
        patient_coverage_percent: form.patient_coverage_percent,
        start_date: form.start_date,
        end_date: form.end_date || null,
        notes: form.notes || null,
      };
      if (editing) {
        await updateMut.mutateAsync({ id: editing.id, ...payload });
        toast.success('Convention modifiée');
      } else {
        await createMut.mutateAsync(payload);
        toast.success('Convention créée');
      }
      setDialogOpen(false);
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2"><Handshake className="h-5 w-5" />Conventions tripartites</CardTitle>
          <CardDescription>Accords entre la clinique, les sociétés et les assurances pour la prise en charge</CardDescription>
        </div>
        <Button size="sm" className="gap-1" onClick={openCreate}><Plus className="h-4 w-4" />Ajouter</Button>
      </CardHeader>
      <CardContent>
        {isLoading ? <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div> : !conventions?.length ? (
          <p className="text-center py-8 text-muted-foreground">Aucune convention enregistrée</p>
        ) : (
          <Table>
            <TableHeader><TableRow>
              <TableHead>Convention</TableHead>
              <TableHead>Société</TableHead>
              <TableHead>Assurance</TableHead>
              <TableHead>Part société</TableHead>
              <TableHead>Part assurance</TableHead>
              <TableHead>Part patient</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead></TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {conventions.map(c => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.company?.name || '—'}</TableCell>
                  <TableCell>{c.insurance?.name || '—'}</TableCell>
                  <TableCell className="text-center font-mono">{c.company_coverage_percent}%</TableCell>
                  <TableCell className="text-center font-mono">{c.insurance_coverage_percent}%</TableCell>
                  <TableCell className="text-center font-mono">{c.patient_coverage_percent}%</TableCell>
                  <TableCell><Badge variant={c.is_active ? 'default' : 'secondary'}>{c.is_active ? 'Active' : 'Inactive'}</Badge></TableCell>
                  <TableCell><Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Edit className="h-4 w-4" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Modifier la convention' : 'Nouvelle convention'}</DialogTitle><DialogDescription>Définissez les termes de la convention tripartite</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1"><Label>Nom de la convention *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="ex: Convention ESSO-AMSA 2026" /></div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Société *</Label>
                <Select value={form.company_id} onValueChange={v => setForm(f => ({ ...f, company_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
                  <SelectContent>{companies?.filter(c => c.is_active).map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Assurance</Label>
                <Select value={form.insurance_id} onValueChange={v => setForm(f => ({ ...f, insurance_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Aucune" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucune</SelectItem>
                    {insurances?.filter(i => i.is_active).map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-semibold">Répartition de la prise en charge</Label>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Société (%)</Label>
                  <Input type="number" min={0} max={100} value={form.company_coverage_percent} onChange={e => updatePercents('company_coverage_percent', Number(e.target.value) || 0)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Assurance (%)</Label>
                  <Input type="number" min={0} max={100} value={form.insurance_coverage_percent} onChange={e => updatePercents('insurance_coverage_percent', Number(e.target.value) || 0)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Patient (%)</Label>
                  <Input type="number" min={0} max={100} value={form.patient_coverage_percent} readOnly className="bg-muted" />
                </div>
              </div>
              {(form.company_coverage_percent + form.insurance_coverage_percent + form.patient_coverage_percent) !== 100 && (
                <p className="text-xs text-destructive">Le total doit être égal à 100%</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Date de début</Label><Input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Date de fin</Label><Input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} /></div>
            </div>

            <div className="space-y-1"><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Conditions particulières..." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSave} disabled={createMut.isPending || updateMut.isPending}>
              {(createMut.isPending || updateMut.isPending) && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editing ? 'Modifier' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ─── Main Component ───
export function ConventionManagement() {
  return (
    <Tabs defaultValue="conventions" className="space-y-4">
      <TabsList>
        <TabsTrigger value="conventions" className="gap-2"><Handshake className="h-4 w-4" />Conventions</TabsTrigger>
        <TabsTrigger value="companies" className="gap-2"><Building2 className="h-4 w-4" />Sociétés</TabsTrigger>
        <TabsTrigger value="insurances" className="gap-2"><Shield className="h-4 w-4" />Assurances</TabsTrigger>
      </TabsList>
      <TabsContent value="conventions"><ConventionsTab /></TabsContent>
      <TabsContent value="companies"><CompaniesTab /></TabsContent>
      <TabsContent value="insurances"><InsuranceTab /></TabsContent>
    </Tabs>
  );
}

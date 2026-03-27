import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, Key, Building2, Users, Calendar, Shield, UserPlus, Loader2 } from 'lucide-react';
import { useLicenses, useCreateLicense, useUpdateLicense, useDeleteLicense, ALL_MODULES, License } from '@/hooks/useLicenses';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, differenceInDays, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

const defaultForm = {
  clinic_name: '',
  max_users: 5,
  enabled_modules: ['accueil', 'patients', 'consultations', 'pharmacie'],
  start_date: new Date().toISOString().split('T')[0],
  expiry_date: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
  is_active: true,
  contact_name: '',
  contact_email: '',
  contact_phone: '',
  notes: '',
};

export function LicenseManagement() {
  const { data: licenses = [], isLoading } = useLicenses();
  const createLicense = useCreateLicense();
  const updateLicense = useUpdateLicense();
  const deleteLicense = useDeleteLicense();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<License | null>(null);
  const [form, setForm] = useState(defaultForm);

  // Admin creation dialog state
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);
  const [adminForm, setAdminForm] = useState({ full_name: '', email: '' });
  const [creatingAdmin, setCreatingAdmin] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setForm(defaultForm);
    setOpen(true);
  };

  const openEdit = (lic: License) => {
    setEditing(lic);
    setForm({
      clinic_name: lic.clinic_name,
      max_users: lic.max_users,
      enabled_modules: lic.enabled_modules,
      start_date: lic.start_date,
      expiry_date: lic.expiry_date,
      is_active: lic.is_active,
      contact_name: lic.contact_name || '',
      contact_email: lic.contact_email || '',
      contact_phone: lic.contact_phone || '',
      notes: lic.notes || '',
    });
    setOpen(true);
  };

  const handleSubmit = async () => {
    const payload = {
      ...form,
      contact_name: form.contact_name || null,
      contact_email: form.contact_email || null,
      contact_phone: form.contact_phone || null,
      notes: form.notes || null,
    };

    if (editing) {
      await updateLicense.mutateAsync({ id: editing.id, ...payload });
    } else {
      await createLicense.mutateAsync(payload);
    }
    setOpen(false);
  };

  const toggleModule = (mod: string) => {
    setForm(f => ({
      ...f,
      enabled_modules: f.enabled_modules.includes(mod)
        ? f.enabled_modules.filter(m => m !== mod)
        : [...f.enabled_modules, mod],
    }));
  };

  const openAdminDialog = (lic: License) => {
    setSelectedLicense(lic);
    setAdminForm({ full_name: '', email: lic.contact_email || '' });
    setAdminDialogOpen(true);
  };

  const handleCreateAdmin = async () => {
    if (!selectedLicense) return;
    if (!adminForm.full_name || !adminForm.email) {
      toast({ title: 'Erreur', description: 'Le nom et l\'email sont requis', variant: 'destructive' });
      return;
    }

    setCreatingAdmin(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          email: adminForm.email,
          password: 'temporary-invite', // Not used for invite flow
          full_name: adminForm.full_name,
          role: 'admin',
          license_id: selectedLicense.id,
          clinic_name: selectedLicense.clinic_name,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({ title: 'Succès', description: data?.message || 'Administrateur créé. Un email d\'invitation a été envoyé.' });
      setAdminDialogOpen(false);
      setAdminForm({ full_name: '', email: '' });
    } catch (error: any) {
      toast({ title: 'Erreur', description: error.message || 'Impossible de créer le compte', variant: 'destructive' });
    } finally {
      setCreatingAdmin(false);
    }
  };

  const getExpiryStatus = (lic: License) => {
    if (!lic.is_active) return { label: 'Désactivée', variant: 'secondary' as const };
    const days = differenceInDays(parseISO(lic.expiry_date), new Date());
    if (days < 0) return { label: 'Expirée', variant: 'destructive' as const };
    if (days < 30) return { label: `${days}j restants`, variant: 'outline' as const };
    return { label: 'Active', variant: 'default' as const };
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Gestion des Licences
            </CardTitle>
            <CardDescription>Gérez les licences multi-cliniques, les limites d'utilisateurs et les modules activés</CardDescription>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreate} className="gap-2">
                <Plus className="h-4 w-4" />
                Nouvelle Licence
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editing ? 'Modifier la licence' : 'Nouvelle licence'}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nom de la clinique *</Label>
                    <Input value={form.clinic_name} onChange={e => setForm(f => ({ ...f, clinic_name: e.target.value }))} placeholder="Clinique XYZ" />
                  </div>
                  <div className="space-y-2">
                    <Label>Max utilisateurs</Label>
                    <Input type="number" min={1} value={form.max_users} onChange={e => setForm(f => ({ ...f, max_users: parseInt(e.target.value) || 1 }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date de début</Label>
                    <Input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Date d'expiration</Label>
                    <Input type="date" value={form.expiry_date} onChange={e => setForm(f => ({ ...f, expiry_date: e.target.value }))} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Modules activés</Label>
                  <div className="grid grid-cols-2 gap-2 p-3 border rounded-md bg-muted/30">
                    {ALL_MODULES.map(mod => (
                      <label key={mod.value} className="flex items-center gap-2 cursor-pointer text-sm">
                        <Checkbox
                          checked={form.enabled_modules.includes(mod.value)}
                          onCheckedChange={() => toggleModule(mod.value)}
                        />
                        {mod.label}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
                  <Label>Licence active</Label>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Contact</Label>
                    <Input value={form.contact_name} onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))} placeholder="Nom" />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input value={form.contact_email} onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))} placeholder="email@clinique.com" />
                  </div>
                  <div className="space-y-2">
                    <Label>Téléphone</Label>
                    <Input value={form.contact_phone} onChange={e => setForm(f => ({ ...f, contact_phone: e.target.value }))} placeholder="+235..." />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Remarques..." />
                </div>

                <Button onClick={handleSubmit} disabled={!form.clinic_name || createLicense.isPending || updateLicense.isPending}>
                  {editing ? 'Enregistrer' : 'Créer la licence'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <Card className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building2 className="h-4 w-4" />
                Total licences
              </div>
              <p className="text-2xl font-bold mt-1">{licenses.length}</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4 text-green-500" />
                Actives
              </div>
              <p className="text-2xl font-bold mt-1 text-green-600">{licenses.filter(l => l.is_active && differenceInDays(parseISO(l.expiry_date), new Date()) >= 0).length}</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4 text-orange-500" />
                Expirant bientôt
              </div>
              <p className="text-2xl font-bold mt-1 text-orange-600">{licenses.filter(l => { const d = differenceInDays(parseISO(l.expiry_date), new Date()); return d >= 0 && d < 30; }).length}</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                Total utilisateurs
              </div>
              <p className="text-2xl font-bold mt-1">{licenses.reduce((sum, l) => sum + l.current_users, 0)} / {licenses.reduce((sum, l) => sum + l.max_users, 0)}</p>
            </Card>
          </div>

          {isLoading ? (
            <p className="text-muted-foreground text-center py-8">Chargement...</p>
          ) : licenses.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Aucune licence configurée</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Clinique</TableHead>
                  <TableHead>Clé</TableHead>
                  <TableHead>Utilisateurs</TableHead>
                  <TableHead>Modules</TableHead>
                  <TableHead>Expiration</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {licenses.map(lic => {
                  const status = getExpiryStatus(lic);
                  return (
                    <TableRow key={lic.id}>
                      <TableCell className="font-medium">{lic.clinic_name}</TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">{lic.license_key}</code>
                      </TableCell>
                      <TableCell>{lic.current_users} / {lic.max_users}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {lic.enabled_modules.slice(0, 3).map(m => (
                            <Badge key={m} variant="outline" className="text-xs">{m}</Badge>
                          ))}
                          {lic.enabled_modules.length > 3 && (
                            <Badge variant="outline" className="text-xs">+{lic.enabled_modules.length - 3}</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{format(parseISO(lic.expiry_date), 'dd MMM yyyy', { locale: fr })}</TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => openAdminDialog(lic)} title="Créer l'administrateur">
                            <UserPlus className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => openEdit(lic)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => deleteLicense.mutate(lic.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog to create clinic admin */}
      <Dialog open={adminDialogOpen} onOpenChange={setAdminDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Créer l'administrateur de {selectedLicense?.clinic_name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Cet administrateur pourra se connecter, configurer sa clinique et créer ses propres utilisateurs.
            </p>
            <div className="space-y-2">
              <Label>Nom complet *</Label>
              <Input
                value={adminForm.full_name}
                onChange={e => setAdminForm(f => ({ ...f, full_name: e.target.value }))}
                placeholder="Dr. Jean Dupont"
              />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                value={adminForm.email}
                onChange={e => setAdminForm(f => ({ ...f, email: e.target.value }))}
                placeholder="admin@clinique.com"
              />
            </div>
            <p className="text-xs text-muted-foreground">Un email d'invitation sera envoyé à l'administrateur avec un lien pour définir son mot de passe et accéder à sa clinique.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdminDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleCreateAdmin} disabled={creatingAdmin}>
              {creatingAdmin && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Créer l'administrateur
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

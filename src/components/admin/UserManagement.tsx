import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { getRoleLabel, getRoleColor } from '@/config/navigation';
import { SPECIALTIES, getSpecialtyLabel } from '@/config/specialties';
import { UserRole } from '@/types';
import { UserPlus, Shield, Loader2, Search } from 'lucide-react';
import { z } from 'zod';

interface UserWithRole {
  user_id: string;
  email: string;
  full_name: string;
  role: UserRole | null;
  specialty: string | null;
  created_at: string;
}

const ROLES: UserRole[] = ['admin', 'accueil', 'medecin', 'infirmier', 'caissier', 'pharmacien', 'laborantin', 'imagerie'];

export function UserManagement() {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('accueil');
  const [newSpecialty, setNewSpecialty] = useState('');
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const [{ data: profiles, error: pErr }, { data: roles, error: rErr }] = await Promise.all([
        supabase.from('profiles').select('user_id, email, full_name, specialty, created_at'),
        supabase.from('user_roles').select('user_id, role'),
      ]);
      if (pErr) throw pErr;
      if (rErr) throw rErr;

      const rolesMap = new Map(roles?.map(r => [r.user_id, r.role as UserRole]));
      setUsers((profiles || []).map(p => ({
        user_id: p.user_id,
        email: p.email,
        full_name: p.full_name,
        role: rolesMap.get(p.user_id) || null,
        specialty: (p as any).specialty || null,
        created_at: p.created_at,
      })));
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreateUser = async () => {
    if (!newEmail || !newFullName || !newPassword) {
      toast({ title: 'Erreur', description: 'Tous les champs sont requis', variant: 'destructive' });
      return;
    }
    try { z.string().email().parse(newEmail); } catch {
      toast({ title: 'Erreur', description: 'Email invalide', variant: 'destructive' }); return;
    }
    if (newPassword.length < 6) {
      toast({ title: 'Erreur', description: 'Mot de passe : 6 caractères minimum', variant: 'destructive' }); return;
    }

    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: { email: newEmail, password: newPassword, full_name: newFullName, role: newRole, specialty: newRole === 'medecin' ? newSpecialty : undefined },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({ title: 'Succès', description: data?.message || `Compte créé pour ${newFullName}. Un email de réinitialisation du mot de passe a été envoyé.` });
      setDialogOpen(false);
      setNewEmail(''); setNewFullName(''); setNewPassword(''); setNewRole('accueil'); setNewSpecialty('');
      fetchUsers();
    } catch (error: any) {
      toast({ title: 'Erreur', description: error.message || 'Impossible de créer le compte', variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const handleChangeRole = async (userId: string, role: UserRole) => {
    try {
      const { data: existing } = await supabase.from('user_roles').select('id').eq('user_id', userId).single();
      if (existing) {
        const { error } = await supabase.from('user_roles').update({ role }).eq('user_id', userId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('user_roles').insert({ user_id: userId, role });
        if (error) throw error;
      }
      toast({ title: 'Rôle mis à jour' });
      fetchUsers();
    } catch (error: any) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    }
  };

  const filtered = users.filter(u =>
    u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Utilisateurs ({users.length})
        </CardTitle>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 w-full sm:w-[220px]"
            />
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><UserPlus className="h-4 w-4 mr-2" />Créer un compte</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer un nouveau compte</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Nom complet</Label>
                  <Input value={newFullName} onChange={e => setNewFullName(e.target.value)} placeholder="Dr. Jean Dupont" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="jean@hopital.com" />
                </div>
                <div className="space-y-2">
                  <Label>Mot de passe</Label>
                  <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••" />
                </div>
                <div className="space-y-2">
                  <Label>Rôle</Label>
                  <Select value={newRole} onValueChange={v => setNewRole(v as UserRole)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ROLES.map(r => (
                        <SelectItem key={r} value={r}>{getRoleLabel(r)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {newRole === 'medecin' && (
                  <div className="space-y-2">
                    <Label>Spécialité *</Label>
                    <Select value={newSpecialty} onValueChange={setNewSpecialty}>
                      <SelectTrigger><SelectValue placeholder="Choisir une spécialité" /></SelectTrigger>
                      <SelectContent>
                        {SPECIALTIES.map(s => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
                <Button onClick={handleCreateUser} disabled={creating}>
                  {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Créer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
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
                  <TableHead>Nom</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rôle actuel</TableHead>
                  <TableHead>Spécialité</TableHead>
                  <TableHead>Changer le rôle</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                   <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      Aucun utilisateur trouvé
                    </TableCell>
                  </TableRow>
                ) : filtered.map(u => (
                  <TableRow key={u.user_id}>
                    <TableCell className="font-medium">{u.full_name}</TableCell>
                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                    <TableCell>
                      {u.role ? (
                        <Badge className={`${getRoleColor(u.role)} text-white`}>
                          {getRoleLabel(u.role)}
                        </Badge>
                      ) : (
                        <Badge variant="outline">Aucun rôle</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {u.role === 'medecin' && u.specialty ? (
                        <Badge variant="outline">{getSpecialtyLabel(u.specialty)}</Badge>
                      ) : u.role === 'medecin' ? (
                        <span className="text-xs text-muted-foreground">Non définie</span>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      <Select value={u.role || ''} onValueChange={v => handleChangeRole(u.user_id, v as UserRole)}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Assigner un rôle" />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLES.map(r => (
                            <SelectItem key={r} value={r}>{getRoleLabel(r)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

import { useState, useEffect } from 'react';
import { AppLayout, PageHeader } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/types';
import { 
  Plus, 
  Search, 
  Loader2, 
  Users,
  Shield,
  Edit,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserWithRole {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  role: UserRole;
  created_at: string;
}

const roleLabels: Record<UserRole, string> = {
  admin: 'Administrateur',
  accueil: 'Accueil',
  medecin: 'Médecin',
  infirmier: 'Infirmier(ère)',
  caissier: 'Caissier(ère)',
  pharmacien: 'Pharmacien(ne)',
  laborantin: 'Laborantin(e)',
  imagerie: 'Technicien Imagerie',
};

const roleColors: Record<UserRole, string> = {
  admin: 'bg-purple-500/10 text-purple-500',
  accueil: 'bg-blue-500/10 text-blue-500',
  medecin: 'bg-teal-500/10 text-teal-500',
  infirmier: 'bg-pink-500/10 text-pink-500',
  caissier: 'bg-amber-500/10 text-amber-500',
  pharmacien: 'bg-green-500/10 text-green-500',
  laborantin: 'bg-indigo-500/10 text-indigo-500',
  imagerie: 'bg-cyan-500/10 text-cyan-500',
};

const roleDescriptions: Record<UserRole, string> = {
  admin: 'Paramétrage, reporting, gestion utilisateurs',
  accueil: 'Création patient, carte QR, orientation',
  medecin: 'Consultation, prescriptions, demandes examens',
  infirmier: 'Soins, suivi patient',
  caissier: 'Facturation, encaissement',
  pharmacien: 'Délivrance médicaments',
  laborantin: 'Analyses et résultats',
  imagerie: 'Examens imagerie',
};

const UserManagement = () => {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // New User Dialog
  const [showNewUser, setShowNewUser] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'accueil' as UserRole
  });
  const [saving, setSaving] = useState(false);

  // Edit Role Dialog
  const [showEditRole, setShowEditRole] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithRole | null>(null);
  const [newRole, setNewRole] = useState<UserRole>('accueil');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Fetch profiles with their roles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profiles) {
        // Fetch roles for these users
        const userIds = profiles.map(p => p.user_id);
        const { data: roles } = await supabase
          .from('user_roles')
          .select('*')
          .in('user_id', userIds);

        const rolesMap: Record<string, UserRole> = {};
        roles?.forEach(r => { rolesMap[r.user_id] = r.role as UserRole; });

        const usersWithRoles: UserWithRole[] = profiles.map(p => ({
          id: p.id,
          user_id: p.user_id,
          full_name: p.full_name,
          email: p.email,
          role: rolesMap[p.user_id] || 'accueil',
          created_at: p.created_at
        }));

        setUsers(usersWithRoles);
      }
    } catch (error: any) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const createUser = async () => {
    if (!newUserForm.email || !newUserForm.password || !newUserForm.full_name) {
      toast({ title: 'Erreur', description: 'Veuillez remplir tous les champs', variant: 'destructive' });
      return;
    }

    if (newUserForm.password.length < 6) {
      toast({ title: 'Erreur', description: 'Le mot de passe doit contenir au moins 6 caractères', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      // Create user via signup
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUserForm.email,
        password: newUserForm.password,
        options: {
          data: { full_name: newUserForm.full_name }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Erreur lors de la création du compte');

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: authData.user.id,
          full_name: newUserForm.full_name,
          email: newUserForm.email
        });

      if (profileError) throw profileError;

      // Create role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: authData.user.id,
          role: newUserForm.role
        });

      if (roleError) throw roleError;

      toast({ 
        title: 'Succès', 
        description: `Compte créé pour ${newUserForm.full_name}. Un email de confirmation a été envoyé.` 
      });
      
      setShowNewUser(false);
      setNewUserForm({ email: '', password: '', full_name: '', role: 'accueil' });
      fetchUsers();
    } catch (error: any) {
      if (error.message.includes('already registered')) {
        toast({ title: 'Erreur', description: 'Cet email est déjà utilisé', variant: 'destructive' });
      } else {
        toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
      }
    } finally {
      setSaving(false);
    }
  };

  const openEditRole = (user: UserWithRole) => {
    setEditingUser(user);
    setNewRole(user.role);
    setShowEditRole(true);
  };

  const updateRole = async () => {
    if (!editingUser) return;

    setSaving(true);
    try {
      // Delete existing role and insert new one
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', editingUser.user_id);

      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: editingUser.user_id,
          role: newRole
        });

      if (error) throw error;

      toast({ title: 'Succès', description: 'Rôle mis à jour' });
      setShowEditRole(false);
      fetchUsers();
    } catch (error: any) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const roleStats = Object.keys(roleLabels).map(role => ({
    role: role as UserRole,
    count: users.filter(u => u.role === role).length
  }));

  return (
    <AppLayout>
      <div className="p-6 lg:p-8">
        <div className="flex items-center justify-between mb-6">
          <PageHeader
            title="Gestion des utilisateurs"
            description="Créer et gérer les comptes du personnel"
          />
          <Button onClick={() => setShowNewUser(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau compte
          </Button>
        </div>

        {/* Role Stats */}
        <div className="grid gap-4 sm:grid-cols-4 lg:grid-cols-8 mb-8">
          {roleStats.map(({ role, count }) => (
            <Card key={role}>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground truncate">
                  {roleLabels[role]}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{count}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher un utilisateur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 max-w-md"
          />
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Utilisateurs ({users.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Date de création</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-primary/10 text-primary text-sm">
                              {user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{user.full_name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn('text-xs', roleColors[user.role])}>
                          <Shield className="h-3 w-3 mr-1" />
                          {roleLabels[user.role]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => openEditRole(user)}
                          disabled={user.user_id === currentUser?.id}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* New User Dialog */}
        <Dialog open={showNewUser} onOpenChange={setShowNewUser}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer un compte utilisateur</DialogTitle>
              <DialogDescription>
                L'utilisateur recevra un email de confirmation
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nom complet *</Label>
                <Input
                  value={newUserForm.full_name}
                  onChange={(e) => setNewUserForm({ ...newUserForm, full_name: e.target.value })}
                  placeholder="Jean Dupont"
                />
              </div>

              <div className="space-y-2">
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  placeholder="jean@clinique.td"
                />
              </div>

              <div className="space-y-2">
                <Label>Mot de passe *</Label>
                <Input
                  type="password"
                  value={newUserForm.password}
                  onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                  placeholder="••••••••"
                />
                <p className="text-xs text-muted-foreground">Minimum 6 caractères</p>
              </div>

              <div className="space-y-2">
                <Label>Rôle *</Label>
                <Select 
                  value={newUserForm.role} 
                  onValueChange={(v: UserRole) => setNewUserForm({ ...newUserForm, role: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(roleLabels).map(([role, label]) => (
                      <SelectItem key={role} value={role}>
                        <div className="flex flex-col">
                          <span>{label}</span>
                          <span className="text-xs text-muted-foreground">
                            {roleDescriptions[role as UserRole]}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewUser(false)}>
                Annuler
              </Button>
              <Button onClick={createUser} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Créer le compte
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Role Dialog */}
        <Dialog open={showEditRole} onOpenChange={setShowEditRole}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Modifier le rôle</DialogTitle>
              <DialogDescription>
                {editingUser?.full_name}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nouveau rôle</Label>
                <Select value={newRole} onValueChange={(v: UserRole) => setNewRole(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(roleLabels).map(([role, label]) => (
                      <SelectItem key={role} value={role}>
                        <div className="flex flex-col">
                          <span>{label}</span>
                          <span className="text-xs text-muted-foreground">
                            {roleDescriptions[role as UserRole]}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditRole(false)}>
                Annuler
              </Button>
              <Button onClick={updateRole} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Mettre à jour
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default UserManagement;

import { useState, useEffect } from 'react';
import { AppLayout, PageHeader } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { 
  Plus, 
  Loader2, 
  Settings as SettingsIcon,
  FileText,
  Edit,
  Trash2
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface MedicalAct {
  id: string;
  code: string;
  name: string;
  category: string;
  unit_price: number;
  description: string | null;
}

const Settings = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [medicalActs, setMedicalActs] = useState<MedicalAct[]>([]);

  // Act Dialog
  const [showActDialog, setShowActDialog] = useState(false);
  const [editingAct, setEditingAct] = useState<MedicalAct | null>(null);
  const [actForm, setActForm] = useState({
    code: '',
    name: '',
    category: 'consultation',
    unit_price: 0,
    description: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('medical_acts')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });
      setMedicalActs(data || []);
    } catch (error: any) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const openNewAct = () => {
    setEditingAct(null);
    setActForm({
      code: '',
      name: '',
      category: 'consultation',
      unit_price: 0,
      description: ''
    });
    setShowActDialog(true);
  };

  const openEditAct = (act: MedicalAct) => {
    setEditingAct(act);
    setActForm({
      code: act.code,
      name: act.name,
      category: act.category,
      unit_price: act.unit_price,
      description: act.description || ''
    });
    setShowActDialog(true);
  };

  const saveAct = async () => {
    if (!actForm.code || !actForm.name) {
      toast({ title: 'Erreur', description: 'Veuillez remplir les champs obligatoires', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const data = {
        code: actForm.code,
        name: actForm.name,
        category: actForm.category,
        unit_price: actForm.unit_price,
        description: actForm.description || null
      };

      if (editingAct) {
        const { error } = await supabase
          .from('medical_acts')
          .update(data)
          .eq('id', editingAct.id);
        if (error) throw error;
        toast({ title: 'Succès', description: 'Acte médical mis à jour' });
      } else {
        const { error } = await supabase
          .from('medical_acts')
          .insert(data);
        if (error) throw error;
        toast({ title: 'Succès', description: 'Acte médical créé' });
      }

      setShowActDialog(false);
      fetchData();
    } catch (error: any) {
      if (error.message.includes('unique')) {
        toast({ title: 'Erreur', description: 'Ce code existe déjà', variant: 'destructive' });
      } else {
        toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
      }
    } finally {
      setSaving(false);
    }
  };

  const deleteAct = async (id: string) => {
    if (!confirm('Supprimer cet acte médical ?')) return;

    try {
      const { error } = await supabase
        .from('medical_acts')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast({ title: 'Supprimé' });
      fetchData();
    } catch (error: any) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    }
  };

  const categoryLabels = {
    consultation: 'Consultation',
    analyse: 'Analyse',
    imagerie: 'Imagerie',
    soins: 'Soins',
    autre: 'Autre'
  };

  return (
    <AppLayout>
      <div className="p-6 lg:p-8">
        <PageHeader
          title="Paramètres"
          description="Configuration du système"
        />

        <Tabs defaultValue="acts" className="mt-6">
          <TabsList>
            <TabsTrigger value="acts">Actes médicaux</TabsTrigger>
            <TabsTrigger value="general">Général</TabsTrigger>
          </TabsList>

          <TabsContent value="acts" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Actes médicaux et tarifs
                  </CardTitle>
                  <CardDescription>
                    Définir les prestations et leurs prix pour la facturation
                  </CardDescription>
                </div>
                <Button onClick={openNewAct}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvel acte
                </Button>
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
                        <TableHead>Code</TableHead>
                        <TableHead>Nom</TableHead>
                        <TableHead>Catégorie</TableHead>
                        <TableHead className="text-right">Prix</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {medicalActs.map((act) => (
                        <TableRow key={act.id}>
                          <TableCell className="font-mono">{act.code}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{act.name}</p>
                              {act.description && (
                                <p className="text-sm text-muted-foreground">{act.description}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {categoryLabels[act.category as keyof typeof categoryLabels]}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {act.unit_price.toLocaleString()} FCFA
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => openEditAct(act)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => deleteAct(act.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {medicalActs.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            Aucun acte médical configuré
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="general" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SettingsIcon className="h-5 w-5" />
                  Paramètres généraux
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Configuration générale de l'application (à venir)
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Act Dialog */}
        <Dialog open={showActDialog} onOpenChange={setShowActDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingAct ? 'Modifier l\'acte médical' : 'Nouvel acte médical'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Code *</Label>
                  <Input
                    value={actForm.code}
                    onChange={(e) => setActForm({ ...actForm, code: e.target.value.toUpperCase() })}
                    placeholder="CONS-GEN"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Catégorie *</Label>
                  <Select 
                    value={actForm.category} 
                    onValueChange={(v) => setActForm({ ...actForm, category: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="consultation">Consultation</SelectItem>
                      <SelectItem value="analyse">Analyse</SelectItem>
                      <SelectItem value="imagerie">Imagerie</SelectItem>
                      <SelectItem value="soins">Soins</SelectItem>
                      <SelectItem value="autre">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Nom *</Label>
                <Input
                  value={actForm.name}
                  onChange={(e) => setActForm({ ...actForm, name: e.target.value })}
                  placeholder="Consultation générale"
                />
              </div>

              <div className="space-y-2">
                <Label>Prix (FCFA) *</Label>
                <Input
                  type="number"
                  value={actForm.unit_price}
                  onChange={(e) => setActForm({ ...actForm, unit_price: Number(e.target.value) })}
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={actForm.description}
                  onChange={(e) => setActForm({ ...actForm, description: e.target.value })}
                  placeholder="Description optionnelle..."
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowActDialog(false)}>
                Annuler
              </Button>
              <Button onClick={saveAct} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {editingAct ? 'Mettre à jour' : 'Créer'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default Settings;

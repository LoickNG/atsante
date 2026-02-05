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
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { 
  Plus, 
  Search, 
  Loader2, 
  Package,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Edit
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Medication {
  id: string;
  name: string;
  generic_name: string | null;
  category: string;
  form: string;
  dosage_unit: string;
  stock_quantity: number;
  alert_threshold: number;
  unit_price: number;
  expiry_date: string | null;
}

interface StockMovement {
  id: string;
  medication_id: string;
  quantity: number;
  type: string;
  reason: string | null;
  created_at: string;
  medication?: { name: string };
}

const StockManagement = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // New Medication Dialog
  const [showNewMed, setShowNewMed] = useState(false);
  const [editingMed, setEditingMed] = useState<Medication | null>(null);
  const [medForm, setMedForm] = useState({
    name: '',
    generic_name: '',
    category: '',
    form: 'comprimé' as const,
    dosage_unit: '',
    stock_quantity: 0,
    alert_threshold: 10,
    unit_price: 0,
    expiry_date: ''
  });
  const [saving, setSaving] = useState(false);

  // Stock Movement Dialog
  const [showMovement, setShowMovement] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState<string>('');
  const [movementType, setMovementType] = useState<'entree' | 'sortie' | 'ajustement'>('entree');
  const [movementQuantity, setMovementQuantity] = useState(0);
  const [movementReason, setMovementReason] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: medsData } = await supabase
        .from('medications')
        .select('*')
        .order('name');
      setMedications(medsData || []);

      const { data: movementsData } = await supabase
        .from('stock_movements')
        .select('*, medications(name)')
        .order('created_at', { ascending: false })
        .limit(50);
      
      setMovements(movementsData?.map(m => ({
        ...m,
        medication: m.medications
      })) || []);
    } catch (error: any) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const openNewMed = () => {
    setEditingMed(null);
    setMedForm({
      name: '',
      generic_name: '',
      category: '',
      form: 'comprimé',
      dosage_unit: '',
      stock_quantity: 0,
      alert_threshold: 10,
      unit_price: 0,
      expiry_date: ''
    });
    setShowNewMed(true);
  };

  const openEditMed = (med: Medication) => {
    setEditingMed(med);
    setMedForm({
      name: med.name,
      generic_name: med.generic_name || '',
      category: med.category,
      form: med.form as any,
      dosage_unit: med.dosage_unit,
      stock_quantity: med.stock_quantity,
      alert_threshold: med.alert_threshold,
      unit_price: med.unit_price,
      expiry_date: med.expiry_date || ''
    });
    setShowNewMed(true);
  };

  const saveMedication = async () => {
    if (!medForm.name || !medForm.category || !medForm.dosage_unit) {
      toast({ title: 'Erreur', description: 'Veuillez remplir les champs obligatoires', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const data = {
        name: medForm.name,
        generic_name: medForm.generic_name || null,
        category: medForm.category,
        form: medForm.form,
        dosage_unit: medForm.dosage_unit,
        stock_quantity: medForm.stock_quantity,
        alert_threshold: medForm.alert_threshold,
        unit_price: medForm.unit_price,
        expiry_date: medForm.expiry_date || null
      };

      if (editingMed) {
        const { error } = await supabase
          .from('medications')
          .update(data)
          .eq('id', editingMed.id);
        if (error) throw error;
        toast({ title: 'Succès', description: 'Médicament mis à jour' });
      } else {
        const { error } = await supabase
          .from('medications')
          .insert(data);
        if (error) throw error;
        toast({ title: 'Succès', description: 'Médicament ajouté' });
      }

      setShowNewMed(false);
      fetchData();
    } catch (error: any) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const createMovement = async () => {
    if (!selectedMedication || movementQuantity <= 0) {
      toast({ title: 'Erreur', description: 'Veuillez remplir tous les champs', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const med = medications.find(m => m.id === selectedMedication);
      if (!med) throw new Error('Médicament non trouvé');

      let newQuantity = med.stock_quantity;
      let adjustedQuantity = movementQuantity;

      if (movementType === 'entree') {
        newQuantity += movementQuantity;
      } else if (movementType === 'sortie') {
        newQuantity -= movementQuantity;
        adjustedQuantity = -movementQuantity;
        if (newQuantity < 0) {
          toast({ title: 'Erreur', description: 'Stock insuffisant', variant: 'destructive' });
          setSaving(false);
          return;
        }
      } else {
        newQuantity = movementQuantity;
        adjustedQuantity = movementQuantity - med.stock_quantity;
      }

      // Create movement
      const { error: movementError } = await supabase
        .from('stock_movements')
        .insert({
          medication_id: selectedMedication,
          quantity: adjustedQuantity,
          type: movementType,
          reason: movementReason || null,
          performed_by: user?.id
        });

      if (movementError) throw movementError;

      // Update stock
      const { error: updateError } = await supabase
        .from('medications')
        .update({ stock_quantity: newQuantity })
        .eq('id', selectedMedication);

      if (updateError) throw updateError;

      toast({ title: 'Succès', description: 'Mouvement de stock enregistré' });
      setShowMovement(false);
      setSelectedMedication('');
      setMovementQuantity(0);
      setMovementReason('');
      fetchData();
    } catch (error: any) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const filteredMedications = medications.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.generic_name && m.generic_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const lowStockCount = medications.filter(m => m.stock_quantity <= m.alert_threshold).length;
  const outOfStockCount = medications.filter(m => m.stock_quantity === 0).length;

  const formLabels = {
    comprimé: 'Comprimé',
    sirop: 'Sirop',
    injectable: 'Injectable',
    pommade: 'Pommade',
    gouttes: 'Gouttes',
    autre: 'Autre'
  };

  return (
    <AppLayout>
      <div className="p-6 lg:p-8">
        <div className="flex items-center justify-between mb-6">
          <PageHeader
            title="Gestion des stocks"
            description="Médicaments et mouvements de stock"
          />
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowMovement(true)}>
              <ArrowUp className="h-4 w-4 mr-2" />
              Mouvement
            </Button>
            <Button onClick={openNewMed}>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau médicament
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total références
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{medications.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Stock faible
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-warning">{lowStockCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Rupture
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">{outOfStockCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Valeur stock
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {medications.reduce((sum, m) => sum + (m.stock_quantity * m.unit_price), 0).toLocaleString()} FCFA
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher un médicament..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 max-w-md"
          />
        </div>

        {/* Medications Table */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Médicaments</CardTitle>
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
                    <TableHead>Nom</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Forme</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead className="text-right">Prix unit.</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMedications.map((med) => {
                    const isLowStock = med.stock_quantity <= med.alert_threshold && med.stock_quantity > 0;
                    const isOutOfStock = med.stock_quantity === 0;

                    return (
                      <TableRow key={med.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{med.name}</p>
                            {med.generic_name && (
                              <p className="text-sm text-muted-foreground">{med.generic_name}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{med.category}</TableCell>
                        <TableCell>{formLabels[med.form as keyof typeof formLabels]}</TableCell>
                        <TableCell className="text-right font-mono">
                          {med.stock_quantity} {med.dosage_unit}
                        </TableCell>
                        <TableCell className="text-right">
                          {med.unit_price.toLocaleString()} FCFA
                        </TableCell>
                        <TableCell>
                          {isOutOfStock ? (
                            <Badge variant="destructive" className="text-xs">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Rupture
                            </Badge>
                          ) : isLowStock ? (
                            <Badge variant="outline" className="text-xs bg-warning/10 text-warning-foreground">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Stock faible
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs bg-success/10 text-success">
                              En stock
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => openEditMed(med)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Recent Movements */}
        <Card>
          <CardHeader>
            <CardTitle>Mouvements récents</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Médicament</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Quantité</TableHead>
                  <TableHead>Motif</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.slice(0, 10).map((mov) => (
                  <TableRow key={mov.id}>
                    <TableCell>
                      {new Date(mov.created_at).toLocaleString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </TableCell>
                    <TableCell>{mov.medication?.name || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn(
                        'text-xs',
                        mov.type === 'entree' && 'bg-success/10 text-success',
                        mov.type === 'sortie' && 'bg-destructive/10 text-destructive',
                        mov.type === 'ajustement' && 'bg-info/10 text-info'
                      )}>
                        {mov.type === 'entree' ? 'Entrée' : mov.type === 'sortie' ? 'Sortie' : 'Ajustement'}
                      </Badge>
                    </TableCell>
                    <TableCell className={cn(
                      'text-right font-mono',
                      mov.quantity > 0 ? 'text-success' : 'text-destructive'
                    )}>
                      {mov.quantity > 0 ? '+' : ''}{mov.quantity}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{mov.reason || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* New/Edit Medication Dialog */}
        <Dialog open={showNewMed} onOpenChange={setShowNewMed}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingMed ? 'Modifier le médicament' : 'Nouveau médicament'}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nom *</Label>
                  <Input
                    value={medForm.name}
                    onChange={(e) => setMedForm({ ...medForm, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nom générique</Label>
                  <Input
                    value={medForm.generic_name}
                    onChange={(e) => setMedForm({ ...medForm, generic_name: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Catégorie *</Label>
                  <Input
                    value={medForm.category}
                    onChange={(e) => setMedForm({ ...medForm, category: e.target.value })}
                    placeholder="Antibiotique, Antalgique..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Forme *</Label>
                  <Select 
                    value={medForm.form} 
                    onValueChange={(v: any) => setMedForm({ ...medForm, form: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="comprimé">Comprimé</SelectItem>
                      <SelectItem value="sirop">Sirop</SelectItem>
                      <SelectItem value="injectable">Injectable</SelectItem>
                      <SelectItem value="pommade">Pommade</SelectItem>
                      <SelectItem value="gouttes">Gouttes</SelectItem>
                      <SelectItem value="autre">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Unité de dosage *</Label>
                  <Input
                    value={medForm.dosage_unit}
                    onChange={(e) => setMedForm({ ...medForm, dosage_unit: e.target.value })}
                    placeholder="mg, ml, unités..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Prix unitaire (FCFA) *</Label>
                  <Input
                    type="number"
                    value={medForm.unit_price}
                    onChange={(e) => setMedForm({ ...medForm, unit_price: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Stock initial</Label>
                  <Input
                    type="number"
                    value={medForm.stock_quantity}
                    onChange={(e) => setMedForm({ ...medForm, stock_quantity: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Seuil d'alerte</Label>
                  <Input
                    type="number"
                    value={medForm.alert_threshold}
                    onChange={(e) => setMedForm({ ...medForm, alert_threshold: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date d'expiration</Label>
                  <Input
                    type="date"
                    value={medForm.expiry_date}
                    onChange={(e) => setMedForm({ ...medForm, expiry_date: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewMed(false)}>
                Annuler
              </Button>
              <Button onClick={saveMedication} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {editingMed ? 'Mettre à jour' : 'Créer'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Stock Movement Dialog */}
        <Dialog open={showMovement} onOpenChange={setShowMovement}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Mouvement de stock</DialogTitle>
              <DialogDescription>
                Enregistrer une entrée, sortie ou ajustement de stock
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Médicament</Label>
                <Select value={selectedMedication} onValueChange={setSelectedMedication}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    {medications.map((med) => (
                      <SelectItem key={med.id} value={med.id}>
                        {med.name} (Stock: {med.stock_quantity})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Type de mouvement</Label>
                <Select value={movementType} onValueChange={(v: any) => setMovementType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entree">Entrée (réapprovisionnement)</SelectItem>
                    <SelectItem value="sortie">Sortie (perte, casse...)</SelectItem>
                    <SelectItem value="ajustement">Ajustement (inventaire)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>
                  {movementType === 'ajustement' ? 'Nouveau stock' : 'Quantité'}
                </Label>
                <Input
                  type="number"
                  min="0"
                  value={movementQuantity}
                  onChange={(e) => setMovementQuantity(Number(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label>Motif</Label>
                <Input
                  value={movementReason}
                  onChange={(e) => setMovementReason(e.target.value)}
                  placeholder="Réapprovisionnement, inventaire, casse..."
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowMovement(false)}>
                Annuler
              </Button>
              <Button onClick={createMovement} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Enregistrer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default StockManagement;

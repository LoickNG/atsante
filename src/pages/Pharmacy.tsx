import { useState } from 'react';
import { AppLayout, PageHeader } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { 
  Search, Pill, Package, Plus, AlertTriangle, Check, Clock, FileText, User, Loader2,
  ArrowUpCircle, ArrowDownCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useMedications, useCreateMedication, useUpdateStock, Medication } from '@/hooks/useMedications';
import { usePendingPrescriptions, useDispensePrescription } from '@/hooks/usePrescriptions';
import { useAuth } from '@/hooks/useAuth';
import { PatientSearchSelect } from '@/components/PatientSearchSelect';
import { Patient } from '@/hooks/usePatients';
import { Link } from 'react-router-dom';

const FORMS = ['comprimé', 'sirop', 'injectable', 'pommade', 'gouttes', 'gélule', 'suppositoire', 'autre'];
const CATEGORIES = ['Antalgique', 'Antibiotique', 'Anti-inflammatoire', 'Antihypertenseur', 'Antidiabétique', 'Antipaludéen', 'Vitamine', 'Autre'];

const Pharmacy = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('prescriptions');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const { user } = useAuth();
  
  const { data: medications, isLoading: medsLoading } = useMedications();
  const { data: prescriptions, isLoading: prescLoading } = usePendingPrescriptions();
  const dispensePrescription = useDispensePrescription();
  const createMedication = useCreateMedication();
  const updateStock = useUpdateStock();

  const [addMedOpen, setAddMedOpen] = useState(false);
  const [medForm, setMedForm] = useState({
    name: '', generic_name: '', category: 'Autre', form: 'comprimé',
    dosage_unit: '', unit_price: '', stock_quantity: '', alert_threshold: '10', expiry_date: '',
  });

  const [stockDialogOpen, setStockDialogOpen] = useState(false);
  const [stockMedId, setStockMedId] = useState('');
  const [stockType, setStockType] = useState<'entree' | 'sortie'>('entree');
  const [stockQty, setStockQty] = useState('');
  const [stockReason, setStockReason] = useState('');

  const [reportOpen, setReportOpen] = useState(false);

  const allPendingPrescriptions = prescriptions?.filter((p: any) => !p.dispensed) || [];
  
  const pendingPrescriptions = selectedPatient
    ? allPendingPrescriptions.filter((p: any) => {
        const patient = p.consultations?.patients;
        return patient?.id === selectedPatient.id;
      })
    : allPendingPrescriptions;

  const lowStockMeds = (medications || []).filter(m => m.stock_quantity <= m.alert_threshold);

  const filteredMedications = (medications || []).filter(med => {
    const searchLower = searchQuery.toLowerCase();
    return (
      med.name.toLowerCase().includes(searchLower) ||
      (med.generic_name && med.generic_name.toLowerCase().includes(searchLower)) ||
      med.category.toLowerCase().includes(searchLower)
    );
  });

  const handleDispense = async (prescriptionId: string) => {
    if (!user?.id) { toast.error('Utilisateur non connecté'); return; }
    try {
      await dispensePrescription.mutateAsync({ id: prescriptionId, dispensedBy: user.id });
      toast.success('Médicament délivré avec succès');
    } catch { toast.error('Erreur lors de la délivrance'); }
  };

  const handleCreateMedication = async () => {
    if (!medForm.name || !medForm.dosage_unit || !medForm.unit_price) {
      toast.error('Veuillez remplir les champs obligatoires'); return;
    }
    try {
      await createMedication.mutateAsync({
        name: medForm.name,
        generic_name: medForm.generic_name || null,
        category: medForm.category,
        form: medForm.form,
        dosage_unit: medForm.dosage_unit,
        unit_price: parseFloat(medForm.unit_price),
        stock_quantity: parseInt(medForm.stock_quantity) || 0,
        alert_threshold: parseInt(medForm.alert_threshold) || 10,
        expiry_date: medForm.expiry_date || null,
      });
      toast.success('Médicament ajouté avec succès');
      setAddMedOpen(false);
      setMedForm({ name: '', generic_name: '', category: 'Autre', form: 'comprimé', dosage_unit: '', unit_price: '', stock_quantity: '', alert_threshold: '10', expiry_date: '' });
    } catch (e: any) {
      toast.error(e.message || 'Erreur lors de l\'ajout');
    }
  };

  const handleStockMovement = async () => {
    if (!stockMedId || !stockQty || !user?.id) {
      toast.error('Veuillez remplir tous les champs'); return;
    }
    try {
      await updateStock.mutateAsync({
        medicationId: stockMedId,
        quantity: parseInt(stockQty),
        type: stockType,
        reason: stockReason || undefined,
        performedBy: user.id,
      });
      toast.success('Mouvement de stock enregistré');
      setStockDialogOpen(false);
      setStockMedId(''); setStockQty(''); setStockReason('');
    } catch (e: any) {
      toast.error(e.message || 'Erreur');
    }
  };

  const openStockMovement = (medId: string, type: 'entree' | 'sortie') => {
    setStockMedId(medId);
    setStockType(type);
    setStockQty('');
    setStockReason('');
    setStockDialogOpen(true);
  };

  const getStockStatus = (med: Medication) => {
    const percentage = (med.stock_quantity / med.alert_threshold) * 100;
    if (percentage <= 50) return { label: 'Critique', className: 'bg-destructive text-destructive-foreground' };
    if (percentage <= 100) return { label: 'Faible', className: 'bg-warning text-warning-foreground' };
    return { label: 'Normal', className: 'bg-success text-success-foreground' };
  };

  const totalStockValue = (medications || []).reduce((sum, m) => sum + m.stock_quantity * Number(m.unit_price), 0);

  if (medsLoading || prescLoading) {
    return (<AppLayout><div className="p-6 lg:p-8"><div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></div></AppLayout>);
  }

  return (
    <AppLayout>
      <div className="p-6 lg:p-8">
        <PageHeader title="Pharmacie" description="Gestion des médicaments et délivrance">
          <Button variant="outline" size="default" className="gap-2" onClick={() => setReportOpen(true)}>
            <FileText className="h-4 w-4" />Rapport stock
          </Button>
          <Button size="default" className="gap-2" onClick={() => setAddMedOpen(true)}>
            <Plus className="h-4 w-4" />Nouveau médicament
          </Button>
        </PageHeader>

        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><Search className="h-4 w-4" />Rechercher un patient</CardTitle>
            <CardDescription>Sélectionnez un patient pour voir ses ordonnances à délivrer</CardDescription>
          </CardHeader>
          <CardContent>
            <PatientSearchSelect selectedPatient={selectedPatient} onSelect={setSelectedPatient} />
            {selectedPatient && (
              <div className="mt-3">
                <Button variant="link" size="sm" asChild className="p-0 h-auto">
                  <Link to={`/patients/${selectedPatient.id}`}>Voir le dossier complet →</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-4 mb-6">
          <Card><CardContent className="pt-4"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Ordonnances en attente</p><p className="text-2xl font-bold">{pendingPrescriptions.length}</p></div><Clock className="h-8 w-8 text-warning" /></div></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Délivrées aujourd'hui</p><p className="text-2xl font-bold">{prescriptions?.filter((p: any) => p.dispensed).length || 0}</p></div><Check className="h-8 w-8 text-success" /></div></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Stock faible</p><p className="text-2xl font-bold text-destructive">{lowStockMeds.length}</p></div><AlertTriangle className="h-8 w-8 text-destructive" /></div></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Total médicaments</p><p className="text-2xl font-bold">{medications?.length || 0}</p></div><Pill className="h-8 w-8 text-primary" /></div></CardContent></Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="prescriptions" className="gap-2">
              <FileText className="h-4 w-4" />Ordonnances
              {pendingPrescriptions.length > 0 && <Badge variant="destructive" className="ml-1 text-[10px]">{pendingPrescriptions.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="stock" className="gap-2"><Package className="h-4 w-4" />Stock</TabsTrigger>
          </TabsList>

          <TabsContent value="prescriptions">
            <Card>
              <CardHeader>
                <CardTitle>Ordonnances à délivrer</CardTitle>
                <CardDescription>
                  {selectedPatient ? `Ordonnances pour ${selectedPatient.first_name} ${selectedPatient.last_name}` : `${pendingPrescriptions.length} ordonnance(s) en attente`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingPrescriptions.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Check className="h-12 w-12 mx-auto mb-3 text-success" />
                    <p className="font-medium">{selectedPatient ? 'Aucune ordonnance en attente pour ce patient' : 'Toutes les ordonnances ont été délivrées'}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingPrescriptions.map((prescription: any) => {
                      const medication = prescription.medications;
                      const consultation = prescription.consultations;
                      const patient = consultation?.patients;
                      return (
                        <div key={prescription.id} className="flex items-center gap-4 p-4 border rounded-lg bg-card">
                          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Pill className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold">{medication?.name || prescription.medication_name || 'Médicament'}</p>
                              <Badge variant="outline" className="text-[10px]">{prescription.dosage}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{prescription.frequency} • {prescription.duration}</p>
                            {patient && (
                              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                <User className="h-3 w-3" />
                                <span>{patient.first_name} {patient.last_name}</span>
                                <span className="font-mono">({patient.code})</span>
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground mb-1">Qté: {prescription.quantity}</p>
                            {medication && (
                              <p className={cn('text-sm font-medium mb-2', medication.stock_quantity < 10 && 'text-destructive')}>Stock: {medication.stock_quantity}</p>
                            )}
                            <Button size="sm" onClick={() => handleDispense(prescription.id)}
                              disabled={dispensePrescription.isPending || (medication && medication.stock_quantity <= 0)} className="gap-1.5">
                              <Check className="h-4 w-4" />Délivrer
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stock">
            <div className="mb-4">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Rechercher un médicament..." className="pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
            </div>
            {lowStockMeds.length > 0 && (
              <Card className="mb-4 border-destructive/50 bg-destructive/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-destructive"><AlertTriangle className="h-5 w-5" />Alertes stock faible</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {lowStockMeds.map(med => (
                      <Badge key={med.id} variant="destructive" className="gap-1">{med.name}<span className="opacity-70">({med.stock_quantity})</span></Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Médicament</TableHead>
                      <TableHead>Catégorie</TableHead>
                      <TableHead>Forme</TableHead>
                      <TableHead>Prix unitaire</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMedications.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Aucun médicament trouvé</TableCell></TableRow>
                    ) : filteredMedications.map(med => {
                      const status = getStockStatus(med);
                      const stockPercentage = Math.min(100, (med.stock_quantity / (med.alert_threshold * 2)) * 100);
                      return (
                        <TableRow key={med.id}>
                          <TableCell>
                            <div><p className="font-medium">{med.name}</p>{med.generic_name && <p className="text-xs text-muted-foreground">{med.generic_name}</p>}</div>
                          </TableCell>
                          <TableCell><Badge variant="outline" className="text-xs">{med.category}</Badge></TableCell>
                          <TableCell className="capitalize">{med.form}</TableCell>
                          <TableCell>{Number(med.unit_price).toLocaleString()} FCFA</TableCell>
                          <TableCell>
                            <div className="w-32">
                              <div className="flex justify-between text-sm mb-1"><span>{med.stock_quantity}</span><span className="text-muted-foreground text-xs">min: {med.alert_threshold}</span></div>
                              <Progress value={stockPercentage} className={cn('h-1.5', stockPercentage <= 50 && '[&>div]:bg-destructive', stockPercentage > 50 && stockPercentage <= 100 && '[&>div]:bg-warning')} />
                            </div>
                          </TableCell>
                          <TableCell><Badge className={cn('text-[10px]', status.className)}>{status.label}</Badge></TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-success" title="Entrée stock" onClick={() => openStockMovement(med.id, 'entree')}>
                                <ArrowUpCircle className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" title="Sortie stock" onClick={() => openStockMovement(med.id, 'sortie')}>
                                <ArrowDownCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Medication Dialog */}
      <Dialog open={addMedOpen} onOpenChange={setAddMedOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nouveau médicament</DialogTitle>
            <DialogDescription>Ajoutez un médicament au catalogue</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Nom commercial *</Label><Input value={medForm.name} onChange={e => setMedForm(f => ({ ...f, name: e.target.value }))} placeholder="Paracétamol 500mg" /></div>
              <div className="space-y-1.5"><Label>Nom générique</Label><Input value={medForm.generic_name} onChange={e => setMedForm(f => ({ ...f, generic_name: e.target.value }))} placeholder="Acétaminophène" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Catégorie *</Label>
                <Select value={medForm.category} onValueChange={v => setMedForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Forme *</Label>
                <Select value={medForm.form} onValueChange={v => setMedForm(f => ({ ...f, form: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{FORMS.map(f => <SelectItem key={f} value={f} className="capitalize">{f}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5"><Label>Unité de dosage *</Label><Input value={medForm.dosage_unit} onChange={e => setMedForm(f => ({ ...f, dosage_unit: e.target.value }))} placeholder="mg, ml..." /></div>
              <div className="space-y-1.5"><Label>Prix unitaire (FCFA) *</Label><Input type="number" value={medForm.unit_price} onChange={e => setMedForm(f => ({ ...f, unit_price: e.target.value }))} placeholder="500" /></div>
              <div className="space-y-1.5"><Label>Stock initial</Label><Input type="number" value={medForm.stock_quantity} onChange={e => setMedForm(f => ({ ...f, stock_quantity: e.target.value }))} placeholder="0" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Seuil d'alerte</Label><Input type="number" value={medForm.alert_threshold} onChange={e => setMedForm(f => ({ ...f, alert_threshold: e.target.value }))} placeholder="10" /></div>
              <div className="space-y-1.5"><Label>Date d'expiration</Label><Input type="date" value={medForm.expiry_date} onChange={e => setMedForm(f => ({ ...f, expiry_date: e.target.value }))} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddMedOpen(false)}>Annuler</Button>
            <Button onClick={handleCreateMedication} disabled={createMedication.isPending}>
              {createMedication.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stock Movement Dialog */}
      <Dialog open={stockDialogOpen} onOpenChange={setStockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{stockType === 'entree' ? 'Entrée de stock' : 'Sortie de stock'}</DialogTitle>
            <DialogDescription>{stockType === 'entree' ? 'Ajoutez du stock' : 'Retirez du stock'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Médicament</Label>
              <p className="font-medium">{medications?.find(m => m.id === stockMedId)?.name || '-'}</p>
              <p className="text-sm text-muted-foreground">Stock actuel: {medications?.find(m => m.id === stockMedId)?.stock_quantity || 0}</p>
            </div>
            <div className="space-y-1.5"><Label>Quantité *</Label><Input type="number" min="1" value={stockQty} onChange={e => setStockQty(e.target.value)} placeholder="Quantité" /></div>
            <div className="space-y-1.5"><Label>Motif</Label><Input value={stockReason} onChange={e => setStockReason(e.target.value)} placeholder="Réapprovisionnement, inventaire..." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStockDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleStockMovement} disabled={updateStock.isPending} className={stockType === 'entree' ? 'bg-success hover:bg-success/90' : ''}>
              {updateStock.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {stockType === 'entree' ? 'Ajouter au stock' : 'Retirer du stock'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stock Report Dialog */}
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Rapport de stock</DialogTitle>
            <DialogDescription>Synthèse de l'état du stock pharmaceutique</DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold">{medications?.length || 0}</p><p className="text-sm text-muted-foreground">Références</p></CardContent></Card>
              <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold text-destructive">{lowStockMeds.length}</p><p className="text-sm text-muted-foreground">Stock faible</p></CardContent></Card>
              <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold">{totalStockValue.toLocaleString()}</p><p className="text-sm text-muted-foreground">Valeur (FCFA)</p></CardContent></Card>
            </div>
            {lowStockMeds.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2 text-destructive flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Médicaments en alerte</h3>
                <Table>
                  <TableHeader><TableRow><TableHead>Médicament</TableHead><TableHead className="text-right">Stock</TableHead><TableHead className="text-right">Seuil</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {lowStockMeds.map(m => (
                      <TableRow key={m.id}><TableCell className="font-medium">{m.name}</TableCell><TableCell className="text-right text-destructive font-bold">{m.stock_quantity}</TableCell><TableCell className="text-right">{m.alert_threshold}</TableCell></TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            <div>
              <h3 className="font-semibold mb-2">Stock par catégorie</h3>
              <Table>
                <TableHeader><TableRow><TableHead>Catégorie</TableHead><TableHead className="text-right">Nb réf.</TableHead><TableHead className="text-right">Stock</TableHead><TableHead className="text-right">Valeur</TableHead></TableRow></TableHeader>
                <TableBody>
                  {Object.entries(
                    (medications || []).reduce((acc, m) => {
                      if (!acc[m.category]) acc[m.category] = { count: 0, stock: 0, value: 0 };
                      acc[m.category].count++;
                      acc[m.category].stock += m.stock_quantity;
                      acc[m.category].value += m.stock_quantity * Number(m.unit_price);
                      return acc;
                    }, {} as Record<string, { count: number; stock: number; value: number }>)
                  ).map(([cat, data]) => (
                    <TableRow key={cat}><TableCell className="font-medium">{cat}</TableCell><TableCell className="text-right">{data.count}</TableCell><TableCell className="text-right">{data.stock}</TableCell><TableCell className="text-right">{data.value.toLocaleString()} FCFA</TableCell></TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Pharmacy;

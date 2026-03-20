import { useState } from 'react';
import { AppLayout, PageHeader } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Search, Pill, Package, Plus, AlertTriangle, Check, Clock, FileText, User, Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useMedications, Medication } from '@/hooks/useMedications';
import { usePendingPrescriptions, useDispensePrescription } from '@/hooks/usePrescriptions';
import { useAuth } from '@/hooks/useAuth';
import { PatientSearchSelect } from '@/components/PatientSearchSelect';
import { Patient } from '@/hooks/usePatients';
import { Link } from 'react-router-dom';

const Pharmacy = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('prescriptions');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const { user } = useAuth();
  
  const { data: medications, isLoading: medsLoading } = useMedications();
  const { data: prescriptions, isLoading: prescLoading } = usePendingPrescriptions();
  const dispensePrescription = useDispensePrescription();

  const allPendingPrescriptions = prescriptions?.filter((p: any) => !p.dispensed) || [];
  
  // Filter by selected patient
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

  const getStockStatus = (med: Medication) => {
    const percentage = (med.stock_quantity / med.alert_threshold) * 100;
    if (percentage <= 50) return { label: 'Critique', className: 'bg-destructive text-destructive-foreground' };
    if (percentage <= 100) return { label: 'Faible', className: 'bg-warning text-warning-foreground' };
    return { label: 'Normal', className: 'bg-success text-success-foreground' };
  };

  if (medsLoading || prescLoading) {
    return (<AppLayout><div className="p-6 lg:p-8"><div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></div></AppLayout>);
  }

  return (
    <AppLayout>
      <div className="p-6 lg:p-8">
        <PageHeader title="Pharmacie" description="Gestion des médicaments et délivrance">
          <Button variant="outline" size="default" className="gap-2"><FileText className="h-4 w-4" />Rapport stock</Button>
          <Button size="default" className="gap-2"><Plus className="h-4 w-4" />Nouveau médicament</Button>
        </PageHeader>

        {/* Patient Search */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Search className="h-4 w-4" />
              Rechercher un patient
            </CardTitle>
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

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-4 mb-6">
          <Card><CardContent className="pt-4"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Ordonnances en attente</p><p className="text-2xl font-bold">{pendingPrescriptions.length}</p></div><Clock className="h-8 w-8 text-warning" /></div></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Délivrées aujourd'hui</p><p className="text-2xl font-bold">{prescriptions?.filter((p: any) => p.dispensed).length || 0}</p></div><Check className="h-8 w-8 text-success" /></div></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Stock faible</p><p className="text-2xl font-bold text-destructive">{lowStockMeds.length}</p></div><AlertTriangle className="h-8 w-8 text-destructive" /></div></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Total médicaments</p><p className="text-2xl font-bold">{medications?.length || 0}</p></div><Pill className="h-8 w-8 text-primary" /></div></CardContent></Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="prescriptions" className="gap-2">
              <FileText className="h-4 w-4" />
              Ordonnances
              {pendingPrescriptions.length > 0 && (
                <Badge variant="destructive" className="ml-1 text-[10px]">{pendingPrescriptions.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="stock" className="gap-2"><Package className="h-4 w-4" />Stock</TabsTrigger>
          </TabsList>

          <TabsContent value="prescriptions">
            <Card>
              <CardHeader>
                <CardTitle>Ordonnances à délivrer</CardTitle>
                <CardDescription>
                  {selectedPatient
                    ? `Ordonnances pour ${selectedPatient.first_name} ${selectedPatient.last_name}`
                    : `${pendingPrescriptions.length} ordonnance(s) en attente de délivrance`}
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
                              <p className="font-semibold">{medication?.name || 'Médicament'}</p>
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
                            {prescription.instructions && (
                              <p className="text-xs text-muted-foreground mt-1 italic">"{prescription.instructions}"</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground mb-1">Qté: {prescription.quantity}</p>
                            {medication && (
                              <p className={cn('text-sm font-medium mb-2', medication.stock_quantity < 10 && 'text-destructive')}>
                                Stock: {medication.stock_quantity}
                              </p>
                            )}
                            <Button size="sm" onClick={() => handleDispense(prescription.id)}
                              disabled={dispensePrescription.isPending || (medication && medication.stock_quantity <= 0)}
                              className="gap-1.5">
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
                  <CardTitle className="text-base flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-5 w-5" />Alertes stock faible
                  </CardTitle>
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMedications.map(med => {
                      const status = getStockStatus(med);
                      const stockPercentage = Math.min(100, (med.stock_quantity / (med.alert_threshold * 2)) * 100);
                      return (
                        <TableRow key={med.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{med.name}</p>
                              {med.generic_name && <p className="text-xs text-muted-foreground">{med.generic_name}</p>}
                            </div>
                          </TableCell>
                          <TableCell><Badge variant="outline" className="text-xs">{med.category}</Badge></TableCell>
                          <TableCell className="capitalize">{med.form}</TableCell>
                          <TableCell>{Number(med.unit_price).toLocaleString()} FCFA</TableCell>
                          <TableCell>
                            <div className="w-32">
                              <div className="flex justify-between text-sm mb-1">
                                <span>{med.stock_quantity}</span>
                                <span className="text-muted-foreground text-xs">min: {med.alert_threshold}</span>
                              </div>
                              <Progress value={stockPercentage} className={cn('h-1.5', stockPercentage <= 50 && '[&>div]:bg-destructive', stockPercentage > 50 && stockPercentage <= 100 && '[&>div]:bg-warning')} />
                            </div>
                          </TableCell>
                          <TableCell><Badge className={cn('text-[10px]', status.className)}>{status.label}</Badge></TableCell>
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
    </AppLayout>
  );
};

export default Pharmacy;

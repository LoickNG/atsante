import { useState } from 'react';
import { AppLayout, PageHeader } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Pill,
  Package,
  Plus,
  AlertTriangle,
  Check,
  Clock,
  FileText,
  Printer,
  User,
} from 'lucide-react';
import { mockMedications, mockPrescriptions, mockPatients } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const Pharmacy = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('prescriptions');
  const [medications, setMedications] = useState(mockMedications);
  const [prescriptions, setPrescriptions] = useState(mockPrescriptions);

  const pendingPrescriptions = prescriptions.filter(p => !p.dispensed);
  const dispensedPrescriptions = prescriptions.filter(p => p.dispensed);
  const lowStockMeds = medications.filter(m => m.stockQuantity <= m.alertThreshold);

  const filteredMedications = medications.filter(med => {
    const searchLower = searchQuery.toLowerCase();
    return (
      med.name.toLowerCase().includes(searchLower) ||
      (med.genericName && med.genericName.toLowerCase().includes(searchLower)) ||
      med.category.toLowerCase().includes(searchLower)
    );
  });

  const getPatientName = (consultationId: string) => {
    // In real app, would get patient from consultation
    const patientId = consultationId === 'cons-001' ? 'pat-001' : 'pat-003';
    const patient = mockPatients.find(p => p.id === patientId);
    return patient ? `${patient.firstName} ${patient.lastName}` : 'Patient inconnu';
  };

  const getMedicationById = (id: string) => {
    return medications.find(m => m.id === id);
  };

  const handleDispense = (prescriptionId: string) => {
    setPrescriptions(prev => prev.map(p => 
      p.id === prescriptionId 
        ? { ...p, dispensed: true, dispensedAt: new Date().toISOString(), dispensedBy: 'usr-004' }
        : p
    ));

    // Update stock
    const prescription = prescriptions.find(p => p.id === prescriptionId);
    if (prescription) {
      setMedications(prev => prev.map(m =>
        m.id === prescription.medicationId
          ? { ...m, stockQuantity: Math.max(0, m.stockQuantity - 1) }
          : m
      ));
    }

    toast.success('Médicament délivré avec succès');
  };

  const getStockStatus = (med: typeof medications[0]) => {
    const percentage = (med.stockQuantity / med.alertThreshold) * 100;
    if (percentage <= 50) return { label: 'Critique', className: 'bg-destructive text-destructive-foreground' };
    if (percentage <= 100) return { label: 'Faible', className: 'bg-warning text-warning-foreground' };
    return { label: 'Normal', className: 'bg-success text-success-foreground' };
  };

  return (
    <AppLayout>
      <div className="p-6 lg:p-8">
        <PageHeader
          title="Pharmacie"
          description="Gestion des médicaments et délivrance"
        >
          <Button variant="outline" size="default" className="gap-2">
            <FileText className="h-4 w-4" />
            Rapport stock
          </Button>
          <Button size="default" className="gap-2">
            <Plus className="h-4 w-4" />
            Nouveau médicament
          </Button>
        </PageHeader>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ordonnances en attente</p>
                  <p className="text-2xl font-bold">{pendingPrescriptions.length}</p>
                </div>
                <Clock className="h-8 w-8 text-warning" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Délivrées aujourd'hui</p>
                  <p className="text-2xl font-bold">{dispensedPrescriptions.length}</p>
                </div>
                <Check className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Stock faible</p>
                  <p className="text-2xl font-bold text-destructive">{lowStockMeds.length}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total médicaments</p>
                  <p className="text-2xl font-bold">{medications.length}</p>
                </div>
                <Pill className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="prescriptions" className="gap-2">
              <FileText className="h-4 w-4" />
              Ordonnances
              {pendingPrescriptions.length > 0 && (
                <Badge variant="destructive" className="ml-1 text-[10px]">
                  {pendingPrescriptions.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="stock" className="gap-2">
              <Package className="h-4 w-4" />
              Stock
            </TabsTrigger>
          </TabsList>

          {/* Prescriptions Tab */}
          <TabsContent value="prescriptions">
            <Card>
              <CardHeader>
                <CardTitle>Ordonnances à délivrer</CardTitle>
                <CardDescription>
                  {pendingPrescriptions.length} ordonnance(s) en attente de délivrance
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingPrescriptions.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Check className="h-12 w-12 mx-auto mb-3 text-success" />
                    <p className="font-medium">Toutes les ordonnances ont été délivrées</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingPrescriptions.map(prescription => {
                      const medication = getMedicationById(prescription.medicationId);
                      return (
                        <div
                          key={prescription.id}
                          className="flex items-center gap-4 p-4 border rounded-lg bg-card"
                        >
                          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Pill className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold">{prescription.medicationName}</p>
                              <Badge variant="outline" className="text-[10px]">
                                {prescription.dosage}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {prescription.frequency} • {prescription.duration}
                            </p>
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              <User className="h-3 w-3" />
                              <span>{getPatientName(prescription.consultationId)}</span>
                            </div>
                            {prescription.instructions && (
                              <p className="text-xs text-muted-foreground mt-1 italic">
                                "{prescription.instructions}"
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            {medication && (
                              <p className={cn(
                                'text-sm font-medium mb-2',
                                medication.stockQuantity < 10 && 'text-destructive'
                              )}>
                                Stock: {medication.stockQuantity}
                              </p>
                            )}
                            <Button
                              size="sm"
                              onClick={() => handleDispense(prescription.id)}
                              disabled={medication && medication.stockQuantity <= 0}
                              className="gap-1.5"
                            >
                              <Check className="h-4 w-4" />
                              Délivrer
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Dispensed Today */}
            {dispensedPrescriptions.length > 0 && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="text-base">Délivrées aujourd'hui</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {dispensedPrescriptions.map(prescription => (
                      <div
                        key={prescription.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-success/5 border border-success/20"
                      >
                        <Check className="h-5 w-5 text-success" />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{prescription.medicationName}</p>
                          <p className="text-xs text-muted-foreground">
                            {getPatientName(prescription.consultationId)}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {prescription.dispensedAt && new Date(prescription.dispensedAt).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Stock Tab */}
          <TabsContent value="stock">
            <div className="mb-4">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un médicament..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Low Stock Alert */}
            {lowStockMeds.length > 0 && (
              <Card className="mb-4 border-destructive/50 bg-destructive/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-5 w-5" />
                    Alertes stock faible
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {lowStockMeds.map(med => (
                      <Badge key={med.id} variant="destructive" className="gap-1">
                        {med.name}
                        <span className="opacity-70">({med.stockQuantity})</span>
                      </Badge>
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
                      const stockPercentage = Math.min(100, (med.stockQuantity / (med.alertThreshold * 2)) * 100);
                      
                      return (
                        <TableRow key={med.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{med.name}</p>
                              {med.genericName && (
                                <p className="text-xs text-muted-foreground">{med.genericName}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {med.category}
                            </Badge>
                          </TableCell>
                          <TableCell className="capitalize">{med.form}</TableCell>
                          <TableCell>{med.unitPrice.toLocaleString()} FCFA</TableCell>
                          <TableCell>
                            <div className="w-32">
                              <div className="flex justify-between text-sm mb-1">
                                <span>{med.stockQuantity}</span>
                                <span className="text-muted-foreground text-xs">
                                  min: {med.alertThreshold}
                                </span>
                              </div>
                              <Progress 
                                value={stockPercentage} 
                                className={cn(
                                  'h-1.5',
                                  stockPercentage <= 50 && '[&>div]:bg-destructive',
                                  stockPercentage > 50 && stockPercentage <= 100 && '[&>div]:bg-warning',
                                )}
                              />
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={cn('text-[10px]', status.className)}>
                              {status.label}
                            </Badge>
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
    </AppLayout>
  );
};

export default Pharmacy;

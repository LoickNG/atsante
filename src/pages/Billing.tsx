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
  FileText, 
  CreditCard,
  Printer,
  Trash2,
  Receipt
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Patient {
  id: string;
  code: string;
  first_name: string;
  last_name: string;
}

interface MedicalAct {
  id: string;
  code: string;
  name: string;
  category: string;
  unit_price: number;
}

interface Medication {
  id: string;
  name: string;
  unit_price: number;
  stock_quantity: number;
}

interface InvoiceItem {
  id?: string;
  type: string;
  description: string;
  reference_id?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Invoice {
  id: string;
  invoice_number: string;
  patient_id: string;
  total_amount: number;
  paid_amount: number;
  status: string;
  created_at: string;
  patient?: Patient;
}

const Billing = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [medicalActs, setMedicalActs] = useState<MedicalAct[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  
  // New Invoice Dialog
  const [showNewInvoice, setShowNewInvoice] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [saving, setSaving] = useState(false);

  // Add Item
  const [itemType, setItemType] = useState<'consultation' | 'medicament' | 'analyse' | 'imagerie' | 'autre'>('consultation');
  const [selectedAct, setSelectedAct] = useState<string>('');
  const [selectedMedication, setSelectedMedication] = useState<string>('');
  const [itemQuantity, setItemQuantity] = useState(1);
  const [customDescription, setCustomDescription] = useState('');
  const [customPrice, setCustomPrice] = useState(0);

  // Payment Dialog
  const [showPayment, setShowPayment] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mobile_money' | 'carte'>('cash');
  const [paymentReference, setPaymentReference] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (patientSearch.length >= 2) {
      searchPatients();
    } else {
      setSearchResults([]);
    }
  }, [patientSearch]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch invoices
      const { data: invoicesData } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (invoicesData) {
        // Fetch patients for invoices
        const patientIds = [...new Set(invoicesData.map(i => i.patient_id))];
        const { data: patientsData } = await supabase
          .from('patients')
          .select('id, code, first_name, last_name')
          .in('id', patientIds);

        const patientsMap: Record<string, Patient> = {};
        patientsData?.forEach(p => { patientsMap[p.id] = p; });

        setInvoices(invoicesData.map(i => ({
          ...i,
          patient: patientsMap[i.patient_id]
        })));
      }

      // Fetch medical acts
      const { data: actsData } = await supabase
        .from('medical_acts')
        .select('*')
        .order('name');
      setMedicalActs(actsData || []);

      // Fetch medications
      const { data: medsData } = await supabase
        .from('medications')
        .select('id, name, unit_price, stock_quantity')
        .order('name');
      setMedications(medsData || []);

    } catch (error: any) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const searchPatients = async () => {
    const { data } = await supabase
      .from('patients')
      .select('id, code, first_name, last_name')
      .or(`first_name.ilike.%${patientSearch}%,last_name.ilike.%${patientSearch}%,code.ilike.%${patientSearch}%`)
      .limit(10);
    setSearchResults(data || []);
  };

  const addItem = () => {
    let newItem: InvoiceItem;

    if (itemType === 'medicament' && selectedMedication) {
      const med = medications.find(m => m.id === selectedMedication);
      if (!med) return;
      newItem = {
        type: 'medicament',
        description: med.name,
        reference_id: med.id,
        quantity: itemQuantity,
        unit_price: med.unit_price,
        total_price: med.unit_price * itemQuantity
      };
    } else if (itemType !== 'medicament' && itemType !== 'autre' && selectedAct) {
      const act = medicalActs.find(a => a.id === selectedAct);
      if (!act) return;
      newItem = {
        type: itemType,
        description: act.name,
        reference_id: act.id,
        quantity: itemQuantity,
        unit_price: act.unit_price,
        total_price: act.unit_price * itemQuantity
      };
    } else if (itemType === 'autre' && customDescription && customPrice > 0) {
      newItem = {
        type: 'autre',
        description: customDescription,
        quantity: itemQuantity,
        unit_price: customPrice,
        total_price: customPrice * itemQuantity
      };
    } else {
      toast({ title: 'Erreur', description: 'Veuillez remplir tous les champs', variant: 'destructive' });
      return;
    }

    setInvoiceItems([...invoiceItems, newItem]);
    resetItemForm();
  };

  const resetItemForm = () => {
    setSelectedAct('');
    setSelectedMedication('');
    setItemQuantity(1);
    setCustomDescription('');
    setCustomPrice(0);
  };

  const removeItem = (index: number) => {
    setInvoiceItems(invoiceItems.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return invoiceItems.reduce((sum, item) => sum + item.total_price, 0);
  };

  const createInvoice = async () => {
    if (!selectedPatient || invoiceItems.length === 0) {
      toast({ title: 'Erreur', description: 'Sélectionnez un patient et ajoutez des éléments', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      // Create invoice - invoice_number is generated by database trigger
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          patient_id: selectedPatient.id,
          total_amount: calculateTotal(),
          created_by: user?.id!,
          invoice_number: '' // Will be overwritten by trigger
        } as any)
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Create invoice items
      const itemsToInsert = invoiceItems.map(item => ({
        invoice_id: invoice.id,
        type: item.type,
        description: item.description,
        reference_id: item.reference_id || null,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price
      }));

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      toast({ title: 'Succès', description: `Facture ${invoice.invoice_number} créée` });
      setShowNewInvoice(false);
      resetNewInvoiceForm();
      fetchData();
    } catch (error: any) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const resetNewInvoiceForm = () => {
    setSelectedPatient(null);
    setPatientSearch('');
    setInvoiceItems([]);
    resetItemForm();
  };

  const openPayment = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setPaymentAmount(invoice.total_amount - invoice.paid_amount);
    setShowPayment(true);
  };

  const processPayment = async () => {
    if (!selectedInvoice || paymentAmount <= 0) return;

    setSaving(true);
    try {
      // Create payment
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          invoice_id: selectedInvoice.id,
          amount: paymentAmount,
          method: paymentMethod,
          reference: paymentReference || null,
          received_by: user?.id
        });

      if (paymentError) throw paymentError;

      // Update invoice
      const newPaidAmount = selectedInvoice.paid_amount + paymentAmount;
      const newStatus = newPaidAmount >= selectedInvoice.total_amount ? 'paye' : 'partiel';

      const { error: updateError } = await supabase
        .from('invoices')
        .update({ 
          paid_amount: newPaidAmount, 
          status: newStatus,
          paid_at: newStatus === 'paye' ? new Date().toISOString() : null
        })
        .eq('id', selectedInvoice.id);

      if (updateError) throw updateError;

      toast({ title: 'Paiement enregistré', description: `${paymentAmount.toLocaleString()} FCFA reçus` });
      setShowPayment(false);
      setPaymentReference('');
      fetchData();
    } catch (error: any) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const statusConfig = {
    en_attente: { label: 'En attente', className: 'bg-warning/10 text-warning-foreground' },
    partiel: { label: 'Partiel', className: 'bg-info/10 text-info' },
    paye: { label: 'Payé', className: 'bg-success/10 text-success' },
    annule: { label: 'Annulé', className: 'bg-muted text-muted-foreground' },
  };

  const filteredActs = medicalActs.filter(a => {
    if (itemType === 'consultation') return a.category === 'consultation';
    if (itemType === 'analyse') return a.category === 'analyse';
    if (itemType === 'imagerie') return a.category === 'imagerie';
    return true;
  });

  return (
    <AppLayout>
      <div className="p-6 lg:p-8">
        <div className="flex items-center justify-between mb-6">
          <PageHeader
            title="Facturation"
            description="Gestion des factures et paiements"
          />
          <Button onClick={() => setShowNewInvoice(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Nouvelle facture
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total du jour
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {invoices
                  .filter(i => new Date(i.created_at).toDateString() === new Date().toDateString())
                  .reduce((sum, i) => sum + i.total_amount, 0)
                  .toLocaleString()} FCFA
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Encaissé
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {invoices
                  .filter(i => new Date(i.created_at).toDateString() === new Date().toDateString())
                  .reduce((sum, i) => sum + i.paid_amount, 0)
                  .toLocaleString()} FCFA
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                En attente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">
                {invoices.filter(i => i.status === 'en_attente').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Factures du jour
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {invoices.filter(i => new Date(i.created_at).toDateString() === new Date().toDateString()).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Invoices Table */}
        <Card>
          <CardHeader>
            <CardTitle>Factures récentes</CardTitle>
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
                    <TableHead>N° Facture</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead className="text-right">Payé</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => {
                    const status = statusConfig[invoice.status as keyof typeof statusConfig];
                    return (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-mono">{invoice.invoice_number}</TableCell>
                        <TableCell>
                          {invoice.patient ? (
                            <span>{invoice.patient.first_name} {invoice.patient.last_name}</span>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          {new Date(invoice.created_at).toLocaleDateString('fr-FR')}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {invoice.total_amount.toLocaleString()} FCFA
                        </TableCell>
                        <TableCell className="text-right">
                          {invoice.paid_amount.toLocaleString()} FCFA
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn('text-xs', status?.className)}>
                            {status?.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {invoice.status !== 'paye' && invoice.status !== 'annule' && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => openPayment(invoice)}
                              >
                                <CreditCard className="h-4 w-4" />
                              </Button>
                            )}
                            <Button size="sm" variant="ghost">
                              <Printer className="h-4 w-4" />
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

        {/* New Invoice Dialog */}
        <Dialog open={showNewInvoice} onOpenChange={setShowNewInvoice}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nouvelle facture</DialogTitle>
              <DialogDescription>
                Créez une facture en sélectionnant un patient et des prestations
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Patient Selection */}
              <div className="space-y-2">
                <Label>Patient</Label>
                {selectedPatient ? (
                  <div className="flex items-center justify-between p-3 bg-primary/10 rounded-md">
                    <span className="font-medium">
                      {selectedPatient.first_name} {selectedPatient.last_name} ({selectedPatient.code})
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedPatient(null)}>
                      Changer
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Rechercher un patient..."
                        value={patientSearch}
                        onChange={(e) => setPatientSearch(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    {searchResults.length > 0 && (
                      <div className="border rounded-md max-h-40 overflow-y-auto">
                        {searchResults.map((patient) => (
                          <button
                            key={patient.id}
                            onClick={() => {
                              setSelectedPatient(patient);
                              setPatientSearch('');
                              setSearchResults([]);
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-muted text-sm"
                          >
                            {patient.first_name} {patient.last_name} ({patient.code})
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Add Item */}
              <div className="space-y-4 p-4 border rounded-lg">
                <h4 className="font-medium">Ajouter une prestation</h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={itemType} onValueChange={(v: any) => setItemType(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="consultation">Consultation</SelectItem>
                        <SelectItem value="medicament">Médicament</SelectItem>
                        <SelectItem value="analyse">Analyse</SelectItem>
                        <SelectItem value="imagerie">Imagerie</SelectItem>
                        <SelectItem value="autre">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {itemType === 'medicament' ? (
                    <div className="space-y-2">
                      <Label>Médicament</Label>
                      <Select value={selectedMedication} onValueChange={setSelectedMedication}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner..." />
                        </SelectTrigger>
                        <SelectContent>
                          {medications.map((med) => (
                            <SelectItem key={med.id} value={med.id}>
                              {med.name} - {med.unit_price.toLocaleString()} FCFA
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : itemType !== 'autre' ? (
                    <div className="space-y-2">
                      <Label>Prestation</Label>
                      <Select value={selectedAct} onValueChange={setSelectedAct}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner..." />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredActs.map((act) => (
                            <SelectItem key={act.id} value={act.id}>
                              {act.name} - {act.unit_price.toLocaleString()} FCFA
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Input
                          value={customDescription}
                          onChange={(e) => setCustomDescription(e.target.value)}
                          placeholder="Description..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Prix unitaire (FCFA)</Label>
                        <Input
                          type="number"
                          value={customPrice}
                          onChange={(e) => setCustomPrice(Number(e.target.value))}
                        />
                      </div>
                    </>
                  )}

                  <div className="space-y-2">
                    <Label>Quantité</Label>
                    <Input
                      type="number"
                      min="1"
                      value={itemQuantity}
                      onChange={(e) => setItemQuantity(Number(e.target.value))}
                    />
                  </div>
                </div>
                <Button onClick={addItem} variant="secondary" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter
                </Button>
              </div>

              {/* Items List */}
              {invoiceItems.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Éléments de la facture</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Qté</TableHead>
                        <TableHead className="text-right">Prix unit.</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoiceItems.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.description}</TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">{item.unit_price.toLocaleString()}</TableCell>
                          <TableCell className="text-right font-medium">{item.total_price.toLocaleString()}</TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => removeItem(index)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell colSpan={3} className="text-right font-bold">Total</TableCell>
                        <TableCell className="text-right font-bold text-lg">
                          {calculateTotal().toLocaleString()} FCFA
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewInvoice(false)}>
                Annuler
              </Button>
              <Button 
                onClick={createInvoice} 
                disabled={saving || !selectedPatient || invoiceItems.length === 0}
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Création...
                  </>
                ) : (
                  <>
                    <Receipt className="mr-2 h-4 w-4" />
                    Créer la facture
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Payment Dialog */}
        <Dialog open={showPayment} onOpenChange={setShowPayment}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enregistrer un paiement</DialogTitle>
              <DialogDescription>
                {selectedInvoice && (
                  <>Facture {selectedInvoice.invoice_number} - Reste à payer: {(selectedInvoice.total_amount - selectedInvoice.paid_amount).toLocaleString()} FCFA</>
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Montant (FCFA)</Label>
                <Input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label>Mode de paiement</Label>
                <Select value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Espèces</SelectItem>
                    <SelectItem value="mobile_money">Mobile Money</SelectItem>
                    <SelectItem value="carte">Carte bancaire</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {paymentMethod !== 'cash' && (
                <div className="space-y-2">
                  <Label>Référence</Label>
                  <Input
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    placeholder="N° de transaction..."
                  />
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPayment(false)}>
                Annuler
              </Button>
              <Button onClick={processPayment} disabled={saving || paymentAmount <= 0}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Traitement...
                  </>
                ) : (
                  'Valider le paiement'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default Billing;

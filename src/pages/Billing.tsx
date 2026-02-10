import { useState } from 'react';
import { AppLayout, PageHeader } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Loader2, Search, FileText, CreditCard, Eye, Plus, Trash2 } from 'lucide-react';
import { useInvoices, useCreateInvoice, useMedicalActs, type NewInvoiceItem } from '@/hooks/useBilling';
import { useSearchPatients, type Patient } from '@/hooks/usePatients';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'decimal', minimumFractionDigits: 0 }).format(amount) + ' FCFA';

const statusConfig: Record<string, { label: string; className: string }> = {
  en_attente: { label: 'En attente', className: 'bg-warning/10 text-warning border-warning/30' },
  partiel: { label: 'Partiel', className: 'bg-info/10 text-info border-info/30' },
  paye: { label: 'Payé', className: 'bg-success/10 text-success border-success/30' },
  annule: { label: 'Annulé', className: 'bg-destructive/10 text-destructive border-destructive/30' },
};

const ITEM_TYPES = [
  { value: 'consultation', label: 'Consultation' },
  { value: 'medicament', label: 'Médicament' },
  { value: 'analyse', label: 'Analyse' },
  { value: 'imagerie', label: 'Imagerie' },
  { value: 'autre', label: 'Autre' },
];

export default function Billing() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { data: invoices, isLoading } = useInvoices(statusFilter);
  const { data: medicalActs } = useMedicalActs();
  const createInvoice = useCreateInvoice();

  // New invoice dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const { data: searchResults } = useSearchPatients(patientSearch);
  const [items, setItems] = useState<NewInvoiceItem[]>([
    { type: 'consultation', description: '', quantity: 1, unit_price: 0 },
  ]);

  const addItem = () => setItems(prev => [...prev, { type: 'autre', description: '', quantity: 1, unit_price: 0 }]);
  const removeItem = (idx: number) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, i) => i !== idx));
  };
  const updateItem = (idx: number, field: keyof NewInvoiceItem, value: string | number) => {
    setItems(prev => prev.map((it, i) => (i === idx ? { ...it, [field]: value } : it)));
  };

  const handleSelectMedicalAct = (idx: number, actId: string) => {
    const act = medicalActs?.find(a => a.id === actId);
    if (act) {
      setItems(prev =>
        prev.map((it, i) =>
          i === idx ? { ...it, description: act.name, unit_price: Number(act.unit_price), reference_id: act.id } : it
        )
      );
    }
  };

  const invoiceTotal = items.reduce((s, i) => s + i.quantity * i.unit_price, 0);

  const handleCreate = async () => {
    if (!selectedPatient) {
      toast({ title: 'Erreur', description: 'Sélectionnez un patient', variant: 'destructive' });
      return;
    }
    const validItems = items.filter(i => i.description && i.unit_price > 0);
    if (validItems.length === 0) {
      toast({ title: 'Erreur', description: 'Ajoutez au moins une ligne valide', variant: 'destructive' });
      return;
    }

    try {
      await createInvoice.mutateAsync({
        patient_id: selectedPatient.id,
        created_by: user!.id,
        items: validItems,
      });
      toast({ title: 'Facture créée', description: `Montant: ${formatCurrency(invoiceTotal)}` });
      setDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setSelectedPatient(null);
    setPatientSearch('');
    setItems([{ type: 'consultation', description: '', quantity: 1, unit_price: 0 }]);
  };

  const filtered = (invoices || []).filter(inv => {
    const patient = inv.patient;
    if (!patient) return false;
    const q = search.toLowerCase();
    return (
      !q ||
      patient.first_name.toLowerCase().includes(q) ||
      patient.last_name.toLowerCase().includes(q) ||
      patient.code.toLowerCase().includes(q) ||
      inv.invoice_number.toLowerCase().includes(q)
    );
  });

  const totalEnAttente = filtered.filter(i => i.status === 'en_attente').reduce((s, i) => s + Number(i.total_amount), 0);
  const totalPartiel = filtered.filter(i => i.status === 'partiel').reduce((s, i) => s + Number(i.total_amount) - Number(i.paid_amount), 0);

  return (
    <AppLayout>
      <div className="p-6 lg:p-8">
        <PageHeader title="Facturation" description="Gestion des factures et encaissements">
          <Button className="gap-2" onClick={() => { resetForm(); setDialogOpen(true); }}>
            <Plus className="h-4 w-4" />
            Nouvelle facture
          </Button>
        </PageHeader>

        {/* Summary cards */}
        <div className="grid gap-4 sm:grid-cols-3 mb-6">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Factures en attente</p>
              <p className="text-2xl font-bold text-warning">{formatCurrency(totalEnAttente)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Reste à payer (partiel)</p>
              <p className="text-2xl font-bold text-info">{formatCurrency(totalPartiel)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Total factures</p>
              <p className="text-2xl font-bold">{filtered.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Factures
            </CardTitle>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 w-full sm:w-[220px]" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]"><SelectValue placeholder="Statut" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="en_attente">En attente</SelectItem>
                  <SelectItem value="partiel">Partiel</SelectItem>
                  <SelectItem value="paye">Payé</SelectItem>
                  <SelectItem value="annule">Annulé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">Aucune facture trouvée</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>N° Facture</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Payé</TableHead>
                      <TableHead>Reste</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map(inv => {
                      const reste = Number(inv.total_amount) - Number(inv.paid_amount);
                      const sc = statusConfig[inv.status] || statusConfig.en_attente;
                      return (
                        <TableRow key={inv.id}>
                          <TableCell className="font-mono text-sm">{inv.invoice_number}</TableCell>
                          <TableCell className="font-medium">{inv.patient ? `${inv.patient.first_name} ${inv.patient.last_name}` : '—'}</TableCell>
                          <TableCell>{formatCurrency(Number(inv.total_amount))}</TableCell>
                          <TableCell className="text-success">{formatCurrency(Number(inv.paid_amount))}</TableCell>
                          <TableCell className={reste > 0 ? 'text-warning font-medium' : ''}>{formatCurrency(reste)}</TableCell>
                          <TableCell><Badge variant="outline" className={sc.className}>{sc.label}</Badge></TableCell>
                          <TableCell className="text-muted-foreground text-sm">{new Date(inv.created_at).toLocaleDateString('fr-FR')}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {inv.status !== 'paye' && inv.status !== 'annule' && (
                                <Button size="sm" className="gap-1" onClick={() => navigate(`/paiements?invoice=${inv.id}`)}>
                                  <CreditCard className="h-3.5 w-3.5" />Payer
                                </Button>
                              )}
                              <Button size="sm" variant="outline" className="gap-1" onClick={() => navigate(`/paiements?invoice=${inv.id}&view=true`)}>
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Invoice Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nouvelle facture</DialogTitle>
            <DialogDescription>Sélectionnez un patient et ajoutez les prestations à facturer.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Patient search */}
            <div className="space-y-2">
              <Label>Patient</Label>
              {selectedPatient ? (
                <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                  <div>
                    <p className="font-medium">{selectedPatient.first_name} {selectedPatient.last_name}</p>
                    <p className="text-xs text-muted-foreground">{selectedPatient.code} • {selectedPatient.phone}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => { setSelectedPatient(null); setPatientSearch(''); }}>Changer</Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher un patient par nom, code ou téléphone..."
                      value={patientSearch}
                      onChange={e => setPatientSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  {searchResults && searchResults.length > 0 && (
                    <div className="border rounded-lg max-h-40 overflow-y-auto">
                      {searchResults.map(p => (
                        <button
                          key={p.id}
                          className="w-full text-left px-3 py-2 hover:bg-muted/50 transition-colors border-b last:border-b-0"
                          onClick={() => { setSelectedPatient(p); setPatientSearch(''); }}
                        >
                          <p className="font-medium text-sm">{p.first_name} {p.last_name}</p>
                          <p className="text-xs text-muted-foreground">{p.code}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <Separator />

            {/* Invoice items */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="font-semibold">Lignes de facturation</Label>
                <Button variant="outline" size="sm" onClick={addItem} className="gap-1">
                  <Plus className="h-3.5 w-3.5" />Ajouter
                </Button>
              </div>

              {items.map((item, idx) => (
                <div key={idx} className="p-3 border rounded-lg bg-muted/30 space-y-2">
                  <div className="flex items-end gap-2">
                    <div className="w-[140px] space-y-1">
                      <Label className="text-xs">Type</Label>
                      <Select value={item.type} onValueChange={v => updateItem(idx, 'type', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {ITEM_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs">Description</Label>
                      {medicalActs && medicalActs.length > 0 && (item.type === 'consultation' || item.type === 'analyse' || item.type === 'imagerie') ? (
                        <Select
                          value={item.reference_id || ''}
                          onValueChange={v => handleSelectMedicalAct(idx, v)}
                        >
                          <SelectTrigger><SelectValue placeholder="Choisir un acte..." /></SelectTrigger>
                          <SelectContent>
                            {medicalActs
                              .filter(a => {
                                if (item.type === 'consultation') return a.category === 'consultation';
                                if (item.type === 'analyse') return a.category === 'laboratoire';
                                if (item.type === 'imagerie') return a.category === 'imagerie';
                                return true;
                              })
                              .map(a => (
                                <SelectItem key={a.id} value={a.id}>
                                  {a.name} — {formatCurrency(Number(a.unit_price))}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          placeholder="Description"
                          value={item.description}
                          onChange={e => updateItem(idx, 'description', e.target.value)}
                        />
                      )}
                    </div>
                    {items.length > 1 && (
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeItem(idx)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <div className="w-[100px] space-y-1">
                      <Label className="text-xs">Quantité</Label>
                      <Input type="number" min={1} value={item.quantity} onChange={e => updateItem(idx, 'quantity', parseInt(e.target.value) || 1)} />
                    </div>
                    <div className="w-[140px] space-y-1">
                      <Label className="text-xs">Prix unitaire</Label>
                      <Input type="number" min={0} value={item.unit_price} onChange={e => updateItem(idx, 'unit_price', parseFloat(e.target.value) || 0)} />
                    </div>
                    <div className="flex-1 flex items-end">
                      <p className="text-sm font-medium pb-2">{formatCurrency(item.quantity * item.unit_price)}</p>
                    </div>
                  </div>
                </div>
              ))}

              {/* Total */}
              <div className="flex justify-between items-center p-3 rounded-lg bg-primary/5 border border-primary/20">
                <span className="font-semibold">Total facture</span>
                <span className="text-xl font-bold text-primary">{formatCurrency(invoiceTotal)}</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleCreate} disabled={createInvoice.isPending}>
              {createInvoice.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Créer la facture
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

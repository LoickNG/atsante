import { useState, useEffect, useCallback } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Loader2, Search, FileText, CreditCard, Eye, Trash2, Building2,
  Stethoscope, Pill, FlaskConical, ScanLine, Receipt,
} from 'lucide-react';
import { useInvoices, useCreateInvoice, type NewInvoiceItem } from '@/hooks/useBilling';
import { useSearchPatients, type Patient } from '@/hooks/usePatients';
import { usePatientBillableItems, type BillableItem } from '@/hooks/usePatientBillableItems';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useConventions, type ConventionWithRelations } from '@/hooks/useConventions';
import { supabase } from '@/integrations/supabase/client';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'decimal', minimumFractionDigits: 0 }).format(amount) + ' FCFA';

const statusConfig: Record<string, { label: string; className: string }> = {
  en_attente: { label: 'En attente', className: 'bg-warning/10 text-warning border-warning/30' },
  partiel: { label: 'Partiel', className: 'bg-info/10 text-info border-info/30' },
  paye: { label: 'Payé', className: 'bg-success/10 text-success border-success/30' },
  annule: { label: 'Annulé', className: 'bg-destructive/10 text-destructive border-destructive/30' },
};

const typeIcons: Record<string, React.ReactNode> = {
  consultation: <Stethoscope className="h-4 w-4 text-primary" />,
  medicament: <Pill className="h-4 w-4 text-emerald-600" />,
  analyse: <FlaskConical className="h-4 w-4 text-amber-600" />,
  imagerie: <ScanLine className="h-4 w-4 text-blue-600" />,
  soin_hospitalisation: <Stethoscope className="h-4 w-4 text-rose-600" />,
  hebergement: <Building2 className="h-4 w-4 text-violet-600" />,
};

const typeLabels: Record<string, string> = {
  consultation: 'Consultation',
  medicament: 'Médicament',
  analyse: 'Analyse',
  imagerie: 'Imagerie',
  soin_hospitalisation: 'Soin hospi.',
  hebergement: 'Hébergement',
};

export default function Billing() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // List view state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { data: invoices, isLoading } = useInvoices(statusFilter);

  // Auto-invoice state
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientConvention, setPatientConvention] = useState<ConventionWithRelations | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: searchResults } = useSearchPatients(patientSearch);
  const { data: billableItems, isLoading: billableLoading } = usePatientBillableItems(selectedPatient?.id);
  const { data: allConventions } = useConventions();
  const createInvoice = useCreateInvoice();

  // Auto-select all items when they load
  useEffect(() => {
    if (billableItems && billableItems.length > 0) {
      setSelectedItems(new Set(billableItems.map((_, i) => i)));
    }
  }, [billableItems]);

  const handleSelectPatient = async (p: Patient) => {
    setSelectedPatient(p);
    setPatientSearch('');
    setSelectedItems(new Set());

    const patientData = p as any;
    if (patientData.convention_id && allConventions) {
      const conv = allConventions.find(c => c.id === patientData.convention_id);
      if (conv && conv.is_active) {
        setPatientConvention(conv);
        return;
      }
    }
    if (patientData.convention_id) {
      const { data } = await supabase
        .from('conventions')
        .select('*, company:partner_companies(*), insurance:insurance_companies(*)')
        .eq('id', patientData.convention_id)
        .eq('is_active', true)
        .single();
      if (data) setPatientConvention(data as unknown as ConventionWithRelations);
      else setPatientConvention(null);
    } else {
      setPatientConvention(null);
    }
  };

  const toggleItem = (idx: number) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const toggleAll = () => {
    if (!billableItems) return;
    if (selectedItems.size === billableItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(billableItems.map((_, i) => i)));
    }
  };

  const selectedBillable = (billableItems || []).filter((_, i) => selectedItems.has(i));
  const invoiceTotal = selectedBillable.reduce((s, i) => s + i.quantity * i.unit_price, 0);
  const companyAmount = patientConvention ? Math.round(invoiceTotal * patientConvention.company_coverage_percent / 100) : 0;
  const insuranceAmount = patientConvention ? Math.round(invoiceTotal * patientConvention.insurance_coverage_percent / 100) : 0;
  const patientAmount = patientConvention ? invoiceTotal - companyAmount - insuranceAmount : invoiceTotal;

  const handleGenerateInvoice = async () => {
    if (!selectedPatient || selectedBillable.length === 0) {
      toast({ title: 'Erreur', description: 'Sélectionnez au moins une prestation', variant: 'destructive' });
      return;
    }

    const items: NewInvoiceItem[] = selectedBillable.map(b => ({
      type: b.type,
      description: b.description,
      quantity: b.quantity,
      unit_price: b.unit_price,
      reference_id: b.reference_id,
    }));

    try {
      await createInvoice.mutateAsync({
        patient_id: selectedPatient.id,
        created_by: user!.id,
        items,
        convention_id: patientConvention?.id,
        company_amount: companyAmount,
        insurance_amount: insuranceAmount,
        patient_amount: patientAmount,
      } as any);
      toast({ title: 'Facture générée', description: `Montant total : ${formatCurrency(invoiceTotal)}` });
      resetSearch();
    } catch (error: any) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    }
  };

  const resetSearch = () => {
    setSelectedPatient(null);
    setPatientSearch('');
    setPatientConvention(null);
    setSelectedItems(new Set());
  };

  // Filter invoice list
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
      <div className="p-6 lg:p-8 space-y-6">
        <PageHeader title="Facturation" description="Recherchez un patient pour générer automatiquement sa facture" />

        {/* ==================== AUTO-INVOICE SECTION ==================== */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Receipt className="h-5 w-5 text-primary" />
              Générer une facture
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Patient search */}
            {selectedPatient ? (
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                <div>
                  <p className="font-semibold text-lg">{selectedPatient.first_name} {selectedPatient.last_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedPatient.code} • {selectedPatient.phone}</p>
                  {patientConvention && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <Building2 className="h-3.5 w-3.5 text-primary" />
                      <span className="text-xs font-medium text-primary">{patientConvention.name}</span>
                      <span className="text-xs text-muted-foreground">
                        (Société {patientConvention.company_coverage_percent}%
                        {patientConvention.insurance_coverage_percent > 0 && ` • Assurance ${patientConvention.insurance_coverage_percent}%`}
                        {' '}• Patient {patientConvention.patient_coverage_percent}%)
                      </span>
                    </div>
                  )}
                </div>
                <Button variant="outline" onClick={resetSearch}>Changer de patient</Button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Tapez le nom, code patient ou téléphone pour rechercher..."
                    value={patientSearch}
                    onChange={e => setPatientSearch(e.target.value)}
                    className="pl-9 h-12 text-base"
                    autoFocus
                  />
                </div>
                {searchResults && searchResults.length > 0 && (
                  <div className="border rounded-lg max-h-60 overflow-y-auto shadow-sm">
                    {searchResults.map(p => (
                      <button
                        key={p.id}
                        className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors border-b last:border-b-0 flex items-center justify-between"
                        onClick={() => handleSelectPatient(p)}
                      >
                        <div>
                          <p className="font-medium">{p.first_name} {p.last_name}</p>
                          <p className="text-xs text-muted-foreground">{p.code} • {p.phone}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">{p.gender === 'M' ? 'Homme' : 'Femme'}</Badge>
                      </button>
                    ))}
                  </div>
                )}
                {patientSearch.length > 0 && searchResults && searchResults.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-3">Aucun patient trouvé</p>
                )}
              </div>
            )}

            {/* Billable items */}
            {selectedPatient && (
              <>
                <Separator />
                {billableLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : !billableItems || billableItems.length === 0 ? (
                  <div className="text-center py-8 space-y-2">
                    <p className="text-muted-foreground">Aucune prestation non facturée pour ce patient.</p>
                    <p className="text-sm text-muted-foreground">Toutes les prestations ont déjà été facturées.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="font-semibold text-base">
                        Prestations à facturer ({selectedItems.size}/{billableItems.length})
                      </Label>
                      <Button variant="ghost" size="sm" onClick={toggleAll}>
                        {selectedItems.size === billableItems.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {billableItems.map((item, idx) => (
                        <div
                          key={idx}
                          className={`flex items-center gap-3 p-3 border rounded-lg transition-colors cursor-pointer ${
                            selectedItems.has(idx) ? 'bg-primary/5 border-primary/30' : 'bg-muted/20 opacity-60'
                          }`}
                          onClick={() => toggleItem(idx)}
                        >
                          <Checkbox
                            checked={selectedItems.has(idx)}
                            onCheckedChange={() => toggleItem(idx)}
                          />
                          <div className="flex items-center gap-2 min-w-[100px]">
                            {typeIcons[item.type]}
                            <span className="text-xs font-medium text-muted-foreground">{typeLabels[item.type]}</span>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{item.description}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm">×{item.quantity}</p>
                          </div>
                          <div className="text-right min-w-[120px]">
                            <p className="font-semibold">{formatCurrency(item.quantity * item.unit_price)}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Total & convention breakdown */}
                    <div className="space-y-2 pt-2">
                      <div className="flex justify-between items-center p-3 rounded-lg bg-primary/5 border border-primary/20">
                        <span className="font-semibold">Total facture</span>
                        <span className="text-xl font-bold text-primary">{formatCurrency(invoiceTotal)}</span>
                      </div>

                      {patientConvention && invoiceTotal > 0 && (
                        <div className="p-3 rounded-lg bg-muted/50 border space-y-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Building2 className="h-4 w-4" />
                            <span className="text-sm font-semibold">Répartition : {patientConvention.name}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Part société ({patientConvention.company_coverage_percent}%)</span>
                            <span className="font-medium">{formatCurrency(companyAmount)}</span>
                          </div>
                          {patientConvention.insurance_coverage_percent > 0 && (
                            <div className="flex justify-between text-sm">
                              <span>Part assurance ({patientConvention.insurance_coverage_percent}%)</span>
                              <span className="font-medium">{formatCurrency(insuranceAmount)}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-sm font-semibold border-t pt-1 mt-1">
                            <span>Part patient ({patientConvention.patient_coverage_percent}%)</span>
                            <span className="text-primary">{formatCurrency(patientAmount)}</span>
                          </div>
                        </div>
                      )}

                      <Button
                        className="w-full gap-2 h-11"
                        size="lg"
                        onClick={handleGenerateInvoice}
                        disabled={selectedItems.size === 0 || createInvoice.isPending}
                      >
                        {createInvoice.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                        <Receipt className="h-4 w-4" />
                        Générer la facture — {formatCurrency(invoiceTotal)}
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* ==================== INVOICE LIST ==================== */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">En attente</p>
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

        <Card>
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Historique des factures
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
    </AppLayout>
  );
}

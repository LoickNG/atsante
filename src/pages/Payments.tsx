import { useState, useEffect, useMemo } from 'react';
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
import {
  Loader2,
  CreditCard,
  Plus,
  Trash2,
  Banknote,
  Smartphone,
  CheckCircle2,
  Search,
} from 'lucide-react';
import {
  useInvoices,
  useInvoice,
  useRecordPayment,
  PAYMENT_METHODS,
  getPaymentMethodLabel,
  type PaymentMethod,
} from '@/hooks/useBilling';
import { useAuth } from '@/hooks/useAuth';
import { useSearchParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { InvoicePDFExport } from '@/components/invoice/InvoicePDFExport';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'decimal', minimumFractionDigits: 0 }).format(amount) + ' FCFA';

interface PaymentEntry {
  method: PaymentMethod;
  amount: string;
  reference: string;
}

export default function Payments() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const invoiceIdParam = searchParams.get('invoice');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [entries, setEntries] = useState<PaymentEntry[]>([{ method: 'especes', amount: '', reference: '' }]);
  const [search, setSearch] = useState('');

  const { data: allInvoices, isLoading: listLoading } = useInvoices();
  const { data: selectedInvoice, isLoading: invLoading } = useInvoice(selectedInvoiceId || undefined);
  const recordPayment = useRecordPayment();

  // Auto-open dialog from URL param
  useEffect(() => {
    if (invoiceIdParam) {
      setSelectedInvoiceId(invoiceIdParam);
      setDialogOpen(true);
      // Clean URL
      searchParams.delete('invoice');
      searchParams.delete('view');
      setSearchParams(searchParams, { replace: true });
    }
  }, [invoiceIdParam]);

  // For convention patients, patient_amount is what the patient owes (can be 0 if fully covered)
  const hasConvention = selectedInvoice && (Number(selectedInvoice.company_amount) > 0 || Number(selectedInvoice.insurance_amount) > 0);
  const invoiceOwed = selectedInvoice
    ? hasConvention
      ? Number(selectedInvoice.patient_amount)
      : Number(selectedInvoice.total_amount)
    : 0;
  const remaining = selectedInvoice
    ? invoiceOwed - Number(selectedInvoice.paid_amount)
    : 0;

  const totalEntered = useMemo(
    () => entries.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0),
    [entries]
  );

  const addEntry = () => setEntries(prev => [...prev, { method: 'especes', amount: '', reference: '' }]);

  const removeEntry = (idx: number) => {
    if (entries.length <= 1) return;
    setEntries(prev => prev.filter((_, i) => i !== idx));
  };

  const updateEntry = (idx: number, field: keyof PaymentEntry, value: string) => {
    setEntries(prev => prev.map((e, i) => (i === idx ? { ...e, [field]: value } : e)));
  };

  const autoFillRemaining = () => {
    if (entries.length === 1) {
      updateEntry(0, 'amount', String(remaining));
    }
  };

  const openPayDialog = (invoiceId: string) => {
    setSelectedInvoiceId(invoiceId);
    setEntries([{ method: 'especes', amount: '', reference: '' }]);
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!selectedInvoiceId || !user) return;

    const validEntries = entries.filter(e => parseFloat(e.amount) > 0);
    if (validEntries.length === 0) {
      toast({ title: 'Erreur', description: 'Saisissez au moins un montant', variant: 'destructive' });
      return;
    }

    if (totalEntered > remaining) {
      toast({ title: 'Erreur', description: 'Le montant total dépasse le reste à payer', variant: 'destructive' });
      return;
    }

    try {
      await recordPayment.mutateAsync(
        validEntries.map(e => ({
          invoice_id: selectedInvoiceId,
          amount: parseFloat(e.amount),
          method: e.method,
          reference: e.reference || undefined,
          received_by: user.id,
        }))
      );
      toast({ title: 'Paiement enregistré', description: `${formatCurrency(totalEntered)} encaissé avec succès` });
      setDialogOpen(false);
      setSelectedInvoiceId(null);
    } catch (error: any) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    }
  };

  // Filter unpaid invoices for quick-pay list
  const unpaidInvoices = (allInvoices || []).filter(
    inv => (inv.status === 'en_attente' || inv.status === 'partiel') && inv.patient
  );

  const filteredUnpaid = unpaidInvoices.filter(inv => {
    const q = search.toLowerCase();
    if (!q) return true;
    const p = inv.patient;
    return (
      p?.first_name.toLowerCase().includes(q) ||
      p?.last_name.toLowerCase().includes(q) ||
      p?.code.toLowerCase().includes(q) ||
      inv.invoice_number.toLowerCase().includes(q)
    );
  });

  // Recent payments from all invoices
  const recentPayments = useMemo(() => {
    if (!allInvoices) return [];
    return allInvoices
      .flatMap(inv =>
        (inv.payments || []).map(p => ({
          ...p,
          invoice_number: inv.invoice_number,
          patient: inv.patient,
        }))
      )
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 20);
  }, [allInvoices]);

  const getMethodIcon = (method: string) => {
    if (method === 'especes') return <Banknote className="h-4 w-4" />;
    if (['airtel_money', 'moov_money', 'konoom'].includes(method)) return <Smartphone className="h-4 w-4" />;
    return <CreditCard className="h-4 w-4" />;
  };

  return (
    <AppLayout>
      <div className="p-6 lg:p-8">
        <PageHeader title="Paiements" description="Encaissement et suivi des paiements" />

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Unpaid invoices */}
          <Card>
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Banknote className="h-5 w-5" />
                Factures à régler ({filteredUnpaid.length})
              </CardTitle>
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 w-full sm:w-[200px]"
                />
              </div>
            </CardHeader>
            <CardContent>
              {listLoading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredUnpaid.length === 0 ? (
                <p className="text-center text-muted-foreground py-6">Aucune facture en attente</p>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {filteredUnpaid.map(inv => {
                    const invHasConvention = Number(inv.company_amount) > 0 || Number(inv.insurance_amount) > 0;
                    const patientOwes = invHasConvention ? Number(inv.patient_amount) : Number(inv.total_amount);
                    const reste = patientOwes - Number(inv.paid_amount);
                    return (
                      <div
                        key={inv.id}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">
                            {inv.patient?.first_name} {inv.patient?.last_name}
                          </p>
                          <p className="text-xs text-muted-foreground">{inv.invoice_number}</p>
                        </div>
                        <div className="text-right mr-3">
                          <p className={`font-semibold ${reste > 0 ? 'text-warning' : 'text-success'}`}>
                            {reste <= 0 ? 'Couvert' : formatCurrency(reste)}
                          </p>
                          <p className="text-xs text-muted-foreground">sur {formatCurrency(Number(inv.total_amount))}</p>
                        </div>
                        {reste > 0 ? (
                          <Button size="sm" onClick={() => openPayDialog(inv.id)} className="gap-1">
                            <CreditCard className="h-3.5 w-3.5" />
                            Payer
                          </Button>
                        ) : (
                          <Badge variant="outline" className="bg-success/10 text-success border-success/30">Couvert</Badge>
                        )}
                        <Button size="sm" onClick={() => openPayDialog(inv.id)} className="gap-1">
                          <CreditCard className="h-3.5 w-3.5" />
                          Payer
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent payments */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-success" />
                Paiements récents
              </CardTitle>
            </CardHeader>
            <CardContent>
              {listLoading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : recentPayments.length === 0 ? (
                <p className="text-center text-muted-foreground py-6">Aucun paiement enregistré</p>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {recentPayments.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-success/10 flex items-center justify-center text-success">
                          {getMethodIcon(p.method)}
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {p.patient?.first_name} {p.patient?.last_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {getPaymentMethodLabel(p.method)}
                            {p.reference && ` • ${p.reference}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-success">{formatCurrency(Number(p.amount))}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(p.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Payment Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Enregistrer un paiement</DialogTitle>
            <DialogDescription>
              {selectedInvoice && selectedInvoice.patient && (
                <span>
                  {selectedInvoice.patient.first_name} {selectedInvoice.patient.last_name} — {selectedInvoice.invoice_number}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {invLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : selectedInvoice ? (
            <div className="space-y-4">
              {/* Invoice summary */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-2 rounded-lg bg-muted">
                  <p className="text-xs text-muted-foreground">Total facture</p>
                  <p className="font-bold">{formatCurrency(Number(selectedInvoice.total_amount))}</p>
                </div>
                <div className="p-2 rounded-lg bg-success/10">
                  <p className="text-xs text-muted-foreground">Déjà payé</p>
                  <p className="font-bold text-success">{formatCurrency(Number(selectedInvoice.paid_amount))}</p>
                </div>
                <div className="p-2 rounded-lg bg-warning/10">
                  <p className="text-xs text-muted-foreground">Reste patient</p>
                  <p className="font-bold text-warning">{formatCurrency(remaining)}</p>
                </div>
              </div>

              {/* Convention breakdown if applicable */}
              {(Number(selectedInvoice.company_amount) > 0 || Number(selectedInvoice.insurance_amount) > 0) && (
                <div className="p-3 rounded-lg bg-muted/50 border text-sm space-y-1">
                  <p className="font-semibold text-xs text-muted-foreground mb-1">Répartition convention</p>
                  {Number(selectedInvoice.company_amount) > 0 && (
                    <div className="flex justify-between">
                      <span>Part société</span>
                      <span className="font-medium">{formatCurrency(Number(selectedInvoice.company_amount))}</span>
                    </div>
                  )}
                  {Number(selectedInvoice.insurance_amount) > 0 && (
                    <div className="flex justify-between">
                      <span>Part assurance</span>
                      <span className="font-medium">{formatCurrency(Number(selectedInvoice.insurance_amount))}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold border-t pt-1">
                    <span>Part patient</span>
                    <span className="text-primary">{formatCurrency(invoiceOwed)}</span>
                  </div>
                </div>
              )}

              {/* Items */}
              {selectedInvoice.items && selectedInvoice.items.length > 0 && (
                <div className="border rounded-lg p-3">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Détails facture</p>
                  <div className="space-y-1">
                    {selectedInvoice.items.map(item => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>{item.description} ×{item.quantity}</span>
                        <span>{formatCurrency(Number(item.total_price))}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Payment entries */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">Modes de paiement</Label>
                  <Button variant="outline" size="sm" onClick={addEntry} className="gap-1">
                    <Plus className="h-3.5 w-3.5" />
                    Ajouter
                  </Button>
                </div>

                {entries.map((entry, idx) => (
                  <div key={idx} className="flex items-end gap-2 p-3 border rounded-lg bg-muted/30">
                    <div className="flex-1 space-y-1.5">
                      <Label className="text-xs">Mode</Label>
                      <Select value={entry.method} onValueChange={v => updateEntry(idx, 'method', v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PAYMENT_METHODS.map(m => (
                            <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-[130px] space-y-1.5">
                      <Label className="text-xs">Montant</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={entry.amount}
                        onChange={e => updateEntry(idx, 'amount', e.target.value)}
                        onClick={() => {
                          if (!entry.amount && entries.length === 1) autoFillRemaining();
                        }}
                      />
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <Label className="text-xs">Référence</Label>
                      <Input
                        placeholder={
                          entry.method === 'cheque'
                            ? 'N° chèque'
                            : ['airtel_money', 'moov_money', 'konoom'].includes(entry.method)
                            ? 'N° transaction'
                            : 'Optionnel'
                        }
                        value={entry.reference}
                        onChange={e => updateEntry(idx, 'reference', e.target.value)}
                      />
                    </div>
                    {entries.length > 1 && (
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeEntry(idx)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}

                {/* Total */}
                <div className="flex justify-between items-center p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <span className="font-medium">Total à encaisser</span>
                  <span className={`text-lg font-bold ${totalEntered > remaining ? 'text-destructive' : 'text-primary'}`}>
                    {formatCurrency(totalEntered)}
                  </span>
                </div>
              </div>
            </div>
          ) : null}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            {selectedInvoice && <InvoicePDFExport invoice={selectedInvoice} />}
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
              <Button
                onClick={handleSubmit}
                disabled={recordPayment.isPending || totalEntered <= 0 || totalEntered > remaining}
              >
                {recordPayment.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Confirmer le paiement
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

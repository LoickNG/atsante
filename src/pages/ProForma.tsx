import { useState } from 'react';
import { AppLayout, PageHeader } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  FileText, Plus, Trash2, Receipt, Loader2, Search, Building2, ArrowLeft,
} from 'lucide-react';
import { useSearchPatients, type Patient } from '@/hooks/usePatients';
import { useCreateInvoice, type NewInvoiceItem } from '@/hooks/useBilling';
import { useConventions, type ConventionWithRelations } from '@/hooks/useConventions';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'decimal', minimumFractionDigits: 0 }).format(amount) + ' FCFA';

interface ProFormaItem {
  description: string;
  quantity: number;
  unit_price: number;
}

export default function ProForma() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [manualPatientName, setManualPatientName] = useState('');
  const [useManualName, setUseManualName] = useState(false);
  const [patientConvention, setPatientConvention] = useState<ConventionWithRelations | null>(null);
  const [items, setItems] = useState<ProFormaItem[]>([{ description: '', quantity: 1, unit_price: 0 }]);
  const [discountPercent, setDiscountPercent] = useState(0);

  const { data: searchResults } = useSearchPatients(patientSearch);
  const { data: allConventions } = useConventions();
  const createInvoice = useCreateInvoice();

  const handleSelectPatient = async (p: Patient) => {
    setSelectedPatient(p);
    setPatientSearch('');

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

  const addItem = () => setItems(prev => [...prev, { description: '', quantity: 1, unit_price: 0 }]);

  const removeItem = (idx: number) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, field: keyof ProFormaItem, value: string | number) => {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const validItems = items.filter(i => i.description.trim() && i.quantity > 0 && i.unit_price > 0);
  const subtotal = validItems.reduce((s, i) => s + i.quantity * i.unit_price, 0);
  const discountAmt = Math.round(subtotal * discountPercent / 100);
  const total = subtotal - discountAmt;
  const companyAmount = patientConvention ? Math.round(total * patientConvention.company_coverage_percent / 100) : 0;
  const insuranceAmount = patientConvention ? Math.round(total * patientConvention.insurance_coverage_percent / 100) : 0;
  const patientAmount = patientConvention ? total - companyAmount - insuranceAmount : total;

  const handleGenerate = async () => {
    const hasPatient = selectedPatient || (useManualName && manualPatientName.trim());
    if (!hasPatient || validItems.length === 0) {
      toast({ title: 'Erreur', description: 'Indiquez un patient et ajoutez au moins une ligne valide.', variant: 'destructive' });
      return;
    }

    const invoiceItems: NewInvoiceItem[] = validItems.map(i => ({
      type: 'autre',
      description: i.description,
      quantity: i.quantity,
      unit_price: i.unit_price,
    }));

    try {
      if (selectedPatient) {
        await createInvoice.mutateAsync({
          patient_id: selectedPatient.id,
          created_by: user!.id,
          items: invoiceItems,
          convention_id: patientConvention?.id,
          company_amount: companyAmount,
          insurance_amount: insuranceAmount,
          patient_amount: patientAmount,
          is_proforma: true,
          discount_percent: discountPercent,
          discount_amount: discountAmt,
        } as any);
      } else {
        // Manual patient name — create a minimal patient record first
        const nameParts = manualPatientName.trim().split(/\s+/);
        const firstName = nameParts[0] || manualPatientName.trim();
        const lastName = nameParts.slice(1).join(' ') || '-';
        const { data: newPatient, error: patErr } = await supabase
          .from('patients')
          .insert({ first_name: firstName, last_name: lastName, code: '', date_of_birth: '2000-01-01', gender: 'M', phone: '-' })
          .select()
          .single();
        if (patErr) throw patErr;
        await createInvoice.mutateAsync({
          patient_id: newPatient.id,
          created_by: user!.id,
          items: invoiceItems,
          is_proforma: true,
          discount_percent: discountPercent,
          discount_amount: discountAmt,
          patient_amount: total,
        } as any);
      }
      toast({ title: 'Facture Pro Forma générée', description: `Montant : ${formatCurrency(total)}` });
      navigate('/facturation');
    } catch (error: any) {
      toast({ title: 'Erreur', description: error?.message || 'Erreur lors de la création', variant: 'destructive' });
    }
  };

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <PageHeader title="Facture Pro Forma" description="Créez un devis indépendant du parcours patient">
          <Button variant="outline" onClick={() => navigate('/facturation')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </PageHeader>

        <Card className="border-secondary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-secondary-foreground" />
              Nouvelle facture Pro Forma
              <Badge variant="outline" className="ml-2 bg-secondary/50 text-secondary-foreground">Devis</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">

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
                <Button variant="outline" onClick={() => { setSelectedPatient(null); setPatientConvention(null); }}>
                  Changer
                </Button>
              </div>
            ) : useManualName ? (
              <div className="space-y-2">
                <Label className="font-semibold">Nom du patient</Label>
                <Input
                  placeholder="Entrez le nom complet du patient..."
                  value={manualPatientName}
                  onChange={e => setManualPatientName(e.target.value)}
                  className="h-12 text-base"
                  autoFocus
                />
                <Button variant="link" className="text-xs p-0 h-auto" onClick={() => { setUseManualName(false); setManualPatientName(''); }}>
                  ← Rechercher dans la liste des patients
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Label className="font-semibold">Patient</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher un patient par nom, code ou téléphone..."
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
                        className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors border-b last:border-b-0"
                        onClick={() => handleSelectPatient(p)}
                      >
                        <p className="font-medium">{p.first_name} {p.last_name}</p>
                        <p className="text-xs text-muted-foreground">{p.code} • {p.phone}</p>
                      </button>
                    ))}
                  </div>
                )}
                {patientSearch.length > 0 && searchResults && searchResults.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-3">Aucun patient trouvé</p>
                )}
                <Button variant="link" className="text-xs p-0 h-auto" onClick={() => setUseManualName(true)}>
                  Patient non enregistré ? Saisir un nom manuellement
                </Button>
              </div>
            )}

            <Separator />

            {/* Manual line items */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="font-semibold text-base">Lignes de la facture</Label>
                <Button variant="outline" size="sm" onClick={addItem}>
                  <Plus className="h-4 w-4 mr-1" />
                  Ajouter une ligne
                </Button>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[250px]">Description</TableHead>
                      <TableHead className="w-[100px]">Quantité</TableHead>
                      <TableHead className="w-[140px]">Prix unitaire</TableHead>
                      <TableHead className="w-[120px] text-right">Total</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <Input
                            placeholder="Ex: Consultation générale, Bilan sanguin..."
                            value={item.description}
                            onChange={e => updateItem(idx, 'description', e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={e => updateItem(idx, 'quantity', parseInt(e.target.value) || 1)}
                            className="text-center"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            value={item.unit_price}
                            onChange={e => updateItem(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                            className="text-right"
                          />
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(item.quantity * item.unit_price)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => removeItem(idx)}
                            disabled={items.length <= 1}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <Separator />

            {/* Discount */}
            {subtotal > 0 && (
              <div className="p-3 rounded-lg bg-muted/50 border space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">Remise (%)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      className="w-20 h-8 text-right text-sm"
                      value={discountPercent}
                      onChange={e => setDiscountPercent(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                </div>
                {discountAmt > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Sous-total : {formatCurrency(subtotal)}</span>
                    <span className="text-destructive font-medium">- {formatCurrency(discountAmt)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Total */}
            <div className="space-y-2">
              <div className="flex justify-between items-center p-3 rounded-lg bg-primary/5 border border-primary/20">
                <span className="font-semibold">Total Pro Forma</span>
                <span className="text-xl font-bold text-primary">{formatCurrency(total)}</span>
              </div>

              {patientConvention && total > 0 && (
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
                className="w-full gap-2 h-12"
                size="lg"
                onClick={handleGenerate}
                disabled={!selectedPatient || validItems.length === 0 || createInvoice.isPending}
              >
                {createInvoice.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                <Receipt className="h-5 w-5" />
                Générer la facture Pro Forma — {formatCurrency(total)}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

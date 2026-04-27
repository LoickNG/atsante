import { useState, useMemo } from 'react';
import { AppLayout, PageHeader } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Loader2, FileDown, Building2, ShieldCheck, Filter, FileSpreadsheet,
} from 'lucide-react';
import { useInvoices, type InvoiceWithDetails } from '@/hooks/useBilling';
import { useConventions, usePartnerCompanies, useInsuranceCompanies } from '@/hooks/useConventions';
import * as XLSX from 'xlsx';
import { useClinicSettings } from '@/hooks/useClinicSettings';
import { buildClinicHeader, buildClinicHeaderHtml, buildClinicFooterHtml } from '@/utils/printResult';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'decimal', minimumFractionDigits: 0 }).format(amount) + ' FCFA';

const formatDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });

type ExtractType = 'company' | 'insurance';

function buildExportRows(
  invoicesToExport: InvoiceWithDetails[],
  conventions: any[],
  extractType: ExtractType
) {
  return invoicesToExport.map(inv => {
    const conv = conventions.find(c => c.id === inv.convention_id);
    const amount = extractType === 'company' ? Number(inv.company_amount) : Number(inv.insurance_amount);
    return {
      'N° Facture': inv.invoice_number,
      'Patient': inv.patient ? `${inv.patient.first_name} ${inv.patient.last_name}` : '—',
      'Code Patient': inv.patient?.code || '—',
      'Convention': conv?.name || '—',
      'Date': formatDate(inv.created_at),
      'Total Facture': Number(inv.total_amount),
      [extractType === 'company' ? 'Part Société' : 'Part Assurance']: amount,
      'Statut': inv.status === 'paye' ? 'Payé' : inv.status === 'partiel' ? 'Partiel' : 'En attente',
    };
  });
}

function exportToExcel(rows: Record<string, any>[], filename: string) {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Relevé');
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

function exportToCSV(rows: Record<string, any>[], filename: string) {
  const ws = XLSX.utils.json_to_sheet(rows);
  const csv = XLSX.utils.sheet_to_csv(ws, { FS: ';' });
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Extracts() {
  const [extractType, setExtractType] = useState<ExtractType>('company');
  const [selectedEntityId, setSelectedEntityId] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { data: invoices, isLoading: invoicesLoading } = useInvoices();
  const { data: conventions } = useConventions();
  const { data: companies } = usePartnerCompanies();
  const { data: insurances } = useInsuranceCompanies();

  const conventionsByEntity = useMemo(() => {
    if (!conventions) return {};
    const map: Record<string, string[]> = {};
    for (const c of conventions) {
      const key = extractType === 'company' ? c.company_id : (c.insurance_id || '');
      if (!key) continue;
      if (!map[key]) map[key] = [];
      map[key].push(c.id);
    }
    return map;
  }, [conventions, extractType]);

  const filteredInvoices = useMemo(() => {
    if (!invoices) return [];
    return invoices.filter(inv => {
      if (!inv.convention_id) return false;
      // Exclude proforma invoices from extracts
      if ((inv as any).is_proforma) return false;

      const relevantAmount = extractType === 'company'
        ? Number(inv.company_amount)
        : Number(inv.insurance_amount);
      if (relevantAmount <= 0) return false;

      if (selectedEntityId !== 'all') {
        const conventionIds = conventionsByEntity[selectedEntityId] || [];
        if (!conventionIds.includes(inv.convention_id)) return false;
      }

      if (dateFrom && new Date(inv.created_at) < new Date(dateFrom)) return false;
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59);
        if (new Date(inv.created_at) > to) return false;
      }

      return true;
    });
  }, [invoices, extractType, selectedEntityId, conventionsByEntity, dateFrom, dateTo]);

  const groupedSummary = useMemo(() => {
    const groups: Record<string, { name: string; invoices: InvoiceWithDetails[]; totalAmount: number }> = {};

    for (const inv of filteredInvoices) {
      const conv = (conventions || []).find(c => c.id === inv.convention_id);
      if (!conv) continue;

      const entityId = extractType === 'company' ? conv.company_id : (conv.insurance_id || '');
      const entityName = extractType === 'company'
        ? conv.company?.name || 'Société inconnue'
        : conv.insurance?.name || 'Assurance inconnue';
      const amount = extractType === 'company' ? Number(inv.company_amount) : Number(inv.insurance_amount);

      if (!groups[entityId]) {
        groups[entityId] = { name: entityName, invoices: [], totalAmount: 0 };
      }
      groups[entityId].invoices.push(inv);
      groups[entityId].totalAmount += amount;
    }

    return Object.entries(groups).sort((a, b) => b[1].totalAmount - a[1].totalAmount);
  }, [filteredInvoices, conventions, extractType]);

  const grandTotal = groupedSummary.reduce((s, [, g]) => s + g.totalAmount, 0);
  const entities = extractType === 'company' ? companies : insurances;

  const getExportFilename = (entityName?: string) => {
    const type = extractType === 'company' ? 'Societe' : 'Assurance';
    const entity = entityName || 'Tous';
    const period = dateFrom || dateTo ? `_${dateFrom || 'debut'}_${dateTo || 'fin'}` : '';
    return `Releve_${type}_${entity}${period}`.replace(/\s+/g, '_');
  };

  const handleExport = (format: 'excel' | 'csv', entityId?: string) => {
    const invoicesToExport = entityId
      ? groupedSummary.find(([id]) => id === entityId)?.[1].invoices || []
      : filteredInvoices;
    const entityName = entityId
      ? groupedSummary.find(([id]) => id === entityId)?.[1].name
      : undefined;

    const rows = buildExportRows(invoicesToExport, conventions || [], extractType);
    const filename = getExportFilename(entityName);

    if (format === 'excel') exportToExcel(rows, filename);
    else exportToCSV(rows, filename);
  };

  const handlePrintExtract = (entityId?: string) => {
    const entityName = entityId
      ? groupedSummary.find(([id]) => id === entityId)?.[1].name
      : (extractType === 'company' ? 'Toutes les sociétés' : 'Toutes les assurances');

    const invoicesToPrint = entityId
      ? groupedSummary.find(([id]) => id === entityId)?.[1].invoices || []
      : filteredInvoices;

    const totalAmount = entityId
      ? groupedSummary.find(([id]) => id === entityId)?.[1].totalAmount || 0
      : grandTotal;

    const periodLabel = dateFrom || dateTo
      ? `Période : ${dateFrom ? formatDate(dateFrom) : '...'} — ${dateTo ? formatDate(dateTo) : '...'}`
      : 'Toutes les dates';

    const html = buildExtractHTML(
      extractType,
      entityName || '',
      invoicesToPrint,
      totalAmount,
      periodLabel,
      conventions || [],
      extractType
    );

    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(html);
    w.document.close();
    setTimeout(() => w.print(), 500);
  };

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <PageHeader title="Extraits & Relevés" description="Générez des relevés pour les sociétés partenaires et les assurances" />

        <Tabs value={extractType} onValueChange={v => { setExtractType(v as ExtractType); setSelectedEntityId('all'); }}>
          <TabsList className="mb-4">
            <TabsTrigger value="company" className="gap-2">
              <Building2 className="h-4 w-4" />
              Relevés Sociétés
            </TabsTrigger>
            <TabsTrigger value="insurance" className="gap-2">
              <ShieldCheck className="h-4 w-4" />
              Relevés Assurances
            </TabsTrigger>
          </TabsList>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtres
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">{extractType === 'company' ? 'Société' : 'Assurance'}</Label>
                  <Select value={selectedEntityId} onValueChange={setSelectedEntityId}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes</SelectItem>
                      {(entities || []).map(e => (
                        <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Date début</Label>
                  <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Date fin</Label>
                  <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                {extractType === 'company' ? 'Sociétés concernées' : 'Assurances concernées'}
              </p>
              <p className="text-2xl font-bold">{groupedSummary.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Factures</p>
              <p className="text-2xl font-bold">{filteredInvoices.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Montant total dû</p>
              <p className="text-2xl font-bold text-primary">{formatCurrency(grandTotal)}</p>
            </CardContent>
          </Card>
        </div>

        {invoicesLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : groupedSummary.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Aucune facture avec convention trouvée pour ces critères
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Export all buttons */}
            <div className="flex justify-end gap-2 flex-wrap">
              <Button variant="outline" onClick={() => handleExport('csv')} className="gap-2">
                <FileDown className="h-4 w-4" />
                Exporter CSV
              </Button>
              <Button variant="outline" onClick={() => handleExport('excel')} className="gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                Exporter Excel
              </Button>
              <Button onClick={() => handlePrintExtract()} className="gap-2">
                <FileDown className="h-4 w-4" />
                Imprimer tout — {formatCurrency(grandTotal)}
              </Button>
            </div>

            {groupedSummary.map(([entityId, group]) => (
              <Card key={entityId}>
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {extractType === 'company'
                      ? <Building2 className="h-5 w-5 text-primary" />
                      : <ShieldCheck className="h-5 w-5 text-primary" />
                    }
                    <div>
                      <CardTitle className="text-base">{group.name}</CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {group.invoices.length} facture(s) — Total : {formatCurrency(group.totalAmount)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleExport('csv', entityId)} className="gap-1" title="CSV">
                      <FileDown className="h-3.5 w-3.5" />
                      CSV
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleExport('excel', entityId)} className="gap-1" title="Excel">
                      <FileSpreadsheet className="h-3.5 w-3.5" />
                      Excel
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handlePrintExtract(entityId)} className="gap-1">
                      <FileDown className="h-3.5 w-3.5" />
                      Imprimer
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>N° Facture</TableHead>
                          <TableHead>Patient</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Total facture</TableHead>
                          <TableHead className="text-right">
                            {extractType === 'company' ? 'Part société' : 'Part assurance'}
                          </TableHead>
                          <TableHead>Statut</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group.invoices.map(inv => {
                          const amount = extractType === 'company'
                            ? Number(inv.company_amount)
                            : Number(inv.insurance_amount);
                          return (
                            <TableRow key={inv.id}>
                              <TableCell className="font-mono text-sm">{inv.invoice_number}</TableCell>
                              <TableCell className="font-medium">
                                {inv.patient ? `${inv.patient.first_name} ${inv.patient.last_name}` : '—'}
                              </TableCell>
                              <TableCell className="text-sm">{formatDate(inv.created_at)}</TableCell>
                              <TableCell className="text-right">{formatCurrency(Number(inv.total_amount))}</TableCell>
                              <TableCell className="text-right font-semibold text-primary">{formatCurrency(amount)}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className={
                                  inv.status === 'paye' ? 'bg-success/10 text-success border-success/30' :
                                  inv.status === 'partiel' ? 'bg-info/10 text-info border-info/30' :
                                  'bg-warning/10 text-warning border-warning/30'
                                }>
                                  {inv.status === 'paye' ? 'Payé' : inv.status === 'partiel' ? 'Partiel' : 'En attente'}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                        <TableRow className="font-semibold bg-muted/30">
                          <TableCell colSpan={4} className="text-right">Total</TableCell>
                          <TableCell className="text-right text-primary">{formatCurrency(group.totalAmount)}</TableCell>
                          <TableCell />
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        </Tabs>
      </div>
    </AppLayout>
  );
}

function buildExtractHTML(
  type: ExtractType,
  entityName: string,
  invoices: InvoiceWithDetails[],
  totalAmount: number,
  periodLabel: string,
  conventions: any[],
  extractType: ExtractType
): string {
  const today = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  const typeLabel = type === 'company' ? 'Société' : 'Assurance';
  const amountLabel = type === 'company' ? 'Part société' : 'Part assurance';

  const rows = invoices.map(inv => {
    const amount = type === 'company' ? Number(inv.company_amount) : Number(inv.insurance_amount);
    const conv = conventions.find(c => c.id === inv.convention_id);
    return `
      <tr>
        <td>${inv.invoice_number}</td>
        <td>${inv.patient ? `${inv.patient.first_name} ${inv.patient.last_name}` : '—'}</td>
        <td>${inv.patient?.code || '—'}</td>
        <td>${conv?.name || '—'}</td>
        <td>${new Date(inv.created_at).toLocaleDateString('fr-FR')}</td>
        <td style="text-align:right">${new Intl.NumberFormat('fr-FR').format(Number(inv.total_amount))} FCFA</td>
        <td style="text-align:right;font-weight:bold;color:#2563eb">${new Intl.NumberFormat('fr-FR').format(amount)} FCFA</td>
      </tr>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Relevé ${typeLabel} — ${entityName}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Segoe UI',Tahoma,sans-serif; font-size:11px; color:#1a1a1a; padding:15mm; }
  .header { display:flex; justify-content:space-between; border-bottom:3px solid #2563eb; padding-bottom:12px; margin-bottom:20px; }
  .header h1 { font-size:20px; color:#2563eb; }
  .header .sub { font-size:10px; color:#666; }
  .meta { background:#f0f4ff; padding:14px; border-radius:6px; margin-bottom:20px; display:grid; grid-template-columns:1fr 1fr; gap:8px; }
  .meta .label { font-size:10px; color:#666; font-weight:600; }
  .meta .value { font-size:12px; font-weight:bold; }
  table { width:100%; border-collapse:collapse; font-size:10px; margin-bottom:20px; }
  th, td { padding:6px 8px; border:1px solid #e5e7eb; text-align:left; }
  th { background:#f9fafb; font-weight:600; }
  .total-row { background:#f0f4ff; font-weight:bold; }
  .total-row td { border-top:2px solid #2563eb; }
  .footer { margin-top:40px; border-top:1px solid #ddd; padding-top:15px; }
  .footer .signatures { display:grid; grid-template-columns:1fr 1fr; gap:40px; margin-top:30px; }
  .footer .sig-block { border-top:1px solid #999; padding-top:8px; text-align:center; font-size:10px; color:#666; }
  .summary { text-align:right; font-size:14px; margin-bottom:20px; padding:10px; background:#f0f4ff; border-radius:6px; }
  @media print { body { padding:10mm; } }
</style>
</head>
<body>
  <div class="header">
    <div>
      <h1>SantéPro</h1>
      <div class="sub">Clinique Médicale</div>
      <div class="sub" style="margin-top:4px;font-weight:bold;font-size:13px">RELEVÉ DE PRESTATIONS</div>
    </div>
    <div style="text-align:right">
      <div class="sub">Document généré le</div>
      <div style="font-size:12px;font-weight:bold">${today}</div>
    </div>
  </div>

  <div class="meta">
    <div><span class="label">Destinataire :</span><br><span class="value">${entityName}</span></div>
    <div><span class="label">Type :</span><br><span class="value">${typeLabel}</span></div>
    <div><span class="label">Période :</span><br><span class="value">${periodLabel}</span></div>
    <div><span class="label">Nombre de factures :</span><br><span class="value">${invoices.length}</span></div>
  </div>

  <table>
    <thead>
      <tr>
        <th>N° Facture</th>
        <th>Patient</th>
        <th>Code</th>
        <th>Convention</th>
        <th>Date</th>
        <th style="text-align:right">Total facture</th>
        <th style="text-align:right">${amountLabel}</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
      <tr class="total-row">
        <td colspan="6" style="text-align:right">TOTAL DÛ</td>
        <td style="text-align:right;color:#2563eb;font-size:12px">${new Intl.NumberFormat('fr-FR').format(totalAmount)} FCFA</td>
      </tr>
    </tbody>
  </table>

  <div class="summary">
    Montant total à régler : <strong style="color:#2563eb;font-size:16px">${new Intl.NumberFormat('fr-FR').format(totalAmount)} FCFA</strong>
  </div>

  <div class="footer">
    <p style="font-size:10px;color:#666;margin-bottom:5px">Ce document constitue un relevé des prestations médicales effectuées dans le cadre de la convention en vigueur.</p>
    <p style="font-size:10px;color:#666">Merci de procéder au règlement dans les délais convenus.</p>
    
    <div class="signatures">
      <div>
        <div style="height:60px"></div>
        <div class="sig-block">Cachet et signature<br>SantéPro</div>
      </div>
      <div>
        <div style="height:60px"></div>
        <div class="sig-block">Cachet et signature<br>${entityName}</div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

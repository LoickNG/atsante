import { useState } from 'react';
import { AppLayout, PageHeader } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Search, FileText, CreditCard, Eye } from 'lucide-react';
import { useInvoices } from '@/hooks/useBilling';
import { useNavigate } from 'react-router-dom';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'decimal', minimumFractionDigits: 0 }).format(amount) + ' FCFA';

const statusConfig: Record<string, { label: string; className: string }> = {
  en_attente: { label: 'En attente', className: 'bg-warning/10 text-warning border-warning/30' },
  partiel: { label: 'Partiel', className: 'bg-info/10 text-info border-info/30' },
  paye: { label: 'Payé', className: 'bg-success/10 text-success border-success/30' },
  annule: { label: 'Annulé', className: 'bg-destructive/10 text-destructive border-destructive/30' },
};

export default function Billing() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { data: invoices, isLoading } = useInvoices(statusFilter);
  const navigate = useNavigate();

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
        <PageHeader title="Facturation" description="Gestion des factures et encaissements" />

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
                <Input
                  placeholder="Rechercher..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 w-full sm:w-[220px]"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
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
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Aucune facture trouvée
              </div>
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
                          <TableCell className="font-medium">
                            {inv.patient ? `${inv.patient.first_name} ${inv.patient.last_name}` : '—'}
                          </TableCell>
                          <TableCell>{formatCurrency(Number(inv.total_amount))}</TableCell>
                          <TableCell className="text-success">{formatCurrency(Number(inv.paid_amount))}</TableCell>
                          <TableCell className={reste > 0 ? 'text-warning font-medium' : ''}>{formatCurrency(reste)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={sc.className}>{sc.label}</Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {new Date(inv.created_at).toLocaleDateString('fr-FR')}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {inv.status !== 'paye' && inv.status !== 'annule' && (
                                <Button size="sm" className="gap-1" onClick={() => navigate(`/paiements?invoice=${inv.id}`)}>
                                  <CreditCard className="h-3.5 w-3.5" />
                                  Payer
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

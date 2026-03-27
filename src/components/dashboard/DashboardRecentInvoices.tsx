import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const statusConfig: Record<string, { label: string; className: string }> = {
  en_attente: { label: 'En attente', className: 'bg-warning/10 text-warning border-warning/30' },
  payee: { label: 'Payée', className: 'bg-success/10 text-success border-success/30' },
  partielle: { label: 'Partielle', className: 'bg-info/10 text-info border-info/30' },
  annulee: { label: 'Annulée', className: 'bg-destructive/10 text-destructive border-destructive/30' },
};

export function DashboardRecentInvoices() {
  const { data: invoices, isLoading } = useQuery({
    queryKey: ['dashboard-recent-invoices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('*, patients(first_name, last_name)')
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000,
  });

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'decimal', minimumFractionDigits: 0 }).format(amount) + ' FCFA';

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Dernières factures
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/facturation" className="gap-1">
              Voir tout <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : !invoices || invoices.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Aucune facture</p>
        ) : (
          <div className="space-y-2">
            {invoices.map(inv => {
              const patient = (inv as any).patients;
              const cfg = statusConfig[inv.status] || { label: inv.status, className: '' };
              return (
                <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {inv.invoice_number} — {patient ? `${patient.first_name} ${patient.last_name}` : '—'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(inv.created_at), 'dd MMM yyyy HH:mm', { locale: fr })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className={cfg.className}>{cfg.label}</Badge>
                    <span className="text-sm font-semibold">{formatCurrency(Number(inv.total_amount))}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

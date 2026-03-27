import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Receipt, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const methodLabels: Record<string, string> = {
  especes: 'Espèces',
  carte: 'Carte',
  mobile_money: 'Mobile Money',
  virement: 'Virement',
  cheque: 'Chèque',
};

export function DashboardRecentPayments() {
  const { data: payments, isLoading } = useQuery({
    queryKey: ['dashboard-recent-payments'],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { data, error } = await supabase
        .from('payments')
        .select('*, invoices(invoice_number, patients(first_name, last_name))')
        .gte('created_at', today.toISOString())
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
            <Receipt className="h-4 w-4 text-success" />
            Paiements du jour
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/paiements" className="gap-1">
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
        ) : !payments || payments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Aucun paiement aujourd'hui</p>
        ) : (
          <div className="space-y-2">
            {payments.map(pay => {
              const invoice = pay.invoices as any;
              const patient = invoice?.patients;
              return (
                <div key={pay.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {patient ? `${patient.first_name} ${patient.last_name}` : invoice?.invoice_number || '—'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(pay.created_at), 'HH:mm', { locale: fr })} • {methodLabels[pay.method] || pay.method}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-success shrink-0">{formatCurrency(Number(pay.amount))}</span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

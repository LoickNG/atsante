import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

export type Invoice = Tables<'invoices'>;
export type InvoiceItem = Tables<'invoice_items'>;
export type Payment = Tables<'payments'>;

export const PAYMENT_METHODS = [
  { value: 'especes', label: 'Espèces' },
  { value: 'cheque', label: 'Chèque' },
  { value: 'airtel_money', label: 'Airtel Money' },
  { value: 'moov_money', label: 'Moov Money' },
  { value: 'konoom', label: 'Konoom' },
  { value: 'carte_bancaire', label: 'Carte bancaire' },
] as const;

export type PaymentMethod = typeof PAYMENT_METHODS[number]['value'];

export function getPaymentMethodLabel(method: string): string {
  return PAYMENT_METHODS.find(m => m.value === method)?.label || method;
}

export interface InvoiceWithDetails extends Invoice {
  patient: { id: string; first_name: string; last_name: string; code: string } | null;
  items: InvoiceItem[];
  payments: Payment[];
}

export function useInvoices(status?: string) {
  return useQuery({
    queryKey: ['invoices', status],
    queryFn: async () => {
      let query = supabase
        .from('invoices')
        .select(`
          *,
          patient:patients!invoices_patient_id_fkey(id, first_name, last_name, code),
          items:invoice_items!invoice_items_invoice_id_fkey(*),
          payments:payments!payments_invoice_id_fkey(*)
        `)
        .order('created_at', { ascending: false });

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as InvoiceWithDetails[];
    },
  });
}

export function useInvoice(id: string | undefined) {
  return useQuery({
    queryKey: ['invoices', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          patient:patients!invoices_patient_id_fkey(id, first_name, last_name, code, phone),
          items:invoice_items!invoice_items_invoice_id_fkey(*),
          payments:payments!payments_invoice_id_fkey(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as unknown as InvoiceWithDetails;
    },
    enabled: !!id,
  });
}

export function useRecordPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entries: { invoice_id: string; amount: number; method: string; reference?: string; received_by: string }[]) => {
      // Insert all payment entries
      const { error: payErr } = await supabase.from('payments').insert(entries);
      if (payErr) throw payErr;

      // Update invoice paid_amount and status
      const invoiceId = entries[0].invoice_id;
      const totalPaid = entries.reduce((s, e) => s + e.amount, 0);

      // Get current invoice
      const { data: inv, error: invErr } = await supabase
        .from('invoices')
        .select('total_amount, paid_amount')
        .eq('id', invoiceId)
        .single();
      if (invErr) throw invErr;

      const newPaidAmount = Number(inv.paid_amount) + totalPaid;
      const newStatus = newPaidAmount >= Number(inv.total_amount) ? 'paye' : 'partiel';

      const { error: updErr } = await supabase
        .from('invoices')
        .update({
          paid_amount: newPaidAmount,
          status: newStatus,
          ...(newStatus === 'paye' ? { paid_at: new Date().toISOString() } : {}),
        })
        .eq('id', invoiceId);
      if (updErr) throw updErr;

      return { newPaidAmount, newStatus };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}

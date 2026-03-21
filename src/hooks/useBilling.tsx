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
  patient: { id: string; first_name: string; last_name: string; code: string; phone?: string } | null;
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

export function useMedicalActs() {
  return useQuery({
    queryKey: ['medical_acts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('medical_acts')
        .select('*')
        .order('category', { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export interface NewInvoiceItem {
  type: string;
  description: string;
  quantity: number;
  unit_price: number;
  reference_id?: string;
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      patient_id,
      visit_id,
      created_by,
      items,
      convention_id,
      company_amount,
      insurance_amount,
      patient_amount,
    }: {
      patient_id: string;
      visit_id?: string;
      created_by: string;
      items: NewInvoiceItem[];
      convention_id?: string;
      company_amount?: number;
      insurance_amount?: number;
      patient_amount?: number;
    }) => {
      const total_amount = items.reduce((s, i) => s + i.quantity * i.unit_price, 0);

      // Build invoice data - let the DB trigger generate invoice_number
      const invoiceData: any = {
        patient_id,
        created_by,
        total_amount,
        convention_id: convention_id || null,
        company_amount: company_amount || 0,
        insurance_amount: insurance_amount || 0,
        patient_amount: patient_amount ?? total_amount,
        status: 'en_attente',
      };

      // Only include visit_id if provided
      if (visit_id) {
        invoiceData.visit_id = visit_id;
      }

      console.log('[Billing] Creating invoice with data:', JSON.stringify(invoiceData));

      const { data: invoice, error: invErr } = await supabase
        .from('invoices')
        .insert(invoiceData)
        .select()
        .single();
      if (invErr) {
        console.error('[Billing] Invoice creation error:', invErr);
        throw invErr;
      }
      console.log('[Billing] Invoice created:', invoice.id, invoice.invoice_number);

      // Create invoice items
      const itemsToInsert = items.map(i => ({
        invoice_id: invoice.id,
        type: i.type,
        description: i.description,
        quantity: i.quantity,
        unit_price: i.unit_price,
        total_price: i.quantity * i.unit_price,
        reference_id: i.reference_id || null,
      }));

      const { error: itemsErr } = await supabase.from('invoice_items').insert(itemsToInsert);
      if (itemsErr) throw itemsErr;

      return invoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}

export function useRecordPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entries: { invoice_id: string; amount: number; method: string; reference?: string; received_by: string }[]) => {
      const { error: payErr } = await supabase.from('payments').insert(entries);
      if (payErr) throw payErr;

      const invoiceId = entries[0].invoice_id;
      const totalPaid = entries.reduce((s, e) => s + e.amount, 0);

      const { data: inv, error: invErr } = await supabase
        .from('invoices')
        .select('total_amount, paid_amount, patient_amount, company_amount, insurance_amount')
        .eq('id', invoiceId)
        .single();
      if (invErr) throw invErr;

      // For convention invoices, the patient only owes patient_amount (can be 0 if fully covered)
      const hasConvention = Number(inv.company_amount) > 0 || Number(inv.insurance_amount) > 0;
      const amountOwed = hasConvention
        ? Number(inv.patient_amount)
        : Number(inv.total_amount);
      const newPaidAmount = Number(inv.paid_amount) + totalPaid;
      const newStatus = newPaidAmount >= amountOwed ? 'paye' : 'partiel';

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

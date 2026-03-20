import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface BillableItem {
  type: 'consultation' | 'medicament' | 'analyse' | 'imagerie';
  description: string;
  quantity: number;
  unit_price: number;
  reference_id: string;
  source_table: string;
}

/**
 * Fetches all unbilled services for a patient:
 * - Consultations without an invoice
 * - Dispensed prescriptions (medications)
 * - Completed lab requests
 * - Completed imaging requests
 */
export function usePatientBillableItems(patientId: string | undefined) {
  return useQuery({
    queryKey: ['patient_billable_items', patientId],
    queryFn: async () => {
      if (!patientId) return [];

      // 1. Get all existing invoice items for this patient to know what's already billed
      const { data: existingInvoices } = await supabase
        .from('invoices')
        .select('id, status')
        .eq('patient_id', patientId)
        .neq('status', 'annule');

      const invoiceIds = (existingInvoices || []).map(i => i.id);

      let billedReferenceIds: string[] = [];
      if (invoiceIds.length > 0) {
        const { data: billedItems } = await supabase
          .from('invoice_items')
          .select('reference_id')
          .in('invoice_id', invoiceIds);
        billedReferenceIds = (billedItems || [])
          .map(i => i.reference_id)
          .filter(Boolean) as string[];
      }

      const items: BillableItem[] = [];

      // 2. Consultations for this patient
      const { data: consultations } = await supabase
        .from('consultations')
        .select('id, date, status')
        .eq('patient_id', patientId);

      // Get consultation act price from medical_acts
      const { data: consultActs } = await supabase
        .from('medical_acts')
        .select('id, name, unit_price, category')
        .eq('category', 'consultation')
        .limit(1);

      const defaultConsultPrice = consultActs?.[0]?.unit_price ? Number(consultActs[0].unit_price) : 5000;
      const consultActName = consultActs?.[0]?.name || 'Consultation';

      for (const c of consultations || []) {
        if (!billedReferenceIds.includes(c.id)) {
          items.push({
            type: 'consultation',
            description: `${consultActName} du ${new Date(c.date).toLocaleDateString('fr-FR')}`,
            quantity: 1,
            unit_price: defaultConsultPrice,
            reference_id: c.id,
            source_table: 'consultations',
          });
        }
      }

      // 3. Dispensed prescriptions (medications)
      const { data: prescriptions } = await supabase
        .from('prescriptions')
        .select('id, medication_id, quantity, dosage, consultation_id, dispensed, medications(name, unit_price)')
        .eq('dispensed', true)
        .in('consultation_id', (consultations || []).map(c => c.id));

      for (const p of (prescriptions || []) as any[]) {
        if (!billedReferenceIds.includes(p.id)) {
          const med = p.medications;
          items.push({
            type: 'medicament',
            description: med?.name || 'Médicament',
            quantity: p.quantity || 1,
            unit_price: med?.unit_price ? Number(med.unit_price) : 0,
            reference_id: p.id,
            source_table: 'prescriptions',
          });
        }
      }

      // 4. Completed lab requests
      const { data: labRequests } = await supabase
        .from('lab_requests')
        .select('id, test_type, status')
        .eq('patient_id', patientId)
        .in('status', ['termine', 'en_cours', 'demande']);

      // Try to find lab act prices
      const { data: labActs } = await supabase
        .from('medical_acts')
        .select('id, name, unit_price, code, category')
        .eq('category', 'laboratoire');

      for (const lr of labRequests || []) {
        if (!billedReferenceIds.includes(lr.id)) {
          const matchAct = (labActs || []).find(
            a => a.name.toLowerCase().includes(lr.test_type.toLowerCase()) || 
                 lr.test_type.toLowerCase().includes(a.name.toLowerCase())
          );
          items.push({
            type: 'analyse',
            description: lr.test_type,
            quantity: 1,
            unit_price: matchAct ? Number(matchAct.unit_price) : 0,
            reference_id: lr.id,
            source_table: 'lab_requests',
          });
        }
      }

      // 5. Imaging requests
      const { data: imagingRequests } = await supabase
        .from('imaging_requests')
        .select('id, exam_type, body_part, status')
        .eq('patient_id', patientId)
        .in('status', ['termine', 'en_cours', 'demande']);

      const { data: imagingActs } = await supabase
        .from('medical_acts')
        .select('id, name, unit_price, code, category')
        .eq('category', 'imagerie');

      for (const ir of imagingRequests || []) {
        if (!billedReferenceIds.includes(ir.id)) {
          const examLabel = `${ir.exam_type} - ${ir.body_part}`;
          const matchAct = (imagingActs || []).find(
            a => a.name.toLowerCase().includes(ir.exam_type.toLowerCase())
          );
          items.push({
            type: 'imagerie',
            description: examLabel,
            quantity: 1,
            unit_price: matchAct ? Number(matchAct.unit_price) : 0,
            reference_id: ir.id,
            source_table: 'imaging_requests',
          });
        }
      }

      return items;
    },
    enabled: !!patientId,
  });
}

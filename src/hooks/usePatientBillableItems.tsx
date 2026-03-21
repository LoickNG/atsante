import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface BillableItem {
  type: 'consultation' | 'medicament' | 'analyse' | 'imagerie' | 'soin_hospitalisation' | 'hebergement';
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
      let billedDescriptions: Set<string> = new Set();
      if (invoiceIds.length > 0) {
        const { data: billedItems } = await supabase
          .from('invoice_items')
          .select('reference_id, description, type')
          .in('invoice_id', invoiceIds);
        billedReferenceIds = (billedItems || [])
          .map(i => i.reference_id)
          .filter(Boolean) as string[];
        // Also track descriptions for items without reference_id (legacy invoices)
        for (const item of billedItems || []) {
          if (item.description && item.type) {
            billedDescriptions.add(`${item.type}::${item.description}`);
          }
        }
      }

      const isAlreadyBilled = (refId: string, type: string, description: string): boolean => {
        if (billedReferenceIds.includes(refId)) return true;
        // Fallback: match by type+description for legacy items without reference_id
        return billedDescriptions.has(`${type}::${description}`);
      };

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

      // Try to find lab act prices - search in both 'laboratoire' and 'analyse' categories
      const { data: labActs } = await supabase
        .from('medical_acts')
        .select('id, name, unit_price, code, category')
        .in('category', ['laboratoire', 'analyse']);

      for (const lr of labRequests || []) {
        if (!billedReferenceIds.includes(lr.id)) {
          // Improved fuzzy matching: check if either string contains words from the other
          const testLower = lr.test_type.toLowerCase();
          const matchAct = (labActs || []).find(a => {
            const actLower = a.name.toLowerCase();
            // Direct contains
            if (actLower.includes(testLower) || testLower.includes(actLower)) return true;
            // Word-based matching: extract significant words (3+ chars) and check overlap
            const testWords = testLower.split(/[\s(),\-\/]+/).filter(w => w.length >= 3);
            const actWords = actLower.split(/[\s(),\-\/]+/).filter(w => w.length >= 3);
            const matchCount = testWords.filter(tw => actWords.some(aw => aw.includes(tw) || tw.includes(aw))).length;
            return matchCount >= 1 && matchCount >= Math.min(testWords.length, actWords.length) * 0.5;
          });
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

      // Map common exam_type abbreviations to full names for matching
      const examTypeAliases: Record<string, string[]> = {
        'radio': ['radiographie', 'radio'],
        'radiographie': ['radiographie', 'radio'],
        'echo': ['échographie', 'echo', 'ecographie'],
        'échographie': ['échographie', 'echo', 'ecographie'],
        'scanner': ['scanner'],
        'irm': ['irm', 'imagerie par résonance'],
        'tdm': ['scanner', 'tdm', 'tomodensitométrie'],
      };

      for (const ir of imagingRequests || []) {
        if (!billedReferenceIds.includes(ir.id)) {
          const examLabel = `${ir.exam_type} - ${ir.body_part}`;
          const examLower = ir.exam_type.toLowerCase();
          const aliases = examTypeAliases[examLower] || [examLower];
          
          const matchAct = (imagingActs || []).find(a => {
            const actLower = a.name.toLowerCase();
            return aliases.some(alias => actLower.includes(alias) || alias.includes(actLower.split(' ')[0]));
          });
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

      // 6. Hospitalization care items
      const { data: hospitalizations } = await supabase
        .from('hospitalizations')
        .select('id')
        .eq('patient_id', patientId);

      const hospIds = (hospitalizations || []).map(h => h.id);
      if (hospIds.length > 0) {
        const { data: careItems } = await supabase
          .from('hospitalization_care')
          .select('*')
          .in('hospitalization_id', hospIds);

        for (const ci of (careItems || []) as any[]) {
          if (!billedReferenceIds.includes(ci.id) && Number(ci.total_price) > 0) {
            items.push({
              type: 'soin_hospitalisation',
              description: `${ci.care_type}: ${ci.description}`,
              quantity: ci.quantity || 1,
              unit_price: Number(ci.unit_price) || 0,
              reference_id: ci.id,
              source_table: 'hospitalization_care',
            });
          }
        }
      }

      // 7. Hébergement (room charges) from active/completed hospitalizations
      const { data: hospWithRooms } = await supabase
        .from('hospitalizations')
        .select('id, admission_date, discharge_date, status, rooms(id, room_number, price_per_night)')
        .eq('patient_id', patientId)
        .not('room_id', 'is', null);

      for (const h of (hospWithRooms || []) as any[]) {
        if (!billedReferenceIds.includes(h.id) && h.rooms?.price_per_night > 0) {
          const start = new Date(h.admission_date);
          const end = h.discharge_date ? new Date(h.discharge_date) : new Date();
          const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
          items.push({
            type: 'hebergement',
            description: `Hébergement chambre ${h.rooms.room_number} (${days} jour${days > 1 ? 's' : ''})`,
            quantity: days,
            unit_price: Number(h.rooms.price_per_night),
            reference_id: h.id,
            source_table: 'hospitalizations',
          });
        }
      }

      return items;
    },
    enabled: !!patientId,
  });
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert } from '@/integrations/supabase/types';

export type Prescription = Tables<'prescriptions'>;
export type PrescriptionInsert = TablesInsert<'prescriptions'>;

export type PrescriptionWithMedication = Prescription & {
  medications: Tables<'medications'>;
};

export function usePrescriptions(consultationId?: string) {
  return useQuery({
    queryKey: ['prescriptions', consultationId],
    queryFn: async () => {
      let query = supabase
        .from('prescriptions')
        .select('*, medications(*)')
        .order('created_at', { ascending: false });
      
      if (consultationId) {
        query = query.eq('consultation_id', consultationId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as PrescriptionWithMedication[];
    },
  });
}

export function usePendingPrescriptions() {
  return useQuery({
    queryKey: ['prescriptions', 'pending'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prescriptions')
        .select(`
          *,
          medications(*),
          consultations(
            id,
            patients(id, first_name, last_name, code)
          )
        `)
        .eq('dispensed', false)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });
}

export function useCreatePrescription() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (prescription: Omit<PrescriptionInsert, 'medication_id'> & { medication_id?: string | null; medication_name?: string | null }) => {
      const { data, error } = await supabase
        .from('prescriptions')
        .insert({
          ...prescription,
          medication_id: prescription.medication_id || null,
        } as any)
        .select('*, medications(*)')
        .single();
      
      if (error) throw error;
      return data as PrescriptionWithMedication;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
    },
  });
}

export function useDispensePrescription() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, dispensedBy }: { id: string; dispensedBy: string }) => {
      const { data, error } = await supabase
        .from('prescriptions')
        .update({
          dispensed: true,
          dispensed_at: new Date().toISOString(),
          dispensed_by: dispensedBy,
        })
        .eq('id', id)
        .select('*, medications(*)')
        .single();
      
      if (error) throw error;
      return data as PrescriptionWithMedication;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
      queryClient.invalidateQueries({ queryKey: ['medications'] });
    },
  });
}

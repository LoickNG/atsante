import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert } from '@/integrations/supabase/types';

export type Consultation = Tables<'consultations'>;
export type ConsultationInsert = TablesInsert<'consultations'>;

export type ConsultationWithPatient = Consultation & {
  patients: Tables<'patients'>;
};

export function useConsultations(patientId?: string) {
  return useQuery({
    queryKey: ['consultations', patientId],
    queryFn: async () => {
      let query = supabase
        .from('consultations')
        .select('*, patients(*)')
        .order('date', { ascending: false });

      if (patientId) {
        query = query.eq('patient_id', patientId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ConsultationWithPatient[];
    },
  });
}

export function useCreateConsultation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (consultation: ConsultationInsert) => {
      const { data, error } = await supabase
        .from('consultations')
        .insert(consultation)
        .select('*, patients(*)')
        .single();

      if (error) throw error;
      return data as ConsultationWithPatient;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultations'] });
      queryClient.invalidateQueries({ queryKey: ['visits'] });
    },
  });
}

export function useUpdateConsultation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Consultation> & { id: string }) => {
      const { data, error } = await supabase
        .from('consultations')
        .update(updates)
        .eq('id', id)
        .select('*, patients(*)')
        .single();

      if (error) throw error;
      return data as ConsultationWithPatient;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultations'] });
    },
  });
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert } from '@/integrations/supabase/types';

export type LabRequest = Tables<'lab_requests'>;
export type LabRequestInsert = TablesInsert<'lab_requests'>;

export type LabRequestWithPatient = LabRequest & {
  patients: Tables<'patients'>;
};

export function useLabRequests(statusFilter?: string[]) {
  return useQuery({
    queryKey: ['lab_requests', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('lab_requests')
        .select('*, patients(*)')
        .order('requested_at', { ascending: false });
      
      if (statusFilter && statusFilter.length > 0) {
        query = query.in('status', statusFilter);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as LabRequestWithPatient[];
    },
  });
}

export function usePendingLabRequests() {
  return useQuery({
    queryKey: ['lab_requests', 'pending'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lab_requests')
        .select('*, patients(*)')
        .in('status', ['demande', 'en_cours'])
        .order('priority', { ascending: false })
        .order('requested_at', { ascending: true });
      
      if (error) throw error;
      return data as LabRequestWithPatient[];
    },
  });
}

export function useCreateLabRequest() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (request: LabRequestInsert) => {
      const { data, error } = await supabase
        .from('lab_requests')
        .insert(request)
        .select('*, patients(*)')
        .single();
      
      if (error) throw error;
      return data as LabRequestWithPatient;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lab_requests'] });
    },
  });
}

export function useUpdateLabRequest() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<LabRequest> & { id: string }) => {
      const { data, error } = await supabase
        .from('lab_requests')
        .update(updates)
        .eq('id', id)
        .select('*, patients(*)')
        .single();
      
      if (error) throw error;
      return data as LabRequestWithPatient;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lab_requests'] });
    },
  });
}

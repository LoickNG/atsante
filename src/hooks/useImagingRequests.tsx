import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert } from '@/integrations/supabase/types';

export type ImagingRequest = Tables<'imaging_requests'>;
export type ImagingRequestInsert = TablesInsert<'imaging_requests'>;

export type ImagingRequestWithPatient = ImagingRequest & {
  patients: Tables<'patients'>;
};

export function useImagingRequests(statusFilter?: string[]) {
  return useQuery({
    queryKey: ['imaging_requests', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('imaging_requests')
        .select('*, patients(*)')
        .order('requested_at', { ascending: false });
      
      if (statusFilter && statusFilter.length > 0) {
        query = query.in('status', statusFilter);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as ImagingRequestWithPatient[];
    },
  });
}

export function usePendingImagingRequests() {
  return useQuery({
    queryKey: ['imaging_requests', 'pending'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('imaging_requests')
        .select('*, patients(*)')
        .in('status', ['demande', 'en_cours'])
        .order('priority', { ascending: false })
        .order('requested_at', { ascending: true });
      
      if (error) throw error;
      return data as ImagingRequestWithPatient[];
    },
  });
}

export function useCreateImagingRequest() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (request: ImagingRequestInsert) => {
      const { data, error } = await supabase
        .from('imaging_requests')
        .insert(request)
        .select('*, patients(*)')
        .single();
      
      if (error) throw error;
      return data as ImagingRequestWithPatient;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['imaging_requests'] });
    },
  });
}

export function useUpdateImagingRequest() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ImagingRequest> & { id: string }) => {
      const { data, error } = await supabase
        .from('imaging_requests')
        .update(updates)
        .eq('id', id)
        .select('*, patients(*)')
        .single();
      
      if (error) throw error;
      return data as ImagingRequestWithPatient;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['imaging_requests'] });
    },
  });
}

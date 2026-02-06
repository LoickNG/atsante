import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert } from '@/integrations/supabase/types';
import { useEffect } from 'react';

export type Visit = Tables<'visits'>;
export type VisitInsert = TablesInsert<'visits'>;

export type VisitWithPatient = Visit & {
  patients: Tables<'patients'>;
};

export function useVisits(statusFilter?: string[]) {
  return useQuery({
    queryKey: ['visits', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('visits')
        .select('*, patients(*)')
        .order('date', { ascending: false });
      
      if (statusFilter && statusFilter.length > 0) {
        query = query.in('status', statusFilter);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as VisitWithPatient[];
    },
  });
}

export function useTodayVisits() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return useQuery({
    queryKey: ['visits', 'today'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('visits')
        .select('*, patients(*)')
        .gte('date', today.toISOString())
        .lt('date', tomorrow.toISOString())
        .order('date', { ascending: true });
      
      if (error) throw error;
      return data as VisitWithPatient[];
    },
  });
}

export function useWaitingQueue() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['visits', 'queue'],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data, error } = await supabase
        .from('visits')
        .select('*, patients(*)')
        .in('status', ['en_attente', 'en_cours'])
        .gte('date', today.toISOString())
        .order('type', { ascending: false }) // urgence first
        .order('date', { ascending: true });
      
      if (error) throw error;
      return data as VisitWithPatient[];
    },
  });

  // Set up realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('visits-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'visits' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['visits'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
}

export function useCreateVisit() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (visit: VisitInsert) => {
      const { data, error } = await supabase
        .from('visits')
        .insert(visit)
        .select('*, patients(*)')
        .single();
      
      if (error) throw error;
      return data as VisitWithPatient;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visits'] });
    },
  });
}

export function useUpdateVisit() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Visit> & { id: string }) => {
      const { data, error } = await supabase
        .from('visits')
        .update(updates)
        .eq('id', id)
        .select('*, patients(*)')
        .single();
      
      if (error) throw error;
      return data as VisitWithPatient;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visits'] });
    },
  });
}

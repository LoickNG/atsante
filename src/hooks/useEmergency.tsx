import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

export interface EmergencyVisit {
  id: string;
  patient_id: string;
  triage_level: 'critique' | 'urgent' | 'modere' | 'mineur';
  chief_complaint: string;
  arrival_mode: string;
  temperature: number | null;
  heart_rate: number | null;
  blood_pressure: string | null;
  spo2: number | null;
  respiratory_rate: number | null;
  weight: number | null;
  doctor_id: string | null;
  nurse_id: string | null;
  diagnosis: string | null;
  treatment_notes: string | null;
  orientation: string | null;
  orientation_notes: string | null;
  hospitalization_id: string | null;
  status: 'en_attente' | 'triage' | 'en_cours' | 'termine';
  arrived_at: string;
  triaged_at: string | null;
  care_started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  patients?: {
    id: string;
    first_name: string;
    last_name: string;
    code: string;
    date_of_birth: string;
    gender: string;
    phone: string;
  };
}

export function useEmergencyVisits(statusFilter?: string) {
  const queryClient = useQueryClient();

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('emergency-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'emergency_visits' }, () => {
        queryClient.invalidateQueries({ queryKey: ['emergency_visits'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  return useQuery({
    queryKey: ['emergency_visits', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('emergency_visits')
        .select('*, patients!emergency_visits_patient_id_fkey(id, first_name, last_name, code, date_of_birth, gender, phone)')
        .order('arrived_at', { ascending: false });

      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as EmergencyVisit[];
    },
  });
}

export function useCreateEmergencyVisit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (visit: {
      patient_id: string;
      triage_level: string;
      chief_complaint: string;
      arrival_mode: string;
      temperature?: number;
      heart_rate?: number;
      blood_pressure?: string;
      spo2?: number;
      respiratory_rate?: number;
      weight?: number;
    }) => {
      const { data, error } = await supabase
        .from('emergency_visits')
        .insert(visit)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['emergency_visits'] }),
  });
}

export function useUpdateEmergencyVisit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { data, error } = await supabase
        .from('emergency_visits')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['emergency_visits'] }),
  });
}

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

export type MedicalAct = Tables<'medical_acts'>;

export function useMedicalActs(category?: string) {
  return useQuery({
    queryKey: ['medical_acts', category],
    queryFn: async () => {
      let query = supabase
        .from('medical_acts')
        .select('*')
        .order('name');
      
      if (category) {
        query = query.eq('category', category);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as MedicalAct[];
    },
  });
}

export function useLabActs() {
  return useMedicalActs('analyse');
}

export function useImagingActs() {
  return useMedicalActs('imagerie');
}

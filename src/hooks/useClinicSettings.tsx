import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ClinicSettings {
  id: string;
  name: string;
  logo_url: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  phone: string | null;
  phone2: string | null;
  email: string | null;
  website: string | null;
  tax_id: string | null;
  license_number: string | null;
  slogan: string | null;
  primary_color: string | null;
}

export function useClinicSettings() {
  return useQuery({
    queryKey: ['clinic_settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clinic_settings')
        .select('*')
        .limit(1)
        .single();
      if (error) throw error;
      return data as ClinicSettings;
    },
    staleTime: 1000 * 60 * 10, // cache 10min
  });
}

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface StaffProfile {
  user_id: string;
  full_name: string;
  specialty: string | null;
}

export function useStaffProfiles() {
  const query = useQuery({
    queryKey: ['staff_profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, specialty');
      if (error) throw error;
      return data as StaffProfile[];
    },
    staleTime: 5 * 60 * 1000, // cache 5 min
  });

  const getStaffName = (userId: string | null | undefined): string => {
    if (!userId || !query.data) return '';
    const profile = query.data.find(p => p.user_id === userId);
    return profile?.full_name || '';
  };

  return { ...query, getStaffName };
}

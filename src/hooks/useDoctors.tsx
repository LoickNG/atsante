import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Doctor {
  user_id: string;
  full_name: string;
  specialty: string | null;
}

/**
 * Returns all users with the 'medecin' role within the current clinic.
 * Useful for re-assigning a consultation or referring a patient.
 */
export function useDoctors() {
  return useQuery({
    queryKey: ['doctors'],
    queryFn: async () => {
      const { data: roles, error: rolesErr } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'medecin');
      if (rolesErr) throw rolesErr;

      const ids = (roles || []).map(r => r.user_id);
      if (ids.length === 0) return [] as Doctor[];

      const { data: profiles, error: profErr } = await supabase
        .from('profiles')
        .select('user_id, full_name, specialty')
        .in('user_id', ids);
      if (profErr) throw profErr;

      return (profiles || []).map(p => ({
        user_id: p.user_id,
        full_name: p.full_name || 'Médecin',
        specialty: p.specialty,
      })) as Doctor[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

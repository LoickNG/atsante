import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ActiveLicense {
  license_key: string;
  clinic_name: string;
  max_users: number;
  current_users: number;
  enabled_modules: string[];
  start_date: string;
  expiry_date: string;
  is_active: boolean;
}

export function useActiveLicense() {
  return useQuery({
    queryKey: ['active_license'],
    queryFn: async () => {
      // First get the current user's clinic_id via the RPC
      const { data: clinicId } = await supabase.rpc('get_my_clinic_id');

      if (!clinicId) {
        // Fallback: try to get from profile directly
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data: profile } = await supabase
          .from('profiles')
          .select('clinic_id')
          .eq('user_id', user.id)
          .single();

        if (!profile?.clinic_id) return null;

        const { data: settings } = await supabase
          .from('clinic_settings')
          .select('activated_license_key')
          .eq('id', profile.clinic_id)
          .single();

        if (!settings?.activated_license_key) return null;

        const { data: license, error } = await supabase
          .from('licenses')
          .select('*')
          .eq('license_key', settings.activated_license_key)
          .single();

        if (error || !license) return null;
        return license as ActiveLicense;
      }

      // Get the activated license key from the user's own clinic settings
      const { data: settings } = await supabase
        .from('clinic_settings')
        .select('activated_license_key')
        .eq('id', clinicId)
        .single();

      if (!settings?.activated_license_key) return null;

      // Fetch the license details
      const { data: license, error } = await supabase
        .from('licenses')
        .select('*')
        .eq('license_key', settings.activated_license_key)
        .single();

      if (error || !license) return null;
      return license as ActiveLicense;
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useLicenseStatus() {
  const { data: license, isLoading } = useActiveLicense();

  const isValid = (() => {
    if (!license) return false;
    if (!license.is_active) return false;
    if (new Date(license.expiry_date) < new Date()) return false;
    return true;
  })();

  const isExpired = license ? new Date(license.expiry_date) < new Date() : false;
  const isSuspended = license ? !license.is_active : false;
  const canAddUser = license ? license.current_users < license.max_users : false;

  return {
    license,
    isLoading,
    isValid,
    isExpired,
    isSuspended,
    canAddUser,
    hasLicense: !!license,
  };
}

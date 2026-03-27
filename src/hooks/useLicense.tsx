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
      // Get the activated license key from clinic settings
      const { data: settings } = await supabase
        .from('clinic_settings')
        .select('activated_license_key')
        .limit(1)
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

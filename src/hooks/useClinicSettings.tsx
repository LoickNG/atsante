import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
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

const CLINIC_SETTINGS_KEY = ['clinic_settings'] as const;

async function fetchClinicSettings(): Promise<ClinicSettings> {
  const { data, error } = await supabase
    .from('clinic_settings')
    .select('*')
    .limit(1)
    .single();
  if (error) throw error;
  return data as ClinicSettings;
}

export function useClinicSettings() {
  return useQuery({
    queryKey: CLINIC_SETTINGS_KEY,
    queryFn: fetchClinicSettings,
    // Toujours considérer les paramètres comme potentiellement périmés
    // pour que toute impression utilise les dernières infos clinique.
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
}

/**
 * Hook qui fournit une fonction `getFreshClinicSettings()` à appeler
 * juste avant chaque impression. Force un fetch réseau en bypassant
 * tout cache (React Query + Service Worker PWA).
 */
export function useRefreshClinicSettings() {
  const queryClient = useQueryClient();

  return useCallback(async (): Promise<ClinicSettings | undefined> => {
    try {
      // Invalide les caches du Service Worker (PWA) — ignoré silencieusement si pas de SW.
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames
            .filter((n) => /clinic-settings|api-cache|clinic-logos/.test(n))
            .map((n) => caches.delete(n))
        );
      }
      // Force un refetch frais
      const data = await queryClient.fetchQuery({
        queryKey: CLINIC_SETTINGS_KEY,
        queryFn: fetchClinicSettings,
        staleTime: 0,
      });
      return data;
    } catch {
      // Fallback : on retourne ce qui est déjà en cache React Query
      return queryClient.getQueryData<ClinicSettings>(CLINIC_SETTINGS_KEY);
    }
  }, [queryClient]);
}

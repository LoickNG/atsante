import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface License {
  id: string;
  clinic_name: string;
  license_key: string;
  max_users: number;
  current_users: number;
  enabled_modules: string[];
  start_date: string;
  expiry_date: string;
  is_active: boolean;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const ALL_MODULES = [
  { value: 'accueil', label: 'Accueil' },
  { value: 'patients', label: 'Patients' },
  { value: 'consultations', label: 'Consultations' },
  { value: 'pharmacie', label: 'Pharmacie' },
  { value: 'laboratoire', label: 'Laboratoire' },
  { value: 'imagerie', label: 'Imagerie' },
  { value: 'hospitalisation', label: 'Hospitalisation' },
  { value: 'chirurgie', label: 'Bloc Opératoire' },
  { value: 'facturation', label: 'Facturation' },
  { value: 'conventions', label: 'Conventions' },
];

export { ALL_MODULES };

export function useLicenses() {
  return useQuery({
    queryKey: ['licenses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('licenses')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as License[];
    },
  });
}

export function useCreateLicense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (license: Partial<License>) => {
      const { data, error } = await supabase.from('licenses').insert(license as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['licenses'] });
      toast.success('Licence créée avec succès');
    },
    onError: (e: any) => toast.error('Erreur: ' + e.message),
  });
}

export function useUpdateLicense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<License> & { id: string }) => {
      const { error } = await supabase.from('licenses').update(updates as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['licenses'] });
      toast.success('Licence mise à jour');
    },
    onError: (e: any) => toast.error('Erreur: ' + e.message),
  });
}

export function useDeleteLicense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('licenses').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['licenses'] });
      toast.success('Licence supprimée');
    },
    onError: (e: any) => toast.error('Erreur: ' + e.message),
  });
}

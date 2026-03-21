import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface MaternityAdmission {
  id: string;
  patient_id: string;
  doctor_id: string;
  admission_date: string;
  expected_due_date: string | null;
  discharge_date: string | null;
  gestational_weeks: number | null;
  gravida: number | null;
  para: number | null;
  pregnancy_type: string;
  risk_level: string;
  blood_group: string | null;
  rhesus: string | null;
  notes: string | null;
  status: string;
  room_id: string | null;
  bed_number: number | null;
  created_at: string;
  updated_at: string;
  patients?: { first_name: string; last_name: string; code: string; date_of_birth: string; phone: string };
}

export interface Birth {
  id: string;
  maternity_admission_id: string;
  patient_id: string;
  baby_first_name: string | null;
  baby_last_name: string | null;
  baby_gender: string;
  birth_date: string;
  birth_weight_grams: number | null;
  birth_height_cm: number | null;
  apgar_1min: number | null;
  apgar_5min: number | null;
  apgar_10min: number | null;
  delivery_type: string;
  head_circumference_cm: number | null;
  complications: string | null;
  baby_status: string;
  notes: string | null;
  delivered_by: string | null;
  created_at: string;
  patients?: { first_name: string; last_name: string; code: string };
}

export function useMaternityAdmissions() {
  return useQuery({
    queryKey: ['maternity_admissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('maternity_admissions')
        .select('*, patients(first_name, last_name, code, date_of_birth, phone)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as MaternityAdmission[];
    },
  });
}

export function useActiveMaternityAdmissions() {
  return useQuery({
    queryKey: ['maternity_admissions', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('maternity_admissions')
        .select('*, patients(first_name, last_name, code, date_of_birth, phone)')
        .eq('status', 'en_cours')
        .order('admission_date', { ascending: false });
      if (error) throw error;
      return data as MaternityAdmission[];
    },
  });
}

export function useCreateMaternityAdmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (admission: Partial<MaternityAdmission>) => {
      const { data, error } = await supabase.from('maternity_admissions').insert(admission as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['maternity_admissions'] });
      toast.success('Admission maternité enregistrée');
    },
    onError: (e: any) => toast.error('Erreur: ' + e.message),
  });
}

export function useUpdateMaternityAdmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<MaternityAdmission> & { id: string }) => {
      const { error } = await supabase.from('maternity_admissions').update(updates as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['maternity_admissions'] });
      toast.success('Admission mise à jour');
    },
    onError: (e: any) => toast.error('Erreur: ' + e.message),
  });
}

export function useBirths(admissionId?: string) {
  return useQuery({
    queryKey: ['births', admissionId],
    queryFn: async () => {
      let query = supabase
        .from('births')
        .select('*, patients(first_name, last_name, code)')
        .order('birth_date', { ascending: false });
      if (admissionId) query = query.eq('maternity_admission_id', admissionId);
      const { data, error } = await query;
      if (error) throw error;
      return data as Birth[];
    },
  });
}

export function useCreateBirth() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (birth: Partial<Birth>) => {
      const { data, error } = await supabase.from('births').insert(birth as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['births'] });
      qc.invalidateQueries({ queryKey: ['maternity_admissions'] });
      toast.success('Naissance enregistrée avec succès 🎉');
    },
    onError: (e: any) => toast.error('Erreur: ' + e.message),
  });
}

export function usePrenatalVisits(admissionId?: string) {
  return useQuery({
    queryKey: ['prenatal_visits', admissionId],
    queryFn: async () => {
      let query = supabase
        .from('prenatal_visits')
        .select('*')
        .order('visit_date', { ascending: false });
      if (admissionId) query = query.eq('maternity_admission_id', admissionId);
      const { data, error } = await query;
      if (error) throw error;
      return data as PrenatalVisit[];
    },
  });
}

export function useCreatePrenatalVisit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (visit: Partial<PrenatalVisit>) => {
      const { data, error } = await supabase.from('prenatal_visits').insert(visit as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['prenatal_visits'] });
      toast.success('Consultation prénatale enregistrée');
    },
    onError: (e: any) => toast.error('Erreur: ' + e.message),
  });
}

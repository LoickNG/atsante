import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface InsuranceCompany {
  id: string;
  name: string;
  code: string;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  address: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PartnerCompany {
  id: string;
  name: string;
  code: string;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  address: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Convention {
  id: string;
  name: string;
  company_id: string;
  insurance_id: string | null;
  company_coverage_percent: number;
  insurance_coverage_percent: number;
  patient_coverage_percent: number;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConventionWithRelations extends Convention {
  company: PartnerCompany | null;
  insurance: InsuranceCompany | null;
}

// Insurance Companies
export function useInsuranceCompanies() {
  return useQuery({
    queryKey: ['insurance_companies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('insurance_companies')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as InsuranceCompany[];
    },
  });
}

export function useCreateInsuranceCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<InsuranceCompany>) => {
      const { data, error } = await supabase
        .from('insurance_companies')
        .insert(input as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['insurance_companies'] }),
  });
}

export function useUpdateInsuranceCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<InsuranceCompany> & { id: string }) => {
      const { data, error } = await supabase
        .from('insurance_companies')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['insurance_companies'] }),
  });
}

// Partner Companies
export function usePartnerCompanies() {
  return useQuery({
    queryKey: ['partner_companies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partner_companies')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as PartnerCompany[];
    },
  });
}

export function useCreatePartnerCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<PartnerCompany>) => {
      const { data, error } = await supabase
        .from('partner_companies')
        .insert(input as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['partner_companies'] }),
  });
}

export function useUpdatePartnerCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PartnerCompany> & { id: string }) => {
      const { data, error } = await supabase
        .from('partner_companies')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['partner_companies'] }),
  });
}

// Conventions
export function useConventions() {
  return useQuery({
    queryKey: ['conventions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conventions')
        .select('*, company:partner_companies(*), insurance:insurance_companies(*)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as ConventionWithRelations[];
    },
  });
}

export function useCreateConvention() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<Convention>) => {
      const { data, error } = await supabase
        .from('conventions')
        .insert(input as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['conventions'] }),
  });
}

export function useUpdateConvention() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Convention> & { id: string }) => {
      const { data, error } = await supabase
        .from('conventions')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['conventions'] }),
  });
}

// Get active convention for a company
export function useActiveConventions(companyId: string | undefined) {
  return useQuery({
    queryKey: ['conventions', 'active', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('conventions')
        .select('*, company:partner_companies(*), insurance:insurance_companies(*)')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as ConventionWithRelations[];
    },
    enabled: !!companyId,
  });
}

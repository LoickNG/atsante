import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert } from '@/integrations/supabase/types';

export type Medication = Tables<'medications'>;
export type MedicationInsert = TablesInsert<'medications'>;

export function useMedications() {
  return useQuery({
    queryKey: ['medications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('medications')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data as Medication[];
    },
  });
}

export function useLowStockMedications() {
  return useQuery({
    queryKey: ['medications', 'low-stock'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('medications')
        .select('*')
        .filter('stock_quantity', 'lte', supabase.rpc as unknown as number) // We'll filter client-side
        .order('stock_quantity', { ascending: true });
      
      if (error) throw error;
      
      // Filter medications where stock is at or below alert threshold
      return (data as Medication[]).filter(m => m.stock_quantity <= m.alert_threshold);
    },
  });
}

export function useCreateMedication() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (medication: MedicationInsert) => {
      const { data, error } = await supabase
        .from('medications')
        .insert(medication)
        .select()
        .single();
      
      if (error) throw error;
      return data as Medication;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications'] });
    },
  });
}

export function useUpdateMedication() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Medication> & { id: string }) => {
      const { data, error } = await supabase
        .from('medications')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Medication;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications'] });
    },
  });
}

export function useUpdateStock() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      medicationId, 
      quantity, 
      type, 
      reason,
      performedBy 
    }: { 
      medicationId: string; 
      quantity: number; 
      type: 'entree' | 'sortie';
      reason?: string;
      performedBy: string;
    }) => {
      // First, record the stock movement
      const { error: movementError } = await supabase
        .from('stock_movements')
        .insert({
          medication_id: medicationId,
          quantity: type === 'entree' ? quantity : -quantity,
          type,
          reason,
          performed_by: performedBy,
        });
      
      if (movementError) throw movementError;
      
      // Then update the medication stock
      const { data: medication, error: fetchError } = await supabase
        .from('medications')
        .select('stock_quantity')
        .eq('id', medicationId)
        .single();
      
      if (fetchError) throw fetchError;
      
      const newQuantity = type === 'entree' 
        ? medication.stock_quantity + quantity 
        : medication.stock_quantity - quantity;
      
      const { data, error: updateError } = await supabase
        .from('medications')
        .update({ stock_quantity: Math.max(0, newQuantity) })
        .eq('id', medicationId)
        .select()
        .single();
      
      if (updateError) throw updateError;
      return data as Medication;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications'] });
    },
  });
}

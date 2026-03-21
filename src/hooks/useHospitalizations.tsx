import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Room {
  id: string;
  room_number: string;
  category: '1_lit' | '2_lits' | '4_lits';
  comfort: 'climatise' | 'ventile';
  price_per_night: number;
  is_available: boolean;
  floor: string | null;
  notes: string | null;
  created_at: string;
}

export interface Hospitalization {
  id: string;
  patient_id: string;
  consultation_id: string | null;
  visit_id: string | null;
  room_id: string | null;
  bed_number: number | null;
  admission_date: string;
  discharge_date: string | null;
  reason: string;
  status: 'en_cours' | 'termine' | 'annule';
  doctor_id: string;
  discharge_notes: string | null;
  created_at: string;
  patients?: {
    id: string;
    first_name: string;
    last_name: string;
    code: string;
    date_of_birth: string;
    gender: string;
    phone: string;
  };
  rooms?: Room | null;
}

export interface HospitalizationCare {
  id: string;
  hospitalization_id: string;
  care_type: string;
  description: string;
  administered_by: string;
  administered_at: string;
  notes: string | null;
  created_at: string;
  unit_price: number;
  quantity: number;
  total_price: number;
  medication_id: string | null;
}

export function useRooms() {
  return useQuery({
    queryKey: ['rooms'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .order('room_number');
      if (error) throw error;
      return data as Room[];
    },
  });
}

export function useAvailableRooms() {
  return useQuery({
    queryKey: ['rooms', 'available'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('is_available', true)
        .order('category')
        .order('room_number');
      if (error) throw error;
      return data as Room[];
    },
  });
}

export function useCreateRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (room: { room_number: string; category: string; comfort: string; floor?: string; notes?: string }) => {
      const { data, error } = await supabase.from('rooms').insert(room).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rooms'] }),
  });
}

export function useUpdateRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { error } = await supabase.from('rooms').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rooms'] }),
  });
}

export function useDeleteRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('rooms').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rooms'] }),
  });
}

export function useHospitalizations(status?: string) {
  return useQuery({
    queryKey: ['hospitalizations', status],
    queryFn: async () => {
      let query = supabase
        .from('hospitalizations')
        .select('*, patients(id, first_name, last_name, code, date_of_birth, gender, phone), rooms(*)')
        .order('admission_date', { ascending: false });
      if (status) query = query.eq('status', status);
      const { data, error } = await query;
      if (error) throw error;
      return data as Hospitalization[];
    },
  });
}

export function useRoomOccupancy(roomId?: string) {
  return useQuery({
    queryKey: ['hospitalizations', 'room-occupancy', roomId],
    enabled: !!roomId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hospitalizations')
        .select('bed_number')
        .eq('room_id', roomId!)
        .eq('status', 'en_cours');
      if (error) throw error;
      return (data || []).map(h => h.bed_number).filter(Boolean) as number[];
    },
  });
}

export function useAllRoomOccupancies() {
  return useQuery({
    queryKey: ['hospitalizations', 'all-room-occupancies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hospitalizations')
        .select('room_id, bed_number')
        .eq('status', 'en_cours')
        .not('room_id', 'is', null);
      if (error) throw error;
      const map: Record<string, number[]> = {};
      for (const h of data || []) {
        if (h.room_id) {
          if (!map[h.room_id]) map[h.room_id] = [];
          if (h.bed_number) map[h.room_id].push(h.bed_number);
        }
      }
      return map;
    },
  });
}

function getRoomCapacity(category: string): number {
  if (category === '4_lits') return 4;
  if (category === '2_lits') return 2;
  return 1;
}

export function useCreateHospitalization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (hosp: {
      patient_id: string;
      consultation_id?: string;
      visit_id?: string;
      room_id?: string;
      reason: string;
      doctor_id: string;
    }) => {
      let bed_number: number | null = null;

      if (hosp.room_id) {
        // Get room info to determine capacity
        const { data: room } = await supabase
          .from('rooms')
          .select('category')
          .eq('id', hosp.room_id)
          .single();

        const capacity = room ? getRoomCapacity(room.category) : 1;

        // Get currently occupied beds
        const { data: occupied } = await supabase
          .from('hospitalizations')
          .select('bed_number')
          .eq('room_id', hosp.room_id)
          .eq('status', 'en_cours');

        const occupiedBeds = (occupied || []).map(h => h.bed_number).filter(Boolean) as number[];

        // Assign next available bed
        for (let i = 1; i <= capacity; i++) {
          if (!occupiedBeds.includes(i)) {
            bed_number = i;
            break;
          }
        }

        if (bed_number === null) {
          throw new Error('Cette chambre est complète, aucun lit disponible');
        }

        // Mark room unavailable only if all beds will be occupied
        if (occupiedBeds.length + 1 >= capacity) {
          await supabase.from('rooms').update({ is_available: false }).eq('id', hosp.room_id);
        }
      }

      const { data, error } = await supabase
        .from('hospitalizations')
        .insert({ ...hosp, bed_number } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hospitalizations'] });
      qc.invalidateQueries({ queryKey: ['rooms'] });
    },
  });
}

export function useDischargePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, discharge_notes, room_id }: { id: string; discharge_notes?: string; room_id?: string }) => {
      const { error } = await supabase.from('hospitalizations').update({
        status: 'termine',
        discharge_date: new Date().toISOString(),
        discharge_notes: discharge_notes || null,
      }).eq('id', id);
      if (error) throw error;
      if (room_id) {
        // Check if there are still other patients in this room
        const { data: remaining } = await supabase
          .from('hospitalizations')
          .select('id')
          .eq('room_id', room_id)
          .eq('status', 'en_cours')
          .neq('id', id);
        
        // Always mark room available when a bed is freed (capacity check on assign)
        if (!remaining || remaining.length === 0) {
          await supabase.from('rooms').update({ is_available: true }).eq('id', room_id);
        } else {
          // Room still has patients but a bed freed up - mark available for new assignments
          await supabase.from('rooms').update({ is_available: true }).eq('id', room_id);
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hospitalizations'] });
      qc.invalidateQueries({ queryKey: ['rooms'] });
    },
  });
}

export function useAssignRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ hospitalization_id, room_id, old_room_id }: { hospitalization_id: string; room_id: string; old_room_id?: string }) => {
      const { error } = await supabase.from('hospitalizations').update({ room_id }).eq('id', hospitalization_id);
      if (error) throw error;
      await supabase.from('rooms').update({ is_available: false }).eq('id', room_id);
      if (old_room_id) {
        await supabase.from('rooms').update({ is_available: true }).eq('id', old_room_id);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hospitalizations'] });
      qc.invalidateQueries({ queryKey: ['rooms'] });
    },
  });
}

export function useHospitalizationCare(hospitalizationId?: string) {
  return useQuery({
    queryKey: ['hospitalization_care', hospitalizationId],
    enabled: !!hospitalizationId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hospitalization_care')
        .select('*')
        .eq('hospitalization_id', hospitalizationId!)
        .order('administered_at', { ascending: false });
      if (error) throw error;
      return data as HospitalizationCare[];
    },
  });
}

export function useAddCare() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (care: {
      hospitalization_id: string;
      care_type: string;
      description: string;
      administered_by: string;
      notes?: string;
      unit_price: number;
      quantity: number;
      total_price: number;
      medication_id?: string;
    }) => {
      const { data, error } = await supabase.from('hospitalization_care').insert(care as any).select().single();
      if (error) throw error;

      // If medication is used, decrement stock and create stock movement
      if (care.medication_id && care.quantity > 0) {
        // Get current stock
        const { data: med } = await supabase
          .from('medications')
          .select('stock_quantity')
          .eq('id', care.medication_id)
          .single();

        if (med) {
          await supabase
            .from('medications')
            .update({ stock_quantity: Math.max(0, med.stock_quantity - care.quantity) })
            .eq('id', care.medication_id);

          await supabase.from('stock_movements').insert({
            medication_id: care.medication_id,
            quantity: -care.quantity,
            type: 'sortie',
            reason: `Soin hospitalisation: ${care.care_type}`,
            reference_id: data.id,
            performed_by: care.administered_by,
          });
        }
      }

      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['hospitalization_care', vars.hospitalization_id] });
      qc.invalidateQueries({ queryKey: ['medications'] });
    },
  });
}

export function calculateStayDays(admissionDate: string, dischargeDate?: string | null): number {
  const start = new Date(admissionDate);
  const end = dischargeDate ? new Date(dischargeDate) : new Date();
  const diffMs = end.getTime() - start.getTime();
  return Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

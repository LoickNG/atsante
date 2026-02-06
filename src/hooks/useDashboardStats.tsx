import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DashboardStats {
  patientsToday: number;
  consultationsToday: number;
  revenueToday: number;
  pendingLabs: number;
  pendingImaging: number;
  lowStockMedications: number;
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Get today's visits count
      const { count: visitsCount } = await supabase
        .from('visits')
        .select('*', { count: 'exact', head: true })
        .gte('date', today.toISOString())
        .lt('date', tomorrow.toISOString());

      // Get today's consultations count
      const { count: consultationsCount } = await supabase
        .from('consultations')
        .select('*', { count: 'exact', head: true })
        .gte('date', today.toISOString())
        .lt('date', tomorrow.toISOString());

      // Get pending lab requests
      const { count: pendingLabs } = await supabase
        .from('lab_requests')
        .select('*', { count: 'exact', head: true })
        .in('status', ['demande', 'en_cours']);

      // Get pending imaging requests
      const { count: pendingImaging } = await supabase
        .from('imaging_requests')
        .select('*', { count: 'exact', head: true })
        .in('status', ['demande', 'en_cours']);

      // Get low stock medications
      const { data: medications } = await supabase
        .from('medications')
        .select('id, stock_quantity, alert_threshold');
      
      const lowStockCount = medications?.filter(
        m => m.stock_quantity <= m.alert_threshold
      ).length || 0;

      // Get today's revenue
      const { data: todayPayments } = await supabase
        .from('payments')
        .select('amount')
        .gte('created_at', today.toISOString())
        .lt('created_at', tomorrow.toISOString());
      
      const revenueToday = todayPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      return {
        patientsToday: visitsCount || 0,
        consultationsToday: consultationsCount || 0,
        revenueToday,
        pendingLabs: pendingLabs || 0,
        pendingImaging: pendingImaging || 0,
        lowStockMedications: lowStockCount,
      } as DashboardStats;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

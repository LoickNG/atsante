import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AdminStats {
  totalPatients: number;
  totalVisits: number;
  totalConsultations: number;
  totalRevenue: number;
  pendingInvoices: number;
  totalMedications: number;
  lowStockCount: number;
  totalLabRequests: number;
  totalImagingRequests: number;
  visitsPerDay: { date: string; count: number }[];
  revenuePerDay: { date: string; amount: number }[];
  roleDistribution: { role: string; count: number }[];
  visitTypeDistribution: { type: string; count: number }[];
}

export function useAdminStats() {
  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async (): Promise<AdminStats> => {
      const now = new Date();
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [
        { count: totalPatients },
        { count: totalVisits },
        { count: totalConsultations },
        { data: payments },
        { count: pendingInvoices },
        { data: medications },
        { count: totalLabRequests },
        { count: totalImagingRequests },
        { data: recentVisits },
        { data: recentPayments },
        { data: roles },
      ] = await Promise.all([
        supabase.from('patients').select('*', { count: 'exact', head: true }),
        supabase.from('visits').select('*', { count: 'exact', head: true }),
        supabase.from('consultations').select('*', { count: 'exact', head: true }),
        supabase.from('payments').select('amount'),
        supabase.from('invoices').select('*', { count: 'exact', head: true }).eq('status', 'en_attente'),
        supabase.from('medications').select('id, stock_quantity, alert_threshold'),
        supabase.from('lab_requests').select('*', { count: 'exact', head: true }),
        supabase.from('imaging_requests').select('*', { count: 'exact', head: true }),
        supabase.from('visits').select('date, type').gte('date', thirtyDaysAgo.toISOString()).order('date', { ascending: true }),
        supabase.from('payments').select('amount, created_at').gte('created_at', thirtyDaysAgo.toISOString()).order('created_at', { ascending: true }),
        supabase.from('user_roles').select('role'),
      ]);

      const totalRevenue = payments?.reduce((s, p) => s + Number(p.amount), 0) || 0;
      const lowStockCount = medications?.filter(m => m.stock_quantity <= m.alert_threshold).length || 0;

      // Visits per day (last 30 days)
      const visitsByDay = new Map<string, number>();
      recentVisits?.forEach(v => {
        const day = v.date.substring(0, 10);
        visitsByDay.set(day, (visitsByDay.get(day) || 0) + 1);
      });
      const visitsPerDay = Array.from(visitsByDay.entries()).map(([date, count]) => ({ date, count }));

      // Revenue per day
      const revenueByDay = new Map<string, number>();
      recentPayments?.forEach(p => {
        const day = p.created_at.substring(0, 10);
        revenueByDay.set(day, (revenueByDay.get(day) || 0) + Number(p.amount));
      });
      const revenuePerDay = Array.from(revenueByDay.entries()).map(([date, amount]) => ({ date, amount }));

      // Role distribution
      const roleCount = new Map<string, number>();
      roles?.forEach(r => {
        roleCount.set(r.role, (roleCount.get(r.role) || 0) + 1);
      });
      const roleDistribution = Array.from(roleCount.entries()).map(([role, count]) => ({ role, count }));

      // Visit type distribution
      const typeCount = new Map<string, number>();
      recentVisits?.forEach(v => {
        typeCount.set(v.type, (typeCount.get(v.type) || 0) + 1);
      });
      const visitTypeDistribution = Array.from(typeCount.entries()).map(([type, count]) => ({ type, count }));

      return {
        totalPatients: totalPatients || 0,
        totalVisits: totalVisits || 0,
        totalConsultations: totalConsultations || 0,
        totalRevenue,
        pendingInvoices: pendingInvoices || 0,
        totalMedications: medications?.length || 0,
        lowStockCount,
        totalLabRequests: totalLabRequests || 0,
        totalImagingRequests: totalImagingRequests || 0,
        visitsPerDay,
        revenuePerDay,
        roleDistribution,
        visitTypeDistribution,
      };
    },
    refetchInterval: 60000,
  });
}

import { StatCard } from '@/components/dashboard/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdminStats } from '@/hooks/useAdminStats';
import { Users, Stethoscope, CreditCard, Pill, FlaskConical, ImageIcon, FileText, AlertTriangle, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { getRoleLabel } from '@/config/navigation';
import { UserRole } from '@/types';

const ROLE_COLORS = [
  'hsl(270, 60%, 50%)', 'hsl(187, 65%, 45%)', 'hsl(152, 60%, 40%)', 'hsl(200, 80%, 50%)',
  'hsl(38, 92%, 50%)', 'hsl(280, 60%, 55%)', 'hsl(320, 60%, 50%)', 'hsl(15, 80%, 55%)',
];

const TYPE_LABELS: Record<string, string> = {
  consultation: 'Consultation',
  urgence: 'Urgence',
  suivi: 'Suivi',
};

export function AdminOverview() {
  const { data: stats, isLoading } = useAdminStats();

  if (isLoading || !stats) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const roleData = stats.roleDistribution.map(r => ({
    ...r,
    label: getRoleLabel(r.role as UserRole),
  }));

  const visitTypeData = stats.visitTypeDistribution.map(v => ({
    ...v,
    label: TYPE_LABELS[v.type] || v.type,
  }));

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Patients" value={stats.totalPatients} icon={Users} variant="primary" />
        <StatCard title="Consultations" value={stats.totalConsultations} icon={Stethoscope} variant="success" />
        <StatCard title="Revenus totaux" value={`${stats.totalRevenue.toLocaleString()} FCFA`} icon={CreditCard} variant="default" />
        <StatCard title="Factures en attente" value={stats.pendingInvoices} icon={FileText} variant="warning" />
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Médicaments" value={stats.totalMedications} icon={Pill} variant="default" />
        <StatCard title="Stock faible" value={stats.lowStockCount} icon={AlertTriangle} variant={stats.lowStockCount > 0 ? 'danger' : 'default'} />
        <StatCard title="Analyses labo" value={stats.totalLabRequests} icon={FlaskConical} variant="default" />
        <StatCard title="Imageries" value={stats.totalImagingRequests} icon={ImageIcon} variant="default" />
      </div>

      {/* Charts */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Visits per day */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Visites (30 derniers jours)</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.visitsPerDay.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={stats.visitsPerDay}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => d.slice(5)} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip labelFormatter={d => `Date: ${d}`} />
                  <Bar dataKey="count" name="Visites" fill="hsl(187, 65%, 35%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">Aucune donnée disponible</p>
            )}
          </CardContent>
        </Card>

        {/* Revenue per day */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenus (30 derniers jours)</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.revenuePerDay.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={stats.revenuePerDay}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => d.slice(5)} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => [`${v.toLocaleString()} FCFA`, 'Revenus']} labelFormatter={d => `Date: ${d}`} />
                  <Line type="monotone" dataKey="amount" name="Revenus" stroke="hsl(152, 60%, 40%)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">Aucune donnée disponible</p>
            )}
          </CardContent>
        </Card>

        {/* Role distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Répartition des rôles</CardTitle>
          </CardHeader>
          <CardContent>
            {roleData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={roleData} dataKey="count" nameKey="label" cx="50%" cy="50%" outerRadius={90} label={({ label, count }) => `${label} (${count})`}>
                    {roleData.map((_, i) => (
                      <Cell key={i} fill={ROLE_COLORS[i % ROLE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">Aucun utilisateur</p>
            )}
          </CardContent>
        </Card>

        {/* Visit type distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Types de visites (30j)</CardTitle>
          </CardHeader>
          <CardContent>
            {visitTypeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={visitTypeData} dataKey="count" nameKey="label" cx="50%" cy="50%" outerRadius={90} label={({ label, count }) => `${label} (${count})`}>
                    <Cell fill="hsl(187, 65%, 45%)" />
                    <Cell fill="hsl(0, 72%, 51%)" />
                    <Cell fill="hsl(38, 92%, 50%)" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">Aucune donnée</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

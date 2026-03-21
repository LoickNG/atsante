import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PrenatalVisit } from '@/hooks/useMaternity';

interface PrenatalChartsProps {
  visits: PrenatalVisit[];
}

export function PrenatalCharts({ visits }: PrenatalChartsProps) {
  // Sort chronologically
  const sorted = [...visits].sort((a, b) => new Date(a.visit_date).getTime() - new Date(b.visit_date).getTime());

  const weightData = sorted
    .filter(v => v.weight_kg != null)
    .map(v => ({
      label: v.gestational_weeks ? `${v.gestational_weeks} SA` : new Date(v.visit_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
      poids: Number(v.weight_kg),
    }));

  const bpData = sorted
    .filter(v => v.blood_pressure)
    .map(v => {
      const parts = v.blood_pressure!.split('/');
      const sys = parseFloat(parts[0]) || 0;
      const dia = parts[1] ? parseFloat(parts[1]) : 0;
      return {
        label: v.gestational_weeks ? `${v.gestational_weeks} SA` : new Date(v.visit_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
        systolique: sys,
        diastolique: dia,
      };
    });

  if (weightData.length < 2 && bpData.length < 2) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
      {weightData.length >= 2 && (
        <Card>
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs font-semibold">Évolution du poids (kg)</CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-3">
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={weightData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 10 }} domain={['dataMin - 2', 'dataMax + 2']} className="text-muted-foreground" />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="poids" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {bpData.length >= 2 && (
        <Card>
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs font-semibold">Évolution de la tension artérielle</CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-3">
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={bpData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 10 }} domain={[4, 'dataMax + 2']} className="text-muted-foreground" />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Line type="monotone" dataKey="systolique" name="Systolique" stroke="hsl(var(--destructive))" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="diastolique" name="Diastolique" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

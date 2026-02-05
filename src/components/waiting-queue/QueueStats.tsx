import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface QueueStatsProps {
  waitingCount: number;
  inProgressCount: number;
  completedCount: number;
}

export function QueueStats({ waitingCount, inProgressCount, completedCount }: QueueStatsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            En attente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-warning">{waitingCount}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            En consultation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-info">{inProgressCount}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Terminés aujourd'hui
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-success">{completedCount}</div>
        </CardContent>
      </Card>
    </div>
  );
}

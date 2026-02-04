import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, AlertTriangle, Package } from 'lucide-react';
import { Medication } from '@/types';
import { Link } from 'react-router-dom';

interface LowStockAlertsProps {
  medications: Medication[];
  className?: string;
}

export function LowStockAlerts({ medications, className }: LowStockAlertsProps) {
  const lowStockMeds = medications.filter(m => m.stockQuantity <= m.alertThreshold);

  const getStockPercentage = (med: Medication) => {
    return Math.round((med.stockQuantity / med.alertThreshold) * 100);
  };

  const getStockColor = (med: Medication) => {
    const percentage = getStockPercentage(med);
    if (percentage <= 50) return 'bg-destructive';
    if (percentage <= 80) return 'bg-warning';
    return 'bg-success';
  };

  return (
    <div className={cn('rounded-xl border bg-card', className)}>
      <div className="flex items-center justify-between border-b px-5 py-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-warning" />
          <div>
            <h3 className="font-semibold">Stock faible</h3>
            <p className="text-sm text-muted-foreground">
              {lowStockMeds.length} médicament(s)
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link to="/pharmacie">
            Pharmacie
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Link>
        </Button>
      </div>
      <div className="divide-y">
        {lowStockMeds.length === 0 ? (
          <div className="px-5 py-8 text-center text-muted-foreground">
            Tous les stocks sont suffisants
          </div>
        ) : (
          lowStockMeds.map((med) => (
            <div
              key={med.id}
              className="px-5 py-3"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{med.name}</p>
                    <p className="text-xs text-muted-foreground">{med.category}</p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-destructive/10 text-destructive text-[10px]">
                  {med.stockQuantity} restants
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Progress 
                  value={getStockPercentage(med)} 
                  className="h-1.5 flex-1"
                />
                <span className="text-[10px] text-muted-foreground w-8">
                  {getStockPercentage(med)}%
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

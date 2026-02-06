import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, ArrowRight, Pill } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Medication } from '@/hooks/useMedications';

interface DashboardLowStockProps {
  medications: Medication[];
  isLoading?: boolean;
  className?: string;
}

export function DashboardLowStock({ medications, isLoading, className }: DashboardLowStockProps) {
  if (isLoading) {
    return (
      <div className={cn('rounded-xl border bg-card', className)}>
        <div className="flex items-center justify-between border-b px-5 py-4">
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="p-5 space-y-3">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('rounded-xl border bg-card', className)}>
      <div className="flex items-center justify-between border-b px-5 py-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <h3 className="font-semibold">Stock faible</h3>
          {medications.length > 0 && (
            <Badge variant="destructive" className="text-xs">
              {medications.length}
            </Badge>
          )}
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/pharmacie">
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
      <div className="p-5">
        {medications.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground text-sm">
            Tous les stocks sont suffisants
          </div>
        ) : (
          <div className="space-y-3">
            {medications.slice(0, 4).map((med) => {
              const isCritical = med.stock_quantity <= med.alert_threshold / 2;
              
              return (
                <div
                  key={med.id}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg border',
                    isCritical 
                      ? 'border-destructive/30 bg-destructive/5' 
                      : 'border-warning/30 bg-warning/5'
                  )}
                >
                  <div className={cn(
                    'h-10 w-10 rounded-lg flex items-center justify-center',
                    isCritical ? 'bg-destructive/10' : 'bg-warning/10'
                  )}>
                    <Pill className={cn(
                      'h-5 w-5',
                      isCritical ? 'text-destructive' : 'text-warning'
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{med.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Catégorie: {med.category}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      'font-bold text-lg',
                      isCritical ? 'text-destructive' : 'text-warning'
                    )}>
                      {med.stock_quantity}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      min: {med.alert_threshold}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

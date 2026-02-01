'use client';

import { Package, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useHealthCheck } from '@/hooks/use-health-check';
import { cn } from '@/lib/utils';

export function HealthStatus() {
  const { health, isLoading } = useHealthCheck(30000);

  const isHealthy = health?.status === 'healthy';
  const version = health?.version || 'unknown';
  const timestamp = health?.timestamp 
    ? new Date(health.timestamp).toLocaleTimeString() 
    : '--:--:--';

  return (
    <div className="mt-auto">
      <Separator className="bg-border my-4" />
      <div className="px-4 py-3 bg-surface rounded-lg space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-text-muted text-sm">Status</span>
          <Badge 
            variant={isHealthy ? 'default' : 'destructive'}
            className={cn(
              'text-xs',
              isHealthy && 'bg-green-600 hover:bg-green-700'
            )}
          >
            {isLoading ? 'Sprawdzanie...' : isHealthy ? 'Połączono' : 'Rozłączono'}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2 text-text-secondary text-xs">
          <Package className="w-3 h-3" />
          <span>v{version}</span>
        </div>
        
        <div className="flex items-center gap-2 text-text-muted text-xs">
          <Clock className="w-3 h-3" />
          <span>Ostatnia kontrola: {timestamp}</span>
        </div>
      </div>
    </div>
  );
}

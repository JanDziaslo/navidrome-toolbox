import { useState, useEffect, useCallback } from 'react';
import { checkHealth } from '@/lib/api/health';
import { HealthResponse } from '@/types/api';

export function useHealthCheck(intervalMs = 30000) {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchHealth = useCallback(async () => {
    const data = await checkHealth();
    setHealth(data);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, intervalMs);
    return () => clearInterval(interval);
  }, [fetchHealth, intervalMs]);

  return { health, isLoading, refetch: fetchHealth };
}

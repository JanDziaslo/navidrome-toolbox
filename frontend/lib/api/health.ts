import { HealthResponse } from '@/types/api';

export async function checkHealth(): Promise<HealthResponse> {
  try {
    const res = await fetch('/api/health', { cache: 'no-store' });
    if (!res.ok) throw new Error();
    return await res.json();
  } catch {
    return { 
      status: 'unhealthy', 
      timestamp: new Date().toISOString(), 
      service: 'navidrome-toolbox-api', 
      version: 'unknown' 
    };
  }
}

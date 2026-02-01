import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.API_URL || 'http://localhost:8000';

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/health`, { 
      cache: 'no-store',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!res.ok) {
      throw new Error(`Backend returned ${res.status}`);
    }
    
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { 
        status: 'unhealthy', 
        timestamp: new Date().toISOString(), 
        service: 'navidrome-toolbox-api', 
        version: ' Nieznane' 
      },
      { status: 503 }
    );
  }
}

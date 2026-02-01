import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.API_URL || 'http://localhost:8000';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const offset = searchParams.get('offset') || '0';
    const limit = searchParams.get('limit') || '50';
    const search = searchParams.get('search');

    // Build backend URL with params
    const backendParams = new URLSearchParams();
    backendParams.append('offset', offset);
    backendParams.append('limit', limit);
    if (search) {
      backendParams.append('search', search);
    }

    const res = await fetch(`${BACKEND_URL}/api/files?${backendParams.toString()}`, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`Backend returned ${res.status}`);
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Failed to fetch files', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

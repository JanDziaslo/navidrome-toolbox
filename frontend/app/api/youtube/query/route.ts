import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.API_URL || 'http://localhost:8000';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const limit = searchParams.get('limit') || '10';
    const musicOnly = searchParams.get('music_only') || 'true';

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter "q" is required' },
        { status: 400 }
      );
    }

    const backendParams = new URLSearchParams({
      q: query,
      limit,
      music_only: musicOnly,
    });

    const res = await fetch(`${BACKEND_URL}/api/youtube/query?${backendParams}`, {
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
      { error: 'Failed to search YouTube', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

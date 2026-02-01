import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.API_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    const res = await fetch(`${BACKEND_URL}/api/youtube/formats`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    if (!res.ok) {
      throw new Error(`Backend returned ${res.status}`);
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch formats', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

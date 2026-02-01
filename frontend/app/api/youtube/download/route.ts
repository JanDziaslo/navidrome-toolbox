import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.API_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, format_id, output_template } = body;

    if (!url || !format_id) {
      return NextResponse.json(
        { error: 'URL and format_id are required' },
        { status: 400 }
      );
    }

    const res = await fetch(`${BACKEND_URL}/api/youtube/download`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ 
        url, 
        format_id, 
        output_template: output_template || '%(artist,uploader)s - %(title,track)s.%(ext)s' 
      }),
    });

    if (!res.ok) {
      throw new Error(`Backend returned ${res.status}`);
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Download failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.API_URL || 'http://localhost:8000';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');

    if (!path) {
      return NextResponse.json(
        { error: 'Path parameter is required' },
        { status: 400 }
      );
    }

    // Path is already base64 encoded from frontend
    const res = await fetch(`${BACKEND_URL}/api/files/thumbnail?path=${path}`, {
      headers: {
        'Accept': 'image/jpeg, image/png, image/*',
      },
    });

    if (!res.ok) {
      if (res.status === 404) {
        return NextResponse.json(
          { error: 'No cover art found in file' },
          { status: 404 }
        );
      }
      throw new Error(`Backend returned ${res.status}`);
    }

    // Get the image data as array buffer
    const imageBuffer = await res.arrayBuffer();
    
    // Get content type from response
    const contentType = res.headers.get('content-type') || 'image/jpeg';
    
    // Return the image with proper headers
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400', // 24h cache
      },
    });
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Failed to fetch thumbnail', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

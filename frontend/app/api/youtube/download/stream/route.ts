import { NextRequest } from 'next/server';

const BACKEND_URL = process.env.API_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, format_id, output_template } = body;

    if (!url || !format_id) {
      return new Response(
        JSON.stringify({ error: 'URL and format_id are required' }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    const backendRes = await fetch(`${BACKEND_URL}/api/youtube/download/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify({ 
        url, 
        format_id, 
        output_template: output_template || '%(artist,uploader)s - %(title,track)s.%(ext)s' 
      }),
    });

    if (!backendRes.ok) {
      throw new Error(`Backend returned ${backendRes.status}`);
    }

    if (!backendRes.body) {
      throw new Error('No response body from backend');
    }

    // Create a TransformStream to pass through the SSE data
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const reader = backendRes.body.getReader();

    // Pipe the backend stream to our response
    (async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          await writer.write(value);
        }
      } catch (error) {
        console.error('Error piping stream:', error);
      } finally {
        await writer.close();
      }
    })();

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Stream error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Stream failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}

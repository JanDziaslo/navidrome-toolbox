import { YouTubeSearchResponse, FormatsResponse, DownloadResponse, DownloadRequest, PlaylistInfo } from '@/types/api';

export async function searchYoutube(query: string, limit = 10, musicOnly = false): Promise<YouTubeSearchResponse> {
  const params = new URLSearchParams({ 
    q: query, 
    limit: String(limit), 
    music_only: String(musicOnly) 
  });
  const res = await fetch(`/api/youtube/query?${params}`);
  if (!res.ok) throw new Error('Search failed');
  return res.json();
}

export async function getPlaylist(url: string, offset = 0, limit = 10): Promise<PlaylistInfo> {
  const res = await fetch('/api/youtube/playlist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, offset, limit })
  });
  if (!res.ok) throw new Error('Failed to fetch playlist');
  return res.json();
}

export async function getFormats(url: string): Promise<FormatsResponse> {
  const res = await fetch('/api/youtube/formats', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url })
  });
  if (!res.ok) throw new Error('Failed to fetch formats');
  return res.json();
}

export async function downloadVideo(request: DownloadRequest): Promise<DownloadResponse> {
  const res = await fetch('/api/youtube/download', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  });
  if (!res.ok) throw new Error('Download failed');
  return res.json();
}

export async function* downloadVideoStream(request: DownloadRequest): AsyncGenerator<{
  status: 'downloading' | 'finished' | 'complete';
  downloaded?: number;
  total?: number;
  percent?: number;
  eta?: number;
  speed?: number;
  filename?: string;
  success?: boolean;
  file_path?: string;
}> {
  const res = await fetch('/api/youtube/download/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  });

  if (!res.ok) throw new Error('Download stream failed');
  if (!res.body) throw new Error('No response body');

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6));
          yield data;
        } catch {
          // Ignore malformed JSON
        }
      }
    }
  }
}

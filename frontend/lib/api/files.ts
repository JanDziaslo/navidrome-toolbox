import { FilesResponse, FileItem } from '@/types/api';

const API_BASE = '/api';

export async function getFiles(
  offset: number = 0,
  limit: number = 50,
  search?: string
): Promise<FilesResponse> {
  const params = new URLSearchParams();
  params.append('offset', offset.toString());
  params.append('limit', limit.toString());
  if (search) {
    params.append('search', search);
  }

  const response = await fetch(`${API_BASE}/files?${params.toString()}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch files: ${response.statusText}`);
  }

  return response.json();
}

function utf8ToBase64(str: string): string {
  // Convert UTF-8 string to base64 using TextEncoder
  const bytes = new TextEncoder().encode(str);
  const binString = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('');
  return btoa(binString);
}

export function getThumbnailUrl(path: string): string {
  // Encode path in base64 to handle special characters and make URLs shorter
  const encodedPath = utf8ToBase64(path);
  return `${API_BASE}/files/thumbnail?path=${encodedPath}`;
}

export async function getFileById(id: string): Promise<FileItem> {
  const response = await fetch(`${API_BASE}/files/${id}`);
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('File not found');
    }
    throw new Error(`Failed to fetch file: ${response.statusText}`);
  }

  return response.json();
}

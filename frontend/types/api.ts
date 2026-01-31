export interface HealthResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  service: string;
  version: string;
}

export interface YouTubeSearchResult {
  id: string;
  title: string;
  duration: number;
  uploader: string;
  view_count: number;
  thumbnail: string;
  url: string;
}

export interface YouTubeSearchResponse {
  results: YouTubeSearchResult[];
  count: number;
}

export interface VideoFormat {
  format_id: string;
  ext: string;
  quality: string;
  resolution: string;
  filesize: number;
  audio_codec: string;
  video_codec: string;
  vbr: number;
  abr: number;
}

export interface FormatsResponse {
  video_id: string;
  title: string;
  formats: VideoFormat[];
}

export type DownloadEvent =
  | { status: 'downloading'; downloaded: number; total: number; percent: number; eta: number; speed: number; }
  | { status: 'finished'; filename: string; }
  | { status: 'complete'; success: boolean; file_path: string; };

export interface DownloadRequest {
  url: string;
  format_id: string;
  output_template: string;
}

export interface DownloadResponse {
  success: boolean;
  file_path: string;
  message: string;
}

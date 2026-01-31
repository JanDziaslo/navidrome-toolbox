import { useState, useCallback } from 'react';
import { downloadVideoStream } from '@/lib/api/youtube';
import { DownloadEvent, DownloadRequest } from '@/types/api';

export function useYoutubeDownload() {
  const [progress, setProgress] = useState<DownloadEvent | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startDownload = useCallback(async (request: DownloadRequest) => {
    setIsDownloading(true);
    setError(null);
    setProgress(null);

    try {
      for await (const event of downloadVideoStream(request)) {
        setProgress(event as DownloadEvent);
        if (event.status === 'complete') {
          setIsDownloading(false);
          return event;
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed');
      setIsDownloading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setProgress(null);
    setIsDownloading(false);
    setError(null);
  }, []);

  return { progress, isDownloading, error, startDownload, reset };
}

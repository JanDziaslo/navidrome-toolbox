import { useState, useCallback, useRef } from 'react';
import { YouTubeSearchResult, BatchDownloadProgress, DownloadRequest } from '@/types/api';
import { downloadVideoStream } from '@/lib/api/youtube';

interface UseBatchDownloadReturn {
  isBatchDownloading: boolean;
  progress: BatchDownloadProgress | null;
  completedDownloads: YouTubeSearchResult[];
  failedDownloads: Array<{ video: YouTubeSearchResult; error: string }>;
  downloadPlaylist: (videos: YouTubeSearchResult[], formatId: string) => Promise<void>;
  cancelBatchDownload: () => void;
}

export function useBatchDownload(): UseBatchDownloadReturn {
  const [isBatchDownloading, setIsBatchDownloading] = useState(false);
  const [progress, setProgress] = useState<BatchDownloadProgress | null>(null);
  const [completedDownloads, setCompletedDownloads] = useState<YouTubeSearchResult[]>([]);
  const [failedDownloads, setFailedDownloads] = useState<Array<{ video: YouTubeSearchResult; error: string }>>([]);
  
  const shouldCancelRef = useRef(false);

  const downloadPlaylist = useCallback(async (
    videos: YouTubeSearchResult[],
    formatId: string
  ) => {
    if (videos.length === 0) return;

    setIsBatchDownloading(true);
    setShouldCancel(false);
    setCompletedDownloads([]);
    setFailedDownloads([]);

    let completed = 0;
    let failed = 0;

    for (let i = 0; i < videos.length; i++) {
      // Check if should cancel before starting next video
      if (shouldCancelRef.current) {
        setProgress(prev => prev ? { ...prev, status: 'cancelled' } : null);
        break;
      }

      const video = videos[i];
      
      // Update progress - starting new video
      setProgress({
        status: 'downloading',
        currentVideoIndex: i + 1,
        totalVideos: videos.length,
        currentVideoTitle: video.title,
        currentVideoProgress: 0,
        completedCount: completed,
        failedCount: failed,
      });

      try {
        const request: DownloadRequest = {
          url: video.url,
          format_id: formatId,
          output_template: '%(artist,uploader)s - %(title,track)s.%(ext)s',
        };

        for await (const event of downloadVideoStream(request)) {
          // Check for cancellation during download
          if (shouldCancelRef.current) {
            break;
          }

          if (event.status === 'downloading') {
            setProgress(prev => prev ? {
              ...prev,
              currentVideoProgress: event.percent || 0,
            } : null);
          } else if (event.status === 'complete') {
            if (event.success) {
              completed++;
              setCompletedDownloads(prev => [...prev, video]);
            } else {
              failed++;
              setFailedDownloads(prev => [...prev, { video, error: 'Download failed' }]);
            }
          }
        }
      } catch (err) {
        failed++;
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setFailedDownloads(prev => [...prev, { video, error: errorMsg }]);
      }
    }

    // Mark as complete
    setProgress(prev => prev ? {
      ...prev,
      status: failed > 0 && completed === 0 ? 'error' : 'complete',
      completedCount: completed,
      failedCount: failed,
    } : null);

    setIsBatchDownloading(false);
  }, []);

  const setShouldCancel = (value: boolean) => {
    shouldCancelRef.current = value;
  };

  const cancelBatchDownload = useCallback(() => {
    setShouldCancel(true);
  }, []);

  return {
    isBatchDownloading,
    progress,
    completedDownloads,
    failedDownloads,
    downloadPlaylist,
    cancelBatchDownload,
  };
}

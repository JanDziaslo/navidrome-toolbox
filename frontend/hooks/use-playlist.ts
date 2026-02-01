import { useState, useCallback, useRef } from 'react';
import { getPlaylist } from '@/lib/api/youtube';
import { PlaylistInfo, YouTubeSearchResult } from '@/types/api';

const CHUNK_SIZE = 10;

export function usePlaylist() {
  const [playlist, setPlaylist] = useState<PlaylistInfo | null>(null);
  const [videos, setVideos] = useState<YouTubeSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  
  const playlistUrlRef = useRef<string>('');
  const currentOffsetRef = useRef<number>(0);

  const loadPlaylist = useCallback(async (url: string) => {
    setIsLoading(true);
    setError(null);
    playlistUrlRef.current = url;
    currentOffsetRef.current = 0;
    
    try {
      const data = await getPlaylist(url, 0, CHUNK_SIZE);
      setPlaylist(data);
      setVideos(data.videos);
      setHasMore(data.has_more);
      setTotalCount(data.total_count || data.video_count);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load playlist');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (!playlistUrlRef.current || isLoadingMore || !hasMore) return;
    
    setIsLoadingMore(true);
    const nextOffset = currentOffsetRef.current + CHUNK_SIZE;
    
    try {
      const data = await getPlaylist(playlistUrlRef.current, nextOffset, CHUNK_SIZE);
      setVideos(prev => [...prev, ...data.videos]);
      setHasMore(data.has_more);
      currentOffsetRef.current = nextOffset;
    } catch (err) {
      console.error('Failed to load more videos:', err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore]);

  const clear = useCallback(() => {
    setPlaylist(null);
    setVideos([]);
    setError(null);
    setHasMore(false);
    setTotalCount(0);
    playlistUrlRef.current = '';
    currentOffsetRef.current = 0;
  }, []);

  return {
    playlist,
    videos,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    totalCount,
    loadPlaylist,
    loadMore,
    clear,
  };
}

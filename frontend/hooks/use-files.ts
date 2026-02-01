import { useState, useCallback, useRef } from 'react';
import { getFiles } from '@/lib/api/files';
import { FileItem } from '@/types/api';

const CHUNK_SIZE = 50;

export function useFiles() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  
  const searchQueryRef = useRef<string>('');
  const currentOffsetRef = useRef<number>(0);

  const searchFiles = useCallback(async (query: string) => {
    setIsLoading(true);
    setError(null);
    searchQueryRef.current = query;
    currentOffsetRef.current = 0;
    
    try {
      const data = await getFiles(0, CHUNK_SIZE, query || undefined);
      setFiles(data.items);
      setHasMore(data.has_more);
      setTotal(data.total);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load files');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    
    setIsLoadingMore(true);
    const nextOffset = currentOffsetRef.current + CHUNK_SIZE;
    
    try {
      const data = await getFiles(
        nextOffset, 
        CHUNK_SIZE, 
        searchQueryRef.current || undefined
      );
      setFiles(prev => [...prev, ...data.items]);
      setHasMore(data.has_more);
      currentOffsetRef.current = nextOffset;
    } catch (err) {
      console.error('Failed to load more files:', err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore]);

  const clear = useCallback(() => {
    setFiles([]);
    setError(null);
    setHasMore(false);
    setTotal(0);
    searchQueryRef.current = '';
    currentOffsetRef.current = 0;
  }, []);

  return {
    files,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    total,
    searchFiles,
    loadMore,
    clear,
  };
}

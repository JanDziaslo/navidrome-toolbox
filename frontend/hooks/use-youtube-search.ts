import { useState, useCallback } from 'react';
import { searchYoutube } from '@/lib/api/youtube';
import { YouTubeSearchResult } from '@/types/api';

export function useYoutubeSearch() {
  const [results, setResults] = useState<YouTubeSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDirectUrl, setIsDirectUrl] = useState(false);

  const search = useCallback(async (query: string, limit = 10, musicOnly = false) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await searchYoutube(query, limit, musicOnly);
      setResults(data.results);
      setIsDirectUrl(data.is_direct_url || false);
      return data.results;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setResults([]);
    setError(null);
    setIsDirectUrl(false);
  }, []);

  return { results, isLoading, error, search, clear, isDirectUrl };
}

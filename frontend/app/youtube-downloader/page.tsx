'use client';

import { useState } from 'react';
import { Download, AlertCircle, ListMusic } from 'lucide-react';
import { SearchForm } from '@/components/youtube/search-form';
import { SearchResults } from '@/components/youtube/search-results';
import { PlaylistView } from '@/components/youtube/playlist-view';
import { BatchDownloadProgressView } from '@/components/youtube/batch-download-progress';
import { FormatSelector } from '@/components/youtube/format-selector';
import { DownloadProgress } from '@/components/youtube/download-progress';
import { useYoutubeSearch } from '@/hooks/use-youtube-search';
import { useBatchDownload } from '@/hooks/use-batch-download';
import { usePlaylist } from '@/hooks/use-playlist';
import { YouTubeSearchResult, VideoFormat, DownloadEvent, DownloadRequest } from '@/types/api';
import { downloadVideoStream } from '@/lib/api/youtube';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface DownloadItem {
  id: string;
  video: YouTubeSearchResult;
  formatId: string;
  progress: DownloadEvent | null;
  isDownloading: boolean;
  error: string | null;
  completed: boolean;
}

export default function YouTubeDownloaderPage() {
  const { results, isLoading: isSearching, error: searchError, search } = useYoutubeSearch();
  const { 
    isBatchDownloading, 
    progress: batchProgress, 
    completedDownloads, 
    failedDownloads,
    downloadPlaylist, 
    cancelBatchDownload 
  } = useBatchDownload();
  const {
    playlist,
    videos,
    isLoading: isLoadingPlaylist,
    isLoadingMore,
    error: playlistError,
    hasMore,
    totalCount,
    loadPlaylist,
    loadMore,
    clear: clearPlaylist,
  } = usePlaylist();
  
  const [selectedVideo, setSelectedVideo] = useState<YouTubeSearchResult | null>(null);
  const [formats, setFormats] = useState<VideoFormat[]>([]);
  const [isLoadingFormats, setIsLoadingFormats] = useState(false);
  const [isFormatDialogOpen, setIsFormatDialogOpen] = useState(false);
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  
  // Playlist mode is active when playlist is loaded
  const isPlaylistMode = playlist !== null;

  const handleSearch = async (query: string, limit: number, musicOnly: boolean, isUrl = false, isPlaylist = false) => {
    // Clear previous playlist
    clearPlaylist();
    
    if (isPlaylist) {
      // Handle playlist URL with chunked loading
      const success = await loadPlaylist(query);
      if (success) {
        toast.success(`Znaleziono playlistę: ${success.title} (${success.total_count || success.video_count} utworów)`);
      }
    } else {
      // Handle regular search or video URL
      const searchResults = await search(query, limit, musicOnly);

      // If search returned at least 1 result and it's a direct URL (but not playlist), auto-open format selector
      if (isUrl && searchResults.length >= 1 && !isPlaylistMode) {
        const video = searchResults[0];
        setSelectedVideo(video);
        setIsLoadingFormats(true);
        setIsFormatDialogOpen(true);

        try {
          const response = await fetch('/api/youtube/formats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: video.url }),
          });

          if (!response.ok) throw new Error('Failed to fetch formats');
          const data = await response.json();
          setFormats(data.formats);
        } catch {
          toast.error('Failed to load formats');
          setIsFormatDialogOpen(false);
        } finally {
          setIsLoadingFormats(false);
        }
      }
    }
  };

  const handleSelectVideo = async (video: YouTubeSearchResult) => {
    setSelectedVideo(video);
    setIsLoadingFormats(true);
    setIsFormatDialogOpen(true);
    
    try {
      const response = await fetch('/api/youtube/formats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: video.url }),
      });
      
      if (!response.ok) throw new Error('Failed to fetch formats');
      const data = await response.json();
      setFormats(data.formats);
    } catch {
      toast.error('Failed to load formats');
      setIsFormatDialogOpen(false);
    } finally {
      setIsLoadingFormats(false);
    }
  };

  const handleDownload = async (formatId: string) => {
    setIsFormatDialogOpen(false);
    
    // Check if this is a batch download
    const batchVideos = (window as unknown as { __batchVideos?: YouTubeSearchResult[] }).__batchVideos;
    
    if (batchVideos && batchVideos.length > 0) {
      // Clear the stored videos
      delete (window as unknown as { __batchVideos?: YouTubeSearchResult[] }).__batchVideos;
      
      // Start batch download
      await downloadPlaylist(batchVideos, formatId);
      
      if (selectedVideo) {
        toast.success(`Rozpoczęto pobieranie ${batchVideos.length} utworów z playlisty`);
      }
    } else if (selectedVideo) {
      // Single video download
      const downloadId = `${selectedVideo.id}-${Date.now()}`;
      const newDownload: DownloadItem = {
        id: downloadId,
        video: selectedVideo,
        formatId,
        progress: null,
        isDownloading: true,
        error: null,
        completed: false,
      };
      
      // Add to the top of the list
      setDownloads(prev => [newDownload, ...prev]);
      
      // Start the download
      try {
        const request: DownloadRequest = {
          url: selectedVideo.url,
          format_id: formatId,
          output_template: '%(artist,uploader)s - %(title,track)s.%(ext)s',
        };
        
        for await (const event of downloadVideoStream(request)) {
          setDownloads(prev => prev.map(d => 
            d.id === downloadId 
              ? { ...d, progress: event as DownloadEvent }
              : d
          ));
          
          if (event.status === 'complete') {
            setDownloads(prev => prev.map(d => 
              d.id === downloadId 
                ? { ...d, isDownloading: false, completed: true }
                : d
            ));
            toast.success(`Pobieranie ukończone: ${selectedVideo.title} - ${selectedVideo.uploader}`);
          }
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Pobieranie nie powiodło się';
        setDownloads(prev => prev.map(d => 
          d.id === downloadId 
            ? { ...d, isDownloading: false, error: errorMsg }
            : d
        ));
        toast.error(`Pobieranie nie powiodło się: ${errorMsg}`);
      }
    }
  };

  const removeDownload = (downloadId: string) => {
    setDownloads(prev => prev.filter(d => d.id !== downloadId));
  };

  const handleCloseDialog = () => {
    setIsFormatDialogOpen(false);
    setSelectedVideo(null);
    setFormats([]);
  };

  const handleDownloadSelected = async (videos: YouTubeSearchResult[]) => {
    if (videos.length === 0) return;
    
    // Open format selector for batch download
    setIsLoadingFormats(true);
    setIsFormatDialogOpen(true);
    
    // Store selected videos for batch download
    setSelectedVideo(videos[0]); // Use first video as reference for format dialog
    
    try {
      // Fetch formats from first video (assuming all videos have similar formats)
      const response = await fetch('/api/youtube/formats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: videos[0].url }),
      });

      if (!response.ok) throw new Error('Failed to fetch formats');
      const data = await response.json();
      setFormats(data.formats);
      
      // Store videos to download in a ref or state for the batch download
      // We'll handle this in the handleDownload function
      (window as unknown as { __batchVideos: YouTubeSearchResult[] }).__batchVideos = videos;
    } catch {
      toast.error('Failed to load formats');
      setIsFormatDialogOpen(false);
    } finally {
      setIsLoadingFormats(false);
    }
  };

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 lg:w-12 lg:h-12 bg-accent rounded-lg flex items-center justify-center shrink-0">
          {isPlaylistMode ? (
            <ListMusic className="w-5 h-5 lg:w-7 lg:h-7 text-white" />
          ) : (
            <Download className="w-5 h-5 lg:w-7 lg:h-7 text-white" />
          )}
        </div>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-text-primary truncate">
            {isPlaylistMode ? 'Playlista YouTube' : 'YouTube Downloader'}
          </h1>
          <p className="text-sm text-text-secondary">
            {isPlaylistMode 
              ? playlist?.title || 'Pobierz utwory z playlisty'
              : 'Wyszukaj i pobierz muzykę z YouTube.'}
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {(searchError || playlistError) && (
        <Alert variant="destructive" className="bg-red-500/10 border-red-500/20">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {searchError || playlistError}
          </AlertDescription>
        </Alert>
      )}

      {/* Two Column Layout - Responsive */}
      <div className="flex flex-col xl:flex-row gap-6 xl:gap-8 items-start">
        {/* Left Column - Search and Results */}
        <div className="flex-1 space-y-6 lg:space-y-8 w-full xl:max-w-4xl">
          {/* Step 1: Search or Paste URL */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-accent text-sm font-medium shrink-0">
                1
              </div>
              <h2 className="text-base sm:text-lg font-semibold text-text-primary">
                Wklej link lub wyszukaj
              </h2>
            </div>
            <SearchForm onSearch={handleSearch} isLoading={isSearching || isBatchDownloading || isLoadingPlaylist} />
          </section>

          {/* Step 2: Playlist View or Search Results */}
          {isPlaylistMode && playlist ? (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-accent text-sm font-medium shrink-0">
                  2
                </div>
                <h2 className="text-base sm:text-lg font-semibold text-text-primary">
                  Wybierz utwory do pobrania ({totalCount || videos.length} utworów)
                  {hasMore && (
                    <span className="ml-2 text-xs text-text-secondary">
                      ({videos.length} załadowanych)
                    </span>
                  )}
                </h2>
              </div>
              <PlaylistView
                playlist={playlist}
                videos={videos}
                onSelectVideo={handleSelectVideo}
                onDownloadSelected={handleDownloadSelected}
                onLoadMore={loadMore}
                isBatchDownloading={isBatchDownloading}
                isLoadingMore={isLoadingMore}
                hasMore={hasMore}
                disabled={isBatchDownloading || isLoadingPlaylist}
              />
            </section>
          ) : results.length > 1 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-accent text-sm font-medium shrink-0">
                  2
                </div>
                <h2 className="text-base sm:text-lg font-semibold text-text-primary">
                  Wybierz utwór ({results.length} wyników)
                </h2>
              </div>
              <SearchResults
                results={results}
                onSelect={handleSelectVideo}
              />
            </section>
          )}
        </div>

        {/* Right Column - Download Progress (always visible) */}
        <div className="w-full xl:w-96 xl:shrink-0">
          <div className="xl:sticky xl:top-4 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-accent text-sm font-medium shrink-0">
                3
              </div>
              <h2 className="text-base sm:text-lg font-semibold text-text-primary">
                Postęp pobierania
                {(downloads.length > 0 || isBatchDownloading) && (
                  <span className="ml-2 text-xs sm:text-sm text-text-secondary">
                    {isBatchDownloading 
                      ? '(pobieranie playlisty)'
                      : `(${downloads.length} ${downloads.length === 1 ? 'pobieranie' : 'pobierania'})`
                    }
                  </span>
                )}
              </h2>
            </div>
            
            {/* Batch Download Progress */}
            {isBatchDownloading && batchProgress && (
              <BatchDownloadProgressView
                progress={batchProgress}
                completedDownloads={completedDownloads}
                failedDownloads={failedDownloads}
                onCancel={cancelBatchDownload}
              />
            )}
            
            {/* Single Downloads List */}
            {!isBatchDownloading && (
              <>
                {downloads.length === 0 ? (
                  <div className="p-6 bg-surface border border-border rounded-lg text-center text-text-muted">
                    <Download className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Brak aktywnych pobrań</p>
                    <p className="text-xs mt-1">Wybierz utwór i rozpocznij pobieranie</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[400px] xl:max-h-[calc(100vh-200px)] overflow-y-auto pr-1">
                    {downloads.map((download) => (
                      <div 
                        key={download.id} 
                        className={`relative p-3 bg-surface border rounded-lg ${
                          download.completed 
                            ? 'border-green-500/30 bg-green-500/5' 
                            : download.error 
                              ? 'border-red-500/30 bg-red-500/5'
                              : download.isDownloading 
                                ? 'border-accent/30'
                                : 'border-border'
                        }`}
                      >
                        {/* Remove button */}
                        {(download.completed || download.error || !download.isDownloading) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute top-1 right-1 h-6 w-6 p-0 opacity-50 hover:opacity-100"
                            onClick={() => removeDownload(download.id)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        )}
                        
                        {/* Video title */}
                        <p className="text-sm font-medium text-text-primary pr-6 mb-2 line-clamp-2">
                          {download.video.title}
                        </p>
                        
                        {/* Progress */}
                        <DownloadProgress 
                          progress={download.progress} 
                          compact 
                        />
                        
                        {/* Status */}
                        {download.error && (
                          <p className="text-xs text-red-500 mt-2">✗ {download.error}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Format Selector Dialog */}
      <FormatSelector
        isOpen={isFormatDialogOpen}
        onClose={handleCloseDialog}
        title={selectedVideo?.title || ''}
        formats={formats}
        onDownload={handleDownload}
        isLoading={isLoadingFormats}
      />
    </div>
  );
}

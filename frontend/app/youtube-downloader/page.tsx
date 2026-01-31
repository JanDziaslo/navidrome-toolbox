'use client';

import { useState } from 'react';
import { Download, AlertCircle } from 'lucide-react';
import { SearchForm } from '@/components/youtube/search-form';
import { SearchResults } from '@/components/youtube/search-results';
import { FormatSelector } from '@/components/youtube/format-selector';
import { DownloadProgress } from '@/components/youtube/download-progress';
import { useYoutubeSearch } from '@/hooks/use-youtube-search';
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
  const { results, isLoading: isSearching, error: searchError, search, clear } = useYoutubeSearch();
  
  const [selectedVideo, setSelectedVideo] = useState<YouTubeSearchResult | null>(null);
  const [formats, setFormats] = useState<VideoFormat[]>([]);
  const [isLoadingFormats, setIsLoadingFormats] = useState(false);
  const [isFormatDialogOpen, setIsFormatDialogOpen] = useState(false);
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);

  const handleSearch = async (query: string, limit: number, musicOnly: boolean) => {
    clear();
    // Don't clear downloads - they should remain visible
    await search(query, limit, musicOnly);
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
    if (!selectedVideo) return;
    
    setIsFormatDialogOpen(false);
    
    // Create new download item
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
  };

  const removeDownload = (downloadId: string) => {
    setDownloads(prev => prev.filter(d => d.id !== downloadId));
  };

  const handleCloseDialog = () => {
    setIsFormatDialogOpen(false);
    setSelectedVideo(null);
    setFormats([]);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center">
          <Download className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-text-primary">YouTube Downloader</h1>
          <p className="text-text-secondary">
            Wyszukaj i pobierz muzykę z YouTube.
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {searchError && (
        <Alert variant="destructive" className="bg-red-500/10 border-red-500/20">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {searchError}
          </AlertDescription>
        </Alert>
      )}

      {/* Two Column Layout */}
      <div className="flex gap-8 items-start">
        {/* Left Column - Search and Results */}
        <div className="flex-1 space-y-8 max-w-4xl">
          {/* Step 1: Search */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-accent text-sm font-medium">
                1
              </div>
              <h2 className="text-lg font-semibold text-text-primary">Wyszukaj utwór.</h2>
            </div>
            <SearchForm onSearch={handleSearch} isLoading={isSearching} />
          </section>

          {/* Step 2: Results */}
          {results.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-accent text-sm font-medium">
                  2
                </div>
                <h2 className="text-lg font-semibold text-text-primary">
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
        <div className="w-96 shrink-0">
          <div className="sticky top-4 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-accent text-sm font-medium">
                3
              </div>
              <h2 className="text-lg font-semibold text-text-primary">
                Postęp pobierania
                {downloads.length > 0 && (
                  <span className="ml-2 text-sm text-text-secondary">
                    ({downloads.length} {downloads.length === 1 ? 'pobieranie' : 'pobierania'})
                  </span>
                )}
              </h2>
            </div>
            
            {downloads.length === 0 ? (
              <div className="p-6 bg-surface border border-border rounded-lg text-center text-text-muted">
                <Download className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Brak aktywnych pobrań</p>
                <p className="text-xs mt-1">Wybierz utwór i rozpocznij pobieranie</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto pr-1">
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

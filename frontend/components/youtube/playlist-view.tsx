'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Eye, User, Download, CheckSquare, Square, ListMusic, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PlaylistInfo, YouTubeSearchResult } from '@/types/api';
import { formatDuration, formatViewCount } from '@/lib/utils';

interface PlaylistViewProps {
  playlist: PlaylistInfo;
  videos: YouTubeSearchResult[];
  onSelectVideo: (video: YouTubeSearchResult) => void;
  onDownloadSelected: (videos: YouTubeSearchResult[]) => void;
  onLoadMore?: () => void;
  isBatchDownloading: boolean;
  isLoadingMore?: boolean;
  hasMore?: boolean;
  disabled?: boolean;
}

export function PlaylistView({ 
  playlist, 
  videos,
  onSelectVideo, 
  onDownloadSelected,
  onLoadMore,
  isBatchDownloading,
  isLoadingMore = false,
  hasMore = false,
  disabled = false
}: PlaylistViewProps) {
  const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set());
  const listRef = useRef<HTMLDivElement>(null);

  // Scroll detection for infinite loading
  useEffect(() => {
    const handleScroll = () => {
      if (!listRef.current || !onLoadMore || isLoadingMore || !hasMore) return;
      
      const { scrollTop, scrollHeight, clientHeight } = listRef.current;
      // Load more when user scrolls to within 100px of bottom
      if (scrollTop + clientHeight >= scrollHeight - 100) {
        onLoadMore();
      }
    };

    const listElement = listRef.current;
    if (listElement) {
      listElement.addEventListener('scroll', handleScroll);
      return () => listElement.removeEventListener('scroll', handleScroll);
    }
  }, [onLoadMore, isLoadingMore, hasMore]);

  const toggleVideo = (videoId: string) => {
    if (disabled || isBatchDownloading) return;
    
    const newSelected = new Set(selectedVideos);
    if (newSelected.has(videoId)) {
      newSelected.delete(videoId);
    } else {
      newSelected.add(videoId);
    }
    setSelectedVideos(newSelected);
  };

  const selectAll = () => {
    if (disabled || isBatchDownloading) return;
    setSelectedVideos(new Set(videos.map(v => v.id)));
  };

  const deselectAll = () => {
    if (disabled || isBatchDownloading) return;
    setSelectedVideos(new Set());
  };

  const handleDownloadSelected = () => {
    if (disabled || isBatchDownloading) return;
    
    const videosToDownload = videos.filter(v => selectedVideos.has(v.id));
    if (videosToDownload.length > 0) {
      onDownloadSelected(videosToDownload);
    }
  };

  const isAllSelected = selectedVideos.size === videos.length && videos.length > 0;
  const hasSelection = selectedVideos.size > 0;

  return (
    <div className="space-y-4">
      {/* Playlist Header */}
      <Card className="bg-surface border-border">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Playlist Thumbnail */}
            <div className="relative w-full sm:w-48 h-32 sm:h-28 shrink-0 rounded-lg overflow-hidden bg-black">
              {playlist.thumbnail ? (
                <Image
                  src={playlist.thumbnail}
                  alt={playlist.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 192px"
                />
              ) : (
                <div className="w-full h-full bg-accent/20 flex items-center justify-center">
                  <ListMusic className="w-8 h-8 text-accent" />
                </div>
              )}
              <div className="absolute bottom-1 right-1 bg-black/80 px-2 py-0.5 rounded text-xs text-white font-medium">
                {playlist.video_count} utworów
              </div>
            </div>

            {/* Playlist Info */}
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-text-primary line-clamp-2 mb-2">
                {playlist.title}
              </h2>
              <div className="flex items-center gap-2 text-sm text-text-secondary mb-4">
                <User className="w-4 h-4" />
                <span className="truncate">{playlist.uploader}</span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={isAllSelected ? deselectAll : selectAll}
                  disabled={disabled || isBatchDownloading}
                  className="border-border"
                >
                  {isAllSelected ? (
                    <>
                      <Square className="w-4 h-4 mr-1" />
                      Odznacz wszystkie
                    </>
                  ) : (
                    <>
                      <CheckSquare className="w-4 h-4 mr-1" />
                      Zaznacz wszystkie
                    </>
                  )}
                </Button>
                
                <Button
                  size="sm"
                  onClick={handleDownloadSelected}
                  disabled={!hasSelection || disabled || isBatchDownloading}
                  className="bg-accent hover:bg-accent-hover text-white"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Pobierz zaznaczone ({selectedVideos.size})
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Videos List */}
      <div ref={listRef} className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
        {videos.map((video, index) => (
          <Card 
            key={video.id} 
            onClick={() => toggleVideo(video.id)}
            className={`transition-all cursor-pointer ${
              selectedVideos.has(video.id)
                ? 'bg-accent/5 border-2 border-accent shadow-sm'
                : 'bg-surface border-border hover:border-accent/50'
            } ${disabled || isBatchDownloading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <CardContent className="p-2 flex items-center gap-3">
              {/* Checkbox Button - leftmost */}
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleVideo(video.id);
                }}
                disabled={disabled || isBatchDownloading}
                className={`h-7 w-7 p-0 shrink-0 ${
                  selectedVideos.has(video.id) 
                    ? 'bg-accent border-accent text-white hover:bg-accent-hover' 
                    : 'border-border hover:border-accent'
                }`}
              >
                {selectedVideos.has(video.id) ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <span className="w-3.5 h-3.5" />
                )}
              </Button>

              {/* Thumbnail */}
              <div className="relative w-20 h-14 shrink-0 rounded overflow-hidden bg-black">
                <Image
                  src={video.thumbnail}
                  alt={video.title}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
                <div className="absolute bottom-0.5 right-0.5 bg-black/80 px-1 py-0.5 rounded text-[10px] text-white">
                  {formatDuration(video.duration)}
                </div>
              </div>

              {/* Info - title larger, uploader below */}
              <div className="flex-1 min-w-0">
                <h3 className={`text-base font-semibold line-clamp-1 mb-0.5 ${
                  selectedVideos.has(video.id) ? 'text-accent' : 'text-text-primary'
                }`}>
                  {video.title}
                </h3>
                <div className="flex items-center gap-2 text-xs text-text-secondary">
                  <User className="w-3 h-3" />
                  <span className="truncate">{video.uploader}</span>
                  <span className="text-text-muted">•</span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {formatViewCount(video.view_count)}
                  </span>
                </div>
              </div>

              {/* Individual Download Button with text */}
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectVideo(video);
                }}
                disabled={disabled || isBatchDownloading}
                className="bg-accent hover:bg-accent-hover text-white shrink-0"
                size="sm"
              >
                <Download className="w-3 h-3 mr-1" />
                Pobierz
              </Button>
            </CardContent>
          </Card>
        ))}
        
        {/* Loading indicator at bottom */}
        {isLoadingMore && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-6 h-6 text-accent animate-spin" />
            <span className="ml-2 text-sm text-text-secondary">Ładowanie więcej utworów...</span>
          </div>
        )}
        
        {/* End of list indicator */}
        {!hasMore && videos.length > 0 && !isLoadingMore && (
          <div className="text-center py-4 text-xs text-text-muted">
            Wszystkie utwory zostały załadowane ({videos.length} z {playlist.total_count || videos.length})
          </div>
        )}
      </div>
    </div>
  );
}

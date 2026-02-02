'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Loader2, Music } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { FileItem } from '@/types/api';
import { formatDuration } from '@/lib/utils';
import { getThumbnailUrl } from '@/lib/api/files';

interface FileListProps {
  files: FileItem[];
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
  hasMore?: boolean;
  total?: number;
}

export function FileList({ 
  files,
  onLoadMore,
  isLoadingMore = false,
  hasMore = false,
  total = 0
}: FileListProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      if (!listRef.current || !onLoadMore || isLoadingMore || !hasMore) return;
      
      const { scrollTop, scrollHeight, clientHeight } = listRef.current;
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

  const handleFileClick = (file: FileItem) => {
    router.push(`/metadata/${file.id}`);
  };

  const formatBitrate = (bitrate: number | null): string => {
    if (!bitrate) return '-';
    return `${bitrate} kbps`;
  };

  if (files.length === 0) {
    return (
      <div className="p-8 bg-surface border border-border rounded-lg text-center text-text-muted">
        <Music className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm">Brak plików do wyświetlenia</p>
        <p className="text-xs mt-1">Wpisz frazę wyszukiwania aby znaleźć utwory</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {total > 0 && (
        <div className="text-sm text-text-secondary mb-2">
          Znaleziono {total} {total === 1 ? 'plik' : total < 5 ? 'pliki' : 'plików'}
          {files.length < total && ` (wyświetlono ${files.length})`}
        </div>
      )}
      
      <div 
        ref={listRef} 
        className="space-y-2 max-h-[calc(100vh-250px)] overflow-y-auto pr-1"
      >
        {files.map((file) => (
          <Card 
            key={file.id} 
            onClick={() => handleFileClick(file)}
            className="cursor-pointer bg-surface border-border hover:border-accent/50 hover:bg-accent/5 transition-all"
          >
            <CardContent className="p-3 flex items-center gap-4">
              {/* Thumbnail - fixed 60x60 */}
              <div className="relative w-[60px] h-[60px] shrink-0 rounded overflow-hidden bg-black flex items-center justify-center">
                {file.has_cover ? (
                  <Image
                    src={getThumbnailUrl(file.path)}
                    alt={file.title || file.filename}
                    fill
                    className="object-cover"
                    sizes="60px"
                  />
                ) : (
                  <Music className="w-6 h-6 text-text-muted" />
                )}
              </div>

              {/* Info - Title, Artist/Album, Filename */}
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-text-primary line-clamp-1">
                  {file.title || file.filename}
                </h3>
                <div className="text-sm text-text-secondary line-clamp-1">
                  {file.artist && file.album ? (
                    <>{file.artist} - {file.album}</>
                  ) : file.artist ? (
                    file.artist
                  ) : (
                    <span className="text-text-muted">Nieznany artysta</span>
                  )}
                </div>
                <div className="text-xs text-text-muted line-clamp-1">
                  {file.filename}
                </div>
              </div>

              {/* Technical details - Duration, Format, Quality */}
              <div className="flex items-center gap-4 text-sm text-text-secondary shrink-0">
                <span className="w-12 text-right">
                  {file.duration ? formatDuration(file.duration) : '-:--'}
                </span>
                <span className="w-16 text-right uppercase">
                  {file.format}
                </span>
                <span className="w-20 text-right">
                  {formatBitrate(file.bitrate)}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {/* Loading indicator at bottom */}
        {isLoadingMore && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-6 h-6 text-accent animate-spin" />
            <span className="ml-2 text-sm text-text-secondary">Ładowanie więcej plików...</span>
          </div>
        )}
        
        {/* End of list indicator */}
        {!hasMore && files.length > 0 && !isLoadingMore && (
          <div className="text-center py-4 text-xs text-text-muted">
            Wszystkie pliki zostały załadowane ({files.length} z {total})
          </div>
        )}
      </div>
    </div>
  );
}

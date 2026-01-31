'use client';

import Image from 'next/image';
import { Play, Eye, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { YouTubeSearchResult } from '@/types/api';
import { formatDuration, formatViewCount } from '@/lib/utils';

interface SearchResultsProps {
  results: YouTubeSearchResult[];
  onSelect: (video: YouTubeSearchResult) => void;
}

export function SearchResults({ results, onSelect }: SearchResultsProps) {
  if (results.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-4">
      {results.map((video) => (
        <Card 
          key={video.id} 
          className="bg-surface border-border hover:border-accent/50 transition-colors group"
        >
          <CardContent className="p-4 flex gap-4">
            {/* Thumbnail */}
            <div className="relative w-40 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-black">
              <Image
                src={video.thumbnail}
                alt={video.title}
                fill
                className="object-cover"
                sizes="160px"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Play className="w-8 h-8 text-white" />
              </div>
              <div className="absolute bottom-1 right-1 bg-black/80 px-1.5 py-0.5 rounded text-xs text-white font-medium">
                {formatDuration(video.duration)}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h3 className="text-text-primary font-medium line-clamp-2 mb-2 group-hover:text-accent transition-colors">
                {video.title}
              </h3>
              
              <div className="space-y-1 text-sm text-text-secondary">
                <div className="flex items-center gap-2">
                  <User className="w-3 h-3" />
                  <span className="truncate">{video.uploader}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Eye className="w-3 h-3" />
                  <span>{formatViewCount(video.view_count)} wyświetleń</span>
                </div>
              </div>
            </div>

            {/* Action */}
            <div className="flex items-center">
              <Button
                onClick={() => onSelect(video)}
                className="bg-accent hover:bg-accent-hover text-white"
              >
                Wybierz
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

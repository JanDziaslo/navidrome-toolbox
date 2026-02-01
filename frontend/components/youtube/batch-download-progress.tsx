'use client';

import { useState } from 'react';
import { Download, X, ChevronDown, ChevronUp, Check, AlertCircle, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BatchDownloadProgress, YouTubeSearchResult } from '@/types/api';

interface BatchDownloadProgressProps {
  progress: BatchDownloadProgress | null;
  completedDownloads: YouTubeSearchResult[];
  failedDownloads: Array<{ video: YouTubeSearchResult; error: string }>;
  onCancel: () => void;
}

export function BatchDownloadProgressView({ 
  progress, 
  completedDownloads, 
  failedDownloads,
  onCancel 
}: BatchDownloadProgressProps) {
  const [isCompletedExpanded, setIsCompletedExpanded] = useState(false);

  if (!progress) return null;

  const isComplete = progress.status === 'complete' || progress.status === 'cancelled';
  const isError = progress.status === 'error';
  const totalProgress = progress.totalVideos > 0 
    ? ((progress.completedCount + progress.failedCount) / progress.totalVideos) * 100 
    : 0;

  return (
    <Card className={`border-2 ${
      isComplete 
        ? 'border-green-500/30 bg-green-500/5' 
        : isError 
          ? 'border-red-500/30 bg-red-500/5'
          : 'border-accent/30'
    }`}>
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Download className={`w-5 h-5 ${
              isComplete ? 'text-green-500' : isError ? 'text-red-500' : 'text-accent'
            }`} />
            <h3 className="font-semibold text-text-primary">
              {isComplete 
                ? 'Pobieranie zakończone' 
                : isError 
                  ? 'Pobieranie nie powiodło się'
                  : 'Pobieranie playlisty'}
            </h3>
          </div>
          
          {!isComplete && !isError && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="h-8 w-8 p-0 text-text-muted hover:text-red-500"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Current Video Progress */}
        {!isComplete && !isError && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-secondary">
                Aktualnie: {progress.currentVideoIndex} z {progress.totalVideos}
              </span>
              <span className="text-accent font-medium">
                {Math.round(progress.currentVideoProgress)}%
              </span>
            </div>
            <Progress 
              value={progress.currentVideoProgress} 
              className="h-2 bg-border"
            />
            <p className="text-sm text-text-primary line-clamp-1">
              {progress.currentVideoTitle}
            </p>
          </div>
        )}

        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">Całkowity postęp:</span>
            <span className="text-text-primary font-medium">
              {progress.completedCount}/{progress.totalVideos} ukończone
              {progress.failedCount > 0 && (
                <span className="text-red-500 ml-2">
                  ({progress.failedCount} błędów)
                </span>
              )}
            </span>
          </div>
          <Progress 
            value={totalProgress} 
            className="h-2 bg-border"
          />
        </div>

        {/* Status Messages */}
        {isComplete && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <Check className="w-4 h-4" />
            <span>Pobieranie zakończone pomyślnie</span>
          </div>
        )}
        
        {isError && (
          <div className="flex items-center gap-2 text-sm text-red-500">
            <AlertCircle className="w-4 h-4" />
            <span>Wystąpiły błędy podczas pobierania</span>
          </div>
        )}

        {progress.status === 'cancelled' && (
          <div className="flex items-center gap-2 text-sm text-amber-500">
            <AlertCircle className="w-4 h-4" />
            <span>Pobieranie anulowane przez użytkownika</span>
          </div>
        )}

        {/* Completed Downloads List */}
        {completedDownloads.length > 0 && (
          <div className="border-t border-border pt-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCompletedExpanded(!isCompletedExpanded)}
              className="w-full flex items-center justify-between text-text-secondary hover:text-text-primary"
            >
              <span className="flex items-center gap-2">
                <Music className="w-4 h-4" />
                Pobrane utwory ({completedDownloads.length})
              </span>
              {isCompletedExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
            
            {isCompletedExpanded && (
              <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                {completedDownloads.map((video, index) => (
                  <div 
                    key={video.id}
                    className="flex items-center gap-2 text-sm text-text-secondary py-1"
                  >
                    <Check className="w-3 h-3 text-green-500 shrink-0" />
                    <span className="line-clamp-1">{index + 1}. {video.title}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Failed Downloads List */}
        {failedDownloads.length > 0 && (
          <div className="border-t border-border pt-3">
            <div className="text-sm text-red-500 mb-2">
              Nieudane pobrania ({failedDownloads.length}):
            </div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {failedDownloads.map(({ video, error }) => (
                <div 
                  key={video.id}
                  className="flex items-start gap-2 text-xs text-text-secondary py-1"
                >
                  <AlertCircle className="w-3 h-3 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="line-clamp-1">{video.title}</span>
                    <span className="text-red-400">{error}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

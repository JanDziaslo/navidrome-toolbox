'use client';

import { CheckCircle, AlertCircle, FileAudio, Download, Loader2, Check } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { DownloadEvent } from '@/types/api';
import { formatFileSize, formatSpeed } from '@/lib/utils';

interface DownloadProgressProps {
  progress: DownloadEvent | null;
  compact?: boolean;
}

export function DownloadProgress({ progress, compact = false }: DownloadProgressProps) {
  // If no progress yet (initial state)
  if (!progress) {
    if (compact) {
      return (
        <div className="flex items-center gap-2 text-text-muted">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-xs">Rozpoczynanie pobierania...</span>
        </div>
      );
    }
    return null;
  }

  if (progress.status === 'complete') {
    if (compact) {
      return (
        <div className="space-y-2">
          <Progress value={100} className="h-1.5 bg-border" />
          <div className="flex justify-between text-xs">
            <span className="text-green-500"><Check /></span>
            <span className="text-text-muted">100%</span>
          </div>
        </div>
      );
    }
    
    return (
      <Card className="bg-surface border-border">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            {progress.success ? (
              <>
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <h3 className="text-text-primary font-medium">Pobieranie zakończone</h3>
                  <p className="text-text-secondary text-sm">
                    Zapisano w: {progress.file_path}
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <h3 className="text-text-primary font-medium">Pobieranie nie powiodło się</h3>
                  <p className="text-text-secondary text-sm">
                    Coś poszło nie tak podczas pobierania.
                  </p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (progress.status === 'finished') {
    if (compact) {
      return (
        <div className="flex items-center gap-2 text-text-muted">
          <FileAudio className="w-4 h-4" />
          <span className="text-xs">Przetwarzanie...</span>
        </div>
      );
    }
    
    return (
      <Card className="bg-surface border-border">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center">
              <FileAudio className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h3 className="text-text-primary font-medium">Przetwarzanie...</h3>
              <p className="text-text-secondary text-sm">
                {progress.filename}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (progress.status === 'downloading') {
    const { percent, speed, eta, downloaded, total } = progress;

    if (compact) {
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-accent flex items-center gap-1">
              <Download className="w-3 h-3" />
              {formatSpeed(speed)}
            </span>
            <span className="text-text-muted">{Math.round(percent)}%</span>
          </div>
          <Progress value={percent} className="h-1.5 bg-border" />
          <div className="flex justify-between text-xs text-text-muted">
            <span>{formatFileSize(downloaded)}</span>
            <span>{formatFileSize(total)}</span>
          </div>
          {eta > 0 && (
            <div className="text-xs text-text-muted">
              Pozostało {Math.ceil(eta)}s
            </div>
          )}
        </div>
      );
    }

    return (
      <Card className="bg-surface border-border">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center">
              <Download className="w-6 h-6 text-accent animate-bounce" />
            </div>
            <div className="flex-1">
              <h3 className="text-text-primary font-medium">Pobieranie...</h3>
              <div className="flex items-center gap-4 text-sm text-text-secondary">
                <span>{formatSpeed(speed)}</span>
                <span>•</span>
                <span>{Math.round(percent)}%</span>
                {eta > 0 && (
                  <>
                    <span>•</span>
                    <span>Pozostało {Math.ceil(eta)}s</span>
                  </>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-text-primary font-medium">
                {formatFileSize(downloaded)} / {formatFileSize(total)}
              </div>
            </div>
          </div>

          <Progress value={percent} className="h-2 bg-border" />

          <div className="flex justify-between text-xs text-text-muted">
            <span>{formatFileSize(downloaded)}</span>
            <span>{formatFileSize(total)}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}

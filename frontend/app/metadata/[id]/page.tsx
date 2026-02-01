'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Music, FileMusic, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileItem } from '@/types/api';
import { formatDuration, formatFileSize } from '@/lib/utils';
import { getFileById, getThumbnailUrl } from '@/lib/api/files';

export default function FileDetailPage() {
  const params = useParams();
  const router = useRouter();
  const fileId = params.id as string;

  const [file, setFile] = useState<FileItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadFile = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch single file by ID using the dedicated endpoint
        const file = await getFileById(fileId);
        setFile(file);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Nie udało się załadować pliku');
      } finally {
        setIsLoading(false);
      }
    };

    if (fileId) {
      loadFile();
    }
  }, [fileId]);

  const handleBack = () => {
    router.push('/metadata');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (error || !file) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={handleBack} className="border-border">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Wróć do listy
        </Button>
        
        <Alert variant="destructive" className="bg-red-500/10 border-red-500/20">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || 'Plik nie został znaleziony'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      {/* Back button */}
      <Button variant="outline" onClick={handleBack} className="border-border">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Wróć do listy
      </Button>

      {/* Header with thumbnail and basic info */}
      <div className="flex flex-col sm:flex-row gap-6">
        {/* Thumbnail */}
        <div className="relative w-full sm:w-48 h-48 shrink-0 rounded-lg overflow-hidden bg-surface border border-border flex items-center justify-center">
          {file.has_cover ? (
            <Image
              src={getThumbnailUrl(file.path)}
              alt={file.title || file.filename}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 192px"
            />
          ) : (
            <Music className="w-16 h-16 text-text-muted" />
          )}
        </div>

        {/* Basic Info */}
        <div className="flex-1 space-y-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary mb-2">
              {file.title || 'Brak tytułu'}
            </h1>
            <p className="text-lg text-text-secondary">
              {file.artist || 'Nieznany artysta'}
            </p>
            {file.album && (
              <p className="text-sm text-text-muted">
                Album: {file.album}
              </p>
            )}
          </div>

          {/* File info badges */}
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="px-3 py-1 bg-surface border border-border rounded-full text-text-secondary">
              {file.format.toUpperCase()}
            </span>
            {file.bitrate && (
              <span className="px-3 py-1 bg-surface border border-border rounded-full text-text-secondary">
                {file.bitrate} kbps
              </span>
            )}
            {file.duration && (
              <span className="px-3 py-1 bg-surface border border-border rounded-full text-text-secondary">
                {formatDuration(file.duration)}
              </span>
            )}
            <span className="px-3 py-1 bg-surface border border-border rounded-full text-text-secondary">
              {formatFileSize(file.file_size)}
            </span>
          </div>
        </div>
      </div>

      {/* Metadata Form */}
      <Card className="bg-surface border-border">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileMusic className="w-5 h-5 text-accent" />
            Metadane
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Tytuł</Label>
              <Input
                id="title"
                value={file.title || ''}
                readOnly
                className="bg-background border-border"
              />
            </div>

            {/* Artist */}
            <div className="space-y-2">
              <Label htmlFor="artist">Artysta</Label>
              <Input
                id="artist"
                value={file.artist || ''}
                readOnly
                className="bg-background border-border"
              />
            </div>

            {/* Album */}
            <div className="space-y-2">
              <Label htmlFor="album">Album</Label>
              <Input
                id="album"
                value={file.album || ''}
                readOnly
                className="bg-background border-border"
              />
            </div>

            {/* Year */}
            <div className="space-y-2">
              <Label htmlFor="year">Rok</Label>
              <Input
                id="year"
                value={file.year?.toString() || ''}
                readOnly
                className="bg-background border-border"
              />
            </div>

            {/* Track Number */}
            <div className="space-y-2">
              <Label htmlFor="track_number">Numer utworu</Label>
              <Input
                id="track_number"
                value={file.track_number?.toString() || ''}
                readOnly
                className="bg-background border-border"
              />
            </div>

            {/* Genre */}
            <div className="space-y-2">
              <Label htmlFor="genre">Gatunek</Label>
              <Input
                id="genre"
                value={file.genre || ''}
                readOnly
                className="bg-background border-border"
              />
            </div>
          </div>

          {/* Filename (read-only, informational) */}
          <div className="space-y-2">
            <Label htmlFor="filename">Nazwa pliku</Label>
            <Input
              id="filename"
              value={file.filename}
              readOnly
              className="bg-background border-border text-text-muted"
            />
          </div>

          {/* File path (read-only, informational) */}
          <div className="space-y-2">
            <Label htmlFor="path">Ścieżka</Label>
            <Input
              id="path"
              value={file.path}
              readOnly
              className="bg-background border-border text-text-muted"
            />
          </div>
        </CardContent>
      </Card>

      {/* Note about future editing */}
      <div className="p-4 bg-accent/5 border border-accent/20 rounded-lg">
        <p className="text-sm text-text-secondary">
          <strong className="text-accent">Informacja:</strong> Edycja metadanych będzie dostępna w przyszłej wersji. 
          Obecnie możesz przeglądać metadane plików.
        </p>
      </div>
    </div>
  );
}

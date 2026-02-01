'use client';

import { useState } from 'react';
import { Music, FileAudio, HardDrive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { VideoFormat } from '@/types/api';
import { formatFileSize } from '@/lib/utils';

interface FormatSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  formats: VideoFormat[];
  onDownload: (formatId: string) => void;
  isLoading: boolean;
}

export function FormatSelector({ 
  isOpen, 
  onClose, 
  title, 
  formats, 
  onDownload, 
  isLoading 
}: FormatSelectorProps) {
  const [selectedFormat, setSelectedFormat] = useState<string>('');

  // Filter audio-only formats
  const audioFormats = formats.filter(f => 
    f.resolution === 'audio only' && f.audio_codec !== 'none'
  );

  const handleDownload = () => {
    if (selectedFormat) {
      onDownload(selectedFormat);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-surface border-border w-[calc(100vw-2rem)] sm:max-w-lg md:max-w-xl lg:max-w-2xl max-h-[80vh] overflow-y-auto shadow-2xl p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-text-primary flex items-center gap-2 text-base sm:text-lg">
            <Music className="w-5 h-5 text-accent" />
            Select Audio Format
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          <p className="text-text-secondary text-xs sm:text-sm mb-4 line-clamp-2">{title}</p>
          
          {audioFormats.length === 0 ? (
            <div className="text-center py-8 text-text-muted">
              <FileAudio className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No audio formats available for this video.</p>
            </div>
          ) : (
            <RadioGroup 
              value={selectedFormat} 
              onValueChange={setSelectedFormat}
              className="space-y-2"
            >
              {audioFormats.map((format) => (
                <div
                  key={format.format_id}
                  className={`flex items-start sm:items-center space-x-2 sm:space-x-3 p-2 sm:p-3 rounded-lg border transition-colors ${
                    selectedFormat === format.format_id
                      ? 'border-accent bg-accent/10'
                      : 'border-border hover:border-accent/50'
                  }`}
                >
                  <RadioGroupItem 
                    value={format.format_id} 
                    id={format.format_id}
                    className="border-accent text-accent mt-0.5 sm:mt-0"
                  />
                  <Label 
                    htmlFor={format.format_id}
                    className="flex-1 cursor-pointer"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-0">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <span className="font-medium text-text-primary text-sm">
                          {format.ext.toUpperCase()}
                        </span>
                        <span className="text-text-secondary text-xs sm:text-sm">
                          {format.audio_codec}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-text-muted">
                        <span>{Math.round(format.abr)} kbps</span>
                        <span className="flex items-center gap-1">
                          <HardDrive className="w-3 h-3" />
                          {formatFileSize(format.filesize)}
                        </span>
                      </div>
                    </div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}

          <div className="flex flex-col sm:flex-row justify-end gap-2 mt-6">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="border-border text-text-secondary w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDownload}
              disabled={!selectedFormat || isLoading || audioFormats.length === 0}
              className="bg-accent hover:bg-accent-hover text-white w-full sm:w-auto"
            >
              {isLoading ? 'Downloading...' : 'Download'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, SlidersHorizontal, Music, Link, ListMusic } from 'lucide-react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';


const YOUTUBE_URL_REGEX = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|shorts\/)|youtu\.be\/)[\w-]+/;
const PLAYLIST_URL_REGEX = /^(https?:\/\/)?(www\.)?(youtube\.com\/.*[?&]list=|youtube\.com\/playlist\?)/;

interface SearchFormProps {
  onSearch: (query: string, limit: number, musicOnly: boolean, isUrl?: boolean, isPlaylist?: boolean) => void;
  isLoading: boolean;
}

const STORAGE_KEY_LIMIT = 'youtube-search-limit';
const STORAGE_KEY_MUSIC = 'youtube-search-music-only';

export function SearchForm({ onSearch, isLoading }: SearchFormProps) {
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(10);
  const [musicOnly, setMusicOnly] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isUrlDetected, setIsUrlDetected] = useState(false);
  const [isPlaylistDetected, setIsPlaylistDetected] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  // Load saved settings from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLimit = localStorage.getItem(STORAGE_KEY_LIMIT);
      if (savedLimit) {
        const parsedLimit = parseInt(savedLimit, 10);
        if (!isNaN(parsedLimit) && parsedLimit >= 1 && parsedLimit <= 20) {
          setLimit(parsedLimit);
        }
      }
      
      const savedMusicOnly = localStorage.getItem(STORAGE_KEY_MUSIC);
      if (savedMusicOnly !== null) {
        setMusicOnly(savedMusicOnly === 'true');
      }
    }
  }, []);

  // Save settings to localStorage when they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_LIMIT, limit.toString());
    }
  }, [limit]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_MUSIC, String(musicOnly));
    }
  }, [musicOnly]);

  // Spring animation for smooth value changes
  const springValue = useSpring(limit, {
    stiffness: 300,
    damping: 30,
  });

  const displayValue = useTransform(springValue, (val) => Math.round(val));
  const [displayLimit, setDisplayLimit] = useState(limit);

  useEffect(() => {
    const unsubscribe = displayValue.on("change", (val) => {
      setDisplayLimit(val);
    });
    return () => unsubscribe();
  }, [displayValue]);

  useEffect(() => {
    springValue.set(limit);
  }, [limit, springValue]);

   const handleSubmit = (e: React.FormEvent) => {
     e.preventDefault();
     if (query.trim()) {
       const trimmedQuery = query.trim();
       const isUrl = YOUTUBE_URL_REGEX.test(trimmedQuery);
       const isPlaylist = PLAYLIST_URL_REGEX.test(trimmedQuery);
       onSearch(trimmedQuery, limit, musicOnly, isUrl, isPlaylist);
       // Don't clear the query field
     }
   };

  useEffect(() => {
    const isUrl = YOUTUBE_URL_REGEX.test(query);
    const isPlaylist = PLAYLIST_URL_REGEX.test(query);
    setIsUrlDetected(isUrl);
    setIsPlaylistDetected(isPlaylist);
  }, [query]);

  const handleSliderChange = (clientX: number) => {
    if (!sliderRef.current) return;
    
    const rect = sliderRef.current.getBoundingClientRect();
    const percentage = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const newValue = Math.round(1 + percentage * 19);
    setLimit(newValue);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    handleSliderChange(e.clientX);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    isDragging.current = true;
    handleSliderChange(e.touches[0].clientX);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging.current) {
        handleSliderChange(e.clientX);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging.current) {
        handleSliderChange(e.touches[0].clientX);
      }
    };

    const handleEnd = () => {
      isDragging.current = false;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleEnd);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleEnd);
    };
  }, []);

  // Calculate thumb position
  const thumbPosition = ((limit - 1) / 19) * 100;

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          {isPlaylistDetected ? (
            <ListMusic className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-accent" />
          ) : isUrlDetected ? (
            <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-accent" />
          ) : (
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          )}
          <Input
            placeholder={
              isPlaylistDetected 
                ? "Wklej link playlisty YouTube..." 
                : isUrlDetected 
                  ? "Wklej link YouTube..." 
                  : "Szukaj na YouTube..."
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={`pl-10 bg-surface text-text-primary placeholder:text-text-muted ${
              isUrlDetected || isPlaylistDetected ? 'border-accent/50 focus:border-accent' : 'border-border'
            }`}
          />
        </div>
        
        <div className="flex gap-2">
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="border-border hover:bg-accent/20 hover:border-accent hover:text-accent transition-colors"
                title="Ustawienia wyszukiwania"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent 
              className="w-[calc(100vw-2rem)] sm:w-72 bg-surface border-border p-4 shadow-lg" 
              side="bottom" 
              align="end"
              sideOffset={8}
            >
              <div className="space-y-4">
                {/* Limit slider */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-text-primary">
                    Limit wyników
                  </span>
                  <motion.span 
                    className="text-sm font-bold text-accent bg-accent/10 px-3 py-1 rounded-full min-w-[3rem] text-center"
                    layout
                  >
                    {displayLimit}
                  </motion.span>
                </div>
                
                {/* Custom animated slider */}
                <div 
                  ref={sliderRef}
                  className="relative h-2 bg-border rounded-full cursor-pointer"
                  onMouseDown={handleMouseDown}
                  onTouchStart={handleTouchStart}
                >
                  {/* Track fill */}
                  <motion.div 
                    className="absolute left-0 top-0 h-full bg-accent rounded-full"
                    style={{ width: `${thumbPosition}%` }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                  
                  {/* Thumb */}
                  <motion.div
                    className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-accent rounded-full shadow-lg border-2 border-background cursor-grab active:cursor-grabbing"
                    style={{ left: `${thumbPosition}%`, x: "-50%" }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  />
                </div>
                
                <div className="flex justify-between text-xs text-text-muted">
                  <span>1</span>
                  <span>20</span>
                </div>
                
                <p className="text-xs text-gray-500">
                  Mniejsza ilość wyników przyspiesza wyszukiwanie.
                </p>

                {/* Divider */}
                <div className="h-px bg-border my-3" />

                {/* Music only toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Music className="w-4 h-4 text-text-secondary" />
                    <Label htmlFor="music-only" className="text-sm font-medium text-text-primary cursor-pointer">
                      Tylko muzyka
                    </Label>
                  </div>
                  <Switch
                    id="music-only"
                    checked={musicOnly}
                    onCheckedChange={setMusicOnly}
                  />
                </div>
                
                <p className="text-xs text-text-muted">
                  Wyszukuj utwory tylko strichte muzyczne.
                </p>
              </div>
            </PopoverContent>
          </Popover>

          <Button 
            type="submit" 
            disabled={isLoading || !query.trim()}
            className="bg-accent hover:bg-accent-hover text-white"
          >
            {isLoading ? 'Wyszukiwanie...' : 'Szukaj'}
          </Button>
        </div>
      </form>
    </div>
  );
}

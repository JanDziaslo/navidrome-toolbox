'use client';

import { useState } from 'react';
import { Search, FileMusic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface SearchFormProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
}

export function SearchForm({ onSearch, isLoading }: SearchFormProps) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    } else {
      onSearch('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <Input
          placeholder="Szukaj po tytule, artyście, albumie lub nazwie pliku..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 bg-surface text-text-primary placeholder:text-text-muted border-border"
        />
      </div>
      
      <Button 
        type="submit" 
        disabled={isLoading}
        className="bg-accent hover:bg-accent-hover text-white"
      >
        {isLoading ? (
          'Szukanie...'
        ) : (
          <>
            <FileMusic className="w-4 h-4 mr-2" />
            Szukaj
          </>
        )}
      </Button>
    </form>
  );
}

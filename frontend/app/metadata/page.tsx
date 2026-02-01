'use client';

import { useEffect } from 'react';
import { FilePen, AlertCircle } from 'lucide-react';
import { SearchForm } from '@/components/metadata/search-form';
import { FileList } from '@/components/metadata/file-list';
import { useFiles } from '@/hooks/use-files';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function MetadataPage() {
  const { 
    files, 
    isLoading, 
    isLoadingMore, 
    error, 
    hasMore, 
    total,
    searchFiles, 
    loadMore 
  } = useFiles();

  // Load initial files on mount
  useEffect(() => {
    searchFiles('');
  }, [searchFiles]);

  const handleSearch = (query: string) => {
    searchFiles(query);
  };

  return (
    <div className="space-y-6 lg:space-y-8 w-full">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 lg:w-12 lg:h-12 bg-accent rounded-lg flex items-center justify-center shrink-0">
          <FilePen className="w-5 h-5 lg:w-7 lg:h-7 text-white" />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-text-primary truncate">
            Edytor metadanych
          </h1>
          <p className="text-sm text-text-secondary">
            Przeglądaj i edytuj metadane plików muzycznych.
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="bg-red-500/10 border-red-500/20">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Search Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-accent text-sm font-medium shrink-0">
            1
          </div>
          <h2 className="text-base sm:text-lg font-semibold text-text-primary">
            Wyszukaj pliki
          </h2>
        </div>
        <SearchForm onSearch={handleSearch} isLoading={isLoading} />
      </section>

      {/* Files List Section */}
      {(!isLoading || files.length > 0) && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-accent text-sm font-medium shrink-0">
              2
            </div>
            <h2 className="text-base sm:text-lg font-semibold text-text-primary">
              Lista plików
            </h2>
          </div>
          <FileList
            files={files}
            onLoadMore={loadMore}
            isLoadingMore={isLoadingMore}
            hasMore={hasMore}
            total={total}
          />
        </section>
      )}
    </div>
  );
}

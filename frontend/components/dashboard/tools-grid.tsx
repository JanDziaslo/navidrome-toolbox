'use client';

import Link from 'next/link';
import { Download, Wrench } from 'lucide-react';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const tools = [
  {
    id: 'youtube-downloader',
    title: 'YouTube Downloader',
    description: 'Wyszukuj i pobieraj muzykę z YouTube.',
    icon: Download,
    href: '/youtube-downloader',
    status: 'Available',
  },
  {
    id: 'metadata-editor',
    title: 'Edytor metadanych',
    description: 'Edytuj metadane swoich plików audio.',
    icon: Wrench,
    href: '/metadata',
    status: 'Coming Soon',
  },
  {
    id: 'file-editor',
    title: 'Edytor plików',
    description: 'Modyfikuj i zarządzaj swoimi plikami audio.',
    icon: Wrench,
    href: '/file-editor',
    status: 'Coming Soon',
  }
];

export function ToolsGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {tools.map((tool) => {
        const Icon = tool.icon;
        return (
          <Link key={tool.id} href={tool.href}>
            <Card className="bg-surface border-border hover:border-accent transition-colors h-full group">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center group-hover:bg-accent/30 transition-colors">
                    <Icon className="w-5 h-5 text-accent" />
                  </div>
                  <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-0">
                    {tool.status}
                  </Badge>
                </div>
                <CardTitle className="text-text-primary mt-4 group-hover:text-accent transition-colors">
                  {tool.title}
                </CardTitle>
                <CardDescription className="text-text-secondary">
                  {tool.description}
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        );
      })}

      {/* Placeholder for future tools */}
      <Card className="bg-surface border-border border-dashed h-full opacity-50">
        <CardHeader>
          <div className="w-10 h-10 bg-border rounded-lg flex items-center justify-center">
            <Wrench className="w-5 h-5 text-text-muted" />
          </div>
          <CardTitle className="text-text-muted mt-4">Więcej narzędzi dostępnych wkrótce</CardTitle>
          <CardDescription className="text-text-muted">
            Dodatkowe narzędzia do zarządzania Navidrome
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

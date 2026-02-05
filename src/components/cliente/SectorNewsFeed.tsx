'use client';

import { useState, useEffect } from 'react';
import { Newspaper, ExternalLink, RefreshCw, Clock, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: string;
  published_at: string;
  image_url?: string;
  category?: string;
}

interface SectorNewsFeedProps {
  maxItems?: number;
  compact?: boolean;
}

export function SectorNewsFeed({ maxItems = 5, compact = false }: SectorNewsFeedProps) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [segment, setSegment] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadNews = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/client/sector-news');
      const data = await response.json();
      
      if (data.success) {
        setNews(data.news.slice(0, maxItems));
        setSegment(data.segment);
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Erro ao carregar notícias:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNews();
  }, []);

  const formatDate = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { 
        addSuffix: true, 
        locale: ptBR 
      });
    } catch {
      return 'recentemente';
    }
  };

  if (compact) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-base">
            <div className="flex items-center gap-2">
              <Newspaper className="w-4 h-4 text-primary" />
              Notícias do Setor
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={loadNews}
              disabled={isLoading}
              className="h-7 w-7 p-0"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </CardTitle>
          {segment && (
            <Badge variant="secondary" className="w-fit text-xs">
              {segment}
            </Badge>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                  <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : error ? (
            <p className="text-sm text-gray-500">Erro ao carregar notícias</p>
          ) : (
            news.map((item) => (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block group"
              >
                <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-primary line-clamp-2">
                  {item.title}
                </p>
                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                  <span>{item.source}</span>
                  <span>•</span>
                  <span>{formatDate(item.published_at)}</span>
                </div>
              </a>
            ))
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Newspaper className="w-5 h-5 text-primary" />
            </div>
            <div>
              <span>Notícias do Setor</span>
              {segment && (
                <Badge variant="secondary" className="ml-2">
                  {segment}
                </Badge>
              )}
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={loadNews}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex gap-4">
                <div className="w-20 h-16 bg-gray-200 rounded"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-100 rounded w-full mb-1"></div>
                  <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">{error}</p>
            <Button variant="outline" onClick={loadNews}>
              Tentar novamente
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {news.map((item) => (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex gap-4 group p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                {item.image_url && (
                  <div className="w-20 h-16 flex-shrink-0 bg-gray-100 rounded overflow-hidden">
                    <img 
                      src={item.image_url} 
                      alt="" 
                      className="w-full h-full object-cover"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 dark:text-white group-hover:text-primary line-clamp-2">
                    {item.title}
                  </h4>
                  <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                    {item.summary}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    <span className="font-medium">{item.source}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(item.published_at)}
                    </span>
                    {item.category && (
                      <Badge variant="outline" className="text-[10px] py-0">
                        {item.category}
                      </Badge>
                    )}
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-primary flex-shrink-0" />
              </a>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Smartphone, MessageSquare, Loader2, Eye, Edit2, 
  CheckCircle, AlertCircle, Clock
} from 'lucide-react';
import { DevicePreview } from './DevicePreview';
import { VisualAnnotation } from './VisualAnnotation';
import { toast } from 'sonner';

interface Annotation {
  id: string;
  x: number;
  y: number;
  text: string;
  author?: string;
  authorAvatar?: string;
  createdAt: string;
  resolved?: boolean;
  color?: 'red' | 'yellow' | 'blue' | 'green';
}

interface PostPreviewWithAnnotationsProps {
  postId: string;
  imageUrl: string;
  videoUrl?: string;
  caption?: string;
  username?: string;
  avatarUrl?: string;
  platform?: 'instagram' | 'facebook' | 'linkedin' | 'tiktok';
  postType?: 'feed' | 'story' | 'reel';
  status?: 'pending' | 'approved' | 'rejected' | 'revision';
  currentUserName?: string;
  currentUserAvatar?: string;
  readOnly?: boolean;
  onStatusChange?: (status: string) => void;
}

export function PostPreviewWithAnnotations({
  postId,
  imageUrl,
  videoUrl,
  caption = '',
  username = 'minha_marca',
  avatarUrl,
  platform = 'instagram',
  postType = 'feed',
  status = 'pending',
  currentUserName = 'Usuário',
  currentUserAvatar,
  readOnly = false,
  onStatusChange
}: PostPreviewWithAnnotationsProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'annotations'>('preview');
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnnotations();
  }, [postId]);

  const loadAnnotations = async () => {
    try {
      const response = await fetch(`/api/posts/annotations?postId=${postId}`);
      const data = await response.json();
      
      if (data.success) {
        setAnnotations(data.annotations);
      }
    } catch (error) {
      console.error('Erro ao carregar anotações:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAnnotation = async (annotation: Omit<Annotation, 'id' | 'createdAt'>) => {
    try {
      const response = await fetch('/api/posts/annotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId,
          x: annotation.x,
          y: annotation.y,
          text: annotation.text,
          color: annotation.color
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setAnnotations([...annotations, data.annotation]);
        toast.success('Marcação adicionada!');
      } else {
        toast.error('Erro ao adicionar marcação');
      }
    } catch (error) {
      console.error('Erro ao adicionar anotação:', error);
      toast.error('Erro ao adicionar marcação');
    }
  };

  const handleDeleteAnnotation = async (id: string) => {
    try {
      const response = await fetch(`/api/posts/annotations?annotationId=${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      
      if (data.success) {
        setAnnotations(annotations.filter(a => a.id !== id));
        toast.success('Marcação removida!');
      } else {
        toast.error('Erro ao remover marcação');
      }
    } catch (error) {
      console.error('Erro ao remover anotação:', error);
      toast.error('Erro ao remover marcação');
    }
  };

  const handleResolveAnnotation = async (id: string) => {
    try {
      const response = await fetch('/api/posts/annotations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ annotationId: id, resolved: true })
      });

      const data = await response.json();
      
      if (data.success) {
        setAnnotations(annotations.map(a => 
          a.id === id ? { ...a, resolved: true } : a
        ));
        toast.success('Marcação resolvida!');
      }
    } catch (error) {
      console.error('Erro ao resolver anotação:', error);
    }
  };

  const unresolvedCount = annotations.filter(a => !a.resolved).length;

  const getStatusBadge = () => {
    switch (status) {
      case 'approved':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Aprovado
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-100 text-red-800">
            <AlertCircle className="w-3 h-3 mr-1" />
            Reprovado
          </Badge>
        );
      case 'revision':
        return (
          <Badge className="bg-amber-100 text-amber-800">
            <Edit2 className="w-3 h-3 mr-1" />
            Em Revisão
          </Badge>
        );
      default:
        return (
          <Badge className="bg-blue-100 text-blue-800">
            <Clock className="w-3 h-3 mr-1" />
            Pendente
          </Badge>
        );
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Visualização do Post</CardTitle>
          <div className="flex items-center gap-2">
            {getStatusBadge()}
            {unresolvedCount > 0 && (
              <Badge variant="outline" className="border-red-300 text-red-600">
                {unresolvedCount} marcações pendentes
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Smartphone className="w-4 h-4" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="annotations" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Marcações
              {annotations.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary/10 text-primary rounded-full">
                  {annotations.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="mt-0">
            <DevicePreview
              imageUrl={imageUrl}
              videoUrl={videoUrl}
              caption={caption}
              username={username}
              avatarUrl={avatarUrl}
              platform={platform}
              postType={postType}
            />
          </TabsContent>

          <TabsContent value="annotations" className="mt-0">
            <VisualAnnotation
              imageUrl={imageUrl}
              annotations={annotations}
              onAddAnnotation={handleAddAnnotation}
              onDeleteAnnotation={handleDeleteAnnotation}
              onResolveAnnotation={handleResolveAnnotation}
              readOnly={readOnly}
              currentUserName={currentUserName}
              currentUserAvatar={currentUserAvatar}
            />
          </TabsContent>
        </Tabs>

        {/* Caption Preview */}
        {caption && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h4 className="text-sm font-medium mb-2">Legenda:</h4>
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {caption}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        {!readOnly && status === 'pending' && (
          <div className="flex gap-3 mt-4">
            <Button
              variant="outline"
              className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
              onClick={() => onStatusChange?.('rejected')}
            >
              <AlertCircle className="w-4 h-4 mr-2" />
              Reprovar
            </Button>
            {annotations.length > 0 && unresolvedCount > 0 ? (
              <Button
                variant="outline"
                className="flex-1 border-amber-300 text-amber-600 hover:bg-amber-50"
                onClick={() => onStatusChange?.('revision')}
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Solicitar Revisão
              </Button>
            ) : null}
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700"
              onClick={() => onStatusChange?.('approved')}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Aprovar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

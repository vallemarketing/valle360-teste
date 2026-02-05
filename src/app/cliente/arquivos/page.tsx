'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Upload,
  File,
  Image,
  Video,
  FileText,
  Download,
  Trash2,
  Folder,
  Search,
  Filter,
  Grid,
  List,
} from 'lucide-react';
import { Input } from '@/components/ui/input';

interface FileItem {
  id: number;
  name: string;
  type: 'image' | 'video' | 'document' | 'zip';
  size: string;
  date: string;
  folder?: string;
  uploadedBy?: string;
}

type ViewMode = 'grid' | 'list';
type FilterType = 'all' | 'image' | 'video' | 'document';

export default function ArquivosPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const files: FileItem[] = [
    {
      id: 1,
      name: 'Logo_Atual.png',
      type: 'image',
      size: '245 KB',
      date: '2025-11-10',
      folder: 'Identidade Visual',
      uploadedBy: 'Você',
    },
    {
      id: 2,
      name: 'Briefing_Campanha.pdf',
      type: 'document',
      size: '1.2 MB',
      date: '2025-11-08',
      folder: 'Briefings',
      uploadedBy: 'Gestor Valle',
    },
    {
      id: 3,
      name: 'Video_Produto.mp4',
      type: 'video',
      size: '15.8 MB',
      date: '2025-11-05',
      folder: 'Vídeos',
      uploadedBy: 'Videomaker',
    },
    {
      id: 4,
      name: 'Referências_Design.zip',
      type: 'zip',
      size: '3.5 MB',
      date: '2025-11-01',
      folder: 'Referências',
      uploadedBy: 'Você',
    },
    {
      id: 5,
      name: 'Banner_BlackFriday.jpg',
      type: 'image',
      size: '892 KB',
      date: '2025-11-15',
      folder: 'Campanhas',
      uploadedBy: 'Designer',
    },
    {
      id: 6,
      name: 'Apresentação_Resultados.pdf',
      type: 'document',
      size: '2.1 MB',
      date: '2025-11-12',
      folder: 'Relatórios',
      uploadedBy: 'Analista',
    },
  ];

  const filteredFiles = files.filter((file) => {
    const matchesFilter = filter === 'all' || file.type === filter;
    const matchesSearch =
      file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.folder?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getFileIcon = (type: FileItem['type']) => {
    const icons = {
      image: <Image className="w-6 h-6 text-blue-600" />,
      video: <Video className="w-6 h-6 text-purple-600" />,
      document: <FileText className="w-6 h-6 text-red-600" />,
      zip: <File className="w-6 h-6 text-primary" />,
    };
    return icons[type];
  };

  const getFileColor = (type: FileItem['type']) => {
    const colors = {
      image: 'from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20',
      video: 'from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20',
      document: 'from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/20',
      zip: 'from-amber-50 to-amber-100 dark:from-amber-950/20 dark:to-amber-900/20',
    };
    return colors[type];
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Arquivos</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Compartilhe referências e materiais com a equipe
          </p>
        </div>
        <Button className="bg-primary hover:bg-[#1260b5]">
          <Upload className="w-4 h-4 mr-2" />
          Upload
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Área de Upload</CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Arraste arquivos ou clique para selecionar
          </p>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-12 text-center hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-all cursor-pointer group">
            <Upload className="w-12 h-12 text-gray-400 group-hover:text-primary mx-auto mb-4 transition-colors" />
            <p className="text-gray-900 dark:text-white font-medium mb-1">
              Arraste arquivos aqui ou clique para selecionar
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Suporta: PNG, JPG, PDF, MP4, ZIP (máx. 50MB por arquivo)
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Seus Arquivos</CardTitle>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-amber-100 dark:bg-amber-900/20 text-primary'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list'
                    ? 'bg-amber-100 dark:bg-amber-900/20 text-primary'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-3 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar arquivos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
                className={filter === 'all' ? 'bg-primary hover:bg-[#1260b5]' : ''}
              >
                Todos
              </Button>
              <Button
                variant={filter === 'image' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('image')}
                className={filter === 'image' ? 'bg-primary hover:bg-[#1260b5]' : ''}
              >
                Imagens
              </Button>
              <Button
                variant={filter === 'video' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('video')}
                className={filter === 'video' ? 'bg-primary hover:bg-[#1260b5]' : ''}
              >
                Vídeos
              </Button>
              <Button
                variant={filter === 'document' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('document')}
                className={filter === 'document' ? 'bg-primary hover:bg-[#1260b5]' : ''}
              >
                Documentos
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredFiles.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <File className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg font-medium">Nenhum arquivo encontrado</p>
              <p className="text-sm mt-1">Tente ajustar os filtros ou fazer upload de novos arquivos</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFiles.map((file) => (
                <Card key={file.id} className="hover:shadow-lg transition-all group">
                  <CardContent className="p-4">
                    <div
                      className={`aspect-video bg-gradient-to-br ${getFileColor(
                        file.type
                      )} rounded-lg mb-3 flex items-center justify-center`}
                    >
                      {getFileIcon(file.type)}
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-medium text-gray-900 dark:text-white truncate">
                        {file.name}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                        <Folder className="w-3 h-3" />
                        <span>{file.folder}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                        <span>{file.size}</span>
                        <span>{new Date(file.date).toLocaleDateString('pt-BR')}</span>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" variant="outline" className="flex-1">
                          <Download className="w-3 h-3 mr-1" />
                          Baixar
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-amber-300 dark:hover:border-primary transition-all"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div
                      className={`w-12 h-12 rounded-lg bg-gradient-to-br ${getFileColor(
                        file.type
                      )} flex items-center justify-center flex-shrink-0`}
                    >
                      {getFileIcon(file.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                        {file.name}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mt-1">
                        <div className="flex items-center gap-1">
                          <Folder className="w-3 h-3" />
                          {file.folder}
                        </div>
                        <span>{file.size}</span>
                        <span>{new Date(file.date).toLocaleDateString('pt-BR')}</span>
                        <span>Por {file.uploadedBy}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Download className="w-4 h-4 mr-1" />
                      Baixar
                    </Button>
                    <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                <Image className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {files.filter((f) => f.type === 'image').length}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Imagens</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                <Video className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {files.filter((f) => f.type === 'video').length}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Vídeos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                <FileText className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {files.filter((f) => f.type === 'document').length}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Documentos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

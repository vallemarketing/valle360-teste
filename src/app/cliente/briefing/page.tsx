'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Send, 
  Plus, 
  Trash2, 
  Upload, 
  CheckCircle,
  Calendar,
  Tag,
  MessageSquare,
  Loader2,
  Image,
  Video,
  Megaphone,
  Palette,
  Globe,
  Sparkles
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface BriefingItem {
  id: string;
  type: 'post' | 'campanha' | 'video' | 'arte' | 'site' | 'outro';
  title: string;
  description: string;
  deadline?: string;
  references: string[];
  attachments: File[];
}

const BRIEFING_TYPES = [
  { value: 'post', label: 'Post/Conteúdo', icon: MessageSquare, color: 'text-blue-500' },
  { value: 'campanha', label: 'Campanha', icon: Megaphone, color: 'text-purple-500' },
  { value: 'video', label: 'Vídeo', icon: Video, color: 'text-red-500' },
  { value: 'arte', label: 'Arte/Design', icon: Palette, color: 'text-pink-500' },
  { value: 'site', label: 'Site/Landing Page', icon: Globe, color: 'text-green-500' },
  { value: 'outro', label: 'Outro', icon: Sparkles, color: 'text-primary' },
];

export default function BriefingPage() {
  const [items, setItems] = useState<BriefingItem[]>([]);
  const [currentItem, setCurrentItem] = useState<Partial<BriefingItem>>({
    type: 'post',
    references: [],
    attachments: [],
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [referenceUrl, setReferenceUrl] = useState('');

  const addReference = () => {
    if (referenceUrl.trim()) {
      setCurrentItem(prev => ({
        ...prev,
        references: [...(prev.references || []), referenceUrl.trim()],
      }));
      setReferenceUrl('');
    }
  };

  const removeReference = (index: number) => {
    setCurrentItem(prev => ({
      ...prev,
      references: (prev.references || []).filter((_, i) => i !== index),
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setCurrentItem(prev => ({
      ...prev,
      attachments: [...(prev.attachments || []), ...files],
    }));
  };

  const removeAttachment = (index: number) => {
    setCurrentItem(prev => ({
      ...prev,
      attachments: (prev.attachments || []).filter((_, i) => i !== index),
    }));
  };

  const addItem = () => {
    if (!currentItem.title || !currentItem.description) {
      alert('Preencha título e descrição');
      return;
    }

    setItems(prev => [
      ...prev,
      {
        id: `item-${Date.now()}`,
        type: currentItem.type || 'post',
        title: currentItem.title!,
        description: currentItem.description!,
        deadline: currentItem.deadline,
        references: currentItem.references || [],
        attachments: currentItem.attachments || [],
      },
    ]);

    setCurrentItem({
      type: 'post',
      references: [],
      attachments: [],
    });
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const handleSubmit = async () => {
    if (items.length === 0 && !currentItem.title) {
      alert('Adicione pelo menos um item ao briefing');
      return;
    }

    // Add current item if filled
    const allItems = currentItem.title ? [
      ...items,
      {
        id: `item-${Date.now()}`,
        type: currentItem.type || 'post',
        title: currentItem.title!,
        description: currentItem.description || '',
        deadline: currentItem.deadline,
        references: currentItem.references || [],
        attachments: currentItem.attachments || [],
      },
    ] : items;

    setSubmitting(true);
    
    try {
      const response = await fetch('/api/client/briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: allItems.map(i => ({
          ...i,
          attachments: i.attachments.map(f => f.name), // Only send file names for now
        })) }),
      });

      const json = await response.json();
      
      if (!response.ok) {
        throw new Error(json.error || 'Erro ao enviar briefing');
      }

      setSubmitted(true);
      setItems([]);
      setCurrentItem({
        type: 'post',
        references: [],
        attachments: [],
      });
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="p-4 lg:p-6 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-12"
        >
          <div className="w-20 h-20 rounded-full bg-emerald-500 mx-auto mb-6 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-[#001533] dark:text-white mb-3">
            Briefing Enviado com Sucesso!
          </h2>
          <p className="text-[#001533]/60 dark:text-white/60 mb-6 max-w-md mx-auto">
            Nossa equipe recebeu seu briefing e entrará em contato em breve para discutir os próximos passos.
          </p>
          <Button
            onClick={() => setSubmitted(false)}
            className="bg-[#1672d6] hover:bg-[#1260b5]"
          >
            Enviar Novo Briefing
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#001533] dark:text-white">Enviar Briefing</h1>
        <p className="text-[#001533]/60 dark:text-white/60">
          Solicite novos conteúdos, campanhas ou materiais para sua marca
        </p>
      </div>

      {/* Items já adicionados */}
      {items.length > 0 && (
        <Card className="border-[#001533]/10 dark:border-white/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#1672d6]" />
              Itens do Briefing ({items.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {items.map((item, index) => {
                const typeConfig = BRIEFING_TYPES.find(t => t.value === item.type)!;
                const Icon = typeConfig.icon;
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex items-start gap-3 p-4 rounded-xl bg-[#001533]/5 dark:bg-white/5"
                  >
                    <div className={cn("p-2 rounded-lg bg-white dark:bg-white/10", typeConfig.color)}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-[#001533] dark:text-white truncate">
                          {item.title}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {typeConfig.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-[#001533]/60 dark:text-white/60 line-clamp-2">
                        {item.description}
                      </p>
                      {item.deadline && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-[#001533]/50 dark:text-white/50">
                          <Calendar className="w-3 h-3" />
                          Prazo: {new Date(item.deadline).toLocaleDateString('pt-BR')}
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(item.id)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Formulário de novo item */}
      <Card className="border-[#001533]/10 dark:border-white/10">
        <CardHeader>
          <CardTitle className="text-lg">
            {items.length === 0 ? 'Novo Item' : 'Adicionar Mais um Item'}
          </CardTitle>
          <CardDescription>
            Descreva o que você precisa da forma mais detalhada possível
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Tipo */}
          <div className="space-y-2">
            <Label>Tipo de Material</Label>
            <Select
              value={currentItem.type}
              onValueChange={(value) => setCurrentItem(prev => ({ ...prev, type: value as any }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {BRIEFING_TYPES.map(type => {
                  const Icon = type.icon;
                  return (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <Icon className={cn("w-4 h-4", type.color)} />
                        {type.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Título */}
          <div className="space-y-2">
            <Label>Título *</Label>
            <Input
              placeholder="Ex: Post de lançamento do produto X"
              value={currentItem.title || ''}
              onChange={(e) => setCurrentItem(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label>Descrição Detalhada *</Label>
            <Textarea
              placeholder="Descreva o objetivo, público-alvo, tom de voz desejado, elementos obrigatórios, etc."
              rows={5}
              value={currentItem.description || ''}
              onChange={(e) => setCurrentItem(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          {/* Prazo */}
          <div className="space-y-2">
            <Label>Prazo Desejado</Label>
            <Input
              type="date"
              value={currentItem.deadline || ''}
              onChange={(e) => setCurrentItem(prev => ({ ...prev, deadline: e.target.value }))}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Referências */}
          <div className="space-y-2">
            <Label>Referências (URLs)</Label>
            <div className="flex gap-2">
              <Input
                placeholder="https://exemplo.com/referencia"
                value={referenceUrl}
                onChange={(e) => setReferenceUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addReference())}
              />
              <Button type="button" variant="outline" onClick={addReference}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {(currentItem.references || []).length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {currentItem.references!.map((ref, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="pr-1 cursor-pointer hover:bg-red-500/10"
                    onClick={() => removeReference(index)}
                  >
                    {ref.length > 30 ? ref.substring(0, 30) + '...' : ref}
                    <Trash2 className="w-3 h-3 ml-1" />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Anexos */}
          <div className="space-y-2">
            <Label>Anexos</Label>
            <div className="border-2 border-dashed border-[#001533]/20 dark:border-white/20 rounded-xl p-6 text-center hover:border-[#1672d6]/50 transition-colors">
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
                accept="image/*,video/*,.pdf,.doc,.docx"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="w-8 h-8 mx-auto mb-2 text-[#001533]/40 dark:text-white/40" />
                <p className="text-sm text-[#001533]/60 dark:text-white/60">
                  Clique ou arraste arquivos aqui
                </p>
                <p className="text-xs text-[#001533]/40 dark:text-white/40 mt-1">
                  Imagens, vídeos, PDFs, documentos
                </p>
              </label>
            </div>
            {(currentItem.attachments || []).length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {currentItem.attachments!.map((file, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="pr-1 cursor-pointer hover:bg-red-500/10"
                    onClick={() => removeAttachment(index)}
                  >
                    {file.name}
                    <Trash2 className="w-3 h-3 ml-1" />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={addItem}
              disabled={!currentItem.title || !currentItem.description}
              className="flex-1"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar e Continuar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || (items.length === 0 && !currentItem.title)}
              className="flex-1 bg-[#1672d6] hover:bg-[#1260b5]"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Enviar Briefing
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

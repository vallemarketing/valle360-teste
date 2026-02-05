'use client';

import { useState, useRef, useEffect, MouseEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, X, Plus, Check, Trash2, 
  Edit2, Loader2, ChevronLeft, ChevronRight 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Annotation {
  id: string;
  x: number; // Porcentagem 0-100
  y: number; // Porcentagem 0-100
  text: string;
  author?: string;
  authorAvatar?: string;
  createdAt: string;
  resolved?: boolean;
  color?: 'red' | 'yellow' | 'blue' | 'green';
}

interface VisualAnnotationProps {
  imageUrl: string;
  annotations?: Annotation[];
  onAddAnnotation?: (annotation: Omit<Annotation, 'id' | 'createdAt'>) => void;
  onDeleteAnnotation?: (id: string) => void;
  onResolveAnnotation?: (id: string) => void;
  readOnly?: boolean;
  currentUserId?: string;
  currentUserName?: string;
  currentUserAvatar?: string;
}

export function VisualAnnotation({
  imageUrl,
  annotations = [],
  onAddAnnotation,
  onDeleteAnnotation,
  onResolveAnnotation,
  readOnly = false,
  currentUserName = 'Usuário',
  currentUserAvatar
}: VisualAnnotationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isAddingMode, setIsAddingMode] = useState(false);
  const [newAnnotationPos, setNewAnnotationPos] = useState<{ x: number; y: number } | null>(null);
  const [newAnnotationText, setNewAnnotationText] = useState('');
  const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<'red' | 'yellow' | 'blue' | 'green'>('red');
  const [showResolved, setShowResolved] = useState(true);

  const handleImageClick = (e: MouseEvent<HTMLDivElement>) => {
    if (!isAddingMode || readOnly) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setNewAnnotationPos({ x, y });
  };

  const handleSubmitAnnotation = () => {
    if (!newAnnotationPos || !newAnnotationText.trim()) return;

    onAddAnnotation?.({
      x: newAnnotationPos.x,
      y: newAnnotationPos.y,
      text: newAnnotationText.trim(),
      author: currentUserName,
      authorAvatar: currentUserAvatar,
      color: selectedColor
    });

    setNewAnnotationPos(null);
    setNewAnnotationText('');
    setIsAddingMode(false);
  };

  const handleCancelNew = () => {
    setNewAnnotationPos(null);
    setNewAnnotationText('');
    setIsAddingMode(false);
  };

  const filteredAnnotations = showResolved 
    ? annotations 
    : annotations.filter(a => !a.resolved);

  const colorClasses = {
    red: 'bg-red-500 ring-red-500',
    yellow: 'bg-yellow-500 ring-yellow-500',
    blue: 'bg-blue-500 ring-blue-500',
    green: 'bg-green-500 ring-green-500'
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          {!readOnly && (
            <Button
              variant={isAddingMode ? 'default' : 'outline'}
              onClick={() => setIsAddingMode(!isAddingMode)}
              className={isAddingMode ? 'bg-primary' : ''}
            >
              {isAddingMode ? (
                <>
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Marcação
                </>
              )}
            </Button>
          )}

          {isAddingMode && (
            <div className="flex items-center gap-1">
              {(['red', 'yellow', 'blue', 'green'] as const).map(color => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`w-6 h-6 rounded-full ${colorClasses[color]} ${
                    selectedColor === color ? 'ring-2 ring-offset-2' : ''
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {filteredAnnotations.length} marcações
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowResolved(!showResolved)}
          >
            {showResolved ? 'Ocultar resolvidas' : 'Mostrar resolvidas'}
          </Button>
        </div>
      </div>

      {/* Image Container with Annotations */}
      <div 
        ref={containerRef}
        className={`relative rounded-lg overflow-hidden ${isAddingMode ? 'cursor-crosshair' : ''}`}
        onClick={handleImageClick}
      >
        <img 
          src={imageUrl} 
          alt="Post para anotação" 
          className="w-full h-auto"
          draggable={false}
        />

        {/* Overlay when adding */}
        {isAddingMode && (
          <div className="absolute inset-0 bg-black/10 pointer-events-none" />
        )}

        {/* Existing Annotations */}
        {filteredAnnotations.map((annotation, index) => (
          <motion.div
            key={annotation.id}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute"
            style={{ 
              left: `${annotation.x}%`, 
              top: `${annotation.y}%`,
              transform: 'translate(-50%, -50%)'
            }}
          >
            {/* Pin */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedAnnotation(
                  selectedAnnotation === annotation.id ? null : annotation.id
                );
              }}
              className={`w-8 h-8 rounded-full ${colorClasses[annotation.color || 'red']} 
                flex items-center justify-center text-white font-bold text-sm
                shadow-lg hover:scale-110 transition-transform
                ${annotation.resolved ? 'opacity-50' : ''}`}
            >
              {index + 1}
            </button>

            {/* Annotation Popup */}
            <AnimatePresence>
              {selectedAnnotation === annotation.id && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-10 left-1/2 -translate-x-1/2 z-50 w-64"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 border dark:border-gray-700">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {annotation.authorAvatar ? (
                          <img 
                            src={annotation.authorAvatar} 
                            alt="" 
                            className="w-6 h-6 rounded-full"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-light to-primary flex items-center justify-center text-white text-xs font-bold">
                            {annotation.author?.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="text-sm font-medium">{annotation.author}</span>
                      </div>
                      {annotation.resolved && (
                        <Badge className="bg-green-100 text-green-800 text-xs">
                          Resolvido
                        </Badge>
                      )}
                    </div>

                    {/* Content */}
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                      {annotation.text}
                    </p>

                    {/* Actions */}
                    {!readOnly && (
                      <div className="flex items-center justify-between">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDeleteAnnotation?.(annotation.id)}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        {!annotation.resolved && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onResolveAnnotation?.(annotation.id)}
                            className="text-green-600"
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Resolver
                          </Button>
                        )}
                      </div>
                    )}

                    {/* Timestamp */}
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(annotation.createdAt).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}

        {/* New Annotation Marker */}
        <AnimatePresence>
          {newAnnotationPos && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute z-50"
              style={{ 
                left: `${newAnnotationPos.x}%`, 
                top: `${newAnnotationPos.y}%`,
                transform: 'translate(-50%, -50%)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Pin */}
              <div className={`w-8 h-8 rounded-full ${colorClasses[selectedColor]} 
                flex items-center justify-center text-white shadow-lg animate-pulse`}>
                <Plus className="w-5 h-5" />
              </div>

              {/* Input Popup */}
              <div className="absolute top-10 left-1/2 -translate-x-1/2 w-64">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 border dark:border-gray-700">
                  <textarea
                    value={newAnnotationText}
                    onChange={(e) => setNewAnnotationText(e.target.value)}
                    placeholder="Descreva o que precisa ser ajustado..."
                    className="w-full p-2 text-sm border rounded-lg resize-none focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:border-gray-600"
                    rows={3}
                    autoFocus
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCancelNew}
                    >
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSubmitAnnotation}
                      disabled={!newAnnotationText.trim()}
                      className="bg-primary"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Salvar
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Annotations List (sidebar style) */}
      {annotations.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            Lista de Marcações
          </h4>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {filteredAnnotations.map((annotation, index) => (
              <button
                key={annotation.id}
                onClick={() => setSelectedAnnotation(annotation.id)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  selectedAnnotation === annotation.id 
                    ? 'border-primary bg-primary/5' 
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                } ${annotation.resolved ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-full ${colorClasses[annotation.color || 'red']} 
                    flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{annotation.author}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {annotation.text}
                    </p>
                  </div>
                  {annotation.resolved && (
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Help text */}
      {isAddingMode && (
        <p className="text-sm text-gray-500 text-center">
          Clique na imagem para adicionar uma marcação
        </p>
      )}
    </div>
  );
}

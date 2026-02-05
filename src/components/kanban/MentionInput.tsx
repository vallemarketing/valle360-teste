'use client';

/**
 * Valle 360 - Mention Input Component
 * Sistema de menções @ para Kanban
 * Cria cards automáticos quando menciona colaboradores
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AtSign, Send, X, User, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// =====================================================
// TIPOS
// =====================================================

interface Colaborador {
  id: string;
  nome: string;
  avatar: string;
  cargo: string;
  departamento: string;
  online?: boolean;
}

interface MentionInputProps {
  placeholder?: string;
  onSubmit: (text: string, mentions: string[]) => void;
  onMentionCard?: (colaboradorId: string, message: string) => void;
  className?: string;
}

// =====================================================
// MOCK COLABORADORES
// =====================================================

const COLABORADORES: Colaborador[] = [
  { id: 'web', nome: 'João Silva', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=joao', cargo: 'Web Designer', departamento: 'Design', online: true },
  { id: 'social', nome: 'Maria Santos', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=maria', cargo: 'Social Media', departamento: 'Marketing', online: true },
  { id: 'trafego', nome: 'Pedro Costa', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=pedro', cargo: 'Gestor de Tráfego', departamento: 'Performance', online: false },
  { id: 'design', nome: 'Ana Oliveira', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ana', cargo: 'Designer Gráfico', departamento: 'Design', online: true },
  { id: 'video', nome: 'Lucas Mendes', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lucas', cargo: 'Video Maker', departamento: 'Criação', online: false },
  { id: 'dev', nome: 'Carlos Dev', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=carlos', cargo: 'Desenvolvedor', departamento: 'Tech', online: true },
];

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export function MentionInput({ 
  placeholder = "Digite sua mensagem... Use @ para mencionar", 
  onSubmit,
  onMentionCard,
  className 
}: MentionInputProps) {
  const [text, setText] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentions, setMentions] = useState<string[]>([]);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [isCreatingCard, setIsCreatingCard] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Filtrar colaboradores baseado na query
  const filteredColaboradores = COLABORADORES.filter(col => 
    col.nome.toLowerCase().includes(mentionQuery.toLowerCase()) ||
    col.cargo.toLowerCase().includes(mentionQuery.toLowerCase()) ||
    col.departamento.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  // Detectar @ no texto
  useEffect(() => {
    const lastAtIndex = text.lastIndexOf('@');
    if (lastAtIndex !== -1 && lastAtIndex < cursorPosition) {
      const queryAfterAt = text.substring(lastAtIndex + 1, cursorPosition);
      if (!queryAfterAt.includes(' ')) {
        setMentionQuery(queryAfterAt);
        setShowMentions(true);
        return;
      }
    }
    setShowMentions(false);
    setMentionQuery('');
  }, [text, cursorPosition]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    setCursorPosition(e.target.selectionStart || 0);
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    setCursorPosition(e.currentTarget.selectionStart || 0);
  };

  const handleSelectMention = async (colaborador: Colaborador) => {
    const lastAtIndex = text.lastIndexOf('@');
    const newText = text.substring(0, lastAtIndex) + `@${colaborador.nome} `;
    setText(newText);
    setMentions([...mentions, colaborador.id]);
    setShowMentions(false);
    inputRef.current?.focus();

    // Criar card automático para o colaborador mencionado
    if (onMentionCard) {
      setIsCreatingCard(true);
      
      // Simular criação do card
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast.success(
        <div className="flex items-center gap-2">
          <img src={colaborador.avatar} alt="" className="w-8 h-8 rounded-full" />
          <div>
            <p className="font-medium">Card criado para {colaborador.nome}</p>
            <p className="text-xs text-gray-500">Notificação enviada</p>
          </div>
        </div>,
        { duration: 3000 }
      );
      
      onMentionCard(colaborador.id, text);
      setIsCreatingCard(false);
    }
  };

  const handleSubmit = () => {
    if (!text.trim()) return;
    onSubmit(text, mentions);
    setText('');
    setMentions([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !showMentions) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      setShowMentions(false);
    }
  };

  return (
    <div className={cn("relative", className)}>
      {/* Input Area */}
      <div className="flex items-end gap-2 bg-white rounded-xl border border-gray-200 p-3 shadow-sm">
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={text}
            onChange={handleTextChange}
            onKeyUp={handleKeyUp}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={2}
            className="w-full resize-none focus:outline-none text-sm"
          />
          
          {/* Mentions Dropdown */}
          <AnimatePresence>
            {showMentions && filteredColaboradores.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-full left-0 mb-2 w-72 bg-white rounded-xl border shadow-lg max-h-60 overflow-auto z-50"
              >
                <div className="p-2 border-b bg-gray-50">
                  <p className="text-xs font-medium text-gray-500 flex items-center gap-1">
                    <AtSign className="w-3 h-3" />
                    Mencionar colaborador
                  </p>
                </div>
                {filteredColaboradores.map(colaborador => (
                  <button
                    key={colaborador.id}
                    onClick={() => handleSelectMention(colaborador)}
                    className="w-full p-3 flex items-center gap-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="relative">
                      <img 
                        src={colaborador.avatar} 
                        alt={colaborador.nome} 
                        className="w-10 h-10 rounded-full"
                      />
                      {colaborador.online && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-gray-900 text-sm">{colaborador.nome}</p>
                      <p className="text-xs text-gray-500">{colaborador.cargo} • {colaborador.departamento}</p>
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {isCreatingCard && (
            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
          )}
          <button
            onClick={() => setShowMentions(!showMentions)}
            className={cn(
              "p-2 rounded-lg transition-colors",
              showMentions ? "bg-blue-100 text-blue-600" : "hover:bg-gray-100 text-gray-500"
            )}
            title="Mencionar colaborador"
          >
            <AtSign className="w-5 h-5" />
          </button>
          <button
            onClick={handleSubmit}
            disabled={!text.trim()}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mentioned Tags */}
      {mentions.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {mentions.map(mentionId => {
            const col = COLABORADORES.find(c => c.id === mentionId);
            if (!col) return null;
            return (
              <span
                key={mentionId}
                className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs"
              >
                <img src={col.avatar} alt="" className="w-4 h-4 rounded-full" />
                {col.nome}
                <button
                  onClick={() => setMentions(mentions.filter(m => m !== mentionId))}
                  className="hover:bg-blue-200 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* Hint */}
      <p className="text-xs text-gray-400 mt-2">
        💡 Mencione colaboradores com @ para criar cards automáticos no Kanban deles
      </p>
    </div>
  );
}

// =====================================================
// HOOK PARA CRIAR CARDS AUTOMÁTICOS
// =====================================================

export function useAutoCardCreation() {
  const createCardForMention = async (
    colaboradorId: string,
    message: string,
    sourceCardId?: string,
    sourceUser?: string
  ) => {
    // Em produção, isso criaria o card no banco de dados
    console.log('Criando card automático:', {
      colaboradorId,
      message,
      sourceCardId,
      sourceUser,
      createdAt: new Date().toISOString()
    });

    // Enviar notificação
    // await sendNotification(colaboradorId, { type: 'mention', message, sourceUser });

    return {
      success: true,
      cardId: `card_${Date.now()}`,
      message: 'Card criado com sucesso'
    };
  };

  return { createCardForMention };
}

export default MentionInput;


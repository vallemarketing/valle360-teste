'use client';

/**
 * Valle 360 - Mention Input for Chat
 * Sistema de menções @ para mensagens de chat
 */

import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AtSign, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// =====================================================
// TIPOS
// =====================================================

export interface MentionableUser {
  id: string;
  userId: string;
  name: string;
  email?: string;
  avatarUrl?: string;
  role?: string;
  userType?: string;
  online?: boolean;
}

export interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  onMention?: (user: MentionableUser) => void;
  users: MentionableUser[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onSubmit?: () => void;
}

export interface MentionInputRef {
  focus: () => void;
  blur: () => void;
}

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export const MentionInput = forwardRef<MentionInputRef, MentionInputProps>(({
  value,
  onChange,
  onMention,
  users,
  placeholder = "Digite sua mensagem... Use @ para mencionar",
  disabled = false,
  className,
  onKeyDown,
  onSubmit
}, ref) => {
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mentionListRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    focus: () => textareaRef.current?.focus(),
    blur: () => textareaRef.current?.blur(),
  }));

  // Filtrar usuários baseado na query
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(mentionQuery.toLowerCase()) ||
    (user.email?.toLowerCase().includes(mentionQuery.toLowerCase())) ||
    (user.role?.toLowerCase().includes(mentionQuery.toLowerCase()))
  ).slice(0, 8);

  // Detectar @ no texto
  useEffect(() => {
    const textBeforeCursor = value.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      // Verificar se não há espaço após o @
      if (!textAfterAt.includes(' ') && textAfterAt.length <= 30) {
        setMentionQuery(textAfterAt);
        setShowMentions(true);
        setSelectedIndex(0);
        return;
      }
    }
    setShowMentions(false);
    setMentionQuery('');
  }, [value, cursorPosition]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    setCursorPosition(e.target.selectionStart || 0);
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    setCursorPosition(e.currentTarget.selectionStart || 0);
  };

  const handleSelectMention = (user: MentionableUser) => {
    const textBeforeCursor = value.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    const textAfterCursor = value.substring(cursorPosition);
    
    const newText = value.substring(0, lastAtIndex) + `@${user.name} ` + textAfterCursor;
    onChange(newText);
    setShowMentions(false);
    setMentionQuery('');
    
    onMention?.(user);
    
    // Focar no input e posicionar cursor após a menção
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = lastAtIndex + user.name.length + 2;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        setCursorPosition(newCursorPos);
      }
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showMentions && filteredUsers.length > 0) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => (prev + 1) % filteredUsers.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => (prev - 1 + filteredUsers.length) % filteredUsers.length);
          break;
        case 'Enter':
          if (!e.shiftKey) {
            e.preventDefault();
            handleSelectMention(filteredUsers[selectedIndex]);
            return;
          }
          break;
        case 'Escape':
          e.preventDefault();
          setShowMentions(false);
          break;
        case 'Tab':
          e.preventDefault();
          handleSelectMention(filteredUsers[selectedIndex]);
          return;
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit?.();
      return;
    }
    
    onKeyDown?.(e);
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [value]);

  return (
    <div className={cn("relative", className)}>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleTextChange}
        onKeyUp={handleKeyUp}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        className={cn(
          "w-full resize-none bg-transparent focus:outline-none",
          "text-gray-900 dark:text-white placeholder:text-gray-400",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      />

      {/* Dropdown de menções */}
      <AnimatePresence>
        {showMentions && filteredUsers.length > 0 && (
          <motion.div
            ref={mentionListRef}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-full left-0 mb-2 w-72 max-h-64 overflow-y-auto bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50"
          >
            <div className="p-2 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <AtSign className="w-3 h-3" />
                <span>Mencionar usuário</span>
              </div>
            </div>

            <div className="py-1">
              {filteredUsers.map((user, index) => (
                <button
                  key={user.id}
                  onClick={() => handleSelectMention(user)}
                  className={cn(
                    "w-full px-3 py-2 flex items-center gap-3 transition-colors text-left",
                    index === selectedIndex
                      ? "bg-primary/10 dark:bg-primary/20"
                      : "hover:bg-gray-50 dark:hover:bg-gray-700"
                  )}
                >
                  <div className="relative">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatarUrl} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {user.name?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    {user.online && (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                      {user.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {user.role || user.email || user.userType}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            <div className="p-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <p className="text-xs text-gray-400 text-center">
                ↑↓ para navegar • Enter para selecionar • Esc para fechar
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

MentionInput.displayName = 'MentionInput';

// =====================================================
// HELPER: Renderizar texto com menções destacadas
// =====================================================

export function renderMessageWithMentions(
  text: string,
  mentionClass: string = "bg-primary/10 text-primary font-medium px-1 rounded"
): React.ReactNode {
  // Regex para encontrar @NomeCompleto
  const mentionRegex = /@([A-Za-zÀ-ÿ\s]+?)(?=\s|$|[.,!?])/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = mentionRegex.exec(text)) !== null) {
    // Adicionar texto antes da menção
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    
    // Adicionar menção estilizada
    parts.push(
      <span key={match.index} className={mentionClass}>
        @{match[1]}
      </span>
    );
    
    lastIndex = match.index + match[0].length;
  }

  // Adicionar texto restante
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

export default MentionInput;

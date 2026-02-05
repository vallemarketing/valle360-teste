'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Inbox, Search, FileText, Users, Calendar,
  MessageSquare, Bell, Target, Briefcase, Image,
  FolderOpen, Sparkles, Plus
} from 'lucide-react';

type EmptyStateType = 
  | 'default' 
  | 'search' 
  | 'documents' 
  | 'users' 
  | 'calendar' 
  | 'messages' 
  | 'notifications'
  | 'tasks'
  | 'projects'
  | 'images'
  | 'folder';

interface EmptyStateProps {
  type?: EmptyStateType;
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

const TYPE_CONFIG: Record<EmptyStateType, { icon: React.ReactNode; title: string; description: string }> = {
  default: {
    icon: <Inbox className="w-12 h-12" />,
    title: 'Nada por aqui',
    description: 'Não há itens para exibir no momento.'
  },
  search: {
    icon: <Search className="w-12 h-12" />,
    title: 'Nenhum resultado',
    description: 'Não encontramos nada com esses termos. Tente buscar de outra forma.'
  },
  documents: {
    icon: <FileText className="w-12 h-12" />,
    title: 'Sem documentos',
    description: 'Você ainda não tem documentos. Comece criando um novo.'
  },
  users: {
    icon: <Users className="w-12 h-12" />,
    title: 'Nenhum usuário',
    description: 'Não há usuários cadastrados ainda.'
  },
  calendar: {
    icon: <Calendar className="w-12 h-12" />,
    title: 'Agenda vazia',
    description: 'Você não tem eventos agendados para este período.'
  },
  messages: {
    icon: <MessageSquare className="w-12 h-12" />,
    title: 'Sem mensagens',
    description: 'Sua caixa de entrada está vazia. Que tal iniciar uma conversa?'
  },
  notifications: {
    icon: <Bell className="w-12 h-12" />,
    title: 'Tudo em dia!',
    description: 'Você não tem notificações pendentes.'
  },
  tasks: {
    icon: <Target className="w-12 h-12" />,
    title: 'Sem tarefas',
    description: 'Você não tem tarefas pendentes. Aproveite para descansar! 🎉'
  },
  projects: {
    icon: <Briefcase className="w-12 h-12" />,
    title: 'Sem projetos',
    description: 'Você ainda não tem projetos. Crie um para começar.'
  },
  images: {
    icon: <Image className="w-12 h-12" />,
    title: 'Sem imagens',
    description: 'Nenhuma imagem foi adicionada ainda.'
  },
  folder: {
    icon: <FolderOpen className="w-12 h-12" />,
    title: 'Pasta vazia',
    description: 'Esta pasta não contém arquivos.'
  }
};

const SIZE_CONFIG = {
  sm: {
    container: 'py-8',
    icon: 'w-10 h-10',
    title: 'text-base',
    description: 'text-sm'
  },
  md: {
    container: 'py-12',
    icon: 'w-12 h-12',
    title: 'text-lg',
    description: 'text-sm'
  },
  lg: {
    container: 'py-16',
    icon: 'w-16 h-16',
    title: 'text-xl',
    description: 'text-base'
  }
};

export function EmptyState({
  type = 'default',
  title,
  description,
  icon,
  action,
  secondaryAction,
  size = 'md',
  animated = true
}: EmptyStateProps) {
  const config = TYPE_CONFIG[type];
  const sizeConfig = SIZE_CONFIG[size];

  const Wrapper = animated ? motion.div : 'div';
  const wrapperProps = animated ? {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4 }
  } : {};

  return (
    <Wrapper
      {...wrapperProps}
      className={`flex flex-col items-center justify-center text-center ${sizeConfig.container}`}
    >
      {/* Icon */}
      <motion.div
        initial={animated ? { scale: 0.8, opacity: 0 } : undefined}
        animate={animated ? { scale: 1, opacity: 1 } : undefined}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
        className="mb-4"
      >
        <div 
          className={`${sizeConfig.icon} mx-auto opacity-30`}
          style={{ color: 'var(--text-tertiary)' }}
        >
          {icon || config.icon}
        </div>
      </motion.div>

      {/* Title */}
      <motion.h3
        initial={animated ? { opacity: 0, y: 10 } : undefined}
        animate={animated ? { opacity: 1, y: 0 } : undefined}
        transition={{ delay: 0.2 }}
        className={`font-semibold mb-2 ${sizeConfig.title}`}
        style={{ color: 'var(--text-primary)' }}
      >
        {title || config.title}
      </motion.h3>

      {/* Description */}
      <motion.p
        initial={animated ? { opacity: 0, y: 10 } : undefined}
        animate={animated ? { opacity: 1, y: 0 } : undefined}
        transition={{ delay: 0.3 }}
        className={`max-w-sm mx-auto mb-6 ${sizeConfig.description}`}
        style={{ color: 'var(--text-secondary)' }}
      >
        {description || config.description}
      </motion.p>

      {/* Actions */}
      {(action || secondaryAction) && (
        <motion.div
          initial={animated ? { opacity: 0, y: 10 } : undefined}
          animate={animated ? { opacity: 1, y: 0 } : undefined}
          transition={{ delay: 0.4 }}
          className="flex items-center gap-3"
        >
          {action && (
            <button
              onClick={action.onClick}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-white transition-colors"
              style={{ backgroundColor: 'var(--primary-500)' }}
            >
              {action.icon || <Plus className="w-4 h-4" />}
              {action.label}
            </button>
          )}
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="px-4 py-2 rounded-xl font-medium transition-colors"
              style={{ 
                backgroundColor: 'var(--bg-secondary)', 
                color: 'var(--text-secondary)' 
              }}
            >
              {secondaryAction.label}
            </button>
          )}
        </motion.div>
      )}
    </Wrapper>
  );
}

// Empty State com ilustração animada
export function EmptyStateAnimated({
  title = 'Nada por aqui ainda',
  description = 'Comece adicionando seu primeiro item.',
  action
}: {
  title?: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {/* Animated illustration */}
      <div className="relative w-32 h-32 mb-6">
        {/* Background circles */}
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute inset-0 rounded-full"
          style={{ backgroundColor: 'var(--primary-500)' }}
        />
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.05, 0.15, 0.05]
          }}
          transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
          className="absolute inset-0 rounded-full"
          style={{ backgroundColor: 'var(--primary-500)' }}
        />
        
        {/* Center icon */}
        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div 
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: 'var(--bg-secondary)' }}
          >
            <Sparkles className="w-8 h-8" style={{ color: 'var(--primary-500)' }} />
          </div>
        </motion.div>
        
        {/* Floating dots */}
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            animate={{
              y: [0, -10, 0],
              opacity: [0.3, 1, 0.3]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.3
            }}
            className="absolute w-2 h-2 rounded-full"
            style={{
              backgroundColor: 'var(--primary-500)',
              left: `${20 + i * 30}%`,
              top: `${10 + i * 10}%`
            }}
          />
        ))}
      </div>

      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-lg font-semibold mb-2"
        style={{ color: 'var(--text-primary)' }}
      >
        {title}
      </motion.h3>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-sm max-w-xs mb-6"
        style={{ color: 'var(--text-secondary)' }}
      >
        {description}
      </motion.p>

      {action && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={action.onClick}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-white"
          style={{ backgroundColor: 'var(--primary-500)' }}
        >
          <Plus className="w-4 h-4" />
          {action.label}
        </motion.button>
      )}
    </div>
  );
}

export default EmptyState;










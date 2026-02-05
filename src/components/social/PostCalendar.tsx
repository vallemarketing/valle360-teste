'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Plus, Instagram,
  Facebook, Linkedin, Twitter, Eye, Edit3, Trash2,
  Image, Video, FileText
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ScheduledPost {
  id: string;
  title: string;
  content: string;
  type: 'image' | 'video' | 'carousel' | 'story' | 'reel';
  platforms: ('instagram' | 'facebook' | 'linkedin' | 'twitter')[];
  scheduledAt: Date | string;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  clientId: string;
  clientName: string;
  thumbnail?: string;
  createdBy: string;
}

interface PostCalendarProps {
  posts?: ScheduledPost[];
  onAddPost?: (date: Date) => void;
  onEditPost?: (post: ScheduledPost) => void;
  onDeletePost?: (postId: string) => void;
  onViewPost?: (post: ScheduledPost) => void;
}

const PLATFORM_ICONS: Record<string, React.ReactNode> = {
  instagram: <Instagram className="w-4 h-4" />,
  facebook: <Facebook className="w-4 h-4" />,
  linkedin: <Linkedin className="w-4 h-4" />,
  twitter: <Twitter className="w-4 h-4" />
};

const PLATFORM_COLORS: Record<string, string> = {
  instagram: '#E4405F',
  facebook: '#1877F2',
  linkedin: '#0A66C2',
  twitter: '#1DA1F2'
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  image: <Image className="w-3 h-3" />,
  video: <Video className="w-3 h-3" />,
  carousel: <FileText className="w-3 h-3" />,
  story: <Image className="w-3 h-3" />,
  reel: <Video className="w-3 h-3" />
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  draft: { bg: 'var(--neutral-200)', text: 'var(--neutral-700)' },
  scheduled: { bg: 'var(--primary-100)', text: 'var(--primary-700)' },
  published: { bg: 'var(--success-100)', text: 'var(--success-700)' },
  failed: { bg: 'var(--error-100)', text: 'var(--error-700)' }
};

export function PostCalendar({
  posts = [],
  onAddPost,
  onEditPost,
  onDeletePost,
  onViewPost
}: PostCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Preencher dias do mês anterior e próximo para completar a grade
  const startDay = monthStart.getDay();
  const endDay = 6 - monthEnd.getDay();
  
  const previousMonthDays = Array.from({ length: startDay }, (_, i) => {
    const date = new Date(monthStart);
    date.setDate(date.getDate() - (startDay - i));
    return date;
  });

  const nextMonthDays = Array.from({ length: endDay }, (_, i) => {
    const date = new Date(monthEnd);
    date.setDate(date.getDate() + i + 1);
    return date;
  });

  const allDays = [...previousMonthDays, ...days, ...nextMonthDays];

  const getPostsForDate = (date: Date) => {
    return posts.filter(post => isSameDay(new Date(post.scheduledAt), date));
  };

  const handlePreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={handlePreviousMonth}
            className="p-2 rounded-lg transition-colors"
            style={{ backgroundColor: 'var(--bg-secondary)' }}
          >
            <ChevronLeft className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
          </button>
          
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
          </h2>

          <button
            onClick={handleNextMonth}
            className="p-2 rounded-lg transition-colors"
            style={{ backgroundColor: 'var(--bg-secondary)' }}
          >
            <ChevronRight className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ 
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-secondary)'
            }}
          >
            Hoje
          </button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onAddPost?.(new Date())}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
            style={{ backgroundColor: 'var(--primary-500)' }}
          >
            <Plus className="w-4 h-4" />
            Novo Post
          </motion.button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div 
        className="rounded-xl border overflow-hidden"
        style={{ 
          backgroundColor: 'var(--bg-primary)',
          borderColor: 'var(--border-light)'
        }}
      >
        {/* Week Days Header */}
        <div className="grid grid-cols-7 border-b" style={{ borderColor: 'var(--border-light)' }}>
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
            <div 
              key={day}
              className="p-3 text-center text-sm font-medium"
              style={{ 
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-secondary)'
              }}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7">
          {allDays.map((day, index) => {
            const dayPosts = getPostsForDate(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isToday = isSameDay(day, new Date());
            const isSelected = selectedDate && isSameDay(day, selectedDate);

            return (
              <div
                key={index}
                onClick={() => handleDateClick(day)}
                className={`min-h-[100px] p-2 border-b border-r cursor-pointer transition-colors ${
                  !isCurrentMonth ? 'opacity-40' : ''
                }`}
                style={{ 
                  borderColor: 'var(--border-light)',
                  backgroundColor: isSelected ? 'var(--primary-50)' : isToday ? 'var(--warning-50)' : 'transparent'
                }}
              >
                {/* Day Number */}
                <div className="flex items-center justify-between mb-1">
                  <span 
                    className={`text-sm font-medium ${isToday ? 'w-6 h-6 rounded-full flex items-center justify-center' : ''}`}
                    style={{ 
                      color: isToday ? 'white' : 'var(--text-primary)',
                      backgroundColor: isToday ? 'var(--primary-500)' : 'transparent'
                    }}
                  >
                    {format(day, 'd')}
                  </span>
                  {dayPosts.length > 0 && (
                    <span 
                      className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                      style={{ 
                        backgroundColor: 'var(--primary-100)',
                        color: 'var(--primary-700)'
                      }}
                    >
                      {dayPosts.length}
                    </span>
                  )}
                </div>

                {/* Posts Preview */}
                <div className="space-y-1">
                  {dayPosts.slice(0, 3).map((post) => (
                    <motion.div
                      key={post.id}
                      whileHover={{ scale: 1.02 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewPost?.(post);
                      }}
                      className="p-1.5 rounded text-xs cursor-pointer truncate"
                      style={{ 
                        backgroundColor: STATUS_COLORS[post.status].bg,
                        color: STATUS_COLORS[post.status].text
                      }}
                    >
                      <div className="flex items-center gap-1">
                        {post.platforms.slice(0, 2).map((platform) => (
                          <span key={platform} style={{ color: PLATFORM_COLORS[platform] }}>
                            {PLATFORM_ICONS[platform]}
                          </span>
                        ))}
                        <span className="truncate">{post.title}</span>
                      </div>
                    </motion.div>
                  ))}
                  {dayPosts.length > 3 && (
                    <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      +{dayPosts.length - 3} mais
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Date Posts */}
      <AnimatePresence>
        {selectedDate && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="rounded-xl border p-4"
            style={{ 
              backgroundColor: 'var(--bg-primary)',
              borderColor: 'var(--border-light)'
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                {format(selectedDate, "d 'de' MMMM", { locale: ptBR })}
              </h3>
              <button
                onClick={() => onAddPost?.(selectedDate)}
                className="flex items-center gap-1 text-sm font-medium"
                style={{ color: 'var(--primary-500)' }}
              >
                <Plus className="w-4 h-4" />
                Adicionar
              </button>
            </div>

            {getPostsForDate(selectedDate).length === 0 ? (
              <p className="text-sm text-center py-4" style={{ color: 'var(--text-tertiary)' }}>
                Nenhum post agendado para este dia
              </p>
            ) : (
              <div className="space-y-3">
                {getPostsForDate(selectedDate).map((post) => (
                  <div 
                    key={post.id}
                    className="flex items-start gap-3 p-3 rounded-lg"
                    style={{ backgroundColor: 'var(--bg-secondary)' }}
                  >
                    {/* Thumbnail */}
                    {post.thumbnail && (
                      <img 
                        src={post.thumbnail}
                        alt=""
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span 
                          className="px-2 py-0.5 rounded text-xs font-medium"
                          style={{ 
                            backgroundColor: STATUS_COLORS[post.status].bg,
                            color: STATUS_COLORS[post.status].text
                          }}
                        >
                          {post.status === 'draft' ? 'Rascunho' : 
                           post.status === 'scheduled' ? 'Agendado' :
                           post.status === 'published' ? 'Publicado' : 'Falhou'}
                        </span>
                        <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                          {format(new Date(post.scheduledAt), 'HH:mm')}
                        </span>
                      </div>
                      <h4 className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                        {post.title}
                      </h4>
                      <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                        {post.clientName}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        {post.platforms.map((platform) => (
                          <span key={platform} style={{ color: PLATFORM_COLORS[platform] }}>
                            {PLATFORM_ICONS[platform]}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onViewPost?.(post)}
                        className="p-1.5 rounded-lg transition-colors"
                        style={{ backgroundColor: 'var(--bg-primary)' }}
                      >
                        <Eye className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                      </button>
                      <button
                        onClick={() => onEditPost?.(post)}
                        className="p-1.5 rounded-lg transition-colors"
                        style={{ backgroundColor: 'var(--bg-primary)' }}
                      >
                        <Edit3 className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                      </button>
                      <button
                        onClick={() => onDeletePost?.(post.id)}
                        className="p-1.5 rounded-lg transition-colors"
                        style={{ backgroundColor: 'var(--error-100)' }}
                      >
                        <Trash2 className="w-4 h-4" style={{ color: 'var(--error-500)' }} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default PostCalendar;










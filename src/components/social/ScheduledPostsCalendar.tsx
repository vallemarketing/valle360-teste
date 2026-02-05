'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Instagram,
  Facebook,
  Linkedin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
} from 'lucide-react';

interface ScheduledPost {
  id: string;
  copy: string;
  platforms: string[];
  scheduled_at: string;
  status: string;
  client_name?: string;
}

interface ScheduledPostsCalendarProps {
  posts: ScheduledPost[];
  onViewPost?: (post: ScheduledPost) => void;
  showClientName?: boolean;
}

const PLATFORM_ICONS: Record<string, React.ComponentType<any>> = {
  instagram: Instagram,
  facebook: Facebook,
  linkedin: Linkedin,
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  pending_approval: { label: 'Aguardando', color: 'var(--warning-600)', bgColor: 'var(--warning-100)' },
  approved: { label: 'Aprovado', color: 'var(--success-600)', bgColor: 'var(--success-100)' },
  scheduled: { label: 'Agendado', color: 'var(--primary-600)', bgColor: 'var(--primary-100)' },
  published: { label: 'Publicado', color: 'var(--success-700)', bgColor: 'var(--success-50)' },
  failed: { label: 'Falhou', color: 'var(--error-600)', bgColor: 'var(--error-100)' },
  rejected: { label: 'Reprovado', color: 'var(--error-600)', bgColor: 'var(--error-100)' },
};

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export function ScheduledPostsCalendar({ posts, onViewPost, showClientName = false }: ScheduledPostsCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get days in month
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  // Group posts by date
  const postsByDate = useMemo(() => {
    const grouped: Record<string, ScheduledPost[]> = {};
    
    for (const post of posts) {
      if (!post.scheduled_at) continue;
      const dateKey = post.scheduled_at.split('T')[0];
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(post);
    }
    
    return grouped;
  }, [posts]);

  const goToPrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDate(null);
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDate(null);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(null);
  };

  // Generate calendar grid
  const calendarDays = useMemo(() => {
    const days: { date: Date; isCurrentMonth: boolean; dateKey: string }[] = [];
    
    // Previous month days
    for (let i = 0; i < firstDayOfMonth; i++) {
      const date = new Date(year, month, -firstDayOfMonth + i + 1);
      days.push({
        date,
        isCurrentMonth: false,
        dateKey: date.toISOString().split('T')[0],
      });
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      days.push({
        date,
        isCurrentMonth: true,
        dateKey: date.toISOString().split('T')[0],
      });
    }
    
    // Next month days (fill to complete 6 weeks)
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i);
      days.push({
        date,
        isCurrentMonth: false,
        dateKey: date.toISOString().split('T')[0],
      });
    }
    
    return days;
  }, [year, month, daysInMonth, firstDayOfMonth]);

  const todayKey = new Date().toISOString().split('T')[0];

  const selectedPosts = selectedDate ? postsByDate[selectedDate] || [] : [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={goToPrevMonth}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
          </button>
          <h2 className="text-lg font-semibold min-w-[180px] text-center" style={{ color: 'var(--text-primary)' }}>
            {MONTHS[month]} {year}
          </h2>
          <button
            onClick={goToNextMonth}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronRight className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>
        <button
          onClick={goToToday}
          className="px-3 py-1.5 rounded-lg text-sm font-medium"
          style={{ backgroundColor: 'var(--primary-100)', color: 'var(--primary-700)' }}
        >
          Hoje
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border-light)' }}>
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-light)' }}>
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="py-3 text-center text-sm font-medium"
              style={{ color: 'var(--text-tertiary)' }}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, index) => {
            const dayPosts = postsByDate[day.dateKey] || [];
            const isToday = day.dateKey === todayKey;
            const isSelected = day.dateKey === selectedDate;
            const hasPosts = dayPosts.length > 0;

            return (
              <button
                key={index}
                onClick={() => setSelectedDate(hasPosts ? day.dateKey : null)}
                className={`
                  relative min-h-[80px] p-2 border-b border-r text-left transition-colors
                  ${day.isCurrentMonth ? '' : 'opacity-40'}
                  ${hasPosts ? 'cursor-pointer hover:bg-gray-50' : 'cursor-default'}
                  ${isSelected ? 'bg-primary-50' : ''}
                `}
                style={{ borderColor: 'var(--border-light)' }}
              >
                <span
                  className={`
                    inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-medium
                    ${isToday ? 'bg-primary-500 text-white' : ''}
                  `}
                  style={{ color: isToday ? undefined : 'var(--text-primary)' }}
                >
                  {day.date.getDate()}
                </span>

                {/* Post indicators */}
                {dayPosts.length > 0 && (
                  <div className="mt-1 space-y-1">
                    {dayPosts.slice(0, 3).map((post, i) => {
                      const status = STATUS_CONFIG[post.status] || STATUS_CONFIG.scheduled;
                      return (
                        <div
                          key={post.id}
                          className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs truncate"
                          style={{ backgroundColor: status.bgColor, color: status.color }}
                        >
                          {post.platforms[0] && PLATFORM_ICONS[post.platforms[0]] && (
                            React.createElement(PLATFORM_ICONS[post.platforms[0]], {
                              className: 'w-3 h-3 flex-shrink-0',
                            })
                          )}
                          <span className="truncate">
                            {post.copy.substring(0, 15)}...
                          </span>
                        </div>
                      );
                    })}
                    {dayPosts.length > 3 && (
                      <span className="text-xs pl-1" style={{ color: 'var(--text-tertiary)' }}>
                        +{dayPosts.length - 3} mais
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected day detail */}
      <AnimatePresence>
        {selectedDate && selectedPosts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-xl border p-4"
            style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)' }}
          >
            <h3 className="font-medium mb-3" style={{ color: 'var(--text-primary)' }}>
              {new Date(selectedDate).toLocaleDateString('pt-BR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
              <span className="ml-2 text-sm font-normal" style={{ color: 'var(--text-tertiary)' }}>
                ({selectedPosts.length} post{selectedPosts.length > 1 ? 's' : ''})
              </span>
            </h3>

            <div className="space-y-3">
              {selectedPosts.map((post) => {
                const status = STATUS_CONFIG[post.status] || STATUS_CONFIG.scheduled;
                return (
                  <div
                    key={post.id}
                    className="flex items-start gap-3 p-3 rounded-lg border"
                    style={{ borderColor: 'var(--border-light)', backgroundColor: 'var(--bg-secondary)' }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="px-2 py-0.5 rounded text-xs font-medium"
                          style={{ backgroundColor: status.bgColor, color: status.color }}
                        >
                          {status.label}
                        </span>
                        {showClientName && post.client_name && (
                          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                            {post.client_name}
                          </span>
                        )}
                      </div>
                      <p className="text-sm line-clamp-2" style={{ color: 'var(--text-primary)' }}>
                        {post.copy}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1">
                          {post.platforms.map((p) => {
                            const Icon = PLATFORM_ICONS[p];
                            return Icon ? (
                              <Icon key={p} className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                            ) : null;
                          })}
                        </div>
                        <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                          <Clock className="w-3 h-3 inline mr-1" />
                          {new Date(post.scheduled_at).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                    {onViewPost && (
                      <button
                        onClick={() => onViewPost(post)}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <Eye className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs" style={{ color: 'var(--text-tertiary)' }}>
        {Object.entries(STATUS_CONFIG).slice(0, 4).map(([key, config]) => (
          <div key={key} className="flex items-center gap-1.5">
            <span
              className="w-3 h-3 rounded"
              style={{ backgroundColor: config.bgColor, border: `1px solid ${config.color}` }}
            />
            {config.label}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ScheduledPostsCalendar;

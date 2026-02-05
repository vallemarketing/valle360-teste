'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Calendar,
  Loader2,
  Filter,
} from 'lucide-react';
import { ScheduledPostsCalendar } from '@/components/social/ScheduledPostsCalendar';

interface ScheduledPost {
  id: string;
  copy: string;
  platforms: string[];
  scheduled_at: string;
  status: string;
}

export default function ClientCalendarPage() {
  const params = useParams();
  const clientId = params.clientId as string;

  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [filter, setFilter] = useState<'all' | 'scheduled' | 'published'>('all');

  useEffect(() => {
    loadPosts();
  }, [clientId]);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/social/publish?client_id=${clientId}`);
      const data = await response.json();
      if (response.ok) {
        setPosts(data.posts || []);
      }
    } catch (e) {
      console.error('Error loading posts:', e);
      toast.error('Erro ao carregar posts');
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts = posts.filter(p => {
    if (filter === 'all') return true;
    return p.status === filter;
  });

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--primary-500)' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Carregando calendário...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: 'var(--primary-50)' }}
            >
              <Calendar className="w-7 h-7" style={{ color: 'var(--primary-500)' }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                Calendário de Posts
              </h1>
              <p style={{ color: 'var(--text-secondary)' }}>
                Visualize todos os seus posts agendados e publicados
              </p>
            </div>
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-3 py-2 rounded-xl border text-sm"
              style={{
                backgroundColor: 'var(--bg-primary)',
                borderColor: 'var(--border-light)',
                color: 'var(--text-primary)',
              }}
            >
              <option value="all">Todos os posts</option>
              <option value="scheduled">Apenas agendados</option>
              <option value="published">Apenas publicados</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Total de posts', value: posts.length, color: 'var(--primary-500)' },
            { label: 'Agendados', value: posts.filter(p => p.status === 'scheduled').length, color: 'var(--info-500)' },
            { label: 'Publicados', value: posts.filter(p => p.status === 'published').length, color: 'var(--success-500)' },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border p-4"
              style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)' }}
            >
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                {stat.label}
              </p>
              <p className="text-2xl font-bold mt-1" style={{ color: stat.color }}>
                {stat.value}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Calendar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border p-6"
          style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)' }}
        >
          <ScheduledPostsCalendar
            posts={filteredPosts}
            onViewPost={(post) => {
              toast.info(`Visualizando: ${post.copy.substring(0, 50)}...`);
            }}
          />
        </motion.div>
      </div>
    </div>
  );
}

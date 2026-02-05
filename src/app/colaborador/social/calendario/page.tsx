'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Plus, Search, Instagram, Facebook, Linkedin } from 'lucide-react';
import { PostCalendar } from '@/components/social/PostCalendar';

export default function CalendarioSocialPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlatform, setFilterPlatform] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rawPosts, setRawPosts] = useState<any[]>([]);
  const [clients, setClients] = useState<Array<{ id: string; name: string }>>([]);

  const handleAddPost = (_date: Date) => {
    // Criação/edição é feita no centro de upload (funcional e conectado)
    window.location.href = '/colaborador/social-media/upload';
  };

  const handleEditPost = (post: any) => {
    // Edição completa ainda não está implementada como "edit-in-place";
    // gerenciar o post (duplicar/excluir/reagendar) fica no centro de upload.
    window.location.href = '/colaborador/social-media/upload';
  };

  const reload = async () => {
    setLoading(true);
    setError(null);
    try {
      const [pRes, cRes] = await Promise.all([
        fetch('/api/social/posts-mirror', { cache: 'no-store' }),
        fetch('/api/social/clients', { cache: 'no-store' }),
      ]);
      const pJson = await pRes.json().catch(() => null);
      const cJson = await cRes.json().catch(() => null);
      if (!pRes.ok) throw new Error(pJson?.error || 'Falha ao carregar posts');
      if (!cRes.ok) throw new Error(cJson?.error || 'Falha ao carregar clientes');
      setRawPosts(Array.isArray(pJson?.posts) ? pJson.posts : []);
      setClients(
        (Array.isArray(cJson?.clients) ? cJson.clients : []).map((c: any) => ({
          id: String(c?.id || ''),
          name: String(c?.name || 'Cliente'),
        }))
      );
    } catch (e: any) {
      console.error('Erro ao carregar calendário social:', e);
      setRawPosts([]);
      setClients([]);
      setError(String(e?.message || 'Falha ao carregar calendário social'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    const ok = window.confirm('Deseja deletar este post?');
    if (!ok) return;
    setError(null);
    try {
      const r = await fetch(`/api/social/posts-mirror?id=${encodeURIComponent(postId)}`, { method: 'DELETE' });
      const j = await r.json().catch(() => null);
      if (!r.ok) throw new Error(j?.error || 'Falha ao deletar post');
      await reload();
    } catch (e: any) {
      console.error('Falha ao deletar post:', e);
      setError(String(e?.message || 'Falha ao deletar post'));
    }
  };

  const handleViewPost = (post: any) => {
    // Preview e detalhes ficam no centro de upload (listagem real e status/erros).
    window.location.href = '/colaborador/social-media/upload';
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clientNameById = useMemo(() => new Map(clients.map((c) => [c.id, c.name])), [clients]);

  const posts = useMemo(() => {
    return (rawPosts || []).map((p: any) => {
      const caption = String(p?.caption || '');
      const title = caption.trim()
        ? caption.trim().slice(0, 48) + (caption.trim().length > 48 ? '…' : '')
        : `Post (${String(p?.post_type || 'mídia')})`;

      const clientId = p?.client_id ? String(p.client_id) : '';
      const clientName = clientNameById.get(clientId) || 'Cliente';

      const scheduledAt = p?.scheduled_at || p?.published_at || p?.created_at || new Date().toISOString();

      const isDraft = Boolean(p?.is_draft) || String(p?.status || '').toLowerCase() === 'draft';
      const statusRaw = String(p?.status || '').toLowerCase();
      const status: 'draft' | 'scheduled' | 'published' | 'failed' =
        isDraft ? 'draft' :
        statusRaw === 'failed' ? 'failed' :
        statusRaw === 'published' || p?.published_at ? 'published' :
        statusRaw === 'scheduled' || p?.scheduled_at ? 'scheduled' :
        'scheduled';

      const platforms = Array.isArray(p?.platforms) ? p.platforms.map(String) : [];
      const platformsFiltered = platforms.filter((x: any) => ['instagram', 'facebook', 'linkedin', 'twitter'].includes(String(x)));

      const postType = String(p?.post_type || p?.type || 'image').toLowerCase();
      const type: any =
        postType.includes('reel') ? 'reel' :
        postType.includes('story') ? 'story' :
        postType.includes('carousel') ? 'carousel' :
        postType.includes('video') ? 'video' :
        'image';

      const mediaUrls = Array.isArray(p?.media_urls) ? p.media_urls : [];
      const thumbnail = mediaUrls.length ? String(mediaUrls[0]) : undefined;

      return {
        id: String(p?.id || ''),
        title,
        content: caption,
        type,
        platforms: (platformsFiltered.length ? platformsFiltered : ['instagram']) as any,
        scheduledAt,
        status,
        clientId,
        clientName,
        thumbnail,
        createdBy: String(p?.created_by || ''),
      };
    }).filter((x: any) => !!x.id);
  }, [rawPosts, clientNameById]);

  const filteredPosts = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return posts.filter((p: any) => {
      if (filterPlatform !== 'all' && !p.platforms.includes(filterPlatform)) return false;
      if (!q) return true;
      const hay = `${p.title} ${p.content} ${p.clientName}`.toLowerCase();
      return hay.includes(q);
    });
  }, [posts, searchTerm, filterPlatform]);

  const stats = useMemo(() => {
    const scheduled = filteredPosts.filter((p: any) => p.status === 'scheduled').length;
    const drafts = filteredPosts.filter((p: any) => p.status === 'draft').length;
    const activeClients = new Set(filteredPosts.map((p: any) => p.clientId).filter(Boolean)).size;
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const publishedMonth = filteredPosts.filter((p: any) => {
      if (p.status !== 'published') return false;
      const d = new Date(p.scheduledAt);
      return d.getFullYear() === y && d.getMonth() === m;
    }).length;
    return { scheduled, drafts, activeClients, publishedMonth };
  }, [filteredPosts]);

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div 
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: 'var(--pink-100, #FCE7F3)' }}
            >
              <Calendar className="w-7 h-7" style={{ color: 'var(--pink-500, #EC4899)' }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                Calendário de Posts
              </h1>
              <p style={{ color: 'var(--text-secondary)' }}>
                Agende e gerencie publicações nas redes sociais
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleAddPost(new Date())}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-white"
              style={{ backgroundColor: 'var(--primary-500)' }}
            >
              <Plus className="w-4 h-4" />
              Novo Post
            </motion.button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Buscar post..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 pl-10 rounded-xl border"
              style={{
                backgroundColor: 'var(--bg-primary)',
                borderColor: 'var(--border-light)',
                color: 'var(--text-primary)'
              }}
            />
            <Search 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
              style={{ color: 'var(--text-tertiary)' }}
            />
          </div>

          {/* Platform Filter */}
          <div className="flex gap-2">
            {[
              { id: 'all', label: 'Todas', icon: null },
              { id: 'instagram', label: 'Instagram', icon: <Instagram className="w-4 h-4" />, color: '#E4405F' },
              { id: 'facebook', label: 'Facebook', icon: <Facebook className="w-4 h-4" />, color: '#1877F2' },
              { id: 'linkedin', label: 'LinkedIn', icon: <Linkedin className="w-4 h-4" />, color: '#0A66C2' }
            ].map((platform) => (
              <button
                key={platform.id}
                onClick={() => setFilterPlatform(platform.id)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                style={{
                  backgroundColor: filterPlatform === platform.id 
                    ? platform.color || 'var(--primary-500)' 
                    : 'var(--bg-primary)',
                  color: filterPlatform === platform.id 
                    ? 'white' 
                    : 'var(--text-secondary)',
                  border: `1px solid ${filterPlatform === platform.id ? platform.color || 'var(--primary-500)' : 'var(--border-light)'}`
                }}
              >
                {platform.icon}
                <span className="hidden md:inline">{platform.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard 
            label="Agendados"
            value={loading ? '—' : String(stats.scheduled)}
            color="var(--primary-500)"
          />
          <StatCard 
            label="Publicados (Mês)"
            value={loading ? '—' : String(stats.publishedMonth)}
            color="var(--success-500)"
          />
          <StatCard 
            label="Rascunhos"
            value={loading ? '—' : String(stats.drafts)}
            color="var(--warning-500)"
          />
          <StatCard 
            label="Clientes Ativos"
            value={loading ? '—' : String(stats.activeClients)}
            color="var(--purple-500)"
          />
        </div>

        {/* Calendar */}
        {error && (
          <div className="rounded-xl p-4 border" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--error-300)' }}>
            <p style={{ color: 'var(--error-700)' }}>{error}</p>
          </div>
        )}
        <PostCalendar
          posts={filteredPosts}
          onAddPost={handleAddPost}
          onEditPost={handleEditPost}
          onDeletePost={handleDeletePost}
          onViewPost={handleViewPost}
        />

        {/* Best Times Suggestion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl p-6 border"
          style={{ 
            backgroundColor: 'var(--bg-primary)',
            borderColor: 'var(--border-light)'
          }}
        >
          <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <span className="text-lg">🤖</span>
            Sugestão da Val: Melhores Horários (benchmark)
          </h3>
          <p className="text-sm mb-4" style={{ color: 'var(--text-tertiary)' }}>
            Observação: até termos dados suficientes por canal/cliente, estas sugestões usam benchmarks gerais.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <TimeSlot platform="Instagram" time="18:00 - 21:00" engagement="+45%" />
            <TimeSlot platform="Facebook" time="13:00 - 15:00" engagement="+32%" />
            <TimeSlot platform="LinkedIn" time="08:00 - 10:00" engagement="+28%" />
            <TimeSlot platform="Stories" time="12:00 - 14:00" engagement="+38%" />
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div 
      className="rounded-xl p-4 border"
      style={{ 
        backgroundColor: 'var(--bg-primary)',
        borderColor: 'var(--border-light)'
      }}
    >
      <p className="text-2xl font-bold" style={{ color }}>{value}</p>
      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{label}</p>
    </div>
  );
}

// Time Slot Component
function TimeSlot({ platform, time, engagement }: { platform: string; time: string; engagement: string }) {
  return (
    <div 
      className="p-3 rounded-lg"
      style={{ backgroundColor: 'var(--bg-secondary)' }}
    >
      <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{platform}</p>
      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{time}</p>
      <p className="text-xs font-medium mt-1" style={{ color: 'var(--success-500)' }}>{engagement} engajamento</p>
    </div>
  );
}










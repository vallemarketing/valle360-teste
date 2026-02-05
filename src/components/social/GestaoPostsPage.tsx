'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Calendar,
  List,
  Activity,
  BarChart3,
  Plus,
  Search,
  Instagram,
  Facebook,
  Linkedin,
  Twitter,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';

import { PostCalendar } from '@/components/social/PostCalendar';
import { ConfirmModal } from '@/components/ui';

type ViewMode = 'calendar' | 'list' | 'monitor' | 'metrics';

function safeStr(v: any) {
  return String(v ?? '').trim();
}

function statusToV1(statusRaw: any, isDraft: any, scheduledAt: any, publishedAt: any): 'draft' | 'scheduled' | 'published' | 'failed' {
  const s = String(statusRaw || '').toLowerCase();
  const draft = Boolean(isDraft) || s === 'draft';
  if (draft) return 'draft';
  if (s === 'failed') return 'failed';
  if (s === 'published' || !!publishedAt) return 'published';
  if (s === 'scheduled' || !!scheduledAt) return 'scheduled';
  return 'scheduled';
}

function statusLabel(s: string) {
  if (s === 'draft') return 'Rascunho';
  if (s === 'scheduled') return 'Agendado';
  if (s === 'published') return 'Publicado';
  if (s === 'failed') return 'Falhou';
  return s;
}

function statusBadgeStyle(s: string) {
  const key = String(s || '').toLowerCase();
  if (key === 'published') return { bg: 'var(--success-100)', text: 'var(--success-700)' };
  if (key === 'failed') return { bg: 'var(--error-100)', text: 'var(--error-700)' };
  if (key === 'draft') return { bg: 'var(--neutral-200)', text: 'var(--neutral-700)' };
  return { bg: 'var(--primary-100)', text: 'var(--primary-700)' };
}

export function GestaoPostsPage(props: { uploadHref: string; titlePrefix?: string }) {
  const uploadHref = props.uploadHref;
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [clients, setClients] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('all');

  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlatform, setFilterPlatform] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const [rawPosts, setRawPosts] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<{ latest: any | null; daily: any[]; range_days: number } | null>(null);

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmDeleteLoading, setConfirmDeleteLoading] = useState(false);

  const reload = async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    setError(null);
    try {
      const clientIdParam = selectedClientId && selectedClientId !== 'all' ? `?client_id=${encodeURIComponent(selectedClientId)}` : '';
      const [pRes, cRes] = await Promise.all([
        fetch(`/api/social/posts-mirror${clientIdParam}`, { cache: 'no-store' }),
        fetch('/api/social/clients', { cache: 'no-store' }),
      ]);
      const pJson = await pRes.json().catch(() => null);
      const cJson = await cRes.json().catch(() => null);
      if (!pRes.ok) throw new Error(pJson?.error || 'Falha ao carregar posts');
      if (!cRes.ok) throw new Error(cJson?.error || 'Falha ao carregar clientes');

      setRawPosts(Array.isArray(pJson?.posts) ? pJson.posts : []);
      setClients(
        (Array.isArray(cJson?.clients) ? cJson.clients : []).map((c: any) => ({
          id: safeStr(c?.id),
          name: safeStr(c?.name || 'Cliente'),
        }))
      );
    } catch (e: any) {
      console.error('Erro ao carregar gestão de posts:', e);
      setRawPosts([]);
      setClients([]);
      setError(String(e?.message || 'Falha ao carregar gestão de posts'));
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  };

  const reloadMetrics = async () => {
    setMetrics(null);
    if (!selectedClientId || selectedClientId === 'all') return;
    try {
      const r = await fetch(`/api/social/metrics?client_id=${encodeURIComponent(selectedClientId)}&days=30`, { cache: 'no-store' });
      const j = await r.json().catch(() => null);
      if (!r.ok) throw new Error(j?.error || 'Falha ao carregar métricas');
      setMetrics({ latest: j?.latest || null, daily: Array.isArray(j?.daily) ? j.daily : [], range_days: Number(j?.range_days || 30) });
    } catch (e: any) {
      console.error('Falha ao carregar métricas:', e);
      setError(String(e?.message || 'Falha ao carregar métricas'));
    }
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // quando muda cliente, recarrega posts e métricas
    (async () => {
      await reload({ silent: true });
      await reloadMetrics();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClientId]);

  const clientNameById = useMemo(() => new Map(clients.map((c) => [c.id, c.name])), [clients]);

  const posts = useMemo(() => {
    return (rawPosts || [])
      .map((p: any) => {
        const caption = safeStr(p?.caption);
        const title = caption
          ? caption.slice(0, 64) + (caption.length > 64 ? '…' : '')
          : `Post (${safeStr(p?.post_type || 'mídia')})`;

        const clientId = safeStr(p?.client_id);
        const clientName = clientNameById.get(clientId) || 'Cliente';
        const scheduledAt = p?.scheduled_at || p?.published_at || p?.created_at || new Date().toISOString();
        const status = statusToV1(p?.status, p?.is_draft, p?.scheduled_at, p?.published_at);
        const platforms = Array.isArray(p?.platforms) ? p.platforms.map(String) : [];
        const platformsFiltered = platforms.filter((x: any) => ['instagram', 'facebook', 'linkedin', 'twitter'].includes(String(x)));
        const mediaUrls = Array.isArray(p?.media_urls) ? p.media_urls : [];
        const thumbnail = mediaUrls.length ? safeStr(mediaUrls[0]) : undefined;
        const errorMessage = safeStr(p?.error_message);

        return {
          id: safeStr(p?.id),
          title,
          caption,
          clientId,
          clientName,
          scheduledAt,
          status,
          platforms: (platformsFiltered.length ? platformsFiltered : ['instagram']) as any,
          thumbnail,
          errorMessage,
          raw: p,
        };
      })
      .filter((x: any) => !!x.id);
  }, [rawPosts, clientNameById]);

  const filteredPosts = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return posts.filter((p: any) => {
      if (filterPlatform !== 'all' && !p.platforms.includes(filterPlatform)) return false;
      if (filterStatus !== 'all' && String(p.status) !== filterStatus) return false;
      if (!q) return true;
      const hay = `${p.title} ${p.caption} ${p.clientName}`.toLowerCase();
      return hay.includes(q);
    });
  }, [posts, searchTerm, filterPlatform, filterStatus]);

  const monitorPosts = useMemo(() => {
    return filteredPosts.filter((p: any) => p.status === 'failed' || !!p.errorMessage);
  }, [filteredPosts]);

  const stats = useMemo(() => {
    const scheduled = filteredPosts.filter((p: any) => p.status === 'scheduled').length;
    const drafts = filteredPosts.filter((p: any) => p.status === 'draft').length;
    const published = filteredPosts.filter((p: any) => p.status === 'published').length;
    const failed = filteredPosts.filter((p: any) => p.status === 'failed').length;
    const activeClients = new Set(filteredPosts.map((p: any) => p.clientId).filter(Boolean)).size;
    return { scheduled, drafts, published, failed, activeClients };
  }, [filteredPosts]);

  const askDelete = (postId: string) => {
    setConfirmDeleteId(postId);
    setConfirmDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!confirmDeleteId) return;
    setConfirmDeleteLoading(true);
    setError(null);
    try {
      const r = await fetch(`/api/social/posts-mirror?id=${encodeURIComponent(confirmDeleteId)}`, { method: 'DELETE' });
      const j = await r.json().catch(() => null);
      if (!r.ok) throw new Error(j?.error || 'Falha ao deletar post');
      toast.success('Post deletado.');
      setConfirmDeleteOpen(false);
      setConfirmDeleteId(null);
      await reload({ silent: true });
    } catch (e: any) {
      console.error('Falha ao deletar post:', e);
      toast.error(String(e?.message || 'Falha ao deletar post'));
      setError(String(e?.message || 'Falha ao deletar post'));
    } finally {
      setConfirmDeleteLoading(false);
    }
  };

  const headerTitle = props.titlePrefix ? `${props.titlePrefix} - Gestão de Posts` : 'Gestão de Posts';

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'var(--primary-50)' }}>
              <Calendar className="w-7 h-7" style={{ color: 'var(--primary-500)' }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {headerTitle}
              </h1>
              <p style={{ color: 'var(--text-secondary)' }}>
                Visão rápida (Calendário/Lista/Monitoramento) baseada em `instagram_posts`.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={uploadHref}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-white"
              style={{ backgroundColor: 'var(--primary-500)' }}
            >
              <Plus className="w-4 h-4" />
              Agendar Postagem
            </Link>
          </div>
        </div>

        {error ? (
          <div className="rounded-xl border p-3 text-sm" style={{ backgroundColor: 'var(--error-50)', borderColor: 'var(--error-200)', color: 'var(--error-700)' }}>
            {error}
          </div>
        ) : null}

        {/* Filtros */}
        <div className="rounded-2xl border p-4" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)' }}>
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por legenda/cliente…"
                className="w-full pl-10 pr-3 py-2 rounded-xl border text-sm"
                style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-light)', color: 'var(--text-primary)' }}
              />
            </div>

            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="px-3 py-2 rounded-xl border text-sm"
              style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-light)', color: 'var(--text-primary)' }}
            >
              <option value="all">Todos os clientes</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={filterPlatform}
              onChange={(e) => setFilterPlatform(e.target.value)}
              className="px-3 py-2 rounded-xl border text-sm"
              style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-light)', color: 'var(--text-primary)' }}
            >
              <option value="all">Todas as plataformas</option>
              <option value="instagram">Instagram</option>
              <option value="facebook">Facebook</option>
              <option value="linkedin">LinkedIn</option>
              <option value="twitter">Twitter</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 rounded-xl border text-sm"
              style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-light)', color: 'var(--text-primary)' }}
            >
              <option value="all">Todos os status</option>
              <option value="draft">Rascunho</option>
              <option value="scheduled">Agendado</option>
              <option value="published">Publicado</option>
              <option value="failed">Falhou</option>
            </select>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[
            { label: 'Agendados', value: stats.scheduled },
            { label: 'Rascunhos', value: stats.drafts },
            { label: 'Publicados', value: stats.published },
            { label: 'Falhas', value: stats.failed },
            { label: 'Clientes ativos', value: stats.activeClients },
          ].map((k) => (
            <div key={k.label} className="rounded-2xl border p-4" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)' }}>
              <div className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
                {k.label}
              </div>
              <div className="text-2xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
                {k.value}
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'list', label: 'Lista', icon: List },
            { id: 'calendar', label: 'Calendário', icon: Calendar },
            { id: 'monitor', label: 'Monitoramento', icon: Activity },
            { id: 'metrics', label: 'Métricas', icon: BarChart3 },
          ].map((t) => {
            const Icon = t.icon;
            const active = viewMode === (t.id as ViewMode);
            return (
              <button
                key={t.id}
                onClick={() => setViewMode(t.id as ViewMode)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium"
                style={{
                  backgroundColor: active ? 'var(--primary-50)' : 'var(--bg-primary)',
                  borderColor: active ? 'var(--primary-200)' : 'var(--border-light)',
                  color: active ? 'var(--primary-700)' : 'var(--text-primary)',
                }}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Conteúdo */}
        {loading ? (
          <div className="rounded-2xl border p-6" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)' }}>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Carregando…
            </div>
          </div>
        ) : null}

        {!loading && viewMode === 'calendar' ? (
          <div className="rounded-2xl border p-4" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)' }}>
            <PostCalendar
              posts={filteredPosts as any}
              onAddPost={() => {
                window.location.href = uploadHref;
              }}
              onEditPost={() => {
                window.location.href = uploadHref;
              }}
              onViewPost={() => {
                window.location.href = uploadHref;
              }}
              onDeletePost={(id) => askDelete(String(id))}
            />
          </div>
        ) : null}

        {!loading && viewMode === 'list' ? (
          <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)' }}>
            <div className="p-4 border-b" style={{ borderColor: 'var(--border-light)' }}>
              <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Últimos posts ({filteredPosts.length})
              </div>
              <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                Ações avançadas (reagendar/editar mídia) continuam no “Agendar Postagem”.
              </div>
            </div>
            <div className="divide-y" style={{ borderColor: 'var(--border-light)' }}>
              {filteredPosts.slice(0, 100).map((p: any) => {
                const badge = statusBadgeStyle(p.status);
                return (
                  <div key={p.id} className="p-4 flex flex-col md:flex-row md:items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ backgroundColor: badge.bg, color: badge.text }}>
                          {statusLabel(p.status)}
                        </span>
                        <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                          {p.clientName}
                        </span>
                      </div>
                      <div className="mt-1 font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                        {p.title}
                      </div>
                      <div className="text-xs truncate mt-1" style={{ color: 'var(--text-secondary)' }}>
                        {p.caption || '—'}
                      </div>
                      {p.errorMessage ? (
                        <div className="text-xs mt-1" style={{ color: 'var(--error-600)' }}>
                          Erro: {p.errorMessage}
                        </div>
                      ) : null}
                      <div className="flex items-center gap-2 mt-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        {p.platforms.includes('instagram') ? <Instagram className="w-4 h-4" /> : null}
                        {p.platforms.includes('facebook') ? <Facebook className="w-4 h-4" /> : null}
                        {p.platforms.includes('linkedin') ? <Linkedin className="w-4 h-4" /> : null}
                        {p.platforms.includes('twitter') ? <Twitter className="w-4 h-4" /> : null}
                        <span className="ml-2">{new Date(p.scheduledAt).toLocaleString('pt-BR')}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={uploadHref}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-sm"
                        style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-light)', color: 'var(--text-primary)' }}
                      >
                        Abrir no Agendar <ExternalLink className="w-4 h-4" />
                      </Link>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => askDelete(p.id)}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-sm"
                        style={{ backgroundColor: 'var(--error-50)', borderColor: 'var(--error-200)', color: 'var(--error-700)' }}
                      >
                        <Trash2 className="w-4 h-4" />
                        Excluir
                      </motion.button>
                    </div>
                  </div>
                );
              })}
              {filteredPosts.length === 0 ? (
                <div className="p-6 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Nenhum post encontrado com os filtros atuais.
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {!loading && viewMode === 'monitor' ? (
          <div className="rounded-2xl border p-4" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)' }}>
            <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Falhas e erros ({monitorPosts.length})
            </div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
              Use esta lista para identificar posts com `status=failed` ou `error_message`.
            </div>
            <div className="mt-4 space-y-3">
              {monitorPosts.slice(0, 100).map((p: any) => (
                <div key={p.id} className="rounded-xl border p-3" style={{ borderColor: 'var(--border-light)', backgroundColor: 'var(--bg-secondary)' }}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                        {p.clientName} — {p.title}
                      </div>
                      <div className="text-xs mt-1" style={{ color: 'var(--error-700)' }}>
                        {p.errorMessage || 'Falha sem mensagem detalhada.'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={uploadHref}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-sm"
                        style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)', color: 'var(--text-primary)' }}
                      >
                        Abrir <ExternalLink className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => askDelete(p.id)}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-sm"
                        style={{ backgroundColor: 'var(--error-50)', borderColor: 'var(--error-200)', color: 'var(--error-700)' }}
                      >
                        <Trash2 className="w-4 h-4" />
                        Excluir
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {monitorPosts.length === 0 ? (
                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Nenhuma falha encontrada com os filtros atuais.
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {!loading && viewMode === 'metrics' ? (
          <div className="rounded-2xl border p-4 space-y-4" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)' }}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  Métricas (30 dias)
                </div>
                <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                  Baseado em `social_account_metrics_daily` (agregado por dia e plataforma).
                </div>
              </div>
              <button
                onClick={reloadMetrics}
                className="px-3 py-2 rounded-xl border text-sm"
                style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-light)', color: 'var(--text-primary)' }}
              >
                Atualizar
              </button>
            </div>

            {selectedClientId === 'all' ? (
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Selecione um cliente para ver métricas.
              </div>
            ) : metrics ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  {[
                    { label: 'Impressões', value: metrics.latest?.impressions ?? 0 },
                    { label: 'Alcance', value: metrics.latest?.reach ?? 0 },
                    { label: 'Engajados', value: metrics.latest?.engaged ?? 0 },
                    { label: 'Fans', value: metrics.latest?.fans ?? 0 },
                    { label: 'Visitas Perfil', value: metrics.latest?.profile_views ?? 0 },
                  ].map((k) => (
                    <div key={k.label} className="rounded-xl border p-3" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-light)' }}>
                      <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        {k.label}
                      </div>
                      <div className="text-lg font-semibold mt-1" style={{ color: 'var(--text-primary)' }}>
                        {Number(k.value || 0).toLocaleString('pt-BR')}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="h-72 rounded-xl border p-3" style={{ borderColor: 'var(--border-light)', backgroundColor: 'var(--bg-secondary)' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={metrics.daily}>
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="impressions" stroke="#1672d6" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="reach" stroke="#10B981" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="engaged" stroke="#F59E0B" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </>
            ) : (
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Sem dados de métricas para este cliente (ou ainda não coletado).
              </div>
            )}
          </div>
        ) : null}

        <ConfirmModal
          isOpen={confirmDeleteOpen}
          onClose={() => {
            if (confirmDeleteLoading) return;
            setConfirmDeleteOpen(false);
            setConfirmDeleteId(null);
          }}
          onConfirm={confirmDelete}
          title="Deletar post"
          message="Tem certeza que deseja deletar este post? Essa ação não pode ser desfeita."
          confirmText="Deletar"
          cancelText="Cancelar"
          variant="danger"
          loading={confirmDeleteLoading}
        />
      </div>
    </div>
  );
}


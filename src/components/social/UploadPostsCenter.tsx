'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Image as ImageIcon,
  Video as VideoIcon,
  Files,
  Upload,
  ChevronDown,
  Instagram,
  Facebook,
  User,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ConfirmModal } from '@/components/ui';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type PostType = 'image' | 'video' | 'carousel';
type Backend = 'instagramback' | 'meta';

type ClientRow = { id: string; name: string; city?: string | null; state?: string | null };
type AccountRow = {
  id: string;
  platform: 'instagram' | 'facebook' | 'linkedin' | 'twitter' | 'tiktok' | 'youtube' | string;
  external_account_id: string;
  username?: string | null;
  display_name?: string | null;
  profile_picture_url?: string | null;
  status?: 'active' | 'expired' | 'error' | string;
};

type ChannelSelection = { account_id: string; platform: string };

function safeName(input: string) {
  return String(input || '').trim();
}

function safeObjectName(name: string) {
  return String(name || 'file')
    .trim()
    .replace(/[^\w.\-]+/g, '_')
    .slice(0, 120);
}

function pickId(p: any): string | null {
  const id = p?.id ?? p?._id ?? p?.external_id ?? p?.externalId;
  return id ? String(id) : null;
}

function toIso(date: string, time: string) {
  if (!date || !time) return null;
  return new Date(`${date}T${time}:00`).toISOString();
}

function platformIcon(p: string) {
  if (p === 'instagram') return <Instagram className="w-3.5 h-3.5" />;
  if (p === 'facebook') return <Facebook className="w-3.5 h-3.5" />;
  return <span className="text-xs font-semibold">{p.slice(0, 2).toUpperCase()}</span>;
}

export default function UploadPostsCenter(props: { title: string; backHref?: string }) {
  // etapa 0: dados
  const [clientsLoading, setClientsLoading] = useState(true);
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');

  const [accountsLoading, setAccountsLoading] = useState(false);
  const accountsCacheRef = useRef<Map<string, AccountRow[]>>(new Map());
  const [accounts, setAccounts] = useState<AccountRow[]>([]);

  const [backend, setBackend] = useState<Backend>('instagramback');
  const [selectedChannels, setSelectedChannels] = useState<ChannelSelection[]>([]);

  // etapa 1..5
  const [postType, setPostType] = useState<PostType>('image');
  const [files, setFiles] = useState<File[]>([]);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverUrl, setCoverUrl] = useState<string>('');
  const [caption, setCaption] = useState('');
  const [collaborators, setCollaborators] = useState('');
  const [scheduledDate, setScheduledDate] = useState(''); // yyyy-mm-dd
  const [scheduledTime, setScheduledTime] = useState(''); // HH:mm

  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [actionLoading, setActionLoading] = useState<null | string>(null);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTargetPost, setDeleteTargetPost] = useState<any | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const openExternal = (url: string) => {
    try {
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      setHint(`Abra este link em uma nova aba: ${url}`);
    }
  };

  const [loadingPosts, setLoadingPosts] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);

  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const selectedClient = useMemo(() => clients.find((c) => c.id === selectedClientId) || null, [clients, selectedClientId]);

  // perf: previews locais
  const localPreviews = useMemo(() => {
    return files.map((f) => ({
      file: f,
      url: URL.createObjectURL(f),
      isVideo: f.type.startsWith('video/'),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files]);

  useEffect(() => {
    return () => {
      localPreviews.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, [localPreviews]);

  const mediaAccept = postType === 'video' ? 'video/*' : postType === 'carousel' ? 'image/*,video/*' : 'image/*';
  const allowMultiple = postType === 'carousel';

  function onSelectFiles(list: FileList | null) {
    if (!list) return;
    const arr = Array.from(list);
    if (postType === 'carousel') {
      // Aceitar imagens E vídeos no carrossel (mas todos do mesmo tipo)
      const media = arr.filter((f) => f.type.startsWith('image/') || f.type.startsWith('video/')).slice(0, 10);
      setFiles(media);
      return;
    }
    setFiles(arr.slice(0, 1));
  }

  async function loadClients() {
    setClientsLoading(true);
    setError(null);
    try {
      const r = await fetch('/api/social/clients', { cache: 'no-store' });
      const j = await r.json();
      console.log('Resposta clientes:', j);
      if (!r.ok) throw new Error(j?.error || 'Falha ao carregar clientes');
      const list: ClientRow[] = Array.isArray(j?.clients) ? j.clients : [];
      console.log('Clientes carregados:', list);
      setClients(list);
      if (!selectedClientId && list[0]?.id) setSelectedClientId(String(list[0].id));
    } catch (e: any) {
      console.error('Erro ao carregar clientes:', e);
      setError(e?.message || 'Erro ao carregar clientes');
    } finally {
      setClientsLoading(false);
    }
  }

  async function loadAccounts(clientId: string) {
    if (!clientId) return;
    // cache local p/ percepção
    const cached = accountsCacheRef.current.get(clientId);
    if (cached) {
      setAccounts(cached);
      return;
    }

    setAccountsLoading(true);
    setError(null);
    try {
      const r = await fetch(`/api/social/accounts?client_id=${encodeURIComponent(clientId)}`, { cache: 'no-store' });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || 'Falha ao carregar canais');
      const list: AccountRow[] = Array.isArray(j?.accounts) ? j.accounts : [];
      accountsCacheRef.current.set(clientId, list);
      setAccounts(list);
    } catch (e: any) {
      setError(e?.message || 'Erro ao carregar canais');
    } finally {
      setAccountsLoading(false);
    }
  }

  async function loadPostsMirror(clientId: string) {
    setLoadingPosts(true);
    setError(null);
    try {
      const url = clientId ? `/api/social/posts-mirror?client_id=${encodeURIComponent(clientId)}` : '/api/social/posts-mirror';
      const r = await fetch(url, { cache: 'no-store' });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || 'Falha ao carregar posts');
      setPosts(Array.isArray(j?.posts) ? j.posts : []);
    } catch (e: any) {
      setError(e?.message || 'Erro ao carregar posts');
    } finally {
      setLoadingPosts(false);
    }
  }

  useEffect(() => {
    loadClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedClientId) return;
    // reset seleção de canais ao trocar cliente
    setSelectedChannels([]);
    loadAccounts(selectedClientId);
    loadPostsMirror(selectedClientId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClientId]);

  function toggleChannel(account: AccountRow) {
    setSelectedChannels((prev) => {
      const exists = prev.some((p) => p.account_id === account.id);
      if (exists) return prev.filter((p) => p.account_id !== account.id);
      return [...prev, { account_id: account.id, platform: String(account.platform) }];
    });
  }

  function validateBase(params: { needsMedia: boolean; needsSchedule: boolean }) {
    if (!selectedClientId) return 'Selecione um perfil (cliente).';
    // if (selectedChannels.length === 0) return 'Selecione ao menos um canal.';
    if (params.needsMedia && uploadedUrls.length === 0) return 'Envie a mídia (Storage) antes de continuar.';
    if (params.needsSchedule) {
      if (!scheduledDate || !scheduledTime) return 'Informe data e horário.';
    }
    if (backend === 'instagramback') {
      // hoje: InstagramBack é focado em Instagram
      const nonIg = selectedChannels.some((c) => c.platform !== 'instagram');
      if (nonIg) return 'Para canais além de Instagram, selecione o backend “Meta (OAuth)”.';
    }
    return null;
  }

  async function handleUpload() {
    if (!files.length) {
      setError('Selecione arquivo(s) para upload');
      return;
    }
    setUploading(true);
    setError(null);
    setHint(null);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) throw new Error('Sessão expirada. Faça login novamente.');

      const bucket = 'social-media';
      const ts = Date.now();
      const clientPrefix = selectedClientId ? safeObjectName(selectedClientId) : 'no_client';
      const baseFolder = `${userId}/posts/${clientPrefix}`;

      const urls: string[] = [];

      for (const file of files) {
        const objectName = `${ts}_${Math.random().toString(36).slice(2, 8)}_${safeObjectName(file.name)}`;
        const path = `${baseFolder}/${objectName}`;

        const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, {
          cacheControl: '31536000',
          upsert: false,
          contentType: file.type || undefined,
        });
        if (uploadError) {
          // Erro comum: bucket inexistente (migration não aplicada)
          const msg = String(uploadError.message || '').toLowerCase();
          if (msg.includes('bucket') && msg.includes('not found')) {
            throw new Error('Bucket "social-media" não existe no Supabase Storage. Aplique a migration 20251230000003_create_social_media_bucket.sql.');
          }
          throw uploadError;
        }

        const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
        if (!pub?.publicUrl) throw new Error('Falha ao obter URL pública do upload.');
        urls.push(pub.publicUrl);
      }

      setUploadedUrls(urls);
      
      // Upload da capa (se houver) para carrossel de vídeo
      if (coverFile && postType === 'carousel') {
        const coverObjectName = `${ts}_cover_${Math.random().toString(36).slice(2, 8)}_${safeObjectName(coverFile.name)}`;
        const coverPath = `${baseFolder}/${coverObjectName}`;
        
        const { error: coverUploadError } = await supabase.storage.from(bucket).upload(coverPath, coverFile, {
          cacheControl: '31536000',
          upsert: false,
          contentType: coverFile.type || undefined,
        });
        
        if (!coverUploadError) {
          const { data: coverPub } = supabase.storage.from(bucket).getPublicUrl(coverPath);
          if (coverPub?.publicUrl) {
            setCoverUrl(coverPub.publicUrl);
          }
        }
      }
      
      setHint('Upload concluído (Supabase Storage). URLs prontas para postar.');
    } catch (e: any) {
      setError(e?.message || 'Falha no upload');
    } finally {
      setUploading(false);
    }
  }

  function basePayload(extra?: Record<string, any>) {
    const legacy: any = {};
    if (postType === 'image') legacy.urlimagem = uploadedUrls[0] || null;
    if (postType === 'video') legacy.urlvideo = uploadedUrls[0] || null;
    if (postType === 'carousel') legacy.carrossel = uploadedUrls.join(',');
    
    // URLs específicas por tipo
    const url_imagem = postType === 'image' ? uploadedUrls[0] || null : null;
    const url_video = postType === 'video' ? uploadedUrls[0] || null : null;
    const url_carrossel = postType === 'carousel' ? uploadedUrls : null;
    
    // Detectar tipo do carrossel baseado no primeiro arquivo
    let carrossel_type = null;
    if (postType === 'carousel' && files.length > 0) {
      carrossel_type = files[0].type.startsWith('video/') ? 'video' : 'image';
    }
    
    // Usar coverUrl se houver, senão primeira URL do carrossel
    const cover_imagem = coverUrl || (postType === 'carousel' && uploadedUrls.length > 0 ? uploadedUrls[0] : null);
    
    return {
      client_id: selectedClientId || null,
      post_type: postType,
      type: postType,
      caption,
      legenda: caption,
      collaborators,
      colaboradores: collaborators,
      scheduled_at: toIso(scheduledDate, scheduledTime),
      scheduledAt: toIso(scheduledDate, scheduledTime),
      data: scheduledDate || null,
      horario: scheduledTime ? `${scheduledTime}:00` : null,
      media_urls: uploadedUrls,
      mediaUrls: uploadedUrls,
      url_imagem,
      url_video,
      url_carrossel,
      carrossel_type,
      cover_imagem,
      platforms: selectedChannels.map((c) => String(c.platform)),
      channels: selectedChannels,
      backend,
      ...legacy,
      ...extra,
    };
  }

  async function createOrRecord(action: 'draft' | 'approval' | 'schedule' | 'publish_now', opts?: { boost?: boolean }) {
    const needsMedia = action === 'schedule' || action === 'publish_now';
    const needsSchedule = action === 'schedule';
    const err = validateBase({ needsMedia, needsSchedule });
    if (err) {
      setError(err);
      return;
    }

    setActionLoading(action + (opts?.boost ? '_boost' : ''));
    setError(null);
    setHint(null);
    try {
      if (action === 'draft') {
        const r = await fetch('/api/social/post-records', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(
            basePayload({
              is_draft: true,
              approval_status: 'approved',
              boost_requested: Boolean(opts?.boost),
              // permitir rascunho sem mídia
              media_urls: uploadedUrls,
              mediaUrls: uploadedUrls,
            })
          ),
        });
        const j = await r.json();
        if (!r.ok) throw new Error(j?.error || 'Falha ao salvar rascunho');
        setHint('Rascunho salvo.');
      } else if (action === 'approval') {
        const r = await fetch('/api/social/post-records', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(
            basePayload({
              is_draft: false,
              approval_status: 'pending',
              boost_requested: Boolean(opts?.boost),
            })
          ),
        });
        const j = await r.json();
        if (!r.ok) throw new Error(j?.error || 'Falha ao enviar para aprovação');
        setHint('Enviado para aprovação.');
      } else {
        // publicar/agendar - SALVAR DIRETO NO BANCO
        const scheduledAt = action === 'schedule' ? toIso(scheduledDate, scheduledTime) : null;
        const payload = basePayload({
          scheduled_at: scheduledAt,
          scheduledAt,
          is_draft: false,
          approval_status: 'approved',
          boost_requested: Boolean(opts?.boost),
          mode: action === 'schedule' ? 'schedule' : 'publish_now',
        });

        // Salvar direto no banco via post-records
        const r = await fetch('/api/social/post-records', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const j = await r.json();
        if (!r.ok) throw new Error(j?.error || 'Falha ao salvar post');
        setHint(action === 'schedule' ? 'Post agendado com sucesso!' : 'Post salvo com sucesso!');
      }

      // reset leve (mantém tipo)
      setFiles([]);
      setUploadedUrls([]);
      setCaption('');
      setCollaborators('');
      setScheduledDate('');
      setScheduledTime('');

      await loadPostsMirror(selectedClientId);
    } catch (e: any) {
      setError(e?.message || 'Erro');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDelete(post: any) {
    setDeleteTargetPost(post || null);
    setDeleteConfirmOpen(true);
  }

  async function confirmDelete() {
    if (!deleteTargetPost) return;
    const post = deleteTargetPost;
    const externalId = post?.external_id ? String(post.external_id) : null;
    const localId = post?.id ? String(post.id) : null;

    setDeleteLoading(true);
    setError(null);
    setHint(null);
    try {
      if (externalId && String(post?.backend || 'instagramback') === 'instagramback') {
        const r = await fetch(`/api/social/instagramback/posts/${encodeURIComponent(externalId)}`, { method: 'DELETE' });
        const j = await r.json().catch(() => null);
        if (!r.ok) throw new Error(j?.error || 'Falha ao deletar no InstagramBack');
      } else if (localId) {
        const r = await fetch(`/api/social/posts-mirror?id=${encodeURIComponent(localId)}`, { method: 'DELETE' });
        const j = await r.json().catch(() => null);
        if (!r.ok) throw new Error(j?.error || 'Falha ao deletar');
      } else {
        throw new Error('Não foi possível identificar o post para deletar.');
      }

      toast.success('Post deletado.');
      setHint('Post deletado.');
      setDeleteConfirmOpen(false);
      setDeleteTargetPost(null);
      await loadPostsMirror(selectedClientId);
    } catch (e: any) {
      const msg = String(e?.message || 'Erro ao deletar');
      toast.error(msg);
      setError(msg);
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{props.title}</h1>
            <p className="text-sm text-gray-600 mt-1">
              Perfil → Canais → Texto → Mídia (Firebase) → Agendar/Publicar (InstagramBack ou Meta).
            </p>
          </div>
          {props.backHref && (
            <Link className="text-sm text-gray-700 hover:text-gray-900 underline" href={props.backHref}>
              Voltar
            </Link>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 pb-28">
        {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
        {hint && (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            {hint}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Perfil / Canais / Texto / Data */}
          <div className="lg:col-span-4 space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">1. Selecione perfis</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                {clientsLoading ? (
                  <div className="space-y-2">
                    <div className="h-10 rounded-lg bg-gray-100" />
                    <div className="h-4 w-40 rounded bg-gray-100" />
                  </div>
                ) : (
                  <>
                    <Select value={selectedClientId} onValueChange={(v) => setSelectedClientId(v)}>
                      <SelectTrigger className="rounded-lg">
                        <SelectValue placeholder="Selecione um cliente">
                          <span className="flex items-center gap-2">
                            <span className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center border">
                              <User className="w-4 h-4 text-gray-600" />
                            </span>
                            <span className="text-sm font-medium text-gray-900">
                              {selectedClient ? safeName(selectedClient.name) : 'Selecione'}
                            </span>
                          </span>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {clients.length === 0 && <SelectItem value="__none">Nenhum cliente</SelectItem>}
                        {clients.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            <div className="flex items-center justify-between gap-3 w-full">
                              <span className="truncate">{c.name}</span>
                              {(c.city || c.state) && (
                                <span className="text-xs text-gray-500">
                                  {[c.city, c.state].filter(Boolean).join(' • ')}
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">O cliente conecta as redes em “Cliente → Redes Sociais”.</p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">2. Selecione canais</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs text-gray-600">
                    Selecionados: <span className="font-semibold">{selectedChannels.length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setBackend('instagramback')}
                      className={`text-xs rounded-full px-3 py-1 border ${
                        backend === 'instagramback'
                          ? 'bg-valle-blue-50 border-valle-blue-200 text-valle-blue-700'
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      InstagramBack
                    </button>
                    <button
                      type="button"
                      onClick={() => setBackend('meta')}
                      className={`text-xs rounded-full px-3 py-1 border ${
                        backend === 'meta'
                          ? 'bg-valle-blue-50 border-valle-blue-200 text-valle-blue-700'
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      Meta (OAuth)
                    </button>
                  </div>
                </div>

                {accountsLoading ? (
                  <div className="space-y-2">
                    <div className="h-9 rounded-lg bg-gray-100" />
                    <div className="h-9 rounded-lg bg-gray-100" />
                  </div>
                ) : accounts.length === 0 ? (
                  <div className="rounded-xl border bg-gray-50 p-3 text-sm text-gray-700 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 mt-0.5 text-gray-500" />
                    Nenhum canal conectado para este cliente ainda.
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    {accounts.map((a) => {
                      const selected = selectedChannels.some((c) => c.account_id === a.id);
                      return (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => toggleChannel(a)}
                          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-colors ${
                            selected ? 'bg-valle-blue-50 border-valle-blue-200 text-valle-blue-700' : 'bg-white hover:bg-gray-50'
                          }`}
                          title={a.display_name || a.username || a.external_account_id}
                        >
                          <span className="w-5 h-5 rounded-full bg-white border flex items-center justify-center text-gray-700">
                            {platformIcon(String(a.platform))}
                          </span>
                          <span className="max-w-[160px] truncate">
                            {a.display_name || (a.username ? `@${a.username}` : a.external_account_id)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">3. Texto do post</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Tipo</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPostType('image');
                        setFiles([]);
                        setUploadedUrls([]);
                      }}
                      className={`rounded-lg border px-3 py-2 text-sm flex items-center justify-center gap-2 ${
                        postType === 'image' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <ImageIcon className="w-4 h-4" />
                      Imagem
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPostType('video');
                        setFiles([]);
                        setUploadedUrls([]);
                      }}
                      className={`rounded-lg border px-3 py-2 text-sm flex items-center justify-center gap-2 ${
                        postType === 'video' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <VideoIcon className="w-4 h-4" />
                      Vídeo
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPostType('carousel');
                        setFiles([]);
                        setUploadedUrls([]);
                      }}
                      className={`rounded-lg border px-3 py-2 text-sm flex items-center justify-center gap-2 ${
                        postType === 'carousel' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Files className="w-4 h-4" />
                      Carrossel
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">{postType === 'carousel' ? 'Até 10 mídias (IG). FB: 1 mídia no momento.' : 'Selecione 1 arquivo.'}</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Legenda</label>
                  <Textarea value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Digite a legenda aqui…" className="min-h-[140px]" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Colaboradores (opcional)</label>
                  <input
                    value={collaborators}
                    onChange={(e) => setCollaborators(e.target.value)}
                    placeholder="@user1, @user2"
                    className="w-full h-10 rounded-lg border px-3 text-sm bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">5. Data e horário das publicações</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="w-full h-10 rounded-lg border px-3 text-sm bg-white"
                    />
                    <input
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="w-full h-10 rounded-lg border px-3 text-sm bg-white"
                    />
                  </div>
                  <p className="text-xs text-gray-500">Para “Publicar agora”, deixe em branco ou use a ação “Publicar agora”.</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Center: Mídias */}
          <div className="lg:col-span-5 space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">4. Mídias</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-4">
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" className="gap-2" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="w-4 h-4" />
                    Upload
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => openExternal('https://business.facebook.com/latest/content_calendar')}
                  >
                    Studio
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => openExternal('https://www.canva.com/')}
                  >
                    Canva
                  </Button>
                </div>

                <div
                  className={`rounded-xl border-2 border-dashed bg-gray-50 p-6 transition-colors ${
                    isDragging ? 'border-valle-blue-400 bg-valle-blue-50' : 'border-gray-300'
                  }`}
                  onDragEnter={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDragging(true);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDragging(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDragging(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDragging(false);
                    onSelectFiles(e.dataTransfer?.files || null);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                >
                  <input
                    ref={(el) => {
                      fileInputRef.current = el;
                    }}
                    type="file"
                    className="hidden"
                    accept={mediaAccept}
                    multiple={allowMultiple}
                    onChange={(e) => onSelectFiles(e.target.files)}
                  />

                  {!files.length ? (
                    <div className="text-center">
                      <div className="mx-auto w-12 h-12 rounded-xl bg-white border flex items-center justify-center">
                        <Upload className="w-5 h-5 text-gray-600" />
                      </div>
                      <p className="mt-3 text-sm font-medium text-gray-900">Imagens e vídeos</p>
                      <p className="mt-1 text-xs text-gray-500">Clique aqui ou arraste arquivos para enviar</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">Arquivos selecionados</p>
                        <button
                          type="button"
                          className="text-xs text-red-600 underline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFiles([]);
                            setUploadedUrls([]);
                          }}
                        >
                          Limpar
                        </button>
                      </div>

                      <div className={`grid gap-3 ${postType === 'carousel' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                        {localPreviews.map((p) => (
                          <div key={`${p.file.name}-${p.file.size}`} className="rounded-xl border bg-white overflow-hidden">
                            <div className="aspect-video bg-black/5 flex items-center justify-center">
                              {p.isVideo ? (
                                <video src={p.url} controls className="w-full h-full object-contain bg-black" />
                              ) : (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={p.url} alt={p.file.name} className="w-full h-full object-cover" />
                              )}
                            </div>
                            <div className="p-3">
                              <p className="text-sm font-medium text-gray-900 truncate">{p.file.name}</p>
                              <p className="text-xs text-gray-500">{Math.round(p.file.size / 1024)} KB</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="text-xs text-gray-600">
                  URLs carregadas: <span className="font-semibold">{uploadedUrls.length}</span>
                  {uploadedUrls.length > 0 && (
                    <div className="mt-2 grid grid-cols-1 gap-1">
                      {uploadedUrls.slice(0, 3).map((u) => (
                        <a key={u} href={u} target="_blank" rel="noreferrer" className="underline text-valle-blue-700">
                          {u}
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                {/* Campo de capa para carrossel de vídeo */}
                {postType === 'carousel' && files.length > 0 && files[0].type.startsWith('video/') && (
                  <div className="space-y-2 pt-4 border-t">
                    <label className="text-sm font-medium text-gray-700">Imagem de capa do carrossel</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setCoverFile(file);
                      }}
                      className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-valle-blue-50 file:text-valle-blue-700 hover:file:bg-valle-blue-100"
                    />
                    {coverFile && (
                      <p className="text-xs text-green-600">✓ Capa selecionada: {coverFile.name}</p>
                    )}
                    {coverUrl && (
                      <p className="text-xs text-green-600">✓ Capa enviada! <a href={coverUrl} target="_blank" rel="noreferrer" className="underline">Ver</a></p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: Preview / Ver todos */}
          <div className="lg:col-span-3 space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Preview</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <Tabs defaultValue="preview">
                  <TabsList className="w-full justify-between">
                    <TabsTrigger value="preview">Preview</TabsTrigger>
                    <TabsTrigger value="all">Ver todos</TabsTrigger>
                  </TabsList>

                  <TabsContent value="preview" className="mt-4">
                    <div className="rounded-xl border bg-white overflow-hidden">
                      <div className="p-3 flex items-center gap-2 border-b">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-500" />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900">{selectedClient?.name || 'Selecione um perfil'}</p>
                          <p className="text-xs text-gray-500">{selectedChannels.length ? `${selectedChannels.length} canal(is)` : 'Selecione canais'}</p>
                        </div>
                        <div className="flex items-center gap-1 text-gray-600">
                          {selectedChannels.slice(0, 2).map((c) => (
                            <span key={c.account_id} className="w-7 h-7 rounded-full border bg-white flex items-center justify-center">
                              {platformIcon(c.platform)}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="bg-gray-100">
                        {localPreviews.length === 0 ? (
                          <div className="aspect-square flex items-center justify-center text-xs text-gray-500">Selecione uma mídia para ver o preview</div>
                        ) : localPreviews[0].isVideo ? (
                          <div className="aspect-square">
                            <video src={localPreviews[0].url} controls className="w-full h-full object-contain bg-black" />
                          </div>
                        ) : (
                          <div className="aspect-square">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={localPreviews[0].url} alt="preview" className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>

                      <div className="p-3">
                        <p className="text-sm text-gray-800 whitespace-pre-wrap">{caption || 'Escreva a legenda para ver aqui…'}</p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="all" className="mt-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-semibold text-gray-900">Posts (Histórico)</p>
                      <Button type="button" variant="outline" size="sm" onClick={() => loadPostsMirror(selectedClientId)} disabled={loadingPosts}>
                        {loadingPosts ? 'Atualizando…' : 'Recarregar'}
                      </Button>
                    </div>

                    {posts.length === 0 && !loadingPosts && <p className="text-sm text-gray-600">Nenhum post encontrado.</p>}

                    <div className="space-y-3">
                      {posts.slice(0, 25).map((p: any) => {
                        const id = pickId(p) || String(p?.id || '');
                        const backendLabel = String(p?.backend || 'instagramback');
                        const status = String(p?.status || '');
                        const media = Array.isArray(p?.media_urls) ? p.media_urls : [];
                        return (
                          <div key={id || JSON.stringify(p).slice(0, 40)} className="rounded-xl border bg-white p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-gray-900">{p?.external_id ? `#${String(p.external_id)}` : `Post ${String(p.id).slice(0, 6)}`}</p>
                                <p className="text-xs text-gray-500">
                                  {backendLabel} • {status}
                                </p>
                              </div>
                              <button onClick={() => handleDelete(p)} className="text-xs underline text-red-600">
                                Deletar
                              </button>
                            </div>

                            {(p?.caption || p?.legenda) && <p className="text-sm mt-2 text-gray-700 line-clamp-3">{String(p?.caption || p?.legenda)}</p>}

                            {Array.isArray(media) && media.length > 0 && (
                              <div className="mt-2 grid grid-cols-2 gap-2">
                                {media.slice(0, 2).map((u: any) => (
                                  <a key={String(u)} href={String(u)} target="_blank" rel="noreferrer" className="text-xs underline text-valle-blue-700">
                                    mídia
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Bottom actions */}
      <div className="fixed inset-x-0 bottom-0 border-t bg-white">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="text-xs text-gray-600">
            <span className="font-medium text-gray-900">{files.length}</span> arquivo(s) •{' '}
            <span className="font-medium text-gray-900">{uploadedUrls.length}</span> URL(s) pronta(s)
          </div>

          <div className="flex items-center gap-2 justify-end">
            <Button type="button" variant="outline" onClick={handleUpload} disabled={uploading || !files.length}>
              {uploading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enviando…
                </span>
              ) : (
                'Enviar mídia'
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => createOrRecord('publish_now')}
              disabled={!!actionLoading}
            >
              {actionLoading === 'publish_now' ? 'Publicando…' : 'Publicar agora'}
            </Button>

            <div className="flex items-center">
              <Button type="button" onClick={() => createOrRecord('schedule')} disabled={!!actionLoading}>
                {actionLoading === 'schedule' ? 'Agendando…' : 'Agendar'}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="h-10 w-10 inline-flex items-center justify-center rounded-lg border-2 border-valle-blue-600 text-valle-blue-600 hover:bg-valle-blue-50 disabled:opacity-50 disabled:pointer-events-none"
                    aria-label="Mais opções"
                    disabled={!!actionLoading}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => createOrRecord('schedule')}>Agendar</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => createOrRecord('publish_now')}>Publicar agora</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => createOrRecord('draft')}>Salvar como rascunho</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => createOrRecord('approval')}>Enviar para aprovação</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => createOrRecord('schedule', { boost: true })}>Agendar e impulsionar</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => createOrRecord('publish_now', { boost: true })}>Publicar agora e impulsionar</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={deleteConfirmOpen}
        onClose={() => {
          if (deleteLoading) return;
          setDeleteConfirmOpen(false);
          setDeleteTargetPost(null);
        }}
        onConfirm={confirmDelete}
        title="Deletar post"
        message="Tem certeza que deseja deletar este post? Essa ação não pode ser desfeita."
        confirmText="Deletar"
        cancelText="Cancelar"
        variant="danger"
        loading={deleteLoading}
      />
    </div>
  );
}



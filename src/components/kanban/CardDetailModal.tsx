'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserSelector } from '@/components/kanban/UserSelector';
import { AREA_BOARDS, type AreaKey } from '@/lib/kanban/areaBoards';
import { MessageSquare, Send, X } from 'lucide-react';
import { fetchProfilesMapByAuthIds } from '@/lib/messaging/userProfiles';
import type { MentionCandidate } from '@/lib/mentions/types';
import { MentionsText } from '@/lib/mentions/render';
import { applyMentionReplacement, extractMentionUserIds, getActiveMentionQuery } from '@/lib/mentions/parse';
import { filterCandidates } from '@/lib/mentions/suggestions';

type Task = {
  id: string;
  title: string;
  description?: string | null;
  column_id: string;
  priority?: string | null;
  tags?: string[] | null;
  due_date?: string | null;
  assigned_to?: string | null;
};

type CommentRow = {
  id: string;
  task_id: string;
  user_id: string;
  comment: string;
  created_at: string;
  user_name?: string;
};

type CardDetailModalProps = {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
};

export function CardDetailModal({ task, isOpen, onClose, onUpdate }: CardDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'comments'>('comments');
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  const [mentionCandidates, setMentionCandidates] = useState<MentionCandidate[]>([]);
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionActiveRange, setMentionActiveRange] = useState<{ start: number; end: number } | null>(null);
  const commentInputRef = useRef<HTMLInputElement | null>(null);
  const [profilesById, setProfilesById] = useState<Map<string, any>>(new Map());

  const [handoffOpen, setHandoffOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);
  const [handoffAreaKey, setHandoffAreaKey] = useState<AreaKey>('designer_grafico');
  const [handoffUserId, setHandoffUserId] = useState<string | undefined>(undefined);
  const [handoffNote, setHandoffNote] = useState('');
  const [returnNote, setReturnNote] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    loadComments();
    setActiveTab('comments');
    loadCurrentUser();
    loadMentionCandidates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, task?.id]);

  const loadCurrentUser = async () => {
    try {
      const { data } = await supabase.auth.getUser();
      const uid = data?.user?.id ? String(data.user.id) : '';
      setCurrentUserId(uid);
    } catch {
      setCurrentUserId('');
    }
  };

  const loadMentionCandidates = async () => {
    // Base: equipe (employees) — compatível com RLS e já usado em outros componentes
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('user_id, full_name, email, is_active')
        .eq('is_active', true)
        .order('full_name')
        .limit(500);
      if (error) throw error;

      const list: MentionCandidate[] = (data || [])
        .map((r: any) => ({
          userId: String(r.user_id),
          label: String(r.full_name || 'Usuário'),
          email: r.email ? String(r.email) : undefined,
        }))
        .filter((c) => !!c.userId);

      setMentionCandidates(list);
    } catch (e) {
      console.error('Erro ao carregar candidatos de mention (employees):', e);
      setMentionCandidates([]);
    }
  };

  const loadComments = async () => {
    try {
      const { data, error } = await supabase
        .from('kanban_task_comments')
        .select('id, task_id, user_id, comment, created_at')
        .eq('task_id', task.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const userIds = Array.from(new Set((data || []).map((c: any) => c.user_id))).filter(Boolean) as string[];
      const nameByUserId = new Map<string, string>();

      if (userIds.length > 0) {
        const profilesMap = await fetchProfilesMapByAuthIds(supabase as any, userIds);
        userIds.forEach((uid) => {
          const n = profilesMap.get(uid)?.full_name;
          if (n) nameByUserId.set(uid, n);
        });
      }

      const formatted: CommentRow[] = (data || []).map((c: any) => ({
        ...c,
        user_name: nameByUserId.get(c.user_id) || 'Usuário',
      }));
      setComments(formatted);

      // Pré-carregar perfis usados nos mentions (para render)
      try {
        const allMentionIds = Array.from(
          new Set((data || []).flatMap((c: any) => extractMentionUserIds(String(c.comment || ''))))
        );
        if (allMentionIds.length > 0) {
          const m = await fetchProfilesMapByAuthIds(supabase as any, allMentionIds);
          setProfilesById(m as any);
        }
      } catch {
        // ignore
      }
    } catch (e) {
      console.error('Erro ao carregar comentários:', e);
    }
  };

  const filteredMentionCandidates = useMemo(() => {
    return filterCandidates(mentionCandidates, mentionQuery);
  }, [mentionCandidates, mentionQuery]);

  const refreshMentionStateFromInput = () => {
    const el = commentInputRef.current;
    if (!el) return;
    const value = String(el.value || '');
    const caret = typeof el.selectionStart === 'number' ? el.selectionStart : value.length;
    const active = getActiveMentionQuery(value, caret);
    if (!active.active) {
      setMentionOpen(false);
      setMentionQuery('');
      setMentionActiveRange(null);
      return;
    }
    setMentionOpen(true);
    setMentionQuery(active.query);
    setMentionActiveRange({ start: active.startIndex, end: active.endIndex });
  };

  const applyMention = (candidate: MentionCandidate) => {
    const el = commentInputRef.current;
    if (!el || !mentionActiveRange) return;

    const value = String(el.value || '');
    const { nextValue, nextCaretIndex } = applyMentionReplacement({
      value,
      startIndex: mentionActiveRange.start,
      endIndex: mentionActiveRange.end,
      userId: candidate.userId,
      trailingSpace: true,
    });

    setNewComment(nextValue);
    setMentionOpen(false);
    setMentionQuery('');
    setMentionActiveRange(null);

    // Reposicionar caret após o token
    requestAnimationFrame(() => {
      try {
        el.focus();
        el.setSelectionRange(nextCaretIndex, nextCaretIndex);
      } catch {
        // ignore
      }
    });
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmittingComment(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      if (!user) throw new Error('Usuário não autenticado');

      const { data: created, error } = await supabase
        .from('kanban_task_comments')
        .insert({
          task_id: task.id,
          user_id: user.id,
          comment: newComment.trim(),
        })
        .select('id')
        .single();
      if (error) throw error;

      // Processar mentions (best-effort)
      if (created?.id) {
        try {
          await fetch('/api/mentions/process', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              entityType: 'kanban_task_comment',
              entityId: created.id,
              taskId: task.id,
            }),
          });
        } catch {
          // ignore
        }
      }

      setNewComment('');
      await loadComments();
      onUpdate();
    } catch (e: any) {
      console.error('Erro ao comentar:', e);
      alert(e?.message || 'Erro ao comentar');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleAskOrigin = async () => {
    const msg = newComment.trim();
    if (!msg) return;

    setIsSubmittingComment(true);
    try {
      // 1) salvar comentário no card atual
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      if (!user) throw new Error('Usuário não autenticado');

      const { data: created, error } = await supabase
        .from('kanban_task_comments')
        .insert({
          task_id: task.id,
          user_id: user.id,
          comment: msg,
        })
        .select('id')
        .single();
      if (error) throw error;

      // Processar mentions (best-effort)
      if (created?.id) {
        try {
          await fetch('/api/mentions/process', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              entityType: 'kanban_task_comment',
              entityId: created.id,
              taskId: task.id,
            }),
          });
        } catch {
          // ignore
        }
      }

      setNewComment('');
      await loadComments();
      onUpdate();

      // 2) enviar a mesma mensagem para a tarefa de origem (Head/origem), se houver vínculo de handoff
      const res = await fetch('/api/kanban/handoff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'message_origin',
          taskId: task.id,
          message: msg,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        alert(data?.error || 'Comentário salvo, mas não consegui notificar o solicitante.');
        return;
      }
      alert('Mensagem enviada ao solicitante.');
    } catch (e: any) {
      console.error('Erro ao perguntar ao solicitante:', e);
      alert(e?.message || 'Erro ao perguntar ao solicitante');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleHandoff = async () => {
    try {
      const res = await fetch('/api/kanban/handoff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'forward',
          sourceTaskId: task.id,
          targetAreaKey: handoffAreaKey,
          targetUserId: handoffUserId,
          note: handoffNote || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        alert(data?.error || 'Erro ao encaminhar');
        return;
      }
      alert('Encaminhado com sucesso.');
      setHandoffOpen(false);
      setHandoffNote('');
      setHandoffUserId(undefined);
      onUpdate();
    } catch (e: any) {
      alert(e?.message || 'Erro ao encaminhar');
    }
  };

  const handleReturnToHead = async () => {
    try {
      const res = await fetch('/api/kanban/handoff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'return',
          taskId: task.id,
          note: returnNote || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        alert(data?.error || 'Erro ao enviar para o Head');
        return;
      }
      alert('Enviado para o Head com sucesso.');
      setReturnOpen(false);
      setReturnNote('');
      onUpdate();
    } catch (e: any) {
      alert(e?.message || 'Erro ao enviar para o Head');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <CardHeader className="border-b">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <CardTitle className="text-xl">{task.title}</CardTitle>
              {task.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 whitespace-pre-wrap">
                  {task.description}
                </p>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="mt-4 flex gap-2">
            <Button variant="outline" onClick={() => setHandoffOpen(true)}>
              Encaminhar
            </Button>
            <Button className="bg-primary hover:bg-[#1260b5]" onClick={() => setReturnOpen(true)}>
              Enviar para Head
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-4">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList>
              <TabsTrigger value="comments">
                <span className="inline-flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Comentários
                </span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="mt-4 space-y-4">
            <div className="space-y-3">
              {comments.length === 0 ? (
                <p className="text-sm text-gray-500">Nenhum comentário ainda</p>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{c.user_name || 'Usuário'}</p>
                      <p className="text-xs text-gray-500">{new Date(c.created_at).toLocaleString('pt-BR')}</p>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 whitespace-pre-wrap">
                      <MentionsText
                        text={c.comment}
                        profilesById={profilesById as any}
                        highlightUserId={currentUserId || undefined}
                      />
                    </p>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleAddComment} className="flex gap-2 items-start">
              <div className="relative flex-1">
                <Input
                  ref={commentInputRef as any}
                  value={newComment}
                  onChange={(e) => {
                    setNewComment(e.target.value);
                    // recalcular mention ativo com o cursor atual
                    requestAnimationFrame(() => refreshMentionStateFromInput());
                  }}
                  onKeyUp={() => refreshMentionStateFromInput()}
                  onClick={() => refreshMentionStateFromInput()}
                  onBlur={() => {
                    // deixa um pequeno delay para permitir click no dropdown
                    setTimeout(() => setMentionOpen(false), 150);
                  }}
                  placeholder="Escreva um comentário... (use @ para mencionar)"
                  disabled={isSubmittingComment}
                />

                {mentionOpen && filteredMentionCandidates.length > 0 && (
                  <div className="absolute left-0 right-0 bottom-full mb-2 z-50 rounded-lg border bg-white dark:bg-gray-900 shadow-lg overflow-hidden">
                    <div className="max-h-56 overflow-y-auto">
                      {filteredMentionCandidates.map((c) => (
                        <button
                          key={c.userId}
                          type="button"
                          onMouseDown={(ev) => ev.preventDefault()}
                          onClick={() => applyMention(c)}
                          className="w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {c.label}
                            {c.userId === currentUserId ? ' (você)' : ''}
                          </div>
                          {c.email && <div className="text-xs text-gray-500">{c.email}</div>}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <Button type="submit" disabled={isSubmittingComment || !newComment.trim()} title="Comentar">
                <Send className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={isSubmittingComment || !newComment.trim()}
                onClick={handleAskOrigin}
                title="Enviar esta mensagem também para o solicitante (Head/origem)"
              >
                Perguntar ao solicitante
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>

      {/* Modal Encaminhar */}
      {handoffOpen && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle>Encaminhar para outra área</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Área destino</label>
                <select
                  value={handoffAreaKey}
                  onChange={(e) => setHandoffAreaKey(e.target.value as AreaKey)}
                  className="mt-1 w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  {AREA_BOARDS.map((b) => (
                    <option key={b.areaKey} value={b.areaKey}>
                      {b.label}
                    </option>
                  ))}
                </select>
              </div>

              <UserSelector
                selectedUserId={handoffUserId}
                onSelect={(id) => setHandoffUserId(id)}
                label="Colaborador (opcional)"
                placeholder="Selecione quem vai executar (opcional)"
              />

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Nota</label>
                <Input value={handoffNote} onChange={(e) => setHandoffNote(e.target.value)} placeholder="Contexto para a área (opcional)" />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setHandoffOpen(false)}>
                  Cancelar
                </Button>
                <Button className="bg-primary hover:bg-[#1260b5]" onClick={handleHandoff}>
                  Encaminhar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal Retorno */}
      {returnOpen && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle>Enviar para o Head</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Nota de retorno</label>
                <Input value={returnNote} onChange={(e) => setReturnNote(e.target.value)} placeholder="Resumo do que foi feito / pendências" />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setReturnOpen(false)}>
                  Cancelar
                </Button>
                <Button className="bg-primary hover:bg-[#1260b5]" onClick={handleReturnToHead}>
                  Enviar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}



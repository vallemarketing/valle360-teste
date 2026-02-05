/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, X, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import type { ExecutiveRole } from '@/lib/csuite/executiveTypes';

type ChatMsg = { role: 'user' | 'assistant'; content: string };

function greetingFor(role: ExecutiveRole, name?: string | null) {
  const who = name ? `${name}` : role.toUpperCase();
  switch (role) {
    case 'ceo':
      return `Olá! Sou ${who}, sua CEO virtual (consultiva). Posso sintetizar inputs dos C-Levels, estruturar decisões e propor planos com CTAs (sempre com sua confirmação). O que você quer decidir?`;
    case 'coo':
      return `Olá! Sou ${who}, sua COO virtual (consultiva). Posso analisar execução, prazos, capacidade e gargalos, e propor um plano com CTAs (com sua confirmação). Qual projeto/área está mais crítica?`;
    case 'cco':
      return `Olá! Sou ${who}, sua CCO virtual (consultiva). Posso analisar saúde de clientes, churn, inadimplência e oportunidades de expansão, com CTAs (com sua confirmação). Qual cliente/segmento você quer avaliar?`;
    default:
      return `Olá! Sou ${who}. Como posso ajudar?`;
  }
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

export function ExecutiveChatModal(props: {
  role: ExecutiveRole;
  execName?: string | null;
  title: string;
  subtitle: string;
  buttonClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: 'assistant', content: greetingFor(props.role, props.execName || null) },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [includeMarket, setIncludeMarket] = useState(false);

  const canSend = useMemo(() => input.trim().length > 0 && !typing, [input, typing]);

  const send = async () => {
    const text = input.trim();
    if (!text || typing) return;
    setInput('');
    const nextHistory: ChatMsg[] = [...messages, { role: 'user', content: text }];
    setMessages(nextHistory);
    setTyping(true);

    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/admin/csuite/executive-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({
          role: props.role,
          message: text,
          history: nextHistory,
          conversation_id: conversationId,
          include_market: includeMarket,
        }),
      });
      const data = await res.json().catch(() => null);
      const reply = data?.reply ? String(data.reply) : 'Não consegui responder agora.';
      if (data?.conversation_id && !conversationId) setConversationId(String(data.conversation_id));
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Falha ao conversar agora. Tente novamente em instantes.' },
      ]);
    } finally {
      setTyping(false);
    }
  };

  return (
    <>
      <Button className={cn('bg-[#1672d6] hover:bg-[#1260b5]', props.buttonClassName)} onClick={() => setOpen(true)}>
        <MessageSquare className="w-4 h-4 mr-2" />
        {props.title}
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col h-[680px]"
              style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-light)' }}>
                <div>
                  <div className="font-bold" style={{ color: 'var(--text-primary)' }}>
                    {props.title}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    {props.subtitle}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIncludeMarket((v) => !v)}
                    className={cn(
                      'px-2 py-1 rounded-lg text-xs border flex items-center gap-1',
                      includeMarket ? 'bg-blue-50' : 'bg-transparent'
                    )}
                    style={{ borderColor: 'var(--border-light)', color: 'var(--text-primary)' }}
                    title="Usar Perplexity Sonar para contexto de mercado"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    Mercado
                  </button>
                  <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-auto p-4 space-y-3" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                {messages.map((m, idx) => (
                  <div key={idx} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                    <div
                      className={cn(
                        'max-w-[85%] px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap',
                        m.role === 'user' ? 'bg-[#1672d6] text-white rounded-br-none' : 'bg-white rounded-bl-none'
                      )}
                      style={m.role === 'assistant' ? { color: 'var(--text-primary)' } : undefined}
                    >
                      {m.content}
                    </div>
                  </div>
                ))}
                {typing && (
                  <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    Digitando…
                  </div>
                )}
              </div>

              <div className="p-3 border-t flex items-center gap-2" style={{ borderColor: 'var(--border-light)' }}>
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') send();
                  }}
                  placeholder="Digite sua pergunta…"
                  className="flex-1 px-3 py-2 rounded-xl border text-sm bg-transparent outline-none"
                  style={{ borderColor: 'var(--border-light)', color: 'var(--text-primary)' }}
                />
                <Button onClick={send} disabled={!canSend} className="bg-[#1672d6] hover:bg-[#1260b5]">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}


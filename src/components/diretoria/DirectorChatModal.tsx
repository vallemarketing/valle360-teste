/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MessageSquare, Send, X } from 'lucide-react';

type DirectorKey = 'cfo' | 'cto' | 'cmo' | 'chro';
type ChatMsg = { role: 'user' | 'assistant'; content: string };

function greetingFor(director: DirectorKey) {
  switch (director) {
    case 'cfo':
      return 'Olá! Sou seu CFO Virtual. Posso avaliar receita, cobranças, inadimplência e riscos financeiros com base nos dados do sistema. O que você quer verificar?';
    case 'cto':
      return 'Olá! Sou seu CTO Virtual. Posso avaliar eficiência operacional, SLA, WIP, gargalos e qualidade usando dados do Kanban e eventos. Por onde começamos?';
    case 'cmo':
      return 'Olá! Sou seu CMO Virtual. Posso avaliar performance, churn, engajamento e oportunidades de crescimento com base nos dados do sistema. Qual objetivo do mês?';
    case 'chro':
      return 'Olá! Sou seu CHRO Virtual. Posso avaliar solicitações, carga, clima e riscos de turnover com base nos dados do sistema. Como posso ajudar?';
    default:
      return 'Olá! Como posso ajudar?';
  }
}

export function DirectorChatModal(props: { director: DirectorKey; title: string; subtitle: string; buttonClassName?: string }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([{ role: 'assistant', content: greetingFor(props.director) }]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);

  const canSend = useMemo(() => input.trim().length > 0 && !typing, [input, typing]);

  const send = async () => {
    const text = input.trim();
    if (!text || typing) return;
    setInput('');
    const nextHistory: ChatMsg[] = [...messages, { role: 'user', content: text }];
    setMessages(nextHistory);
    setTyping(true);

    try {
      const res = await fetch('/api/admin/diretoria/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ director: props.director, message: text, history: nextHistory }),
      });
      const data = await res.json().catch(() => null);
      const reply = data?.reply ? String(data.reply) : 'Não consegui responder agora.';
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
              className="w-full max-w-xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col h-[640px]"
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
                <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                  <X className="w-5 h-5" />
                </Button>
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




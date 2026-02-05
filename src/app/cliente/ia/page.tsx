'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Send, Sparkles, TrendingUp, Calendar, Users, Target, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
}

const QUICK_PROMPTS = [
  { text: 'Quero uma análise geral da evolução da minha marca', icon: TrendingUp, color: 'from-valle-blue-500 to-valle-blue-600' },
  { text: 'Traga novidades do meu setor', icon: Target, color: 'from-green-500 to-green-600' },
  { text: 'Quero agendar uma reunião com a equipe que cuida da minha conta', icon: Calendar, color: 'from-purple-500 to-purple-600' },
  { text: 'O que meus concorrentes estão fazendo?', icon: Users, color: 'from-amber-500 to-amber-600' },
]

export default function ClienteIAPage() {
  const [rotation, setRotation] = useState(0)
  const [isTyping, setIsTyping] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [clientFirstName, setClientFirstName] = useState('Cliente')
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'seed', role: 'assistant', content: 'Olá! Sou a Val, sua assistente de IA. Como posso ajudar hoje?' },
  ])

  const listRef = useRef<HTMLDivElement>(null)
  const scrollToBottom = () => listRef.current?.scrollIntoView({ behavior: 'smooth' })

  useEffect(() => {
    const rotationInterval = setInterval(() => setRotation((prev) => (prev + 1) % 360), 20)
    return () => clearInterval(rotationInterval)
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: profile } = await supabase
          .from('user_profiles')
          .select('full_name')
          .eq('user_id', user.id)
          .maybeSingle()

        const name = String((profile as any)?.full_name || user.email?.split('@')[0] || 'Cliente')
        const first = name.split(' ')[0] || 'Cliente'
        if (mounted) setClientFirstName(first)
      } catch {
        // ignore
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  const historyPayload = useMemo(
    () =>
      messages
        .slice(-10)
        .filter((m) => m.id !== 'seed')
        .map((m) => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.content,
        })),
    [messages]
  )

  const sendToVal = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || isTyping) return

    const userMsg: ChatMessage = { id: String(Date.now()), role: 'user', content: trimmed }
    setMessages((prev) => [...prev, userMsg])
    setInputValue('')
    setIsTyping(true)

    try {
      const res = await fetch('/api/ai/val', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          context: { webSearch: false },
          history: historyPayload,
        }),
      })

      const data = await res.json().catch(() => null)
      const answer = data?.response?.message || data?.response || data?.message

      if (!res.ok || !answer) {
        throw new Error(data?.error || 'Falha ao consultar a Val')
      }

      setMessages((prev) => [
        ...prev,
        { id: String(Date.now() + 1), role: 'assistant', content: String(answer) },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now() + 1),
          role: 'assistant',
          content: 'Tive um problema para responder agora. Pode tentar de novo em alguns segundos?',
        },
      ])
    } finally {
      setIsTyping(false)
    }
  }

  return (
    <div className="pb-24 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-valle-navy-900 dark:text-white">Assistente IA Valle</h1>
        <p className="text-valle-silver-600 dark:text-white/60 mt-2">Seu consultor inteligente de marketing</p>
      </div>

      <Card className="border-2 border-valle-blue-300 bg-gradient-to-br from-white via-valle-blue-50 to-valle-blue-100 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-valle-blue-300/40 to-transparent rounded-full blur-3xl animate-pulse" />

        <CardContent className="p-6 md:p-8 relative z-10 space-y-6">
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-5">
              <div className="absolute inset-0 bg-gradient-to-r from-valle-blue-400 to-valle-blue-600 rounded-full blur-2xl opacity-50 animate-pulse" />
              <div
                className="relative w-20 h-20 rounded-full flex items-center justify-center shadow-2xl border-4 border-white"
                style={{
                  background: 'linear-gradient(135deg, #1672d6 0%, #001533 100%)',
                  transform: `rotate(${rotation}deg)`,
                  transition: 'transform 0.02s linear',
                }}
              >
                <div className="absolute inset-1.5 rounded-full border-2 border-dashed border-white/40" />
                <Sparkles className="w-10 h-10 text-white drop-shadow-lg" style={{ transform: `rotate(-${rotation}deg)` }} />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-valle-navy-900 mb-2">
              Olá, {clientFirstName}!
            </h2>
            <p className="text-valle-navy-700 max-w-2xl">
              Sou a <span className="font-bold text-valle-blue-600">Val</span>. Posso ajudar com análises,
              insights do mercado, concorrentes e próximos passos.
            </p>

            <div className="flex items-center gap-2 mt-4">
              <Badge className="bg-green-600 text-white border-0">
                <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse" />
                Online
              </Badge>
              <Badge className="bg-valle-blue-600 text-white border-0">IA Ativa</Badge>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {QUICK_PROMPTS.map((prompt, index) => {
              const Icon = prompt.icon
              return (
                <button
                  key={index}
                  onClick={() => sendToVal(prompt.text)}
                  className={cn(
                    'p-4 rounded-xl text-left border border-valle-blue-200 bg-white/70 hover:bg-white transition-all',
                    'hover:shadow-xl hover:-translate-y-0.5'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn('w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center', prompt.color)}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-valle-navy-900">{prompt.text}</p>
                      <p className="text-sm text-valle-silver-600 mt-1">Clique para enviar</p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          <div className="rounded-2xl border border-valle-blue-200 bg-white/80 overflow-hidden">
            <div className="max-h-[45vh] overflow-y-auto p-4 space-y-3">
              {messages.map((m) => (
                <div key={m.id} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                  <div
                    className={cn(
                      'max-w-[85%] rounded-2xl px-4 py-3 text-sm',
                      m.role === 'user'
                        ? 'bg-[#1672d6] text-white rounded-tr-none'
                        : 'bg-[#001533]/5 text-[#001533] rounded-tl-none'
                    )}
                  >
                    {m.content}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-[#001533]/5 text-[#001533] rounded-2xl rounded-tl-none px-4 py-3 text-sm flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Pensando…
                  </div>
                </div>
              )}
              <div ref={listRef} />
            </div>

            <div className="p-4 border-t border-valle-blue-200 bg-white">
              <div className="flex items-center gap-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Digite sua mensagem…"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') sendToVal(inputValue)
                  }}
                  disabled={isTyping}
                />
                <Button
                  onClick={() => sendToVal(inputValue)}
                  disabled={isTyping || !inputValue.trim()}
                  className="bg-[#1672d6] hover:bg-[#1260b5]"
                >
                  {isTyping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}



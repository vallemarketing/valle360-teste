'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send, Paperclip, Command, Loader, Sparkles,
  TrendingUp, Target, Users, DollarSign, Palette,
  Megaphone, BarChart3
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface CommandSuggestion {
  icon: React.ReactNode
  label: string
  description: string
  prefix: string
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

function normalizeSources(input: any): string[] {
  if (!input) return []
  if (Array.isArray(input)) return input.map((x) => String(x)).filter(Boolean)
  return [String(input)].filter(Boolean)
}

export default function ValIAPage() {
  const [userName, setUserName] = useState('')
  const [userArea, setUserArea] = useState('')
  const [value, setValue] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [showCommandPalette, setShowCommandPalette] = useState(false)
  const [activeSuggestion, setActiveSuggestion] = useState(-1)
  const [inputFocused, setInputFocused] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    loadUserInfo()
  }, [])

  useEffect(() => {
    if (value.startsWith('/') && !value.includes(' ')) {
      setShowCommandPalette(true)
      const matchingIndex = commandSuggestions.findIndex(cmd => cmd.prefix.startsWith(value))
      setActiveSuggestion(matchingIndex >= 0 ? matchingIndex : -1)
    } else {
      setShowCommandPalette(false)
    }
  }, [value])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const loadUserInfo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('full_name')
        .eq('user_id', user.id)
        .single()

      const { data: employee } = await supabase
        .from('employees')
        .select('area_of_expertise')
        .eq('user_id', user.id)
        .single()

      const area = employee?.area_of_expertise || 'Marketing'
      
      setUserName(profile?.full_name?.split(' ')[0] || 'Colaborador')
      setUserArea(area)
    } catch (error) {
      console.error('Erro ao carregar usuário:', error)
      setUserName('Colaborador')
      setUserArea('Marketing')
    }
  }

  const commandSuggestions: CommandSuggestion[] = [
    { 
      icon: <BarChart3 className="w-4 h-4" />, 
      label: 'Analisar Performance', 
      description: 'Análise detalhada do seu desempenho', 
      prefix: '/performance' 
    },
    { 
      icon: <Target className="w-4 h-4" />, 
      label: 'Minhas Metas', 
      description: 'Ver progresso e criar novas metas', 
      prefix: '/metas' 
    },
    { 
      icon: <TrendingUp className="w-4 h-4" />, 
      label: 'Sugestões de Melhoria', 
      description: 'Dicas personalizadas para você', 
      prefix: '/sugestoes' 
    },
    { 
      icon: <Sparkles className="w-4 h-4" />, 
      label: 'Inspiração', 
      description: 'Ideias criativas para seus projetos', 
      prefix: '/inspiracao' 
    },
  ]

  // Icebreaker questions based on user area
  const icebreakerQuestions = {
    'Comercial': [
      'Como estão meus leads este mês?',
      'Me ajude a vencer uma objeção',
      'Qual o melhor horário para prospectar?',
      'Sugestões de upsell para meus clientes'
    ],
    'Tráfego Pago': [
      'Como melhorar meu ROAS?',
      'Sugestões de ajustes nas campanhas',
      'Análise de públicos potenciais',
      'Tendências de ads para este mês'
    ],
    'Designer Gráfico': [
      'Tendências de design atual',
      'Feedback sobre meu último trabalho',
      'Sugestões de paletas de cores',
      'Inspiração para novo projeto'
    ],
    'Web Designer': [
      'Melhores práticas de UX',
      'Tendências de UI 2024',
      'Como melhorar conversão',
      'Inspiração para landing pages'
    ],
    'Head de Marketing': [
      'Análise de campanhas atuais',
      'ROI por canal de marketing',
      'Análise de concorrentes',
      'Estratégias para Q4'
    ],
    'RH': [
      'Análise de engajamento da equipe',
      'Sugestões de intervenções',
      'Previsão de churn de colaboradores',
      'Estratégias de retenção'
    ],
    'Financeiro': [
      'Análise de receita mensal',
      'Clientes em atraso',
      'Previsão de faturamento',
      'Oportunidades de redução de custos'
    ],
    'default': [
      'Como está meu desempenho?',
      'O que preciso melhorar?',
      'Sugestões para minhas metas',
      'Como posso ser mais produtivo?'
    ]
  }

  const currentIcebreakers = icebreakerQuestions[userArea as keyof typeof icebreakerQuestions] || icebreakerQuestions.default

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showCommandPalette) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveSuggestion(prev => prev < commandSuggestions.length - 1 ? prev + 1 : 0)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveSuggestion(prev => prev > 0 ? prev - 1 : commandSuggestions.length - 1)
      } else if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault()
        if (activeSuggestion >= 0) {
          selectCommandSuggestion(activeSuggestion)
        }
      } else if (e.key === 'Escape') {
        e.preventDefault()
        setShowCommandPalette(false)
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (value.trim()) {
        handleSendMessage()
      }
    }
  }

  const selectCommandSuggestion = (index: number) => {
    const selected = commandSuggestions[index]
    setValue(selected.prefix + ' ')
    setShowCommandPalette(false)
  }

  const handleSendMessage = async () => {
    if (!value.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: value,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setValue('')
    setIsTyping(true)

    try {
      const history = [...messages, userMessage]
        .slice(-10)
        .map((m) => ({ role: m.role, content: m.content }))

      const res = await fetch('/api/ai/val', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          context: { userArea },
          history,
        }),
      })

      const data = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(data?.error || 'Erro ao conversar com a Val')
      }

      const aiText = String(data?.response?.message || data?.message || data?.data?.message || '').trim()
      const sources = normalizeSources(data?.response?.sources || data?.sources)

      const finalText =
        (aiText || 'Não consegui responder agora. Pode tentar novamente?') +
        (sources.length
          ? `\n\nFontes:\n${sources.slice(0, 8).map((u) => `- ${u}`).join('\n')}`
          : '')

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: finalText,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, aiMessage])
    } catch (e: any) {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: e?.message || 'Erro ao conversar com a Val',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, aiMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const handleIcebreakerClick = (question: string) => {
    setValue(question)
  }

  const adjustHeight = () => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = '60px'
    const newHeight = Math.max(60, Math.min(textarea.scrollHeight, 200))
    textarea.style.height = `${newHeight}px`
  }

  return (
    <div className="h-[calc(100vh-73px)] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Animated Background Blurs */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
        <div 
          className="absolute top-0 left-1/4 w-96 h-96 rounded-full mix-blend-normal filter blur-[128px] animate-pulse"
          style={{ backgroundColor: 'var(--primary-500)', opacity: 0.1 }}
        />
        <div 
          className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full mix-blend-normal filter blur-[128px] animate-pulse"
          style={{ backgroundColor: 'var(--primary-500)', opacity: 0.1, animationDelay: '700ms' }}
        />
        <div 
          className="absolute top-1/4 right-1/3 w-64 h-64 rounded-full mix-blend-normal filter blur-[96px] animate-pulse"
          style={{ backgroundColor: 'var(--primary-400)', opacity: 0.08, animationDelay: '1000ms' }}
        />
      </div>

      <div className="w-full max-w-3xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          {/* Header */}
          {messages.length === 0 && (
            <div className="text-center space-y-3">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div 
                    className="p-4 rounded-2xl"
                    style={{ backgroundColor: 'var(--primary-50)' }}
                  >
                    <Sparkles className="w-8 h-8" style={{ color: 'var(--primary-500)' }} />
                  </div>
                </div>
                <h1 
                  className="text-3xl font-semibold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Olá, {userName}! Seja bem-vindo 👋
                </h1>
                <h2 
                  className="text-xl font-medium mt-2"
                  style={{ color: 'var(--primary-600)' }}
                >
                  Eu sou a Val!
                </h2>
                <p style={{ color: 'var(--text-secondary)' }}>
                  Como posso te ajudar hoje?
                </p>
              </motion.div>
            </div>
          )}

          {/* Messages History */}
          {messages.length > 0 && (
            <div className="space-y-4 max-h-[50vh] overflow-y-auto px-2">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    'flex',
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div
                    className={cn(
                      'max-w-[80%] px-4 py-3 rounded-2xl',
                      msg.role === 'user' ? 'text-white' : 'border-l-4'
                    )}
                    style={
                      msg.role === 'user'
                        ? { backgroundImage: 'var(--gradient-primary)' }
                        : { 
                            backgroundColor: 'var(--bg-primary)',
                            borderColor: 'var(--primary-500)',
                            color: 'var(--text-primary)'
                          }
                    }
                  >
                    {msg.role === 'assistant' && (
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4" style={{ color: 'var(--primary-500)' }} />
                        <span className="text-xs font-semibold" style={{ color: 'var(--primary-700)' }}>
                          Val
                        </span>
                      </div>
                    )}
                    <p className="text-sm">{msg.content}</p>
                    <span 
                      className={cn(
                        'text-xs mt-1 block',
                        msg.role === 'user' ? 'text-white/70' : ''
                      )}
                      style={msg.role === 'assistant' ? { color: 'var(--text-tertiary)' } : {}}
                    >
                      {msg.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </motion.div>
              ))}

              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div 
                    className="px-4 py-3 rounded-2xl border-l-4"
                    style={{
                      backgroundColor: 'var(--bg-primary)',
                      borderColor: 'var(--primary-500)',
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 animate-pulse" style={{ color: 'var(--primary-500)' }} />
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Val está digitando...</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* Input Area */}
          <motion.div
            initial={{ scale: 0.98 }}
            animate={{ scale: 1 }}
            className="relative backdrop-blur-xl rounded-2xl border shadow-2xl"
            style={{
              backgroundColor: 'var(--bg-primary)',
              borderColor: 'var(--border-light)',
            }}
          >
            {/* Command Palette */}
            <AnimatePresence>
              {showCommandPalette && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="absolute left-0 right-0 bottom-full mb-2 rounded-xl border shadow-lg overflow-hidden"
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    borderColor: 'var(--border-medium)',
                  }}
                >
                  {commandSuggestions.map((suggestion, index) => (
                    <motion.div
                      key={suggestion.prefix}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.03 }}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors',
                        activeSuggestion === index ? '' : ''
                      )}
                      style={{
                        backgroundColor: activeSuggestion === index ? 'var(--primary-50)' : 'transparent',
                        color: activeSuggestion === index ? 'var(--primary-700)' : 'var(--text-secondary)',
                      }}
                      onClick={() => selectCommandSuggestion(index)}
                    >
                      <div className="w-8 h-8 flex items-center justify-center rounded-lg" style={{ backgroundColor: 'var(--primary-100)' }}>
                        {suggestion.icon}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{suggestion.label}</div>
                        <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                          {suggestion.description}
                        </div>
                      </div>
                      <div className="text-xs font-mono px-2 py-1 rounded" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-tertiary)' }}>
                        {suggestion.prefix}
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="p-4">
              <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => {
                  setValue(e.target.value)
                  adjustHeight()
                }}
                onKeyDown={handleKeyDown}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                placeholder="Pergunte algo para a Val..."
                className="w-full px-4 py-3 resize-none bg-transparent border-none focus:outline-none text-sm"
                style={{
                  color: 'var(--text-primary)',
                  minHeight: '60px',
                  maxHeight: '200px',
                }}
              />
            </div>

            <div 
              className="px-4 pb-4 pt-2 border-t flex items-center justify-between"
              style={{ borderColor: 'var(--border-light)' }}
            >
              <div className="flex gap-2">
                <button 
                  className="p-2 rounded-lg hover:scale-110 transition-all"
                  style={{ backgroundColor: 'var(--bg-secondary)' }}
                >
                  <Paperclip className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                </button>
                <button
                  onClick={() => setShowCommandPalette(!showCommandPalette)}
                  className="p-2 rounded-lg hover:scale-110 transition-all"
                  style={{ 
                    backgroundColor: showCommandPalette ? 'var(--primary-50)' : 'var(--bg-secondary)',
                    color: showCommandPalette ? 'var(--primary-500)' : 'var(--text-secondary)'
                  }}
                >
                  <Command className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={handleSendMessage}
                disabled={!value.trim() || isTyping}
                className={cn(
                  'px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-all',
                  value.trim() ? 'hover:scale-105' : 'opacity-50 cursor-not-allowed'
                )}
                style={{
                  backgroundColor: value.trim() ? 'var(--primary-500)' : 'var(--bg-tertiary)',
                  color: value.trim() ? 'white' : 'var(--text-disabled)',
                }}
              >
                {isTyping ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>Enviar</span>
              </button>
            </div>
          </motion.div>

          {/* Icebreaker Questions */}
          {messages.length === 0 && (
            <div className="flex flex-wrap justify-center gap-3">
              {currentIcebreakers.map((question, index) => (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  onClick={() => handleIcebreakerClick(question)}
                  className="px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-105 border"
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    borderColor: 'var(--border-light)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {question}
                </motion.button>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Mouse follower blur (when focused) */}
      {inputFocused && (
        <motion.div
          className="fixed w-[50rem] h-[50rem] rounded-full pointer-events-none z-0 opacity-[0.02] blur-[96px]"
          animate={{
            x: mousePosition.x - 400,
            y: mousePosition.y - 400,
          }}
          transition={{
            type: 'spring',
            damping: 25,
            stiffness: 150,
            mass: 0.5,
          }}
          style={{
            background: 'linear-gradient(to right, var(--primary-500), var(--primary-500))',
          }}
        />
      )}
    </div>
  )
}


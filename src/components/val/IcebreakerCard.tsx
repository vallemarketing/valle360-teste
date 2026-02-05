'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Send, Clock, TrendingUp, MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface IcebreakerCardProps {
  area: string
  className?: string
}

export function IcebreakerCard({ area, className }: IcebreakerCardProps) {
  const [question, setQuestion] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [answer, setAnswer] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [streak, setStreak] = useState(0)

  useEffect(() => {
    loadDailyQuestion()
  }, [area])

  const loadDailyQuestion = async () => {
    try {
      const response = await fetch(`/api/val/icebreaker?area=${encodeURIComponent(area)}`)
      if (response.ok) {
        const data = await response.json()
        setQuestion(data.question)
        setStreak(data.streak || 0)
        
        // Check if already answered today
        const answeredToday = localStorage.getItem(`icebreaker_${area}_${new Date().toDateString()}`)
        if (answeredToday) {
          setSubmitted(true)
          setAnswer(answeredToday)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar quebra-gelo:', error)
      setQuestion('O que você aprendeu de novo hoje?') // Fallback
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!answer.trim()) return

    try {
      await fetch('/api/val/icebreaker/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          area,
          question,
          answer,
          date: new Date().toISOString()
        })
      })

      // Save locally
      localStorage.setItem(`icebreaker_${area}_${new Date().toDateString()}`, answer)
      setSubmitted(true)
      setStreak(prev => prev + 1)
    } catch (error) {
      console.error('Erro ao salvar resposta:', error)
    }
  }

  if (loading) {
    return (
      <div 
        className={cn(
          "rounded-2xl p-6 border backdrop-blur-sm animate-pulse",
          "bg-white/60 dark:bg-neutral-800/60",
          "border-purple-200 dark:border-purple-800",
          className
        )}
        style={{
          background: 'linear-gradient(135deg, var(--primary-50) 0%, var(--purple-50) 100%)'
        }}
      >
        <div className="h-32 flex items-center justify-center">
          <Sparkles className="w-8 h-8 animate-spin" style={{ color: 'var(--primary-500)' }} />
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-2xl p-6 border backdrop-blur-sm relative overflow-hidden",
        "bg-white/60 dark:bg-neutral-800/60",
        "border-purple-200 dark:border-purple-800",
        className
      )}
      style={{
        background: 'linear-gradient(135deg, var(--primary-50) 0%, var(--purple-50) 100%)'
      }}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
        <Sparkles className="w-full h-full" style={{ color: 'var(--primary-700)' }} />
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ 
              backgroundColor: 'var(--primary-100)',
              color: 'var(--primary-700)'
            }}
          >
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 
              className="text-lg font-semibold"
              style={{ color: 'var(--primary-900)' }}
            >
              Pergunta do Dia da Val
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
              {area}
            </p>
          </div>
        </div>

        {streak > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{
              backgroundColor: 'var(--warning-100)',
              color: 'var(--warning-700)'
            }}
          >
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-semibold">{streak} dias</span>
          </motion.div>
        )}
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={question}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          className="mb-6 relative z-10"
        >
          <div 
            className="flex items-start gap-3 p-4 rounded-xl"
            style={{ backgroundColor: 'var(--bg-primary)' }}
          >
            <MessageCircle 
              className="w-5 h-5 flex-shrink-0 mt-0.5" 
              style={{ color: 'var(--primary-600)' }}
            />
            <p 
              className="text-lg font-medium leading-relaxed"
              style={{ color: 'var(--text-primary)' }}
            >
              {question}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Answer Input or Submitted State */}
      <AnimatePresence mode="wait">
        {!submitted ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3 relative z-10"
          >
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Compartilhe sua resposta..."
              className="w-full px-4 py-3 rounded-xl border resize-none focus:outline-none focus:ring-2 transition-all"
              style={{
                backgroundColor: 'var(--bg-primary)',
                borderColor: 'var(--border-light)',
                color: 'var(--text-primary)'
              }}
              rows={3}
              maxLength={500}
            />
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                {answer.length}/500 caracteres
              </span>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={!answer.trim()}
                className="px-6 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                style={{
                  backgroundColor: '#4370d1',
                  color: 'white'
                }}
              >
                <Send className="w-4 h-4" />
                Enviar
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-6 relative z-10"
          >
            <div 
              className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ backgroundColor: 'var(--success-100)' }}
            >
              <Clock 
                className="w-8 h-8" 
                style={{ color: 'var(--success-600)' }}
              />
            </div>
            <p 
              className="font-semibold mb-2"
              style={{ color: 'var(--success-700)' }}
            >
              Obrigada por compartilhar! 💜
            </p>
            <p 
              className="text-sm"
              style={{ color: 'var(--text-secondary)' }}
            >
              Volte amanhã para uma nova pergunta
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}



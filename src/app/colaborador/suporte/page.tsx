'use client'

import { useState } from 'react'
import { MessageSquare, Send, AlertTriangle, Monitor, Shield, FileQuestion, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

export default function SuportePage() {
  const [ticketType, setTicketType] = useState('technical')
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('medium')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    toast.success('Chamado aberto com sucesso! Ticket #1234')
    setSubject('')
    setDescription('')
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-8 flex justify-center">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Central de Suporte</h1>
          <p className="text-gray-500">
            Problemas técnicos ou dúvidas? Abra um chamado para a equipe de TI.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100">
            {/* Sidebar de Tipos */}
            <div className="p-6 bg-gray-50/50 space-y-2">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                Tipo de Problema
              </h3>
              {[
                { id: 'technical', label: 'Problema Técnico', icon: Monitor },
                { id: 'access', label: 'Acesso / Login', icon: Shield },
                { id: 'question', label: 'Dúvida Geral', icon: FileQuestion },
                { id: 'suggestion', label: 'Sugestão', icon: MessageSquare }
              ].map((type) => (
                <button
                  key={type.id}
                  onClick={() => setTicketType(type.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    ticketType === type.id
                      ? 'bg-white text-indigo-600 shadow-md ring-1 ring-gray-100'
                      : 'text-gray-600 hover:bg-white hover:shadow-sm'
                  }`}
                >
                  <type.icon size={18} />
                  {type.label}
                </button>
              ))}
            </div>

            {/* Form */}
            <div className="col-span-2 p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assunto
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                    placeholder="Resumo do problema..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prioridade
                  </label>
                  <div className="flex gap-4">
                    {['low', 'medium', 'high'].map((p) => (
                      <label key={p} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="priority"
                          value={p}
                          checked={priority === p}
                          onChange={(e) => setPriority(e.target.value)}
                          className="text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-gray-600 capitalize">
                          {p === 'low' ? 'Baixa' : p === 'medium' ? 'Média' : 'Alta'}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição Detalhada
                  </label>
                  <textarea
                    rows={5}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none resize-none"
                    placeholder="Descreva o que aconteceu, passos para reproduzir, mensagens de erro..."
                    required
                  ></textarea>
                </div>

                {/* Warning Box */}
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-100 flex gap-3 items-start">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-yellow-700">
                    O tempo médio de resposta para tickets de prioridade média é de <strong>4 horas</strong> úteis.
                  </p>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transform hover:-translate-y-0.5"
                  >
                    <Send size={18} />
                    Abrir Chamado
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

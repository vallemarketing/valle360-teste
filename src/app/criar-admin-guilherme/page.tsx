'use client'

import { useState } from 'react'

export default function CriarAdminPage() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const criarAdmin = async () => {
    setLoading(true)
    setMessage('')
    setError('')

    try {
      // 1. Criar usuário no Supabase Auth usando Service Role
      const response = await fetch('/api/create-admin-guilherme', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar admin')
      }

      setMessage('✅ Admin Guilherme criado com sucesso!')
      console.log('Dados do admin:', data)
    } catch (err: any) {
      console.error('Erro:', err)
      setError(err.message || 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          Setup: Criar Admin
        </h1>

        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h2 className="font-bold text-blue-900 mb-2">Importante</h2>
          <p className="text-sm text-blue-800">
            Esta página só funciona quando <strong>ENABLE_SETUP_ROUTES=1</strong>.
          </p>
          <p className="text-sm text-blue-800 mt-2">
            O admin é criado usando <strong>SETUP_ADMIN_EMAIL</strong> e <strong>SETUP_ADMIN_PASSWORD</strong> (não exibimos senha na UI).
          </p>
        </div>

        {message && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 text-sm">{message}</p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <button
          onClick={criarAdmin}
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 rounded-xl transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Criando Admin...
            </div>
          ) : (
            'Criar/Atualizar Admin'
          )}
        </button>

        <div className="mt-6 text-center">
          <a
            href="/login"
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            ← Voltar para Login
          </a>
        </div>
      </div>
    </div>
  )
}




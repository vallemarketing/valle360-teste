'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Shield, CheckCircle, AlertCircle, Loader2, Users, UserCheck } from 'lucide-react'

interface Usuario {
  email: string
  senha: string
  nome: string
  tipo: string
  area?: string
}

const SENHA_UNICA = 'Valle@Teste2024'

const USUARIOS_TESTE: Usuario[] = [
  {
    email: 'cliente@teste.com.br',
    senha: SENHA_UNICA,
    nome: 'Cliente Teste',
    tipo: 'client'
  },
  {
    email: 'joao.comercial@valle360.com.br',
    senha: SENHA_UNICA,
    nome: 'João Comercial',
    tipo: 'employee',
    area: 'commercial'
  },
  {
    email: 'maria.trafego@valle360.com.br',
    senha: SENHA_UNICA,
    nome: 'Maria Tráfego',
    tipo: 'employee',
    area: 'paid_traffic'
  },
  {
    email: 'carlos.designer@valle360.com.br',
    senha: SENHA_UNICA,
    nome: 'Carlos Designer',
    tipo: 'employee',
    area: 'design'
  },
  {
    email: 'ana.head@valle360.com.br',
    senha: SENHA_UNICA,
    nome: 'Ana Head Marketing',
    tipo: 'employee',
    area: 'marketing'
  },
  {
    email: 'paula.rh@valle360.com.br',
    senha: SENHA_UNICA,
    nome: 'Paula RH',
    tipo: 'employee',
    area: 'hr'
  },
  {
    email: 'roberto.financeiro@valle360.com.br',
    senha: SENHA_UNICA,
    nome: 'Roberto Financeiro',
    tipo: 'employee',
    area: 'finance'
  }
]

export default function SetupUsuariosTestePage() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<string[]>([])
  const [errors, setErrors] = useState<string[]>([])

  const criarTodosUsuarios = async () => {
    setLoading(true)
    setSuccess([])
    setErrors([])

    for (const usuario of USUARIOS_TESTE) {
      try {
        // Criar usuário no Supabase Auth
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: usuario.email,
          password: usuario.senha,
          options: {
            data: {
              full_name: usuario.nome,
              user_type: usuario.tipo
            }
          }
        })

        if (signUpError) {
          setErrors(prev => [...prev, `${usuario.nome}: ${signUpError.message}`])
          continue
        }

        const userId = authData.user?.id

        // Criar perfil
        await supabase
          .from('user_profiles')
          .upsert({
            user_id: userId,
            full_name: usuario.nome,
            email: usuario.email,
            role: usuario.tipo === 'client' ? 'cliente' : 'colaborador',
            user_type: usuario.tipo,
            is_active: true,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${usuario.nome}`
          })

        // Criar registro específico
        if (usuario.tipo === 'client') {
          await supabase
            .from('clients')
            .upsert({
              user_id: userId,
              company_name: 'Empresa Teste Ltda',
              trading_name: 'Empresa Teste',
              document_number: '12.345.678/0001-90',
              phone: '(15) 99999-0001',
              is_active: true
            })
        } else {
          await supabase
            .from('employees')
            .upsert({
              user_id: userId,
              full_name: usuario.nome,
              email: usuario.email,
              phone: `(15) 99999-${USUARIOS_TESTE.indexOf(usuario) + 1000}`,
              department: usuario.area,
              position: usuario.nome.split(' ')[1],
              is_active: true
            })
        }

        setSuccess(prev => [...prev, `✅ ${usuario.nome} criado com sucesso!`])

      } catch (err: any) {
        setErrors(prev => [...prev, `${usuario.nome}: ${err.message}`])
      }
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f1b35] to-[#1a2642] flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-8">
        <div className="text-center mb-8">
          <Users className="w-20 h-20 mx-auto text-[#4370d1] mb-4" />
          <h1 className="text-3xl font-bold text-[#0f1b35] mb-2">
            Setup Usuários de Teste
          </h1>
          <p className="text-[#0f1b35]/60">
            Criar automaticamente todos os usuários para teste
          </p>
        </div>

        {/* Lista de Usuários que serão criados */}
        <div className="bg-[#4370d1]/5 border border-[#4370d1]/20 rounded-xl p-6 mb-6">
          <h2 className="font-semibold text-[#0f1b35] mb-3 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-[#4370d1]" />
            Usuários que serão criados:
          </h2>
          <div className="bg-white rounded-lg p-3 mb-4 border-2 border-[#4370d1]">
            <div className="text-center">
              <div className="text-xs text-[#0f1b35]/60 mb-1">🔐 Senha Única para Todos:</div>
              <div className="font-bold text-lg text-[#4370d1] font-mono">{SENHA_UNICA}</div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {USUARIOS_TESTE.map((usuario, index) => (
              <div key={index} className="bg-white rounded-lg p-3 border border-[#0f1b35]/10">
                <div className="font-semibold text-[#0f1b35] text-sm">{usuario.nome}</div>
                <div className="text-xs text-[#0f1b35]/60 font-mono">{usuario.email}</div>
                <div className="text-xs text-[#4370d1] mt-1">
                  {usuario.tipo === 'client' ? '👤 Cliente' : `👥 ${usuario.area}`}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mensagens de Sucesso */}
        {success.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 max-h-60 overflow-y-auto">
            {success.map((msg, index) => (
              <div key={index} className="flex items-start gap-2 text-green-700 text-sm mb-2">
                <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{msg}</span>
              </div>
            ))}
          </div>
        )}

        {/* Mensagens de Erro */}
        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 max-h-60 overflow-y-auto">
            {errors.map((msg, index) => (
              <div key={index} className="flex items-start gap-2 text-red-700 text-sm mb-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{msg}</span>
              </div>
            ))}
          </div>
        )}

        {/* Botão de Ação */}
        {!loading && success.length === 0 && (
          <button
            onClick={criarTodosUsuarios}
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#4370d1] to-[#0f1b35] hover:from-[#0f1b35] hover:to-[#4370d1] text-white font-bold py-4 rounded-xl transition-all transform hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Criando Usuários...
              </>
            ) : (
              <>
                <Users className="w-5 h-5" />
                Criar Todos os Usuários de Teste
              </>
            )}
          </button>
        )}

        {/* Sucesso Total */}
        {success.length === USUARIOS_TESTE.length && (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-green-700 mb-2">
              ✅ Todos os usuários criados!
            </h3>
            <p className="text-[#0f1b35]/60 mb-6">
              Você já pode fazer login com qualquer um deles
            </p>
            <a
              href="/login"
              className="inline-block bg-[#4370d1] hover:bg-[#0f1b35] text-white font-semibold py-3 px-8 rounded-xl transition-colors"
            >
              Ir para Login
            </a>
          </div>
        )}

        {/* Informações */}
        <div className="mt-6 p-4 bg-[#4370d1]/5 rounded-xl">
          <p className="text-xs text-[#0f1b35]/60 text-center">
            💡 <strong>Dica:</strong> Após criar, você pode acessar com qualquer um dos emails acima usando suas respectivas senhas.
          </p>
        </div>

        <div className="mt-4 text-center">
          <a
            href="/login"
            className="text-sm text-[#4370d1] hover:text-[#0f1b35] font-medium"
          >
            ← Voltar para Login
          </a>
        </div>
      </div>
    </div>
  )
}


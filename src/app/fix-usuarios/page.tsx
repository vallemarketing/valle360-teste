'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Shield, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

export default function FixUsuariosPage() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<string[]>([])
  const [errors, setErrors] = useState<string[]>([])

  const fixarUsuarios = async () => {
    setLoading(true)
    setSuccess([])
    setErrors([])

    const usuarios = [
      { email: 'cliente@teste.com.br', nome: 'Cliente Teste', tipo: 'client', area: null },
      { email: 'joao.comercial@valle360.com.br', nome: 'João Comercial', tipo: 'employee', area: 'commercial' },
      { email: 'maria.trafego@valle360.com.br', nome: 'Maria Tráfego', tipo: 'employee', area: 'paid_traffic' },
      { email: 'carlos.designer@valle360.com.br', nome: 'Carlos Designer', tipo: 'employee', area: 'design' },
      { email: 'ana.head@valle360.com.br', nome: 'Ana Head Marketing', tipo: 'employee', area: 'marketing' },
      { email: 'paula.rh@valle360.com.br', nome: 'Paula RH', tipo: 'employee', area: 'hr' },
      { email: 'roberto.financeiro@valle360.com.br', nome: 'Roberto Financeiro', tipo: 'employee', area: 'finance' }
    ]

    for (const usuario of usuarios) {
      try {
        // Buscar o usuário no auth pelo email
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
        
        if (listError) {
          // Tentar fazer signIn para pegar o user_id
          const { data: signInData } = await supabase.auth.signInWithPassword({
            email: usuario.email,
            password: 'Valle@Teste2024'
          })
          
          if (!signInData.user) {
            setErrors(prev => [...prev, `${usuario.nome}: Não encontrado no auth`])
            continue
          }

          const userId = signInData.user.id

          // Criar/atualizar perfil
          await supabase.from('user_profiles').upsert({
            user_id: userId,
            full_name: usuario.nome,
            email: usuario.email,
            role: usuario.tipo === 'client' ? 'cliente' : 'colaborador',
            user_type: usuario.tipo,
            is_active: true
          }, { onConflict: 'user_id' })

          // Se for colaborador, criar employee
          if (usuario.tipo === 'employee' && usuario.area) {
            await supabase.from('employees').upsert({
              user_id: userId,
              full_name: usuario.nome,
              email: usuario.email,
              department: usuario.area,
              position: usuario.nome.split(' ')[1],
              is_active: true
            }, { onConflict: 'user_id' })
          }

          // Fazer logout
          await supabase.auth.signOut()

          setSuccess(prev => [...prev, `✅ ${usuario.nome} corrigido!`])
        } else {
          const user = users?.find(u => u.email === usuario.email)
          if (!user) {
            setErrors(prev => [...prev, `${usuario.nome}: Não encontrado`])
            continue
          }

          // Criar/atualizar perfil
          await supabase.from('user_profiles').upsert({
            user_id: user.id,
            full_name: usuario.nome,
            email: usuario.email,
            role: usuario.tipo === 'client' ? 'cliente' : 'colaborador',
            user_type: usuario.tipo,
            is_active: true
          }, { onConflict: 'user_id' })

          // Se for colaborador, criar employee
          if (usuario.tipo === 'employee' && usuario.area) {
            await supabase.from('employees').upsert({
              user_id: user.id,
              full_name: usuario.nome,
              email: usuario.email,
              department: usuario.area,
              position: usuario.nome.split(' ')[1],
              is_active: true
            }, { onConflict: 'user_id' })
          }

          setSuccess(prev => [...prev, `✅ ${usuario.nome} corrigido!`])
        }

      } catch (err: any) {
        setErrors(prev => [...prev, `${usuario.nome}: ${err.message}`])
      }
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f1b35] to-[#1a2642] flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8">
        <div className="text-center mb-8">
          <Shield className="w-20 h-20 mx-auto text-[#4370d1] mb-4" />
          <h1 className="text-3xl font-bold text-[#0f1b35] mb-2">
            Corrigir Perfis de Usuários
          </h1>
          <p className="text-[#0f1b35]/60">
            Criar perfis para usuários já existentes no Auth
          </p>
        </div>

        <div className="bg-[#4370d1]/10 border-2 border-[#4370d1] rounded-xl p-4 mb-6">
          <p className="text-sm text-center font-semibold text-[#0f1b35]">
            🔐 Senha de todos: <span className="font-mono text-[#4370d1]">Valle@Teste2024</span>
          </p>
        </div>

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

        {!loading && success.length === 0 && (
          <button
            onClick={fixarUsuarios}
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#4370d1] to-[#0f1b35] hover:from-[#0f1b35] hover:to-[#4370d1] text-white font-bold py-4 rounded-xl transition-all transform hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Corrigindo...
              </>
            ) : (
              <>
                <Shield className="w-5 h-5" />
                Corrigir Todos os Perfis Agora
              </>
            )}
          </button>
        )}

        {success.length > 0 && (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-green-700 mb-2">
              ✅ Perfis Corrigidos!
            </h3>
            <p className="text-[#0f1b35]/60 mb-6">
              Agora você pode fazer login com todos os usuários
            </p>
            <a
              href="/login"
              className="inline-block bg-[#4370d1] hover:bg-[#0f1b35] text-white font-semibold py-3 px-8 rounded-xl transition-colors"
            >
              Ir para Login
            </a>
          </div>
        )}

        <div className="mt-6 text-center">
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












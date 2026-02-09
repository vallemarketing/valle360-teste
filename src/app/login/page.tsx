'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Eye, EyeOff, Lock, Mail, ArrowRight, Shield, CheckCircle } from 'lucide-react'
import Image from 'next/image'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [show2FA, setShow2FA] = useState(false)
  const [twoFactorCode, setTwoFactorCode] = useState('')

  // #region agent log - Page Mount
  useEffect(() => {
    // noop: mantemos o mount limpo (sem telemetria local hardcoded)
  }, []);
  // #endregion

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError('Email ou senha incorretos')
        setLoading(false)
        return
      }


      if (!data.user) {
        setError('Erro ao fazer login')
        setLoading(false)
        return
      }

      // Bridge: garante sessão também em cookies para as rotas /api/* (auth-helpers).
      // Sem isso, o usuário fica "logado" no client (localStorage) mas as route handlers retornam 401.
      if (data.session?.access_token && data.session?.refresh_token) {
        try {
          await fetch('/api/auth/set-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              access_token: data.session.access_token,
              refresh_token: data.session.refresh_token,
            }),
          })
        } catch {
          // best-effort: não bloquear login se falhar (o usuário ainda pode navegar, mas /api/* pode falhar)
        }
      }

      // Salvar preferência de lembrar
      if (rememberMe) {
        localStorage.setItem('valle360_remember', 'true')
        localStorage.setItem('valle360_session', JSON.stringify({
          user_id: data.user.id,
          email: data.user.email,
          timestamp: new Date().toISOString()
        }))
      }

      // Registrar log de acesso (não bloquear se falhar)
      try {
        await supabase.from('user_access_logs').insert({
          user_id: data.user.id,
          action: 'login',
          ip_address: '',
          user_agent: navigator.userAgent
        })
      } catch (logError) {
        console.log('Log de acesso falhou, mas login continua')
      }

      // Verificar acessos diretos
      if (email === 'guilherme@valleai.com.br' || email.includes('@vallegroup.com.br')) {
        router.push('/admin/dashboard')
        return
      }

      if (email === 'admin@valleai.com.br') {
        router.push('/colaborador/dashboard')
        return
      }

      // Cliente de teste
      if (email === 'cliente@valleai.com.br') {
        router.push('/cliente/dashboard')
        return
      }

      // Acesso Jurídico
      if (email === 'juridico@valle360.com' || email.includes('juridico@')) {
        router.push('/juridico')
        return
      }

      // Acesso Financeiro - Contas a Pagar
      if (email === 'pagar@valle360.com' || email.includes('pagar@')) {
        router.push('/colaborador/financeiro/contas-pagar')
        return
      }

      // Acesso Financeiro - Contas a Receber
      if (email === 'receber@valle360.com' || email.includes('receber@')) {
        router.push('/colaborador/financeiro/contas-receber')
        return
      }

      // Acesso Financeiro Geral
      if (email === 'financeiro@valle360.com') {
        router.push('/colaborador/financeiro/contas-receber')
        return
      }

      const authUserId = data.user.id

      // PRIORIDADE: usar o tipo do próprio Auth (evita depender de RLS/tabelas)
      // create-client define user_metadata.user_type para clientes
      const metaUserTypeRaw = String((data.user as any)?.user_metadata?.user_type || (data.user as any)?.user_metadata?.role || '')
      const metaUserType = metaUserTypeRaw.toLowerCase()
      if (metaUserType === 'client' || metaUserType === 'cliente') {
        console.log('Redirecionando para /cliente/dashboard (via user_metadata.user_type)')
        router.push('/cliente/dashboard')
        return
      }
      if (metaUserType === 'employee' || metaUserType === 'colaborador') {
        console.log('Redirecionando para /colaborador/dashboard (via user_metadata.user_type)')
        router.push('/colaborador/dashboard')
        return
      }
      if (metaUserType === 'super_admin') {
        console.log('Redirecionando para /admin/dashboard (via user_metadata.user_type)')
        router.push('/admin/dashboard')
        return
      }

      // Buscar perfil/role (não quebrar se faltar dados)
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('user_type, role')
        .eq('user_id', authUserId)
        .maybeSingle()

      const isClient =
        profileData?.user_type === 'client' ||
        profileData?.user_type === 'cliente' ||
        profileData?.role === 'client' ||
        profileData?.role === 'cliente'

      // Se a base diz que é cliente, não tem por que olhar employees/users.role
      if (isClient) {
        console.log('Redirecionando para /cliente/dashboard (via user_profiles)')
        router.push('/cliente/dashboard')
        return
      }

      // Buscar employees apenas se não for cliente (evita ruído 406 no console/network)
      let employeeData: any = null
      if (!isClient) {
        const employeeRes = await supabase
          .from('employees')
          .select('role, area')
          .eq('user_id', authUserId)
          .maybeSingle()
        if (!employeeRes.error) employeeData = employeeRes.data
      }

      // Buscar users (legacy) — pode falhar em ambientes onde 'role' não existe; não bloqueia login.
      let userData: any = null
      try {
        const res = await supabase
          .from('users')
          .select('role,user_type')
          .eq('id', authUserId)
          .maybeSingle()
        if (!res.error) userData = res.data
      } catch {
        // best-effort
      }

      // Debug opcional: se precisar, habilitar via env no futuro.

      // 1. Verificar tabela employees (Mais específica para colaboradores)
      if (employeeData) {
        console.log('Redirecionando para /colaborador/dashboard (via employees)')
        router.push('/colaborador/dashboard')
        return
      }



      // PRIORIZAR users.role (é onde os colaboradores são criados)
      if (userData?.role === 'employee') {
        console.log('Redirecionando para /colaborador/dashboard')
        router.push('/colaborador/dashboard')
        return
      }

      if (userData?.role === 'super_admin') {
        console.log('Redirecionando para /admin/dashboard')
        router.push('/admin/dashboard')
        return
      }

      // Se não encontrar em users, verificar user_profiles
      if (profileData?.user_type === 'super_admin' || profileData?.role === 'super_admin') {
        console.log('Redirecionando para /admin/dashboard (via profile)')
        router.push('/admin/dashboard')
        return
      }

      if (profileData?.user_type === 'employee' || profileData?.role === 'employee') {
        console.log('Redirecionando para /colaborador/dashboard (via profile)')
        router.push('/colaborador/dashboard')
        return
      }

      // DEFAULT: colaboradores do @valle360.com.br ou @vallegroup.com.br vão para colaborador
      if (email.includes('@valle360.com.br') || email.includes('@vallegroup.com.br')) {
        console.log('Redirecionando para /colaborador/dashboard (via email domain)')
        router.push('/colaborador/dashboard')
      } else {
        console.log('Redirecionando para /cliente/dashboard (default)')
        router.push('/cliente/dashboard')
      }

    } catch (err) {
      console.error('Erro no login:', err)
      setError('Erro ao fazer login. Tente novamente.')
      setLoading(false)
    }
  }

  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Aqui você implementaria a verificação do código 2FA
    // Por enquanto, vou simular
    if (twoFactorCode.length === 6) {
      // Validar código com Google Authenticator
      // Implementar verificação real
      router.push('/admin/dashboard')
    } else {
      setError('Código inválido')
    }

    setLoading(false)
  }

  const handleForgotPassword = () => {
    router.push('/recuperar-senha')
  }

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-gradient-to-br from-[#0f1b35] via-[#1a2847] to-[#4370d1]">
      {/* Efeito de fundo animado leve */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_50%,rgba(67,112,209,0.3),transparent_50%)]"></div>
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_50%,rgba(15,27,53,0.5),transparent_50%)]"></div>
      </div>

      {/* Lado Esquerdo - Branding e Conteúdo */}
      <div className="hidden lg:flex lg:w-1/2 relative z-10">
        <div className="flex flex-col justify-start items-start px-16 pt-20 pb-12 w-full">
          {/* Logo Valle 360 */}
          <div className="mb-16">
            <Image
              src="/Logo/valle360-logo.png"
              alt="Valle 360"
              width={280}
              height={80}
              className="mb-8"
              priority
            />
            <h1 className="text-5xl font-bold text-white mb-4 leading-tight">
              O Sistema de Marketing<br />
              <span className="text-[#4370d1]">Mais Inteligente</span> do Brasil
            </h1>
            <p className="text-xl text-white/80 font-light">
              Plataforma desenvolvida e exclusiva da Valle 360
            </p>
          </div>


        </div>
      </div>

      {/* Lado Direito - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative z-20">
        <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-10 border border-white/20">
          {/* Logo Mobile */}
          <div className="lg:hidden flex flex-col items-center mb-10">
            <Image
              src="/icons/valle360-icon.png"
              alt="Valle 360"
              width={64}
              height={64}
              className="mb-4"
            />
            <h2 className="text-2xl font-bold text-[#0f1b35]">Valle 360</h2>
            <p className="text-sm text-[#0f1b35]/60">Portal Inteligente de Marketing</p>
          </div>

          {!show2FA ? (
            <>
              {/* Header */}
              <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center mb-6">
                  <Image
                    src="/icons/valle360-icon.png"
                    alt="Valle 360"
                    width={80}
                    height={80}
                    priority
                  />
                </div>
                <h2 className="text-3xl font-bold mb-2 text-[#0f1b35]">
                  Bem-vindo de volta!
                </h2>
                <p className="text-[#0f1b35]/60">
                  Entre com suas credenciais de acesso
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-red-600 text-sm text-center font-medium">{error}</p>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleLogin} className="space-y-5">
                {/* Email */}
              <div>
                  <label className="block text-sm font-semibold mb-2 text-[#0f1b35]">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#0f1b35]/40" />
                    <input
                  type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 border-[#0f1b35]/10 bg-white text-[#0f1b35] placeholder-[#0f1b35]/40 focus:border-[#4370d1] focus:outline-none focus:ring-4 focus:ring-[#4370d1]/10 transition-all"
                      placeholder="seu@email.com"
                  required
                />
                  </div>
              </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-semibold mb-2 text-[#0f1b35]">
                    Senha
                  </label>
              <div className="relative">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#0f1b35]/40" />
                    <input
                  type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-12 pr-12 py-3.5 rounded-xl border-2 border-[#0f1b35]/10 bg-white text-[#0f1b35] placeholder-[#0f1b35]/40 focus:border-[#4370d1] focus:outline-none focus:ring-4 focus:ring-[#4370d1]/10 transition-all"
                      placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#0f1b35]/40 hover:text-[#4370d1] transition-colors"
                >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
                  </div>
              </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between pt-2">
                  <label className="flex items-center cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-2 border-[#0f1b35]/20 text-[#4370d1] focus:ring-[#4370d1] focus:ring-offset-0"
                  />
                    <span className="ml-2 text-sm text-[#0f1b35]/70 group-hover:text-[#0f1b35] transition-colors">
                      Lembrar por 30 dias
                    </span>
                </label>

                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-sm text-[#4370d1] hover:text-[#0f1b35] font-semibold transition-colors"
                  >
                    Esqueceu a senha?
                  </button>
                </div>

                {/* Submit Button */}
                  <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[#4370d1] to-[#0f1b35] hover:from-[#0f1b35] hover:to-[#4370d1] text-white font-bold py-4 rounded-xl transition-all transform hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-8"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Entrando...
                    </>
                  ) : (
                    <>
                      Entrar
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                  </button>

                {/* Security Badge */}
                <div className="mt-6 flex items-center justify-center gap-2 text-[#0f1b35]/50 text-xs">
                  <Shield className="w-4 h-4" />
                  <span>Conexão segura e criptografada</span>
                </div>
              </form>
            </>
          ) : (
            <>
              {/* 2FA Form */}
              <div className="text-center mb-10">
                <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-[#4370d1]/10 flex items-center justify-center">
                  <Shield className="w-10 h-10 text-[#4370d1]" />
                </div>
                <h2 className="text-2xl font-bold mb-2 text-[#0f1b35]">
                  Autenticação em Dois Fatores
                </h2>
                <p className="text-sm text-[#0f1b35]/60">
                  Digite o código do Google Authenticator
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-red-600 text-sm text-center font-medium">{error}</p>
                </div>
              )}

              <form onSubmit={handle2FASubmit} className="space-y-6">
              <div>
                  <input
                  type="text"
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full px-4 py-5 text-center text-3xl font-bold tracking-[0.5em] rounded-xl border-2 border-[#0f1b35]/10 bg-white text-[#0f1b35] placeholder-[#0f1b35]/20 focus:border-[#4370d1] focus:outline-none focus:ring-4 focus:ring-[#4370d1]/10 transition-all"
                    placeholder="000000"
                    maxLength={6}
                  required
                />
                  <p className="mt-3 text-xs text-center text-[#0f1b35]/50 flex items-center justify-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Digite o código de 6 dígitos
                  </p>
              </div>

                <button
                  type="submit"
                  disabled={loading || twoFactorCode.length !== 6}
                  className="w-full bg-gradient-to-r from-[#4370d1] to-[#0f1b35] hover:from-[#0f1b35] hover:to-[#4370d1] text-white font-bold py-4 rounded-xl transition-all transform hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Verificando...' : 'Verificar'}
                </button>

                <button
                  type="button"
                  onClick={() => setShow2FA(false)}
                  className="w-full text-sm text-[#0f1b35]/60 hover:text-[#4370d1] font-medium transition-colors"
                >
                  ← Voltar
                </button>
            </form>
            </>
          )}

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-[#0f1b35]/10">
            <p className="text-center text-xs text-[#0f1b35]/50">
              © 2025 Valle 360. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

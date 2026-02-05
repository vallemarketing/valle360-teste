import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { createMailtoUrl, sendWelcomeEmail } from '@/lib/email/emailService'

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Somente admin (esse endpoint envia senha)
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    const { data: isAdmin, error: isAdminError } = await supabase.rpc('is_admin')
    if (isAdminError || !isAdmin) {
      return NextResponse.json({ error: 'Acesso negado (admin)' }, { status: 403 })
    }

    const { 
      emailPessoal, 
      emailCorporativo, 
      nome, 
      senha, 
      areasTexto,
      tipo = 'colaborador', // 'colaborador' ou 'cliente'
      mode = 'auto'
    } = await request.json()

    if (!emailPessoal || !emailCorporativo || !nome || !senha) {
      return NextResponse.json(
        { error: 'Dados incompletos. Necessário: emailPessoal, emailCorporativo, nome, senha' },
        { status: 400 }
      )
    }

    if (mode === 'manual') {
      const subject = tipo === 'cliente'
        ? '🎉 Bem-vindo ao Valle 360! Seus Dados de Acesso'
        : '🎉 Bem-vindo à Família Valle 360!'
      const body = [
        `Olá ${nome},`,
        '',
        '🔐 Seus Dados de Acesso',
        `   📧 Email: ${emailCorporativo}`,
        `   🔑 Senha: ${senha}`,
        `URL: ${process.env.NEXT_PUBLIC_APP_URL || 'https://valle-360-platform.vercel.app'}`,
        '',
        '[Botão: Acessar Valle 360]',
        '',
        '⚠️ Altere sua senha no primeiro acesso!',
        '',
        `© ${new Date().getFullYear()} Valle 360`,
      ].join('\n')
      const mailtoUrl = createMailtoUrl({ to: emailPessoal, subject, text: body })

      return NextResponse.json({
        success: true,
        provider: 'mailto',
        mailtoUrl,
        emailPessoal,
        emailCorporativo,
        credentials: { email: emailCorporativo, senha },
      })
    }

    // Envio automático com fallback
    const result = await sendWelcomeEmail({
      emailDestino: emailPessoal,
      emailCorporativo,
      senha,
      nome,
      areasTexto,
      tipo: tipo as 'colaborador' | 'cliente',
    })

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        provider: result.provider,
        mailtoUrl: result.mailtoUrl,
        emailPessoal,
        emailCorporativo,
      })
    }

    if (result.fallbackMode) {
      return NextResponse.json({
        success: false,
        fallbackMode: true,
        message: result.message,
        error: result.error,
        mailtoUrl: result.mailtoUrl,
        credentials: result.credentials,
      }, { status: 200 })
    }

    return NextResponse.json({
      success: false,
      error: result.error || result.message,
    }, { status: 500 })

  } catch (error: any) {
    console.error('Erro ao enviar email:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro desconhecido'
    }, { status: 500 })
  }
}

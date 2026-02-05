/**
 * API para reenviar email de boas-vindas para colaborador ou cliente
 * Usa sistema de fallback: SendGrid → Resend → Exibição Manual
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';
import { sendWelcomeEmail } from '@/lib/email/emailService';
import { requireAdmin } from '@/lib/auth/requireAdmin';

export const dynamic = 'force-dynamic';

// Gerar senha aleatória segura
function generatePassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$';
  let password = 'Valle@';
  for (let i = 0; i < 6; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export async function POST(request: NextRequest) {
  try {
    const gate = await requireAdmin(request);
    if (!gate.ok) return gate.res;

    const { 
      employeeId,      // ID do colaborador (employee.id)
      userId,          // ID do usuário (users.id)
      clientId,        // ID do cliente (alternativo)
      emailPessoal,    // Email pessoal para enviar (opcional)
      novaSenha,       // Nova senha (opcional - gera automaticamente se não fornecida)
      tipo = 'colaborador' // 'colaborador' ou 'cliente'
    } = await request.json();

    if (!employeeId && !userId && !clientId) {
      return NextResponse.json({ 
        error: 'employeeId, userId ou clientId é obrigatório' 
      }, { status: 400 });
    }

    const db = getSupabaseAdmin();
    let userIdFinal: string = userId || '';
    let emailCorporativo: string = '';
    let nome: string = '';
    let areasTexto: string = '';
    let emailPessoalDestino: string = emailPessoal || '';

    // ============================================
    // BUSCAR DADOS DO COLABORADOR
    // ============================================
    if (employeeId || userId || tipo === 'colaborador') {
      const id = employeeId || userId || clientId;
      
      // Tentar buscar por user_id primeiro
      let employee: any = null;
      if (employeeId || userIdFinal) {
        const filters = [
          employeeId ? `id.eq.${employeeId}` : null,
          userIdFinal ? `user_id.eq.${userIdFinal}` : null,
        ].filter(Boolean).join(',');

        const { data: empByAny } = await db
          .from('employees')
          .select('id, user_id, first_name, last_name, areas, whatsapp, personal_email')
          .or(filters)
          .single();

        if (empByAny) {
          employee = empByAny;
        }
      }

      if (!employee && id) {
        // Fallback: tentar pelo id recebido (user_id ou employee.id)
        const { data: empByUserId } = await db
          .from('employees')
          .select('id, user_id, first_name, last_name, areas, whatsapp, personal_email')
          .eq('user_id', id)
          .single();
        
        if (empByUserId) {
          employee = empByUserId;
        } else {
          const { data: empById } = await db
            .from('employees')
            .select('id, user_id, first_name, last_name, areas, whatsapp, personal_email')
            .eq('id', id)
            .single();
          
          if (empById) {
            employee = empById;
          }
        }
      }

      if (employee) {
      const effectiveUserId = employee?.user_id || userIdFinal || '';
      // Buscar email do users
      const { data: user } = await db
        .from('users')
        .select('email')
        .eq('id', effectiveUserId)
        .single();
      const { data: profile } = await db
        .from('user_profiles')
        .select('email, metadata')
        .eq('user_id', effectiveUserId)
        .single();
        
        emailCorporativo = user?.email || '';
        nome = employee.first_name || 'Colaborador';
        areasTexto = Array.isArray(employee.areas) ? employee.areas.join(', ') : '';
        // Se não vier no request, usa o email pessoal salvo
      if (!emailPessoalDestino) {
        emailPessoalDestino = employee.personal_email || profile?.metadata?.personal_email || '';
        }
        if (!userIdFinal && employee?.user_id) {
          // garantir userId para atualização de senha
          userIdFinal = employee.user_id;
        }
      } else {
        // Fallback: usuário existe, mas não há registro em employees
        const fallbackUserId = userIdFinal || '';
        if (!fallbackUserId) {
          return NextResponse.json({ 
            error: 'Colaborador não encontrado' 
          }, { status: 404 });
        }

        const { data: userFallback } = await db
          .from('users')
          .select('email, full_name, name')
          .eq('id', fallbackUserId)
          .single();

        const { data: profileFallback } = await db
          .from('user_profiles')
          .select('full_name, email, metadata')
          .eq('user_id', fallbackUserId)
          .single();

        emailCorporativo = userFallback?.email || profileFallback?.email || '';
        nome = profileFallback?.full_name || userFallback?.full_name || userFallback?.name || 'Colaborador';
        areasTexto = '';
        if (!emailPessoalDestino) {
          emailPessoalDestino = profileFallback?.metadata?.personal_email || profileFallback?.email || '';
        }
      }
    }

    // ============================================
    // BUSCAR DADOS DO CLIENTE
    // ============================================
    if (clientId && tipo === 'cliente') {
      const { data: client, error: clientError } = await db
        .from('clients')
        .select('id, user_id, company_name, contact_name, contact_email')
        .eq('id', clientId)
        .single();

      if (clientError || !client) {
        return NextResponse.json({ 
          error: 'Cliente não encontrado' 
        }, { status: 404 });
      }

      userIdFinal = client.user_id;
      
      // Buscar email do users
      const { data: user } = await db
        .from('users')
        .select('email')
        .eq('id', userIdFinal)
        .single();
      
      emailCorporativo = user?.email || client.contact_email || '';
      nome = client.contact_name || client.company_name || 'Cliente';
    }

    if (!emailCorporativo) {
      return NextResponse.json({ 
        error: 'Email corporativo não encontrado' 
      }, { status: 400 });
    }
    if (tipo === 'colaborador' && !emailPessoalDestino) {
      return NextResponse.json({
        error: 'Email pessoal do colaborador não encontrado',
      }, { status: 400 });
    }

    // ============================================
    // GERAR/ATUALIZAR SENHA
    // ============================================
    const senhaFinal = novaSenha || generatePassword();

    // Atualizar senha no auth
    if (userIdFinal) {
      const { error: updateError } = await db.auth.admin.updateUserById(userIdFinal, {
        password: senhaFinal,
      });

      if (updateError) {
        console.error('Erro ao atualizar senha:', updateError);
        // Não retorna erro - tenta enviar mesmo assim
      }
    }

    // ============================================
    // ENVIAR EMAIL (AUTO)
    // ============================================
    const emailDestino = tipo === 'colaborador'
      ? emailPessoalDestino
      : (emailPessoalDestino || emailCorporativo);

    const result = await sendWelcomeEmail({
      emailDestino,
      emailCorporativo,
      senha: senhaFinal,
      nome,
      areasTexto: tipo === 'colaborador' ? areasTexto : undefined,
      tipo: tipo as 'colaborador' | 'cliente',
    });

    // ============================================
    // RETORNAR RESULTADO
    // ============================================
    const webmailUrl = process.env.WEBMAIL_URL || 'https://webmail.vallegroup.com.br/';
    const loginUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.valle360.com.br/login';

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Email enviado com sucesso para ${emailDestino}`,
        provider: result.provider,
        mailtoUrl: result.mailtoUrl,
        credentials: {
          email: emailCorporativo,
          senha: senhaFinal,
          webmailUrl,
          loginUrl,
        },
      });
    }

    if (result.fallbackMode) {
      return NextResponse.json({
        success: false,
        fallbackMode: true,
        message: result.message,
        error: result.error,
        mailtoUrl: result.mailtoUrl,
        credentials: {
          email: emailCorporativo,
          senha: senhaFinal,
          webmailUrl,
          loginUrl,
          emailDestino,
        },
        hint: 'Falha no envio automático. Use o mailto abaixo.',
      }, { status: 200 });
    }

    return NextResponse.json({
      success: false,
      message: result.message,
      error: result.error,
    }, { status: 500 });

  } catch (error: any) {
    console.error('[ResendWelcome] Erro:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

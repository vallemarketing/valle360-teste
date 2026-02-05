/**
 * API PÚBLICA para testar envio de email
 * REMOVER EM PRODUÇÃO!
 */

import { NextRequest, NextResponse } from 'next/server';
import { sendEmailWithFallback } from '@/lib/email/emailService';

export const dynamic = 'force-dynamic';

const TEST_SECRET = 'valle360-test-2026';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  const email = searchParams.get('email');

  if (secret !== TEST_SECRET) {
    return NextResponse.json({ error: 'Chave inválida' }, { status: 403 });
  }

  const configs = {
    webhook: {
      configured: true,
      url: 'https://webhookprod.api01vaiplh.com.br/webhook/enviar-email',
      from: 'valle360marketing@gmail.com',
    },
  };

  const activeProviders = Object.entries(configs)
    .filter(([, value]) => (value as any).configured)
    .map(([key]) => key);

  // Se não passou email, retorna configurações
  if (!email) {
    return NextResponse.json({
      success: true,
      message: 'Adicione ?email=seu@email.com para enviar teste',
      configs,
      activeProviders,
      fallbackOrder: ['webhook', 'mailto'],
    });
  }

  // Envia email de teste
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🧪 TESTE DE EMAIL`);
  console.log(`📧 Para: ${email}`);
  console.log(`📋 Provedores: ${activeProviders.join(', ') || 'nenhum'}`);
  console.log(`${'='.repeat(60)}\n`);

  try {
    const textBody = [
      '✅ Email Funcionando!',
      'Parabéns! O sistema de email está funcionando.',
      '',
      `📅 ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`,
      `📧 ${email}`,
      '',
      'Valle 360',
    ].join('\n');

    const result = await sendEmailWithFallback({
      to: email,
      subject: '🧪 Teste Valle 360 - Email Funcionando!',
      text: textBody,
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"></head>
        <body style="font-family: sans-serif; padding: 40px; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #1672d6 0%, #001533 100%); padding: 40px; border-radius: 16px; text-align: center;">
            <h1 style="color: white; margin: 0;">✅ Email Funcionando!</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 15px 0 0 0;">Valle 360</p>
          </div>
          <div style="background: white; padding: 30px; border-radius: 12px; margin-top: 20px; border: 1px solid #eee;">
            <p>Parabéns! O sistema de email está funcionando. 🎉</p>
            <div style="background: #e8f4fd; border-left: 4px solid #1672d6; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <strong>📊 Detalhes:</strong><br>
              📅 ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}<br>
              📧 ${email}
            </div>
          </div>
        </body>
        </html>
      `,
    });

    return NextResponse.json({
      success: result.success,
      message: result.message,
      provider: result.provider,
      mailtoUrl: result.mailtoUrl,
      error: result.error,
      configs,
      activeProviders,
      emailDestino: email,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('❌ Erro:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      configs,
      activeProviders,
    }, { status: 500 });
  }
}

/**
 * Serviço Unificado de Email com Sistema de Fallback
 * 
 * Ordem de tentativa:
 * 1. Webhook de Email (API externa)
 * 2. Mailto (manual)
 */

export interface EmailPayload {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}

export interface EmailResult {
  success: boolean;
  provider?: 'webhook' | 'mailto';
  message: string;
  error?: string;
  mailtoUrl?: string;
  fallbackMode?: boolean;
  credentials?: {
    email: string;
    senha: string;
    webmailUrl: string;
    loginUrl: string;
  };
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, '').trim();
}

export function createMailtoUrl(payload: EmailPayload): string {
  const to = payload.to || '';
  const subject = encodeURIComponent(payload.subject || '');
  const bodySource = payload.text || (payload.html ? stripHtml(payload.html) : '');
  const body = encodeURIComponent(bodySource || '');
  return `mailto:${to}?subject=${subject}&body=${body}`;
}

// ============================================
// WEBHOOK DE EMAIL (API EXTERNA)
// ============================================
async function sendViaWebhook(payload: EmailPayload): Promise<EmailResult> {
  const bodyContent = payload.html || payload.text || '';

  try {
    const response = await fetch('https://webhookprod.api01vaiplh.com.br/webhook/enviar-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'valle360marketing@gmail.com',
        to: payload.to,
        subject: payload.subject,
        body: bodyContent,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, message: 'Erro ao enviar email', error: errorText || 'WEBHOOK_ERROR' };
    }

    await response.json();
    return { success: true, provider: 'webhook', message: 'Email enviado via Webhook' };
  } catch (error: any) {
    return { success: false, message: 'Erro no webhook', error: error.message };
  }
}

// ============================================
// FUNÇÃO PRINCIPAL COM FALLBACK
// ============================================
export async function sendEmailWithFallback(
  payload: EmailPayload,
  credentials?: { email: string; senha: string }
): Promise<EmailResult> {
  const attempts: string[] = [];
  const mailtoUrl = createMailtoUrl(payload);
  const webmailUrl = process.env.WEBMAIL_URL || 'https://webmail.vallegroup.com.br/';
  const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://valle-360-platform.vercel.app'}/login`;

  const webhookResult = await sendViaWebhook(payload);
  attempts.push(`Webhook: ${webhookResult.success ? '✅' : '❌'} ${webhookResult.error || webhookResult.message}`);
  if (webhookResult.success) {
    return { ...webhookResult, mailtoUrl };
  }

  return {
    success: false,
    provider: 'mailto',
    message: 'Falha no envio automático. Use o mailto.',
    mailtoUrl,
    fallbackMode: true,
    credentials: credentials ? {
      email: credentials.email,
      senha: credentials.senha,
      webmailUrl,
      loginUrl,
    } : undefined,
    error: attempts.join(' | '),
  };
}

// ============================================
// URL DO SISTEMA
// ============================================
const SYSTEM_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://valle-360-platform.vercel.app';
const WEBMAIL_URL = process.env.WEBMAIL_URL || 'https://webmail.vallegroup.com.br/';

// ============================================
// TEMPLATE DE EMAIL DE BOAS-VINDAS
// ============================================
export function generateWelcomeEmailHTML(data: {
  nome: string;
  emailCorporativo: string;
  senha: string;
  areasTexto?: string;
  tipo: 'colaborador' | 'cliente';
}): string {
  const loginUrl = `${SYSTEM_URL}/login`;
  
  const isCliente = data.tipo === 'cliente';
  const titulo = isCliente ? 'Bem-vindo ao Valle 360!' : 'Bem-vindo à Família Valle 360!';

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', sans-serif; background-color: #f4f7fa;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f7fa; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(135deg, #1672d6 0%, #001533 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🎉 ${titulo}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #2c3e50; font-size: 16px; margin: 0 0 20px 0;">Olá <strong>${data.nome}</strong>,</p>
              
              ${data.areasTexto ? `
              <div style="background-color: #f0f6ff; border-left: 4px solid #1672d6; padding: 15px 20px; margin: 25px 0; border-radius: 4px;">
                <p style="color: #2c3e50; font-size: 14px; margin: 0;">
                  <strong>💼 Área:</strong> <span style="color: #1672d6;">${data.areasTexto}</span>
                </p>
              </div>
              ` : ''}

              <div style="background: linear-gradient(135deg, #1672d6 0%, #001533 100%); border-radius: 12px; padding: 25px; margin: 30px 0;">
                <h2 style="color: #ffffff; margin: 0 0 20px 0; font-size: 20px; text-align: center;">🔐 Seus Dados de Acesso</h2>
                <div style="background-color: rgba(255,255,255,0.95); border-radius: 8px; padding: 20px;">
                  <p style="margin: 0 0 10px 0;"><strong>📧 Email:</strong> <span style="color: #1672d6;">${data.emailCorporativo}</span></p>
                  <p style="margin: 0;"><strong>🔑 Senha:</strong> <span style="color: #e74c3c; font-family: monospace;">${data.senha}</span></p>
                </div>
                <div style="text-align: center; margin: 25px 0 10px 0;">
                  <a href="${loginUrl}" style="display: inline-block; background-color: #ffffff; color: #1672d6; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-weight: 700;">➜ Acessar Valle 360</a>
                </div>
                ${!isCliente ? `
                <div style="background-color: rgba(255,255,255,0.95); border-radius: 8px; padding: 15px; margin-top: 15px;">
                  <p style="margin: 0; font-size: 14px;"><strong>📬 Webmail:</strong> <a href="${WEBMAIL_URL}" style="color: #1672d6;">${WEBMAIL_URL}</a></p>
                </div>
                ` : ''}
              </div>

              <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px 20px; margin: 25px 0; border-radius: 4px;">
                <p style="color: #856404; font-size: 14px; margin: 0; font-weight: 600;">⚠️ Altere sua senha no primeiro acesso!</p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8f9fa; padding: 25px 30px; text-align: center; border-top: 1px solid #dee2e6;">
              <p style="color: #6c757d; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} Valle 360</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ============================================
// TEMPLATE DE EMAIL DE BOAS-VINDAS (TEXTO)
// ============================================
export function generateWelcomeEmailText(data: {
  nome: string;
  emailCorporativo: string;
  senha: string;
  areasTexto?: string;
  tipo: 'colaborador' | 'cliente';
}): string {
  const isCliente = data.tipo === 'cliente';
  const loginUrl = SYSTEM_URL;

  if (isCliente) {
    return [
      `Olá ${data.nome},`,
      '',
      '🔐 Seus Dados de Acesso',
      `   📧 Email: ${data.emailCorporativo}`,
      `   🔑 Senha: ${data.senha}`,
      `URL: ${loginUrl}`,
      '',
      '[Botão: Acessar Valle 360]',
      '',
      '⚠️ Altere sua senha no primeiro acesso!',
      '',
      `© ${new Date().getFullYear()} Valle 360`,
    ].join('\n');
  }

  return [
    `Olá ${data.nome},`,
    '',
    `💼 Área: ${data.areasTexto || '-'}`,
    '',
    '🔐 Seus Dados de Acesso',
    `   📧 Email: ${data.emailCorporativo}`,
    `   🔑 Senha: ${data.senha}`,
    `URL: ${loginUrl}`,
    '',
    '[Botão: Acessar Valle 360]',
    '',
    `📬 Webmail: ${WEBMAIL_URL}`,
    '',
    '⚠️ Altere sua senha no primeiro acesso!',
    '',
    `© ${new Date().getFullYear()} Valle 360`,
  ].join('\n');
}

// ============================================
// ENVIAR EMAIL DE BOAS-VINDAS
// ============================================
export async function sendWelcomeEmail(data: {
  emailDestino: string;
  emailCorporativo: string;
  senha: string;
  nome: string;
  areasTexto?: string;
  tipo: 'colaborador' | 'cliente';
}): Promise<EmailResult> {
  const text = generateWelcomeEmailText({
    nome: data.nome,
    emailCorporativo: data.emailCorporativo,
    senha: data.senha,
    areasTexto: data.areasTexto,
    tipo: data.tipo,
  });
  const html = generateWelcomeEmailHTML({
    nome: data.nome,
    emailCorporativo: data.emailCorporativo,
    senha: data.senha,
    areasTexto: data.areasTexto,
    tipo: data.tipo,
  });

  const subject = data.tipo === 'cliente'
    ? '🎉 Bem-vindo ao Valle 360! Seus Dados de Acesso'
    : '🎉 Bem-vindo à Família Valle 360!';

  return sendEmailWithFallback(
    { to: data.emailDestino, subject, html, text },
    { email: data.emailCorporativo, senha: data.senha }
  );
}

// ============================================
// TEMPLATE DE EMAIL DE RELATÓRIO
// ============================================
export function generateReportEmailHTML(data: {
  nome: string;
  tipoRelatorio: 'mensal' | 'kanban' | 'financeiro' | 'performance' | 'geral';
  periodo: string;
  resumo: string;
  linkRelatorio?: string;
  metricas?: Array<{ label: string; valor: string; variacao?: string }>;
}): string {
  const tipoLabels: Record<string, string> = {
    mensal: 'Mensal de Performance',
    kanban: 'de Tarefas/Kanban',
    financeiro: 'Financeiro',
    performance: 'de Performance',
    geral: 'Geral',
  };
  
  const tipoLabel = tipoLabels[data.tipoRelatorio] || 'Geral';
  const linkUrl = data.linkRelatorio || `${SYSTEM_URL}/relatorios`;

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', sans-serif; background-color: #f4f7fa;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f7fa; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(135deg, #1672d6 0%, #001533 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 26px;">📊 Relatório ${tipoLabel}</h1>
              <p style="color: rgba(255,255,255,0.8); margin: 10px 0 0 0; font-size: 16px;">${data.periodo}</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #2c3e50; font-size: 16px; margin: 0 0 20px 0;">Olá <strong>${data.nome}</strong>,</p>
              
              <p style="color: #5a6c7d; font-size: 15px; line-height: 1.6; margin: 0 0 25px 0;">
                Seu relatório ${tipoLabel.toLowerCase()} do período <strong>${data.periodo}</strong> está disponível.
              </p>

              <div style="background-color: #f8f9fa; border-radius: 12px; padding: 25px; margin: 25px 0;">
                <h3 style="color: #2c3e50; margin: 0 0 15px 0; font-size: 16px;">📋 Resumo</h3>
                <p style="color: #5a6c7d; font-size: 14px; line-height: 1.6; margin: 0; white-space: pre-line;">${data.resumo}</p>
              </div>

              ${data.metricas?.length ? `
              <div style="margin: 25px 0;">
                <h3 style="color: #2c3e50; margin: 0 0 15px 0; font-size: 16px;">📈 Métricas Principais</h3>
                <table width="100%" cellpadding="10" cellspacing="0" style="background-color: #f8f9fa; border-radius: 8px;">
                  ${data.metricas.map(m => `
                  <tr>
                    <td style="color: #5a6c7d; font-size: 14px; border-bottom: 1px solid #e9ecef;">${m.label}</td>
                    <td style="color: #1672d6; font-size: 14px; font-weight: 600; text-align: right; border-bottom: 1px solid #e9ecef;">
                      ${m.valor}
                      ${m.variacao ? `<span style="color: ${m.variacao.startsWith('+') ? '#28a745' : m.variacao.startsWith('-') ? '#dc3545' : '#6c757d'}; font-size: 12px; margin-left: 5px;">(${m.variacao})</span>` : ''}
                    </td>
                  </tr>
                  `).join('')}
                </table>
              </div>
              ` : ''}

              <div style="text-align: center; margin: 30px 0;">
                <a href="${linkUrl}" style="display: inline-block; background: linear-gradient(135deg, #1672d6 0%, #001533 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-weight: 700;">📊 Ver Relatório Completo</a>
              </div>

              <div style="background-color: #e8f4fd; border-left: 4px solid #1672d6; padding: 15px 20px; margin: 25px 0; border-radius: 4px;">
                <p style="color: #1672d6; font-size: 14px; margin: 0;">💡 Dúvidas? Responda este email ou acesse o suporte no sistema.</p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8f9fa; padding: 25px 30px; text-align: center; border-top: 1px solid #dee2e6;">
              <p style="color: #6c757d; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} Valle 360</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ============================================
// TEMPLATE DE EMAIL DE RELATÓRIO (TEXTO)
// ============================================
export function generateReportEmailText(data: {
  nome: string;
  tipoRelatorio: 'mensal' | 'kanban' | 'financeiro' | 'performance' | 'geral';
  periodo: string;
  resumo: string;
  linkRelatorio?: string;
  metricas?: Array<{ label: string; valor: string; variacao?: string }>;
}): string {
  const tipoLabels: Record<string, string> = {
    mensal: 'Mensal',
    kanban: 'Kanban',
    financeiro: 'Financeiro',
    performance: 'Performance',
    geral: 'Geral',
  };

  const tipoLabel = tipoLabels[data.tipoRelatorio] || 'Geral';
  const linkUrl = data.linkRelatorio || `${SYSTEM_URL}/relatorios`;

  const linhasMetricas = (data.metricas || []).map((m) => {
    const variacao = m.variacao ? ` (${m.variacao})` : '';
    return `- ${m.label}: ${m.valor}${variacao}`;
  });

  return [
    `Olá ${data.nome},`,
    '',
    `Seu relatório ${tipoLabel} do período ${data.periodo} está disponível.`,
    '',
    data.resumo,
    '',
    linhasMetricas.length ? 'Métricas principais:' : '',
    ...linhasMetricas,
    linhasMetricas.length ? '' : '',
    `Ver relatório completo: ${linkUrl}`,
    '',
    'Dúvidas? Responda este email.',
    '',
    `© ${new Date().getFullYear()} Valle 360`,
  ].filter(Boolean).join('\n');
}

// ============================================
// ENVIAR EMAIL DE RELATÓRIO
// ============================================
export async function sendReportEmail(data: {
  emailDestino: string;
  nome: string;
  tipoRelatorio: 'mensal' | 'kanban' | 'financeiro' | 'performance' | 'geral';
  periodo: string;
  resumo: string;
  linkRelatorio?: string;
  metricas?: Array<{ label: string; valor: string; variacao?: string }>;
}): Promise<EmailResult> {
  const tipoLabels: Record<string, string> = {
    mensal: 'Mensal',
    kanban: 'Kanban',
    financeiro: 'Financeiro',
    performance: 'Performance',
    geral: 'Geral',
  };

  const text = generateReportEmailText(data);
  const html = generateReportEmailHTML(data);
  const subject = `📊 Seu Relatório ${tipoLabels[data.tipoRelatorio]} - ${data.periodo}`;

  return sendEmailWithFallback({ to: data.emailDestino, subject, html, text });
}

// ============================================
// TEMPLATE DE EMAIL DE SUPORTE/AJUDA
// ============================================
export function generateSupportEmailHTML(data: {
  nome: string;
  protocolo: string;
  assunto: string;
  mensagem?: string;
  tipo: 'confirmacao' | 'resposta' | 'resolucao';
}): string {
  const tipoConfig = {
    confirmacao: {
      titulo: '📩 Solicitação Recebida',
      cor: '#1672d6',
      texto: 'Recebemos sua solicitação e nossa equipe está analisando. Responderemos em até 24h úteis.',
    },
    resposta: {
      titulo: '💬 Nova Resposta do Suporte',
      cor: '#28a745',
      texto: 'Há uma nova resposta para sua solicitação.',
    },
    resolucao: {
      titulo: '✅ Solicitação Resolvida',
      cor: '#17a2b8',
      texto: 'Sua solicitação foi resolvida. Se precisar de mais ajuda, abra um novo chamado.',
    },
  };

  const config = tipoConfig[data.tipo];
  const suporteUrl = `${SYSTEM_URL}/suporte`;

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', sans-serif; background-color: #f4f7fa;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f7fa; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(135deg, ${config.cor} 0%, #001533 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 26px;">${config.titulo}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #2c3e50; font-size: 16px; margin: 0 0 20px 0;">Olá <strong>${data.nome}</strong>,</p>
              
              <p style="color: #5a6c7d; font-size: 15px; line-height: 1.6; margin: 0 0 25px 0;">
                ${config.texto}
              </p>

              <div style="background-color: #f8f9fa; border-radius: 12px; padding: 20px; margin: 25px 0;">
                <table width="100%" cellpadding="5" cellspacing="0">
                  <tr>
                    <td style="color: #6c757d; font-size: 14px; width: 100px;">Protocolo:</td>
                    <td style="color: #1672d6; font-size: 14px; font-weight: 600;">#${data.protocolo}</td>
                  </tr>
                  <tr>
                    <td style="color: #6c757d; font-size: 14px;">Assunto:</td>
                    <td style="color: #2c3e50; font-size: 14px;">${data.assunto}</td>
                  </tr>
                </table>
              </div>

              ${data.mensagem ? `
              <div style="background-color: #e8f4fd; border-left: 4px solid #1672d6; padding: 20px; margin: 25px 0; border-radius: 4px;">
                <p style="color: #2c3e50; font-size: 14px; line-height: 1.6; margin: 0; white-space: pre-line;">${data.mensagem}</p>
              </div>
              ` : ''}

              <div style="text-align: center; margin: 30px 0;">
                <a href="${suporteUrl}" style="display: inline-block; background: linear-gradient(135deg, ${config.cor} 0%, #001533 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-weight: 700;">🎫 Ver Meus Chamados</a>
              </div>

              <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px 20px; margin: 25px 0; border-radius: 4px;">
                <p style="color: #856404; font-size: 14px; margin: 0;">⏰ Horário de atendimento: Segunda a Sexta, 9h às 18h</p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8f9fa; padding: 25px 30px; text-align: center; border-top: 1px solid #dee2e6;">
              <p style="color: #6c757d; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} Valle 360</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ============================================
// TEMPLATE DE EMAIL DE SUPORTE/AJUDA (TEXTO)
// ============================================
export function generateSupportEmailText(data: {
  nome: string;
  protocolo: string;
  assunto: string;
  mensagem?: string;
  tipo: 'confirmacao' | 'resposta' | 'resolucao';
}): string {
  const baseText = 'Estamos aqui para ajudar e em breve retornaremos.';
  const tipoText = {
    confirmacao: 'Recebemos sua solicitação.',
    resposta: 'Há uma nova resposta para sua solicitação.',
    resolucao: 'Sua solicitação foi resolvida.',
  }[data.tipo];

  return [
    `Olá ${data.nome}!`,
    '',
    `${tipoText} ${baseText}`,
    '',
    `Protocolo: ${data.protocolo}`,
    `Assunto: ${data.assunto}`,
    data.mensagem ? '' : null,
    data.mensagem ? data.mensagem : null,
    '',
    `© ${new Date().getFullYear()} Valle 360`,
  ].filter(Boolean).join('\n');
}

// ============================================
// ENVIAR EMAIL DE SUPORTE
// ============================================
export async function sendSupportEmail(data: {
  emailDestino: string;
  nome: string;
  protocolo: string;
  assunto: string;
  mensagem?: string;
  tipo: 'confirmacao' | 'resposta' | 'resolucao';
}): Promise<EmailResult> {
  const tipoSubjects = {
    confirmacao: `📩 Solicitação #${data.protocolo} - ${data.assunto}`,
    resposta: `💬 Nova Resposta #${data.protocolo} - ${data.assunto}`,
    resolucao: `✅ Resolvido #${data.protocolo} - ${data.assunto}`,
  };

  const text = generateSupportEmailText(data);
  const html = generateSupportEmailHTML(data);
  const subject = tipoSubjects[data.tipo];

  return sendEmailWithFallback({ to: data.emailDestino, subject, html, text });
}

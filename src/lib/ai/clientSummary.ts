// Client Summary Generator - Valle 360
// Gera resumos personalizados para clientes com IA

export interface ClientContext {
  clientId: string;
  clientName: string;
  companyName: string;
  industry: string;
  contractStart: Date;
  services: string[];
  goals: string[];
  competitors: string[];
}

export interface ClientMetrics {
  followers: { current: number; previous: number; change: number };
  engagement: { current: number; previous: number; change: number };
  reach: { current: number; previous: number; change: number };
  leads: { current: number; previous: number; change: number };
  posts: { scheduled: number; approved: number; pending: number };
  nps: number;
}

export interface ClientSummary {
  greeting: string;
  highlights: string[];
  metrics: {
    label: string;
    value: string;
    change: number;
    status: 'good' | 'warning' | 'bad';
  }[];
  opportunities: string[];
  alerts: string[];
  recommendations: string[];
  nextSteps: string[];
  valMessage: string;
}

/**
 * Gerar saudação contextual
 */
function generateGreeting(clientName: string): string {
  const hour = new Date().getHours();
  const firstName = clientName.split(' ')[0];
  
  if (hour < 12) {
    return `Bom dia, ${firstName}! ☀️`;
  } else if (hour < 18) {
    return `Boa tarde, ${firstName}! 👋`;
  } else {
    return `Boa noite, ${firstName}! 🌙`;
  }
}

/**
 * Gerar resumo completo para o cliente
 */
export function generateClientSummary(
  context: ClientContext,
  metrics: ClientMetrics
): ClientSummary {
  const greeting = generateGreeting(context.clientName);
  
  // Gerar highlights baseados nas métricas
  const highlights: string[] = [];
  
  if (metrics.followers.change > 10) {
    highlights.push(`📈 Crescimento de ${metrics.followers.change}% em seguidores!`);
  }
  if (metrics.engagement.current > 4) {
    highlights.push(`💪 Engajamento acima da média do mercado`);
  }
  if (metrics.leads.current > metrics.leads.previous) {
    highlights.push(`🎯 ${metrics.leads.current} leads gerados este mês`);
  }
  if (metrics.posts.approved > 0) {
    highlights.push(`✅ ${metrics.posts.approved} conteúdos aprovados`);
  }
  
  // Formatar métricas
  const formattedMetrics = [
    {
      label: 'Seguidores',
      value: formatNumber(metrics.followers.current),
      change: metrics.followers.change,
      status: getMetricStatus(metrics.followers.change, 5, -5)
    },
    {
      label: 'Engajamento',
      value: `${metrics.engagement.current.toFixed(1)}%`,
      change: metrics.engagement.change,
      status: getMetricStatus(metrics.engagement.change, 0, -10)
    },
    {
      label: 'Alcance',
      value: formatNumber(metrics.reach.current),
      change: metrics.reach.change,
      status: getMetricStatus(metrics.reach.change, 0, -15)
    },
    {
      label: 'Leads',
      value: metrics.leads.current.toString(),
      change: metrics.leads.change,
      status: getMetricStatus(metrics.leads.change, 0, -20)
    }
  ];
  
  // Identificar oportunidades
  const opportunities = identifyOpportunities(metrics, context);
  
  // Gerar alertas
  const alerts = generateAlerts(metrics);
  
  // Gerar recomendações
  const recommendations = generateRecommendations(metrics, context);
  
  // Próximos passos
  const nextSteps = generateNextSteps(metrics);
  
  // Mensagem personalizada da Val
  const valMessage = generateValMessage(context, metrics, highlights);
  
  return {
    greeting,
    highlights,
    metrics: formattedMetrics,
    opportunities,
    alerts,
    recommendations,
    nextSteps,
    valMessage
  };
}

/**
 * Identificar oportunidades baseadas nos dados
 */
function identifyOpportunities(metrics: ClientMetrics, context: ClientContext): string[] {
  const opportunities: string[] = [];
  
  if (metrics.engagement.current > 3) {
    opportunities.push('Seu engajamento está alto - ótimo momento para lançar campanha');
  }
  
  if (metrics.followers.change > 5) {
    opportunities.push('Crescimento acelerado - considere ampliar investimento em ads');
  }
  
  if (metrics.posts.pending > 3) {
    opportunities.push(`${metrics.posts.pending} conteúdos aguardando aprovação`);
  }
  
  // Oportunidades sazonais
  const month = new Date().getMonth();
  if (month === 10) { // Novembro
    opportunities.push('Black Friday chegando - prepare campanhas especiais');
  }
  if (month === 11) { // Dezembro
    opportunities.push('Fim de ano - momento ideal para campanhas de agradecimento');
  }
  
  return opportunities.slice(0, 4);
}

/**
 * Gerar alertas baseados nas métricas
 */
function generateAlerts(metrics: ClientMetrics): string[] {
  const alerts: string[] = [];
  
  if (metrics.engagement.change < -10) {
    alerts.push('⚠️ Queda significativa no engajamento');
  }
  
  if (metrics.reach.change < -15) {
    alerts.push('⚠️ Alcance abaixo do esperado');
  }
  
  if (metrics.posts.pending > 5) {
    alerts.push(`⏳ ${metrics.posts.pending} conteúdos pendentes de aprovação`);
  }
  
  if (metrics.nps < 7) {
    alerts.push('📊 NPS precisa de atenção');
  }
  
  return alerts;
}

/**
 * Gerar recomendações personalizadas
 */
function generateRecommendations(metrics: ClientMetrics, context: ClientContext): string[] {
  const recommendations: string[] = [];
  
  if (metrics.engagement.change < 0) {
    recommendations.push('Aumentar frequência de Reels para recuperar engajamento');
  }
  
  if (metrics.followers.change < 5) {
    recommendations.push('Considerar campanha de crescimento de audiência');
  }
  
  if (metrics.leads.change < 0) {
    recommendations.push('Revisar CTAs e landing pages');
  }
  
  // Recomendações baseadas no setor
  if (context.industry === 'ecommerce') {
    recommendations.push('Explorar Instagram Shopping para vendas diretas');
  }
  
  if (context.industry === 'servicos') {
    recommendations.push('Criar mais conteúdo educativo e de autoridade');
  }
  
  return recommendations.slice(0, 4);
}

/**
 * Gerar próximos passos
 */
function generateNextSteps(metrics: ClientMetrics): string[] {
  const steps: string[] = [];
  
  if (metrics.posts.pending > 0) {
    steps.push(`Aprovar ${metrics.posts.pending} conteúdo(s) pendente(s)`);
  }
  
  steps.push('Revisar calendário da próxima semana');
  steps.push('Verificar resultados das últimas campanhas');
  
  return steps.slice(0, 3);
}

/**
 * Gerar mensagem personalizada da Val
 */
function generateValMessage(
  context: ClientContext,
  metrics: ClientMetrics,
  highlights: string[]
): string {
  const firstName = context.clientName.split(' ')[0];
  
  // Mensagem baseada no desempenho geral
  const overallPerformance = (
    metrics.followers.change + 
    metrics.engagement.change + 
    metrics.reach.change
  ) / 3;
  
  if (overallPerformance > 10) {
    return `${firstName}, você está arrasando! 🚀 Seus números estão excelentes e acima da média do mercado. Continue assim! Se precisar de algo, estou aqui.`;
  }
  
  if (overallPerformance > 0) {
    return `${firstName}, estamos no caminho certo! 📈 Os resultados estão positivos. Tenho algumas sugestões para acelerar ainda mais seu crescimento. Vamos conversar?`;
  }
  
  if (overallPerformance > -10) {
    return `${firstName}, temos alguns pontos para ajustar. 💪 Não se preocupe, já identifiquei oportunidades de melhoria. Que tal revisarmos juntos a estratégia?`;
  }
  
  return `${firstName}, precisamos conversar sobre sua estratégia. 🤝 Identifiquei alguns desafios, mas tenho ideias para reverter o cenário. Estou aqui para ajudar!`;
}

/**
 * Determinar status da métrica
 */
function getMetricStatus(change: number, goodThreshold: number, badThreshold: number): 'good' | 'warning' | 'bad' {
  if (change >= goodThreshold) return 'good';
  if (change <= badThreshold) return 'bad';
  return 'warning';
}

/**
 * Formatar números grandes
 */
function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

/**
 * Gerar email de resumo semanal
 */
export function generateWeeklyEmailContent(
  context: ClientContext,
  metrics: ClientMetrics
): {
  subject: string;
  preheader: string;
  body: string;
} {
  const summary = generateClientSummary(context, metrics);
  const firstName = context.clientName.split(' ')[0];
  
  const subject = metrics.followers.change > 0 
    ? `📈 ${firstName}, você cresceu ${metrics.followers.change}% esta semana!`
    : `📊 ${firstName}, seu resumo semanal está pronto`;
  
  const preheader = summary.highlights[0] || 'Confira os resultados da sua semana';
  
  const body = `
# ${summary.greeting}

Aqui está seu resumo semanal:

## Destaques
${summary.highlights.map(h => `- ${h}`).join('\n')}

## Suas Métricas
${summary.metrics.map(m => `- **${m.label}:** ${m.value} (${m.change > 0 ? '+' : ''}${m.change}%)`).join('\n')}

## Próximos Passos
${summary.nextSteps.map(s => `- ${s}`).join('\n')}

---

${summary.valMessage}

Com carinho,
**Val** 💜
Sua assistente Valle 360
  `.trim();
  
  return { subject, preheader, body };
}

/**
 * Gerar contexto para chat da Val
 */
export function generateValContext(
  context: ClientContext,
  metrics: ClientMetrics
): string {
  return `
Você é Val, a assistente IA da Valle 360. Está conversando com ${context.clientName} da empresa ${context.companyName}.

CONTEXTO DO CLIENTE:
- Setor: ${context.industry}
- Cliente desde: ${context.contractStart.toLocaleDateString('pt-BR')}
- Serviços contratados: ${context.services.join(', ')}
- Objetivos: ${context.goals.join(', ')}
- Concorrentes monitorados: ${context.competitors.join(', ')}

MÉTRICAS ATUAIS:
- Seguidores: ${metrics.followers.current} (${metrics.followers.change > 0 ? '+' : ''}${metrics.followers.change}%)
- Engajamento: ${metrics.engagement.current}% (${metrics.engagement.change > 0 ? '+' : ''}${metrics.engagement.change}%)
- Alcance: ${metrics.reach.current} (${metrics.reach.change > 0 ? '+' : ''}${metrics.reach.change}%)
- Leads: ${metrics.leads.current} (${metrics.leads.change > 0 ? '+' : ''}${metrics.leads.change}%)
- NPS: ${metrics.nps}

CONTEÚDOS:
- Agendados: ${metrics.posts.scheduled}
- Aprovados: ${metrics.posts.approved}
- Pendentes: ${metrics.posts.pending}

INSTRUÇÕES:
- Seja amigável, profissional e proativa
- Use emojis com moderação
- Baseie suas respostas nos dados reais do cliente
- Ofereça insights e sugestões práticas
- Se não souber algo específico, direcione para a equipe Valle 360
  `.trim();
}

export default {
  generateClientSummary,
  generateWeeklyEmailContent,
  generateValContext
};










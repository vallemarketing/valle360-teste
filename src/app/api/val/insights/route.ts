import { NextRequest, NextResponse } from 'next/server'
import { getValPersonality } from '@/lib/val/promptsByArea'

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const area = searchParams.get('area') || 'Designer'

    const personality = getValPersonality(area)

    // Generate insights based on area
    const insights = generateInsightsByArea(area)

    return NextResponse.json({
      area,
      personality: {
        name: personality.name,
        role: personality.role,
        tone: personality.tone
      },
      insights,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error getting insights:', error)
    return NextResponse.json(
      { error: 'Failed to get insights' },
      { status: 500 }
    )
  }
}

function generateInsightsByArea(area: string): string[] {
  const insightsByArea: Record<string, string[]> = {
    'Designer': [
      '🎨 Tendência: Glassmorphism está crescendo 45% em popularidade este mês',
      '💡 Dica: Considere usar espaçamento de 8px como base para manter consistência',
      '📈 Insight: Projetos com mood board organizado têm 30% menos revisões',
      '🔥 Novidade: Figma lançou novas ferramentas de auto-layout',
      '✨ Inspiração: Explore o trabalho de designers brasileiros no Behance esta semana'
    ],
    'Design Gráfico': [
      '🎨 Tendência: Glassmorphism está crescendo 45% em popularidade este mês',
      '💡 Dica: Considere usar espaçamento de 8px como base para manter consistência',
      '📈 Insight: Projetos com mood board organizado têm 30% menos revisões',
      '🔥 Novidade: Figma lançou novas ferramentas de auto-layout',
      '✨ Inspiração: Explore o trabalho de designers brasileiros no Behance esta semana'
    ],
    'Web Designer': [
      '⚡ Performance: Core Web Vitals são agora fator de ranqueamento no Google',
      '🎯 Dica UX: Botões primários devem ter no mínimo 44x44px para melhor usabilidade',
      '📱 Mobile-first: 70% dos usuários acessam via mobile, priorize essa experiência',
      '🔧 Ferramenta: CSS Container Queries já tem 89% de suporte nos navegadores',
      '♿ Acessibilidade: Contraste mínimo de 4.5:1 para textos pequenos (WCAG AA)'
    ],
    'Videomaker': [
      '🎬 Tendência: Vídeos verticais cresceram 120% em engajamento este ano',
      '🎵 Áudio: 85% dos vídeos são assistidos sem som, capriche nas legendas',
      '⏱️ Retenção: Os primeiros 3 segundos definem 60% da retenção da audiência',
      '🎨 Color Grading: LUTs gratuitas do DaVinci disponíveis na comunidade',
      '📊 Insight: Vídeos de 60-90s têm melhor performance no Instagram'
    ],
    'Head de Marketing': [
      '📊 ROI: Marketing de conteúdo gera 3x mais leads que paid ads por real investido',
      '🎯 Estratégia: 80% das decisões de compra B2B acontecem antes do contato com vendas',
      '📈 Growth: Empresas data-driven crescem 23% mais rápido que concorrentes',
      '💡 Tendência: Marketing conversacional aumenta conversão em até 40%',
      '🔄 Retenção: Custa 5x menos reter cliente do que adquirir novo'
    ],
    'Head Marketing': [
      '📊 ROI: Marketing de conteúdo gera 3x mais leads que paid ads por real investido',
      '🎯 Estratégia: 80% das decisões de compra B2B acontecem antes do contato com vendas',
      '📈 Growth: Empresas data-driven crescem 23% mais rápido que concorrentes',
      '💡 Tendência: Marketing conversacional aumenta conversão em até 40%',
      '🔄 Retenção: Custa 5x menos reter cliente do que adquirir novo'
    ],
    'Tráfego Pago': [
      '💰 CPC: CPCs aumentaram 15% este trimestre, otimize segmentações',
      '🎯 Segmentação: Públicos lookalike 1-3% performam 40% melhor que 4-10%',
      '📱 Mobile: 80% dos cliques vêm de mobile, otimize landing pages',
      '🔄 Remarketing: Taxas de conversão 10x maiores que cold traffic',
      '📊 Teste A/B: Mude apenas 1 variável por vez para resultados confiáveis'
    ],
    'Social Media': [
      '📱 Reels: Formato com maior alcance orgânico em 2024 (+180% vs posts)',
      '🕐 Horário: Posts entre 18h-21h têm 35% mais engajamento',
      '💬 Engagement: Responder comentários em até 1h aumenta alcance em 28%',
      '🔥 Trending: Áudios virais aumentam alcance em até 150%',
      '📊 Analytics: Taxa de salvamento é melhor indicador de qualidade que likes'
    ],
    'Comercial': [
      '🎯 Prospecção: Follow-ups aumentam taxa de fechamento em 80%',
      '💼 Negociação: Quem fala preço primeiro tende a perder 18% de margem',
      '📞 Cold Call: Terças e quintas entre 10h-11h têm melhor taxa de atendimento',
      '🤝 Relacionamento: 65% das vendas vêm de clientes existentes',
      '📊 Pipeline: Mantenha 3x mais em pipeline do que sua meta mensal'
    ],
    'RH': [
      '👥 Engajamento: Colaboradores engajados são 21% mais produtivos',
      '🎯 Retenção: Feedback regular reduz turnover em até 40%',
      '📚 Desenvolvimento: Empresas que investem em treinamento retêm 94% mais',
      '💡 Cultura: 88% dos profissionais consideram cultura ao aceitar oferta',
      '🏆 Reconhecimento: Reconhecer conquistas aumenta performance em 30%'
    ],
    'Financeiro': [
      '💰 Fluxo de Caixa: 82% das falências são por má gestão de caixa',
      '📊 KPI: Margem de contribuição é mais importante que faturamento',
      '💳 Inadimplência: Cobranças em até 3 dias reduzem inadimplência em 60%',
      '📈 Previsão: Budget rolling de 12 meses é 40% mais preciso que anual',
      '🔍 Análise: DRE gerencial deve ser revisada semanalmente, não mensalmente'
    ]
  }

  return insightsByArea[area] || insightsByArea['Designer']
}

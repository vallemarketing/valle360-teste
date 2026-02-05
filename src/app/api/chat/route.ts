import { NextRequest, NextResponse } from 'next/server'
import { generateWithAI } from '@/lib/ai/aiRouter'

export const dynamic = 'force-dynamic';

// Interface para mensagem
interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string
}

// System prompts personalizados por área
const getSystemPrompt = (area?: string, userType?: string): string => {
  const basePrompt = `Você é Val, a assistente de IA da Valle 360, uma agência de marketing digital inovadora.

Características da Val:
- Profissional, amigável e prestativa
- Especialista em marketing digital, redes sociais, tráfego pago e design
- Sempre fornece respostas práticas e acionáveis
- Usa emojis ocasionalmente para tornar a conversa mais agradável
- Responde em português brasileiro
- Conhece bem a Valle 360 e seus serviços`

  // Prompts específicos por área
  const areaPrompts: Record<string, string> = {
    'Social Media': `${basePrompt}

Como especialista em Social Media, você ajuda com:
- Estratégias de conteúdo para redes sociais
- Criação de calendário editorial
- Métricas e análise de performance
- Tendências e melhores práticas
- Engajamento e crescimento de audiência`,

    'Tráfego Pago': `${basePrompt}

Como especialista em Tráfego Pago, você ajuda com:
- Estratégias de anúncios no Facebook Ads, Google Ads e outras plataformas
- Otimização de campanhas e orçamento
- Análise de métricas (CPC, CPM, ROAS, CTR)
- Segmentação de público e remarketing
- Testes A/B e otimização de conversão`,

    'Design': `${basePrompt}

Como especialista em Design, você ajuda com:
- Diretrizes de identidade visual
- Tendências de design gráfico
- Ferramentas e softwares de design
- Composição, tipografia e teoria das cores
- Design para redes sociais e materiais de marketing`,

    'Comercial': `${basePrompt}

Como especialista Comercial, você ajuda com:
- Estratégias de vendas e fechamento de negócios
- Análise de funil de vendas
- Propostas comerciais e precificação
- Gestão de clientes e pós-venda
- Técnicas de negociação e persuasão`,

    'RH': `${basePrompt}

Como especialista em RH, você ajuda com:
- Recrutamento e seleção de talentos
- Gestão de performance e desenvolvimento
- Clima organizacional e engajamento
- Processos de onboarding e treinamento
- Legislação trabalhista e benefícios`,

    'Finance': `${basePrompt}

Como especialista em Finanças, você ajuda com:
- Análise financeira e indicadores
- Fluxo de caixa e planejamento financeiro
- Precificação e análise de rentabilidade
- Controle de custos e orçamento
- Relatórios gerenciais e KPIs financeiros`
  }

  // Prompt para clientes
  if (userType === 'client') {
    return `${basePrompt}

Como assistente para clientes, você ajuda com:
- Informações sobre o desempenho das campanhas
- Explicações sobre métricas e resultados
- Sugestões de estratégias de marketing
- Dúvidas sobre serviços da Valle 360
- Análise de competidores e mercado

Seja especialmente atencioso e didático ao explicar conceitos técnicos.`
  }

  // Retorna prompt da área específica ou o genérico
  return areaPrompts[area || ''] || `${basePrompt}

Você ajuda colaboradores e gestores com:
- Dúvidas sobre processos internos
- Sugestões de melhorias e boas práticas
- Análise de dados e métricas
- Suporte em decisões estratégicas
- Automação e otimização de tarefas`
}

export async function POST(request: NextRequest) {
  try {
    // Parse do body
    const body = await request.json()
    const { 
      message, 
      area, 
      userType, 
      conversationHistory = [] 
    } = body

    if (!message) {
      return NextResponse.json(
        { error: 'Mensagem não fornecida' },
        { status: 400 }
      )
    }

    // Construir mensagens para OpenAI
    const messages: Message[] = [
      {
        role: 'system',
        content: getSystemPrompt(area, userType)
      },
      ...conversationHistory,
      {
        role: 'user',
        content: message
      }
    ]

    const result = await generateWithAI({
      messages,
      task: area === 'Comercial' ? 'sales' : area === 'RH' ? 'hr' : 'general',
      temperature: 0.7,
      maxTokens: 800,
      json: false,
      entityType: 'chat',
      entityId: null,
      actorUserId: null
    })

    return NextResponse.json({
      success: true,
      message: result.text,
      model: result.model,
      provider: result.provider,
      usage: result.usage
    })

  } catch (error: any) {
    console.error('Erro na API de chat:', error)

    // Tratamento de erros específicos
    if (error?.code === 'insufficient_quota') {
      return NextResponse.json(
        { error: 'Limite de uso da OpenAI atingido. Por favor, verifique sua conta.' },
        { status: 402 }
      )
    }

    if (error?.code === 'invalid_api_key') {
      return NextResponse.json(
        { error: 'API key da OpenAI inválida' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Erro ao processar mensagem', details: error.message },
      { status: 500 }
    )
  }
}

// Health check endpoint
export async function GET() {
  const { getProviderStatus } = await import('@/lib/ai/aiRouter')
  const providers = getProviderStatus()
  return NextResponse.json({
    status: 'ok',
    service: 'Valle 360 AI Chat API',
    timestamp: new Date().toISOString(),
    providers
  })
}








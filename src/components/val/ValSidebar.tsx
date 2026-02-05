'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Send, Sparkles, Loader2, Copy, Check, 
  Lightbulb, FileText, Target, TrendingUp,
  MessageSquare, Zap, ChevronDown, Coffee,
  Brain, RefreshCw, Clock, AlertTriangle, Users, Calendar
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  actions?: ActionButton[];
}

interface ActionButton {
  label: string;
  action: string;
  icon?: React.ReactNode;
}

interface QuickAction {
  id: string;
  label: string;
  prompt: string;
  icon: React.ReactNode;
}

interface Icebreaker {
  id: string;
  question: string;
  category: 'fun' | 'professional' | 'creative';
}

// ==================== QUICK ACTIONS POR ÁREA ====================
const QUICK_ACTIONS: Record<string, QuickAction[]> = {
  comercial: [
    { id: '1', label: 'Texto de Upsell', prompt: 'Gere um texto persuasivo para oferecer serviços adicionais ao cliente', icon: <TrendingUp className="w-4 h-4" /> },
    { id: '2', label: 'Texto de Cobrança', prompt: 'Gere um texto amigável para cobrar um cliente inadimplente', icon: <FileText className="w-4 h-4" /> },
    { id: '3', label: 'Análise de Lead', prompt: 'Analise este lead e sugira a melhor abordagem', icon: <Target className="w-4 h-4" /> },
    { id: '4', label: 'Proposta Comercial', prompt: 'Me ajude a criar uma proposta comercial', icon: <Lightbulb className="w-4 h-4" /> },
  ],
  trafego: [
    { id: '1', label: 'Otimizar Campanha', prompt: 'Sugira otimizações para minhas campanhas de tráfego', icon: <TrendingUp className="w-4 h-4" /> },
    { id: '2', label: 'Analisar ROAS', prompt: 'Analise o ROAS das minhas campanhas e sugira melhorias', icon: <Target className="w-4 h-4" /> },
    { id: '3', label: 'Texto para Cliente', prompt: 'Gere um texto explicando a performance para o cliente', icon: <FileText className="w-4 h-4" /> },
    { id: '4', label: 'Budget Ideal', prompt: 'Qual o budget ideal para esta campanha?', icon: <Lightbulb className="w-4 h-4" /> },
  ],
  social_media: [
    { id: '1', label: 'Criar Legenda', prompt: 'Crie uma legenda criativa para este post', icon: <FileText className="w-4 h-4" /> },
    { id: '2', label: 'Sugerir Hashtags', prompt: 'Sugira as melhores hashtags para este conteúdo', icon: <Target className="w-4 h-4" /> },
    { id: '3', label: 'Melhor Horário', prompt: 'Qual o melhor horário para postar este conteúdo?', icon: <TrendingUp className="w-4 h-4" /> },
    { id: '4', label: 'Ideias de Conteúdo', prompt: 'Sugira ideias de conteúdo para esta semana', icon: <Lightbulb className="w-4 h-4" /> },
  ],
  designer: [
    { id: '1', label: 'Analisar Briefing', prompt: 'Analise este briefing e sugira melhorias', icon: <FileText className="w-4 h-4" /> },
    { id: '2', label: 'Referências', prompt: 'Sugira referências de design para este projeto', icon: <Lightbulb className="w-4 h-4" /> },
    { id: '3', label: 'Feedback de Arte', prompt: 'Dê feedback sobre esta arte', icon: <Target className="w-4 h-4" /> },
    { id: '4', label: 'Tendências', prompt: 'Quais as tendências de design atuais?', icon: <TrendingUp className="w-4 h-4" /> },
  ],
  web_designer: [
    { id: '1', label: 'Estrutura de Site', prompt: 'Sugira a melhor estrutura para este site', icon: <FileText className="w-4 h-4" /> },
    { id: '2', label: 'Otimização SEO', prompt: 'Dê dicas de SEO para este projeto', icon: <TrendingUp className="w-4 h-4" /> },
    { id: '3', label: 'UX/UI Review', prompt: 'Analise a UX/UI deste layout', icon: <Target className="w-4 h-4" /> },
    { id: '4', label: 'Performance', prompt: 'Como otimizar a performance deste site?', icon: <Lightbulb className="w-4 h-4" /> },
  ],
  video_maker: [
    { id: '1', label: 'Roteiro', prompt: 'Me ajude a criar um roteiro para este vídeo', icon: <FileText className="w-4 h-4" /> },
    { id: '2', label: 'Sugerir Cortes', prompt: 'Sugira os melhores cortes para este vídeo', icon: <Target className="w-4 h-4" /> },
    { id: '3', label: 'Trilha Sonora', prompt: 'Qual trilha sonora combina com este vídeo?', icon: <TrendingUp className="w-4 h-4" /> },
    { id: '4', label: 'Legendas', prompt: 'Gere legendas para este vídeo', icon: <Lightbulb className="w-4 h-4" /> },
  ],
  head_marketing: [
    { id: '1', label: 'Análise de Cliente', prompt: 'Analise a performance deste cliente', icon: <Target className="w-4 h-4" /> },
    { id: '2', label: 'Relatório Mensal', prompt: 'Me ajude a criar o relatório mensal', icon: <FileText className="w-4 h-4" /> },
    { id: '3', label: 'Alocação de Equipe', prompt: 'Sugira a melhor alocação da equipe', icon: <Users className="w-4 h-4" /> },
    { id: '4', label: 'Estratégia', prompt: 'Sugira uma estratégia de marketing integrada', icon: <Lightbulb className="w-4 h-4" /> },
  ],
  rh: [
    { id: '1', label: 'Triagem de CV', prompt: 'Analise este currículo e dê uma pontuação', icon: <FileText className="w-4 h-4" /> },
    { id: '2', label: 'Perguntas Entrevista', prompt: 'Sugira perguntas para entrevista', icon: <Target className="w-4 h-4" /> },
    { id: '3', label: 'Feedback', prompt: 'Me ajude a dar feedback para um colaborador', icon: <MessageSquare className="w-4 h-4" /> },
    { id: '4', label: 'Onboarding', prompt: 'Crie um checklist de onboarding', icon: <Lightbulb className="w-4 h-4" /> },
  ],
  financeiro: [
    { id: '1', label: 'Texto de Cobrança', prompt: 'Gere um texto de cobrança amigável', icon: <FileText className="w-4 h-4" /> },
    { id: '2', label: 'Análise de Fluxo', prompt: 'Analise o fluxo de caixa', icon: <TrendingUp className="w-4 h-4" /> },
    { id: '3', label: 'Projeção', prompt: 'Faça uma projeção financeira', icon: <Target className="w-4 h-4" /> },
    { id: '4', label: 'Relatório', prompt: 'Me ajude a criar um relatório financeiro', icon: <Lightbulb className="w-4 h-4" /> },
  ],
  juridico: [
    { id: '1', label: 'Analisar Contrato', prompt: 'Analise este contrato e identifique riscos', icon: <FileText className="w-4 h-4" /> },
    { id: '2', label: 'Calcular Multa', prompt: 'Calcule a multa por quebra de contrato', icon: <Target className="w-4 h-4" /> },
    { id: '3', label: 'Carta de Cobrança', prompt: 'Gere uma carta de cobrança extrajudicial', icon: <MessageSquare className="w-4 h-4" /> },
    { id: '4', label: 'Dúvida Trabalhista', prompt: 'Tenho uma dúvida sobre direito trabalhista', icon: <Lightbulb className="w-4 h-4" /> },
  ],
  default: [
    { id: '1', label: 'Priorizar Tarefas', prompt: 'Me ajude a priorizar minhas tarefas de hoje', icon: <Target className="w-4 h-4" /> },
    { id: '2', label: 'Resumir Semana', prompt: 'Resuma minha performance desta semana', icon: <TrendingUp className="w-4 h-4" /> },
    { id: '3', label: 'Dicas de Produtividade', prompt: 'Me dê dicas para ser mais produtivo', icon: <Lightbulb className="w-4 h-4" /> },
    { id: '4', label: 'Criar Tarefa', prompt: 'Me ajude a criar uma nova tarefa', icon: <FileText className="w-4 h-4" /> },
  ]
};

// ==================== ICEBREAKERS POR ÁREA ====================
const ICEBREAKERS: Record<string, Icebreaker[]> = {
  comercial: [
    { id: '1', question: 'Qual foi a venda mais desafiadora que você já fechou?', category: 'professional' },
    { id: '2', question: 'Se você pudesse vender qualquer produto no mundo, qual seria?', category: 'creative' },
    { id: '3', question: 'Qual é a sua técnica favorita de rapport?', category: 'professional' },
    { id: '4', question: 'Café ou chá para começar as ligações do dia?', category: 'fun' },
  ],
  trafego: [
    { id: '1', question: 'Qual foi a campanha com melhor ROAS que você já fez?', category: 'professional' },
    { id: '2', question: 'Meta Ads ou Google Ads: qual você prefere e por quê?', category: 'professional' },
    { id: '3', question: 'Se você tivesse budget ilimitado, que tipo de campanha criaria?', category: 'creative' },
    { id: '4', question: 'Qual métrica você olha primeiro ao acordar?', category: 'fun' },
  ],
  social_media: [
    { id: '1', question: 'Qual foi o post que mais viralizou na sua carreira?', category: 'professional' },
    { id: '2', question: 'Reels ou TikTok: onde você mais gosta de criar?', category: 'professional' },
    { id: '3', question: 'Se você fosse um meme, qual seria?', category: 'fun' },
    { id: '4', question: 'Qual trend você adoraria que voltasse?', category: 'creative' },
  ],
  designer: [
    { id: '1', question: 'Qual é o seu projeto de design favorito até hoje?', category: 'professional' },
    { id: '2', question: 'Figma ou Photoshop para começar um projeto?', category: 'professional' },
    { id: '3', question: 'Se você pudesse redesenhar qualquer marca famosa, qual seria?', category: 'creative' },
    { id: '4', question: 'Qual cor você nunca usaria em um projeto?', category: 'fun' },
  ],
  web_designer: [
    { id: '1', question: 'Qual foi o site mais complexo que você já desenvolveu?', category: 'professional' },
    { id: '2', question: 'Next.js ou Wordpress: qual você prefere?', category: 'professional' },
    { id: '3', question: 'Se você pudesse redesenhar qualquer site famoso, qual seria?', category: 'creative' },
    { id: '4', question: 'Light mode ou dark mode no seu IDE?', category: 'fun' },
  ],
  video_maker: [
    { id: '1', question: 'Qual foi o vídeo mais desafiador que você já editou?', category: 'professional' },
    { id: '2', question: 'Premiere ou DaVinci Resolve?', category: 'professional' },
    { id: '3', question: 'Se você pudesse dirigir um filme, qual gênero seria?', category: 'creative' },
    { id: '4', question: 'Qual é a sua trilha sonora favorita para editar?', category: 'fun' },
  ],
  head_marketing: [
    { id: '1', question: 'Qual foi a campanha mais bem-sucedida que você liderou?', category: 'professional' },
    { id: '2', question: 'Como você equilibra criatividade e dados nas decisões?', category: 'professional' },
    { id: '3', question: 'Se você pudesse ter qualquer ferramenta de marketing, qual seria?', category: 'creative' },
    { id: '4', question: 'Reunião de segunda ou sexta: qual você prefere?', category: 'fun' },
  ],
  rh: [
    { id: '1', question: 'Qual foi a contratação mais acertada que você já fez?', category: 'professional' },
    { id: '2', question: 'Entrevista presencial ou remota: qual você prefere?', category: 'professional' },
    { id: '3', question: 'Se você pudesse criar um benefício inovador, qual seria?', category: 'creative' },
    { id: '4', question: 'Qual é a pergunta de entrevista mais inusitada que você já fez?', category: 'fun' },
  ],
  default: [
    { id: '1', question: 'O que te motivou a trabalhar nessa área?', category: 'professional' },
    { id: '2', question: 'Qual habilidade você gostaria de desenvolver este ano?', category: 'professional' },
    { id: '3', question: 'Se você pudesse trabalhar em qualquer lugar do mundo, onde seria?', category: 'creative' },
    { id: '4', question: 'Café ou chá para começar o dia?', category: 'fun' },
  ]
};

// ==================== CONHECIMENTO DA ÁREA ====================
const AREA_KNOWLEDGE: Record<string, string[]> = {
  comercial: [
    'Técnicas de vendas consultivas e SPIN Selling',
    'Gestão de pipeline e funil de vendas',
    'Negociação e fechamento de contratos',
    'CRM e automação de vendas',
    'Métricas: CAC, LTV, Churn Rate, MRR'
  ],
  trafego: [
    'Meta Ads, Google Ads, TikTok Ads',
    'Otimização de campanhas e ROAS',
    'Pixel, conversões e tracking',
    'Remarketing e públicos semelhantes',
    'Métricas: CTR, CPC, CPM, CPA, ROAS'
  ],
  social_media: [
    'Estratégia de conteúdo para redes sociais',
    'Algoritmos e melhores horários de postagem',
    'Engajamento e crescimento orgânico',
    'Tendências e formatos (Reels, Stories, Carrossel)',
    'Métricas: Alcance, Impressões, Engajamento, Crescimento'
  ],
  designer: [
    'Princípios de design e composição',
    'Teoria das cores e tipografia',
    'Ferramentas: Figma, Photoshop, Illustrator',
    'Branding e identidade visual',
    'Tendências de design e UI/UX'
  ],
  web_designer: [
    'Desenvolvimento web responsivo',
    'Next.js, React, WordPress',
    'SEO técnico e performance',
    'UX/UI e acessibilidade',
    'Integração com APIs e backends'
  ],
  video_maker: [
    'Edição de vídeo profissional',
    'Premiere Pro, DaVinci Resolve, After Effects',
    'Motion graphics e animação',
    'Colorização e correção de cor',
    'Trilha sonora e sound design'
  ],
  head_marketing: [
    'Gestão de equipes multidisciplinares',
    'Planejamento estratégico de marketing',
    'Análise de ROI e performance',
    'Gestão de clientes e relacionamento',
    'Métricas consolidadas e reporting'
  ],
  rh: [
    'Recrutamento e seleção',
    'Gestão de desempenho e avaliações',
    'Clima organizacional e engajamento',
    'Onboarding e treinamento',
    'Legislação trabalhista'
  ],
  financeiro: [
    'Gestão de contas a pagar e receber',
    'Fluxo de caixa e projeções',
    'Faturamento e cobrança',
    'Conciliação bancária',
    'Relatórios financeiros'
  ],
  juridico: [
    'Contratos e cláusulas',
    'Direito trabalhista',
    'Cobrança judicial e extrajudicial',
    'Compliance e LGPD',
    'Multas e penalidades contratuais'
  ]
};

export function ValSidebar() {
  const { user, valChatOpen, setValChatOpen } = useApp();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [showIcebreaker, setShowIcebreaker] = useState(false);
  const [currentIcebreaker, setCurrentIcebreaker] = useState<Icebreaker | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (valChatOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [valChatOpen]);

  // Get quick actions and icebreakers based on user role
  const userArea = user?.area || user?.role || 'default';
  const quickActions = QUICK_ACTIONS[userArea] || QUICK_ACTIONS.default;
  const icebreakers = ICEBREAKERS[userArea] || ICEBREAKERS.default;
  const areaKnowledge = AREA_KNOWLEDGE[userArea] || [];

  // Get random icebreaker
  const getRandomIcebreaker = () => {
    const randomIndex = Math.floor(Math.random() * icebreakers.length);
    setCurrentIcebreaker(icebreakers[randomIndex]);
    setShowIcebreaker(true);
  };

  // Send message to Val
  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setShowQuickActions(false);
    setShowIcebreaker(false);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content
          })),
          context: {
            userName: user?.fullName,
            userRole: user?.role,
            userArea: user?.area,
            areaKnowledge: areaKnowledge
          }
        })
      });

      if (!response.ok) throw new Error('Erro na resposta');

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message || data.content || 'Desculpe, não consegui processar sua solicitação.',
        timestamp: new Date(),
        actions: data.actions
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Desculpe, ocorreu um erro. Tente novamente em alguns instantes.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle quick action click
  const handleQuickAction = (action: QuickAction) => {
    sendMessage(action.prompt);
  };

  // Copy message to clipboard
  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  // Clear chat
  const clearChat = () => {
    setMessages([]);
    setShowQuickActions(true);
    setShowIcebreaker(false);
  };

  if (!valChatOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: '100%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed right-0 top-0 h-full w-full sm:w-[420px] z-50 flex flex-col shadow-2xl"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between p-4 border-b"
          style={{ 
            background: 'linear-gradient(135deg, var(--purple-500) 0%, var(--primary-500) 100%)',
            borderColor: 'var(--border-light)'
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-white">Val</h2>
              <p className="text-xs text-white/80">Assistente IA Valle 360</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <button
                onClick={clearChat}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white text-xs"
              >
                Limpar
              </button>
            )}
            <button
              onClick={() => setValChatOpen(false)}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Welcome message */}
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-6"
            >
              <div 
                className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                style={{ backgroundColor: 'var(--purple-100)' }}
              >
                <Sparkles className="w-8 h-8" style={{ color: 'var(--purple-500)' }} />
              </div>
              <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>
                Olá, {user?.fullName?.split(' ')[0]}! 👋
              </h3>
              <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                Sou a Val, sua assistente de IA especializada em {userArea === 'default' ? 'produtividade' : userArea.replace('_', ' ')}.
              </p>
              
              {/* Area Knowledge Badge */}
              {areaKnowledge.length > 0 && (
                <div className="mb-4 p-3 rounded-xl text-left" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="w-4 h-4" style={{ color: 'var(--purple-500)' }} />
                    <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                      Meu conhecimento inclui:
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {areaKnowledge.slice(0, 3).map((knowledge, i) => (
                      <span 
                        key={i}
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{ 
                          backgroundColor: 'var(--purple-100)',
                          color: 'var(--purple-700)'
                        }}
                      >
                        {knowledge}
                      </span>
                    ))}
                    {areaKnowledge.length > 3 && (
                      <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        +{areaKnowledge.length - 3} mais
                      </span>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Icebreaker Button */}
          {messages.length === 0 && !showIcebreaker && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={getRandomIcebreaker}
              className="w-full p-3 rounded-xl border flex items-center justify-center gap-2 hover:shadow-md transition-all"
              style={{ 
                borderColor: 'var(--border-light)',
                backgroundColor: 'var(--bg-secondary)'
              }}
            >
              <Coffee className="w-4 h-4" style={{ color: 'var(--purple-500)' }} />
              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Pergunta quebra-gelo ☕
              </span>
            </motion.button>
          )}

          {/* Icebreaker Display */}
          {showIcebreaker && currentIcebreaker && messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 rounded-xl"
              style={{ 
                background: 'linear-gradient(135deg, var(--purple-50) 0%, var(--primary-50) 100%)',
                border: '1px solid var(--purple-200)'
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Coffee className="w-4 h-4" style={{ color: 'var(--purple-500)' }} />
                <span className="text-xs font-medium" style={{ color: 'var(--purple-600)' }}>
                  Pergunta Quebra-Gelo
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  currentIcebreaker.category === 'fun' ? 'bg-yellow-100 text-yellow-700' :
                  currentIcebreaker.category === 'professional' ? 'bg-blue-100 text-blue-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {currentIcebreaker.category === 'fun' ? '😄 Divertida' :
                   currentIcebreaker.category === 'professional' ? '💼 Profissional' : '🎨 Criativa'}
                </span>
              </div>
              <p className="text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>
                "{currentIcebreaker.question}"
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => sendMessage(currentIcebreaker.question)}
                  className="flex-1 px-3 py-2 rounded-lg text-sm font-medium text-white"
                  style={{ backgroundColor: 'var(--purple-500)' }}
                >
                  Responder com Val
                </button>
                <button
                  onClick={getRandomIcebreaker}
                  className="p-2 rounded-lg border"
                  style={{ borderColor: 'var(--border-light)' }}
                >
                  <RefreshCw className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                </button>
              </div>
            </motion.div>
          )}

          {/* Quick Actions */}
          {showQuickActions && messages.length === 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
                Ações rápidas para {userArea === 'default' ? 'você' : userArea.replace('_', ' ')}:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {quickActions.map((action) => (
                  <motion.button
                    key={action.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleQuickAction(action)}
                    className="p-3 rounded-xl text-left transition-all border"
                    style={{ 
                      backgroundColor: 'var(--bg-secondary)',
                      borderColor: 'var(--border-light)'
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1" style={{ color: 'var(--purple-500)' }}>
                      {action.icon}
                    </div>
                    <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                      {action.label}
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* Messages List */}
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-4 ${
                  message.role === 'user'
                    ? 'rounded-br-md'
                    : 'rounded-bl-md'
                }`}
                style={{
                  backgroundColor: message.role === 'user' 
                    ? 'var(--primary-500)' 
                    : 'var(--bg-secondary)',
                  color: message.role === 'user' 
                    ? 'white' 
                    : 'var(--text-primary)'
                }}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                
                {/* Actions */}
                {message.actions && message.actions.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {message.actions.map((action, idx) => (
                      <button
                        key={idx}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors"
                        style={{
                          backgroundColor: 'var(--purple-500)',
                          color: 'white'
                        }}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Copy button for assistant messages */}
                {message.role === 'assistant' && (
                  <button
                    onClick={() => copyToClipboard(message.content, message.id)}
                    className="mt-2 flex items-center gap-1 text-xs opacity-60 hover:opacity-100 transition-opacity"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    {copiedId === message.id ? (
                      <>
                        <Check className="w-3 h-3" />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        Copiar
                      </>
                    )}
                  </button>
                )}
              </div>
            </motion.div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div 
                className="rounded-2xl rounded-bl-md p-4"
                style={{ backgroundColor: 'var(--bg-secondary)' }}
              >
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--purple-500)' }} />
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Val está pensando...
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div 
          className="p-4 border-t"
          style={{ borderColor: 'var(--border-light)' }}
        >
          <div 
            className="flex items-end gap-2 p-2 rounded-xl border"
            style={{ 
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border-light)'
            }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Digite sua mensagem..."
              rows={1}
              className="flex-1 bg-transparent resize-none outline-none text-sm p-2"
              style={{ 
                color: 'var(--text-primary)',
                maxHeight: '120px'
              }}
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isLoading}
              className="p-2 rounded-lg transition-colors disabled:opacity-50"
              style={{ 
                backgroundColor: input.trim() ? 'var(--purple-500)' : 'var(--neutral-300)',
                color: 'white'
              }}
            >
              <Send className="w-5 h-5" />
            </motion.button>
          </div>
          <p className="text-xs text-center mt-2" style={{ color: 'var(--text-tertiary)' }}>
            Val pode cometer erros. Verifique informações importantes.
          </p>
        </div>
      </motion.div>

      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setValChatOpen(false)}
        className="fixed inset-0 bg-black/20 z-40 sm:hidden"
      />
    </AnimatePresence>
  );
}

// ==================== BOTÃO FLUTUANTE VAL ====================
export function ValFloatingButton() {
  const { setValChatOpen, valChatOpen } = useApp();
  const [isMessagesPage, setIsMessagesPage] = React.useState(false);
  const [showTooltip, setShowTooltip] = React.useState(false);

  React.useEffect(() => {
    // Verificar se está na página de mensagens
    const checkPage = () => {
      setIsMessagesPage(window.location.pathname.includes('/mensagens'));
    };
    checkPage();
    window.addEventListener('popstate', checkPage);
    
    // Observer para mudanças de rota em SPA
    const observer = new MutationObserver(checkPage);
    observer.observe(document.body, { childList: true, subtree: true });
    
    return () => {
      window.removeEventListener('popstate', checkPage);
      observer.disconnect();
    };
  }, []);

  // Mostrar tooltip periodicamente
  React.useEffect(() => {
    const interval = setInterval(() => {
      if (!valChatOpen && !isMessagesPage) {
        setShowTooltip(true);
        setTimeout(() => setShowTooltip(false), 3000);
      }
    }, 60000); // A cada 1 minuto

    // Mostrar na primeira vez após 5 segundos
    const timeout = setTimeout(() => {
      if (!valChatOpen && !isMessagesPage) {
        setShowTooltip(true);
        setTimeout(() => setShowTooltip(false), 3000);
      }
    }, 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [valChatOpen, isMessagesPage]);

  // Não mostrar na página de mensagens ou quando Val está aberta
  if (valChatOpen || isMessagesPage) return null;

  return (
    <div className="fixed bottom-20 right-6 z-40">
      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="absolute bottom-16 right-0 px-3 py-2 rounded-lg shadow-lg whitespace-nowrap"
            style={{ 
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border-light)'
            }}
          >
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              👋 Precisa de ajuda?
            </p>
            <div 
              className="absolute bottom-[-6px] right-6 w-3 h-3 rotate-45"
              style={{ 
                backgroundColor: 'var(--bg-primary)',
                borderRight: '1px solid var(--border-light)',
                borderBottom: '1px solid var(--border-light)'
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setValChatOpen(true)}
        className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center"
        style={{ 
          background: 'linear-gradient(135deg, var(--purple-500) 0%, var(--primary-500) 100%)'
        }}
      >
        <Sparkles className="w-6 h-6 text-white" />
        
        {/* Pulse animation */}
        <span className="absolute inset-0 rounded-full animate-ping opacity-20" 
          style={{ backgroundColor: 'var(--purple-500)' }} 
        />
      </motion.button>
    </div>
  );
}

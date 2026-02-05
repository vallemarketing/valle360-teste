"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { 
  X, 
  Send, 
  Mic, 
  Globe,
  TrendingUp,
  Calendar,
  Target,
  FileText,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PromptSuggestion } from "@/components/ui/prompt-suggestion";
import { AILoaderDots } from "@/components/ui/ai-loader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ============================================
// VAL FLOATING CHAT - VALLE AI
// Chat flutuante com avatar, toolbar e animações
// AGORA COM PERSONAS ESPECIALIZADAS
// ============================================

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  sources?: string[];
  persona?: {
    name: string;
    title: string;
    emoji: string;
  };
}

interface ValPersona {
  name: string;
  title: string;
  emoji: string;
}

interface QuickAction {
  icon: React.ComponentType<{ className?: string }>;
  text: string;
  color: string;
}

interface ValFloatingChatProps {
  userName?: string;
}

const DEFAULT_QUICK_ACTIONS = [
  { 
    icon: TrendingUp, 
    text: "Análise de desempenho",
    color: "text-emerald-600"
  },
  { 
    icon: Calendar, 
    text: "Agendar reunião",
    color: "text-[#1672d6]"
  },
  { 
    icon: Target, 
    text: "Ver concorrentes",
    color: "text-purple-600"
  },
  { 
    icon: FileText, 
    text: "Gerar relatório",
    color: "text-primary"
  },
];

// Ação especial para colaboradores - sugestão de próxima tarefa
const KANBAN_QUICK_ACTION = {
  icon: Target,
  text: "Qual minha próxima tarefa?",
  color: "text-primary"
};

export function ValFloatingChat({ userName = "Cliente" }: ValFloatingChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [selectedModel, setSelectedModel] = useState("val-pro");
  const [webSearch, setWebSearch] = useState(false);
  const [showGreeting, setShowGreeting] = useState(false);
  const [persona, setPersona] = useState<ValPersona>({ name: 'Val', title: 'Sua Assistente IA', emoji: '🤖' });
  const [quickActions, setQuickActions] = useState<QuickAction[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Buscar persona do usuário ao montar
  useEffect(() => {
    const fetchPersona = async () => {
      try {
        const response = await fetch('/api/ai/val');
        if (response.ok) {
          const data = await response.json();
          if (data.persona) {
            setPersona(data.persona);
          }
          if (data.quickActions) {
            setQuickActions(data.quickActions);
          }
        }
      } catch (error) {
        console.error('Erro ao buscar persona:', error);
      }
    };
    fetchPersona();
  }, []);

  // Mostrar saudação após 10 segundos e esconder após 10 segundos
  useEffect(() => {
    const showTimer = setTimeout(() => {
      setShowGreeting(true);
    }, 10000);

    return () => clearTimeout(showTimer);
  }, []);

  // Esconder saudação automaticamente após 10 segundos de ser exibida
  useEffect(() => {
    if (showGreeting) {
      const hideTimer = setTimeout(() => {
        setShowGreeting(false);
      }, 10000); // 10 segundos visível

      return () => clearTimeout(hideTimer);
    }
  }, [showGreeting]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Epic 12: quebra-gelo automático com insights web (clientes) – 1x/dia (localStorage)
  useEffect(() => {
    if (!isOpen) return;
    // Só buscar se ainda não existe nenhuma mensagem (evita duplicar ao reabrir)
    if (messages.length > 0) return;

    const key = `val_web_insights_${new Date().toDateString()}`;
    try {
      const cached = localStorage.getItem(key);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.message) {
          setMessages([
            {
              id: `web-${Date.now()}`,
              text: String(parsed.message),
              isUser: false,
              timestamp: new Date(),
              sources: Array.isArray(parsed.sources) ? parsed.sources.map(String) : undefined,
            },
          ]);
          return;
        }
      }
    } catch {
      // ignore
    }

    (async () => {
      try {
        const r = await fetch('/api/ai/val/web-insights');
        const data = await r.json().catch(() => null);
        if (!r.ok) return;
        if (data?.skip) return;
        if (!data?.success) return;
        if (!data?.message) return;

        const next: Message = {
          id: `web-${Date.now()}`,
          text: String(data.message),
          isUser: false,
          timestamp: new Date(),
          sources: Array.isArray(data.sources) ? data.sources.map(String) : undefined,
        };
        setMessages([next]);
        try {
          localStorage.setItem(
            key,
            JSON.stringify({
              message: next.text,
              sources: next.sources || [],
              generatedAt: data.generatedAt || new Date().toISOString(),
              provider: data.provider || 'unknown',
            })
          );
        } catch {
          // ignore
        }
      } catch {
        // best-effort
      }
    })();
  }, [isOpen, messages.length]);

  const handleSend = async (overrideText?: string) => {
    const textToSend = typeof overrideText === 'string' ? overrideText : inputValue;
    if (!String(textToSend || '').trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: textToSend,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = textToSend;
    setInputValue("");
    setIsTyping(true);

    try {
      // Chamar API real da Val
      const response = await fetch('/api/ai/val', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: currentInput,
          context: { webSearch },
          history: messages.slice(-10).map(m => ({
            role: m.isUser ? 'user' : 'assistant',
            content: m.text
          }))
        })
      });

      const data = await response.json();

      if (data.success && data.response) {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: data.response.message || 'Desculpe, não consegui processar sua mensagem.',
          isUser: false,
          timestamp: new Date(),
          sources: Array.isArray(data.sources)
            ? data.sources.map(String)
            : Array.isArray(data?.response?.sources)
              ? data.response.sources.map(String)
              : undefined,
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        throw new Error(data.error || 'Erro desconhecido');
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Desculpe, tive um problema ao processar sua mensagem. Pode tentar novamente? 🙏",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickAction = (action: string) => {
    void handleSend(action);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Container do botão flutuante + balão de mensagem */}
      <div className={cn(
        "fixed bottom-6 right-6 z-50 flex items-end gap-3",
        isOpen && "hidden"
      )}>
        {/* Balão de mensagem - sempre visível */}
        <AnimatePresence>
          {showGreeting && (
            <motion.div
              initial={{ opacity: 0, x: 20, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.9 }}
              transition={{ duration: 0.3, delay: 0.5 }}
              className="relative"
            >
              <div className="bg-white dark:bg-[#0a0f1a] rounded-2xl shadow-2xl p-4 pr-8 max-w-[220px] border border-[#001533]/10 dark:border-white/10">
                <p className="text-sm text-[#001533] dark:text-white">
                  Olá, <span className="font-semibold">{userName}</span>! 👋
                </p>
                <p className="text-sm text-[#001533]/70 dark:text-white/70 mt-1">
                  Como posso te ajudar hoje?
                </p>
                <p className="text-xs text-[#1672d6] font-medium mt-2">
                  Clique aqui! 🚀
                </p>
                
                {/* Botão X para fechar */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowGreeting(false);
                  }}
                  className="absolute top-2 right-2 p-1 rounded-full hover:bg-[#001533]/5 dark:hover:bg-white/10 transition-colors"
                >
                  <X className="size-3 text-[#001533]/40 dark:text-white/40" />
                </button>
                
                {/* Seta apontando para a Val */}
                <div className="absolute top-1/2 -right-2 -translate-y-1/2 w-3 h-3 bg-white dark:bg-[#0a0f1a] border-r border-t border-[#001533]/10 dark:border-white/10 rotate-45" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Botão da Val */}
        <motion.button
          onClick={() => setIsOpen(true)}
          className={cn(
            "w-16 h-16 rounded-full shadow-xl",
            "overflow-hidden flex-shrink-0",
            "hover:shadow-2xl hover:scale-105 transition-all",
            "border-3 border-white shadow-lg"
          )}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
        >
          <Image
            src="/images/Val.png"
            alt="Val - Assistente IA"
            width={64}
            height={64}
            className="w-full h-full object-cover"
            priority
          />
        </motion.button>
      </div>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "fixed bottom-6 right-6 z-50",
              "w-[380px] h-[600px] max-h-[80vh]",
              "bg-white dark:bg-[#0a0f1a] rounded-2xl shadow-2xl",
              "border border-[#001533]/10 dark:border-white/10",
              "flex flex-col overflow-hidden"
            )}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#001533] to-[#1672d6] p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative w-11 h-11 flex-shrink-0">
                  <Image
                    src="/images/Val.png"
                    alt="Val"
                    fill
                    className="rounded-full border-2 border-white/30 object-cover"
                  />
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Val</h3>
                  <p className="text-white/70 text-xs">Sua assistente Valle 360</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Mensagem Fixa - Saudação personalizada */}
            <div className="px-4 py-3 bg-[#1672d6]/10 border-b border-[#001533]/10 dark:border-white/10">
              <p className="text-sm text-[#001533] dark:text-white">
                Olá, <span className="font-semibold">{userName}</span>! Como posso te ajudar hoje?
              </p>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Quick Actions - Sem saudação duplicada */}
              {!messages.some((m) => m.isUser) && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-[#001533]/50 dark:text-white/50 uppercase tracking-wider px-1">
                    Ações Rápidas
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {(quickActions.length > 0 ? quickActions : DEFAULT_QUICK_ACTIONS).map((action, index) => {
                      const Icon = action.icon;
                      return (
                        <PromptSuggestion
                          key={index}
                          onClick={() => handleQuickAction(action.text)}
                          className="flex items-center gap-2 text-xs"
                        >
                          <Icon className={cn("w-4 h-4", action.color)} />
                          <span className="truncate">{action.text}</span>
                        </PromptSuggestion>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Chat Messages */}
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex items-start gap-3",
                    message.isUser && "flex-row-reverse"
                  )}
                >
                  {!message.isUser && (
                    <Image
                      src="/images/Val.png"
                      alt="Val"
                      width={36}
                      height={36}
                      className="rounded-full object-cover flex-shrink-0"
                    />
                  )}
                  <div
                    className={cn(
                      "rounded-2xl p-3 max-w-[85%]",
                      message.isUser
                        ? "bg-[#1672d6] text-white rounded-tr-none"
                        : "bg-[#001533]/5 dark:bg-white/5 text-[#001533] dark:text-white rounded-tl-none"
                    )}
                  >
                    <p className="text-sm">{message.text}</p>
                    {!message.isUser && message.sources && message.sources.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-[#001533]/10 dark:border-white/10">
                        <p className="text-[11px] font-medium text-[#001533]/60 dark:text-white/60">Fontes</p>
                        <div className="mt-1 space-y-1">
                          {message.sources.slice(0, 6).map((u) => {
                            let label = u;
                            try {
                              label = new URL(u).hostname;
                            } catch {
                              // ignore
                            }
                            return (
                              <a
                                key={u}
                                href={u}
                                target="_blank"
                                rel="noreferrer"
                                className="block text-[11px] underline text-[#1672d6] hover:text-[#1260b5] break-all"
                              >
                                {label}
                              </a>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    <p className={cn(
                      "text-[10px] mt-1",
                      message.isUser ? "text-white/60" : "text-[#001533]/40 dark:text-white/40"
                    )}>
                      {message.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex items-start gap-3">
                  <Image
                    src="/images/Val.png"
                    alt="Val"
                    width={36}
                    height={36}
                    className="rounded-full object-cover flex-shrink-0"
                  />
                  <div className="bg-[#001533]/5 dark:bg-white/5 rounded-2xl rounded-tl-none p-4">
                    <AILoaderDots />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-[#001533]/10 dark:border-white/10 p-3">
              {/* Toolbar */}
              <div className="flex items-center justify-between mb-2 px-1">
                <div className="flex items-center gap-1">
                  {/* Web Search Toggle */}
                  <button
                    onClick={() => setWebSearch(!webSearch)}
                    className={cn(
                      "flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs transition-colors",
                      webSearch 
                        ? "bg-[#1672d6]/10 text-[#1672d6]" 
                        : "text-[#001533]/50 dark:text-white/50 hover:bg-[#001533]/5"
                    )}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Web</span>
                  </button>

                  {/* Voice */}
                  <button className="p-1.5 rounded-lg text-[#001533]/50 dark:text-white/50 hover:bg-[#001533]/5 transition-colors">
                    <Mic className="w-4 h-4" />
                  </button>
                </div>

                {/* Model Select */}
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger className="h-7 w-auto border-none shadow-none text-xs text-[#001533]/60 dark:text-white/60">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="val-pro">Val Pro</SelectItem>
                    <SelectItem value="val-fast">Val Fast</SelectItem>
                    <SelectItem value="val-creative">Val Creative</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Input */}
              <div className="flex items-end gap-2">
                <div className="flex-1 relative">
                  <textarea
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Digite sua mensagem..."
                    rows={1}
                    className={cn(
                      "w-full resize-none rounded-xl border-2 border-[#001533]/10 dark:border-white/10",
                      "bg-[#001533]/5 dark:bg-white/5",
                      "px-4 py-3 pr-12 text-sm",
                      "text-[#001533] dark:text-white",
                      "placeholder:text-[#001533]/40 dark:placeholder:text-white/40",
                      "focus:outline-none focus:border-[#1672d6]/50",
                      "max-h-32 overflow-y-auto"
                    )}
                    style={{ minHeight: '48px' }}
                  />
                </div>
                
                {/* Send Button */}
                <Button
                  onClick={() => void handleSend()}
                  disabled={!inputValue.trim() || isTyping}
                  className={cn(
                    "h-12 w-12 rounded-xl",
                    "bg-[#1672d6] hover:bg-[#1260b5]",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  <Send className="w-5 h-5 text-white" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default ValFloatingChat;

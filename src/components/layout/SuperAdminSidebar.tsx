"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  UsersRound,
  Calendar,
  TrendingUp,
  BarChart3,
  CreditCard,
  FileText,
  Settings,
  Crown,
  ClipboardCheck,
  Handshake,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Brain,
  Sparkles as SparklesIcon,
  Target,
  FileSignature,
  Link as LinkIcon,
  Kanban,
  Briefcase,
  Receipt,
  PieChart,
  Shield,
  Activity,
  MessageSquare,
  Sparkles,
  Building,
  Scale,
  ClipboardList,
  ToggleLeft,
  Building2,
  Workflow,
  CheckCircle2,
  Instagram,
  Bell,
  LogOut,
  Zap,
  FileCode
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

// ============================================
// SUPER ADMIN SIDEBAR - VALLE AI
// Sidebar com accordion igual ao cliente
// Cores: #001533 (navy), #1672d6 (primary), #ffffff (white)
// ============================================

interface NavGroup {
  id: string;
  label: string;
  icon: React.ElementType;
  items: NavItem[];
}

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
}

const navGroups: NavGroup[] = [
  {
    id: "principal",
    label: "Principal",
    icon: LayoutDashboard,
    items: [
      { id: "dashboard", label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
      { id: "predictions", label: "Predições IA", href: "/admin/predictions", icon: SparklesIcon },
      { id: "intelligence", label: "Centro de Inteligência", href: "/admin/centro-inteligencia", icon: Brain },
      { id: "messages", label: "Mensagens", href: "/admin/mensagens", icon: MessageSquare },
      { id: "kanban", label: "Kanban Geral", href: "/admin/kanban-app", icon: Kanban },
    ],
  },
  {
    id: "comercial",
    label: "Comercial",
    icon: Briefcase,
    items: [
      { id: "clients", label: "Clientes", href: "/admin/clientes", icon: Users },
      { id: "prospecting", label: "Prospecção IA", href: "/admin/prospeccao", icon: Target, badge: 12 },
      { id: "proposals", label: "Propostas", href: "/admin/comercial/propostas", icon: FileSignature, badge: 3 },
      { id: "contracts", label: "Contratos", href: "/admin/contratos", icon: FileText },
      { id: "services", label: "Serviços", href: "/admin/comercial/servicos", icon: Target },
      { id: "radar", label: "Radar de Vendas", href: "/admin/comercial/radar", icon: Activity, badge: 5 },
    ],
  },
  {
    id: "operacoes",
    label: "Operações",
    icon: UsersRound,
    items: [
      { id: "employees", label: "Colaboradores", href: "/admin/colaboradores", icon: UsersRound },
      { id: "goals", label: "Metas IA", href: "/admin/metas", icon: Target },
      { id: "schedules", label: "Agendas", href: "/admin/agendas", icon: Calendar },
      { id: "meetings", label: "Reuniões", href: "/admin/reunioes", icon: MessageSquare, badge: 3 },
      { id: "materials", label: "Solicitações", href: "/admin/solicitacoes-material", icon: ClipboardList, badge: 5 },
    ],
  },
  {
    id: "financeiro",
    label: "Financeiro",
    icon: CreditCard,
    items: [
      { id: "financial", label: "Faturamento", href: "/admin/financeiro", icon: Receipt },
      { id: "billing", label: "Cobranças", href: "/admin/financeiro/clientes", icon: CreditCard },
      { id: "reports", label: "Relatórios", href: "/admin/relatorios", icon: PieChart },
    ],
  },
  {
    id: "diretoria",
    label: "Diretoria Virtual",
    icon: Building,
    items: [
      { id: "csuite", label: "C-Suite IA", href: "/admin/diretoria", icon: Building },
      { id: "csuite-history", label: "Histórico & Decisões", href: "/admin/diretoria/historico", icon: FileText },
      { id: "csuite-memory", label: "Memória & Conhecimento", href: "/admin/diretoria/memoria", icon: Brain },
      { id: "ceo", label: "CEO (Estratégia)", href: "/admin/diretoria/ceo", icon: Crown },
      { id: "cfo", label: "CFO (Financeiro)", href: "/admin/diretoria/cfo", icon: CreditCard },
      { id: "cto", label: "CTO (Operações)", href: "/admin/diretoria/cto", icon: Settings },
      { id: "cmo", label: "CMO (Clientes)", href: "/admin/diretoria/cmo", icon: TrendingUp },
      { id: "chro", label: "CHRO (Pessoas)", href: "/admin/diretoria/chro", icon: Users },
      { id: "coo", label: "COO (Entrega)", href: "/admin/diretoria/coo", icon: ClipboardCheck },
      { id: "cco", label: "CCO (Clientes & Retenção)", href: "/admin/diretoria/cco", icon: Handshake },
      { id: "solicitacoes", label: "Solicitações", href: "/admin/solicitacoes", icon: Calendar, badge: 3 },
    ],
  },
  {
    id: "inteligencia",
    label: "Inteligência",
    icon: Sparkles,
    items: [
      { id: "insights", label: "Insights IA", href: "/admin/inteligencia", icon: Brain },
      { id: "preditivo", label: "Analytics Preditivo", href: "/admin/analytics/preditivo", icon: Brain },
      { id: "sentiment", label: "Análise Sentimento", href: "/admin/configuracoes/sentimento", icon: MessageSquare },
      { id: "sentiment-monitor", label: "Monitor Sentimento", href: "/admin/monitoramento-sentimento", icon: Activity },
      { id: "performance", label: "Performance", href: "/admin/performance", icon: BarChart3 },
      { id: "traffic", label: "Tráfego", href: "/admin/trafego-comparativo", icon: TrendingUp },
      { id: "competitor", label: "Concorrência", href: "/admin/inteligencia-concorrencia", icon: Target },
    ],
  },
  {
    id: "social",
    label: "Social",
    icon: Instagram,
    items: [
      { id: "social-command", label: "Command Center", href: "/admin/social-media/command-center", icon: Zap },
      { id: "social-approvals", label: "Aprovações", href: "/admin/social-media/approvals", icon: CheckCircle2 },
      { id: "social-upload", label: "Agendar Postagem", href: "/admin/social-media/upload", icon: Instagram },
      { id: "social-gestao", label: "Gestão de Posts", href: "/admin/social-media/gestao", icon: Calendar },
    ],
  },
  {
    id: "crewai",
    label: "🚀 CrewAI Robusto",
    icon: Sparkles,
    items: [
      { id: "crew-test", label: "Testes do Sistema", href: "/admin/crew/test", icon: FileCode },
    ],
  },
  {
    id: "juridico",
    label: "Jurídico",
    icon: Scale,
    items: [
      { id: "contracts-legal", label: "Contratos", href: "/admin/contratos", icon: FileText },
      { id: "contract-templates", label: "Templates de Contrato", href: "/admin/contratos/templates", icon: FileCode },
      { id: "documents", label: "Documentos", href: "/admin/documentos", icon: FileSignature },
    ],
  },
  {
    id: "gestao",
    label: "Gestão",
    icon: Building2,
    items: [
      { id: "franqueados", label: "Franqueados", href: "/admin/franqueados", icon: Building2 },
      { id: "rh", label: "Gestão RH", href: "/admin/rh", icon: UsersRound },
      { id: "rh-inteligencia", label: "RH Inteligência", href: "/admin/rh/inteligencia", icon: Brain },
      { id: "linkedin", label: "Vagas LinkedIn", href: "/admin/rh/vagas/linkedin", icon: Briefcase },
    ],
  },
  {
    id: "sistema",
    label: "Sistema",
    icon: Settings,
    items: [
      { id: "readiness", label: "Prontidão", href: "/admin/prontidao", icon: CheckCircle2 },
      { id: "flows", label: "Fluxos", href: "/admin/fluxos", icon: Workflow },
      { id: "feature-flags", label: "Feature Flags", href: "/admin/feature-flags", icon: ToggleLeft },
      { id: "integrations", label: "Integrações", href: "/admin/integracoes", icon: LinkIcon },
      { id: "n8n", label: "N8N Workflows", href: "/admin/integracoes/n8n", icon: Activity },
      { id: "api", label: "Central de APIs", href: "/admin/integracoes/api", icon: Shield },
      { id: "audit", label: "Auditoria", href: "/admin/auditoria", icon: Shield },
      { id: "alert-recipients", label: "Destinatários de Alertas", href: "/admin/configuracoes/alertas", icon: Bell },
      { id: "settings", label: "Configurações", href: "/admin/configuracoes", icon: Settings },
    ],
  },
];

interface SuperAdminSidebarProps {
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

export function SuperAdminSidebar({ 
  collapsed = false, 
  onCollapsedChange 
}: SuperAdminSidebarProps) {
  const pathname = usePathname();
  const [expandedGroups, setExpandedGroups] = useState<string[]>(["principal", "comercial"]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const isItemActive = (href: string) => pathname === href;
  const isGroupActive = (items: NavItem[]) => items.some(item => pathname === item.href);

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen z-40",
        "bg-[#001533] border-r border-white/10",
        "transition-all duration-300 flex flex-col",
        collapsed ? "w-[70px]" : "w-[280px]"
      )}
    >
      {/* Header com Logo */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <Link href="/admin/dashboard" className="flex items-center gap-3">
            {collapsed ? (
              <Image 
                src="/icons/valle360-icon.png" 
                alt="Valle 360" 
                width={36} 
                height={36}
                className="object-contain"
              />
            ) : (
              <Image 
                src="/Logo/valle360-logo.png" 
                alt="Valle 360" 
                width={140} 
                height={40}
                className="object-contain"
              />
            )}
          </Link>
          
          {!collapsed && (
            <button
              onClick={() => onCollapsedChange?.(!collapsed)}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            >
              <ChevronLeft className="size-4 text-white/60" />
            </button>
          )}
        </div>

        {/* Saudação */}
        {!collapsed && (
          <div className="mt-4 p-3 rounded-xl bg-[#1672d6]/20 border border-[#1672d6]/30">
            <p className="text-white text-sm">
              Olá, <span className="font-semibold">Guilherme Valle</span>!
            </p>
            <p className="text-white/60 text-xs mt-0.5">Seja bem vindo.</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {navGroups.map((group) => {
          const GroupIcon = group.icon;
          const isExpanded = expandedGroups.includes(group.id);
          const hasActiveItem = isGroupActive(group.items);

          return (
            <div key={group.id}>
              {/* Group Header */}
              <button
                onClick={() => !collapsed && toggleGroup(group.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all",
                  hasActiveItem 
                    ? "bg-[#1672d6]/20 text-white" 
                    : "text-white/70 hover:bg-white/5 hover:text-white",
                  collapsed && "justify-center"
                )}
              >
                <GroupIcon className="size-5 flex-shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left text-sm font-medium">{group.label}</span>
                    <ChevronDown 
                      className={cn(
                        "size-4 transition-transform",
                        isExpanded && "rotate-180"
                      )} 
                    />
                  </>
                )}
              </button>

              {/* Group Items */}
              <AnimatePresence>
                {!collapsed && isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="pl-4 mt-1 space-y-0.5">
                      {group.items.map((item) => {
                        const ItemIcon = item.icon;
                        const isActive = isItemActive(item.href);

                        return (
                          <Link
                            key={item.id}
                            href={item.href}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm",
                              isActive
                                ? "bg-[#1672d6] text-white shadow-lg shadow-[#1672d6]/30"
                                : "text-white/60 hover:bg-white/5 hover:text-white"
                            )}
                          >
                            <ItemIcon className="size-4 flex-shrink-0" />
                            <span className="flex-1">{item.label}</span>
                            {item.badge && (
                              <Badge className="bg-red-500 text-white text-[10px] px-1.5 py-0 h-4">
                                {item.badge}
                              </Badge>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>

      {/* Collapse Button (quando collapsed) */}
      {collapsed && (
        <div className="p-3 border-t border-white/10">
          <button
            onClick={() => onCollapsedChange?.(!collapsed)}
            className="w-full p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
          >
            <ChevronRight className="size-5 text-white/60 mx-auto" />
          </button>
        </div>
      )}

      {/* Footer */}
      {!collapsed && (
        <div className="p-3 border-t border-white/10 space-y-3">
          {/* Botão Sair */}
          <button
            onClick={() => {
              // Logout via Supabase
              if (typeof window !== 'undefined') {
                import('@/lib/supabase').then(({ supabase }) => {
                  supabase.auth.signOut().then(() => {
                    window.location.href = '/login';
                  });
                });
              }
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 transition-all border border-red-500/30"
          >
            <LogOut className="size-4" />
            <span className="text-sm font-medium">Sair</span>
          </button>
          
          <div className="text-center">
            <p className="text-white/40 text-xs">Valle 360 Admin</p>
            <p className="text-white/30 text-[10px]">v2.0.0</p>
          </div>
        </div>
      )}
    </aside>
  );
}


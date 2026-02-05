"use client";

// ============================================
// CLIENT SIDEBAR - VALLE AI
// Sidebar colapsável com accordion para área do cliente
// Cores: #001533 (navy), #1672d6 (primary), #ffffff (white)
// ============================================

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  FileCheck,
  FolderOpen,
  Lightbulb,
  TrendingUp,
  Users,
  DollarSign,
  CreditCard,
  Briefcase,
  MessageSquare,
  Newspaper,
  UserCircle,
  Gift,
  Calendar,
  Share2,
  Bot,
  Send,
  ChevronDown,
  PanelLeftClose,
  PanelLeft,
  LogOut,
  Sparkles,
  Trophy,
  HelpCircle,
  Star,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { signOut } from "@/lib/auth";

// Grupos de navegação - Reorganizados
const navGroups = [
  {
    label: "Principal",
    items: [
      { href: "/cliente/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/cliente/producao", label: "Produção", icon: FileCheck, badge: 3 },
      { href: "/cliente/aprovacoes", label: "Aprovações", icon: FileCheck, badge: 5 },
      { href: "/cliente/agenda", label: "Agenda", icon: Calendar },
    ],
  },
  {
    label: "Métricas",
    items: [
      { href: "/cliente/insights", label: "Insights", icon: Lightbulb },
      { href: "/cliente/evolucao", label: "Evolução", icon: TrendingUp },
      { href: "/cliente/reputacao", label: "Reputação", icon: Star },
      { href: "/cliente/concorrentes", label: "Concorrentes", icon: Users },
      { href: "/cliente/contatos", label: "Meus Contatos", icon: Users },
      { href: "/cliente/redes", label: "Redes Sociais", icon: Share2 },
    ],
  },
  {
    label: "Gestão",
    items: [
      { href: "/cliente/franqueados", label: "Franqueados", icon: Building2 },
    ],
  },
  {
    label: "Financeiro",
    items: [
      { href: "/cliente/financeiro", label: "Financeiro", icon: DollarSign },
      { href: "/cliente/creditos", label: "Créditos", icon: CreditCard },
      { href: "/cliente/servicos", label: "Serviços", icon: Briefcase },
    ],
  },
  {
    label: "Comunicação",
    items: [
      { href: "/cliente/mensagens", label: "Mensagens", icon: MessageSquare },
      { href: "/cliente/noticias", label: "Notícias", icon: Newspaper },
      { href: "/cliente/solicitacao", label: "Solicitações", icon: Send },
    ],
  },
  {
    label: "Conta",
    items: [
      { href: "/cliente/perfil", label: "Meu Perfil", icon: UserCircle },
      { href: "/cliente/programa-fidelidade", label: "Valle Club", icon: Trophy }, // Gamificação 2.0
      { href: "/cliente/beneficios", label: "Benefícios", icon: Gift },
      { href: "/cliente/arquivos", label: "Arquivos", icon: FolderOpen },
      { href: "/cliente/suporte", label: "Falar com Suporte", icon: HelpCircle }, // Movido para Conta
    ],
  },
];

interface ClientSidebarProps {
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

export function ClientSidebar({ collapsed = false, onCollapsedChange }: ClientSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(collapsed);
  const [expandedGroups, setExpandedGroups] = useState<string[]>(["Principal", "Métricas", "Financeiro", "Comunicação", "Conta"]);

  const handleToggle = () => {
    const newValue = !isCollapsed;
    setIsCollapsed(newValue);
    onCollapsedChange?.(newValue);
  };

  const toggleGroup = (label: string) => {
    setExpandedGroups(prev => 
      prev.includes(label) 
        ? prev.filter(g => g !== label)
        : [...prev, label]
    );
  };

  const handleLogout = async () => {
    try {
      await signOut();
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen",
          "bg-[#001533] border-r border-white/10",
          "transition-all duration-300 ease-in-out",
          "flex flex-col",
          isCollapsed ? "w-[70px]" : "w-[260px]"
        )}
      >
        {/* Header - Logo Valle 360 */}
        <div className={cn(
          "flex items-center h-16 px-4 border-b border-white/10",
          isCollapsed ? "justify-center" : "justify-between"
        )}>
          <Link href="/cliente/dashboard" className="flex items-center">
            {isCollapsed ? (
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
          
          {!isCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggle}
              className="text-white/60 hover:text-white hover:bg-white/10 h-8 w-8"
            >
              <PanelLeftClose className="size-4" />
            </Button>
          )}
        </div>

        {/* Botão de expandir (quando colapsado) */}
        {isCollapsed && (
          <div className="flex justify-center py-3 border-b border-white/10">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggle}
              className="text-white/60 hover:text-white hover:bg-white/10 h-8 w-8"
            >
              <PanelLeft className="size-4" />
            </Button>
          </div>
        )}


        {/* Navigation com Accordion */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-2 scrollbar-thin scrollbar-thumb-white/10">
          {navGroups.map((group) => {
            const isExpanded = expandedGroups.includes(group.label);
            const hasActiveItem = group.items.some(
              item => pathname === item.href || pathname.startsWith(item.href + "/")
            );

            return (
              <div key={group.label}>
                {/* Group Header - Accordion Trigger */}
                {!isCollapsed ? (
                  <button
                    onClick={() => toggleGroup(group.label)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 rounded-lg",
                      "text-xs font-semibold uppercase tracking-wider",
                      "transition-colors",
                      hasActiveItem 
                        ? "text-[#1672d6] bg-[#1672d6]/10" 
                        : "text-white/40 hover:text-white/60 hover:bg-white/5"
                    )}
                  >
                    <span>{group.label}</span>
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="size-4" />
                    </motion.div>
                  </button>
                ) : (
                  <div className="h-px bg-white/10 my-2" />
                )}
                
                {/* Group Items - Animated */}
                <AnimatePresence>
                  {(isExpanded || isCollapsed) && (
                    <motion.div
                      initial={isCollapsed ? false : { height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className={cn("space-y-1", !isCollapsed && "mt-1")}>
                        {group.items.map((item) => {
                          const Icon = item.icon;
                          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

                          const linkContent = (
                            <Link
                              href={item.href}
                              className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg",
                                "transition-all duration-200",
                                "group relative",
                                isActive
                                  ? "bg-[#1672d6] text-white shadow-lg shadow-[#1672d6]/30"
                                  : "text-white/70 hover:text-white hover:bg-white/10",
                                isCollapsed && "justify-center px-0"
                              )}
                            >
                              <Icon className={cn(
                                "size-5 flex-shrink-0",
                                isActive ? "text-white" : "text-white/70 group-hover:text-white"
                              )} />
                              
                              {!isCollapsed && (
                                <>
                                  <span className="font-medium text-sm">{item.label}</span>
                                  {item.badge && (
                                    <span className="ml-auto flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                                      {item.badge}
                                    </span>
                                  )}
                                </>
                              )}
                              
                              {isCollapsed && item.badge && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 text-[10px] font-bold text-white bg-red-500 rounded-full flex items-center justify-center">
                                  {item.badge}
                                </span>
                              )}
                            </Link>
                          );

                          if (isCollapsed) {
                            return (
                              <Tooltip key={item.href}>
                                <TooltipTrigger asChild>
                                  {linkContent}
                                </TooltipTrigger>
                                <TooltipContent side="right" className="bg-[#001533] border-white/20 text-white">
                                  {item.label}
                                </TooltipContent>
                              </Tooltip>
                            );
                          }

                          return <div key={item.href}>{linkContent}</div>;
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>

        {/* Footer - Botão Sair */}
        <div className={cn(
          "p-4 border-t border-white/10",
          isCollapsed && "px-2"
        )}>
          {!isCollapsed ? (
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="size-5" />
              <span className="font-medium">Sair</span>
            </Button>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  size="icon"
                  className="w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  <LogOut className="size-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-[#001533] border-white/20 text-white">
                Sair
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}

export default ClientSidebar;

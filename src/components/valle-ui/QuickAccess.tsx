"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { ReactNode } from "react";
import { 
  BarChart3, 
  FolderOpen, 
  MessageSquare, 
  FileText,
  Calendar,
  Lightbulb,
  Users,
  TrendingUp,
  LucideIcon
} from "lucide-react";

// ============================================
// QUICK ACCESS - VALLE AI
// Grid de atalhos rápidos para navegação
// Cores: #001533 (navy), #1672d6 (primary), #ffffff (white)
// ============================================

interface QuickAccessItem {
  icon: LucideIcon;
  label: string;
  href: string;
  description?: string;
}

interface QuickAccessProps {
  items?: QuickAccessItem[];
  className?: string;
  columns?: 2 | 3 | 4;
}

const defaultItems: QuickAccessItem[] = [
  {
    icon: BarChart3,
    label: "Métricas",
    href: "/cliente/insights",
    description: "Visualize seus resultados",
  },
  {
    icon: FolderOpen,
    label: "Arquivos",
    href: "/cliente/arquivos",
    description: "Acesse seus materiais",
  },
  {
    icon: MessageSquare,
    label: "Mensagens",
    href: "/cliente/mensagens",
    description: "Converse com a equipe",
  },
  {
    icon: FileText,
    label: "Relatórios",
    href: "/cliente/evolucao",
    description: "Veja a evolução",
  },
];

export function QuickAccess({ 
  items = defaultItems, 
  className,
  columns = 4 
}: QuickAccessProps) {
  const gridCols = {
    2: "grid-cols-2",
    3: "grid-cols-2 md:grid-cols-3",
    4: "grid-cols-2 md:grid-cols-4",
  };

  return (
    <div className={cn("space-y-4", className)}>
      <h3 className="text-lg font-semibold text-[#001533] dark:text-white">
        Acesso Rápido
      </h3>
      
      <div className={cn("grid gap-3", gridCols[columns])}>
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              // Base
              "group flex flex-col items-center gap-3 p-4 rounded-xl",
              "border-2 border-[#001533]/10 dark:border-white/10",
              "bg-white dark:bg-[#001533]/30",
              // Transitions
              "transition-all duration-300",
              // Hover
              "hover:border-[#1672d6]/30 hover:bg-[#1672d6]/5",
              "hover:shadow-lg hover:shadow-[#1672d6]/10",
              "hover:-translate-y-0.5"
            )}
          >
            <div className={cn(
              "p-3 rounded-xl",
              "bg-[#001533]/5 dark:bg-white/5",
              "group-hover:bg-[#1672d6] group-hover:text-white",
              "transition-all duration-300"
            )}>
              <item.icon className="size-5 text-[#1672d6] group-hover:text-white transition-colors" />
            </div>
            
            <div className="text-center">
              <span className="font-medium text-[#001533] dark:text-white block">
                {item.label}
              </span>
              {item.description && (
                <span className="text-xs text-[#001533]/50 dark:text-white/50 mt-0.5 block">
                  {item.description}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// Versão compacta para sidebar ou áreas menores
interface QuickAccessCompactProps {
  items?: QuickAccessItem[];
  className?: string;
}

export function QuickAccessCompact({ 
  items = defaultItems.slice(0, 4), 
  className 
}: QuickAccessCompactProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex items-center gap-3 p-3 rounded-lg",
            "border border-[#001533]/10 dark:border-white/10",
            "hover:border-[#1672d6]/30 hover:bg-[#1672d6]/5",
            "transition-all duration-200",
            "group"
          )}
        >
          <div className={cn(
            "p-2 rounded-lg bg-[#001533]/5 dark:bg-white/5",
            "group-hover:bg-[#1672d6]/10",
            "transition-colors duration-200"
          )}>
            <item.icon className="size-4 text-[#1672d6]" />
          </div>
          <span className="text-sm font-medium text-[#001533] dark:text-white">
            {item.label}
          </span>
        </Link>
      ))}
    </div>
  );
}

export type { QuickAccessItem, QuickAccessProps, QuickAccessCompactProps };




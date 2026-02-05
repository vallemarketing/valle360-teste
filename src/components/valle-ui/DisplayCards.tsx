"use client";

import { cn } from "@/lib/utils";
import { Sparkles, TrendingUp, Users, BarChart3, ChevronRight, Newspaper, Target } from "lucide-react";
import { ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

// ============================================
// DISPLAY CARDS - VALLE AI
// Cores: #001533 (navy), #1672d6 (primary), #ffffff (white)
// Baseado em: https://21st.dev/r/Codehagen/display-cards
// ============================================

interface DisplayCardProps {
  className?: string;
  icon?: ReactNode;
  title?: string;
  description?: string;
  date?: string;
  iconClassName?: string;
  titleClassName?: string;
  href?: string;
  onClick?: () => void;
  badge?: string;
  badgeColor?: string;
}

function DisplayCard({
  className,
  icon = <Sparkles className="size-4 text-white" />,
  title = "Destaque",
  description = "Descubra conteúdos incríveis",
  date = "Agora mesmo",
  iconClassName = "bg-[#1672d6]",
  titleClassName = "text-[#1672d6]",
  href,
  onClick,
  badge,
  badgeColor = "bg-[#1672d6]",
}: DisplayCardProps) {
  const CardWrapper = href ? Link : "div";
  const cardProps = href ? { href } : {};

  return (
    <motion.div
      whileHover={{ 
        y: -8, 
        scale: 1.02,
        transition: { duration: 0.3, ease: "easeOut" } 
      }}
      whileTap={{ scale: 0.98 }}
    >
      <CardWrapper
        {...(cardProps as any)}
        onClick={onClick}
        className={cn(
          // Layout base
          "relative flex h-40 w-[24rem] -skew-y-[8deg] select-none flex-col justify-between",
          // Estilo do card - usando cores Valle AI
          "rounded-xl border-2 border-[#001533]/10 bg-white/95 dark:bg-[#001533]/95",
          "backdrop-blur-sm px-5 py-4",
          // Cursor e interatividade
          (href || onClick) && "cursor-pointer",
          // Transições
          "transition-all duration-300",
          // Efeito de fade à direita
          "after:absolute after:-right-1 after:top-[-5%] after:h-[110%] after:w-[20rem]",
          "after:bg-gradient-to-l after:from-white dark:after:from-[#0a0f1a] after:to-transparent after:content-['']",
          // Hover states
          "hover:border-[#1672d6]/40 hover:bg-white dark:hover:bg-[#001533]",
          "hover:shadow-xl hover:shadow-[#1672d6]/15",
          // Flex children
          "[&>*]:flex [&>*]:items-center [&>*]:gap-2",
          className
        )}
      >
        {/* Badge opcional */}
        {badge && (
          <span className={cn(
            "absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-xs font-bold text-white z-10 skew-y-[8deg]",
            badgeColor
          )}>
            {badge}
          </span>
        )}

        {/* Header com ícone e título */}
        <div className="relative z-10">
          <span className={cn(
            "relative inline-flex items-center justify-center rounded-lg p-2 shadow-md",
            iconClassName
          )}>
            {icon}
          </span>
          <p className={cn("text-lg font-bold", titleClassName)}>{title}</p>
        </div>
        
        {/* Descrição */}
        <p className="relative z-10 whitespace-nowrap text-base font-medium text-[#001533] dark:text-white/90">
          {description}
        </p>
        
        {/* Footer com data e indicador de clicável */}
        <div className="relative z-10 flex items-center justify-between w-full">
          <p className="text-sm text-[#001533]/60 dark:text-white/60">{date}</p>
          {(href || onClick) && (
            <span className="flex items-center gap-1 text-sm font-medium text-[#1672d6]">
              Ver mais <ChevronRight className="size-4" />
            </span>
          )}
        </div>
      </CardWrapper>
    </motion.div>
  );
}

interface DisplayCardsProps {
  cards?: DisplayCardProps[];
  layout?: "stack" | "grid";
}

export function DisplayCards({ cards, layout = "stack" }: DisplayCardsProps) {
  // Cards padrão com visual Valle AI
  const defaultCards: DisplayCardProps[] = [
    {
      icon: <TrendingUp className="size-4 text-white" />,
      title: "Desempenho",
      description: "Suas métricas subiram 23% este mês",
      date: "Atualizado há 2h",
      iconClassName: "bg-[#1672d6]",
      titleClassName: "text-[#1672d6]",
      href: "/cliente/painel/desempenho",
      badge: "+23%",
      badgeColor: "bg-emerald-500",
      className: layout === "stack" ? cn(
        "[grid-area:stack] hover:-translate-y-10",
        "before:absolute before:w-full before:h-full before:rounded-xl",
        "before:bg-[#001533]/5 before:content-[''] before:left-0 before:top-0",
        "before:transition-opacity before:duration-500",
        "hover:before:opacity-0",
        "grayscale-[20%] hover:grayscale-0"
      ) : "",
    },
    {
      icon: <Newspaper className="size-4 text-white" />,
      title: "Seu Setor",
      description: "3 novidades importantes do seu mercado",
      date: "Atualizado há 5h",
      iconClassName: "bg-[#001533]",
      titleClassName: "text-[#001533] dark:text-white",
      href: "/cliente/painel/setor",
      badge: "3 novas",
      badgeColor: "bg-primary",
      className: layout === "stack" ? cn(
        "[grid-area:stack] translate-x-16 translate-y-10 hover:-translate-y-1",
        "before:absolute before:w-full before:h-full before:rounded-xl",
        "before:bg-[#001533]/5 before:content-[''] before:left-0 before:top-0",
        "before:transition-opacity before:duration-500",
        "hover:before:opacity-0",
        "grayscale-[20%] hover:grayscale-0"
      ) : "",
    },
    {
      icon: <Target className="size-4 text-white" />,
      title: "Concorrentes",
      description: "Análise competitiva atualizada",
      date: "Atualizado agora",
      iconClassName: "bg-[#1672d6]",
      titleClassName: "text-[#1672d6]",
      href: "/cliente/painel/concorrentes",
      className: layout === "stack" ? "[grid-area:stack] translate-x-32 translate-y-20 hover:translate-y-10" : "",
    },
  ];

  const displayCards = cards || defaultCards;

  if (layout === "grid") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayCards.map((cardProps, index) => (
          <DisplayCard key={index} {...cardProps} className={cn(cardProps.className, "skew-y-0 w-full")} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid [grid-template-areas:'stack'] place-items-center opacity-100 animate-in fade-in-0 duration-700">
      {displayCards.map((cardProps, index) => (
        <DisplayCard key={index} {...cardProps} />
      ))}
    </div>
  );
}

// Exportar também o card individual para uso customizado
export { DisplayCard };
export type { DisplayCardProps, DisplayCardsProps };

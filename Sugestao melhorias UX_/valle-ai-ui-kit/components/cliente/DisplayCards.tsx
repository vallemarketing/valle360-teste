"use client";

import { cn } from "@/lib/utils";
import { Sparkles, TrendingUp, AlertCircle, Bell } from "lucide-react";
import { motion } from "framer-motion";

interface DisplayCardProps {
  className?: string;
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  date?: string;
  category?: "destaque" | "mercado" | "urgente" | "info";
}

const categoryStyles = {
  destaque: {
    icon: <Sparkles className="size-4 text-valle-primary" />,
    bg: "bg-valle-primary/20",
    text: "text-valle-primary",
  },
  mercado: {
    icon: <TrendingUp className="size-4 text-emerald-400" />,
    bg: "bg-emerald-500/20",
    text: "text-emerald-500",
  },
  urgente: {
    icon: <AlertCircle className="size-4 text-amber-400" />,
    bg: "bg-amber-500/20",
    text: "text-amber-500",
  },
  info: {
    icon: <Bell className="size-4 text-cyan-400" />,
    bg: "bg-cyan-500/20",
    text: "text-cyan-500",
  },
};

function DisplayCard({
  className,
  icon,
  title = "Novidade",
  description = "Confira as últimas atualizações",
  date = "Agora",
  category = "destaque",
}: DisplayCardProps) {
  const styles = categoryStyles[category];

  return (
    <motion.div
      whileHover={{ y: -8, transition: { duration: 0.3 } }}
      className={cn(
        "relative flex h-40 w-[22rem] -skew-y-[8deg] select-none flex-col justify-between",
        "rounded-xl border-2 border-border/60 bg-card/80 backdrop-blur-sm",
        "px-5 py-4 transition-all duration-500",
        "hover:border-valle-primary/40 hover:bg-card hover:shadow-xl hover:shadow-valle-primary/10",
        "after:absolute after:-right-1 after:top-[-5%] after:h-[110%] after:w-[20rem]",
        "after:bg-gradient-to-l after:from-background after:to-transparent after:content-['']",
        "[&>*]:flex [&>*]:items-center [&>*]:gap-2",
        className
      )}
    >
      {/* Header */}
      <div>
        <span className={cn("relative inline-flex rounded-full p-1.5", styles.bg)}>
          {icon || styles.icon}
        </span>
        <p className={cn("text-base font-semibold", styles.text)}>{title}</p>
      </div>

      {/* Content */}
      <p className="whitespace-nowrap text-base font-medium text-foreground line-clamp-2">
        {description}
      </p>

      {/* Footer */}
      <p className="text-sm text-muted-foreground">{date}</p>
    </motion.div>
  );
}

interface DisplayCardsProps {
  cards?: DisplayCardProps[];
}

export default function DisplayCards({ cards }: DisplayCardsProps) {
  const defaultCards: DisplayCardProps[] = [
    {
      title: "Atualização de Campanha",
      description: "Sua campanha de Meta Ads atingiu 10k impressões",
      date: "Há 5 minutos",
      category: "destaque",
      className: cn(
        "[grid-area:stack] hover:-translate-y-10",
        "before:absolute before:w-full before:h-full before:content-['']",
        "before:bg-background/50 before:rounded-xl before:left-0 before:top-0",
        "before:transition-opacity before:duration-700",
        "grayscale-[100%] hover:grayscale-0 hover:before:opacity-0"
      ),
    },
    {
      title: "Análise de Mercado",
      description: "Novo relatório do seu setor disponível",
      date: "Há 2 horas",
      category: "mercado",
      className: cn(
        "[grid-area:stack] translate-x-16 translate-y-10 hover:-translate-y-1",
        "before:absolute before:w-full before:h-full before:content-['']",
        "before:bg-background/50 before:rounded-xl before:left-0 before:top-0",
        "before:transition-opacity before:duration-700",
        "grayscale-[100%] hover:grayscale-0 hover:before:opacity-0"
      ),
    },
    {
      title: "Performance Semanal",
      description: "Crescimento de 23% em engajamento",
      date: "Hoje",
      category: "info",
      className: "[grid-area:stack] translate-x-32 translate-y-20 hover:translate-y-10",
    },
  ];

  const displayCards = cards || defaultCards;

  return (
    <div className="grid [grid-template-areas:'stack'] place-items-center opacity-100 animate-in fade-in-0 duration-700">
      {displayCards.map((cardProps, index) => (
        <DisplayCard key={index} {...cardProps} />
      ))}
    </div>
  );
}

// Exportar também o card individual
export { DisplayCard };

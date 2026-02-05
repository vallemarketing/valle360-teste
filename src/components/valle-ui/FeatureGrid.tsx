"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { ExternalLink, TrendingUp, Building2, Lightbulb } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface NewsItem {
  id: string;
  title: string;
  description: string;
  category: "mercado" | "concorrente" | "tendencia";
  image?: string;
  date: string;
  source?: string;
  link?: string;
}

interface FeatureGridProps {
  title?: string;
  subtitle?: string;
  items?: NewsItem[];
  showHeader?: boolean;
}

const categoryConfig = {
  mercado: {
    label: "Mercado",
    icon: TrendingUp,
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
  concorrente: {
    label: "Concorrente",
    icon: Building2,
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
  tendencia: {
    label: "Tendência",
    icon: Lightbulb,
    color: "bg-[#1672d6]/10 text-[#1672d6] border-[#1672d6]/20",
  },
};

const defaultItems: NewsItem[] = [
  {
    id: "1",
    title: "Meta lança novas ferramentas de IA para anunciantes",
    description:
      "Novas funcionalidades prometem otimizar campanhas automaticamente com machine learning avançado.",
    category: "mercado",
    date: "Há 2 horas",
    source: "TechCrunch",
  },
  {
    id: "2",
    title: "Concorrente X aumenta investimento em tráfego pago",
    description:
      "Análise indica crescimento de 40% nos gastos com publicidade digital no último trimestre.",
    category: "concorrente",
    date: "Há 5 horas",
    source: "Análise Valle AI",
  },
  {
    id: "3",
    title: "Marketing conversacional cresce 300% em 2024",
    description:
      "Chatbots e assistentes de IA estão redefinindo o atendimento ao cliente no marketing digital.",
    category: "tendencia",
    date: "Ontem",
    source: "Marketing Week",
  },
  {
    id: "4",
    title: "Google Ads atualiza algoritmo de lances",
    description:
      "Nova atualização melhora performance de campanhas de conversão em até 25%.",
    category: "mercado",
    date: "2 dias atrás",
    source: "Search Engine Land",
  },
  {
    id: "5",
    title: "Estratégia de conteúdo do Concorrente Y",
    description:
      "Análise detalhada das táticas de content marketing que estão gerando resultados.",
    category: "concorrente",
    date: "3 dias atrás",
    source: "Análise Valle AI",
  },
  {
    id: "6",
    title: "Short-form video domina engajamento",
    description:
      "Reels, TikTok e Shorts concentram 70% do tempo de tela dos usuários em redes sociais.",
    category: "tendencia",
    date: "Esta semana",
    source: "Social Media Today",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function FeatureGrid({
  title = "Inteligência de Mercado",
  subtitle = "Acompanhe as últimas notícias e movimentações do seu setor",
  items = defaultItems,
  showHeader = true,
}: FeatureGridProps) {
  return (
    <section className="w-full py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        {showHeader && (
          <div className="flex flex-col gap-4 items-start mb-8">
            <Badge 
              variant="outline" 
              className="border-[#1672d6]/30 text-[#1672d6] bg-[#1672d6]/5"
            >
              <TrendingUp className="w-3 h-3 mr-1" />
              Notícias
            </Badge>
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
                {title}
              </h2>
              <p className="text-base text-muted-foreground max-w-2xl">
                {subtitle}
              </p>
            </div>
          </div>
        )}

        {/* Grid */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {items.map((newsItem) => {
            const config = categoryConfig[newsItem.category];
            const Icon = config.icon;

            return (
              <motion.div key={newsItem.id} variants={item}>
                <Card
                  className={cn(
                    "group flex flex-col gap-3 p-0 overflow-hidden",
                    "border border-border/60 bg-card",
                    "transition-all duration-300",
                    "hover:border-[#1672d6]/40 hover:shadow-lg hover:shadow-[#1672d6]/5",
                    "hover:-translate-y-1 cursor-pointer"
                  )}
                >
                  {/* Image/Placeholder */}
                  <div className="relative aspect-video bg-muted overflow-hidden">
                    {newsItem.image ? (
                      <Image
                        src={newsItem.image}
                        alt={newsItem.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-[#001533]/80 to-[#1672d6]/60 flex items-center justify-center">
                        <Icon className="w-12 h-12 text-white/30" />
                      </div>
                    )}
                    
                    {/* Category Badge */}
                    <div className="absolute top-3 left-3">
                      <Badge variant="outline" className={`${config.color} backdrop-blur-sm`}>
                        <Icon className="w-3 h-3 mr-1" />
                        {config.label}
                      </Badge>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex flex-col gap-2 p-4 pt-0">
                    <h3 className="text-lg font-semibold tracking-tight text-foreground line-clamp-2 group-hover:text-[#1672d6] transition-colors">
                      {newsItem.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {newsItem.description}
                    </p>

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-2 pt-3 border-t border-border/40">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{newsItem.date}</span>
                        {newsItem.source && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                            <span>{newsItem.source}</span>
                          </>
                        )}
                      </div>
                      
                      {newsItem.link && (
                        <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-[#1672d6] transition-colors" />
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

export type { NewsItem, FeatureGridProps };





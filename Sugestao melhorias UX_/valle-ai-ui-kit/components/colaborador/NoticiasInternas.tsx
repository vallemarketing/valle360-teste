"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Megaphone, 
  PartyPopper, 
  AlertCircle, 
  Lightbulb,
  Calendar,
  ChevronRight,
  Clock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface Noticia {
  id: number;
  titulo: string;
  conteudo: string;
  autor: {
    nome: string;
    avatar?: string;
    cargo: string;
  };
  data: string;
  categoria: "comunicado" | "celebracao" | "urgente" | "dica";
}

const categoriaConfig = {
  comunicado: {
    label: "Comunicado",
    icon: Megaphone,
    color: "bg-valle-primary/10 text-valle-primary border-valle-primary/20",
    highlight: "border-l-valle-primary",
  },
  celebracao: {
    label: "Celebração",
    icon: PartyPopper,
    color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    highlight: "border-l-emerald-500",
  },
  urgente: {
    label: "Urgente",
    icon: AlertCircle,
    color: "bg-red-500/10 text-red-600 border-red-500/20",
    highlight: "border-l-red-500",
  },
  dica: {
    label: "Dica",
    icon: Lightbulb,
    color: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    highlight: "border-l-amber-500",
  },
};

const noticias: Noticia[] = [
  {
    id: 1,
    titulo: "Novo cliente fechado! 🎉",
    conteudo: "Bem-vindos TechCorp ao nosso portfólio! Parabéns ao time comercial pelo excelente trabalho na negociação.",
    autor: { nome: "Maria Silva", cargo: "Diretora Comercial" },
    data: "Há 2 horas",
    categoria: "celebracao",
  },
  {
    id: 2,
    titulo: "Atualização no processo de briefing",
    conteudo: "A partir de segunda-feira, todos os briefings devem ser preenchidos pelo novo formulário. Confira o treinamento no portal.",
    autor: { nome: "Carlos Santos", cargo: "Head de Operações" },
    data: "Há 5 horas",
    categoria: "comunicado",
  },
  {
    id: 3,
    titulo: "Manutenção no servidor amanhã",
    conteudo: "Haverá manutenção programada das 22h às 02h. Salve seus trabalhos antes desse horário.",
    autor: { nome: "TI Valle AI", cargo: "Suporte Técnico" },
    data: "Hoje",
    categoria: "urgente",
  },
  {
    id: 4,
    titulo: "Dica: Atalhos do Figma",
    conteudo: "Use Ctrl+Shift+O para ir direto aos frames. Economize tempo no dia a dia!",
    autor: { nome: "Ana Costa", cargo: "Designer Sênior" },
    data: "Ontem",
    categoria: "dica",
  },
  {
    id: 5,
    titulo: "Aniversariantes do mês",
    conteudo: "Parabéns para João (dia 10), Mariana (dia 15) e Pedro (dia 22)! Felicidades a todos! 🎂",
    autor: { nome: "RH Valle AI", cargo: "Recursos Humanos" },
    data: "2 dias atrás",
    categoria: "celebracao",
  },
];

// Card Stack Component
function CardStack({ items }: { items: Noticia[] }) {
  const CARD_OFFSET = 8;
  const SCALE_FACTOR = 0.04;
  const [cards, setCards] = useState<Noticia[]>(items);

  useEffect(() => {
    const interval = setInterval(() => {
      setCards((prev) => {
        const newArray = [...prev];
        newArray.unshift(newArray.pop()!);
        return newArray;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative h-56 w-full max-w-md mx-auto">
      {cards.map((card, index) => {
        const config = categoriaConfig[card.categoria];
        const Icon = config.icon;

        return (
          <motion.div
            key={card.id}
            className={cn(
              "absolute w-full rounded-xl p-5 shadow-lg border bg-card",
              "flex flex-col justify-between",
              `border-l-4 ${config.highlight}`
            )}
            style={{ transformOrigin: "top center" }}
            animate={{
              top: index * -CARD_OFFSET,
              scale: 1 - index * SCALE_FACTOR,
              zIndex: cards.length - index,
            }}
            transition={{ duration: 0.3 }}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <Badge variant="outline" className={config.color}>
                <Icon className="w-3 h-3 mr-1" />
                {config.label}
              </Badge>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {card.data}
              </span>
            </div>

            {/* Content */}
            <div className="flex-1">
              <h4 className="font-semibold text-foreground mb-2">
                {card.titulo}
              </h4>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {card.conteudo}
              </p>
            </div>

            {/* Author */}
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/60">
              <Avatar className="h-6 w-6">
                <AvatarImage src={card.autor.avatar} />
                <AvatarFallback className="text-xs bg-valle-primary/10 text-valle-primary">
                  {card.autor.nome.split(" ").map(n => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
              <div className="text-xs">
                <span className="font-medium text-foreground">{card.autor.nome}</span>
                <span className="text-muted-foreground"> · {card.autor.cargo}</span>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// Lista de Notícias
function NoticiaItem({ noticia }: { noticia: Noticia }) {
  const config = categoriaConfig[noticia.categoria];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ x: 4 }}
      className={cn(
        "flex items-start gap-4 p-4 rounded-xl border border-border/60",
        "bg-card hover:border-valle-primary/30 hover:shadow-md transition-all cursor-pointer",
        `border-l-4 ${config.highlight}`
      )}
    >
      {/* Icon */}
      <div className={cn("p-2 rounded-lg shrink-0", config.color.split(" ")[0])}>
        <Icon className={cn("w-5 h-5", config.color.split(" ")[1])} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-medium text-foreground truncate">{noticia.titulo}</h4>
          <Badge variant="outline" className={cn("shrink-0 text-xs", config.color)}>
            {config.label}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
          {noticia.conteudo}
        </p>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{noticia.autor.nome}</span>
          <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
          <span>{noticia.data}</span>
        </div>
      </div>

      {/* Arrow */}
      <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
    </motion.div>
  );
}

export default function NoticiasInternas() {
  return (
    <section className="w-full py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left - Card Stack */}
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-valle-primary" />
                Destaques
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardStack items={noticias.slice(0, 3)} />
              <div className="text-center mt-6">
                <p className="text-sm text-muted-foreground">
                  Os cards alternam automaticamente
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Right - Lista */}
          <Card className="border-border/60">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-semibold">
                Todas as Notícias
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-valle-primary">
                Ver todas
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {noticias.map((noticia) => (
                <NoticiaItem key={noticia.id} noticia={noticia} />
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Próximos Eventos */}
        <Card className="border-border/60 mt-8">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-valle-primary" />
              Próximos Eventos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { titulo: "Daily Standup", data: "Hoje, 09:30", tipo: "Reunião" },
                { titulo: "Review Sprint 12", data: "Sexta, 14:00", tipo: "Review" },
                { titulo: "Happy Hour", data: "Sexta, 18:00", tipo: "Social" },
              ].map((evento, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-3 p-4 rounded-xl border border-border/60 bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <div className="p-2 rounded-lg bg-valle-primary/10">
                    <Calendar className="w-4 h-4 text-valle-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">{evento.titulo}</p>
                    <p className="text-xs text-muted-foreground">{evento.data} · {evento.tipo}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

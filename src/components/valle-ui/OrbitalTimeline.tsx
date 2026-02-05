"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowRight, 
  Zap, 
  Link2,
  Users,
  Target,
  Rocket,
  CheckCircle,
  Clock,
  AlertCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface TimelineItem {
  id: number;
  title: string;
  date: string;
  content: string;
  category: string;
  icon: React.ElementType;
  relatedIds: number[];
  status: "completed" | "in-progress" | "pending";
  energy: number;
  client?: string;
}

interface OrbitalTimelineProps {
  items?: TimelineItem[];
  title?: string;
  subtitle?: string;
}

const defaultTimelineData: TimelineItem[] = [
  {
    id: 1,
    title: "Tech Solutions Ltda",
    date: "Jan 2024",
    content: "Gestão completa de redes sociais e tráfego pago",
    category: "Cliente",
    icon: Users,
    relatedIds: [2, 3],
    status: "in-progress",
    energy: 85,
    client: "Tech Solutions"
  },
  {
    id: 2,
    title: "Campanha Black Friday - Valle Boutique",
    date: "Nov 2024",
    content: "Campanha multicanal com foco em conversão",
    category: "Campanha",
    icon: Target,
    relatedIds: [1, 4],
    status: "completed",
    energy: 100,
    client: "Valle Boutique"
  },
  {
    id: 3,
    title: "Digital Plus - Lançamento App",
    date: "Dez 2024",
    content: "Estratégia de lançamento para aplicativo mobile",
    category: "Projeto",
    icon: Rocket,
    relatedIds: [1],
    status: "in-progress",
    energy: 65,
    client: "Digital Plus"
  },
  {
    id: 4,
    title: "E-commerce Pro",
    date: "Mar 2024",
    content: "Reestruturação completa de funil de vendas",
    category: "Cliente",
    icon: Users,
    relatedIds: [2, 5],
    status: "in-progress",
    energy: 72,
    client: "E-commerce Pro"
  },
  {
    id: 5,
    title: "Inova Marketing - Automação",
    date: "Fev 2024",
    content: "Implementação de fluxos automatizados via n8n",
    category: "Projeto",
    icon: Zap,
    relatedIds: [4, 6],
    status: "pending",
    energy: 45,
    client: "Inova Marketing"
  },
  {
    id: 6,
    title: "Startup Nexus",
    date: "Abr 2024",
    content: "Consultoria estratégica e branding completo",
    category: "Cliente",
    icon: Users,
    relatedIds: [5],
    status: "pending",
    energy: 30,
    client: "Startup Nexus"
  },
];

const statusStyles = {
  completed: {
    bg: "bg-emerald-500",
    border: "border-emerald-500",
    text: "text-emerald-500",
    label: "Concluído",
    icon: CheckCircle,
  },
  "in-progress": {
    bg: "bg-[#1672d6]",
    border: "border-[#1672d6]",
    text: "text-[#1672d6]",
    label: "Em Andamento",
    icon: Clock,
  },
  pending: {
    bg: "bg-amber-500",
    border: "border-amber-500",
    text: "text-amber-500",
    label: "Pendente",
    icon: AlertCircle,
  },
};

export default function OrbitalTimeline({ 
  items = defaultTimelineData,
  title = "Visão Orbital de Projetos",
  subtitle = "Visualize todos os projetos e suas conexões em tempo real"
}: OrbitalTimelineProps) {
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({});
  const [rotationAngle, setRotationAngle] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);
  const [activeNodeId, setActiveNodeId] = useState<number | null>(null);
  const [pulseEffect, setPulseEffect] = useState<Record<number, boolean>>({});
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto rotation
  useEffect(() => {
    if (!autoRotate) return;
    
    const interval = setInterval(() => {
      setRotationAngle((prev) => (prev + 0.3) % 360);
    }, 50);

    return () => clearInterval(interval);
  }, [autoRotate]);

  const toggleItem = (id: number) => {
    setExpandedItems((prev) => {
      const newState = { ...prev };
      Object.keys(newState).forEach((key) => {
        if (parseInt(key) !== id) newState[parseInt(key)] = false;
      });
      newState[id] = !prev[id];

      if (!prev[id]) {
        setActiveNodeId(id);
        setAutoRotate(false);
        const item = items.find(i => i.id === id);
        if (item) {
          const newPulse: Record<number, boolean> = {};
          item.relatedIds.forEach(relId => newPulse[relId] = true);
          setPulseEffect(newPulse);
        }
      } else {
        setActiveNodeId(null);
        setAutoRotate(true);
        setPulseEffect({});
      }

      return newState;
    });
  };

  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === containerRef.current) {
      setExpandedItems({});
      setActiveNodeId(null);
      setAutoRotate(true);
      setPulseEffect({});
    }
  };

  const calculatePosition = (index: number, total: number) => {
    const angle = ((index / total) * 360 + rotationAngle) % 360;
    const radius = 180;
    const radian = (angle * Math.PI) / 180;
    const x = radius * Math.cos(radian);
    const y = radius * Math.sin(radian);
    const zIndex = Math.round(100 + 50 * Math.cos(radian));
    const opacity = Math.max(0.5, 0.5 + 0.5 * ((1 + Math.sin(radian)) / 2));

    return { x, y, zIndex, opacity };
  };

  return (
    <section className="w-full py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <Badge variant="outline" className="border-[#1672d6]/30 text-[#1672d6] mb-4">
            <Rocket className="w-3 h-3 mr-1" />
            Projetos & Clientes
          </Badge>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            {title}
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {subtitle}
          </p>
        </div>

        {/* Orbital View */}
        <div
          ref={containerRef}
          onClick={handleBackgroundClick}
          className="relative w-full h-[500px] flex items-center justify-center overflow-hidden"
        >
          {/* Center Hub */}
          <div className="absolute z-20">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-20 h-20 rounded-full bg-gradient-to-br from-[#001533] to-[#1672d6] flex items-center justify-center shadow-lg shadow-[#1672d6]/30"
            >
              <span className="text-white font-bold text-xl">V</span>
            </motion.div>
            <div className="absolute -inset-4 rounded-full border border-[#1672d6]/20 animate-ping opacity-30" />
            <div className="absolute -inset-8 rounded-full border border-[#1672d6]/10 animate-ping opacity-20" style={{ animationDelay: "0.5s" }} />
          </div>

          {/* Orbit Ring */}
          <div className="absolute w-[360px] h-[360px] rounded-full border border-border/40" />

          {/* Nodes */}
          {items.map((item, index) => {
            const pos = calculatePosition(index, items.length);
            const isExpanded = expandedItems[item.id];
            const isPulsing = pulseEffect[item.id];
            const status = statusStyles[item.status];
            const Icon = item.icon;

            return (
              <motion.div
                key={item.id}
                className="absolute cursor-pointer"
                style={{
                  transform: `translate(${pos.x}px, ${pos.y}px)`,
                  zIndex: isExpanded ? 200 : pos.zIndex,
                  opacity: isExpanded ? 1 : pos.opacity,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleItem(item.id);
                }}
              >
                {/* Pulse Effect */}
                {isPulsing && (
                  <motion.div
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className={cn("absolute -inset-4 rounded-full", status.bg, "opacity-30")}
                  />
                )}

                {/* Node */}
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className={cn(
                    "w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all",
                    isExpanded 
                      ? "bg-white dark:bg-[#001533] scale-125 shadow-lg" 
                      : "bg-card",
                    status.border
                  )}
                >
                  <Icon className={cn("w-6 h-6", status.text)} />
                </motion.div>

                {/* Label - Nome do Cliente em Destaque */}
                <div className={cn(
                  "absolute top-16 left-1/2 -translate-x-1/2",
                  "text-center transition-all max-w-[120px]",
                  isExpanded ? "scale-110" : ""
                )}>
                  <div className={cn(
                    "font-bold text-sm truncate",
                    isExpanded ? "text-foreground" : "text-foreground/90"
                  )}>
                    {item.client || item.title.split(' - ')[0]}
                  </div>
                  <div className={cn(
                    "text-[10px] truncate",
                    isExpanded ? "text-muted-foreground" : "text-muted-foreground/70"
                  )}>
                    {item.category}
                  </div>
                </div>

                {/* Expanded Card */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute top-24 left-1/2 -translate-x-1/2 z-50"
                    >
                      <Card className="w-72 border-border/60 shadow-xl">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className={cn("text-xs", status.text)}>
                              {status.label}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{item.date}</span>
                          </div>
                          <CardTitle className="text-base mt-2">{item.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <p className="text-sm text-muted-foreground">{item.content}</p>

                          {/* Energy Bar */}
                          <div>
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <Zap className="w-3 h-3" />
                                Progresso
                              </span>
                              <span className="font-medium">{item.energy}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${item.energy}%` }}
                                className={cn("h-full rounded-full", status.bg)}
                              />
                            </div>
                          </div>

                          {/* Related Items */}
                          {item.relatedIds.length > 0 && (
                            <div>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                                <Link2 className="w-3 h-3" />
                                Conexões
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {item.relatedIds.map((relId) => {
                                  const related = items.find(i => i.id === relId);
                                  return (
                                    <Button
                                      key={relId}
                                      variant="outline"
                                      size="sm"
                                      className="h-7 text-xs"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleItem(relId);
                                      }}
                                    >
                                      {related?.title}
                                      <ArrowRight className="w-3 h-3 ml-1" />
                                    </Button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-8">
          {Object.entries(statusStyles).map(([key, value]) => {
            const Icon = value.icon;
            return (
              <div key={key} className="flex items-center gap-2">
                <div className={cn("w-3 h-3 rounded-full", value.bg)} />
                <span className="text-sm text-muted-foreground">{value.label}</span>
              </div>
            );
          })}
        </div>

        {/* Instructions */}
        <p className="text-center text-sm text-muted-foreground mt-4">
          Clique em um nó para ver detalhes • Clique fora para fechar
        </p>
      </div>
    </section>
  );
}

export type { TimelineItem, OrbitalTimelineProps };





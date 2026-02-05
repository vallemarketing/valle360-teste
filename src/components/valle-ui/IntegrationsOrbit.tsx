"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Plug, 
  CheckCircle, 
  AlertCircle, 
  Settings,
  ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Integration {
  id: string;
  name: string;
  icon: string;
  status: "connected" | "disconnected" | "pending";
  description: string;
  category: string;
}

interface IntegrationsOrbitProps {
  integrations?: Integration[];
  title?: string;
  subtitle?: string;
  onSelect?: (integration: Integration) => void;
}

const defaultIntegrations: Integration[] = [
  { id: "1", name: "Meta Ads", icon: "/icons/meta-logo.svg", status: "connected", description: "Facebook e Instagram Ads", category: "Ads" },
  { id: "2", name: "Google Ads", icon: "/icons/google-ads-logo.svg", status: "connected", description: "Campanhas de busca e display", category: "Ads" },
  { id: "3", name: "n8n", icon: "/icons/n8n-logo.svg", status: "connected", description: "Automação de workflows", category: "Automation" },
  { id: "4", name: "Slack", icon: "/icons/slack-logo.svg", status: "connected", description: "Comunicação da equipe", category: "Communication" },
  { id: "5", name: "Google Analytics", icon: "/icons/google-analytics-logo.svg", status: "connected", description: "Analytics e métricas", category: "Analytics" },
  { id: "6", name: "HubSpot", icon: "/icons/hubspot-logo.svg", status: "pending", description: "CRM e Marketing", category: "CRM" },
  { id: "7", name: "Stripe", icon: "/icons/stripe-logo.svg", status: "connected", description: "Pagamentos online", category: "Finance" },
  { id: "8", name: "LinkedIn", icon: "/icons/linkedin-logo.svg", status: "connected", description: "Vagas e networking", category: "Social" },
];

const statusConfig = {
  connected: {
    color: "bg-emerald-500",
    label: "Conectado",
    icon: CheckCircle,
    ring: "ring-emerald-500/30",
  },
  disconnected: {
    color: "bg-red-500",
    label: "Desconectado",
    icon: AlertCircle,
    ring: "ring-red-500/30",
  },
  pending: {
    color: "bg-amber-500",
    label: "Pendente",
    icon: Settings,
    ring: "ring-amber-500/30",
  },
};

function SemiCircleOrbit({ 
  radius, 
  centerX, 
  centerY, 
  items, 
  iconSize,
  onSelect 
}: { 
  radius: number; 
  centerX: number; 
  centerY: number; 
  items: Integration[];
  iconSize: number;
  onSelect: (item: Integration) => void;
}) {
  return (
    <>
      {items.map((item, index) => {
        const angle = (index / (items.length - 1)) * 180;
        const x = radius * Math.cos((angle * Math.PI) / 180);
        const y = radius * Math.sin((angle * Math.PI) / 180);
        const status = statusConfig[item.status];
        const tooltipAbove = angle > 90;

        return (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="absolute flex flex-col items-center group cursor-pointer"
            style={{
              left: `${centerX + x - iconSize / 2}px`,
              top: `${centerY - y - iconSize / 2}px`,
              zIndex: 5,
            }}
            onClick={() => onSelect(item)}
          >
            {/* Icon Container */}
            <motion.div
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.95 }}
              className={cn(
                "relative flex items-center justify-center rounded-xl bg-card border-2 border-border/60 shadow-lg transition-all",
                "hover:border-[#1672d6]/50 hover:shadow-[#1672d6]/20",
                `ring-2 ${status.ring}`
              )}
              style={{ width: iconSize, height: iconSize }}
            >
              {item.icon.startsWith('/') ? (
                <img 
                  src={item.icon} 
                  alt={item.name}
                  className="w-8 h-8 object-contain"
                  onError={(e) => {
                    // Fallback para iniciais se a imagem não carregar
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      const fallback = document.createElement('span');
                      fallback.className = 'text-lg font-bold text-[#1672d6]';
                      fallback.textContent = item.name.substring(0, 2).toUpperCase();
                      parent.appendChild(fallback);
                    }
                  }}
                />
              ) : (
                <span className="text-2xl">{item.icon}</span>
              )}
              
              {/* Status Indicator */}
              <div className={cn(
                "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background",
                status.color
              )} />
            </motion.div>

            {/* Tooltip */}
            <motion.div
              initial={{ opacity: 0, y: tooltipAbove ? 10 : -10 }}
              whileHover={{ opacity: 1, y: 0 }}
              className={cn(
                "absolute hidden group-hover:block w-40 rounded-xl bg-card border border-border/60 p-3 shadow-xl text-center",
                tooltipAbove ? "bottom-[calc(100%+12px)]" : "top-[calc(100%+12px)]"
              )}
            >
              <p className="font-semibold text-sm text-foreground">{item.name}</p>
              <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
              <Badge 
                variant="outline" 
                className={cn("mt-2 text-xs", item.status === "connected" ? "text-emerald-600" : item.status === "pending" ? "text-amber-600" : "text-red-600")}
              >
                {status.label}
              </Badge>
              
              {/* Arrow */}
              <div className={cn(
                "absolute left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-card border-border/60",
                tooltipAbove ? "top-full -mt-1.5 border-b border-r" : "bottom-full mb-1.5 border-t border-l"
              )} />
            </motion.div>
          </motion.div>
        );
      })}
    </>
  );
}

export default function IntegrationsOrbit({
  integrations = defaultIntegrations,
  title = "Central de Integrações",
  subtitle = "Conecte suas ferramentas favoritas ao ecossistema Valle AI",
  onSelect: externalOnSelect,
}: IntegrationsOrbitProps) {
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [size, setSize] = useState({ width: 700, height: 400 });

  useEffect(() => {
    const updateSize = () => setSize({ 
      width: Math.min(window.innerWidth * 0.8, 700), 
      height: window.innerHeight 
    });
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const baseWidth = size.width;
  const centerX = baseWidth / 2;
  const centerY = baseWidth * 0.45;
  const iconSize = size.width < 500 ? 48 : 56;

  const connectedCount = integrations.filter(i => i.status === "connected").length;
  const pendingCount = integrations.filter(i => i.status === "pending").length;

  const handleSelect = (integration: Integration) => {
    setSelectedIntegration(integration);
    externalOnSelect?.(integration);
  };

  return (
    <section className="py-12 relative min-h-[500px] w-full overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <Badge variant="outline" className="border-[#1672d6]/30 text-[#1672d6] mb-4">
            <Plug className="w-3 h-3 mr-1" />
            Integrações
          </Badge>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            {title}
          </h2>
          <p className="text-base text-muted-foreground max-w-xl mx-auto">
            {subtitle}
          </p>

          {/* Stats */}
          <div className="flex items-center justify-center gap-6 mt-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-sm text-muted-foreground">{connectedCount} conectadas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-sm text-muted-foreground">{pendingCount} pendentes</span>
            </div>
          </div>
        </div>

        {/* Orbit Container */}
        <div className="relative flex justify-center">
          <div
            className="relative"
            style={{ width: baseWidth, height: baseWidth * 0.55 }}
          >
            {/* Glow Effect */}
            <div className="absolute inset-0 flex justify-center">
              <div
                className="w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle_at_center,rgba(22,114,214,0.15),transparent_70%)] blur-3xl -mt-32 pointer-events-none"
              />
            </div>

            {/* Center Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute left-1/2 -translate-x-1/2"
              style={{ top: centerY - 30 }}
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#001533] to-[#1672d6] flex items-center justify-center shadow-lg shadow-[#1672d6]/30">
                <span className="text-white font-bold text-xl">V</span>
              </div>
            </motion.div>

            {/* Orbit Rings */}
            <svg
              className="absolute inset-0 pointer-events-none"
              style={{ width: baseWidth, height: baseWidth * 0.55 }}
            >
              {[0.3, 0.5, 0.7].map((scale, i) => (
                <ellipse
                  key={i}
                  cx={centerX}
                  cy={centerY}
                  rx={baseWidth * scale * 0.5}
                  ry={baseWidth * scale * 0.35}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  className="text-border/40"
                  strokeDasharray="4 4"
                />
              ))}
            </svg>

            {/* Integration Icons */}
            <SemiCircleOrbit
              radius={baseWidth * 0.4}
              centerX={centerX}
              centerY={centerY}
              items={integrations}
              iconSize={iconSize}
              onSelect={handleSelect}
            />
          </div>
        </div>

        {/* Selected Integration Panel */}
        {selectedIntegration && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto mt-8 p-6 rounded-2xl border border-border/60 bg-card shadow-lg"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-2xl">
                {selectedIntegration.icon}
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{selectedIntegration.name}</h3>
                <p className="text-sm text-muted-foreground">{selectedIntegration.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <Badge 
                variant="outline" 
                className={cn(
                  selectedIntegration.status === "connected" 
                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" 
                    : selectedIntegration.status === "pending"
                    ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                    : "bg-red-500/10 text-red-600 border-red-500/20"
                )}
              >
                {statusConfig[selectedIntegration.status].label}
              </Badge>
              <Badge variant="outline">{selectedIntegration.category}</Badge>
            </div>

            <div className="flex gap-2">
              {selectedIntegration.status === "connected" ? (
                <>
                  <Button variant="outline" className="flex-1">
                    <Settings className="w-4 h-4 mr-2" />
                    Configurar
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Acessar
                  </Button>
                </>
              ) : (
                <Button className="w-full bg-[#1672d6] hover:bg-[#1672d6]/90">
                  <Plug className="w-4 h-4 mr-2" />
                  Conectar Agora
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}

export type { Integration, IntegrationsOrbitProps };





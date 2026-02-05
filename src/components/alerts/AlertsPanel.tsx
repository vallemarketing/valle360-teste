"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Bell, 
  AlertTriangle, 
  CreditCard, 
  Clock, 
  CheckCircle,
  FileText,
  Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

// ============================================
// ALERTS PANEL - VALLE AI
// Painel de alertas e notificações
// ============================================

interface Alert {
  id: string;
  type: "warning" | "danger" | "info" | "success";
  title: string;
  message: string;
  timestamp: Date;
  action?: {
    label: string;
    href: string;
  };
  read: boolean;
}

interface AlertsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const mockAlerts: Alert[] = [
  {
    id: "1",
    type: "danger",
    title: "Fatura em atraso",
    message: "Sua fatura de Novembro está vencida há 5 dias. Regularize para evitar interrupção dos serviços.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    action: { label: "Pagar agora", href: "/cliente/financeiro" },
    read: false,
  },
  {
    id: "2",
    type: "warning",
    title: "Aprovação pendente",
    message: "Você tem 3 materiais aguardando sua aprovação há mais de 48h.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
    action: { label: "Aprovar", href: "/cliente/aprovacoes" },
    read: false,
  },
  {
    id: "3",
    type: "info",
    title: "Reunião amanhã",
    message: "Lembrete: Você tem uma reunião agendada com Ana Silva amanhã às 14h.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
    action: { label: "Ver agenda", href: "/cliente/agenda" },
    read: false,
  },
  {
    id: "4",
    type: "success",
    title: "Campanha finalizada",
    message: "A campanha Black Friday foi concluída com sucesso! ROI de 320%.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48),
    read: true,
  },
  {
    id: "5",
    type: "warning",
    title: "Créditos baixos",
    message: "Seus créditos estão abaixo de 20%. Considere adicionar mais.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72),
    action: { label: "Adicionar", href: "/cliente/creditos" },
    read: true,
  },
];

const typeConfig = {
  danger: {
    icon: AlertTriangle,
    color: "text-red-600",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
  },
  warning: {
    icon: Clock,
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/20",
  },
  info: {
    icon: Bell,
    color: "text-[#1672d6]",
    bg: "bg-[#1672d6]/10",
    border: "border-[#1672d6]/20",
  },
  success: {
    icon: CheckCircle,
    color: "text-emerald-600",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
  },
};

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d atrás`;
  if (hours > 0) return `${hours}h atrás`;
  return "Agora";
}

export function AlertsPanel({ isOpen, onClose }: AlertsPanelProps) {
  const unreadCount = mockAlerts.filter(a => !a.read).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className={cn(
              "fixed top-0 right-0 z-50 h-full w-full max-w-md",
              "bg-white dark:bg-[#0a0f1a] shadow-2xl",
              "border-l border-[#001533]/10 dark:border-white/10"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#001533]/10 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#1672d6]/10">
                  <Bell className="w-5 h-5 text-[#1672d6]" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[#001533] dark:text-white">
                    Notificações
                  </h2>
                  <p className="text-sm text-[#001533]/60 dark:text-white/60">
                    {unreadCount} não lidas
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-[#001533]/60 dark:text-white/60"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Alerts List */}
            <ScrollArea className="h-[calc(100vh-80px)]">
              <div className="p-4 space-y-3">
                {mockAlerts.map((alert) => {
                  const config = typeConfig[alert.type];
                  const Icon = config.icon;

                  return (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "p-4 rounded-xl border-2",
                        config.bg,
                        config.border,
                        !alert.read && "ring-2 ring-[#1672d6]/20"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn("p-2 rounded-lg", config.bg)}>
                          <Icon className={cn("w-4 h-4", config.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className={cn(
                              "font-semibold text-[#001533] dark:text-white",
                              !alert.read && "text-[#001533] dark:text-white"
                            )}>
                              {alert.title}
                            </h3>
                            {!alert.read && (
                              <span className="w-2 h-2 rounded-full bg-[#1672d6] flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-sm text-[#001533]/70 dark:text-white/70 mt-1">
                            {alert.message}
                          </p>
                          <div className="flex items-center justify-between mt-3">
                            <span className="text-xs text-[#001533]/50 dark:text-white/50">
                              {formatTimeAgo(alert.timestamp)}
                            </span>
                            {alert.action && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className={cn("text-xs font-medium", config.color)}
                                asChild
                              >
                                <a href={alert.action.href}>
                                  {alert.action.label}
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </ScrollArea>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default AlertsPanel;

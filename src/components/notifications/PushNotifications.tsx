"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, BellOff, X, Check, Calendar, FileCheck, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ============================================
// PUSH NOTIFICATIONS - VALLE AI
// Sistema de notificações do navegador
// Cores: #001533 (navy), #1672d6 (primary), #ffffff (white)
// ============================================

interface Notification {
  id: string;
  type: "approval" | "meeting" | "payment" | "general";
  title: string;
  message: string;
  time: string;
  read: boolean;
}

export function PushNotificationManager() {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [showPrompt, setShowPrompt] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      type: "approval",
      title: "Aprovação Pendente",
      message: "Você tem 3 materiais aguardando aprovação",
      time: "Agora",
      read: false,
    },
    {
      id: "2",
      type: "meeting",
      title: "Reunião em 1 hora",
      message: "Reunião de alinhamento com a equipe Valle 360",
      time: "14:00",
      read: false,
    },
    {
      id: "3",
      type: "payment",
      title: "Fatura Vencendo",
      message: "Sua fatura vence em 3 dias",
      time: "Ontem",
      read: true,
    },
  ]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    // Verificar permissão atual
    if ("Notification" in window) {
      setPermission(Notification.permission);
      
      // Mostrar prompt se ainda não foi decidido
      const hasDecided = localStorage.getItem("valle_notification_decision");
      if (!hasDecided && Notification.permission === "default") {
        setTimeout(() => setShowPrompt(true), 3000);
      }
    }
  }, []);

  const requestPermission = async () => {
    if ("Notification" in window) {
      const result = await Notification.requestPermission();
      setPermission(result);
      localStorage.setItem("valle_notification_decision", "true");
      setShowPrompt(false);
      
      if (result === "granted") {
        // Enviar notificação de boas-vindas
        new Notification("Valle 360", {
          body: "Notificações ativadas! Você receberá alertas importantes.",
          icon: "/images/valle360-icon.png",
        });
      }
    }
  };

  const dismissPrompt = () => {
    localStorage.setItem("valle_notification_decision", "true");
    setShowPrompt(false);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case "approval":
        return <FileCheck className="size-4" />;
      case "meeting":
        return <Calendar className="size-4" />;
      case "payment":
        return <CreditCard className="size-4" />;
      default:
        return <Bell className="size-4" />;
    }
  };

  return (
    <>
      {/* Botão de Notificações */}
      <div className="relative">
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className={cn(
            "p-2 rounded-lg transition-colors relative",
            "hover:bg-[#001533]/5 dark:hover:bg-white/5",
            showNotifications && "bg-[#1672d6]/10"
          )}
        >
          <Bell className="size-5 text-[#001533] dark:text-white" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 size-5 bg-[#1672d6] text-white text-xs rounded-full flex items-center justify-center font-medium">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Dropdown de Notificações */}
        <AnimatePresence>
          {showNotifications && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className={cn(
                "absolute right-0 top-full mt-2 w-80 z-50",
                "bg-white dark:bg-[#0a0f1a] rounded-xl shadow-2xl",
                "border border-[#001533]/10 dark:border-white/10",
                "overflow-hidden"
              )}
            >
              <div className="p-4 border-b border-[#001533]/10 dark:border-white/10 flex items-center justify-between">
                <h3 className="font-semibold text-[#001533] dark:text-white">Notificações</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-[#1672d6] hover:underline"
                  >
                    Marcar todas como lidas
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-[#001533]/50 dark:text-white/50">
                    <Bell className="size-8 mx-auto mb-2 opacity-50" />
                    <p>Nenhuma notificação</p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <button
                      key={notification.id}
                      onClick={() => markAsRead(notification.id)}
                      className={cn(
                        "w-full p-4 text-left transition-colors",
                        "hover:bg-[#001533]/5 dark:hover:bg-white/5",
                        "border-b border-[#001533]/5 dark:border-white/5 last:border-0",
                        !notification.read && "bg-[#1672d6]/5"
                      )}
                    >
                      <div className="flex gap-3">
                        <div className={cn(
                          "size-8 rounded-lg flex items-center justify-center flex-shrink-0",
                          notification.type === "approval" && "bg-amber-100 text-primary",
                          notification.type === "meeting" && "bg-[#1672d6]/10 text-[#1672d6]",
                          notification.type === "payment" && "bg-emerald-100 text-emerald-600",
                          notification.type === "general" && "bg-gray-100 text-gray-600"
                        )}>
                          {getIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={cn(
                              "text-sm text-[#001533] dark:text-white truncate",
                              !notification.read && "font-semibold"
                            )}>
                              {notification.title}
                            </p>
                            <span className="text-xs text-[#001533]/50 dark:text-white/50 flex-shrink-0">
                              {notification.time}
                            </span>
                          </div>
                          <p className="text-xs text-[#001533]/60 dark:text-white/60 mt-0.5 line-clamp-2">
                            {notification.message}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="size-2 bg-[#1672d6] rounded-full flex-shrink-0 mt-2" />
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>

              {permission !== "granted" && (
                <div className="p-3 bg-[#001533]/5 dark:bg-white/5 border-t border-[#001533]/10 dark:border-white/10">
                  <button
                    onClick={requestPermission}
                    className="w-full text-xs text-[#1672d6] hover:underline flex items-center justify-center gap-1"
                  >
                    <Bell className="size-3" />
                    Ativar notificações do navegador
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Prompt de Permissão */}
      <AnimatePresence>
        {showPrompt && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className={cn(
              "fixed bottom-6 right-6 z-50 w-80",
              "bg-white dark:bg-[#0a0f1a] rounded-2xl shadow-2xl",
              "border border-[#001533]/10 dark:border-white/10",
              "p-4"
            )}
          >
            <button
              onClick={dismissPrompt}
              className="absolute top-3 right-3 p-1 hover:bg-[#001533]/5 rounded-lg"
            >
              <X className="size-4 text-[#001533]/50" />
            </button>

            <div className="flex items-start gap-3">
              <div className="size-10 rounded-xl bg-[#1672d6] flex items-center justify-center flex-shrink-0">
                <Bell className="size-5 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-[#001533] dark:text-white">
                  Ativar Notificações?
                </h4>
                <p className="text-sm text-[#001533]/60 dark:text-white/60 mt-1">
                  Receba alertas sobre aprovações, reuniões e faturas.
                </p>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={dismissPrompt}
              >
                <BellOff className="size-4 mr-1" />
                Agora não
              </Button>
              <Button
                size="sm"
                className="flex-1 bg-[#1672d6] hover:bg-[#1260b5]"
                onClick={requestPermission}
              >
                <Check className="size-4 mr-1" />
                Ativar
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Hook para enviar notificações
export function usePushNotification() {
  const sendNotification = (title: string, options?: NotificationOptions) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, {
        icon: "/images/valle360-icon.png",
        ...options,
      });
    }
  };

  return { sendNotification };
}


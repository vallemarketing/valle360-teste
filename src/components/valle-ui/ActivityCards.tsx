"use client";

import { cn } from "@/lib/utils";
import { 
  Calendar, 
  Clock, 
  User, 
  CheckCircle2, 
  FileText, 
  MessageSquare,
  Bell,
  ChevronRight
} from "lucide-react";
import Link from "next/link";

// ============================================
// ACTIVITY CARDS - VALLE AI
// Cards para próxima reunião e atividades recentes
// Cores: #001533 (navy), #1672d6 (primary), #ffffff (white)
// ============================================

// === PRÓXIMA REUNIÃO ===

interface NextMeetingProps {
  date?: string;
  time?: string;
  with?: string;
  withRole?: string;
  href?: string;
  className?: string;
}

export function NextMeeting({
  date = "15 Dez",
  time = "14:00",
  with: meetingWith = "Ana Silva",
  withRole = "Gestora de Conta",
  href = "/cliente/agenda",
  className,
}: NextMeetingProps) {
  return (
    <div className={cn(
      "rounded-xl border-2 border-[#001533]/10 dark:border-white/10",
      "bg-white dark:bg-[#001533]/50",
      "p-5 space-y-4",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-[#001533] dark:text-white">
          Próxima Reunião
        </h3>
        <Link 
          href={href}
          className="text-sm text-[#1672d6] hover:underline flex items-center gap-1"
        >
          Ver agenda
          <ChevronRight className="size-3" />
        </Link>
      </div>

      {/* Meeting info */}
      <div className="flex items-start gap-4">
        {/* Date box */}
        <div className={cn(
          "flex flex-col items-center justify-center",
          "w-16 h-16 rounded-xl",
          "bg-[#1672d6] text-white"
        )}>
          <Calendar className="size-4 mb-1" />
          <span className="text-sm font-bold">{date}</span>
        </div>

        {/* Details */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2 text-[#001533] dark:text-white">
            <Clock className="size-4 text-[#1672d6]" />
            <span className="font-medium">{time}</span>
          </div>
          <div className="flex items-center gap-2">
            <User className="size-4 text-[#001533]/50 dark:text-white/50" />
            <div>
              <span className="text-[#001533] dark:text-white block">{meetingWith}</span>
              <span className="text-xs text-[#001533]/50 dark:text-white/50">{withRole}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action */}
      <Link
        href={href}
        className={cn(
          "block w-full text-center py-2.5 rounded-lg",
          "bg-[#001533]/5 dark:bg-white/5 text-[#001533] dark:text-white",
          "hover:bg-[#1672d6]/10 hover:text-[#1672d6]",
          "transition-colors duration-200",
          "text-sm font-medium"
        )}
      >
        Confirmar Presença
      </Link>
    </div>
  );
}

// === ATIVIDADES RECENTES ===

interface Activity {
  id: string;
  type: "approval" | "file" | "message" | "notification" | "task";
  title: string;
  time: string;
  read?: boolean;
}

interface RecentActivitiesProps {
  activities?: Activity[];
  maxItems?: number;
  href?: string;
  className?: string;
}

const activityIcons = {
  approval: CheckCircle2,
  file: FileText,
  message: MessageSquare,
  notification: Bell,
  task: CheckCircle2,
};

const activityColors = {
  approval: "text-emerald-500 bg-emerald-500/10",
  file: "text-[#1672d6] bg-[#1672d6]/10",
  message: "text-violet-500 bg-violet-500/10",
  notification: "text-amber-500 bg-amber-500/10",
  task: "text-[#1672d6] bg-[#1672d6]/10",
};

const defaultActivities: Activity[] = [
  { id: "1", type: "approval", title: "Post aprovado para publicação", time: "2h atrás", read: false },
  { id: "2", type: "notification", title: "Novo insight disponível", time: "5h atrás", read: false },
  { id: "3", type: "file", title: "Relatório mensal gerado", time: "1 dia atrás", read: true },
  { id: "4", type: "message", title: "Nova mensagem da equipe", time: "2 dias atrás", read: true },
];

export function RecentActivities({
  activities = defaultActivities,
  maxItems = 4,
  href = "/cliente/noticias",
  className,
}: RecentActivitiesProps) {
  const displayActivities = activities.slice(0, maxItems);

  return (
    <div className={cn(
      "rounded-xl border-2 border-[#001533]/10 dark:border-white/10",
      "bg-white dark:bg-[#001533]/50",
      "p-5 space-y-4",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-[#001533] dark:text-white">
          Atividades Recentes
        </h3>
        <Link 
          href={href}
          className="text-sm text-[#1672d6] hover:underline flex items-center gap-1"
        >
          Ver todas
          <ChevronRight className="size-3" />
        </Link>
      </div>

      {/* Activities list */}
      <div className="space-y-3">
        {displayActivities.map((activity) => {
          const Icon = activityIcons[activity.type];
          const colorClasses = activityColors[activity.type];

          return (
            <div
              key={activity.id}
              className={cn(
                "flex items-start gap-3 p-3 rounded-lg",
                "hover:bg-[#001533]/5 dark:hover:bg-white/5",
                "transition-colors duration-200",
                "cursor-pointer",
                !activity.read && "bg-[#1672d6]/5"
              )}
            >
              <div className={cn("p-2 rounded-lg", colorClasses)}>
                <Icon className="size-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-sm truncate",
                  activity.read 
                    ? "text-[#001533]/70 dark:text-white/70" 
                    : "text-[#001533] dark:text-white font-medium"
                )}>
                  {activity.title}
                </p>
                <span className="text-xs text-[#001533]/50 dark:text-white/50">
                  {activity.time}
                </span>
              </div>
              {!activity.read && (
                <div className="w-2 h-2 rounded-full bg-[#1672d6] mt-2" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// === CARD DE SUPORTE ===

interface SupportCardProps {
  className?: string;
}

export function SupportCard({ className }: SupportCardProps) {
  return (
    <div className={cn(
      "rounded-xl border-2 border-[#1672d6]/20",
      "bg-gradient-to-br from-[#1672d6]/10 to-[#1672d6]/5",
      "p-5 space-y-3",
      className
    )}>
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-[#1672d6] text-white">
          <MessageSquare className="size-5" />
        </div>
        <div>
          <h4 className="font-semibold text-[#001533] dark:text-white">
            Precisa de ajuda?
          </h4>
          <p className="text-sm text-[#001533]/60 dark:text-white/60">
            Nossa equipe está pronta
          </p>
        </div>
      </div>
      
      <Link
        href="/cliente/mensagens"
        className={cn(
          "block w-full text-center py-2.5 rounded-lg",
          "bg-[#1672d6] text-white font-medium",
          "hover:bg-[#1672d6]/90",
          "transition-colors duration-200"
        )}
      >
        Falar com Suporte
      </Link>
    </div>
  );
}

export type { NextMeetingProps, Activity, RecentActivitiesProps, SupportCardProps };




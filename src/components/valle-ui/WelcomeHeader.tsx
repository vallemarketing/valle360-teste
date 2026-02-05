"use client";

import { cn } from "@/lib/utils";
import { Calendar, ChevronRight, Sparkles } from "lucide-react";
import Link from "next/link";

// ============================================
// WELCOME HEADER - VALLE AI
// Cabeçalho de boas-vindas para dashboards
// Cores: #001533 (navy), #1672d6 (primary), #ffffff (white)
// ============================================

interface WelcomeHeaderProps {
  userName?: string;
  userCompany?: string;
  planName?: string;
  ctaText?: string;
  ctaHref?: string;
  lastVisit?: string | null;
  className?: string;
}

export function WelcomeHeader({
  userName = "Cliente",
  userCompany,
  planName = "Premium",
  ctaText = "Agendar Reunião",
  ctaHref = "/cliente/agenda",
  lastVisit,
  className,
}: WelcomeHeaderProps) {
  // Saudação baseada na hora
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  return (
    <div className={cn(
      "relative overflow-hidden rounded-2xl",
      "bg-gradient-to-br from-[#001533] to-[#001533]/90",
      "p-6 md:p-8",
      className
    )}>
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#1672d6]/20 blur-3xl" />
        <div className="absolute -left-10 -bottom-10 h-48 w-48 rounded-full bg-[#1672d6]/10 blur-2xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Left side - Welcome text */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-white/60 text-sm">
            <Sparkles className="size-4" />
            <span>Valle AI Dashboard</span>
          </div>
          
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            {getGreeting()}, {userName}!
          </h1>
          
          <div className="flex items-center gap-3 flex-wrap">
            {userCompany && (
              <span className="text-white/80">{userCompany}</span>
            )}
            <span className={cn(
              "px-3 py-1 rounded-full text-sm font-medium",
              "bg-[#1672d6] text-white"
            )}>
              Plano {planName}
            </span>
            {lastVisit && (
              <span className="text-white/50 text-sm">
                • Última visita: {lastVisit}
              </span>
            )}
          </div>
        </div>

        {/* Right side - CTA */}
        <Link
          href={ctaHref}
          className={cn(
            "inline-flex items-center gap-2 px-5 py-3 rounded-xl",
            "bg-white text-[#001533] font-semibold",
            "hover:bg-white/90 hover:shadow-lg hover:shadow-white/20",
            "transition-all duration-300",
            "group"
          )}
        >
          <Calendar className="size-5" />
          <span>{ctaText}</span>
          <ChevronRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
}

// Versão compacta para subpáginas
interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumb?: { label: string; href?: string }[];
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  breadcrumb,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Breadcrumb */}
      {breadcrumb && breadcrumb.length > 0 && (
        <nav className="flex items-center gap-2 text-sm text-[#001533]/60 dark:text-white/60">
          {breadcrumb.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              {index > 0 && <ChevronRight className="size-3" />}
              {item.href ? (
                <Link 
                  href={item.href} 
                  className="hover:text-[#1672d6] transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-[#001533] dark:text-white font-medium">
                  {item.label}
                </span>
              )}
            </div>
          ))}
        </nav>
      )}

      {/* Title row */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#001533] dark:text-white">
            {title}
          </h1>
          {description && (
            <p className="text-[#001533]/60 dark:text-white/60 mt-1">
              {description}
            </p>
          )}
        </div>
        
        {actions && (
          <div className="flex items-center gap-3">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

export type { WelcomeHeaderProps, PageHeaderProps };




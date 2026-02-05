import { LucideIcon, PenTool, Image, Monitor, BarChart, DollarSign, Users, Video, Megaphone, Layout, ShieldCheck } from "lucide-react";

export type DashboardConfig = {
  role: string; // Usando string para flexibilidade, mas mapeado de UserRole
  title: string;
  widgets: string[];
  primaryColor: string;
  icon: LucideIcon;
};

export const DASHBOARD_ROLES: Record<string, DashboardConfig> = {
  // AreaKey compat (novo padrão)
  designer_grafico: {
    role: "designer_grafico",
    title: "Designer Gráfico",
    widgets: ["trends", "tools", "my-tasks", "notifications"],
    primaryColor: "bg-pink-500",
    icon: PenTool
  },
  webdesigner: {
    role: "webdesigner",
    title: "Web Designer",
    widgets: ["trends", "tools", "project-status", "val-chat"],
    primaryColor: "bg-purple-500",
    icon: Monitor
  },
  head_marketing: {
    role: "head_marketing",
    title: "Head de Marketing",
    widgets: ["team-performance", "campaign-overview", "budget-alert"],
    primaryColor: "bg-blue-600",
    icon: BarChart
  },
  rh: {
    role: "rh",
    title: "Recursos Humanos",
    widgets: ["employee-mood", "recruitment", "announcements"],
    primaryColor: "bg-green-500",
    icon: Users
  },
  financeiro_pagar: {
    role: "financeiro_pagar",
    title: "Financeiro",
    widgets: ["revenue", "cash-flow", "pending-invoices"],
    primaryColor: "bg-emerald-600",
    icon: DollarSign
  },
  financeiro_receber: {
    role: "financeiro_receber",
    title: "Financeiro",
    widgets: ["revenue", "cash-flow", "pending-invoices"],
    primaryColor: "bg-emerald-600",
    icon: DollarSign
  },
  video_maker: {
    role: "video_maker",
    title: "Video Maker",
    widgets: ["render-queue", "storage-usage", "trends"],
    primaryColor: "bg-red-500",
    icon: Video
  },
  social_media: {
    role: "social_media",
    title: "Social Media",
    widgets: ["post-calendar", "engagement-metrics", "trends"],
    primaryColor: "bg-indigo-500",
    icon: Megaphone
  },
  trafego_pago: {
    role: "trafego_pago",
    title: "Gestor de Tráfego",
    widgets: ["roas-tracker", "active-campaigns", "budget-alert"],
    primaryColor: "bg-cyan-600",
    icon: BarChart
  },
  comercial: {
    role: "comercial",
    title: "Comercial",
    widgets: ["sales-pipeline", "conversion-rate", "ranking"],
    primaryColor: "bg-sky-500",
    icon: Users
  },
  admin: {
    role: "admin",
    title: "Admin Geral",
    widgets: ["company-overview", "financial-summary", "team-health"],
    primaryColor: "bg-slate-800",
    icon: ShieldCheck
  },

  // Aliases (compat com valores antigos/string-based)
  designer: {
    role: "designer",
    title: "Designer Gráfico",
    widgets: ["trends", "tools", "my-tasks", "notifications"],
    primaryColor: "bg-pink-500",
    icon: PenTool
  },
  web_designer: {
    role: "web_designer",
    title: "Web Designer",
    widgets: ["trends", "tools", "project-status", "val-chat"],
    primaryColor: "bg-purple-500",
    icon: Monitor
  },
  financeiro: {
    role: "financeiro",
    title: "Financeiro",
    widgets: ["revenue", "cash-flow", "pending-invoices"],
    primaryColor: "bg-emerald-600",
    icon: DollarSign
  },
  trafego: {
    role: "trafego",
    title: "Gestor de Tráfego",
    widgets: ["roas-tracker", "active-campaigns", "budget-alert"],
    primaryColor: "bg-cyan-600",
    icon: BarChart
  },
};

export const getDashboardConfig = (role: string): DashboardConfig => {
  // Normalizar role (caso venha como 'admin' mas o sistema use 'super_admin' ou similar)
  const normalizedRole = role.toLowerCase().trim().replace(/\s+/g, '_');
  
  return DASHBOARD_ROLES[normalizedRole] || {
    role: "employee",
    title: "Colaborador",
    widgets: ["my-tasks", "notifications"],
    primaryColor: "bg-blue-500",
    icon: Layout
  };
};




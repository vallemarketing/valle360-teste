"use client";

// ============================================
// ADMIN LAYOUT - VALLE AI
// Layout padronizado igual área do cliente
// Cores: #001533 (navy), #1672d6 (primary), #ffffff (white)
// ============================================

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { 
  Bell, 
  Settings, 
  LogOut, 
  User,
  Menu,
  X,
  ChevronRight,
  Moon,
  Sun,
  Home,
  Search
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { SuperAdminSidebar } from "@/components/layout/SuperAdminSidebar";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { signOut } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { ValFloatingChat } from "@/components/val/ValFloatingChat";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { GuidedTour } from "@/components/tour/GuidedTour";

// Mapa de breadcrumbs
const breadcrumbMap: Record<string, string> = {
  "/admin/dashboard": "Dashboard",
  "/admin/centro-inteligencia": "Centro de Inteligência",
  "/admin/clientes": "Clientes",
  "/admin/colaboradores": "Colaboradores",
  "/admin/comercial": "Comercial",
  "/admin/comercial/propostas": "Propostas",
  "/admin/comercial/servicos": "Serviços",
  "/admin/comercial/radar": "Radar de Vendas",
  "/admin/contratos": "Contratos",
  "/admin/financeiro": "Financeiro",
  "/admin/integracoes": "Integrações",
  "/admin/kanban-app": "Kanban",
  "/admin/fluxos": "Fluxos",
  "/admin/prontidao": "Prontidão",
  "/admin/performance": "Performance",
  "/admin/configuracoes": "Configurações",
  "/admin/agendas": "Agendas",
  "/admin/reunioes": "Reuniões",
  "/admin/auditoria": "Auditoria",
  "/admin/relatorios": "Relatórios",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [userData, setUserData] = useState({
    name: "Guilherme Valle",
    email: "admin@valle360.com",
    avatar: "",
  });

  // Carregar dados do usuário
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from("user_profiles")
            .select("full_name, avatar, email")
            .eq("user_id", user.id)
            .single();

          if (profile) {
            setUserData({
              name: profile.full_name || "Admin",
              email: profile.email || user.email || "",
              avatar: profile.avatar || "",
            });
          }
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      }
    };
    loadUserData();
  }, []);

  // Detectar preferência de tema
  useEffect(() => {
    const isDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setIsDark(isDarkMode);
    document.documentElement.classList.toggle("dark", isDarkMode);
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };

  const handleLogout = async () => {
    try {
      await signOut();
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Gerar breadcrumb
  const currentPage = breadcrumbMap[pathname] || "Página";
  const isHome = pathname === "/admin/dashboard";
  const firstName = userData.name.split(" ")[0];

  return (
    <ProtectedRoute allowedRoles={["super_admin"]} redirectTo="/login">
      <div className="min-h-screen bg-white dark:bg-[#0a0f1a]">
        {/* Sidebar - Desktop */}
        <div className="hidden lg:block">
          <SuperAdminSidebar
            collapsed={sidebarCollapsed}
            onCollapsedChange={setSidebarCollapsed}
          />
        </div>

        {/* Mobile Menu */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent side="left" className="p-0 w-[280px] bg-[#001533] border-r border-white/10">
            <SuperAdminSidebar collapsed={false} />
          </SheetContent>
        </Sheet>

        {/* Main Content Area */}
        <div
          className={cn(
            "transition-all duration-300",
            sidebarCollapsed ? "lg:ml-[70px]" : "lg:ml-[280px]"
          )}
        >
          {/* Header */}
          <header className="sticky top-0 z-30 h-16 border-b border-[#001533]/10 dark:border-white/10 bg-white/95 dark:bg-[#0a0f1a]/95 backdrop-blur">
            <div className="flex items-center justify-between h-full px-4 lg:px-6">
              {/* Left side */}
              <div className="flex items-center gap-4">
                {/* Mobile menu button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  onClick={() => setMobileMenuOpen(true)}
                >
                  <Menu className="size-5" />
                </Button>

                {/* Breadcrumb */}
                <nav className="hidden sm:flex items-center gap-2 text-sm">
                  <Link
                    href="/admin/dashboard"
                    className="text-[#001533]/60 dark:text-white/60 hover:text-[#1672d6] transition-colors"
                  >
                    <Home className="size-4" />
                  </Link>
                  {!isHome && (
                    <>
                      <ChevronRight className="size-3 text-[#001533]/40 dark:text-white/40" />
                      <span className="font-medium text-[#001533] dark:text-white">
                        {currentPage}
                      </span>
                    </>
                  )}
                </nav>

                {/* Mobile title */}
                <span className="sm:hidden font-semibold text-[#001533] dark:text-white">
                  {currentPage}
                </span>
              </div>

              {/* Right side */}
              <div className="flex items-center gap-2">
                {/* Search */}
                <div className="hidden md:flex relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#001533]/40" />
                  <Input
                    placeholder="Buscar..."
                    className="pl-9 w-64 bg-[#001533]/5 border-[#001533]/10"
                  />
                </div>

                {/* Theme toggle */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  className="text-[#001533]/70 dark:text-white/70 hover:bg-[#001533]/5 dark:hover:bg-white/10"
                >
                  {isDark ? <Sun className="size-5" /> : <Moon className="size-5" />}
                </Button>

                {/* Notificações (reais) */}
                <NotificationBell />

                {/* Divider */}
                <div className="w-px h-6 bg-[#001533]/10 dark:bg-white/10 mx-1" />

                {/* User menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2 px-2 hover:bg-[#001533]/5 dark:hover:bg-white/10">
                      <Avatar className="h-8 w-8 border-2 border-[#1672d6]/30">
                        <AvatarImage src={userData.avatar} />
                        <AvatarFallback className="bg-[#1672d6] text-white text-sm font-semibold">
                          {userData.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="hidden md:block text-left">
                        <p className="text-sm font-medium text-[#001533] dark:text-white leading-none">
                          {firstName}
                        </p>
                        <p className="text-xs text-[#001533]/50 dark:text-white/50">
                          Super Admin
                        </p>
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-medium">{userData.name}</p>
                      <p className="text-xs text-muted-foreground">{userData.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/admin/configuracoes" className="cursor-pointer">
                        <User className="size-4 mr-2" />
                        Meu Perfil
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/admin/configuracoes" className="cursor-pointer">
                        <Settings className="size-4 mr-2" />
                        Configurações
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
                      <LogOut className="size-4 mr-2" />
                      Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="min-h-[calc(100vh-4rem)] p-4 lg:p-6">
            {children}
          </main>
        </div>

        {/* Val Floating Chat */}
        <ValFloatingChat userName={firstName} />

        {/* Tour Guiado - Primeira Visita */}
        <GuidedTour variant="admin" />
      </div>
    </ProtectedRoute>
  );
}

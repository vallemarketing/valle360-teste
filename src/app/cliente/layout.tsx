"use client";

// ============================================
// CLIENTE LAYOUT - VALLE AI
// Layout principal da área do cliente
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
  Home
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ClientSidebar } from "@/components/layout/ClientSidebar";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { signOut } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { ValFloatingChat } from "@/components/val/ValFloatingChat";
import { AlertsPanel } from "@/components/alerts/AlertsPanel";
import { NPSModal } from "@/components/nps/NPSModal";
import { PushNotificationManager } from "@/components/notifications/PushNotifications";
import { GuidedTour } from "@/components/tour/GuidedTour";
import { BottomNavigation } from "@/components/layout/BottomNavigation";

// Mapa de breadcrumbs
const breadcrumbMap: Record<string, string> = {
  "/cliente/dashboard": "Dashboard",
  "/cliente/producao": "Produção",
  "/cliente/aprovacoes": "Aprovações",
  "/cliente/insights": "Insights",
  "/cliente/evolucao": "Evolução",
  "/cliente/concorrentes": "Concorrentes",
  "/cliente/redes": "Redes Sociais",
  "/cliente/financeiro": "Financeiro",
  "/cliente/creditos": "Créditos",
  "/cliente/servicos": "Serviços",
  "/cliente/mensagens": "Mensagens",
  "/cliente/noticias": "Notícias",
  "/cliente/solicitacao": "Solicitações",
  "/cliente/perfil": "Meu Perfil",
  "/cliente/beneficios": "Benefícios",
  "/cliente/agenda": "Agenda",
  "/cliente/arquivos": "Arquivos",
  "/cliente/ia": "Assistente IA",
};

export default function ClienteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [userData, setUserData] = useState({
    name: "Cliente",
    email: "",
    avatar: "",
  });
  const [showAlerts, setShowAlerts] = useState(false);
  const [showNPS, setShowNPS] = useState(false);

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
              name: profile.full_name || "Cliente",
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
  const isHome = pathname === "/cliente/dashboard";

  return (
    <ProtectedRoute allowedRoles={["cliente"]}>
      <div className="min-h-screen bg-white dark:bg-[#0a0f1a]">
        {/* Menu (Sheet) - navegação completa sem sidebar fixa */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent side="left" className="p-0 w-[280px] bg-[#001533] border-r border-white/10">
            <ClientSidebar collapsed={false} />
          </SheetContent>
        </Sheet>

        {/* Main Content Area */}
        <div className="transition-all duration-300">
          {/* Header */}
          <header className="sticky top-0 z-30 h-16 border-b border-[#001533]/10 dark:border-white/10 bg-white/95 dark:bg-[#0a0f1a]/95 backdrop-blur">
            <div className="flex items-center justify-between h-full px-4 lg:px-6">
              {/* Left side */}
              <div className="flex items-center gap-4">
                {/* Menu button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-[#001533]/70 dark:text-white/70 hover:bg-[#001533]/5 dark:hover:bg-white/10"
                  onClick={() => setMobileMenuOpen(true)}
                >
                  <Menu className="size-5" />
                </Button>

                {/* Breadcrumb */}
                <nav className="hidden sm:flex items-center gap-2 text-sm">
                  <Link
                    href="/cliente/dashboard"
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
                {/* Theme toggle */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  className="text-[#001533]/70 dark:text-white/70 hover:bg-[#001533]/5 dark:hover:bg-white/10"
                >
                  {isDark ? <Sun className="size-5" /> : <Moon className="size-5" />}
                </Button>

                {/* Push Notifications */}
                <PushNotificationManager />

                {/* Divider */}
                <div className="w-px h-6 bg-[#001533]/10 dark:bg-white/10 mx-1" />

                {/* User menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2 px-2 hover:bg-[#001533]/5 dark:hover:bg-white/10">
                      <Avatar className="h-8 w-8 border-2 border-[#1672d6]/30">
                        <AvatarImage src={userData.avatar} />
                        <AvatarFallback className="bg-[#1672d6]/10 text-[#1672d6] text-sm font-semibold">
                          {userData.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="hidden md:block text-left">
                        <p className="text-sm font-medium text-[#001533] dark:text-white leading-none">
                          {userData.name.split(" ")[0]}
                        </p>
                        <p className="text-xs text-[#001533]/50 dark:text-white/50">
                          Cliente
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
                      <Link href="/cliente/perfil" className="cursor-pointer">
                        <User className="size-4 mr-2" />
                        Meu Perfil
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/cliente/perfil" className="cursor-pointer">
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

          {/* Page Content - Responsivo */}
          <main className="min-h-[calc(100vh-4rem)] p-4 pb-24 lg:p-6">
            {children}
          </main>
        </div>

        {/* Navegação inferior (mobile) */}
        <div className="lg:hidden">
          <BottomNavigation />
        </div>

        {/* Val Floating Chat */}
        <ValFloatingChat userName={userData.name.split(" ")[0]} />

        {/* Alerts Panel */}
        <AlertsPanel isOpen={showAlerts} onClose={() => setShowAlerts(false)} />

        {/* NPS Modal */}
        <NPSModal
          isOpen={showNPS}
          onClose={() => setShowNPS(false)}
          onSubmit={(score, comment) => {
            console.log("NPS:", score, comment);
            // Aqui enviaria para o backend
          }}
        />

        {/* Tour Guiado - Primeira Visita */}
        <GuidedTour variant="client" />
      </div>
    </ProtectedRoute>
  );
}

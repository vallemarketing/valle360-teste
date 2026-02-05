'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  UsersRound,
  Calendar,
  TrendingUp,
  BarChart3,
  CreditCard,
  FileText,
  Settings,
  Shield,
  ClipboardList,
  MessageSquare,
  Bell,
  Search,
  LogOut,
  Menu,
  X,
  Target,
  Package,
  Brain,
  Sparkles,
  Eye,
  Bot,
  DollarSign,
  Activity,
  Zap,
  FileSignature,
  Link as LinkIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface MenuItem {
  id: string;
  label: string;
  icon: any;
  href: string;
  badge?: number;
}

export function AdminSidebar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const menuItems: MenuItem[] = [
    { id: 'intelligence', label: 'Centro de Inteligência', icon: Brain, href: '/admin/centro-inteligencia' },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/admin/dashboard' },
    
    // === NOVAS FUNCIONALIDADES IA ===
    { id: 'radar', label: '📡 Radar de Vendas (IA)', icon: Bot, href: '/admin/comercial/radar' },
    { id: 'services', label: '📦 Catálogo de Serviços', icon: Package, href: '/admin/comercial/servicos' },
    { id: 'proposals', label: '✍️ Gerador de Propostas', icon: FileSignature, href: '/admin/comercial/propostas' },
    { id: 'integrations', label: '🔌 Hub de Integrações', icon: LinkIcon, href: '/admin/integracoes' },
    
    { id: 'ml', label: '🤖 Machine Learning', icon: Brain, href: '/admin/machine-learning', badge: 5 },
    { id: 'competitor', label: '🕵️ Inteligência Competitiva', icon: Eye, href: '/admin/inteligencia-concorrencia' },
    { id: 'pricing', label: '💰 Pricing Intelligence', icon: DollarSign, href: '/admin/pricing-intelligence', badge: 3 },
    { id: 'realtime', label: '📊 Analytics Tempo Real', icon: Activity, href: '/admin/realtime-analytics' },
    { id: 'tools', label: '⚡ Ferramentas Avançadas', icon: Zap, href: '/admin/ferramentas-avancadas' },
    
    // === FUNCIONALIDADES EXISTENTES ===
    { id: 'clients', label: 'Clientes', icon: Users, href: '/admin/clientes' },
    { id: 'employees', label: 'Colaboradores', icon: UsersRound, href: '/admin/colaboradores' },
    { id: 'schedules', label: 'Agendas', icon: Calendar, href: '/admin/agendas' },
    { id: 'meetings', label: 'Reuniões', icon: MessageSquare, href: '/admin/reunioes', badge: 3 },
    { id: 'materials', label: 'Solicitações', icon: Package, href: '/admin/solicitacoes-material', badge: 5 },
    { id: 'commercial', label: 'Métricas Comerciais', icon: Target, href: '/admin/metricas-comerciais' },
    { id: 'traffic', label: 'Tráfego Comparativo', icon: TrendingUp, href: '/admin/trafego-comparativo' },
    { id: 'contracts', label: 'Contratos', icon: FileText, href: '/admin/contratos' },
    { id: 'financial', label: 'Financeiro', icon: CreditCard, href: '/admin/financeiro' },
    { id: 'performance', label: 'Performance Geral', icon: BarChart3, href: '/admin/performance' },
    { id: 'gateway', label: 'Gateway Pagamento', icon: CreditCard, href: '/admin/gateway-pagamento' },
    { id: 'audit', label: 'Auditoria', icon: Shield, href: '/admin/auditoria' },
    { id: 'settings', label: 'Configurações', icon: Settings, href: '/admin/configuracoes' },
  ];

  const filteredMenuItems = menuItems.filter(item =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-valle-navy-900 to-valle-navy-800 border-b border-valle-blue-500/20 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-valle-blue-500" />
            <span className="text-xl font-bold text-white">Admin Valle 360</span>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-white p-2 hover:bg-valle-navy-700 rounded-lg transition-colors"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-72 bg-gradient-to-b from-valle-navy-900 via-valle-navy-800 to-valle-navy-900 border-r border-valle-blue-500/20 shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-valle-blue-500/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-valle-blue-500 to-valle-blue-700 rounded-xl flex items-center justify-center shadow-lg">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Valle 360</h1>
              <p className="text-xs text-valle-silver-400">Painel Admin</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-valle-silver-500" />
            <Input
              type="text"
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-valle-navy-700/50 border-valle-blue-500/30 text-white placeholder:text-valle-silver-500 focus:border-valle-blue-500"
            />
          </div>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.id}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
                  isActive
                    ? 'bg-gradient-to-r from-valle-blue-600 to-valle-blue-700 text-white shadow-lg'
                    : 'text-valle-silver-400 hover:bg-valle-navy-700/50 hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-valle-silver-500 group-hover:text-valle-blue-400'}`} />
                <span className="flex-1 font-medium">{item.label}</span>
                {item.badge && (
                  <span className="px-2 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-valle-blue-500/20">
          <div className="flex items-center gap-3 mb-3 px-3">
            <div className="w-10 h-10 bg-gradient-to-br from-valle-blue-500 to-valle-blue-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">AD</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">Admin</p>
              <p className="text-xs text-valle-silver-400">Super Administrador</p>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setIsMobileMenuOpen(false)}>
          <aside
            className="absolute left-0 top-0 bottom-0 w-72 bg-gradient-to-b from-valle-navy-900 via-valle-navy-800 to-valle-navy-900 shadow-2xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-valle-blue-500/20 mt-16">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-valle-silver-500" />
                <Input
                  type="text"
                  placeholder="Buscar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-valle-navy-700/50 border-valle-blue-500/30 text-white placeholder:text-valle-silver-500"
                />
              </div>
            </div>

            <nav className="p-4 space-y-1">
              {filteredMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-valle-blue-600 to-valle-blue-700 text-white'
                        : 'text-valle-silver-400 hover:bg-valle-navy-700/50 hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="flex-1 font-medium">{item.label}</span>
                    {item.badge && (
                      <span className="px-2 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}
    </>
  );
}

'use client';

import { ChevronDown, Layout, Menu, Search, Settings, MessageSquare, HelpCircle, User as UserIcon, Moon, Sun } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import Image from 'next/image';
import { labelFromAreaKey, resolveEmployeeAreaKey } from '@/lib/employee/areaKey';
import { NotificationBell } from '@/components/notifications/NotificationBell';

interface ColaboradorHeaderProps {
  onMenuClick?: () => void;
}

export function ColaboradorHeader({ onMenuClick }: ColaboradorHeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');
  const [userAvatar, setUserAvatar] = useState('');
  const [isDark, setIsDark] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchUser();
  }, []);

  // Detectar preferência de tema (igual Admin/Cliente)
  useEffect(() => {
    const isDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setIsDark(isDarkMode);
    document.documentElement.classList.toggle("dark", isDarkMode);
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };

  const fetchUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Buscar dados do employee (incluindo avatar)
        const { data: employee } = await supabase
          .from('employees')
          .select('full_name, avatar, area_of_expertise, department, areas')
          .eq('user_id', user.id)
          .single();
        
        if (employee) {
          setUserName(employee.full_name || user.email?.split('@')[0] || 'Colaborador');
          setUserAvatar(employee.avatar || '');
          // Resolver área estável (AreaKey) e mostrar label padronizada
          const areaKey = resolveEmployeeAreaKey({
            department: (employee as any)?.department ?? null,
            area_of_expertise: (employee as any)?.area_of_expertise ?? null,
            areas: (employee as any)?.areas ?? null,
          });
          setUserRole(labelFromAreaKey(areaKey));
        } else {
          // Fallback para user_profiles
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('full_name, role')
            .eq('user_id', user.id)
            .single();
          
          if (profile) {
            setUserName(profile.full_name || user.email?.split('@')[0] || 'Colaborador');
            setUserRole(profile.role === 'super_admin' ? 'Super Admin' : 'Colaborador');
          }
        }
      }
    } catch (error) {
      console.error('Erro ao carregar usuário:', error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implementar lógica de busca global aqui
    console.log('Searching for:', searchQuery);
  };

  // Atalho Cmd+K para busca
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('global-search')?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-[73px] border-b border-[#001533]/10 dark:border-white/10 bg-white/95 dark:bg-[#0a0f1a]/95 backdrop-blur">
      <div className="flex items-center justify-between px-6 h-full">
        {/* Menu Mobile + Logo Valle 360 */}
        <div className="flex items-center gap-3 lg:w-64">
          {/* Botão Menu Mobile */}
          {onMenuClick && (
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 text-[#001533]/60 hover:text-[#001533] hover:bg-[#001533]/5 dark:text-white/60 dark:hover:text-white dark:hover:bg-white/10 rounded-lg transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}
          
          <Link href="/colaborador/dashboard" className="flex items-center">
            <Image
              src="/Logo/valle360-logo.png"
              alt="Valle 360"
              width={160}
              height={45}
              className="object-contain hidden sm:block"
              priority
            />
            <Image
              src="/icons/valle360-icon.png"
              alt="Valle 360"
              width={36}
              height={36}
              className="object-contain sm:hidden"
              priority
            />
          </Link>
        </div>

        {/* Barra de Busca Central - Responsiva */}
        <div className="hidden md:flex flex-1 max-w-2xl px-4 lg:px-8">
          <form onSubmit={handleSearch} className="relative group w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            </div>
            <input
              id="global-search"
              type="text"
              className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg leading-5 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm transition-all"
              placeholder="Buscar tarefas, clientes ou arquivos... (⌘K)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <span className="text-gray-400 text-xs border border-gray-200 rounded px-1.5 py-0.5 hidden lg:block">⌘K</span>
            </div>
          </form>
        </div>
        
        {/* Busca Mobile - Ícone apenas */}
        <button className="md:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
          <Search className="h-5 w-5" />
        </button>

        {/* Ações do Usuário */}
        <div className="flex items-center gap-3">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg transition-colors text-[#001533]/70 dark:text-white/70 hover:bg-[#001533]/5 dark:hover:bg-white/10"
            aria-label="Alternar tema"
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          {/* Notificações (reais) */}
          <NotificationBell context="colaborador" />

          {/* Ajuda */}
          <button className="p-2 text-[#001533]/60 hover:text-[#001533] hover:bg-[#001533]/5 dark:text-white/60 dark:hover:text-white dark:hover:bg-white/10 rounded-lg transition-colors">
            <HelpCircle className="h-5 w-5" />
          </button>

          {/* Perfil */}
          <div className="flex items-center gap-3 pl-4 border-l border-[#001533]/10 dark:border-white/10">
            <div className="flex flex-col text-right hidden md:block">
              <span className="text-sm font-semibold text-[#001533] dark:text-white">{userName}</span>
              <span className="text-xs text-[#001533]/50 dark:text-white/50">{userRole}</span>
            </div>
            {userAvatar ? (
              <img 
                src={userAvatar} 
                alt={userName}
                className="h-10 w-10 rounded-full object-cover shadow-md cursor-pointer hover:shadow-lg transition-all ring-2 ring-[#1672d6]/20"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#001533] to-[#1672d6] flex items-center justify-center text-white font-bold shadow-md cursor-pointer hover:shadow-lg transition-all">
                {userName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

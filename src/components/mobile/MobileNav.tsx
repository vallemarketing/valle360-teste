'use client';

/**
 * Valle 360 - Mobile Navigation
 * Menu hamburger com drawer lateral para dispositivos móveis
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  Menu,
  X,
  ChevronRight,
  ChevronDown,
  Home,
  LogOut,
  User,
  Settings,
  Bell
} from 'lucide-react';
import { cn } from '@/lib/utils';

// =====================================================
// TIPOS
// =====================================================

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
}

export interface NavGroup {
  id: string;
  label: string;
  icon: React.ElementType;
  items: NavItem[];
}

export interface MobileNavProps {
  groups: NavGroup[];
  userType: 'admin' | 'client' | 'employee';
  userName?: string;
  userAvatar?: string;
  logoSrc?: string;
  onLogout?: () => void;
}

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export function MobileNav({
  groups,
  userType,
  userName = 'Usuário',
  userAvatar,
  logoSrc = '/Logo/valle360-logo.png',
  onLogout
}: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const pathname = usePathname();

  // Fechar menu quando mudar de rota
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Prevenir scroll quando menu aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const isItemActive = (href: string) => pathname === href;

  const getBaseColor = () => {
    switch (userType) {
      case 'admin':
        return '#001533';
      case 'client':
        return '#001533';
      case 'employee':
        return '#001533';
      default:
        return '#001533';
    }
  };

  return (
    <>
      {/* Header Mobile */}
      <header 
        className="fixed top-0 left-0 right-0 h-16 z-50 flex items-center justify-between px-4 border-b lg:hidden"
        style={{ backgroundColor: getBaseColor(), borderColor: 'rgba(255,255,255,0.1)' }}
      >
        {/* Menu Button */}
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          aria-label="Abrir menu"
        >
          <Menu className="w-6 h-6 text-white" />
        </button>

        {/* Logo */}
        <Link href="/" className="flex items-center">
          <Image
            src={logoSrc}
            alt="Valle 360"
            width={120}
            height={35}
            className="object-contain"
          />
        </Link>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-lg hover:bg-white/10 transition-colors relative">
            <Bell className="w-5 h-5 text-white" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>
        </div>
      </header>

      {/* Drawer Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 lg:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 bottom-0 w-[85%] max-w-[320px] z-50 flex flex-col lg:hidden"
            style={{ backgroundColor: getBaseColor() }}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <Image
                src={logoSrc}
                alt="Valle 360"
                width={130}
                height={40}
                className="object-contain"
              />
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* User Info */}
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                {userAvatar ? (
                  <img
                    src={userAvatar}
                    alt={userName}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-[#1672d6] flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                )}
                <div>
                  <p className="text-white font-medium">{userName}</p>
                  <p className="text-white/60 text-sm">
                    {userType === 'admin' ? 'Administrador' :
                     userType === 'client' ? 'Cliente' : 'Colaborador'}
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto p-3 space-y-1">
              {groups.map((group) => {
                const GroupIcon = group.icon;
                const isExpanded = expandedGroups.includes(group.id);
                const hasActiveItem = group.items.some(item => isItemActive(item.href));

                return (
                  <div key={group.id}>
                    {/* Group Header */}
                    <button
                      onClick={() => toggleGroup(group.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all",
                        hasActiveItem
                          ? "bg-[#1672d6]/20 text-white"
                          : "text-white/70 hover:bg-white/5 hover:text-white"
                      )}
                    >
                      <GroupIcon className="w-5 h-5 flex-shrink-0" />
                      <span className="flex-1 text-left text-sm font-medium">{group.label}</span>
                      <ChevronDown
                        className={cn(
                          "w-4 h-4 transition-transform",
                          isExpanded && "rotate-180"
                        )}
                      />
                    </button>

                    {/* Group Items */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden ml-2"
                        >
                          {group.items.map((item) => {
                            const ItemIcon = item.icon;
                            const isActive = isItemActive(item.href);

                            return (
                              <Link
                                key={item.id}
                                href={item.href}
                                className={cn(
                                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all mt-1",
                                  isActive
                                    ? "bg-[#1672d6] text-white"
                                    : "text-white/60 hover:bg-white/5 hover:text-white"
                                )}
                              >
                                <ItemIcon className="w-4 h-4" />
                                <span className="text-sm">{item.label}</span>
                                {item.badge && item.badge > 0 && (
                                  <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                                    {item.badge}
                                  </span>
                                )}
                              </Link>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </nav>

            {/* Footer Actions */}
            <div className="p-3 border-t border-white/10 space-y-1">
              <Link
                href="/configuracoes"
                className="flex items-center gap-3 px-3 py-3 rounded-xl text-white/70 hover:bg-white/5 hover:text-white transition-colors"
              >
                <Settings className="w-5 h-5" />
                <span className="text-sm">Configurações</span>
              </Link>
              
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="text-sm">Sair</span>
                </button>
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Spacer for fixed header */}
      <div className="h-16 lg:hidden" />
    </>
  );
}

// =====================================================
// MOBILE BOTTOM NAV (opcional)
// =====================================================

interface BottomNavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ElementType;
}

export function MobileBottomNav({ items }: { items: BottomNavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-40 lg:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[64px]",
                isActive
                  ? "text-[#1672d6]"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              <Icon className={cn("w-5 h-5", isActive && "scale-110")} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// =====================================================
// MOBILE HEADER SIMPLES
// =====================================================

interface MobileHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  actions?: React.ReactNode;
}

export function MobileHeader({ title, subtitle, showBack, onBack, actions }: MobileHeaderProps) {
  return (
    <header className="sticky top-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 z-30 lg:hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          {showBack && (
            <button
              onClick={onBack}
              className="p-1 -ml-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <ChevronRight className="w-5 h-5 rotate-180 text-gray-600 dark:text-gray-400" />
            </button>
          )}
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h1>
            {subtitle && (
              <p className="text-xs text-gray-500">{subtitle}</p>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}

export default MobileNav;


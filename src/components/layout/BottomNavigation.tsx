'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Home, CheckSquare, Bot, Eye, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  id: string;
  label: string;
  icon: typeof Home;
  href: string;
  badge?: number;
  isHighlight?: boolean;
}

export function BottomNavigation() {
  const pathname = usePathname();
  const router = useRouter();

  const navItems: NavItem[] = [
    {
      id: 'home',
      label: 'Início',
      icon: Home,
      href: '/cliente/dashboard',
    },
    {
      id: 'competitors',
      label: 'Radar',
      icon: Eye,
      href: '/cliente/concorrentes',
      badge: 2,
    },
    {
      id: 'ai',
      label: 'Val',
      icon: Bot,
      href: '/cliente/ia',
      isHighlight: true,
    },
    {
      id: 'approvals',
      label: 'Aprovações',
      icon: CheckSquare,
      href: '/cliente/producao',
      badge: 3,
    },
    {
      id: 'profile',
      label: 'Perfil',
      icon: User,
      href: '/cliente/perfil',
    },
  ];

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const handleNavigation = (item: NavItem) => {
    router.push(item.href);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800"
      role="navigation"
      aria-label="Navegação principal"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center justify-around h-16 max-w-screen-xl mx-auto px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          if (item.isHighlight) {
            return (
              <div key={item.id} className="relative flex flex-col items-center justify-center min-w-[60px]">
                <button
                  onClick={() => handleNavigation(item)}
                  className={cn(
                    'relative flex items-center justify-center',
                    'w-14 h-14 -mt-6 rounded-full',
                    'bg-gradient-to-br from-valle-blue-500 to-valle-blue-600',
                    'text-white shadow-lg border-2 border-white dark:border-gray-900',
                    'hover:shadow-xl hover:scale-105 hover:from-valle-blue-600 hover:to-valle-blue-700',
                    'active:scale-95',
                    'transition-all duration-200',
                    'focus:outline-none focus:ring-2 focus:ring-valle-blue-500 focus:ring-offset-2'
                  )}
                  aria-label={item.label}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon className="w-7 h-7 stroke-[2.5]" />

                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-valle-blue-400 to-valle-blue-600 blur-xl opacity-40 -z-10" />
                </button>
                <span className="text-[10px] font-medium leading-tight text-center text-valle-blue-600 dark:text-valle-blue-400 mt-1">
                  {item.label}
                </span>
              </div>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => handleNavigation(item)}
              className={cn(
                'relative flex flex-col items-center justify-center gap-1',
                'min-w-[60px] h-full py-1 px-2',
                'transition-colors duration-150',
                'focus:outline-none focus:ring-2 focus:ring-valle-blue-500 focus:ring-inset rounded-lg',
                active ? 'text-valle-blue-600 dark:text-valle-blue-400' : 'text-valle-silver-600 dark:text-valle-silver-400',
                !active && 'hover:text-valle-navy-900 dark:hover:text-white'
              )}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
            >
              <div className="relative">
                <Icon
                  className={cn(
                    'w-6 h-6 transition-transform duration-150',
                    active && 'scale-110'
                  )}
                />

                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-500 rounded-full border-2 border-white dark:border-gray-900">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>

              <span
                className={cn(
                  'text-[10px] font-medium leading-tight text-center',
                  active && 'font-semibold'
                )}
              >
                {item.label}
              </span>

              {active && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-valle-blue-600 dark:bg-valle-blue-400 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

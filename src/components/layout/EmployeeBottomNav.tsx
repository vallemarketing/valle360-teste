'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  KanbanSquare,
  Sparkles,
  MessageSquare,
  Calendar,
  BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/colaborador/dashboard-multi',
    icon: BarChart3,
    highlight: true,
  },
  {
    name: 'Kanban',
    href: '/colaborador/kanban',
    icon: KanbanSquare,
  },
  {
    name: 'IA',
    href: '/colaborador/ia',
    icon: Sparkles,
  },
  {
    name: 'Mensagens',
    href: '/colaborador/mensagens',
    icon: MessageSquare,
    badge: 3,
  },
  {
    name: 'Perfil',
    href: '/colaborador/perfil',
    icon: LayoutDashboard,
  },
];

export default function EmployeeBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg safe-area-bottom">
      <div className="max-w-md mx-auto px-2 py-2">
        <div className="flex items-center justify-around">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'relative flex flex-col items-center justify-center min-w-[64px] py-2 px-3 rounded-xl transition-all',
                  isActive
                    ? 'text-blue-600'
                    : 'text-gray-600 hover:text-blue-500 hover:bg-blue-50'
                )}
              >
                <div className="relative">
                  {item.highlight && (
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg blur opacity-30 group-hover:opacity-50 transition" />
                  )}
                  <div
                    className={cn(
                      'relative p-1.5 rounded-lg transition-all',
                      isActive && 'bg-blue-100',
                      item.highlight && !isActive && 'bg-gradient-to-br from-blue-500 to-cyan-500',
                      item.highlight && !isActive && 'text-white'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  {item.badge && item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-red-500 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </div>

                <span className="text-[10px] font-medium mt-1 text-center">
                  {item.name}
                </span>

                {isActive && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

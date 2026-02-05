'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import {
  LayoutDashboard,
  KanbanSquare,
  MessageSquare,
  Users,
  FileText,
  Calendar,
  BarChart3,
  DollarSign,
  Sparkles,
  Upload
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { inferAreaKeyFromLabel, type AreaKey } from '@/lib/kanban/areaBoards';

const appNavItems = [
  { href: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/app/kanban', label: 'Kanban', icon: KanbanSquare },
  { href: '/app/mensagens', label: 'Mensagens', icon: MessageSquare },
  { href: '/app/pessoas', label: 'Pessoas', icon: Users },
  { href: '/app/solicitacoes', label: 'Solicitações', icon: FileText },
  { href: '/app/agenda', label: 'Agenda', icon: Calendar },
  { href: '/app/relatorios', label: 'Relatórios', icon: BarChart3 },
  { href: '/app/financeiro', label: 'Financeiro', icon: DollarSign },
  { href: '/app/val-ai', label: 'Fale com a Val', icon: Sparkles, isAi: true },
];

export function Sidebar() {
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [areaKeys, setAreaKeys] = useState<AreaKey[]>([]);
  const [uploadHref, setUploadHref] = useState<string | null>(null);

  useEffect(() => {
    const getUserRole = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data: profile } = await supabase
                .from('user_profiles')
                .select('role')
                .eq('user_id', user.id)
                .single();
            if (profile) setUserRole(profile.role);
        }
    };
    getUserRole();
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.id) return;
        const { data: emp } = await supabase
          .from('employees')
          .select('department, area_of_expertise, areas, is_active')
          .eq('user_id', user.id)
          .maybeSingle();

        const labels: string[] = [];
        if (emp?.department) labels.push(String(emp.department));
        if ((emp as any)?.area_of_expertise) labels.push(String((emp as any).area_of_expertise));
        if (Array.isArray((emp as any)?.areas)) labels.push(...((emp as any).areas as any[]).map((x) => String(x)));

        const keys = Array.from(
          new Set(
            labels
              .map((l) => inferAreaKeyFromLabel(l))
              .filter(Boolean)
              .map((k) => k as AreaKey)
          )
        );

        const href = keys.includes('social_media')
          ? '/app/social-media/upload'
          : keys.includes('head_marketing')
            ? '/app/head-marketing/upload'
            : null;

        if (!mounted) return;
        setAreaKeys(keys);
        setUploadHref(href);
      } catch {
        // ignore
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const computedNavItems = (() => {
    // Admin/Super Admin sempre vê; Social/Head vê via áreas
    const canSeeUpload = userRole === 'admin' || userRole === 'super_admin' || !!uploadHref;
    if (!canSeeUpload) return appNavItems;

    const href = uploadHref || '/app/social-media/upload';
    // inserir perto de Solicitações
    const base = [...appNavItems];
    const insertAt = Math.max(0, base.findIndex((x) => x.href === '/app/solicitacoes') + 1);
    base.splice(insertAt, 0, { href, label: 'Agendar Postagem', icon: Upload });
    base.splice(insertAt + 1, 0, { href: '/app/social-media/gestao', label: 'Gestão de Posts', icon: Calendar });
    return base;
  })();

  return (
    <aside className="w-64 bg-gradient-to-b from-valle-navy-900 to-valle-navy-950 border-r border-valle-navy-800 min-h-screen flex flex-col">
      <div className="p-6 border-b border-valle-navy-800">
        <Link href="/app/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-lg shadow-lg flex items-center justify-center p-1">
            <Image
              src="/icons/ICON (1).png"
              alt="Valle 360"
              width={32}
              height={32}
              className="object-contain"
            />
          </div>
          <span className="text-xl font-bold text-white">Valle 360</span>
        </Link>
      </div>

      <nav className="p-4 space-y-2 flex-1">
        {computedNavItems.map((item) => {
          // Hide Financeiro if not admin/finance
          if (item.href === '/app/financeiro' && userRole && !['admin', 'financeiro', 'super_admin'].includes(userRole)) {
            return null;
          }

          const Icon = item.icon;
          const isActive = pathname === item.href;
          const isAi = (item as any).isAi;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-all relative group',
                isActive
                  ? 'bg-gradient-to-r from-valle-blue-600 to-valle-blue-700 text-white shadow-lg'
                  : 'text-valle-silver-300 hover:text-white hover:bg-valle-navy-800',
                isAi && !isActive && 'text-purple-300 hover:text-purple-100 hover:bg-purple-900/20'
              )}
            >
              <Icon className={cn("w-5 h-5", isAi && "text-purple-400")} />
              <span className={cn("font-medium", isAi && "bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text text-transparent font-bold")}>
                {item.label}
              </span>
              
              {isAi && (
                <span className="absolute right-2 top-1/2 -translate-y-1/2 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      
      {/* User Profile Mini (Optional Footer) */}
      <div className="p-4 border-t border-valle-navy-800">
        <div className="text-xs text-valle-silver-500 text-center">
            v1.2.0 • Valle 360
        </div>
      </div>
    </aside>
  );
}

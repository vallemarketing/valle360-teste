'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard,
  KanbanSquare,
  Calendar,
  MessageSquare,
  FolderOpen,
  Users,
  TrendingUp,
  Award,
  Settings,
  HelpCircle,
  LogOut,
  FileText,
  Upload,
  Sparkles,
  Briefcase,
  CreditCard,
  ShieldCheck,
  Bot,
  Bell
} from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { inferAreaKeyFromLabel, type AreaKey } from '@/lib/kanban/areaBoards';
import { cn } from '@/lib/utils';
import Image from 'next/image';

type NavItem = { id: string; name: string; icon: any; href: string };
type NavGroup = { id: string; label: string; items: NavItem[] };

function hasAny(keys: AreaKey[], wanted: AreaKey[]) {
  return wanted.some((w) => keys.includes(w));
}

export function ColaboradorSidebar(props?: { variant?: 'fixed' | 'sheet' }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [areaKeys, setAreaKeys] = useState<AreaKey[]>([]);
  const variant = props?.variant || 'fixed';

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        const userId = data.user?.id;
        if (!userId) return;

        const { data: emp } = await supabase
          .from('employees')
          .select('department, area_of_expertise, areas, is_active')
          .eq('user_id', userId)
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

        if (mounted) setAreaKeys(keys);
      } catch {
        // se falhar, não mostra item
      }
    })();
    return () => {
      mounted = false;
    };
  }, [supabase]);

  const uploadHref = useMemo(() => {
    if (areaKeys.includes('social_media')) return '/colaborador/social-media/upload';
    if (areaKeys.includes('head_marketing')) return '/colaborador/head-marketing/upload';
    return null;
  }, [areaKeys]);

  const navGroups: NavGroup[] = useMemo(() => {
    const groups: NavGroup[] = [];

    groups.push({
      id: 'principal',
      label: 'Principal',
      items: [
        { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard, href: '/colaborador/dashboard' },
        { id: 'kanban', name: 'Kanban', icon: KanbanSquare, href: '/colaborador/kanban' },
        { id: 'agenda', name: 'Agenda', icon: Calendar, href: '/colaborador/agenda' },
        { id: 'mensagens', name: 'Mensagens', icon: MessageSquare, href: '/colaborador/mensagens' },
        { id: 'arquivos', name: 'Arquivos', icon: FolderOpen, href: '/colaborador/arquivos' },
      ],
    });

    // Áreas (apenas as do colaborador)
    const areaItems: NavItem[] = [];
    if (areaKeys.includes('social_media')) areaItems.push({ id: 'area-social', name: 'Social Media', icon: Sparkles, href: '/colaborador/social-media' });
    if (areaKeys.includes('head_marketing')) areaItems.push({ id: 'area-head', name: 'Head Marketing', icon: Briefcase, href: '/colaborador/head-marketing' });
    if (areaKeys.includes('designer_grafico')) areaItems.push({ id: 'area-designer', name: 'Designer', icon: Sparkles, href: '/colaborador/designer' });
    if (areaKeys.includes('trafego_pago')) areaItems.push({ id: 'area-trafego', name: 'Tráfego', icon: TrendingUp, href: '/colaborador/trafego' });
    if (areaKeys.includes('video_maker')) areaItems.push({ id: 'area-video', name: 'Vídeo Maker', icon: Sparkles, href: '/colaborador/video-maker' });
    if (areaKeys.includes('webdesigner')) areaItems.push({ id: 'area-web', name: 'Web Designer', icon: LayoutDashboard, href: '/colaborador/web-designer' });
    if (areaKeys.includes('comercial')) areaItems.push({ id: 'area-comercial', name: 'Comercial', icon: Briefcase, href: '/colaborador/comercial' });
    if (hasAny(areaKeys, ['financeiro_pagar', 'financeiro_receber'])) {
      areaItems.push({ id: 'area-fin', name: 'Financeiro', icon: CreditCard, href: '/colaborador/financeiro/contas-receber' });
    }
    if (areaKeys.includes('rh')) areaItems.push({ id: 'area-rh', name: 'RH', icon: ShieldCheck, href: '/colaborador/rh' });

    if (areaItems.length) {
      groups.push({ id: 'areas', label: 'Áreas', items: areaItems });
    }

    // Social: Post Center só para Social/Head
    if (uploadHref) {
      groups.push({
        id: 'social',
        label: 'Social',
        items: [
          { id: 'agendar', name: 'Agendar Postagem', icon: Upload, href: uploadHref },
          { id: 'gestao-posts', name: 'Gestão de Posts', icon: Calendar, href: '/colaborador/social-media/gestao' },
        ],
      });
    }

    groups.push({
      id: 'gestao',
      label: 'Gestão',
      items: [{ id: 'clientes', name: 'Clientes', icon: Users, href: '/colaborador/clientes' }],
    });

    groups.push({
      id: 'performance',
      label: 'Performance',
      items: [
        { id: 'desempenho', name: 'Desempenho', icon: TrendingUp, href: '/colaborador/desempenho' },
        { id: 'metas', name: 'Metas', icon: Award, href: '/colaborador/metas' },
        { id: 'gamificacao', name: 'Gamificação', icon: Award, href: '/colaborador/gamificacao' },
      ],
    });

    groups.push({
      id: 'ia',
      label: 'IA',
      items: [
        { id: 'ia', name: 'Assistente IA', icon: Bot, href: '/colaborador/ia' },
        { id: 'val', name: 'Val', icon: Sparkles, href: '/colaborador/val' },
      ],
    });

    groups.push({
      id: 'solicitacoes',
      label: 'Solicitações',
      items: [{ id: 'solicitacoes', name: 'Solicitações', icon: FileText, href: '/colaborador/solicitacoes' }],
    });

    groups.push({
      id: 'sistema',
      label: 'Sistema',
      items: [
        { id: 'notificacoes', name: 'Notificações', icon: Bell, href: '/colaborador/notificacoes' },
        { id: 'config', name: 'Configurações', icon: Settings, href: '/colaborador/configuracoes' },
        { id: 'suporte', name: 'Suporte', icon: HelpCircle, href: '/colaborador/suporte' },
      ],
    });

    return groups;
  }, [areaKeys, uploadHref]);

  return (
    <aside
      className={cn(
        variant === 'fixed' ? 'fixed left-0 top-[73px] bottom-0' : 'relative h-full',
        'w-64 overflow-y-auto z-40 flex flex-col',
        'bg-[#001533] border-r border-white/10'
      )}
    >
      {/* Logo */}
      <div className="hidden lg:flex items-center justify-center py-5 border-b border-white/10">
        <Image src="/Logo/valle360-logo.png" alt="Valle 360" width={140} height={40} className="object-contain" />
      </div>

      <nav className="flex-1 py-5 px-3 space-y-5">
        {navGroups.map((group) => (
          <div key={group.id}>
            <p className="px-3 text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">{group.label}</p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      isActive ? 'bg-[#1672d6] text-white shadow-lg shadow-[#1672d6]/30' : 'text-white/75 hover:bg-white/10 hover:text-white'
                    )}
                  >
                    <Icon className={cn('h-5 w-5', isActive ? 'text-white' : 'text-white/70')} />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-300 hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="h-5 w-5 text-red-300" />
          Sair
        </button>
      </div>
    </aside>
  );
}

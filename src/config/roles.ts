import { RoleConfig, DashboardRole } from '@/types/dashboard';
import {
  Instagram,
  Video,
  Palette,
  Globe,
  TrendingUp,
  DollarSign,
  Users,
  BarChart3,
  Shield,
} from 'lucide-react';

export const ROLES_CONFIG: Record<DashboardRole, RoleConfig> = {
  social: {
    id: 'social',
    label: 'Social Media',
    icon: 'Instagram',
    color: '#E1306C',
    description: 'Gerenciamento de redes sociais, posts e engajamento',
    permissions: [
      'view_social_posts',
      'create_social_posts',
      'edit_social_posts',
      'delete_social_posts',
      'view_social_metrics',
    ],
  },
  video: {
    id: 'video',
    label: 'Videomaker',
    icon: 'Video',
    color: '#FF0000',
    description: 'Produção de vídeos, gravações e edições',
    permissions: [
      'view_video_projects',
      'create_video_projects',
      'edit_video_projects',
      'view_recording_requests',
      'approve_recording_requests',
    ],
  },
  design: {
    id: 'design',
    label: 'Designer Gráfico',
    icon: 'Palette',
    color: '#7B68EE',
    description: 'Criação de peças gráficas, briefings e aprovações',
    permissions: [
      'view_design_briefings',
      'create_design_briefings',
      'edit_design_briefings',
      'view_design_assets',
      'create_design_assets',
      'approve_design_assets',
    ],
  },
  web: {
    id: 'web',
    label: 'Web Designer',
    icon: 'Globe',
    color: '#4169E1',
    description: 'Desenvolvimento web, manutenção de sites e performance',
    permissions: [
      'view_web_projects',
      'create_web_projects',
      'edit_web_projects',
      'view_web_tickets',
      'create_web_tickets',
      'resolve_web_tickets',
      'view_web_metrics',
    ],
  },
  sales: {
    id: 'sales',
    label: 'Comercial',
    icon: 'TrendingUp',
    color: '#32CD32',
    description: 'Pipeline de vendas, leads e negociações',
    permissions: [
      'view_leads',
      'create_leads',
      'edit_leads',
      'view_deals',
      'create_deals',
      'edit_deals',
      'view_contracts',
      'create_contracts',
    ],
  },
  finance: {
    id: 'finance',
    label: 'Financeiro',
    icon: 'DollarSign',
    color: '#FFD700',
    description: 'Gestão financeira, cobranças e pagamentos',
    permissions: [
      'view_invoices',
      'create_invoices',
      'edit_invoices',
      'view_payments',
      'register_payments',
      'send_billing_notifications',
    ],
  },
  hr: {
    id: 'hr',
    label: 'RH',
    icon: 'Users',
    color: '#FF6347',
    description: 'Recursos humanos, solicitações e performance da equipe',
    permissions: [
      'view_employees',
      'create_employees',
      'edit_employees',
      'view_requests',
      'approve_requests',
      'view_performance',
    ],
  },
  head_marketing: {
    id: 'head_marketing',
    label: 'Head de Marketing',
    icon: 'BarChart3',
    color: '#9370DB',
    description: 'Visão estratégica consolidada de todos os setores',
    permissions: [
      'view_all_dashboards',
      'view_strategic_metrics',
      'view_team_performance',
      'view_client_overview',
    ],
  },
  admin: {
    id: 'admin',
    label: 'Administrador',
    icon: 'Shield',
    color: '#1E90FF',
    description: 'Acesso completo a todas as funcionalidades',
    permissions: ['*'],
  },
};

export function getRoleConfig(role: DashboardRole): RoleConfig {
  return ROLES_CONFIG[role];
}

export function getUserRoles(userProfile: any): DashboardRole[] {
  // Mapear user_type existente para roles do dashboard
  const userType = userProfile?.user_type;

  const roleMapping: Record<string, DashboardRole[]> = {
    super_admin: ['head_marketing', 'admin', 'sales', 'social', 'video', 'design', 'web', 'finance', 'hr'],
    admin: ['head_marketing', 'admin', 'sales', 'social', 'video', 'design', 'web', 'finance', 'hr'],
    social_media: ['social'],
    videomaker: ['video'],
    designer: ['design'],
    web_designer: ['web'],
    comercial: ['sales'],
    financeiro: ['finance'],
    rh: ['hr'],
    head_marketing: ['head_marketing', 'sales', 'social', 'video', 'design', 'web'],
  };

  // Se não encontrar mapeamento, dar acesso a todas as views para demonstração
  return roleMapping[userType] || ['head_marketing', 'sales', 'social', 'video', 'design', 'web', 'finance', 'hr'];
}

export function hasPermission(role: DashboardRole, permission: string): boolean {
  const config = getRoleConfig(role);
  if (!config) return false;

  // Admin tem todas as permissões
  if (config.permissions.includes('*')) return true;

  return config.permissions.includes(permission);
}

export function getDefaultRole(roles: DashboardRole[]): DashboardRole {
  // Prioridade de roles padrão
  const priority: DashboardRole[] = ['head_marketing', 'admin', 'sales', 'social', 'finance'];

  for (const role of priority) {
    if (roles.includes(role)) return role;
  }

  return roles[0] || 'social';
}

// Persistência de role preferida
export function savePreferredRole(role: DashboardRole) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('preferred_dashboard_role', role);
  }
}

export function getPreferredRole(): DashboardRole | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('preferred_dashboard_role') as DashboardRole | null;
  }
  return null;
}

// Sistema de Permissões por Perfil - Valle 360
// Define o que cada tipo de usuário pode acessar

export type UserRole = 
  | 'super_admin'
  | 'admin'
  | 'head_marketing'
  | 'financeiro'
  | 'comercial'
  | 'rh'
  | 'trafego'
  | 'social_media'
  | 'designer'
  | 'web_designer'
  | 'video_maker'
  | 'employee';

export type Permission = 
  | 'dashboard'
  | 'kanban'
  | 'messages'
  | 'gamification'
  | 'approvals'
  | 'financial_dashboard'
  | 'commercial_dashboard'
  | 'rh_dashboard'
  | 'rh_tests'
  | 'rh_recruitment'
  | 'integrations'
  | 'intelligence_center'
  | 'social_scheduling'
  | 'nps_dashboard'
  | 'team_management'
  | 'client_portal'
  | 'val_ai'
  | 'reports'
  | 'settings';

// Mapeamento de permissões por perfil
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  super_admin: [
    'dashboard', 'kanban', 'messages', 'gamification', 'approvals',
    'financial_dashboard', 'commercial_dashboard', 'rh_dashboard',
    'rh_tests', 'rh_recruitment', 'integrations', 'intelligence_center',
    'social_scheduling', 'nps_dashboard', 'team_management', 'client_portal',
    'val_ai', 'reports', 'settings'
  ],
  admin: [
    'dashboard', 'kanban', 'messages', 'gamification', 'approvals',
    'financial_dashboard', 'commercial_dashboard', 'nps_dashboard',
    'team_management', 'val_ai', 'reports', 'settings'
  ],
  head_marketing: [
    'dashboard', 'kanban', 'messages', 'gamification', 'approvals',
    'team_management', 'val_ai', 'reports', 'nps_dashboard'
  ],
  financeiro: [
    'dashboard', 'messages', 'gamification', 'financial_dashboard',
    'val_ai', 'reports', 'nps_dashboard'
  ],
  comercial: [
    'dashboard', 'kanban', 'messages', 'gamification',
    'commercial_dashboard', 'val_ai', 'reports'
  ],
  rh: [
    'dashboard', 'messages', 'gamification', 'rh_dashboard',
    'rh_tests', 'rh_recruitment', 'val_ai', 'reports'
  ],
  trafego: [
    'dashboard', 'kanban', 'messages', 'gamification',
    'approvals', 'val_ai'
  ],
  social_media: [
    'dashboard', 'kanban', 'messages', 'gamification',
    'approvals', 'social_scheduling', 'val_ai'
  ],
  designer: [
    'dashboard', 'kanban', 'messages', 'gamification',
    'approvals', 'val_ai'
  ],
  web_designer: [
    'dashboard', 'kanban', 'messages', 'gamification',
    'approvals', 'val_ai'
  ],
  video_maker: [
    'dashboard', 'kanban', 'messages', 'gamification',
    'approvals', 'val_ai'
  ],
  employee: [
    'dashboard', 'kanban', 'messages', 'gamification', 'val_ai'
  ]
};

// Verificar se usuário tem permissão
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) || false;
}

// Verificar múltiplas permissões (AND)
export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every(p => hasPermission(role, p));
}

// Verificar múltiplas permissões (OR)
export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some(p => hasPermission(role, p));
}

// Obter todas as permissões de um perfil
export function getPermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

// Normalizar string de role para UserRole
export function normalizeRole(role: string): UserRole {
  const normalized = role.toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_');
  
  const roleMap: Record<string, UserRole> = {
    'super_admin': 'super_admin',
    'superadmin': 'super_admin',
    'admin': 'admin',
    'administrador': 'admin',
    'head_marketing': 'head_marketing',
    'head': 'head_marketing',
    'financeiro': 'financeiro',
    'finance': 'financeiro',
    'comercial': 'comercial',
    'commercial': 'comercial',
    'vendas': 'comercial',
    'sales': 'comercial',
    'rh': 'rh',
    'recursos_humanos': 'rh',
    'hr': 'rh',
    'trafego': 'trafego',
    'trafego_pago': 'trafego',
    'traffic': 'trafego',
    'gestor_de_trafego': 'trafego',
    'social_media': 'social_media',
    'social': 'social_media',
    'designer': 'designer',
    'designer_grafico': 'designer',
    'graphic_designer': 'designer',
    'web_designer': 'web_designer',
    'webdesigner': 'web_designer',
    'video_maker': 'video_maker',
    'videomaker': 'video_maker',
    'editor': 'video_maker',
    'employee': 'employee',
    'colaborador': 'employee'
  };

  return roleMap[normalized] || 'employee';
}

// Labels amigáveis para cada role
export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Administrador',
  admin: 'Administrador',
  head_marketing: 'Head de Marketing',
  financeiro: 'Financeiro',
  comercial: 'Comercial',
  rh: 'Recursos Humanos',
  trafego: 'Gestor de Tráfego',
  social_media: 'Social Media',
  designer: 'Designer Gráfico',
  web_designer: 'Web Designer',
  video_maker: 'Video Maker',
  employee: 'Colaborador'
};

// Cores por role (para badges, etc)
export const ROLE_COLORS: Record<UserRole, string> = {
  super_admin: '#0f1b35',
  admin: '#1a2d5a',
  head_marketing: '#3B82F6',
  financeiro: '#10B981',
  comercial: '#F59E0B',
  rh: '#8B5CF6',
  trafego: '#06B6D4',
  social_media: '#EC4899',
  designer: '#F472B6',
  web_designer: '#A855F7',
  video_maker: '#EF4444',
  employee: '#6B7280'
};










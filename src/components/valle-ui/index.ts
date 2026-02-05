// Valle UI Kit - Componentes Premium
// Cores: #001533 (navy), #1672d6 (primary), #ffffff (white)

// Stats Components
export { default as StatsCards, StatCard, StatsRow } from './StatsCards';
export type { StatCardProps } from './StatsCards';

export { StatsCard, StatsGrid } from './StatsCard';
export type { StatsCardProps, StatsGridProps } from './StatsCard';

// Display Cards (empilhados com hover)
export { DisplayCards, DisplayCard } from './DisplayCards';
export type { DisplayCardProps, DisplayCardsProps } from './DisplayCards';

// Feature Grid (grid de notícias/features)
export { default as FeatureGrid } from './FeatureGrid';
export type { NewsItem, FeatureGridProps } from './FeatureGrid';

// Orbital Timeline (projetos em órbita)
export { default as OrbitalTimeline } from './OrbitalTimeline';
export type { TimelineItem, OrbitalTimelineProps } from './OrbitalTimeline';

// Integrations Orbit (semicírculo integrações)
export { default as IntegrationsOrbit } from './IntegrationsOrbit';
export type { Integration, IntegrationsOrbitProps } from './IntegrationsOrbit';

// Notícias Internas
export { default as NoticiasInternas } from './NoticiasInternas';
export type { Noticia, NoticiasInternasProps } from './NoticiasInternas';

// Financeiro Section
export { default as FinanceiroSection } from './FinanceiroSection';
export type { Conta, FinanceiroSectionProps } from './FinanceiroSection';

// Insights Panel (painel expandível)
export { InsightsPanel } from './InsightsPanel';
export type { InsightsPanelProps, InsightItem } from './InsightsPanel';

// Quick Access (atalhos rápidos)
export { QuickAccess, QuickAccessCompact } from './QuickAccess';
export type { QuickAccessItem, QuickAccessProps, QuickAccessCompactProps } from './QuickAccess';

// Welcome Header (cabeçalho de boas-vindas)
export { WelcomeHeader, PageHeader } from './WelcomeHeader';
export type { WelcomeHeaderProps, PageHeaderProps } from './WelcomeHeader';

// Activity Cards (reuniões e atividades)
export { NextMeeting, RecentActivities, SupportCard } from './ActivityCards';
export type { NextMeetingProps, Activity, RecentActivitiesProps, SupportCardProps } from './ActivityCards';

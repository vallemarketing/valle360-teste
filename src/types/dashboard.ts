// Tipos para o sistema de Dashboard Corporativo

export type DashboardRole =
  | 'social'
  | 'video'
  | 'design'
  | 'web'
  | 'sales'
  | 'finance'
  | 'hr'
  | 'head_marketing'
  | 'admin';

export interface RoleConfig {
  id: DashboardRole;
  label: string;
  icon: string;
  color: string;
  description: string;
  permissions: string[];
}

export interface Client {
  id: string;
  name: string;
  brand?: string;
  industry?: string;
  owner_id?: string;
  status: 'active' | 'inactive' | 'prospect';
  created_at: string;
  updated_at: string;
}

// Social Media
export interface SocialPost {
  id: string;
  client_id?: string;
  channel: 'instagram' | 'facebook' | 'tiktok' | 'youtube' | 'linkedin' | 'twitter';
  title: string;
  content?: string;
  status: 'draft' | 'scheduled' | 'published' | 'delayed' | 'canceled';
  scheduled_at?: string;
  published_at?: string;
  owner_id: string;
  asset_file_id?: string;
  hashtags?: string[];
  created_at: string;
  updated_at: string;
}

export interface SocialMetrics {
  id: string;
  post_id: string;
  impressions: number;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  clicks: number;
  collected_at: string;
}

// Videomaker
export interface VideoProject {
  id: string;
  client_id?: string;
  title: string;
  description?: string;
  stage: 'pre' | 'recording' | 'editing' | 'review' | 'delivered';
  due_date?: string;
  owner_id: string;
  budget?: number;
  location?: string;
  created_at: string;
  updated_at: string;
}

export interface RecordingRequest {
  id: string;
  requester_id: string;
  client_id?: string;
  title: string;
  location?: string;
  date: string;
  time?: string;
  status: 'new' | 'approved' | 'scheduled' | 'done' | 'canceled';
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Designer Gráfico
export interface DesignBriefing {
  id: string;
  client_id?: string;
  requester_id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'new' | 'in_design' | 'review' | 'approved' | 'archived';
  due_date?: string;
  created_at: string;
  updated_at: string;
}

export interface DesignAsset {
  id: string;
  briefing_id?: string;
  title: string;
  storage_file_id?: string;
  tags?: string[];
  status: 'wip' | 'approved' | 'rejected';
  owner_id: string;
  created_at: string;
  updated_at: string;
}

// Web Designer
export interface WebProject {
  id: string;
  client_id?: string;
  title: string;
  site_url?: string;
  repo_url?: string;
  status: 'planning' | 'building' | 'testing' | 'deployed' | 'maintenance';
  owner_id: string;
  last_deploy_at?: string;
  created_at: string;
  updated_at: string;
}

export interface WebTicket {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  type: 'bug' | 'task' | 'improvement' | 'feature';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'paused' | 'done' | 'canceled';
  sla_due_at?: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
}

export interface WebMetrics {
  id: string;
  project_id: string;
  collected_at: string;
  lighthouse_perf?: number;
  lighthouse_seo?: number;
  lighthouse_a11y?: number;
  core_vitals_json?: any;
}

// Comercial
export interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  source?: string;
  owner_id: string;
  status: 'new' | 'qualified' | 'nurture' | 'lost';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Deal {
  id: string;
  lead_id?: string;
  title: string;
  value: number;
  currency: string;
  stage: 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';
  close_date?: string;
  owner_id: string;
  probability?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Contract {
  id: string;
  client_id: string;
  title: string;
  start_date: string;
  end_date?: string;
  value: number;
  currency: string;
  status: 'active' | 'pending_renewal' | 'canceled' | 'renewed';
  auto_renew: boolean;
  created_at: string;
  updated_at: string;
}

// Financeiro
export interface Invoice {
  id: string;
  client_id: string;
  number: string;
  issue_date: string;
  due_date: string;
  value: number;
  currency: string;
  status: 'open' | 'partial' | 'paid' | 'overdue' | 'canceled';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  invoice_id: string;
  method: 'credit_card' | 'debit_card' | 'bank_transfer' | 'pix' | 'boleto' | 'cash';
  paid_at: string;
  amount: number;
  tx_id?: string;
  notes?: string;
  created_at: string;
}

export interface BillingNotification {
  id: string;
  client_id: string;
  invoice_id?: string;
  type: 'reminder' | 'overdue' | 'receipt' | 'statement';
  sent_at: string;
  channel: 'email' | 'sms' | 'whatsapp' | 'push';
  content?: string;
  created_at: string;
}

// Período de filtros
export type PeriodFilter = 'today' | '7d' | '30d' | '90d' | 'custom';

export interface DateRange {
  start: Date;
  end: Date;
}

// KPIs Gerais
export interface DashboardKPI {
  label: string;
  value: number | string;
  change?: number;
  trend?: 'up' | 'down' | 'stable';
  format?: 'number' | 'currency' | 'percentage';
}

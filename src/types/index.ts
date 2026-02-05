// ============================================
// TYPES CENTRALIZADOS - VALLE 360
// ============================================

export type UserRole =
  | 'super_admin'
  | 'client'
  | 'video_maker'
  | 'web_designer'
  | 'graphic_designer'
  | 'social_media'
  | 'traffic_manager'
  | 'marketing_head'
  | 'financial'
  | 'hr'
  | 'commercial';

export type RequestType = 'reimbursement' | 'home_office' | 'day_off';
export type RequestStatus = 'pending' | 'approved' | 'rejected';
export type ProductionStatus = 'pending_approval' | 'approved' | 'rejected' | 'in_revision';
export type ContractStatus = 'active' | 'pending' | 'suspended' | 'cancelled' | 'expired';
export type PerformanceLevel = 'excellent' | 'good' | 'average' | 'needs_improvement' | 'critical';
export type Theme = 'light' | 'dark' | 'system';

// ============================================
// USER PROFILES
// ============================================

export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  display_name?: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  role: UserRole;
  is_active: boolean;
  client_id?: string;
  employee_id?: string;
  hire_date?: string;
  department?: string;
  position?: string;
  salary?: number;
  current_streak: number;
  total_goals_hit: number;
  total_goals_missed: number;
  warning_count: number;
  last_warning_date?: string;
  theme: string;
  language: string;
  timezone: string;
  email_notifications: boolean;
  whatsapp_notifications: boolean;
  push_notifications: boolean;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
}

// ============================================
// CLIENTS
// ============================================

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  company_name?: string;
  instagram?: string;
  facebook?: string;
  linkedin?: string;
  tiktok?: string;
  youtube?: string;
  website?: string;
  referred_by?: string;
  referral_count: number;
  is_active: boolean;
  account_manager?: string;
  created_by?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ClientContract {
  id: string;
  client_id: string;
  contract_number: string;
  contract_type: string;
  start_date: string;
  end_date?: string;
  renewal_date?: string;
  monthly_value?: number;
  total_value?: number;
  currency: string;
  status: ContractStatus;
  services_included: any[];
  departments: string[];
  pdf_url?: string;
  signed_pdf_url?: string;
  terms: Record<string, any>;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ClientMetrics {
  id: string;
  client_id: string;
  month: number;
  year: number;
  revenue: number;
  impressions: number;
  reach: number;
  engagement_rate: number;
  conversions: number;
  conversion_rate: number;
  ad_spend: number;
  roas: number;
  cpc: number;
  cpm: number;
  ctr: number;
  followers_gained: number;
  posts_published: number;
  stories_published: number;
  nps_score?: number;
  satisfaction_score?: number;
  growth_percentage?: number;
  metadata: Record<string, any>;
  created_at: string;
}

export interface ClientReferral {
  id: string;
  referrer_id: string;
  referred_id: string;
  status: 'pending' | 'active' | 'cancelled';
  benefit_granted: boolean;
  benefit_description?: string;
  created_at: string;
}

// ============================================
// SERVICES
// ============================================

export interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export interface Service {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string;
  icon?: string;
  image_url?: string;
  features: any[];
  base_price?: number;
  currency: string;
  is_featured: boolean;
  is_active: boolean;
  departments: string[];
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// ============================================
// PRODUCTION
// ============================================

export interface ProductionItem {
  id: string;
  client_id: string;
  title: string;
  description?: string;
  item_type: string;
  file_url?: string;
  preview_url?: string;
  status: ProductionStatus;
  created_by?: string;
  assigned_to?: string;
  due_date?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ProductionApproval {
  id: string;
  production_item_id: string;
  approved: boolean;
  approved_by?: string;
  approved_at: string;
  comments?: string;
  revision_notes?: string;
  metadata: Record<string, any>;
}

// ============================================
// KANBAN
// ============================================

export interface KanbanBoard {
  id: string;
  name: string;
  description?: string;
  department: string;
  is_public: boolean;
  allowed_roles: string[];
  settings: Record<string, any>;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface KanbanColumn {
  id: string;
  board_id: string;
  name: string;
  description?: string;
  position: number;
  color: string;
  wip_limit?: number;
  created_at: string;
  updated_at: string;
}

export interface KanbanLabel {
  id: string;
  board_id: string;
  name: string;
  color: string;
  created_by?: string;
  created_at: string;
}

export interface KanbanCard {
  id: string;
  column_id: string;
  board_id: string;
  title: string;
  description?: string;
  position: number;
  assigned_to: string[];
  created_by?: string;
  client_id?: string;
  due_date?: string;
  label_ids: string[];
  checklist: any[];
  attachments: any[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// ============================================
// CALENDAR
// ============================================

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  event_type: 'company' | 'client_meeting' | 'internal_meeting' | 'recording' | 'deadline' | 'other';
  start_datetime: string;
  end_datetime: string;
  all_day: boolean;
  location?: string;
  meeting_link?: string;
  organizer_id?: string;
  participants: string[];
  client_id?: string;
  status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed';
  reminder_minutes: number[];
  is_recurring: boolean;
  recurrence_rule?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface MeetingRequest {
  id: string;
  requester_id?: string;
  target_id?: string;
  title: string;
  description?: string;
  meeting_type: string;
  proposed_dates: string[];
  status: 'pending' | 'accepted' | 'rejected' | 'rescheduled';
  selected_date?: string;
  rejection_reason?: string;
  counter_proposal_dates?: string[];
  calendar_event_id?: string;
  created_at: string;
  responded_at?: string;
}

// ============================================
// MESSAGES
// ============================================

export interface Conversation {
  id: string;
  conversation_type: 'direct' | 'group' | 'client';
  name?: string;
  avatar_url?: string;
  client_id?: string;
  is_active: boolean;
  last_message_at?: string;
  last_message_preview?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ConversationParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  role: 'admin' | 'member';
  is_active: boolean;
  last_read_at: string;
  unread_count: number;
  muted: boolean;
  joined_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'file' | 'image' | 'video' | 'audio' | 'system';
  attachments: any[];
  reply_to?: string;
  is_edited: boolean;
  edited_at?: string;
  read_by: string[];
  metadata: Record<string, any>;
  created_at: string;
}

// ============================================
// PERFORMANCE
// ============================================

export interface EmployeeGoal {
  id: string;
  user_id: string;
  month: number;
  year: number;
  goals: Record<string, any>;
  achieved_goals: Record<string, any>;
  goal_hit: boolean;
  notes?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface EmployeePerformance {
  id: string;
  user_id: string;
  month: number;
  year: number;
  total_deliveries: number;
  on_time_deliveries: number;
  late_deliveries: number;
  pending_tasks: number;
  average_nps?: number;
  client_complaints: number;
  days_home_office: number;
  days_off: number;
  performance_level?: PerformanceLevel;
  ranking_position?: number;
  ranking_score?: number;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface NPSRating {
  id: string;
  client_id: string;
  employee_id: string;
  score: number;
  category: 'promoter' | 'passive' | 'detractor';
  feedback?: string;
  related_to?: string;
  created_at: string;
}

// ============================================
// REQUESTS
// ============================================

export interface EmployeeRequest {
  id: string;
  user_id: string;
  request_type: RequestType;
  title: string;
  description: string;
  start_date: string;
  end_date?: string;
  amount?: number;
  receipt_url?: string;
  status: RequestStatus;
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// ============================================
// FINANCIAL
// ============================================

export interface FinancialTransaction {
  id: string;
  client_id: string;
  transaction_type: 'payment' | 'refund' | 'adjustment' | 'credit';
  amount: number;
  currency: string;
  description: string;
  reference_number?: string;
  due_date?: string;
  paid_at?: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  payment_method?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// ============================================
// AI
// ============================================

export interface AIRecommendation {
  id: string;
  target_type: 'client' | 'employee' | 'service' | 'general';
  target_id?: string;
  recommendation_type: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  action_url?: string;
  action_label?: string;
  is_active: boolean;
  is_dismissed: boolean;
  dismissed_at?: string;
  metadata: Record<string, any>;
  created_at: string;
  expires_at?: string;
}

export interface AIConversation {
  id: string;
  user_id: string;
  conversation_history: any[];
  context_type?: string;
  last_message_at: string;
  is_active: boolean;
  created_at: string;
}

// ============================================
// FILES
// ============================================

export type FileCategory = 'reference' | 'briefing' | 'brand' | 'content' | 'contract' | 'other';
export type UploadStatus = 'uploading' | 'completed' | 'failed';

export interface ClientFile {
  id: string;
  client_id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  file_extension: string;
  storage_path: string;
  storage_bucket: string;
  public_url?: string;
  category: FileCategory;
  tags: string[];
  description?: string;
  notes?: string;
  metadata: Record<string, any>;
  is_active: boolean;
  uploaded_by?: string;
  upload_status: UploadStatus;
  created_at: string;
  updated_at: string;
}

// ============================================
// CHARTS
// ============================================

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
  percentage?: number;
}

export interface MetricComparison {
  current: number;
  previous: number;
  change: number;
  changePercentage: number;
  trend: 'up' | 'down' | 'neutral';
}

// ============================================
// EXTENDED PROFILE SYSTEM
// ============================================

export interface ClientProfileExtended {
  id: string;
  user_id: string;
  cpf_cnpj?: string;
  birth_date?: string;
  company_name?: string;
  business_sector?: string;
  phone_commercial?: string;
  phone_mobile?: string;
  address_zip?: string;
  address_street?: string;
  address_number?: string;
  address_complement?: string;
  address_neighborhood?: string;
  address_city?: string;
  address_state?: string;
  social_instagram?: string;
  social_facebook?: string;
  social_linkedin?: string;
  social_youtube?: string;
  social_website?: string;
  additional_contacts: AdditionalContact[];
  documents: ClientDocument[];
  created_at: string;
  updated_at: string;
}

export interface AdditionalContact {
  name: string;
  position: string;
  email: string;
  phone: string;
}

export interface ClientDocument {
  type: 'rg' | 'cnh' | 'proof_of_address' | 'articles_of_incorporation' | 'other';
  name: string;
  url: string;
  uploaded_at: string;
}

export interface ClientContractDetailed {
  id: string;
  client_id: string;
  contract_number: string;
  plan_name: string;
  status: 'active' | 'inactive' | 'suspended';
  start_date: string;
  renewal_date: string;
  monthly_value: number;
  contract_file_url?: string;
  services_included: string[];
  version: number;
  is_current: boolean;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
}

export interface ClientRulesDocument {
  id: string;
  client_id: string;
  rules_file_url: string;
  version: number;
  is_current: boolean;
  accepted_at?: string;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
}

export interface ClientCredit {
  id: string;
  client_id: string;
  transaction_type: 'recharge' | 'usage';
  description: string;
  amount: number;
  balance_after: number;
  created_at: string;
}

export interface ClientBenefit {
  id: string;
  client_id: string;
  benefit_type: 'loyalty_discount' | 'referral_discount' | 'annual_payment_discount' | 'custom';
  benefit_name: string;
  benefit_value: number;
  is_active: boolean;
  referral_count: number;
  start_date: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  theme_mode: 'light' | 'dark' | 'auto';
  language: 'pt' | 'en' | 'es';
  font_size: 'small' | 'medium' | 'large';
  notifications_new_content: boolean;
  notifications_messages: boolean;
  notifications_reports: boolean;
  notifications_credits: boolean;
  notifications_system: boolean;
  email_frequency: 'daily' | 'weekly' | 'monthly' | 'never';
  created_at: string;
  updated_at: string;
}

// ============================================
// BEFORE/AFTER COMPARISON SYSTEM
// ============================================

export type ServiceType = 'redes_sociais' | 'comercial' | 'trafego_pago' | 'site';

export interface ContractService {
  id: string;
  client_id: string;
  service_type: ServiceType;
  is_active: boolean;
  start_date: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

export interface BeforeAfterMetric {
  id: string;
  client_id: string;
  service_type: ServiceType;
  metric_name: string;
  metric_label: string;
  before_value: number;
  after_value: number;
  measurement_date: string;
  improvement_percentage: number;
  unit: string;
  created_at: string;
  updated_at: string;
}

export interface ClientDashboardSettings {
  id: string;
  client_id: string;
  section_order: string[];
  hidden_sections: string[];
  created_at: string;
  updated_at: string;
}

export interface PaymentTransaction {
  id: string;
  client_id: string;
  invoice_id?: string;
  payment_method: 'pix' | 'credit_card' | 'boleto';
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  transaction_id?: string;
  payment_gateway?: 'mercadopago' | 'stripe';
  confirmation_code?: string;
  error_message?: string;
  paid_at?: string;
  created_at: string;
  updated_at: string;
}

// ============================================
// EMPLOYEE SYSTEM
// ============================================

export interface EmployeeArea {
  id: string;
  name: string;
  slug: string;
  color: string;
  icon: string;
  created_at: string;
}

export interface Employee {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone?: string;
  area_id: string;
  area?: EmployeeArea;
  photo_url?: string;
  position: string;
  hire_date: string;
  is_active: boolean;
  salary: number;
  pix_key?: string;
  bank_name?: string;
  bank_agency?: string;
  bank_account?: string;
  last_access?: string;
  created_at: string;
  updated_at: string;
}

export interface EmployeeClientAssignment {
  id: string;
  employee_id: string;
  client_profile_id: string;
  assigned_at: string;
  assigned_by?: string;
}

export interface EmployeeInvitation {
  id: string;
  email: string;
  invited_by: string;
  token: string;
  expires_at: string;
  used_at?: string;
  created_at: string;
}

// ============================================
// FINANCIAL SYSTEM
// ============================================

export interface ExpenseCategory {
  id: string;
  name: string;
  type: 'salaries' | 'suppliers' | 'taxes' | 'rent' | 'marketing' | 'operational' | 'other';
  created_at: string;
}

export interface AccountPayable {
  id: string;
  supplier_name: string;
  description: string;
  amount: number;
  due_date: string;
  category_id?: string;
  category?: ExpenseCategory;
  attachment_url?: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  payment_date?: string;
  payment_method?: string;
  payment_proof_url?: string;
  is_recurring: boolean;
  recurrence_frequency?: 'monthly' | 'quarterly' | 'yearly';
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface AccountReceivable {
  id: string;
  client_profile_id?: string;
  contract_id?: string;
  description: string;
  amount: number;
  due_date: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  payment_date?: string;
  payment_method?: string;
  payment_link?: string;
  is_recurring: boolean;
  recurrence_frequency?: 'monthly' | 'quarterly' | 'yearly';
  last_reminder_sent?: string;
  reminder_count: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ReimbursementRequest {
  id: string;
  employee_id: string;
  employee?: Employee;
  expense_type: 'transport' | 'food' | 'lodging' | 'materials' | 'other';
  amount: number;
  expense_date: string;
  description: string;
  attachments: any[];
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  approved_by?: string;
  approval_date?: string;
  rejection_reason?: string;
  payment_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PayrollBenefit {
  id: string;
  name: string;
  type: 'health_insurance' | 'meal_voucher' | 'transport_voucher' | 'home_office' | 'other';
  amount: number;
  is_taxable: boolean;
  created_at: string;
}

export interface EmployeeBenefit {
  id: string;
  employee_id: string;
  benefit_id: string;
  benefit?: PayrollBenefit;
  custom_amount?: number;
  is_active: boolean;
  created_at: string;
}

export interface PayrollRecord {
  id: string;
  employee_id: string;
  employee?: Employee;
  reference_month: string;
  gross_salary: number;
  inss_deduction: number;
  irrf_deduction: number;
  fgts: number;
  other_deductions: Record<string, number>;
  benefits: Record<string, number>;
  net_salary: number;
  payment_date?: string;
  payslip_url?: string;
  status: 'pending' | 'approved' | 'paid';
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface BankAccount {
  id: string;
  bank_name: string;
  account_number: string;
  agency: string;
  account_type: 'checking' | 'savings';
  current_balance: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BankTransaction {
  id: string;
  bank_account_id: string;
  transaction_date: string;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
  category_id?: string;
  is_reconciled: boolean;
  linked_type?: 'accounts_payable' | 'accounts_receivable' | 'payroll' | 'reimbursement';
  linked_id?: string;
  imported_at: string;
  created_at: string;
}

export interface TaxObligation {
  id: string;
  tax_name: string;
  tax_type: 'DAS' | 'DARF' | 'GPS' | 'GFIP' | 'ISS' | 'IRRF' | 'INSS' | 'PIS' | 'COFINS' | 'CSLL';
  reference_month: string;
  amount: number;
  due_date: string;
  payment_date?: string;
  document_url?: string;
  status: 'pending' | 'paid' | 'overdue';
  created_at: string;
  updated_at: string;
}

export interface CostCenter {
  id: string;
  client_profile_id: string;
  reference_month: string;
  team_cost: number;
  tools_cost: number;
  infrastructure_cost: number;
  other_costs: number;
  total_cost: number;
  revenue: number;
  profit: number;
  profit_margin: number;
  created_at: string;
  updated_at: string;
}

export interface FinancialAlert {
  id: string;
  alert_type: 'bill_due_soon' | 'bill_overdue' | 'low_balance' | 'negative_projected_balance' | 'client_overdue';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  related_type?: string;
  related_id?: string;
  is_read: boolean;
  sent_email: boolean;
  sent_whatsapp: boolean;
  created_at: string;
}

export interface PaymentReminder {
  id: string;
  accounts_receivable_id: string;
  reminder_type: '3_days_before' | 'due_date' | '3_days_after' | '7_days_after' | '15_days_after';
  sent_at: string;
  sent_via: 'email' | 'whatsapp' | 'both';
  status: 'sent' | 'failed';
}

# 📋 ESCOPO COMPLETO - VALLE 360 (Firebase Stack)

## 🎯 VISÃO GERAL

O **Valle 360** é uma plataforma completa de gestão de agência de marketing digital com **Firebase** como backend principal, incluindo:
- **Firebase Authentication** para login e controle de acesso
- **Firestore** como banco de dados NoSQL
- **Firebase Storage** para arquivos e mídia
- **Firebase Cloud Functions** para backend/API serverless
- **Firebase Realtime** para features em tempo real
- **Firebase Cloud Messaging** para notificações push
- Backend Python separado com **FastAPI + CrewAI** para IA e Machine Learning

---

## 🏗️ ARQUITETURA PROPOSTA

### Stack Tecnológica

#### Frontend
- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS 3**
- **Framer Motion** (animações)
- **Lucide React** (ícones)
- **Firebase SDK** (cliente)
- **React Query** (state management)

#### Backend/Database
- **Firebase Firestore** (banco NoSQL)
- **Firebase Authentication** (Auth com Custom Claims)
- **Firebase Storage** (arquivos/mídia)
- **Firebase Cloud Functions** (serverless APIs em Node.js)
- **Firebase Cloud Messaging** (push notifications)
- **Firebase Hosting** (deploy)

#### IA/ML Backend (Separado)
- **FastAPI** (Python)
- **CrewAI** (multi-agent system - 34 agentes)
- **OpenAI API** (GPT-4, embeddings, DALL-E)
- **Anthropic Claude**
- **Google Gemini**
- **Tavily** (busca web)
- **Perplexity**
- Sistema RAG com embeddings

#### Integrações Externas
- **N8N** (automação de workflows)
- **SendGrid/Resend** (email transacional)
- **WhatsApp Business Cloud API**
- **Stripe** (pagamentos)
- **Mercado Pago** (PIX)
- **Meta Graph API** (Instagram/Facebook)
- **LinkedIn API**
- **Google Calendar API**
- **Google Drive API**

---

## 📦 ESTRUTURA DE DADOS (FIRESTORE COLLECTIONS)

### 1. 🔐 AUTENTICAÇÃO E USUÁRIOS

#### Collection: `users`
```typescript
{
  id: string, // uid do Firebase Auth
  email: string,
  full_name: string,
  phone: string,
  avatar_url: string,
  role: 'super_admin' | 'client' | 'employee',
  user_type: 'super_admin' | 'client' | 'video_maker' | 'web_designer' | 'graphic_designer' | 'social_media' | 'traffic_manager' | 'marketing_head' | 'financial' | 'hr' | 'commercial' | 'ceo' | 'cfo' | 'cmo' | 'cto' | 'chro' | 'cco' | 'coo',
  is_active: boolean,
  client_id: string, // se for cliente
  employee_id: string, // se for colaborador
  created_at: timestamp,
  updated_at: timestamp,
  last_login_at: timestamp
}
```

#### Collection: `user_preferences`
```typescript
{
  user_id: string,
  theme_mode: 'light' | 'dark' | 'system',
  language: 'pt-BR' | 'en',
  font_size: 'small' | 'medium' | 'large',
  notifications: {
    email: boolean,
    push: boolean,
    whatsapp: boolean,
    in_app: boolean
  },
  email_frequency: 'immediate' | 'daily' | 'weekly',
  updated_at: timestamp
}
```

#### Collection: `user_sessions`
```typescript
{
  user_id: string,
  session_token: string,
  ip_address: string,
  user_agent: string,
  device_type: 'desktop' | 'mobile' | 'tablet',
  browser: string,
  os: string,
  country: string,
  city: string,
  is_active: boolean,
  started_at: timestamp,
  last_activity_at: timestamp,
  ended_at: timestamp
}
```

---

### 2. 👥 GESTÃO DE CLIENTES

#### Collection: `clients`
```typescript
{
  id: string,
  name: string,
  email: string,
  phone: string,
  company_name: string,
  business_sector: string,
  social_media: {
    instagram: string,
    facebook: string,
    linkedin: string,
    tiktok: string,
    youtube: string,
    twitter: string,
    website: string
  },
  referred_by: string, // client_id
  referral_count: number,
  is_active: boolean,
  account_manager: string, // user_id
  created_by: string,
  metadata: object,
  created_at: timestamp,
  updated_at: timestamp
}
```

#### Subcollection: `clients/{clientId}/profile_extended`
```typescript
{
  cpf_cnpj: string,
  birth_date: timestamp,
  address: {
    street: string,
    number: string,
    complement: string,
    neighborhood: string,
    city: string,
    state: string,
    zip_code: string,
    country: string
  },
  phone_commercial: string,
  phone_mobile: string,
  additional_contacts: array<{
    name: string,
    email: string,
    phone: string,
    role: string
  }>,
  documents: array<{
    type: string,
    url: string,
    uploaded_at: timestamp
  }>
}
```

#### Subcollection: `clients/{clientId}/contracts`
```typescript
{
  id: string,
  contract_number: string,
  contract_type: string,
  start_date: timestamp,
  end_date: timestamp,
  renewal_date: timestamp,
  monthly_value: number,
  total_value: number,
  currency: 'BRL' | 'USD',
  status: 'active' | 'expired' | 'cancelled' | 'pending',
  services_included: array<string>,
  departments: array<string>,
  pdf_url: string,
  signed_pdf_url: string,
  terms: object,
  version: number,
  is_current: boolean,
  uploaded_by: string,
  created_at: timestamp,
  updated_at: timestamp
}
```

#### Subcollection: `clients/{clientId}/referrals`
```typescript
{
  referrer_id: string,
  referred_id: string,
  status: 'pending' | 'converted' | 'cancelled',
  benefit_granted: boolean,
  benefit_description: string,
  created_at: timestamp
}
```

---

### 3. 💳 SISTEMA FINANCEIRO

#### Subcollection: `clients/{clientId}/credit_balance`
```typescript
{
  current_balance: number,
  total_purchased: number,
  total_used: number,
  last_transaction_at: timestamp
}
```

#### Subcollection: `clients/{clientId}/credit_transactions`
```typescript
{
  id: string,
  transaction_type: 'recharge' | 'usage' | 'adjustment' | 'refund',
  description: string,
  amount: number,
  balance_before: number,
  balance_after: number,
  reference_type: string,
  reference_id: string,
  created_by: string,
  created_at: timestamp
}
```

#### Collection: `invoices`
```typescript
{
  id: string,
  client_id: string,
  invoice_number: string,
  issue_date: timestamp,
  due_date: timestamp,
  value: number,
  currency: 'BRL' | 'USD',
  status: 'open' | 'partial' | 'paid' | 'overdue' | 'cancelled',
  pdf_url: string,
  notes: string,
  paid_at: timestamp,
  created_at: timestamp,
  updated_at: timestamp
}
```

#### Subcollection: `invoices/{invoiceId}/payments`
```typescript
{
  id: string,
  invoice_id: string,
  client_id: string,
  payment_method: 'credit_card' | 'debit_card' | 'bank_transfer' | 'pix' | 'boleto' | 'cash',
  amount: number,
  payment_gateway: 'mercadopago' | 'stripe' | 'manual',
  transaction_id: string,
  confirmation_code: string,
  status: 'pending' | 'completed' | 'failed' | 'refunded',
  error_message: string,
  receipt_url: string,
  paid_at: timestamp,
  created_at: timestamp
}
```

#### Subcollection: `invoices/{invoiceId}/payment_reminders`
```typescript
{
  id: string,
  reminder_type: 'first' | 'second' | 'final' | 'overdue',
  sent_via: 'email' | 'whatsapp' | 'both',
  status: 'scheduled' | 'sent' | 'failed',
  sent_at: timestamp
}
```

#### Subcollection: `clients/{clientId}/benefits`
```typescript
{
  id: string,
  benefit_type: 'loyalty_discount' | 'referral_discount' | 'annual_payment_discount' | 'custom',
  benefit_name: string,
  benefit_value: number,
  is_active: boolean,
  referral_count: number,
  start_date: timestamp,
  end_date: timestamp,
  created_at: timestamp
}
```

---

### 4. 📋 SISTEMA KANBAN

#### Collection: `kanban_boards`
```typescript
{
  id: string,
  name: string,
  description: string,
  client_id: string,
  department: string,
  is_active: boolean,
  created_by: string,
  created_at: timestamp,
  updated_at: timestamp
}
```

#### Subcollection: `kanban_boards/{boardId}/columns`
```typescript
{
  id: string,
  name: string,
  position: number,
  color: string,
  wip_limit: number,
  created_at: timestamp
}
```

#### Subcollection: `kanban_boards/{boardId}/tasks`
```typescript
{
  id: string,
  column_id: string,
  title: string,
  description: string,
  position: number,
  priority: 'urgent' | 'high' | 'normal' | 'low',
  status: string,
  due_date: timestamp,
  estimated_hours: number,
  actual_hours: number,
  assigned_to: array<string>, // user_ids
  created_by: string,
  tags: array<string>,
  attachments: array<{
    url: string,
    name: string,
    type: string,
    size: number
  }>,
  checklist: array<{
    text: string,
    completed: boolean
  }>,
  created_at: timestamp,
  updated_at: timestamp
}
```

#### Subcollection: `kanban_boards/{boardId}/tasks/{taskId}/comments`
```typescript
{
  id: string,
  user_id: string,
  comment: string,
  created_at: timestamp,
  updated_at: timestamp
}
```

---

### 5. 💬 SISTEMA DE MENSAGENS

#### Collection: `conversations`
```typescript
{
  id: string,
  type: 'direct' | 'group',
  name: string, // para grupos
  description: string,
  avatar_url: string,
  participants: array<string>, // user_ids
  is_public: boolean,
  created_by: string,
  last_message: {
    text: string,
    sender_id: string,
    timestamp: timestamp
  },
  unread_count: map<user_id, number>,
  created_at: timestamp,
  updated_at: timestamp
}
```

#### Subcollection: `conversations/{conversationId}/messages`
```typescript
{
  id: string,
  sender_id: string,
  recipient_id: string, // para DM
  message_type: 'text' | 'image' | 'video' | 'file' | 'audio',
  content: string,
  attachments: array<{
    url: string,
    name: string,
    type: string,
    size: number
  }>,
  reply_to_message_id: string,
  reactions: map<user_id, string>, // emoji
  is_pinned: boolean,
  is_edited: boolean,
  is_deleted: boolean,
  created_at: timestamp,
  updated_at: timestamp
}
```

#### Subcollection: `conversations/{conversationId}/messages/{messageId}/read_receipts`
```typescript
{
  user_id: string,
  read_at: timestamp
}
```

---

### 6. 📅 CALENDÁRIO E AGENDA

#### Collection: `calendar_events`
```typescript
{
  id: string,
  title: string,
  description: string,
  start_date: timestamp,
  end_date: timestamp,
  all_day: boolean,
  location: string,
  meeting_link: string,
  organizer_id: string,
  client_id: string,
  event_type: 'meeting' | 'webinar' | 'internal' | 'client_meeting' | 'deadline',
  reminder_minutes: number,
  participants: array<{
    user_id: string,
    status: 'pending' | 'accepted' | 'declined'
  }>,
  created_at: timestamp,
  updated_at: timestamp
}
```

---

### 7. 🎨 PRODUÇÃO E APROVAÇÕES

#### Collection: `production_items`
```typescript
{
  id: string,
  client_id: string,
  title: string,
  description: string,
  type: 'post' | 'video' | 'banner' | 'design' | 'website' | 'other',
  status: 'pending_approval' | 'approved' | 'rejected' | 'in_revision',
  media_urls: array<string>,
  assigned_to: string,
  created_by: string,
  approved_by: string,
  approved_at: timestamp,
  rejection_reason: string,
  revision_count: number,
  created_at: timestamp,
  updated_at: timestamp
}
```

#### Subcollection: `production_items/{itemId}/versions`
```typescript
{
  id: string,
  version_number: number,
  media_urls: array<string>,
  caption: string,
  hashtags: array<string>,
  changes_summary: string,
  created_by: string,
  created_at: timestamp
}
```

#### Subcollection: `production_items/{itemId}/approval_workflow`
```typescript
{
  id: string,
  current_step: number,
  total_steps: number,
  workflow_config: object,
  status: 'pending' | 'in_progress' | 'completed' | 'rejected',
  steps: array<{
    step_number: number,
    step_name: string,
    approver_id: string,
    approver_role: string,
    status: 'pending' | 'approved' | 'rejected',
    comments: string,
    approved_at: timestamp
  }>,
  completed_at: timestamp
}
```

---

### 8. 📱 SOCIAL MEDIA

#### Collection: `social_platform_accounts`
```typescript
{
  id: string,
  client_id: string,
  platform: 'instagram' | 'facebook' | 'linkedin' | 'tiktok' | 'youtube' | 'twitter' | 'pinterest',
  account_username: string,
  account_name: string,
  account_id_external: string,
  access_token: string, // encrypted
  refresh_token: string, // encrypted
  token_expires_at: timestamp,
  is_connected: boolean,
  connection_status: string,
  permissions: array<string>,
  last_sync_at: timestamp,
  created_at: timestamp
}
```

#### Collection: `content_categories`
```typescript
{
  id: string,
  name: string,
  slug: string,
  color: string,
  icon: string,
  description: string,
  is_active: boolean,
  created_at: timestamp
}
```

#### Collection: `content_hashtag_groups`
```typescript
{
  id: string,
  name: string,
  hashtags: array<string>,
  category: string,
  performance_score: number,
  usage_count: number,
  is_active: boolean,
  created_by: string,
  created_at: timestamp
}
```

#### Collection: `content_templates`
```typescript
{
  id: string,
  name: string,
  category_id: string,
  template_text: string,
  variables: array<string>,
  platforms: array<string>,
  media_suggestions: object,
  hashtag_group_id: string,
  usage_count: number,
  is_active: boolean,
  created_by: string,
  created_at: timestamp
}
```

#### Collection: `content_calendar_posts`
```typescript
{
  id: string,
  client_id: string,
  title: string,
  category_id: string,
  template_id: string,
  post_type: 'feed' | 'story' | 'reel' | 'carousel' | 'video',
  platforms: array<string>,
  caption: string,
  media_urls: array<string>,
  hashtags: array<string>,
  mentions: array<string>,
  location_name: string,
  scheduled_date: timestamp,
  scheduled_time: string,
  scheduled_datetime: timestamp,
  status: 'draft' | 'scheduled' | 'published' | 'failed',
  approval_workflow_id: string,
  assigned_to: string,
  created_by: string,
  first_comment: string,
  alt_text: object,
  created_at: timestamp,
  updated_at: timestamp
}
```

#### Subcollection: `content_calendar_posts/{postId}/versions`
```typescript
{
  id: string,
  version_number: number,
  caption: string,
  media_urls: array<string>,
  hashtags: array<string>,
  changes_summary: string,
  created_by: string,
  created_at: timestamp
}
```

#### Subcollection: `content_calendar_posts/{postId}/performance`
```typescript
{
  platform: string,
  external_post_id: string,
  impressions: number,
  reach: number,
  likes: number,
  comments: number,
  shares: number,
  saves: number,
  engagement_total: number,
  engagement_rate: number,
  video_views: number,
  video_completion_rate: number,
  link_clicks: number,
  profile_visits: number,
  followers_gained: number,
  last_sync_at: timestamp
}
```

#### Collection: `publishing_queue`
```typescript
{
  id: string,
  post_id: string,
  platform: string,
  account_id: string,
  scheduled_for: timestamp,
  status: 'queued' | 'processing' | 'published' | 'failed',
  attempts: number,
  max_attempts: number,
  published_at: timestamp,
  external_post_id: string,
  external_post_url: string,
  error_message: string,
  created_at: timestamp
}
```

---

### 9. 📧 EMAIL MARKETING

#### Collection: `email_templates`
```typescript
{
  id: string,
  name: string,
  slug: string,
  category: 'newsletter' | 'promotional' | 'transactional' | 'automation',
  subject_template: string,
  html_template: string,
  text_template: string,
  variables: array<string>,
  from_name: string,
  from_email: string,
  reply_to: string,
  is_active: boolean,
  preview_text: string,
  created_by: string,
  created_at: timestamp,
  updated_at: timestamp
}
```

#### Collection: `email_campaigns`
```typescript
{
  id: string,
  name: string,
  slug: string,
  template_id: string,
  subject: string,
  preview_text: string,
  from_name: string,
  from_email: string,
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled',
  target_audience: object,
  segment_filters: object,
  scheduled_for: timestamp,
  total_recipients: number,
  emails_sent: number,
  emails_delivered: number,
  emails_opened: number,
  emails_clicked: number,
  open_rate: number,
  click_rate: number,
  created_by: string,
  sent_at: timestamp,
  created_at: timestamp
}
```

#### Collection: `email_queue`
```typescript
{
  id: string,
  template_id: string,
  campaign_id: string,
  to_email: string,
  to_name: string,
  cc_emails: array<string>,
  bcc_emails: array<string>,
  from_email: string,
  from_name: string,
  subject: string,
  html_body: string,
  text_body: string,
  variables: object,
  attachments: array<object>,
  priority: 'low' | 'normal' | 'high' | 'urgent',
  status: 'queued' | 'sending' | 'sent' | 'failed',
  scheduled_for: timestamp,
  attempts: number,
  max_attempts: number,
  sent_at: timestamp,
  error_message: string,
  created_at: timestamp
}
```

#### Collection: `email_logs`
```typescript
{
  id: string,
  email_queue_id: string,
  template_id: string,
  campaign_id: string,
  to_email: string,
  from_email: string,
  subject: string,
  status: 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'unsubscribed',
  provider: 'sendgrid' | 'resend',
  provider_message_id: string,
  delivered_at: timestamp,
  opened_at: timestamp,
  first_click_at: timestamp,
  open_count: number,
  click_count: number,
  bounce_type: string,
  bounce_reason: string,
  created_at: timestamp
}
```

#### Collection: `email_subscribers`
```typescript
{
  id: string,
  email: string,
  name: string,
  status: 'subscribed' | 'unsubscribed' | 'bounced',
  subscription_source: string,
  tags: array<string>,
  custom_fields: object,
  subscribed_at: timestamp,
  unsubscribed_at: timestamp,
  confirmed: boolean,
  confirmed_at: timestamp,
  bounce_count: number
}
```

---

### 10. 💬 WHATSAPP BUSINESS

#### Collection: `whatsapp_numbers`
```typescript
{
  id: string,
  phone_number: string,
  phone_number_id: string,
  display_name: string,
  business_account_id: string,
  access_token: string, // encrypted
  webhook_url: string,
  webhook_verify_token: string,
  status: 'active' | 'inactive' | 'pending',
  quality_rating: 'green' | 'yellow' | 'red',
  message_limit_tier: string,
  messaging_limit: number,
  last_sync_at: timestamp,
  created_at: timestamp
}
```

#### Collection: `whatsapp_conversations`
```typescript
{
  id: string,
  whatsapp_number_id: string,
  contact_phone: string,
  contact_name: string,
  client_id: string,
  user_profile_id: string,
  status: 'active' | 'pending' | 'closed',
  assigned_to: string,
  last_message_at: timestamp,
  last_message_preview: string,
  unread_count: number,
  tags: array<string>,
  created_at: timestamp,
  updated_at: timestamp
}
```

#### Subcollection: `whatsapp_conversations/{conversationId}/messages`
```typescript
{
  id: string,
  message_id_external: string,
  direction: 'inbound' | 'outbound',
  from_phone: string,
  to_phone: string,
  message_type: 'text' | 'image' | 'video' | 'audio' | 'document' | 'location' | 'interactive',
  content: string,
  media_url: string,
  template_name: string,
  location_data: object,
  interactive_data: object,
  reply_to_message_id: string,
  status: 'sent' | 'delivered' | 'read' | 'failed',
  sent_at: timestamp,
  delivered_at: timestamp,
  read_at: timestamp,
  created_by: string,
  created_at: timestamp
}
```

#### Collection: `whatsapp_templates`
```typescript
{
  id: string,
  whatsapp_number_id: string,
  name: string,
  language: string,
  category: 'marketing' | 'utility' | 'authentication',
  status: 'approved' | 'pending' | 'rejected',
  template_body: string,
  header_type: 'text' | 'image' | 'video' | 'document',
  header_content: string,
  footer_text: string,
  buttons: array<object>,
  variables: array<string>,
  usage_count: number,
  created_at: timestamp
}
```

#### Collection: `whatsapp_campaigns`
```typescript
{
  id: string,
  name: string,
  whatsapp_number_id: string,
  template_id: string,
  contact_list_id: string,
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled',
  scheduled_for: timestamp,
  total_recipients: number,
  messages_sent: number,
  messages_delivered: number,
  messages_read: number,
  delivery_rate: number,
  read_rate: number,
  created_by: string,
  sent_at: timestamp,
  created_at: timestamp
}
```

---

### 11. 🤖 INTELIGÊNCIA ARTIFICIAL

#### Collection: `ai_chat_history`
```typescript
{
  id: string,
  user_id: string,
  area: 'social' | 'design' | 'video' | 'ads' | 'general' | 'ceo' | 'cfo' | 'cmo',
  messages: array<{
    role: 'user' | 'assistant',
    content: string,
    timestamp: timestamp
  }>,
  model_used: 'gpt-4' | 'claude' | 'gemini',
  tokens_used: number,
  created_at: timestamp,
  updated_at: timestamp
}
```

#### Collection: `ai_predictions`
```typescript
{
  id: string,
  type: 'churn' | 'ltv' | 'revenue' | 'campaign_performance' | 'project_deadline' | 'hiring_needs',
  entity_type: 'client' | 'employee' | 'campaign' | 'project' | 'department',
  entity_id: string,
  prediction_value: number,
  confidence_score: number,
  risk_level: 'low' | 'medium' | 'high' | 'critical',
  contributing_factors: array<string>,
  recommended_actions: array<string>,
  prediction_date: timestamp,
  created_at: timestamp
}
```

#### Collection: `health_scores`
```typescript
{
  id: string,
  entity_type: 'client' | 'employee',
  entity_id: string,
  overall_score: number, // 0-100
  components: {
    engagement: number,
    satisfaction: number,
    usage: number,
    financial: number,
    productivity: number
  },
  trend: 'up' | 'down' | 'stable',
  last_score: number,
  score_change: number,
  calculated_at: timestamp
}
```

#### Collection: `ai_recommendations`
```typescript
{
  id: string,
  user_id: string,
  recommendation_type: 'service' | 'content' | 'action' | 'optimization',
  title: string,
  description: string,
  entity_type: string,
  entity_id: string,
  priority: 'low' | 'medium' | 'high' | 'urgent',
  status: 'pending' | 'accepted' | 'rejected' | 'completed',
  confidence_score: number,
  expected_impact: string,
  created_at: timestamp
}
```

---

### 12. 📊 ANALYTICS E MÉTRICAS

#### Collection: `client_metrics`
```typescript
{
  id: string,
  client_id: string,
  metric_type: 'social_media' | 'traffic' | 'sales' | 'engagement',
  metric_date: timestamp,
  platform: string,
  impressions: number,
  reach: number,
  engagement: number,
  clicks: number,
  conversions: number,
  cost: number,
  revenue: number,
  roi: number,
  metadata: object,
  created_at: timestamp
}
```

#### Collection: `before_valle_metrics`
```typescript
{
  id: string,
  client_id: string,
  metric_type: string,
  metric_date: timestamp,
  value: number,
  metadata: object,
  created_at: timestamp
}
```

#### Collection: `report_templates`
```typescript
{
  id: string,
  name: string,
  slug: string,
  description: string,
  report_type: 'client' | 'internal' | 'executive' | 'custom',
  data_sources: array<string>,
  sections: array<object>,
  visualizations: array<object>,
  filters: object,
  parameters: object,
  layout: object,
  is_public: boolean,
  created_by: string,
  created_at: timestamp
}
```

#### Collection: `custom_reports`
```typescript
{
  id: string,
  template_id: string,
  name: string,
  client_id: string,
  parameters: object,
  filters: object,
  date_range_start: timestamp,
  date_range_end: timestamp,
  status: 'generating' | 'ready' | 'failed',
  file_url: string,
  file_format: 'pdf' | 'excel' | 'csv',
  file_size_bytes: number,
  generated_at: timestamp,
  expires_at: timestamp,
  error_message: string,
  created_by: string,
  created_at: timestamp
}
```

#### Collection: `report_schedules`
```typescript
{
  id: string,
  template_id: string,
  name: string,
  frequency: 'daily' | 'weekly' | 'monthly',
  day_of_week: number,
  day_of_month: number,
  time_of_day: string,
  timezone: string,
  recipients: array<{
    email: string,
    name: string
  }>,
  parameters: object,
  filters: object,
  file_formats: array<string>,
  is_active: boolean,
  last_run_at: timestamp,
  next_run_at: timestamp,
  created_by: string,
  created_at: timestamp
}
```

---

### 13. 🏆 GAMIFICAÇÃO

#### Collection: `employee_gamification`
```typescript
{
  id: string,
  employee_id: string,
  total_points: number,
  level: number,
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond',
  current_streak: number,
  longest_streak: number,
  last_activity_date: timestamp,
  scores: {
    productivity: number,
    quality: number,
    collaboration: number,
    wellbeing: number
  },
  created_at: timestamp,
  updated_at: timestamp
}
```

#### Subcollection: `employee_gamification/{gamificationId}/achievements`
```typescript
{
  id: string,
  achievement_type: string,
  title: string,
  description: string,
  icon: string,
  points_awarded: number,
  earned_at: timestamp
}
```

#### Collection: `rewards_catalog`
```typescript
{
  id: string,
  name: string,
  description: string,
  category: 'monetary' | 'time_off' | 'gift' | 'experience' | 'training',
  points_cost: number,
  image_url: string,
  is_active: boolean,
  stock: number,
  created_at: timestamp
}
```

#### Collection: `reward_redemptions`
```typescript
{
  id: string,
  employee_id: string,
  reward_id: string,
  points_spent: number,
  status: 'pending' | 'approved' | 'delivered' | 'cancelled',
  delivery_info: object,
  redeemed_at: timestamp,
  delivered_at: timestamp
}
```

---

### 14. 👔 RH E COLABORADORES

#### Collection: `employees`
```typescript
{
  id: string,
  user_id: string,
  full_name: string,
  email: string,
  phone: string,
  avatar: string,
  department: 'design' | 'video' | 'social' | 'traffic' | 'commercial' | 'financial' | 'hr' | 'management',
  position: string,
  area_of_expertise: array<string>,
  hire_date: timestamp,
  birth_date: timestamp,
  emergency_contact: string,
  emergency_phone: string,
  pix_key: string,
  salary: number,
  is_active: boolean,
  created_at: timestamp,
  updated_at: timestamp
}
```

#### Collection: `employee_permissions`
```typescript
{
  id: string,
  employee_id: string,
  permission_key: string,
  can_view: boolean,
  can_create: boolean,
  can_edit: boolean,
  can_delete: boolean,
  can_approve: boolean,
  granted_at: timestamp
}
```

#### Collection: `employee_requests`
```typescript
{
  id: string,
  employee_id: string,
  request_type: 'reimbursement' | 'home_office' | 'day_off' | 'vacation' | 'other',
  start_date: timestamp,
  end_date: timestamp,
  description: string,
  amount: number,
  attachments: array<string>,
  status: 'pending' | 'approved' | 'rejected',
  approved_by: string,
  approved_at: timestamp,
  rejection_reason: string,
  created_at: timestamp
}
```

#### Collection: `employee_performance`
```typescript
{
  id: string,
  employee_id: string,
  period_start: timestamp,
  period_end: timestamp,
  overall_score: number,
  goals: array<{
    goal: string,
    weight: number,
    target: number,
    achieved: number,
    achievement_percentage: number
  }>,
  feedback: string,
  strengths: array<string>,
  areas_for_improvement: array<string>,
  evaluator_id: string,
  evaluated_at: timestamp
}
```

#### Collection: `wellbeing_checkins`
```typescript
{
  id: string,
  employee_id: string,
  checkin_date: timestamp,
  mood: 'very_bad' | 'bad' | 'neutral' | 'good' | 'excellent',
  mood_score: number, // 1-10
  energy_level: number, // 1-10
  motivation_level: number, // 1-10
  workload_perception: 'very_light' | 'light' | 'normal' | 'heavy' | 'overwhelming',
  job_satisfaction_score: number,
  feelings: string,
  challenges: string,
  wins: string,
  needs_help_with: string,
  created_at: timestamp
}
```

#### Collection: `employee_churn_predictions`
```typescript
{
  id: string,
  employee_id: string,
  churn_probability: number,
  risk_level: 'low' | 'medium' | 'high' | 'critical',
  contributing_factors: array<string>,
  recommended_actions: array<string>,
  prediction_date: timestamp,
  created_at: timestamp
}
```

---

### 15. 🔔 NOTIFICAÇÕES

#### Collection: `notifications`
```typescript
{
  id: string,
  user_id: string,
  type: 'task' | 'approval' | 'message' | 'payment' | 'alert' | 'celebration' | 'reminder',
  title: string,
  message: string,
  entity_type: string,
  entity_id: string,
  priority: 'low' | 'normal' | 'high' | 'urgent',
  is_read: boolean,
  read_at: timestamp,
  created_at: timestamp
}
```

#### Collection: `notification_tokens`
```typescript
{
  id: string,
  user_id: string,
  tokens: array<{
    token: string,
    device_type: 'web' | 'ios' | 'android',
    device_name: string,
    created_at: timestamp,
    last_used_at: timestamp
  }>,
  updated_at: timestamp
}
```

---

### 16. 📁 ARQUIVOS E STORAGE

#### Collection: `file_metadata`
```typescript
{
  id: string,
  uploaded_by: string,
  client_id: string,
  entity_type: string,
  entity_id: string,
  file_name: string,
  file_type: string,
  file_size: number,
  storage_path: string,
  public_url: string,
  is_public: boolean,
  mime_type: string,
  created_at: timestamp
}
```

---

### 17. 📝 LOGS E AUDITORIA

#### Collection: `audit_logs`
```typescript
{
  id: string,
  user_id: string,
  action: 'create' | 'read' | 'update' | 'delete',
  entity_type: string,
  entity_id: string,
  old_values: object,
  new_values: object,
  ip_address: string,
  user_agent: string,
  timestamp: timestamp
}
```

#### Collection: `activity_logs`
```typescript
{
  id: string,
  user_id: string,
  action: string,
  entity_type: string,
  entity_id: string,
  details: object,
  ip_address: string,
  created_at: timestamp
}
```

---

### 18. ⚙️ CONFIGURAÇÕES DO SISTEMA

#### Collection: `system_settings`
```typescript
{
  id: string,
  key: string,
  value: object,
  description: string,
  is_public: boolean,
  updated_at: timestamp
}
```

#### Collection: `feature_flags`
```typescript
{
  id: string,
  name: string,
  slug: string,
  description: string,
  is_enabled: boolean,
  target_audience: object,
  rollout_percentage: number,
  metadata: object,
  created_at: timestamp,
  updated_at: timestamp
}
```

---

## 🔒 FIRESTORE SECURITY RULES

### Estrutura de Regras de Segurança

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // ===== HELPER FUNCTIONS =====
    
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function getUserRole() {
      return request.auth.token.role;
    }
    
    function getUserType() {
      return request.auth.token.user_type;
    }
    
    function isSuperAdmin() {
      return getUserType() == 'super_admin';
    }
    
    function isClient() {
      return getUserRole() == 'client';
    }
    
    function isEmployee() {
      return getUserRole() == 'employee';
    }
    
    function hasRole(role) {
      return getUserType() == role;
    }
    
    function ownsResource(resource) {
      return resource.data.user_id == request.auth.uid;
    }
    
    function belongsToClient(clientId) {
      return request.auth.token.client_id == clientId;
    }
    
    // ===== USERS =====
    
    match /users/{userId} {
      allow read: if isAuthenticated() && (
        isSuperAdmin() || 
        userId == request.auth.uid
      );
      
      allow create: if isSuperAdmin();
      
      allow update: if isAuthenticated() && (
        isSuperAdmin() || 
        userId == request.auth.uid
      );
      
      allow delete: if isSuperAdmin();
    }
    
    // ===== CLIENTS =====
    
    match /clients/{clientId} {
      allow read: if isAuthenticated() && (
        isSuperAdmin() ||
        hasRole('marketing_head') ||
        hasRole('commercial') ||
        belongsToClient(clientId)
      );
      
      allow create, update: if isSuperAdmin() || hasRole('commercial');
      
      allow delete: if isSuperAdmin();
      
      // Subcollections
      match /profile_extended/{docId} {
        allow read, write: if isAuthenticated() && (
          isSuperAdmin() || belongsToClient(clientId)
        );
      }
      
      match /contracts/{contractId} {
        allow read: if isAuthenticated() && (
          isSuperAdmin() || belongsToClient(clientId)
        );
        allow write: if isSuperAdmin();
      }
      
      match /credit_balance/{docId} {
        allow read: if isAuthenticated() && (
          isSuperAdmin() || belongsToClient(clientId)
        );
        allow write: if isSuperAdmin();
      }
      
      match /credit_transactions/{transactionId} {
        allow read: if isAuthenticated() && (
          isSuperAdmin() || belongsToClient(clientId)
        );
        allow create: if isSuperAdmin();
      }
    }
    
    // ===== KANBAN =====
    
    match /kanban_boards/{boardId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && (
        isSuperAdmin() || isEmployee()
      );
      
      match /columns/{columnId} {
        allow read: if isAuthenticated();
        allow write: if isAuthenticated() && isEmployee();
      }
      
      match /tasks/{taskId} {
        allow read: if isAuthenticated();
        allow create: if isAuthenticated();
        allow update, delete: if isAuthenticated() && (
          isSuperAdmin() ||
          request.auth.uid in resource.data.assigned_to ||
          resource.data.created_by == request.auth.uid
        );
        
        match /comments/{commentId} {
          allow read: if isAuthenticated();
          allow create: if isAuthenticated();
          allow update, delete: if ownsResource(resource);
        }
      }
    }
    
    // ===== MESSAGES =====
    
    match /conversations/{conversationId} {
      allow read: if isAuthenticated() && (
        request.auth.uid in resource.data.participants
      );
      
      allow create: if isAuthenticated();
      
      allow update: if isAuthenticated() && (
        request.auth.uid in resource.data.participants
      );
      
      match /messages/{messageId} {
        allow read: if isAuthenticated() && (
          request.auth.uid in get(/databases/$(database)/documents/conversations/$(conversationId)).data.participants
        );
        
        allow create: if isAuthenticated();
        
        allow update, delete: if isAuthenticated() && (
          resource.data.sender_id == request.auth.uid
        );
      }
    }
    
    // ===== CALENDAR =====
    
    match /calendar_events/{eventId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update, delete: if isAuthenticated() && (
        isSuperAdmin() || resource.data.organizer_id == request.auth.uid
      );
    }
    
    // ===== PRODUCTION =====
    
    match /production_items/{itemId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if isAuthenticated() && (
        isSuperAdmin() ||
        resource.data.assigned_to == request.auth.uid ||
        resource.data.created_by == request.auth.uid
      );
      allow delete: if isSuperAdmin();
      
      match /versions/{versionId} {
        allow read: if isAuthenticated();
        allow create: if isAuthenticated();
      }
    }
    
    // ===== SOCIAL MEDIA =====
    
    match /social_platform_accounts/{accountId} {
      allow read: if isAuthenticated();
      allow write: if isSuperAdmin() || hasRole('social_media');
    }
    
    match /content_calendar_posts/{postId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update, delete: if isAuthenticated() && (
        isSuperAdmin() ||
        hasRole('social_media') ||
        resource.data.created_by == request.auth.uid
      );
    }
    
    // ===== EMAIL =====
    
    match /email_templates/{templateId} {
      allow read: if isAuthenticated();
      allow write: if isSuperAdmin() || hasRole('marketing_head');
    }
    
    match /email_campaigns/{campaignId} {
      allow read: if isAuthenticated();
      allow write: if isSuperAdmin() || hasRole('marketing_head');
    }
    
    match /email_queue/{queueId} {
      allow read: if isSuperAdmin();
      allow write: if false; // Apenas Cloud Functions
    }
    
    // ===== WHATSAPP =====
    
    match /whatsapp_conversations/{conversationId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && (
        isSuperAdmin() || 
        hasRole('commercial') ||
        resource.data.assigned_to == request.auth.uid
      );
      
      match /messages/{messageId} {
        allow read: if isAuthenticated();
        allow create: if isAuthenticated();
      }
    }
    
    // ===== AI =====
    
    match /ai_chat_history/{chatId} {
      allow read, write: if isAuthenticated() && ownsResource(resource);
    }
    
    match /ai_predictions/{predictionId} {
      allow read: if isAuthenticated() && (
        isSuperAdmin() || hasRole('marketing_head')
      );
      allow write: if false; // Apenas Cloud Functions
    }
    
    match /health_scores/{scoreId} {
      allow read: if isAuthenticated() && (
        isSuperAdmin() || hasRole('marketing_head')
      );
      allow write: if false; // Apenas Cloud Functions
    }
    
    // ===== ANALYTICS =====
    
    match /client_metrics/{metricId} {
      allow read: if isAuthenticated();
      allow write: if false; // Apenas Cloud Functions
    }
    
    match /report_templates/{templateId} {
      allow read: if isAuthenticated();
      allow write: if isSuperAdmin();
    }
    
    match /custom_reports/{reportId} {
      allow read: if isAuthenticated() && (
        isSuperAdmin() || resource.data.created_by == request.auth.uid
      );
      allow create: if isAuthenticated();
      allow update: if ownsResource(resource);
    }
    
    // ===== GAMIFICATION =====
    
    match /employee_gamification/{gamificationId} {
      allow read: if isAuthenticated();
      allow write: if false; // Apenas Cloud Functions
    }
    
    match /rewards_catalog/{rewardId} {
      allow read: if isAuthenticated();
      allow write: if isSuperAdmin() || hasRole('hr');
    }
    
    match /reward_redemptions/{redemptionId} {
      allow read: if isAuthenticated() && (
        isSuperAdmin() || resource.data.employee_id == request.auth.uid
      );
      allow create: if isAuthenticated();
      allow update: if isSuperAdmin() || hasRole('hr');
    }
    
    // ===== EMPLOYEES =====
    
    match /employees/{employeeId} {
      allow read: if isAuthenticated() && (
        isSuperAdmin() ||
        hasRole('hr') ||
        resource.data.user_id == request.auth.uid
      );
      
      allow write: if isSuperAdmin() || hasRole('hr');
    }
    
    match /employee_requests/{requestId} {
      allow read: if isAuthenticated() && (
        isSuperAdmin() ||
        hasRole('hr') ||
        resource.data.employee_id == request.auth.uid
      );
      
      allow create: if isAuthenticated();
      
      allow update: if isAuthenticated() && (
        isSuperAdmin() || hasRole('hr')
      );
    }
    
    match /wellbeing_checkins/{checkinId} {
      allow read: if isAuthenticated() && (
        isSuperAdmin() ||
        hasRole('hr') ||
        resource.data.employee_id == request.auth.uid
      );
      
      allow create: if isAuthenticated();
    }
    
    // ===== NOTIFICATIONS =====
    
    match /notifications/{notificationId} {
      allow read: if isAuthenticated() && ownsResource(resource);
      allow create: if false; // Apenas Cloud Functions
      allow update: if isAuthenticated() && ownsResource(resource);
    }
    
    // ===== FILES =====
    
    match /file_metadata/{fileId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update, delete: if isAuthenticated() && (
        isSuperAdmin() || resource.data.uploaded_by == request.auth.uid
      );
    }
    
    // ===== AUDIT LOGS =====
    
    match /audit_logs/{logId} {
      allow read: if isSuperAdmin();
      allow write: if false; // Apenas Cloud Functions
    }
    
    match /activity_logs/{logId} {
      allow read: if isSuperAdmin();
      allow write: if false; // Apenas Cloud Functions
    }
    
    // ===== SYSTEM =====
    
    match /system_settings/{settingId} {
      allow read: if isAuthenticated();
      allow write: if isSuperAdmin();
    }
    
    match /feature_flags/{flagId} {
      allow read: if isAuthenticated();
      allow write: if isSuperAdmin();
    }
  }
}
```

---

## ☁️ FIREBASE CLOUD FUNCTIONS

### Exemplos de Cloud Functions

```typescript
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

// ===== TRIGGERS onCreate =====

// Novo cliente criado
export const onClientCreated = functions.firestore
  .document('clients/{clientId}')
  .onCreate(async (snap, context) => {
    const client = snap.data();
    
    // Enviar email de boas-vindas
    await sendWelcomeEmail(client.email, client.name);
    
    // Criar estrutura inicial (kanban board, etc)
    await createClientStructure(context.params.clientId);
    
    // Log de auditoria
    await logActivity('client_created', context.params.clientId);
  });

// Nova fatura criada
export const onInvoiceCreated = functions.firestore
  .document('invoices/{invoiceId}')
  .onCreate(async (snap, context) => {
    const invoice = snap.data();
    
    // Agendar lembretes de pagamento
    await schedulePaymentReminders(context.params.invoiceId, invoice);
    
    // Notificar cliente
    await sendNotification(invoice.client_id, {
      type: 'payment',
      title: 'Nova fatura disponível',
      message: `Fatura #${invoice.invoice_number} vencimento em ${invoice.due_date}`
    });
  });

// Nova mensagem
export const onMessageCreated = functions.firestore
  .document('conversations/{conversationId}/messages/{messageId}')
  .onCreate(async (snap, context) => {
    const message = snap.data();
    const conversationId = context.params.conversationId;
    
    // Atualizar última mensagem da conversa
    await db.collection('conversations').doc(conversationId).update({
      'last_message.text': message.content,
      'last_message.sender_id': message.sender_id,
      'last_message.timestamp': message.created_at,
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Incrementar unread count para outros participantes
    const conversation = await db.collection('conversations').doc(conversationId).get();
    const participants = conversation.data()?.participants || [];
    
    for (const participantId of participants) {
      if (participantId !== message.sender_id) {
        await db.collection('conversations').doc(conversationId).update({
          [`unread_count.${participantId}`]: admin.firestore.FieldValue.increment(1)
        });
        
        // Enviar notificação push
        await sendPushNotification(participantId, {
          title: 'Nova mensagem',
          body: message.content
        });
      }
    }
    
    // Agendar notificação WhatsApp após 2h se não for lida
    await scheduleWhatsAppNotification(conversationId, message.id, 2 * 60 * 60);
  });

// ===== TRIGGERS onUpdate =====

// Fatura atualizada
export const onInvoiceUpdated = functions.firestore
  .document('invoices/{invoiceId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    
    // Se status mudou para pago
    if (before.status !== 'paid' && after.status === 'paid') {
      // Notificar equipe financeira
      await notifyFinancialTeam(context.params.invoiceId, after);
      
      // Atualizar créditos do cliente se aplicável
      if (after.type === 'credit_recharge') {
        await updateClientCredits(after.client_id, after.value);
      }
    }
  });

// Tarefa Kanban atualizada
export const onKanbanTaskUpdated = functions.firestore
  .document('kanban_boards/{boardId}/tasks/{taskId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    
    // Se coluna mudou (moved)
    if (before.column_id !== after.column_id) {
      // Calcular métricas (lead time, cycle time)
      await calculateKanbanMetrics(context.params.boardId, context.params.taskId);
    }
    
    // Se concluída
    if (before.status !== 'done' && after.status === 'done') {
      // Adicionar pontos de gamificação
      for (const userId of after.assigned_to) {
        await addGamificationPoints(userId, 'task_completed', 10);
      }
    }
  });

// ===== SCHEDULED FUNCTIONS (CRON) =====

// Calcular health scores diariamente
export const calculateHealthScoresDaily = functions.pubsub
  .schedule('every day 00:00')
  .timeZone('America/Sao_Paulo')
  .onRun(async (context) => {
    // Calcular client health scores
    const clients = await db.collection('clients').where('is_active', '==', true).get();
    
    for (const clientDoc of clients.docs) {
      const score = await calculateClientHealthScore(clientDoc.id);
      await db.collection('health_scores').doc(`client_${clientDoc.id}`).set({
        entity_type: 'client',
        entity_id: clientDoc.id,
        overall_score: score.overall,
        components: score.components,
        trend: score.trend,
        calculated_at: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    // Calcular employee health scores
    const employees = await db.collection('employees').where('is_active', '==', true).get();
    
    for (const employeeDoc of employees.docs) {
      const score = await calculateEmployeeHealthScore(employeeDoc.id);
      await db.collection('health_scores').doc(`employee_${employeeDoc.id}`).set({
        entity_type: 'employee',
        entity_id: employeeDoc.id,
        overall_score: score.overall,
        components: score.components,
        trend: score.trend,
        calculated_at: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  });

// Sincronizar métricas de redes sociais a cada hora
export const syncSocialMetricsHourly = functions.pubsub
  .schedule('every 1 hours')
  .onRun(async (context) => {
    const accounts = await db.collection('social_platform_accounts')
      .where('is_connected', '==', true)
      .get();
    
    for (const accountDoc of accounts.docs) {
      await syncAccountMetrics(accountDoc.id, accountDoc.data());
    }
  });

// Enviar relatórios diários ao super admin
export const sendDailyReportsToAdmin = functions.pubsub
  .schedule('every day 09:00')
  .timeZone('America/Sao_Paulo')
  .onRun(async (context) => {
    const report = await generateDailyReport();
    
    const admins = await db.collection('users')
      .where('user_type', '==', 'super_admin')
      .get();
    
    for (const admin of admins.docs) {
      await sendEmailReport(admin.data().email, report);
    }
  });

// Detectar churn risk diariamente
export const detectChurnRiskDaily = functions.pubsub
  .schedule('every day 08:00')
  .timeZone('America/Sao_Paulo')
  .onRun(async (context) => {
    // Clientes
    const clients = await db.collection('clients').where('is_active', '==', true).get();
    
    for (const clientDoc of clients.docs) {
      const churnProbability = await predictClientChurn(clientDoc.id);
      
      if (churnProbability > 0.7) {
        await db.collection('ai_predictions').add({
          type: 'churn',
          entity_type: 'client',
          entity_id: clientDoc.id,
          prediction_value: churnProbability,
          risk_level: churnProbability > 0.9 ? 'critical' : 'high',
          contributing_factors: [], // IA Backend calcula
          recommended_actions: [],
          prediction_date: admin.firestore.FieldValue.serverTimestamp(),
          created_at: admin.firestore.FieldValue.serverTimestamp()
        });
        
        // Alertar super admin
        await sendChurnAlert(clientDoc.id, churnProbability);
      }
    }
  });

// ===== CALLABLE FUNCTIONS (API) =====

// Gerar relatório customizado
export const generateCustomReport = functions.https.onCall(async (data, context) => {
  // Verificar autenticação
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Usuário não autenticado');
  }
  
  const { template_id, parameters, date_range } = data;
  
  // Gerar relatório
  const reportUrl = await generateReport(template_id, parameters, date_range);
  
  // Salvar no Firestore
  const reportDoc = await db.collection('custom_reports').add({
    template_id,
    client_id: parameters.client_id,
    parameters,
    date_range_start: date_range.start,
    date_range_end: date_range.end,
    status: 'ready',
    file_url: reportUrl,
    file_format: 'pdf',
    generated_at: admin.firestore.FieldValue.serverTimestamp(),
    created_by: context.auth.uid,
    created_at: admin.firestore.FieldValue.serverTimestamp()
  });
  
  return { report_id: reportDoc.id, url: reportUrl };
});

// Publicar post nas redes sociais
export const publishSocialPost = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Usuário não autenticado');
  }
  
  const { post_id } = data;
  
  const postDoc = await db.collection('content_calendar_posts').doc(post_id).get();
  const post = postDoc.data();
  
  if (!post) {
    throw new functions.https.HttpsError('not-found', 'Post não encontrado');
  }
  
  const results = [];
  
  // Publicar em cada plataforma
  for (const platform of post.platforms) {
    const result = await publishToPlatform(platform, post);
    results.push(result);
    
    // Adicionar à fila
    await db.collection('publishing_queue').add({
      post_id,
      platform,
      account_id: result.account_id,
      status: result.success ? 'published' : 'failed',
      external_post_id: result.post_id,
      external_post_url: result.url,
      error_message: result.error,
      published_at: admin.firestore.FieldValue.serverTimestamp(),
      created_at: admin.firestore.FieldValue.serverTimestamp()
    });
  }
  
  // Atualizar status do post
  await db.collection('content_calendar_posts').doc(post_id).update({
    status: results.every(r => r.success) ? 'published' : 'failed',
    updated_at: admin.firestore.FieldValue.serverTimestamp()
  });
  
  return { results };
});

// ===== WEBHOOKS =====

// Webhook do WhatsApp
export const whatsappWebhook = functions.https.onRequest(async (req, res) => {
  if (req.method === 'GET') {
    // Verificação do webhook
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    
    if (mode === 'subscribe' && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  } else if (req.method === 'POST') {
    // Processar mensagem recebida
    const body = req.body;
    
    if (body.entry && body.entry[0].changes) {
      const change = body.entry[0].changes[0];
      const message = change.value.messages?.[0];
      
      if (message) {
        await processWhatsAppMessage(message);
      }
    }
    
    res.sendStatus(200);
  }
});

// Webhook do SendGrid (email events)
export const sendgridWebhook = functions.https.onRequest(async (req, res) => {
  const events = req.body;
  
  for (const event of events) {
    await db.collection('email_logs').doc(event.sg_message_id).update({
      status: event.event,
      [`${event.event}_at`]: admin.firestore.Timestamp.fromDate(new Date(event.timestamp * 1000)),
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });
  }
  
  res.sendStatus(200);
});

// Webhook do Stripe (payment events)
export const stripeWebhook = functions.https.onRequest(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }
  
  // Processar evento
  switch (event.type) {
    case 'payment_intent.succeeded':
      await handlePaymentSuccess(event.data.object);
      break;
    case 'payment_intent.payment_failed':
      await handlePaymentFailure(event.data.object);
      break;
  }
  
  res.sendStatus(200);
});
```

---

## 🔗 INTEGRAÇÕES EXTERNAS

### 1. OpenAI API
- GPT-4 para geração de conteúdo
- Embeddings para RAG
- DALL-E para geração de imagens (planejado)

### 2. Anthropic Claude
- IA alternativa ao GPT-4
- Análise de documentos longos

### 3. Google Gemini
- IA do Google
- Multimodal (texto + imagem)

### 4. Meta Graph API
- Publicação no Instagram
- Publicação no Facebook
- Métricas e analytics
- OAuth flow

### 5. LinkedIn API
- Publicação de vagas
- Publicação de conteúdo
- Analytics

### 6. WhatsApp Business Cloud API
- Envio e recebimento de mensagens
- Templates aprovados
- Webhooks
- Status de mensagens

### 7. SendGrid/Resend
- Email transacional
- Email marketing
- Templates
- Webhooks (open, click, bounce)

### 8. Stripe
- Pagamentos com cartão
- Assinaturas
- Webhooks
- Checkout

### 9. Mercado Pago
- Pagamentos PIX
- Boleto
- Webhooks

### 10. N8N
- Automação de workflows
- Integração com 300+ apps
- Webhooks

### 11. Google Calendar API
- Sincronização de eventos
- Criação de eventos
- Disponibilidade

### 12. Google Drive API
- Upload de arquivos
- Compartilhamento
- Backup

---

## 🤖 BACKEND IA (FastAPI + CrewAI)

### Arquitetura Separada

```
[Firebase] ←→ [Next.js Frontend] ←→ [FastAPI Backend]
                                          ↓
                                    [CrewAI System]
                                          ↓
                                  [34 Agentes IA]
                                          ↓
                                    [12 Crews]
```

### Endpoints da API IA

```python
# FastAPI Backend

# Health Check
GET /health

# Brand Memory (RAG)
POST /v1/brand/ingest-text
POST /v1/brand/search

# Content Generation
POST /v1/content/generate-post
POST /v1/content/generate-caption
POST /v1/content/generate-hashtags
POST /v1/content/generate-video-script

# Predictions
GET /v1/predictions/churn/client/{client_id}
GET /v1/predictions/churn/employee/{employee_id}
GET /v1/predictions/ltv/client/{client_id}
GET /v1/predictions/revenue
POST /v1/predictions/campaign-performance

# Health Scores
GET /v1/health-score/client/{client_id}
GET /v1/health-score/employee/{employee_id}
POST /v1/health-score/calculate

# AI Chat
POST /v1/chat/completion
GET /v1/chat/history/{user_id}

# Recommendations
GET /v1/recommendations/client/{client_id}
POST /v1/recommendations/generate

# Sentiment Analysis
POST /v1/sentiment/analyze
POST /v1/sentiment/batch

# Approval System
POST /v1/approval/kanban-task-draft
GET /v1/approval/draft-status
```

### 34 Agentes CrewAI

**Estratégicos:**
- Head Strategist
- SEO Strategist
- Keyword Researcher
- Local SEO Expert
- YouTube SEO Expert
- Campaign Planner
- Content Calendar Builder

**Inteligência:**
- Competitor Analyst
- Trend Hunter
- Audience Profiler
- Hashtag Researcher
- Content Gap Finder
- Viral Pattern Analyst

**Analíticos:**
- Performance Analyst
- Failure Analyst
- A/B Test Designer
- Best Time Analyst
- Content Recycler

**Criativos:**
- 8 Copywriters (por plataforma)
- 5 Designers Gráficos
- 5 Especialistas em Vídeo
- Art Director
- Creative Director

**Persuasão:**
- Hook Specialist
- CTA Specialist
- Objection Handler
- Storytelling Specialist

**Distribuição:**
- Social Media Manager
- Community Manager
- Traffic Manager
- Ads Specialists (Meta, Google, TikTok, LinkedIn)
- Budget Optimizer

**Qualidade:**
- Approval Manager
- Brand Guardian
- Compliance Checker
- Fact Checker

### 12 Crews (Equipes)

1. Traffic Campaign Crew
2. Launch Campaign Crew
3. Organic Content Crew
4. Paid Content Crew
5. Video Content Crew
6. Weekly Planning Crew
7. Monthly Planning Crew
8. Crisis Response Crew
9. Branding Project Crew
10. Funnel Project Crew
11. Web Project Crew
12. Carousel Crew

---

## 📈 MIGRAÇÃO SUPABASE → FIREBASE

### Plano de Migração em 5 Fases

#### Fase 1: Setup Firebase (1 semana)
- [ ] Criar projeto Firebase
- [ ] Configurar Firebase Authentication
- [ ] Configurar Firestore Database
- [ ] Configurar Firebase Storage
- [ ] Configurar Firebase Cloud Functions
- [ ] Configurar Firebase Cloud Messaging
- [ ] Setup CI/CD

#### Fase 2: Migração de Dados (2 semanas)
- [ ] Script de migração PostgreSQL → Firestore
- [ ] Migrar usuários (Supabase Auth → Firebase Auth)
- [ ] Converter Custom Claims (roles)
- [ ] Migrar arquivos (Supabase Storage → Firebase Storage)
- [ ] Validar integridade dos dados
- [ ] Testes de migração em ambiente staging

#### Fase 3: Refatoração de Código (3 semanas)
- [ ] Substituir `@supabase/supabase-js` por `firebase`
- [ ] Refatorar queries SQL → Firestore queries
- [ ] Substituir RLS por Firestore Security Rules
- [ ] Migrar Realtime (Supabase → Firestore onSnapshot)
- [ ] Atualizar lógica de autenticação
- [ ] Atualizar upload de arquivos
- [ ] Refatorar componentes React

#### Fase 4: Cloud Functions (2 semanas)
- [ ] Migrar lógica de backend para Cloud Functions
- [ ] Implementar triggers (onCreate, onUpdate, onDelete)
- [ ] Implementar scheduled functions (cron)
- [ ] Implementar callable functions (API)
- [ ] Implementar webhooks
- [ ] Testes de integração

#### Fase 5: Deploy e Validação (1 semana)
- [ ] Deploy em staging
- [ ] Testes end-to-end
- [ ] Testes de performance
- [ ] Testes de segurança (Security Rules)
- [ ] Deploy em produção (gradual)
- [ ] Monitoramento e ajustes
- [ ] Rollback plan

**Total: 9 semanas (2 meses)**

---

## 💰 COMPARATIVO DE CUSTOS

### Supabase (Atual)
- **Free Tier:** 500MB database, 1GB storage, 2GB bandwidth
- **Pro ($25/mês):** 8GB database, 100GB storage, 250GB bandwidth
- **Team ($599/mês):** 50GB database, 500GB storage, 5TB bandwidth

### Firebase (Proposto)
- **Spark (Free):** 1GB storage, 10GB bandwidth, 50K reads/20K writes por dia
- **Blaze (Pay-as-you-go):**
  - Firestore: $0.06/100K reads, $0.18/100K writes
  - Storage: $0.026/GB
  - Functions: $0.40/million invocações
  - Cloud Messaging: Gratuito

### Estimativa Valle 360
- **Usuários:** 100 ativos/dia
- **Reads:** ~500K/dia = $90/mês
- **Writes:** ~100K/dia = $54/mês
- **Storage:** 50GB = $1.30/mês
- **Functions:** 1M/dia = $12/mês
- **Total estimado:** ~$160/mês

---

## 📊 ESTATÍSTICAS DO PROJETO

### Collections Firestore
- **50+ collections principais**
- **100+ subcollections**
- **Total:** ~150 collections

### Security Rules
- **500+ regras de segurança**
- **10+ helper functions**

### Cloud Functions
- **10+ onCreate triggers**
- **5+ onUpdate triggers**
- **5+ onWrite triggers**
- **5+ scheduled functions (cron)**
- **10+ callable functions (API)**
- **5+ webhooks**
- **Total:** ~40 functions

### Backend IA (Python)
- **172 arquivos Python**
- **34 agentes CrewAI**
- **12 crews**
- **15+ ferramentas**
- **Sistema RAG completo**

### Frontend
- **200+ componentes React**
- **100+ páginas/rotas**
- **3 áreas (Admin, Cliente, Colaborador)**

---

## 🎯 FUNCIONALIDADES PRINCIPAIS

### ✅ Implementadas
1. Autenticação e autorização
2. CRUD de clientes e colaboradores
3. Sistema Kanban completo
4. Mensagens em tempo real
5. Calendário e eventos
6. Produção e aprovações
7. Gamificação básica
8. Dashboards
9. Backend Python (CrewAI estruturado)

### ⏳ Em Implementação
1. Integrações redes sociais (OAuth)
2. WhatsApp Business API
3. Email marketing (SendGrid)
4. Content calendar
5. IA preditiva (treinar modelos)
6. Workflows N8N

### 📋 Planejadas
1. Auto-geração de conteúdo visual
2. Persona virtual
3. Campanha autopilot
4. Teste A/B infinito
5. IA de negociação
6. Meta-learning

---

## 🚀 PRÓXIMOS PASSOS RECOMENDADOS

### Curto Prazo (1 mês)
1. ✅ Setup Firebase completo
2. ✅ Migrar dados críticos
3. ✅ Implementar Security Rules
4. ⏳ Refatorar autenticação
5. ⏳ Implementar Cloud Functions básicas

### Médio Prazo (2-3 meses)
1. ⏳ Migrar todo frontend para Firebase
2. ⏳ Implementar todas Cloud Functions
3. ⏳ Integrar backend IA
4. ⏳ Testes completos
5. ⏳ Deploy em produção

### Longo Prazo (3-6 meses)
1. ⏳ Otimizações de performance
2. ⏳ Features avançadas de IA
3. ⏳ Expansão de integrações
4. ⏳ Mobile apps (iOS/Android)
5. ⏳ Internacionalização

---

## 📞 SUPORTE E DOCUMENTAÇÃO

### Links Úteis
- **Firebase Console:** https://console.firebase.google.com
- **Firebase Docs:** https://firebase.google.com/docs
- **Firestore Docs:** https://firebase.google.com/docs/firestore
- **Cloud Functions:** https://firebase.google.com/docs/functions
- **Security Rules:** https://firebase.google.com/docs/rules

### Comandos Firebase CLI

```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Inicializar projeto
firebase init

# Deploy Firestore Rules
firebase deploy --only firestore:rules

# Deploy Cloud Functions
firebase deploy --only functions

# Deploy completo
firebase deploy

# Ver logs
firebase functions:log

# Emuladores locais
firebase emulators:start
```

---

## 🎊 CONCLUSÃO

Este documento mapeia **TODAS** as funcionalidades do Valle 360 adaptadas para **Firebase** como stack principal.

### Resumo
- ✅ **200+ funcionalidades**
- ✅ **50+ collections Firestore**
- ✅ **40+ Cloud Functions**
- ✅ **34 agentes IA (CrewAI)**
- ✅ **12 crews**
- ✅ **10+ integrações externas**

### Arquitetura Final
```
Frontend (Next.js)
       ↓
Firebase SDK
       ↓
Firebase Services
  - Auth
  - Firestore
  - Storage
  - Cloud Functions
  - Cloud Messaging
       ↓
External APIs
  - FastAPI (IA/CrewAI)
  - N8N (Automação)
  - SendGrid (Email)
  - WhatsApp
  - Stripe
  - Redes Sociais
```

**Status:** ✅ Documentação completa  
**Próximo passo:** Iniciar migração Fase 1

---

**Desenvolvido para Valle 360**  
**Data:** Fevereiro 2026  
**Stack:** Firebase + Next.js + FastAPI + CrewAI

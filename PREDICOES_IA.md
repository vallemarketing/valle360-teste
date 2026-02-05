# Valle 360 - Sistema de Predições com IA/ML

Este documento lista todos os recursos de Inteligência Artificial e Machine Learning disponíveis no sistema Valle 360.

---

## Resumo Executivo

| Métrica | Quantidade |
|---------|------------|
| Migrações SQL | 8 arquivos |
| Bibliotecas TypeScript | 3 arquivos |
| Rotas de API | 9 endpoints |
| Componentes Frontend | 7 componentes |
| Funções SQL de Cálculo | 7 funções |
| **Tipos de Predições** | **17 tipos** |

---

## 1. Tipos de Predições Disponíveis

| # | Predição | Descrição |
|---|----------|-----------|
| 1 | **Churn de Clientes** | Probabilidade de cancelamento |
| 2 | **LTV (Lifetime Value)** | Valor vitalício do cliente |
| 3 | **Inadimplência** | Risco de não pagamento |
| 4 | **Performance de Campanhas** | ROI, conversões, CTR previsto |
| 5 | **Prazos de Projetos** | Previsão de atrasos e conclusão |
| 6 | **Receita** | MRR, ARR, crescimento previsto |
| 7 | **Contratações** | Necessidades de equipe |
| 8 | **Conversão de Leads** | Probabilidade de conversão |
| 9 | **Atrasos em Tarefas** | Risco de atraso |
| 10 | **Upsell** | Oportunidades de venda adicional |
| 11 | **Risco de Pagamento** | Probabilidade de inadimplência |
| 12 | **Estouro de Orçamento** | Campanhas e tarefas |
| 13 | **Demanda/Capacidade** | Análise de capacidade da equipe |
| 14 | **Health Score** | Score de saúde do cliente (0-100) |
| 15 | **Renovação de Contratos** | Probabilidade de renovação |
| 16 | **Análise de Sentimento** | Sentimento em textos |
| 17 | **Padrões Comportamentais** | Padrões identificados por ML |

---

## 2. Detalhamento por Sistema

### 2.1 Predição de Churn de Clientes

**Arquivo:** `supabase/migrations/20260123000010_create_client_churn_predictions.sql`

**O que calcula:**
- Probabilidade de churn (0-100%)
- Nível de risco (low, medium, high, critical)
- Dias até churn previsto
- Data prevista de churn
- Fatores contribuintes (pagamentos atrasados, baixo engajamento, tickets de suporte)

**Função SQL:** `calculate_client_churn_prediction(p_client_id uuid)`

**View:** `v_clients_high_churn_risk`

---

### 2.2 Predição de LTV (Lifetime Value)

**Arquivo:** `supabase/migrations/20260123000011_create_client_ltv_predictions.sql`

**O que calcula:**
- LTV previsto
- LTV atual
- Potencial de crescimento de LTV
- Probabilidade de upsell (0-100%)
- Serviços recomendados para upsell
- Valor estimado de upsell
- Melhor momento para upsell
- Segmento de valor (low, medium, high, vip)

**Função SQL:** `calculate_client_ltv_prediction(p_client_id uuid, p_months integer DEFAULT 12)`

**Views:** `v_upsell_opportunities`, `v_vip_clients`

---

### 2.3 Predição de Inadimplência

**Arquivo:** `supabase/migrations/20260123000012_create_payment_default_predictions.sql`

**O que calcula:**
- Probabilidade de inadimplência (0-100%)
- Nível de risco (low, medium, high, critical)
- Padrão de pagamento (excellent, good, irregular, problematic, critical)
- Score de histórico de pagamento
- Média de dias em atraso
- Valor em atraso atual
- Maior atraso histórico
- Atrasos recentes (últimos 3 meses)

**Função SQL:** `calculate_payment_default_prediction(p_client_id uuid)`

**Views:** `v_high_payment_risk_clients`, `v_collections_dashboard`

---

### 2.4 Predição de Performance de Campanhas

**Arquivo:** `supabase/migrations/20260123000013_create_campaign_predictions.sql`

**O que calcula:**
- Alcance previsto
- Impressões previstas
- Cliques previstos
- Conversões previstas
- CTR previsto
- Taxa de conversão prevista
- ROI previsto
- Receita prevista
- Custo por clique previsto
- Custo por conversão previsto
- Probabilidade de sucesso (0-100%)

**Função SQL:** `calculate_campaign_prediction(p_client_id uuid, p_campaign_type text, p_budget decimal, p_duration_days integer DEFAULT 30)`

**Views:** `v_campaigns_at_risk`, `v_top_predicted_campaigns`

---

### 2.5 Predição de Prazos de Projetos

**Arquivo:** `supabase/migrations/20260123000014_create_project_deadline_predictions.sql`

**O que calcula:**
- Data prevista de conclusão
- Dias de atraso previstos
- Probabilidade de entregar no prazo (0-100%)
- Probabilidade de atraso (0-100%)
- Probabilidade de antecipação (0-100%)
- Status de progresso (ahead, on_track, slightly_behind, significantly_behind, critical)
- Velocidade diária atual vs necessária
- Horas restantes

**Função SQL:** `calculate_project_deadline_prediction(p_project_id uuid, p_original_deadline date, p_current_progress decimal, p_hours_completed integer, p_hours_total integer)`

**Views:** `v_projects_at_risk`, `v_project_deadlines_dashboard`

---

### 2.6 Predição de Receita

**Arquivo:** `supabase/migrations/20260123000015_create_revenue_predictions.sql`

**O que calcula:**
- Receita prevista (mensal, trimestral, anual)
- MRR previsto (Monthly Recurring Revenue)
- ARR previsto (Annual Recurring Revenue)
- Taxa de crescimento de receita
- Receita recorrente vs one-time
- Receita por upsell
- Receita de novos clientes
- Clientes ativos previstos
- Ticket médio previsto
- Probabilidade de atingir meta (0-100%)

**Função SQL:** `calculate_revenue_prediction(p_period text, p_year integer, p_month integer DEFAULT NULL, p_quarter integer DEFAULT NULL)`

**Views:** `v_revenue_dashboard`, `v_revenue_growth_analysis`

---

### 2.7 Predição de Contratações

**Arquivo:** `supabase/migrations/20260123000016_create_hiring_needs_predictions.sql`

**O que calcula:**
- Número recomendado de contratações
- Nível de prioridade (low, medium, high, urgent)
- Posições necessárias por cargo/área
- Utilização de capacidade atual (%)
- Status de capacidade (underutilized, optimal, near_capacity, overloaded, critical)
- Gap de capacidade (horas)
- Risco de burnout (0-100%)
- Receita em risco por falta de equipe
- ROI da contratação

**Função SQL:** `calculate_hiring_needs_prediction(p_period text, p_year integer, p_month integer DEFAULT NULL)`

**Views:** `v_hiring_needs_dashboard`, `v_critical_hiring_needs`

---

### 2.8 Sistema de Inteligência Preditiva Geral

**Arquivo:** `supabase/migrations/20251112000019_create_predictive_intelligence_system.sql`

**Tabelas criadas:**
- `client_health_scores` — Score de saúde do cliente (0-100)
- `churn_predictions` — Predições de churn
- `renewal_predictions` — Predições de renovação de contratos
- `upsell_opportunities` — Oportunidades de upsell
- `sentiment_analysis` — Análise de sentimento automática
- `revenue_forecasts` — Previsões de receita
- `predictive_alerts` — Alertas preditivos
- `client_behavior_patterns` — Padrões comportamentais
- `ml_model_training_data` — Dados para treinar modelos
- `ml_model_performance` — Performance dos modelos de ML

**Funções SQL:**
- `calculate_client_health_score(p_client_id UUID)` — Calcula health score
- `predict_churn(p_client_id UUID)` — Prediz probabilidade de churn

---

## 3. APIs de Predição

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/predictions` | GET | Buscar previsões |
| `/api/predictions` | POST | Gerar previsões (churn, conversion, delay, revenue, upsell, health_score) |
| `/api/predictions` | PUT | Registrar feedback de previsão |
| `/api/admin/predictions/churn` | GET/POST | Predições de churn |
| `/api/admin/predictions/ltv` | GET/POST | Predições de LTV |
| `/api/admin/predictions/revenue` | GET/POST | Predições de receita |
| `/api/admin/predictions/hiring` | GET | Predições de contratação |
| `/api/admin/predictions/dashboard` | GET | Dashboard consolidado |
| `/api/admin/predictions/calculate-all` | POST | Calcular todas as predições |
| `/api/admin/predictions/actions/create` | POST | Criar ações baseadas em predições |
| `/api/admin/ml/predictions/outcome` | POST | Registrar resultado de predição |

---

## 4. Bibliotecas TypeScript

### 4.1 `src/lib/ml/predictions.ts`
Sistema de previsões ML para faturamento, churn e demanda.

**Funções:**
- `predictRevenue(months: number = 3)` — Previsão de faturamento
- `predictChurn()` — Previsão de churn de clientes
- `predictHiringNeeds()` — Previsão de necessidades de contratação

### 4.2 `src/lib/ml/churnPrediction.ts`
Sistema de previsão de churn com múltiplos fatores.

**Funções:**
- `calculateChurnProbability(factors: ChurnFactors)` — Calcula probabilidade de churn
- `generateChurnAlerts(predictions: ChurnPrediction[])` — Gera alertas de churn
- `calculateRevenueAtRisk()` — Calcula receita em risco
- `generateValChurnMessage()` — Gera mensagem da Val sobre churn

### 4.3 `src/lib/ai/predictive-engine.ts`
Motor preditivo avançado para análises e previsões.

**Funções:**
- `predictChurn(clientId)` — Predição de churn
- `predictConversion(leadId)` — Predição de conversão de leads
- `predictDelay(taskId)` — Predição de atraso em tarefas
- `predictRevenue(period)` — Predição de receita
- `predictUpsellOpportunities(clientId)` — Identifica oportunidades de upsell
- `predictPaymentRisk(clientId)` — Predição de risco de pagamento
- `predictLtv(clientId)` — Predição de LTV
- `predictDemandCapacity(period)` — Forecast de demanda/capacidade
- `predictBudgetOverrun(campaignId)` — Predição de estouro de orçamento

---

## 5. Componentes Frontend

| Componente | Localização | Descrição |
|------------|-------------|-----------|
| `PredictionsPanel.tsx` | `src/components/intelligence/` | Painel principal de predições (Revenue, Churn, Hiring) |
| `SalesPredictive.tsx` | `src/components/dashboards/widgets/` | Widget de previsão de meta comercial |
| `IntelligenceCenter.tsx` | `src/components/intelligence/` | Centro de inteligência com previsões |
| `page.tsx` | `src/app/admin/machine-learning/` | Página administrativa de ML |
| `page.tsx` | `src/app/admin/predictions/churn/` | Página dedicada a predições de churn |
| `page.tsx` | `src/app/admin/analytics/preditivo/` | Analytics preditivo |
| `page.tsx` | `src/app/cliente/reputacao/` | Previsões da Val IA sobre reputação |

---

## 6. Como Usar

### Executar Predição de Churn para um Cliente
```sql
SELECT * FROM calculate_client_churn_prediction('uuid-do-cliente');
```

### Executar Predição de LTV
```sql
SELECT * FROM calculate_client_ltv_prediction('uuid-do-cliente', 12);
```

### Executar Predição de Receita
```sql
SELECT * FROM calculate_revenue_prediction('monthly', 2026, 1, NULL);
```

### Via API
```typescript
// POST /api/admin/predictions/churn
fetch('/api/admin/predictions/churn', {
  method: 'POST',
  body: JSON.stringify({ clientId: 'uuid-do-cliente' })
});
```

---

## 7. Modelos de IA Utilizados

O sistema utiliza os seguintes modelos:

| Modelo | Uso |
|--------|-----|
| **GPT-4o** | Análises complexas, scoring de conteúdo |
| **GPT-4o-mini** | Análises rápidas, embeddings |
| **Análise Estatística** | Cálculos de tendência, sazonalidade |
| **Heurísticas** | Regras de negócio para scoring |

---

## 8. Próximos Passos

Para ativar as predições:

1. Execute todas as migrações SQL no Supabase
2. Configure as variáveis de ambiente:
   - `OPENAI_API_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Acesse o painel em `/admin/predictions`
4. Clique em "Calcular Todas" para gerar predições iniciais

---

*Documento gerado automaticamente em Janeiro de 2026*

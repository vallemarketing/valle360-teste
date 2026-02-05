'use client';

/**
 * Valle 360 - Documentação Completa da API
 * Guia detalhado para integração com a API do Valle 360
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Book,
  Code,
  Key,
  Lock,
  Zap,
  AlertCircle,
  CheckCircle,
  Copy,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Terminal,
  FileJson,
  Shield,
  Clock,
  Globe,
  Webhook,
  Database,
  Users,
  FileText,
  CreditCard,
  BarChart3,
  Search
} from 'lucide-react';
import { cn } from '@/lib/utils';

// =====================================================
// TIPOS
// =====================================================

interface Endpoint {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  description: string;
  auth: boolean;
  params?: {
    name: string;
    type: string;
    required: boolean;
    description: string;
  }[];
  body?: {
    name: string;
    type: string;
    required: boolean;
    description: string;
  }[];
  response: {
    status: number;
    description: string;
    example: string;
  }[];
}

interface ApiSection {
  id: string;
  title: string;
  icon: React.ElementType;
  description: string;
  endpoints: Endpoint[];
}

// =====================================================
// DADOS DA API
// =====================================================

const API_SECTIONS: ApiSection[] = [
  {
    id: 'auth',
    title: 'Autenticação',
    icon: Key,
    description: 'Endpoints para autenticação e gerenciamento de tokens',
    endpoints: [
      {
        method: 'POST',
        path: '/api/v1/auth/login',
        description: 'Autenticar usuário e obter token de acesso',
        auth: false,
        body: [
          { name: 'email', type: 'string', required: true, description: 'Email do usuário' },
          { name: 'password', type: 'string', required: true, description: 'Senha do usuário' }
        ],
        response: [
          {
            status: 200,
            description: 'Login bem-sucedido',
            example: `{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "expires_in": 3600,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "admin"
  }
}`
          },
          {
            status: 401,
            description: 'Credenciais inválidas',
            example: `{
  "error": "invalid_credentials",
  "message": "Email ou senha incorretos"
}`
          }
        ]
      },
      {
        method: 'POST',
        path: '/api/v1/auth/refresh',
        description: 'Renovar token de acesso usando refresh token',
        auth: false,
        body: [
          { name: 'refresh_token', type: 'string', required: true, description: 'Refresh token válido' }
        ],
        response: [
          {
            status: 200,
            description: 'Token renovado',
            example: `{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "expires_in": 3600
}`
          }
        ]
      },
      {
        method: 'POST',
        path: '/api/v1/auth/api-key',
        description: 'Gerar nova API Key para integrações',
        auth: true,
        body: [
          { name: 'name', type: 'string', required: true, description: 'Nome descritivo da API Key' },
          { name: 'scopes', type: 'string[]', required: false, description: 'Escopos de permissão' },
          { name: 'expires_at', type: 'ISO8601', required: false, description: 'Data de expiração' }
        ],
        response: [
          {
            status: 201,
            description: 'API Key criada',
            example: `{
  "api_key": "valle_sk_live_abc123...",
  "key_id": "key_uuid",
  "name": "Integração ERP",
  "scopes": ["clients:read", "reports:read"],
  "created_at": "2025-12-05T10:00:00Z"
}`
          }
        ]
      }
    ]
  },
  {
    id: 'clients',
    title: 'Clientes',
    icon: Users,
    description: 'Gerenciamento de clientes e suas informações',
    endpoints: [
      {
        method: 'GET',
        path: '/api/v1/clients',
        description: 'Listar todos os clientes com paginação e filtros',
        auth: true,
        params: [
          { name: 'page', type: 'number', required: false, description: 'Página (default: 1)' },
          { name: 'limit', type: 'number', required: false, description: 'Itens por página (max: 100)' },
          { name: 'status', type: 'string', required: false, description: 'Filtrar por status: active, inactive, all' },
          { name: 'search', type: 'string', required: false, description: 'Busca por nome ou email' },
          { name: 'sort', type: 'string', required: false, description: 'Campo de ordenação' },
          { name: 'order', type: 'string', required: false, description: 'Direção: asc ou desc' }
        ],
        response: [
          {
            status: 200,
            description: 'Lista de clientes',
            example: `{
  "data": [
    {
      "id": "uuid",
      "name": "Empresa ABC",
      "email": "contato@abc.com",
      "status": "active",
      "plan": "premium",
      "created_at": "2025-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "total_pages": 8
  }
}`
          }
        ]
      },
      {
        method: 'GET',
        path: '/api/v1/clients/:id',
        description: 'Obter detalhes de um cliente específico',
        auth: true,
        params: [
          { name: 'id', type: 'uuid', required: true, description: 'ID do cliente' }
        ],
        response: [
          {
            status: 200,
            description: 'Detalhes do cliente',
            example: `{
  "id": "uuid",
  "name": "Empresa ABC",
  "email": "contato@abc.com",
  "phone": "+55 11 99999-9999",
  "status": "active",
  "plan": "premium",
  "services": ["social_media", "traffic"],
  "created_at": "2025-01-01T00:00:00Z",
  "metrics": {
    "impressions": 125000,
    "clicks": 8200,
    "conversions": 432
  }
}`
          },
          {
            status: 404,
            description: 'Cliente não encontrado',
            example: `{
  "error": "not_found",
  "message": "Cliente não encontrado"
}`
          }
        ]
      },
      {
        method: 'POST',
        path: '/api/v1/clients',
        description: 'Criar novo cliente',
        auth: true,
        body: [
          { name: 'name', type: 'string', required: true, description: 'Nome do cliente/empresa' },
          { name: 'email', type: 'string', required: true, description: 'Email de contato' },
          { name: 'phone', type: 'string', required: false, description: 'Telefone' },
          { name: 'plan', type: 'string', required: false, description: 'Plano: basic, premium, enterprise' },
          { name: 'services', type: 'string[]', required: false, description: 'Array de serviços contratados' }
        ],
        response: [
          {
            status: 201,
            description: 'Cliente criado',
            example: `{
  "id": "uuid",
  "name": "Empresa ABC",
  "email": "contato@abc.com",
  "status": "active",
  "created_at": "2025-12-05T10:00:00Z"
}`
          }
        ]
      },
      {
        method: 'PUT',
        path: '/api/v1/clients/:id',
        description: 'Atualizar cliente existente',
        auth: true,
        params: [
          { name: 'id', type: 'uuid', required: true, description: 'ID do cliente' }
        ],
        body: [
          { name: 'name', type: 'string', required: false, description: 'Nome do cliente/empresa' },
          { name: 'email', type: 'string', required: false, description: 'Email de contato' },
          { name: 'phone', type: 'string', required: false, description: 'Telefone' },
          { name: 'status', type: 'string', required: false, description: 'Status: active, inactive' }
        ],
        response: [
          {
            status: 200,
            description: 'Cliente atualizado',
            example: `{
  "id": "uuid",
  "name": "Empresa ABC Ltda",
  "updated_at": "2025-12-05T10:00:00Z"
}`
          }
        ]
      },
      {
        method: 'DELETE',
        path: '/api/v1/clients/:id',
        description: 'Desativar cliente (soft delete)',
        auth: true,
        params: [
          { name: 'id', type: 'uuid', required: true, description: 'ID do cliente' }
        ],
        response: [
          {
            status: 200,
            description: 'Cliente desativado',
            example: `{
  "message": "Cliente desativado com sucesso",
  "id": "uuid"
}`
          }
        ]
      }
    ]
  },
  {
    id: 'reports',
    title: 'Relatórios',
    icon: BarChart3,
    description: 'Endpoints para geração e consulta de relatórios',
    endpoints: [
      {
        method: 'GET',
        path: '/api/v1/reports/performance',
        description: 'Relatório de performance com métricas agregadas',
        auth: true,
        params: [
          { name: 'client_id', type: 'uuid', required: false, description: 'Filtrar por cliente' },
          { name: 'start_date', type: 'ISO8601', required: true, description: 'Data inicial' },
          { name: 'end_date', type: 'ISO8601', required: true, description: 'Data final' },
          { name: 'granularity', type: 'string', required: false, description: 'Granularidade: day, week, month' }
        ],
        response: [
          {
            status: 200,
            description: 'Relatório de performance',
            example: `{
  "period": {
    "start": "2025-11-01T00:00:00Z",
    "end": "2025-11-30T23:59:59Z"
  },
  "summary": {
    "impressions": 1250000,
    "clicks": 82000,
    "conversions": 4320,
    "ctr": 6.56,
    "conversion_rate": 5.27,
    "investment": 45000.00
  },
  "timeline": [
    {
      "date": "2025-11-01",
      "impressions": 41000,
      "clicks": 2700,
      "conversions": 145
    }
  ]
}`
          }
        ]
      },
      {
        method: 'POST',
        path: '/api/v1/reports/generate',
        description: 'Gerar relatório customizado assíncrono',
        auth: true,
        body: [
          { name: 'type', type: 'string', required: true, description: 'Tipo: performance, financial, clients' },
          { name: 'format', type: 'string', required: false, description: 'Formato: json, pdf, xlsx' },
          { name: 'filters', type: 'object', required: false, description: 'Filtros customizados' },
          { name: 'webhook_url', type: 'string', required: false, description: 'URL para notificação quando pronto' }
        ],
        response: [
          {
            status: 202,
            description: 'Relatório em processamento',
            example: `{
  "job_id": "job_uuid",
  "status": "processing",
  "estimated_time": 30,
  "check_status_url": "/api/v1/reports/status/job_uuid"
}`
          }
        ]
      },
      {
        method: 'GET',
        path: '/api/v1/reports/status/:job_id',
        description: 'Verificar status de geração de relatório',
        auth: true,
        params: [
          { name: 'job_id', type: 'uuid', required: true, description: 'ID do job de geração' }
        ],
        response: [
          {
            status: 200,
            description: 'Status do relatório',
            example: `{
  "job_id": "job_uuid",
  "status": "completed",
  "download_url": "https://storage.valle360.com/reports/...",
  "expires_at": "2025-12-06T10:00:00Z"
}`
          }
        ]
      }
    ]
  },
  {
    id: 'webhooks',
    title: 'Webhooks',
    icon: Webhook,
    description: 'Configuração e gerenciamento de webhooks',
    endpoints: [
      {
        method: 'GET',
        path: '/api/v1/webhooks',
        description: 'Listar webhooks configurados',
        auth: true,
        response: [
          {
            status: 200,
            description: 'Lista de webhooks',
            example: `{
  "data": [
    {
      "id": "webhook_uuid",
      "url": "https://meusite.com/webhook",
      "events": ["client.created", "invoice.paid"],
      "status": "active",
      "created_at": "2025-01-01T00:00:00Z"
    }
  ]
}`
          }
        ]
      },
      {
        method: 'POST',
        path: '/api/v1/webhooks',
        description: 'Criar novo webhook',
        auth: true,
        body: [
          { name: 'url', type: 'string', required: true, description: 'URL que receberá os eventos' },
          { name: 'events', type: 'string[]', required: true, description: 'Eventos para escutar' },
          { name: 'secret', type: 'string', required: false, description: 'Secret para validar assinatura' }
        ],
        response: [
          {
            status: 201,
            description: 'Webhook criado',
            example: `{
  "id": "webhook_uuid",
  "url": "https://meusite.com/webhook",
  "events": ["client.created"],
  "secret": "whsec_abc123...",
  "status": "active"
}`
          }
        ]
      },
      {
        method: 'DELETE',
        path: '/api/v1/webhooks/:id',
        description: 'Remover webhook',
        auth: true,
        params: [
          { name: 'id', type: 'uuid', required: true, description: 'ID do webhook' }
        ],
        response: [
          {
            status: 200,
            description: 'Webhook removido',
            example: `{
  "message": "Webhook removido com sucesso"
}`
          }
        ]
      }
    ]
  },
  {
    id: 'invoices',
    title: 'Faturas',
    icon: CreditCard,
    description: 'Gerenciamento de faturas e cobranças',
    endpoints: [
      {
        method: 'GET',
        path: '/api/v1/invoices',
        description: 'Listar faturas',
        auth: true,
        params: [
          { name: 'client_id', type: 'uuid', required: false, description: 'Filtrar por cliente' },
          { name: 'status', type: 'string', required: false, description: 'Status: pending, paid, overdue, cancelled' },
          { name: 'start_date', type: 'ISO8601', required: false, description: 'Data inicial' },
          { name: 'end_date', type: 'ISO8601', required: false, description: 'Data final' }
        ],
        response: [
          {
            status: 200,
            description: 'Lista de faturas',
            example: `{
  "data": [
    {
      "id": "invoice_uuid",
      "client_id": "client_uuid",
      "client_name": "Empresa ABC",
      "amount": 2500.00,
      "status": "pending",
      "due_date": "2025-12-10",
      "items": [
        {
          "description": "Gestão de Redes Sociais",
          "amount": 1500.00
        },
        {
          "description": "Tráfego Pago",
          "amount": 1000.00
        }
      ]
    }
  ]
}`
          }
        ]
      },
      {
        method: 'POST',
        path: '/api/v1/invoices',
        description: 'Criar nova fatura',
        auth: true,
        body: [
          { name: 'client_id', type: 'uuid', required: true, description: 'ID do cliente' },
          { name: 'due_date', type: 'ISO8601', required: true, description: 'Data de vencimento' },
          { name: 'items', type: 'array', required: true, description: 'Itens da fatura' },
          { name: 'notes', type: 'string', required: false, description: 'Observações' }
        ],
        response: [
          {
            status: 201,
            description: 'Fatura criada',
            example: `{
  "id": "invoice_uuid",
  "amount": 2500.00,
  "status": "pending",
  "payment_link": "https://pay.valle360.com/inv_..."
}`
          }
        ]
      }
    ]
  }
];

// Eventos de webhook disponíveis
const WEBHOOK_EVENTS = [
  { event: 'client.created', description: 'Novo cliente cadastrado' },
  { event: 'client.updated', description: 'Cliente atualizado' },
  { event: 'client.deleted', description: 'Cliente removido' },
  { event: 'invoice.created', description: 'Nova fatura criada' },
  { event: 'invoice.paid', description: 'Fatura paga' },
  { event: 'invoice.overdue', description: 'Fatura vencida' },
  { event: 'report.ready', description: 'Relatório pronto para download' },
  { event: 'campaign.started', description: 'Campanha iniciada' },
  { event: 'campaign.ended', description: 'Campanha finalizada' },
  { event: 'alert.triggered', description: 'Alerta de performance acionado' }
];

// =====================================================
// COMPONENTES
// =====================================================

function MethodBadge({ method }: { method: string }) {
  const colors: Record<string, string> = {
    GET: 'bg-green-100 text-green-700',
    POST: 'bg-blue-100 text-blue-700',
    PUT: 'bg-yellow-100 text-yellow-700',
    PATCH: 'bg-amber-100 text-amber-700',
    DELETE: 'bg-red-100 text-red-700'
  };

  return (
    <span className={cn(
      "px-2 py-1 rounded text-xs font-bold uppercase",
      colors[method] || 'bg-gray-100 text-gray-700'
    )}>
      {method}
    </span>
  );
}

function CodeBlock({ code, language = 'json' }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
        <code>{code}</code>
      </pre>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-2 rounded bg-gray-700 hover:bg-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {copied ? (
          <CheckCircle className="w-4 h-4 text-green-400" />
        ) : (
          <Copy className="w-4 h-4 text-gray-400" />
        )}
      </button>
    </div>
  );
}

function EndpointCard({ endpoint }: { endpoint: Endpoint }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
      >
        <MethodBadge method={endpoint.method} />
        <code className="text-sm font-mono text-gray-700 dark:text-gray-300 flex-1 text-left">
          {endpoint.path}
        </code>
        {endpoint.auth && (
          <span title="Requer autenticação">
            <Lock className="w-4 h-4 text-amber-500" />
          </span>
        )}
        <ChevronDown className={cn(
          "w-5 h-5 text-gray-400 transition-transform",
          expanded && "rotate-180"
        )} />
      </button>

      {expanded && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-4 bg-gray-50 dark:bg-gray-800/30">
          <p className="text-gray-600 dark:text-gray-400">{endpoint.description}</p>

          {/* Parâmetros */}
          {endpoint.params && endpoint.params.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm mb-2 text-gray-900 dark:text-white">Parâmetros</h4>
              <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 dark:bg-gray-700">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">Nome</th>
                      <th className="px-3 py-2 text-left font-medium">Tipo</th>
                      <th className="px-3 py-2 text-left font-medium">Obrigatório</th>
                      <th className="px-3 py-2 text-left font-medium">Descrição</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {endpoint.params.map((param) => (
                      <tr key={param.name}>
                        <td className="px-3 py-2 font-mono text-xs">{param.name}</td>
                        <td className="px-3 py-2 text-gray-500">{param.type}</td>
                        <td className="px-3 py-2">
                          {param.required ? (
                            <span className="text-red-500">Sim</span>
                          ) : (
                            <span className="text-gray-400">Não</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{param.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Body */}
          {endpoint.body && endpoint.body.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm mb-2 text-gray-900 dark:text-white">Body (JSON)</h4>
              <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 dark:bg-gray-700">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">Campo</th>
                      <th className="px-3 py-2 text-left font-medium">Tipo</th>
                      <th className="px-3 py-2 text-left font-medium">Obrigatório</th>
                      <th className="px-3 py-2 text-left font-medium">Descrição</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {endpoint.body.map((field) => (
                      <tr key={field.name}>
                        <td className="px-3 py-2 font-mono text-xs">{field.name}</td>
                        <td className="px-3 py-2 text-gray-500">{field.type}</td>
                        <td className="px-3 py-2">
                          {field.required ? (
                            <span className="text-red-500">Sim</span>
                          ) : (
                            <span className="text-gray-400">Não</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{field.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Respostas */}
          <div>
            <h4 className="font-semibold text-sm mb-2 text-gray-900 dark:text-white">Respostas</h4>
            <div className="space-y-3">
              {endpoint.response.map((res, idx) => (
                <div key={idx}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={cn(
                      "px-2 py-0.5 rounded text-xs font-bold",
                      res.status < 300 ? "bg-green-100 text-green-700" :
                      res.status < 400 ? "bg-yellow-100 text-yellow-700" :
                      "bg-red-100 text-red-700"
                    )}>
                      {res.status}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">{res.description}</span>
                  </div>
                  <CodeBlock code={res.example} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =====================================================
// PÁGINA PRINCIPAL
// =====================================================

export default function ApiDocsPage() {
  const [activeSection, setActiveSection] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');

  const CODE_EXAMPLES = {
    curl: `curl -X GET "https://api.valle360.com/v1/clients" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`,
    javascript: `const response = await fetch('https://api.valle360.com/v1/clients', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log(data);`,
    python: `import requests

headers = {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
}

response = requests.get(
    'https://api.valle360.com/v1/clients',
    headers=headers
)

data = response.json()
print(data)`,
    php: `<?php
$ch = curl_init();

curl_setopt_array($ch, [
    CURLOPT_URL => 'https://api.valle360.com/v1/clients',
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer YOUR_API_KEY',
        'Content-Type: application/json'
    ]
]);

$response = curl_exec($ch);
$data = json_decode($response, true);

print_r($data);
?>`
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-[#001533] text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Book className="w-8 h-8 text-[#1672d6]" />
            <h1 className="text-3xl font-bold">Documentação da API</h1>
          </div>
          <p className="text-white/70 max-w-2xl">
            Guia completo para integrar seu sistema com a API do Valle 360. 
            Autenticação, endpoints, exemplos de código e muito mais.
          </p>
          
          {/* Search */}
          <div className="mt-6 relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
            <input
              type="text"
              placeholder="Buscar na documentação..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-[#1672d6]"
            />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="lg:w-64 flex-shrink-0">
            <nav className="sticky top-4 bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Navegação</h3>
              <ul className="space-y-1">
                <li>
                  <button
                    onClick={() => setActiveSection('overview')}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                      activeSection === 'overview'
                        ? "bg-[#1672d6] text-white"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    )}
                  >
                    <Book className="w-4 h-4" />
                    Visão Geral
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveSection('auth-guide')}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                      activeSection === 'auth-guide'
                        ? "bg-[#1672d6] text-white"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    )}
                  >
                    <Key className="w-4 h-4" />
                    Autenticação
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveSection('rate-limits')}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                      activeSection === 'rate-limits'
                        ? "bg-[#1672d6] text-white"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    )}
                  >
                    <Clock className="w-4 h-4" />
                    Rate Limits
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveSection('webhooks-guide')}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                      activeSection === 'webhooks-guide'
                        ? "bg-[#1672d6] text-white"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    )}
                  >
                    <Webhook className="w-4 h-4" />
                    Webhooks
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveSection('errors')}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                      activeSection === 'errors'
                        ? "bg-[#1672d6] text-white"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    )}
                  >
                    <AlertCircle className="w-4 h-4" />
                    Erros
                  </button>
                </li>
                
                <li className="pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
                  <span className="px-3 text-xs font-semibold text-gray-500 uppercase">Endpoints</span>
                </li>
                
                {API_SECTIONS.map((section) => {
                  const Icon = section.icon;
                  return (
                    <li key={section.id}>
                      <button
                        onClick={() => setActiveSection(section.id)}
                        className={cn(
                          "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                          activeSection === section.id
                            ? "bg-[#1672d6] text-white"
                            : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                        )}
                      >
                        <Icon className="w-4 h-4" />
                        {section.title}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 space-y-8">
            {/* Overview Section */}
            {activeSection === 'overview' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Bem-vindo à API do Valle 360
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    A API REST do Valle 360 permite que você integre nossos serviços de marketing 
                    diretamente ao seu sistema. Com ela, você pode gerenciar clientes, acessar 
                    relatórios de performance, configurar webhooks e muito mais.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                      <Globe className="w-8 h-8 text-blue-500 mb-2" />
                      <h3 className="font-semibold text-gray-900 dark:text-white">Base URL</h3>
                      <code className="text-sm text-blue-600">https://api.valle360.com/v1</code>
                    </div>
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                      <Shield className="w-8 h-8 text-green-500 mb-2" />
                      <h3 className="font-semibold text-gray-900 dark:text-white">Segurança</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">HTTPS obrigatório</p>
                    </div>
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                      <FileJson className="w-8 h-8 text-purple-500 mb-2" />
                      <h3 className="font-semibold text-gray-900 dark:text-white">Formato</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">JSON (UTF-8)</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Exemplo Rápido
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">cURL</h4>
                      <CodeBlock code={CODE_EXAMPLES.curl} language="bash" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">JavaScript</h4>
                      <CodeBlock code={CODE_EXAMPLES.javascript} language="javascript" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Python</h4>
                      <CodeBlock code={CODE_EXAMPLES.python} language="python" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">PHP</h4>
                      <CodeBlock code={CODE_EXAMPLES.php} language="php" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Authentication Guide */}
            {activeSection === 'auth-guide' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Autenticação
                  </h2>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Métodos de Autenticação
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        A API suporta dois métodos de autenticação:
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl">
                          <h4 className="font-semibold flex items-center gap-2 mb-2">
                            <Key className="w-5 h-5 text-[#1672d6]" />
                            API Key
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            Recomendado para integrações server-side. A API Key nunca expira 
                            automaticamente (a menos que você defina uma data de expiração).
                          </p>
                          <CodeBlock code={`Authorization: Bearer valle_sk_live_abc123...`} />
                        </div>
                        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl">
                          <h4 className="font-semibold flex items-center gap-2 mb-2">
                            <Lock className="w-5 h-5 text-[#1672d6]" />
                            JWT Token
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            Recomendado para aplicações frontend. O token expira em 1 hora 
                            e pode ser renovado com o refresh token.
                          </p>
                          <CodeBlock code={`Authorization: Bearer eyJhbGciOiJIUzI1...`} />
                        </div>
                      </div>
                    </div>

                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-4">
                      <div className="flex gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-amber-800 dark:text-amber-200">Importante</h4>
                          <p className="text-sm text-amber-700 dark:text-amber-300">
                            Nunca exponha sua API Key em código client-side. Use variáveis de ambiente 
                            e sempre faça chamadas à API através de seu backend.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Escopos de Permissão
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        As API Keys podem ter escopos limitados para maior segurança:
                      </p>
                      
                      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700">
                              <th className="text-left py-2 font-semibold">Escopo</th>
                              <th className="text-left py-2 font-semibold">Descrição</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            <tr>
                              <td className="py-2 font-mono text-xs">clients:read</td>
                              <td className="py-2 text-gray-600 dark:text-gray-400">Leitura de dados de clientes</td>
                            </tr>
                            <tr>
                              <td className="py-2 font-mono text-xs">clients:write</td>
                              <td className="py-2 text-gray-600 dark:text-gray-400">Criação e edição de clientes</td>
                            </tr>
                            <tr>
                              <td className="py-2 font-mono text-xs">reports:read</td>
                              <td className="py-2 text-gray-600 dark:text-gray-400">Acesso a relatórios</td>
                            </tr>
                            <tr>
                              <td className="py-2 font-mono text-xs">invoices:read</td>
                              <td className="py-2 text-gray-600 dark:text-gray-400">Leitura de faturas</td>
                            </tr>
                            <tr>
                              <td className="py-2 font-mono text-xs">invoices:write</td>
                              <td className="py-2 text-gray-600 dark:text-gray-400">Criação de faturas</td>
                            </tr>
                            <tr>
                              <td className="py-2 font-mono text-xs">webhooks:manage</td>
                              <td className="py-2 text-gray-600 dark:text-gray-400">Gerenciamento de webhooks</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Rate Limits */}
            {activeSection === 'rate-limits' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Rate Limits
                  </h2>
                  
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Para garantir a estabilidade do serviço, aplicamos limites de requisições por período.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl text-center">
                      <p className="text-3xl font-bold text-[#1672d6]">1000</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">requisições/minuto</p>
                      <p className="text-xs text-gray-500">Plano Enterprise</p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl text-center">
                      <p className="text-3xl font-bold text-[#1672d6]">500</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">requisições/minuto</p>
                      <p className="text-xs text-gray-500">Plano Premium</p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl text-center">
                      <p className="text-3xl font-bold text-[#1672d6]">100</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">requisições/minuto</p>
                      <p className="text-xs text-gray-500">Plano Basic</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Headers de Rate Limit
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Todas as respostas incluem headers com informações sobre seu limite:
                    </p>
                    <CodeBlock code={`X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 987
X-RateLimit-Reset: 1733407200`} />
                  </div>

                  <div className="mt-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl p-4">
                    <h4 className="font-semibold text-red-800 dark:text-red-200 mb-2">
                      Resposta quando limite excedido (429)
                    </h4>
                    <CodeBlock code={`{
  "error": "rate_limit_exceeded",
  "message": "Limite de requisições excedido",
  "retry_after": 45
}`} />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Webhooks Guide */}
            {activeSection === 'webhooks-guide' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Webhooks
                  </h2>
                  
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Webhooks permitem que sua aplicação receba notificações em tempo real 
                    quando eventos ocorrem no Valle 360.
                  </p>

                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Eventos Disponíveis
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {WEBHOOK_EVENTS.map((item) => (
                        <div key={item.event} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                          <code className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                            {item.event}
                          </code>
                          <span className="text-sm text-gray-600 dark:text-gray-400">{item.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Formato do Payload
                    </h3>
                    <CodeBlock code={`{
  "id": "evt_123abc",
  "type": "client.created",
  "created_at": "2025-12-05T10:00:00Z",
  "data": {
    "id": "client_uuid",
    "name": "Empresa ABC",
    "email": "contato@abc.com"
  }
}`} />
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Validação de Assinatura
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Valide a assinatura HMAC-SHA256 para garantir que o webhook veio do Valle 360:
                    </p>
                    <CodeBlock code={`const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return signature === \`sha256=\${expectedSignature}\`;
}

// Uso no endpoint
app.post('/webhook', (req, res) => {
  const signature = req.headers['x-valle360-signature'];
  const isValid = verifyWebhookSignature(
    JSON.stringify(req.body),
    signature,
    process.env.WEBHOOK_SECRET
  );
  
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  // Processar evento...
  res.status(200).json({ received: true });
});`} language="javascript" />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Errors */}
            {activeSection === 'errors' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Códigos de Erro
                  </h2>
                  
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    A API utiliza códigos HTTP padrão e retorna erros em formato JSON consistente.
                  </p>

                  <div className="space-y-4">
                    <div className="p-4 border-l-4 border-green-500 bg-green-50 dark:bg-green-900/20 rounded-r-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-green-700">2xx</span>
                        <span className="text-green-600">Sucesso</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">A requisição foi processada com sucesso.</p>
                    </div>
                    
                    <div className="p-4 border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 rounded-r-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-yellow-700">4xx</span>
                        <span className="text-yellow-600">Erro do Cliente</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Há um problema com a requisição enviada.</p>
                    </div>
                    
                    <div className="p-4 border-l-4 border-red-500 bg-red-50 dark:bg-red-900/20 rounded-r-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-red-700">5xx</span>
                        <span className="text-red-600">Erro do Servidor</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Algo deu errado no servidor. Tente novamente.</p>
                    </div>
                  </div>

                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Códigos Comuns
                    </h3>
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-100 dark:bg-gray-800">
                          <tr>
                            <th className="px-4 py-3 text-left font-semibold">Código</th>
                            <th className="px-4 py-3 text-left font-semibold">Erro</th>
                            <th className="px-4 py-3 text-left font-semibold">Descrição</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          <tr>
                            <td className="px-4 py-3 font-mono">400</td>
                            <td className="px-4 py-3">bad_request</td>
                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400">Parâmetros inválidos ou faltando</td>
                          </tr>
                          <tr>
                            <td className="px-4 py-3 font-mono">401</td>
                            <td className="px-4 py-3">unauthorized</td>
                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400">Token inválido ou expirado</td>
                          </tr>
                          <tr>
                            <td className="px-4 py-3 font-mono">403</td>
                            <td className="px-4 py-3">forbidden</td>
                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400">Sem permissão para este recurso</td>
                          </tr>
                          <tr>
                            <td className="px-4 py-3 font-mono">404</td>
                            <td className="px-4 py-3">not_found</td>
                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400">Recurso não encontrado</td>
                          </tr>
                          <tr>
                            <td className="px-4 py-3 font-mono">422</td>
                            <td className="px-4 py-3">validation_error</td>
                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400">Erro de validação nos dados</td>
                          </tr>
                          <tr>
                            <td className="px-4 py-3 font-mono">429</td>
                            <td className="px-4 py-3">rate_limit_exceeded</td>
                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400">Limite de requisições excedido</td>
                          </tr>
                          <tr>
                            <td className="px-4 py-3 font-mono">500</td>
                            <td className="px-4 py-3">internal_error</td>
                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400">Erro interno do servidor</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Formato de Erro
                    </h3>
                    <CodeBlock code={`{
  "error": "validation_error",
  "message": "Erro de validação nos dados enviados",
  "details": [
    {
      "field": "email",
      "message": "Email inválido"
    },
    {
      "field": "name",
      "message": "Nome é obrigatório"
    }
  ],
  "request_id": "req_abc123"
}`} />
                  </div>
                </div>
              </motion.div>
            )}

            {/* API Sections */}
            {API_SECTIONS.map((section) => (
              activeSection === section.id && (
                <motion.div
                  key={section.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-[#1672d6]/10 rounded-lg">
                        <section.icon className="w-6 h-6 text-[#1672d6]" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                          {section.title}
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400">{section.description}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      {section.endpoints.map((endpoint, idx) => (
                        <EndpointCard key={idx} endpoint={endpoint} />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )
            ))}
          </main>
        </div>
      </div>
    </div>
  );
}


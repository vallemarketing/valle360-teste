# VALLE 360 - DOCUMENTAÇÃO COMPLETA DO SISTEMA
## PARTE 3A: ENDPOINTS DE API NECESSÁRIOS

---

## 📡 CONVENÇÕES DE API

### Base URL
```
Production: https://api.valle360.com/v1
Development: http://localhost:3000/api/v1
```

### Autenticação
Todos os endpoints (exceto login/registro) requerem autenticação via JWT:
```
Authorization: Bearer {jwt_token}
```

### Headers Padrão
```http
Content-Type: application/json
Accept: application/json
Authorization: Bearer {jwt_token}
```

### Códigos de Status HTTP
```
200 - OK (Sucesso)
201 - Created (Criado com sucesso)
204 - No Content (Sucesso sem conteúdo)
400 - Bad Request (Requisição inválida)
401 - Unauthorized (Não autenticado)
403 - Forbidden (Sem permissão)
404 - Not Found (Não encontrado)
422 - Unprocessable Entity (Validação falhou)
500 - Internal Server Error (Erro no servidor)
```

### Formato de Resposta Padrão
```json
{
  "success": true,
  "data": {},
  "message": "Operação realizada com sucesso",
  "meta": {
    "timestamp": "2025-11-12T10:00:00Z",
    "version": "1.0"
  }
}
```

### Formato de Erro Padrão
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dados inválidos",
    "details": [
      {
        "field": "email",
        "message": "Email é obrigatório"
      }
    ]
  },
  "meta": {
    "timestamp": "2025-11-12T10:00:00Z"
  }
}
```

### Paginação Padrão
```
Query params:
  ?page=1
  &limit=20
  &sort=created_at
  &order=desc

Response:
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

## 1. MÓDULO DE AUTENTICAÇÃO

### 1.1 POST /auth/register
**Descrição**: Registrar novo usuário (cliente)

**Request Body:**
```json
{
  "email": "cliente@example.com",
  "password": "SenhaForte123!",
  "full_name": "João Silva",
  "phone": "+5511999999999",
  "company_name": "Empresa XYZ"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "cliente@example.com",
      "full_name": "João Silva",
      "user_type": "client"
    },
    "token": "jwt_token_here",
    "refresh_token": "refresh_token_here"
  }
}
```

---

### 1.2 POST /auth/login
**Descrição**: Login de usuário

**Request Body:**
```json
{
  "email": "usuario@example.com",
  "password": "senha123"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "usuario@example.com",
      "full_name": "João Silva",
      "user_type": "client",
      "avatar_url": "https://...",
      "client_id": "uuid",
      "permissions": []
    },
    "token": "jwt_token_here",
    "refresh_token": "refresh_token_here",
    "expires_at": "2025-11-13T10:00:00Z"
  }
}
```

---

### 1.3 POST /auth/logout
**Descrição**: Logout do usuário

**Request Body:**
```json
{
  "refresh_token": "refresh_token_here"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Logout realizado com sucesso"
}
```

---

### 1.4 POST /auth/refresh-token
**Descrição**: Renovar token de acesso

**Request Body:**
```json
{
  "refresh_token": "refresh_token_here"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "token": "new_jwt_token",
    "refresh_token": "new_refresh_token",
    "expires_at": "2025-11-13T10:00:00Z"
  }
}
```

---

### 1.5 POST /auth/forgot-password
**Descrição**: Solicitar reset de senha

**Request Body:**
```json
{
  "email": "usuario@example.com"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Email de recuperação enviado"
}
```

---

### 1.6 POST /auth/reset-password
**Descrição**: Resetar senha com token

**Request Body:**
```json
{
  "token": "reset_token",
  "password": "NovaSenha123!",
  "password_confirmation": "NovaSenha123!"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Senha alterada com sucesso"
}
```

---

### 1.7 GET /auth/me
**Descrição**: Obter dados do usuário autenticado

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "usuario@example.com",
    "full_name": "João Silva",
    "display_name": "João",
    "avatar_url": "https://...",
    "user_type": "client",
    "is_active": true,
    "client_id": "uuid",
    "theme": "light",
    "language": "pt",
    "permissions": [],
    "created_at": "2025-01-01T00:00:00Z",
    "last_login_at": "2025-11-12T09:00:00Z"
  }
}
```

---

### 1.8 PATCH /auth/me
**Descrição**: Atualizar dados do perfil

**Request Body:**
```json
{
  "full_name": "João Silva Santos",
  "display_name": "João Santos",
  "phone": "+5511988888888",
  "avatar_url": "https://..."
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "full_name": "João Silva Santos",
    "updated_at": "2025-11-12T10:00:00Z"
  }
}
```

---

### 1.9 POST /auth/change-password
**Descrição**: Alterar senha (usuário autenticado)

**Request Body:**
```json
{
  "current_password": "SenhaAtual123",
  "new_password": "NovaSenha123!",
  "new_password_confirmation": "NovaSenha123!"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Senha alterada com sucesso"
}
```

---

## 2. MÓDULO DE CLIENTES

### 2.1 GET /clients
**Descrição**: Listar clientes (admin/gestores)

**Query Params:**
```
?page=1
&limit=20
&search=nome
&is_active=true
&sort=created_at
&order=desc
```

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Cliente ABC",
      "email": "cliente@abc.com",
      "phone": "+5511999999999",
      "company_name": "ABC Ltda",
      "is_active": true,
      "instagram": "@clienteabc",
      "account_manager": {
        "id": "uuid",
        "full_name": "Maria Gestora"
      },
      "referral_count": 3,
      "created_at": "2025-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

---

### 2.2 GET /clients/:id
**Descrição**: Obter detalhes de um cliente

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Cliente ABC",
    "email": "cliente@abc.com",
    "phone": "+5511999999999",
    "company_name": "ABC Ltda",
    "instagram": "@clienteabc",
    "facebook": "facebook.com/abc",
    "linkedin": "linkedin.com/company/abc",
    "website": "https://abc.com",
    "is_active": true,
    "account_manager": {
      "id": "uuid",
      "full_name": "Maria Gestora",
      "email": "maria@valle360.com"
    },
    "referred_by": {
      "id": "uuid",
      "name": "Cliente Indicador"
    },
    "referral_count": 3,
    "current_credit_balance": 5000.00,
    "active_contracts": 2,
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-11-12T10:00:00Z",
    "metadata": {}
  }
}
```

---

### 2.3 POST /clients
**Descrição**: Criar novo cliente (admin)

**Request Body:**
```json
{
  "name": "Novo Cliente",
  "email": "novo@cliente.com",
  "phone": "+5511999999999",
  "company_name": "Novo Cliente Ltda",
  "instagram": "@novocliente",
  "facebook": "facebook.com/novo",
  "account_manager_id": "uuid"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Novo Cliente",
    "email": "novo@cliente.com",
    "created_at": "2025-11-12T10:00:00Z"
  }
}
```

---

### 2.4 PATCH /clients/:id
**Descrição**: Atualizar dados do cliente

**Request Body:**
```json
{
  "name": "Cliente ABC Updated",
  "phone": "+5511988888888",
  "instagram": "@clienteabc_new",
  "is_active": true
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Cliente ABC Updated",
    "updated_at": "2025-11-12T10:00:00Z"
  }
}
```

---

### 2.5 DELETE /clients/:id
**Descrição**: Desativar cliente (soft delete)

**Response 200:**
```json
{
  "success": true,
  "message": "Cliente desativado com sucesso"
}
```

---

### 2.6 GET /clients/:id/extended-profile
**Descrição**: Obter perfil estendido do cliente

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "cpf_cnpj": "12.345.678/0001-90",
    "birth_date": "1985-05-15",
    "company_name": "ABC Ltda",
    "business_sector": "Tecnologia",
    "phone_commercial": "+5511333333333",
    "phone_mobile": "+5511999999999",
    "address_zip": "01310-100",
    "address_street": "Av Paulista",
    "address_number": "1000",
    "address_city": "São Paulo",
    "address_state": "SP",
    "social_instagram": "@clienteabc",
    "additional_contacts": [
      {
        "name": "José Silva",
        "position": "Gerente",
        "email": "jose@abc.com",
        "phone": "+5511988888888"
      }
    ],
    "documents": [
      {
        "type": "rg",
        "name": "RG Frente",
        "url": "https://...",
        "uploaded_at": "2025-01-10T00:00:00Z"
      }
    ]
  }
}
```

---

### 2.7 PATCH /clients/:id/extended-profile
**Descrição**: Atualizar perfil estendido

**Request Body:**
```json
{
  "cpf_cnpj": "12.345.678/0001-90",
  "business_sector": "Tecnologia",
  "address_zip": "01310-100",
  "address_street": "Av Paulista",
  "address_number": "1000",
  "address_city": "São Paulo",
  "address_state": "SP",
  "additional_contacts": [...]
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "updated_at": "2025-11-12T10:00:00Z"
  }
}
```

---

### 2.8 GET /clients/:id/contracts
**Descrição**: Listar contratos do cliente

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "client_id": "uuid",
      "contract_number": "CONT-2025-001",
      "contract_type": "Mensal",
      "start_date": "2025-01-01",
      "end_date": null,
      "renewal_date": "2025-12-31",
      "monthly_value": 5000.00,
      "currency": "BRL",
      "status": "active",
      "services_included": [
        "Redes Sociais",
        "Tráfego Pago"
      ],
      "departments": ["social_media", "traffic"],
      "pdf_url": "https://...",
      "signed_pdf_url": "https://...",
      "is_current": true,
      "created_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```

---

### 2.9 POST /clients/:id/contracts
**Descrição**: Criar novo contrato

**Request Body:**
```json
{
  "contract_number": "CONT-2025-002",
  "contract_type": "Anual",
  "start_date": "2025-01-01",
  "monthly_value": 5000.00,
  "services_included": ["Redes Sociais", "Design"],
  "departments": ["social_media", "design"],
  "pdf_url": "https://..."
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "contract_number": "CONT-2025-002",
    "created_at": "2025-11-12T10:00:00Z"
  }
}
```

---

### 2.10 GET /clients/:id/referrals
**Descrição**: Obter indicações do cliente

**Response 200:**
```json
{
  "success": true,
  "data": {
    "referral_count": 3,
    "referrals": [
      {
        "id": "uuid",
        "referred_client": {
          "id": "uuid",
          "name": "Cliente Indicado 1",
          "email": "indicado1@example.com"
        },
        "status": "active",
        "benefit_granted": true,
        "benefit_description": "10% de desconto",
        "created_at": "2025-03-15T00:00:00Z"
      }
    ]
  }
}
```

---

## 3. MÓDULO DE CRÉDITOS

### 3.1 GET /clients/:id/credits/balance
**Descrição**: Obter saldo de créditos

**Response 200:**
```json
{
  "success": true,
  "data": {
    "client_id": "uuid",
    "current_balance": 8500.00,
    "total_purchased": 50000.00,
    "total_used": 41500.00,
    "last_transaction_at": "2025-11-10T15:00:00Z",
    "low_balance_alert": false,
    "estimated_days_remaining": 42
  }
}
```

---

### 3.2 GET /clients/:id/credits/transactions
**Descrição**: Histórico de transações de créditos

**Query Params:**
```
?page=1
&limit=20
&type=recharge|usage
&start_date=2025-01-01
&end_date=2025-12-31
```

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "transaction_type": "usage",
      "description": "Campanha Instagram Ads - Novembro",
      "amount": -1200.00,
      "balance_after": 8500.00,
      "reference_type": "ad_campaign",
      "reference_id": "uuid",
      "created_at": "2025-11-10T15:00:00Z"
    },
    {
      "id": "uuid",
      "transaction_type": "recharge",
      "description": "Compra de créditos",
      "amount": 5000.00,
      "balance_after": 9700.00,
      "created_at": "2025-11-01T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45
  }
}
```

---

### 3.3 POST /clients/:id/credits/recharge
**Descrição**: Adicionar créditos (admin ou via pagamento)

**Request Body:**
```json
{
  "amount": 5000.00,
  "description": "Recarga de créditos - Novembro",
  "payment_method": "pix",
  "transaction_id": "PIX_123456"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "amount": 5000.00,
    "balance_after": 13500.00,
    "created_at": "2025-11-12T10:00:00Z"
  }
}
```

---

### 3.4 POST /clients/:id/credits/usage
**Descrição**: Registrar uso de créditos (admin)

**Request Body:**
```json
{
  "amount": 1200.00,
  "description": "Campanha Facebook Ads",
  "reference_type": "ad_campaign",
  "reference_id": "uuid"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "amount": -1200.00,
    "balance_after": 7300.00,
    "created_at": "2025-11-12T10:00:00Z"
  }
}
```

---

## 4. MÓDULO DE PRODUÇÃO E APROVAÇÕES

### 4.1 GET /production-items
**Descrição**: Listar itens de produção

**Query Params:**
```
?page=1
&limit=20
&client_id=uuid
&status=pending_approval|approved|rejected
&item_type=post_instagram|video|banner
&assigned_to=uuid
&due_date_from=2025-11-01
&due_date_to=2025-11-30
```

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "client_id": "uuid",
      "client_name": "Cliente ABC",
      "title": "Post Instagram - Promoção Black Friday",
      "description": "Arte promocional",
      "item_type": "post_instagram",
      "file_url": "https://...",
      "preview_url": "https://...",
      "thumbnail_url": "https://...",
      "status": "pending_approval",
      "created_by": {
        "id": "uuid",
        "full_name": "Designer João"
      },
      "assigned_to": {
        "id": "uuid",
        "full_name": "Social Media Maria"
      },
      "due_date": "2025-11-15T23:59:59Z",
      "revision_count": 0,
      "comments_count": 2,
      "created_at": "2025-11-10T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 35
  }
}
```

---

### 4.2 GET /production-items/:id
**Descrição**: Obter detalhes de um item

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "client_id": "uuid",
    "title": "Post Instagram - Promoção",
    "description": "Arte promocional com desconto de 40%",
    "item_type": "post_instagram",
    "file_url": "https://...",
    "preview_url": "https://...",
    "status": "pending_approval",
    "created_by": {
      "id": "uuid",
      "full_name": "Designer João",
      "avatar_url": "https://..."
    },
    "assigned_to": {
      "id": "uuid",
      "full_name": "Social Media Maria"
    },
    "due_date": "2025-11-15T23:59:59Z",
    "approved_by": null,
    "approved_at": null,
    "rejection_reason": null,
    "revision_count": 0,
    "scheduled_publish_date": null,
    "metadata": {},
    "created_at": "2025-11-10T10:00:00Z",
    "updated_at": "2025-11-10T10:00:00Z"
  }
}
```

---

### 4.3 POST /production-items
**Descrição**: Criar novo item de produção

**Request Body:**
```json
{
  "client_id": "uuid",
  "title": "Banner Site - Lançamento",
  "description": "Banner principal para homepage",
  "item_type": "banner",
  "file_url": "https://...",
  "preview_url": "https://...",
  "assigned_to": "uuid",
  "due_date": "2025-11-20T23:59:59Z"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Banner Site - Lançamento",
    "status": "pending_approval",
    "created_at": "2025-11-12T10:00:00Z"
  }
}
```

---

### 4.4 PATCH /production-items/:id
**Descrição**: Atualizar item de produção

**Request Body:**
```json
{
  "title": "Título Atualizado",
  "description": "Nova descrição",
  "file_url": "https://...",
  "due_date": "2025-11-25T23:59:59Z"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "updated_at": "2025-11-12T10:00:00Z"
  }
}
```

---

### 4.5 POST /production-items/:id/approve
**Descrição**: Aprovar item (cliente)

**Request Body:**
```json
{
  "comments": "Aprovado! Ficou perfeito!"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "approved",
    "approved_by": "uuid",
    "approved_at": "2025-11-12T10:00:00Z"
  }
}
```

---

### 4.6 POST /production-items/:id/reject
**Descrição**: Rejeitar item (cliente)

**Request Body:**
```json
{
  "rejection_reason": "Cores não estão de acordo com a identidade visual. Por favor ajustar para usar o azul da marca (#2b7de9).",
  "comments": "Precisa de ajustes"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "rejected",
    "rejection_reason": "Cores não estão de acordo...",
    "revision_count": 1,
    "updated_at": "2025-11-12T10:00:00Z"
  }
}
```

---

### 4.7 GET /production-items/:id/comments
**Descrição**: Obter comentários do item

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "user": {
        "id": "uuid",
        "full_name": "Cliente João",
        "avatar_url": "https://..."
      },
      "content": "Poderia aumentar o tamanho da logo?",
      "comment_type": "feedback",
      "parent_comment_id": null,
      "attachments": [],
      "created_at": "2025-11-11T14:00:00Z"
    }
  ]
}
```

---

### 4.8 POST /production-items/:id/comments
**Descrição**: Adicionar comentário

**Request Body:**
```json
{
  "content": "Logo aumentada conforme solicitado!",
  "comment_type": "note",
  "parent_comment_id": "uuid",
  "attachments": []
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "content": "Logo aumentada conforme solicitado!",
    "created_at": "2025-11-12T10:00:00Z"
  }
}
```

---

*Continua na PARTE 3B...*


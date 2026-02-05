# VALLE 360 - DOCUMENTAÇÃO COMPLETA DO SISTEMA
## PARTE 3B: ENDPOINTS DE API - KANBAN E MENSAGENS

---

## 5. MÓDULO KANBAN

### 5.1 GET /kanban/boards
**Descrição**: Listar quadros Kanban

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Projetos Valle 360",
      "description": "Quadro principal de projetos",
      "department": "geral",
      "is_public": true,
      "created_by": {
        "id": "uuid",
        "full_name": "Admin"
      },
      "columns_count": 4,
      "tasks_count": 35,
      "created_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```

---

### 5.2 GET /kanban/boards/:id
**Descrição**: Obter detalhes do quadro com colunas e tarefas

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Projetos Valle 360",
    "description": "Quadro principal",
    "department": "geral",
    "columns": [
      {
        "id": "uuid",
        "name": "Backlog",
        "position": 0,
        "color": "#94a3b8",
        "wip_limit": null,
        "tasks": [
          {
            "id": "uuid",
            "title": "Criar posts para Instagram",
            "description": "3 posts sobre o novo produto",
            "position": 0,
            "assigned_to": [
              {
                "id": "uuid",
                "full_name": "Social Media Maria",
                "avatar_url": "https://..."
              }
            ],
            "priority": "alta",
            "due_date": "2025-11-20T23:59:59Z",
            "tags": ["instagram", "urgente"],
            "label_ids": ["uuid"],
            "comments_count": 3,
            "attachments_count": 1,
            "client": {
              "id": "uuid",
              "name": "Cliente ABC"
            },
            "created_at": "2025-11-10T10:00:00Z"
          }
        ]
      },
      {
        "id": "uuid",
        "name": "Em Produção",
        "position": 1,
        "color": "#3b82f6",
        "wip_limit": 5,
        "tasks": []
      }
    ],
    "labels": [
      {
        "id": "uuid",
        "name": "Urgente",
        "color": "#ef4444"
      }
    ]
  }
}
```

---

### 5.3 POST /kanban/boards
**Descrição**: Criar novo quadro

**Request Body:**
```json
{
  "name": "Novo Projeto",
  "description": "Descrição do projeto",
  "department": "social_media",
  "is_public": true,
  "allowed_roles": ["social_media", "designer"]
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Novo Projeto",
    "created_at": "2025-11-12T10:00:00Z"
  }
}
```

---

### 5.4 POST /kanban/columns
**Descrição**: Criar nova coluna

**Request Body:**
```json
{
  "board_id": "uuid",
  "name": "Review",
  "description": "Em revisão",
  "position": 2,
  "color": "#f59e0b",
  "wip_limit": 3
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Review",
    "created_at": "2025-11-12T10:00:00Z"
  }
}
```

---

### 5.5 POST /kanban/tasks
**Descrição**: Criar nova tarefa

**Request Body:**
```json
{
  "board_id": "uuid",
  "column_id": "uuid",
  "title": "Criar vídeo institucional",
  "description": "Vídeo de 30 segundos sobre a empresa",
  "assigned_to": ["uuid_user1", "uuid_user2"],
  "client_id": "uuid",
  "priority": "alta",
  "due_date": "2025-11-25T23:59:59Z",
  "tags": ["video", "marketing"],
  "label_ids": ["uuid_label"],
  "checklist": [
    {
      "id": "1",
      "text": "Roteiro aprovado",
      "completed": false
    },
    {
      "id": "2",
      "text": "Gravar cenas",
      "completed": false
    }
  ]
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Criar vídeo institucional",
    "column_id": "uuid",
    "position": 0,
    "created_at": "2025-11-12T10:00:00Z"
  }
}
```

---

### 5.6 PATCH /kanban/tasks/:id
**Descrição**: Atualizar tarefa

**Request Body:**
```json
{
  "title": "Título atualizado",
  "description": "Nova descrição",
  "assigned_to": ["uuid"],
  "priority": "urgente",
  "due_date": "2025-11-30T23:59:59Z",
  "tags": ["video", "urgente"]
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

### 5.7 PATCH /kanban/tasks/:id/move
**Descrição**: Mover tarefa entre colunas

**Request Body:**
```json
{
  "column_id": "uuid_nova_coluna",
  "position": 2
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "column_id": "uuid_nova_coluna",
    "position": 2,
    "updated_at": "2025-11-12T10:00:00Z"
  }
}
```

---

### 5.8 POST /kanban/tasks/:id/comments
**Descrição**: Adicionar comentário à tarefa

**Request Body:**
```json
{
  "content": "Roteiro aprovado pelo cliente!",
  "parent_comment_id": null
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "content": "Roteiro aprovado pelo cliente!",
    "user": {
      "id": "uuid",
      "full_name": "João Silva"
    },
    "created_at": "2025-11-12T10:00:00Z"
  }
}
```

---

### 5.9 GET /kanban/tasks/:id/history
**Descrição**: Obter histórico de mudanças da tarefa

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "action_type": "moved",
      "user": {
        "id": "uuid",
        "full_name": "Maria Silva"
      },
      "old_value": {
        "column_name": "Backlog"
      },
      "new_value": {
        "column_name": "Em Produção"
      },
      "created_at": "2025-11-12T09:00:00Z"
    }
  ]
}
```

---

### 5.10 POST /kanban/tasks/:id/attachments
**Descrição**: Adicionar anexo à tarefa

**Request Body (multipart/form-data):**
```
file: [arquivo]
description: "Briefing do projeto"
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "briefing.pdf",
    "url": "https://...",
    "size": 245678,
    "type": "application/pdf",
    "created_at": "2025-11-12T10:00:00Z"
  }
}
```

---

## 6. MÓDULO DE MENSAGENS

### 6.1 GET /messages/groups
**Descrição**: Listar grupos de mensagens do usuário

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Geral - Valle 360",
      "description": "Grupo geral da equipe",
      "group_type": "general",
      "avatar_url": "https://...",
      "is_private": false,
      "member_count": 25,
      "unread_count": 3,
      "last_message": {
        "id": "uuid",
        "sender": {
          "id": "uuid",
          "full_name": "João Silva"
        },
        "content": "Boa tarde, pessoal!",
        "created_at": "2025-11-12T14:00:00Z"
      },
      "last_message_at": "2025-11-12T14:00:00Z",
      "my_role": "member",
      "is_muted": false
    }
  ]
}
```

---

### 6.2 GET /messages/groups/:id
**Descrição**: Obter detalhes do grupo

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Geral - Valle 360",
    "description": "Grupo geral da equipe",
    "group_type": "general",
    "avatar_url": "https://...",
    "is_private": false,
    "created_by": {
      "id": "uuid",
      "full_name": "Admin"
    },
    "members": [
      {
        "id": "uuid",
        "user": {
          "id": "uuid",
          "full_name": "João Silva",
          "avatar_url": "https://..."
        },
        "role": "admin",
        "is_active": true,
        "unread_count": 0,
        "last_read_at": "2025-11-12T14:00:00Z",
        "joined_at": "2025-01-01T00:00:00Z"
      }
    ],
    "pinned_messages": [],
    "settings": {},
    "created_at": "2025-01-01T00:00:00Z"
  }
}
```

---

### 6.3 POST /messages/groups
**Descrição**: Criar novo grupo

**Request Body:**
```json
{
  "name": "Projeto Cliente ABC",
  "description": "Discussões sobre o projeto",
  "group_type": "project",
  "is_private": false,
  "project_id": "uuid",
  "client_id": "uuid",
  "member_ids": ["uuid1", "uuid2", "uuid3"]
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Projeto Cliente ABC",
    "created_at": "2025-11-12T10:00:00Z"
  }
}
```

---

### 6.4 GET /messages/groups/:id/messages
**Descrição**: Obter mensagens do grupo (com paginação infinita)

**Query Params:**
```
?limit=50
&before_id=uuid  // Para carregar mensagens anteriores
&after_id=uuid   // Para carregar mensagens novas
```

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "group_id": "uuid",
      "sender": {
        "id": "uuid",
        "full_name": "João Silva",
        "avatar_url": "https://..."
      },
      "content": "Olá pessoal! Como está o projeto?",
      "message_type": "text",
      "attachments": [],
      "reply_to": null,
      "is_edited": false,
      "is_deleted": false,
      "is_pinned": false,
      "reactions": {
        "👍": ["uuid1", "uuid2"],
        "❤️": ["uuid3"]
      },
      "created_at": "2025-11-12T10:00:00Z"
    }
  ],
  "pagination": {
    "has_more": true,
    "oldest_id": "uuid",
    "newest_id": "uuid"
  }
}
```

---

### 6.5 POST /messages/groups/:id/messages
**Descrição**: Enviar mensagem no grupo

**Request Body:**
```json
{
  "content": "Mensagem para o grupo!",
  "message_type": "text",
  "reply_to": "uuid_mensagem_original",
  "attachments": [
    {
      "name": "arquivo.pdf",
      "url": "https://...",
      "size": 123456,
      "type": "application/pdf"
    }
  ]
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "group_id": "uuid",
    "content": "Mensagem para o grupo!",
    "sender": {
      "id": "uuid",
      "full_name": "João Silva"
    },
    "created_at": "2025-11-12T10:00:00Z"
  }
}
```

---

### 6.6 PATCH /messages/:id
**Descrição**: Editar mensagem

**Request Body:**
```json
{
  "content": "Mensagem editada"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "content": "Mensagem editada",
    "is_edited": true,
    "edited_at": "2025-11-12T10:05:00Z"
  }
}
```

---

### 6.7 DELETE /messages/:id
**Descrição**: Deletar mensagem (soft delete)

**Response 200:**
```json
{
  "success": true,
  "message": "Mensagem deletada"
}
```

---

### 6.8 POST /messages/:id/reactions
**Descrição**: Adicionar reação à mensagem

**Request Body:**
```json
{
  "emoji": "👍"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "message_id": "uuid",
    "emoji": "👍",
    "user_id": "uuid"
  }
}
```

---

### 6.9 DELETE /messages/:id/reactions/:emoji
**Descrição**: Remover reação

**Response 200:**
```json
{
  "success": true,
  "message": "Reação removida"
}
```

---

### 6.10 POST /messages/:id/pin
**Descrição**: Fixar mensagem

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "is_pinned": true,
    "pinned_at": "2025-11-12T10:00:00Z"
  }
}
```

---

### 6.11 GET /messages/direct-conversations
**Descrição**: Listar conversas diretas do usuário

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "other_user": {
        "id": "uuid",
        "full_name": "Maria Santos",
        "avatar_url": "https://...",
        "user_type": "social_media",
        "is_online": true,
        "last_seen_at": "2025-11-12T10:00:00Z"
      },
      "is_client_conversation": false,
      "unread_count": 2,
      "last_message": {
        "content": "Podemos conversar sobre o projeto?",
        "created_at": "2025-11-12T09:30:00Z"
      },
      "last_message_at": "2025-11-12T09:30:00Z",
      "is_muted": false
    }
  ]
}
```

---

### 6.12 POST /messages/direct-conversations
**Descrição**: Iniciar conversa direta

**Request Body:**
```json
{
  "user_id": "uuid_destinatario"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "other_user": {
      "id": "uuid",
      "full_name": "Maria Santos"
    },
    "created_at": "2025-11-12T10:00:00Z"
  }
}
```

---

### 6.13 GET /messages/direct-conversations/:id/messages
**Descrição**: Obter mensagens da conversa direta

**Query Params:**
```
?limit=50
&before_id=uuid
```

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "conversation_id": "uuid",
      "sender": {
        "id": "uuid",
        "full_name": "João Silva",
        "avatar_url": "https://..."
      },
      "content": "Oi Maria! Tudo bem?",
      "message_type": "text",
      "attachments": [],
      "reply_to": null,
      "is_edited": false,
      "read_by": ["uuid_sender", "uuid_recipient"],
      "reactions": {},
      "created_at": "2025-11-12T09:00:00Z"
    }
  ],
  "pagination": {
    "has_more": false
  }
}
```

---

### 6.14 POST /messages/direct-conversations/:id/messages
**Descrição**: Enviar mensagem direta

**Request Body:**
```json
{
  "content": "Olá! Vamos agendar uma reunião?",
  "message_type": "text",
  "reply_to": null,
  "attachments": []
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "conversation_id": "uuid",
    "content": "Olá! Vamos agendar uma reunião?",
    "created_at": "2025-11-12T10:00:00Z"
  }
}
```

---

### 6.15 POST /messages/mark-as-read
**Descrição**: Marcar mensagens como lidas

**Request Body:**
```json
{
  "group_id": "uuid",
  // OU
  "conversation_id": "uuid"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Mensagens marcadas como lidas"
}
```

---

### 6.16 GET /messages/notifications
**Descrição**: Obter notificações de mensagens não lidas

**Response 200:**
```json
{
  "success": true,
  "data": {
    "total_unread": 15,
    "groups_unread": 8,
    "direct_unread": 7,
    "notifications": [
      {
        "id": "uuid",
        "message": {
          "id": "uuid",
          "content": "Nova mensagem no grupo Geral"
        },
        "group": {
          "id": "uuid",
          "name": "Geral"
        },
        "is_read": false,
        "created_at": "2025-11-12T09:00:00Z"
      }
    ]
  }
}
```

---

### 6.17 POST /messages/typing
**Descrição**: Indicar que está digitando (WebSocket/Real-time)

**Request Body:**
```json
{
  "group_id": "uuid",
  // OU
  "conversation_id": "uuid",
  "is_typing": true
}
```

**Response 200:**
```json
{
  "success": true
}
```

---

### 6.18 GET /messages/presence/:user_id
**Descrição**: Obter status de presença do usuário

**Response 200:**
```json
{
  "success": true,
  "data": {
    "user_id": "uuid",
    "status": "online",
    "last_seen_at": "2025-11-12T10:00:00Z",
    "is_typing_in_group": null,
    "is_typing_in_conversation": null
  }
}
```

---

### 6.19 POST /messages/upload-attachment
**Descrição**: Upload de arquivo para mensagem

**Request Body (multipart/form-data):**
```
file: [arquivo]
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "arquivo.pdf",
    "url": "https://storage.../arquivo.pdf",
    "thumbnail_url": "https://storage.../thumb.jpg",
    "size": 245678,
    "type": "application/pdf"
  }
}
```

---

## 7. RESUMO DE ENDPOINTS REALTIME (WebSocket)

### Endpoints para Real-Time (via WebSocket/Server-Sent Events):

```javascript
// Conexão WebSocket
ws://localhost:3000/ws?token={jwt_token}

// Eventos que o cliente pode enviar:
{
  "type": "typing_start",
  "group_id": "uuid"
}

{
  "type": "typing_stop",
  "group_id": "uuid"
}

{
  "type": "presence_update",
  "status": "online|away|busy|offline"
}

// Eventos que o servidor envia:
{
  "type": "new_message",
  "data": {
    "message": {...},
    "group_id": "uuid"
  }
}

{
  "type": "user_typing",
  "data": {
    "user_id": "uuid",
    "group_id": "uuid",
    "is_typing": true
  }
}

{
  "type": "user_presence_changed",
  "data": {
    "user_id": "uuid",
    "status": "online",
    "last_seen_at": "..."
  }
}

{
  "type": "message_read",
  "data": {
    "message_id": "uuid",
    "user_id": "uuid"
  }
}
```

---

*Continua na PARTE 3C com mais endpoints...*


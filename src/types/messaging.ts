// Tipos compartilhados para o sistema de mensagens

export interface DirectConversation {
  id: string;
  is_client_conversation: boolean;
  other_user_id: string;
  other_user_name: string;
  other_user_email: string;
  other_user_avatar?: string;
  last_message_at?: string;
  last_message_preview?: string;
  unread_count?: number;
  other_user_type?: string;
}

export interface Group {
  id: string;
  name: string;
  type: string;  // obrigatório (não opcional)
  description?: string;
  avatar?: string;
  member_count?: number;
  last_message_at?: string;
  last_message_preview?: string;
  unread_count?: number;
}

export interface Message {
  id: string;
  content: string;
  sender_id: string;
  sender_name: string;
  sender_avatar?: string;
  created_at: string;
  is_system?: boolean;
}

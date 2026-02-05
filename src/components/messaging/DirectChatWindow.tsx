'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, MoreVertical, Check, CheckCheck, History, Bell, Search } from 'lucide-react';
import { PresenceIndicator } from './PresenceIndicator';
import { usePresence } from '@/hooks/usePresence';
import { useMessageNotification } from '@/hooks/useMessageNotification';
import { ClientInteractionHistory } from './ClientInteractionHistory';
import { AttachmentUpload } from './AttachmentUpload';
import { AttachmentViewer } from './AttachmentViewer';
import { EmojiPicker } from './EmojiPicker';
import { MessageReactions } from './MessageReactions';
import { MessageSearch } from './MessageSearch';
import { PinnedMessages } from './PinnedMessages';
import { PinMessageButton } from './PinMessageButton';
import { fetchProfilesMapByAuthIds } from '@/lib/messaging/userProfiles';
import type { MentionCandidate } from '@/lib/mentions/types';
import { MentionsText } from '@/lib/mentions/render';
import { applyMentionReplacement, extractMentionUserIds, getActiveMentionQuery } from '@/lib/mentions/parse';
import { filterCandidates } from '@/lib/mentions/suggestions';
import { triggerSilentAnalysis } from '@/lib/messaging/silentAnalysis';

interface Attachment {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  mime_type: string;
  file_size: number;
  width?: number;
  height?: number;
  duration?: number;
  thumbnail_url?: string;
}

interface DirectMessage {
  id: string;
  body: string;
  from_user_id: string;
  created_at: string;
  is_read: boolean;
  sender_name?: string;
  sender_avatar?: string;
  attachments?: Attachment[];
}

interface DirectConversation {
  id: string;
  is_client_conversation: boolean;
  other_user_id: string;
  other_user_name: string;
  other_user_email: string;
  other_user_avatar?: string;
}

interface DirectChatWindowProps {
  conversation: DirectConversation;
  currentUserId: string;
  readOnly?: boolean;
}

export function DirectChatWindow({ conversation, currentUserId, readOnly = false }: DirectChatWindowProps) {
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [newMessageIds, setNewMessageIds] = useState<Set<string>>(new Set());
  const [showHistory, setShowHistory] = useState(false);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const [mentionsProfilesById, setMentionsProfilesById] = useState<Map<string, any>>(new Map());
  const messageInputRef = useRef<HTMLInputElement | null>(null);
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionActiveRange, setMentionActiveRange] = useState<{ start: number; end: number } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const { startTyping, stopTyping } = usePresence({
    userId: currentUserId,
  });

  const { playNotificationSound } = useMessageNotification();

  useEffect(() => {
    if (conversation?.id) {
      console.log('🔄 Configurando realtime para conversa:', conversation.id);
      loadMessages();
      if (!readOnly) markAsRead();

      const channel = supabase
        .channel(`direct-messages-${conversation.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'direct_messages',
            filter: `conversation_id=eq.${conversation.id}`,
          },
          (payload) => {
            console.log('🔔 NOVA MENSAGEM RECEBIDA (realtime):', payload);
            const newMsg = payload.new as any;
            if (newMsg.from_user_id !== currentUserId) {
              console.log('🔔 Mensagem de outro usuário, tocando som');
              playNotificationSound(conversation.is_client_conversation);
              setNewMessageIds(prev => new Set(prev).add(newMsg.id));
              setTimeout(() => {
                setNewMessageIds(prev => {
                  const updated = new Set(prev);
                  updated.delete(newMsg.id);
                  return updated;
                });
              }, 500);
            } else {
              console.log('🔔 Mensagem própria, não toca som');
            }
            console.log('🔄 Recarregando mensagens...');
            loadMessages();
            if (!readOnly) markAsRead();
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'message_read_receipts',
          },
          () => {
            console.log('📖 Read receipt atualizado');
            loadMessages();
          }
        )
        .subscribe((status) => {
          console.log('🔌 Status da subscrição realtime:', status);
          if (status === 'SUBSCRIBED') {
            console.log('✅ REALTIME CONECTADO com sucesso!');
          } else if (status === 'CHANNEL_ERROR') {
            console.error('❌ ERRO no canal realtime');
          } else if (status === 'TIMED_OUT') {
            console.error('⏱️ TIMEOUT na conexão realtime');
          }
        });

      return () => {
        console.log('🔌 Desconectando realtime da conversa:', conversation.id);
        supabase.removeChannel(channel);
      };
    }
  }, [conversation?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    try {
      setIsLoading(true);

      const { data, error } = await supabase
        .from('direct_messages')
        .select('*')
        .eq('conversation_id', conversation.id)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;

      const messagesWithAttachments = await Promise.all(
        (data || []).map(async (msg: any) => {
          const { data: attachments } = await supabase
            .from('message_attachments')
            .select('*')
            .eq('message_id', msg.id)
            .eq('message_type', 'direct');

          return { ...msg, attachments: attachments || [] };
        })
      );

      if (error) throw error;

      const senderIds = Array.from(
        new Set((messagesWithAttachments || []).map((m: any) => String(m?.from_user_id || '')).filter(Boolean))
      );
      const profilesMap = await fetchProfilesMapByAuthIds(supabase as any, senderIds);

      const messagesWithReadStatus = readOnly
        ? messagesWithAttachments.map((msg: any) => ({
            ...msg,
            is_read: false,
            sender_name: profilesMap.get(String(msg.from_user_id))?.full_name,
            sender_avatar: profilesMap.get(String(msg.from_user_id))?.avatar_url,
          }))
        : await Promise.all(
            messagesWithAttachments.map(async (msg: any) => {
              let isRead = false;

              if (msg.from_user_id !== currentUserId) {
                const { data: receipt } = await supabase
                  .from('message_read_receipts')
                  .select('id')
                  .eq('message_id', msg.id)
                  .eq('message_type', 'direct')
                  .eq('user_id', currentUserId)
                  .maybeSingle();

                isRead = !!receipt;
              } else {
                const { data: receipt } = await supabase
                  .from('message_read_receipts')
                  .select('id')
                  .eq('message_id', msg.id)
                  .eq('message_type', 'direct')
                  .eq('user_id', conversation.other_user_id)
                  .maybeSingle();

                isRead = !!receipt;
              }

              return {
                ...msg,
                is_read: isRead,
                sender_name: profilesMap.get(String(msg.from_user_id))?.full_name,
                sender_avatar: profilesMap.get(String(msg.from_user_id))?.avatar_url,
              };
            })
          );

      setMessages(messagesWithReadStatus);

      // Resolver perfis para mentions (render)
      try {
        const mentionIds = Array.from(
          new Set((messagesWithReadStatus || []).flatMap((m: any) => extractMentionUserIds(String(m?.body || ''))))
        );
        if (mentionIds.length > 0) {
          const map = await fetchProfilesMapByAuthIds(supabase as any, mentionIds);
          setMentionsProfilesById(map as any);
        } else {
          setMentionsProfilesById(new Map());
        }
      } catch {
        // ignore
      }
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async () => {
    try {
      await supabase.rpc('mark_direct_messages_as_read', {
        p_conversation_id: conversation.id,
        p_user_id: currentUserId,
      });
    } catch (error) {
      console.error('Erro ao marcar como lido:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('📤 ========== TENTANDO ENVIAR MENSAGEM ==========');
    console.log('📤 ReadOnly:', readOnly);
    console.log('📤 NewMessage:', newMessage);
    console.log('📤 Attachments:', attachments.length);
    console.log('📤 IsSending:', isSending);
    console.log('📤 ConversationId:', conversation.id);
    console.log('📤 CurrentUserId:', currentUserId);
    
    if (readOnly) {
      console.log('❌ BLOQUEADO: ReadOnly = true');
      return;
    }
    if ((!newMessage.trim() && attachments.length === 0) || isSending) {
      console.log('❌ BLOQUEADO: Mensagem vazia ou já enviando');
      return;
    }

    setIsSending(true);
    stopTyping();

    try {
      console.log('📤 Inserindo mensagem no banco...');
      const { data: messageData, error: messageError } = await supabase
        .from('direct_messages')
        .insert({
          conversation_id: conversation.id,
          from_user_id: currentUserId,
          body: newMessage.trim() || '(anexo)',
          message_type: attachments.length > 0 ? 'attachment' : 'text',
        })
        .select()
        .single();

      if (messageError) {
        console.error('❌ ERRO AO INSERIR MENSAGEM:', messageError);
        throw messageError;
      }
      
      console.log('✅ Mensagem inserida com sucesso:', messageData);

      if (attachments.length > 0 && messageData) {
        for (const attachment of attachments) {
          const file = attachment.file;
          const fileName = `${Date.now()}-${file.name}`;
          const filePath = `messages/${conversation.id}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('attachments')
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: false
            });

          if (uploadError) {
            console.error('Erro ao fazer upload:', uploadError);
            continue;
          }

          const { data: { publicUrl } } = supabase.storage
            .from('attachments')
            .getPublicUrl(filePath);

          await supabase.from('message_attachments').insert({
            message_id: messageData.id,
            message_type: 'direct',
            file_name: file.name,
            file_url: publicUrl,
            file_type: attachment.type,
            file_size: file.size,
            mime_type: file.type,
            uploaded_by: currentUserId,
          });
        }
      }

      // Processar mentions (best-effort)
      if (messageData?.id) {
        try {
          await fetch('/api/mentions/process', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              entityType: 'direct_message',
              entityId: messageData.id,
              conversationId: conversation.id,
              otherUserId: conversation.other_user_id,
            }),
          });
        } catch {
          // ignore
        }

        // Análise silenciosa de sentimento (fire-and-forget)
        triggerSilentAnalysis({
          messageId: messageData.id,
          content: newMessage.trim(),
          senderId: currentUserId,
          senderType: 'collaborator', // Será atualizado baseado no perfil
          conversationType: conversation.is_client_conversation ? 'direct_client' : 'direct_team',
          clientId: conversation.is_client_conversation ? conversation.other_user_id : undefined,
          conversationName: conversation.other_user_name || 'Conversa direta',
        });
      }

      setNewMessage('');
      setAttachments([]);
      console.log('✅ MENSAGEM ENVIADA COM SUCESSO!');
    } catch (error: any) {
      console.error('❌ ERRO AO ENVIAR MENSAGEM:', error);
      console.error('❌ Detalhes do erro:', JSON.stringify(error, null, 2));
      alert(`Erro ao enviar mensagem: ${error?.message || 'Desconhecido'}`);
    } finally {
      setIsSending(false);
      console.log('📤 IsSending = false');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);

    if (e.target.value.length > 0) {
      startTyping();
    } else {
      stopTyping();
    }

    // recalcular mention ativo com o cursor atual
    requestAnimationFrame(() => refreshMentionStateFromInput());
  };

  const mentionCandidates: MentionCandidate[] = useMemo(() => {
    const c: MentionCandidate = {
      userId: conversation.other_user_id,
      label: conversation.other_user_name || 'Usuário',
      email: conversation.other_user_email || undefined,
      avatarUrl: conversation.other_user_avatar,
    };
    return c.userId ? [c] : [];
  }, [conversation.other_user_email, conversation.other_user_avatar, conversation.other_user_id, conversation.other_user_name]);

  const filteredMentionCandidates = useMemo(() => {
    return filterCandidates(mentionCandidates, mentionQuery);
  }, [mentionCandidates, mentionQuery]);

  const refreshMentionStateFromInput = () => {
    const el = messageInputRef.current;
    if (!el) return;
    const value = String(el.value || '');
    const caret = typeof el.selectionStart === 'number' ? el.selectionStart : value.length;
    const active = getActiveMentionQuery(value, caret);
    if (!active.active) {
      setMentionOpen(false);
      setMentionQuery('');
      setMentionActiveRange(null);
      return;
    }
    setMentionOpen(true);
    setMentionQuery(active.query);
    setMentionActiveRange({ start: active.startIndex, end: active.endIndex });
  };

  const applyMention = (candidate: MentionCandidate) => {
    const el = messageInputRef.current;
    if (!el || !mentionActiveRange) return;
    const value = String(el.value || '');
    const { nextValue, nextCaretIndex } = applyMentionReplacement({
      value,
      startIndex: mentionActiveRange.start,
      endIndex: mentionActiveRange.end,
      userId: candidate.userId,
      trailingSpace: true,
    });

    setNewMessage(nextValue);
    setMentionOpen(false);
    setMentionQuery('');
    setMentionActiveRange(null);

    requestAnimationFrame(() => {
      try {
        el.focus();
        el.setSelectionRange(nextCaretIndex, nextCaretIndex);
      } catch {
        // ignore
      }
    });
  };

  const handleEmojiSelect = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
  };

  const scrollToMessage = (messageId: string) => {
    const messageElement = document.getElementById(`message-${messageId}`);
    if (messageElement && messagesContainerRef.current) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedMessageId(messageId);
      setTimeout(() => setHighlightedMessageId(null), 2000);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Hoje';
    if (date.toDateString() === yesterday.toDateString()) return 'Ontem';
    return date.toLocaleDateString('pt-BR');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const renderMessage = (message: DirectMessage, index: number) => {
    const isOwnMessage = message.from_user_id === currentUserId;
    const isMentioned = !isOwnMessage && !!currentUserId && String(message.body || '').includes(`@{${currentUserId}}`);
    const showDate =
      index === 0 ||
      new Date(messages[index - 1].created_at).toDateString() !==
        new Date(message.created_at).toDateString();

    return (
      <div key={message.id}>
        {showDate && (
          <div className="flex items-center justify-center my-4">
            <span className="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
              {formatDate(message.created_at)}
            </span>
          </div>
        )}

        <div
          id={`message-${message.id}`}
          className={`flex gap-3 mb-4 group ${isOwnMessage ? 'flex-row-reverse' : ''} ${
            newMessageIds.has(message.id) ? 'animate-slide-in' : ''
          } ${highlightedMessageId === message.id ? 'bg-yellow-100 dark:bg-yellow-900/20 p-2 rounded-lg' : ''} ${
            isMentioned ? 'ring-2 ring-yellow-300/60 dark:ring-yellow-500/30 rounded-lg p-2' : ''
          }`}
        >
          {!isOwnMessage && (
            <div className="relative w-8 h-8 flex-shrink-0">
              {conversation.other_user_avatar ? (
                <img
                  src={conversation.other_user_avatar}
                  alt=""
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1672d6] to-[#001533] flex items-center justify-center text-xs text-white font-medium">
                  {getInitials(conversation.other_user_name || 'U')}
                </div>
              )}
              <div className="absolute bottom-0 right-0">
                <PresenceIndicator userId={conversation.other_user_id} size="sm" />
              </div>
            </div>
          )}

          <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} max-w-md`}>
            <div
              className={`rounded-2xl px-4 py-2 ${
                isOwnMessage
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
              }`}
            >
              {message.body && message.body !== '(anexo)' && (
                <p className="text-sm whitespace-pre-wrap break-words">
                  <MentionsText
                    text={message.body}
                    profilesById={mentionsProfilesById as any}
                    highlightUserId={currentUserId || undefined}
                  />
                </p>
              )}
              {message.attachments && message.attachments.length > 0 && (
                <div className="mt-2 space-y-2">
                  {message.attachments.map((attachment: Attachment) => (
                    <AttachmentViewer key={attachment.id} attachment={attachment} />
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xs text-gray-500">{formatTime(message.created_at)}</span>
              {isOwnMessage && (
                <span title={message.is_read ? 'Lida' : 'Enviada'}>
                  {message.is_read ? (
                    <CheckCheck className="w-3 h-3 text-blue-500" />
                  ) : (
                    <Check className="w-3 h-3 text-gray-500" />
                  )}
                </span>
              )}
            </div>

            <div className="mt-2">
              <MessageReactions
                messageId={message.id}
                messageType="direct"
                currentUserId={currentUserId}
                compact
              />
            </div>
          </div>

          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1">
            <PinMessageButton
              messageId={message.id}
              messageType="direct"
              conversationId={conversation.id}
              currentUserId={currentUserId}
              compact
            />
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            {conversation.other_user_avatar ? (
              <img
                src={conversation.other_user_avatar}
                alt=""
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1672d6] to-[#001533] flex items-center justify-center text-white font-medium">
                {getInitials(conversation.other_user_name)}
              </div>
            )}
            <div className="absolute bottom-0 right-0">
              <PresenceIndicator userId={conversation.other_user_id} size="md" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {conversation.other_user_name}
              </h3>
              {conversation.is_client_conversation && (
                <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                  Cliente
                </span>
              )}
            </div>
            <PresenceIndicator userId={conversation.other_user_id} showLabel size="sm" />
          </div>
        </div>
        <div className="flex gap-2">
          <MessageSearch
            conversationId={conversation.id}
            conversationType="direct"
            onResultClick={scrollToMessage}
            participants={[{ id: conversation.other_user_id, full_name: conversation.other_user_name }]}
          />
          {conversation.is_client_conversation && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHistory(true)}
              title="Histórico de interações"
            >
              <History className="w-5 h-5" />
            </Button>
          )}
          <Button variant="ghost" size="sm">
            <MoreVertical className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <PinnedMessages
        conversationId={conversation.id}
        conversationType="direct"
        currentUserId={currentUserId}
        onMessageClick={scrollToMessage}
      />

      <div className="flex-1 overflow-y-auto p-4" ref={messagesContainerRef}>
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center">
            <div>
              <Send className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Nenhuma mensagem ainda</p>
              <p className="text-xs text-gray-400 mt-1">
                Seja o primeiro a enviar uma mensagem!
              </p>
            </div>
          </div>
        ) : (
          messages.map((message, index) => renderMessage(message, index))
        )}
        <div ref={messagesEndRef} />
      </div>

      {readOnly ? (
        <div className="px-4 py-3 border-t bg-gray-50 dark:bg-gray-900">
          <p className="text-xs text-gray-600 dark:text-gray-300">
            Visualização do Super Admin: somente leitura (envio e “lido” desativados).
          </p>
        </div>
      ) : (
        <div className="p-4 border-t space-y-3">
          <AttachmentUpload
            onAttachmentsChange={setAttachments}
            maxFiles={5}
            maxSizeInMB={50}
          />
          <form onSubmit={handleSendMessage} className="flex items-start gap-2">
            <EmojiPicker onEmojiSelect={handleEmojiSelect} />
            <div className="relative flex-1">
              <Input
                ref={messageInputRef as any}
                value={newMessage}
                onChange={handleInputChange}
                onBlur={() => {
                  stopTyping();
                  setTimeout(() => setMentionOpen(false), 150);
                }}
                onKeyUp={() => refreshMentionStateFromInput()}
                onClick={() => refreshMentionStateFromInput()}
                placeholder="Digite uma mensagem... (use @ para mencionar)"
                disabled={isSending}
                className="flex-1"
              />

              {mentionOpen && filteredMentionCandidates.length > 0 && (
                <div className="absolute left-0 right-0 bottom-full mb-2 z-50 rounded-lg border bg-white dark:bg-gray-900 shadow-lg overflow-hidden">
                  <div className="max-h-56 overflow-y-auto">
                    {filteredMentionCandidates.map((c) => (
                      <button
                        key={c.userId}
                        type="button"
                        onMouseDown={(ev) => ev.preventDefault()}
                        onClick={() => applyMention(c)}
                        className="w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{c.label}</div>
                        {c.email && <div className="text-xs text-gray-500">{c.email}</div>}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <Button
              type="submit"
              disabled={(!newMessage.trim() && attachments.length === 0) || isSending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Send className="w-5 h-5" />
            </Button>
          </form>
        </div>
      )}

      {conversation.is_client_conversation && (
        <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border-t flex items-center gap-2">
          <Bell className="w-4 h-4 text-blue-600" />
          <p className="text-xs text-blue-700 dark:text-blue-300">
            Conversando com cliente - Mensagens são prioritárias
          </p>
        </div>
      )}

      {showHistory && (
        <ClientInteractionHistory
          isOpen={showHistory}
          onClose={() => setShowHistory(false)}
          clientId={conversation.other_user_id}
          clientName={conversation.other_user_name}
          conversationId={conversation.id}
        />
      )}
    </div>
  );
}

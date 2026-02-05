'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Send,
  Paperclip,
  Smile,
  MoreVertical,
  Download,
  Reply,
  Check,
  CheckCheck,
  X,
  Image as ImageIcon,
  File as FileIcon,
  Video as VideoIcon,
  Music as MusicIcon,
} from 'lucide-react';

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: string;
  attachments: any[];
  reply_to?: string;
  is_edited: boolean;
  edited_at?: string;
  read_by: string[];
  created_at: string;
  sender_name?: string;
  sender_avatar?: string;
  reply_to_message?: {
    content: string;
    sender_name: string;
  };
}

interface ChatWindowProps {
  conversation: {
    id: string;
    name?: string;
    conversation_type: string;
    participant_name?: string;
  };
  currentUserId: string;
}

export function ChatWindow({ conversation, currentUserId }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (conversation?.id) {
      loadMessages();
      markAsRead();

      const channel = supabase
        .channel(`messages-${conversation.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${conversation.id}`,
          },
          (payload) => {
            loadMessages();
            markAsRead();
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${conversation.id}`,
          },
          () => {
            loadMessages();
          }
        )
        .subscribe();

      return () => {
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
        .from('messages')
        .select(`
          *,
          sender:user_profiles!messages_sender_id_fkey(full_name, avatar_url)
        `)
        .eq('conversation_id', conversation.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const formattedMessages = await Promise.all(
        (data || []).map(async (msg: any) => {
          let replyToMessage = null;
          if (msg.reply_to) {
            const { data: replyData } = await supabase
              .from('messages')
              .select(`
                content,
                sender:user_profiles!messages_sender_id_fkey(full_name)
              `)
              .eq('id', msg.reply_to)
              .maybeSingle();

            if (replyData) {
              const senderData = Array.isArray(replyData.sender)
                ? replyData.sender[0]
                : replyData.sender;

              replyToMessage = {
                content: replyData.content,
                sender_name: senderData?.full_name,
              };
            }
          }

          return {
            ...msg,
            sender_name: msg.sender?.full_name,
            sender_avatar: msg.sender?.avatar_url,
            reply_to_message: replyToMessage,
          };
        })
      );

      setMessages(formattedMessages);
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async () => {
    try {
      await supabase.rpc('mark_messages_as_read', {
        p_conversation_id: conversation.id,
        p_user_id: currentUserId,
      });
    } catch (error) {
      console.error('Erro ao marcar como lido:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      const { error } = await supabase.from('messages').insert({
        conversation_id: conversation.id,
        sender_id: currentUserId,
        content: newMessage.trim(),
        message_type: 'text',
        reply_to: replyingTo?.id,
      });

      if (error) throw error;

      setNewMessage('');
      setReplyingTo(null);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      alert('Erro ao enviar mensagem');
    } finally {
      setIsSending(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${currentUserId}/${conversation.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('message-attachments')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('message-attachments')
          .getPublicUrl(fileName);

        let messageType = 'file';
        if (file.type.startsWith('image/')) messageType = 'image';
        else if (file.type.startsWith('video/')) messageType = 'video';
        else if (file.type.startsWith('audio/')) messageType = 'audio';

        const { error: dbError } = await supabase.from('messages').insert({
          conversation_id: conversation.id,
          sender_id: currentUserId,
          content: file.name,
          message_type: messageType,
          attachments: [
            {
              name: file.name,
              url: urlData.publicUrl,
              type: file.type,
              size: file.size,
            },
          ],
        });

        if (dbError) throw dbError;
      }
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      alert('Erro ao enviar arquivo');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <ImageIcon className="w-4 h-4" />;
      case 'video':
        return <VideoIcon className="w-4 h-4" />;
      case 'audio':
        return <MusicIcon className="w-4 h-4" />;
      default:
        return <FileIcon className="w-4 h-4" />;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const renderMessage = (message: Message, index: number) => {
    const isOwnMessage = message.sender_id === currentUserId;
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

        <div className={`flex gap-3 mb-4 ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
          {!isOwnMessage && (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1672d6] to-[#001533] flex items-center justify-center text-xs text-white font-medium flex-shrink-0">
              {getInitials(message.sender_name || 'U')}
            </div>
          )}

          <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} max-w-md`}>
            {!isOwnMessage && (
              <span className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                {message.sender_name}
              </span>
            )}

            {message.reply_to_message && (
              <div className="mb-1 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-xs border-l-2 border-primary">
                <p className="text-gray-600 dark:text-gray-400 font-medium">
                  {message.reply_to_message.sender_name}
                </p>
                <p className="text-gray-500 dark:text-gray-500 truncate">
                  {message.reply_to_message.content}
                </p>
              </div>
            )}

            <div
              className={`rounded-2xl px-4 py-2 ${
                isOwnMessage
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
              } group relative`}
            >
              {message.message_type === 'text' ? (
                <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
              ) : message.message_type === 'image' && message.attachments[0] ? (
                <div>
                  <img
                    src={message.attachments[0].url}
                    alt={message.content}
                    className="rounded-lg max-w-full mb-2"
                    style={{ maxHeight: '300px' }}
                  />
                  <p className="text-xs">{message.content}</p>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {getMessageIcon(message.message_type)}
                  <span className="text-sm">{message.content}</span>
                  {message.attachments[0] && (
                    <a
                      href={message.attachments[0].url}
                      download
                      className="ml-2 hover:opacity-80"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  )}
                </div>
              )}

              <button
                onClick={() => setReplyingTo(message)}
                className={`absolute top-1 ${
                  isOwnMessage ? 'left-1' : 'right-1'
                } opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-black/10`}
                title="Responder"
              >
                <Reply className="w-3 h-3" />
              </button>
            </div>

            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs text-gray-500">{formatTime(message.created_at)}</span>
              {isOwnMessage && (
                <span>
                  {message.read_by.length > 1 ? (
                    <CheckCheck className="w-3 h-3 text-blue-500" />
                  ) : (
                    <Check className="w-3 h-3 text-gray-500" />
                  )}
                </span>
              )}
              {message.is_edited && (
                <span className="text-xs text-gray-500 italic">editada</span>
              )}
            </div>
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
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1672d6] to-[#001533] flex items-center justify-center text-white font-medium">
            {getInitials(
              conversation.conversation_type === 'direct'
                ? conversation.participant_name || 'U'
                : conversation.name || 'G'
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {conversation.conversation_type === 'direct'
                ? conversation.participant_name
                : conversation.name}
            </h3>
            <p className="text-xs text-gray-500">
              {conversation.conversation_type === 'group' && 'Grupo'}
              {conversation.conversation_type === 'client' && 'Cliente'}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm">
          <MoreVertical className="w-5 h-5" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center">
            <div>
              <Send className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Nenhuma mensagem ainda</p>
              <p className="text-xs text-gray-400 mt-1">Seja o primeiro a enviar uma mensagem!</p>
            </div>
          </div>
        ) : (
          messages.map((message, index) => renderMessage(message, index))
        )}
        <div ref={messagesEndRef} />
      </div>

      {replyingTo && (
        <div className="px-4 py-2 border-t bg-gray-50 dark:bg-gray-800 flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
              Respondendo a {replyingTo.sender_name}
            </p>
            <p className="text-xs text-gray-500 truncate">{replyingTo.content}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setReplyingTo(null)}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      <div className="p-4 border-t">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileUpload}
            className="hidden"
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            title="Anexar arquivo"
          >
            <Paperclip className="w-5 h-5" />
          </Button>
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Digite uma mensagem..."
            disabled={isSending || isUploading}
            className="flex-1"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            title="Emojis"
          >
            <Smile className="w-5 h-5" />
          </Button>
          <Button
            type="submit"
            disabled={!newMessage.trim() || isSending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Send className="w-5 h-5" />
          </Button>
        </form>
      </div>
    </div>
  );
}

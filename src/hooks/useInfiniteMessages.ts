import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';

interface Message {
  id: string;
  body: string;
  from_user_id: string;
  created_at: string;
  [key: string]: any;
}

interface UseInfiniteMessagesOptions {
  conversationId: string;
  conversationType: 'group' | 'direct';
  pageSize?: number;
  enabled?: boolean;
}

export function useInfiniteMessages({
  conversationId,
  conversationType,
  pageSize = 50,
  enabled = true,
}: UseInfiniteMessagesOptions) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [oldestMessageDate, setOldestMessageDate] = useState<string | null>(null);
  const cacheRef = useRef<Map<string, Message[]>>(new Map());
  const observerRef = useRef<IntersectionObserver | null>(null);

  const loadMessages = useCallback(
    async (loadMore = false) => {
      if (!enabled || !conversationId) return;
      if (loadMore && !hasMore) return;

      const cacheKey = `${conversationType}-${conversationId}-${oldestMessageDate || 'initial'}`;

      if (cacheRef.current.has(cacheKey) && !loadMore) {
        const cached = cacheRef.current.get(cacheKey);
        if (cached) {
          setMessages(cached);
          return;
        }
      }

      setIsLoading(true);
      try {
        const tableName = conversationType === 'group' ? 'messages' : 'direct_messages';
        const idField = conversationType === 'group' ? 'group_id' : 'conversation_id';

        let query = supabase
          .from(tableName)
          .select(`
            *,
            sender:user_profiles!${tableName}_from_user_id_fkey(full_name, avatar_url)
          `)
          .eq(idField, conversationId)
          .order('created_at', { ascending: false })
          .limit(pageSize);

        if (loadMore && oldestMessageDate) {
          query = query.lt('created_at', oldestMessageDate);
        }

        const { data, error } = await query;

        if (error) throw error;

        const formattedMessages = (data || []).map((msg: any) => ({
          ...msg,
          sender_name: msg.sender?.full_name,
          sender_avatar: msg.sender?.avatar_url,
        }));

        const loadedMessages = formattedMessages.reverse();

        if (loadMore) {
          setMessages((prev) => [...loadedMessages, ...prev]);
        } else {
          setMessages(loadedMessages);
          cacheRef.current.set(cacheKey, loadedMessages);
        }

        if (loadedMessages.length > 0) {
          setOldestMessageDate(data[data.length - 1].created_at);
        }

        setHasMore(loadedMessages.length === pageSize);
      } catch (error) {
        console.error('Erro ao carregar mensagens:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [conversationId, conversationType, pageSize, enabled, oldestMessageDate, hasMore]
  );

  const loadMoreMessages = useCallback(() => {
    if (!isLoading && hasMore) {
      loadMessages(true);
    }
  }, [isLoading, hasMore, loadMessages]);

  const lastMessageRef = useCallback(
    (node: HTMLElement | null) => {
      if (isLoading) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMoreMessages();
        }
      });

      if (node) observerRef.current.observe(node);
    },
    [isLoading, hasMore, loadMoreMessages]
  );

  useEffect(() => {
    if (enabled && conversationId) {
      setMessages([]);
      setOldestMessageDate(null);
      setHasMore(true);
      loadMessages(false);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [conversationId, conversationType, enabled]);

  const clearCache = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  return {
    messages,
    isLoading,
    hasMore,
    loadMoreMessages,
    lastMessageRef,
    clearCache,
    setMessages,
  };
}

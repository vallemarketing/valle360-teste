'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { UserRole, normalizeRole, hasPermission, Permission } from '@/lib/permissions';

// Tipos
interface User {
  id: string;
  email: string;
  fullName: string;
  avatar?: string;
  role: UserRole;
  area?: string;
  department?: string;
}

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'task' | 'approval' | 'mention';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

interface AppContextType {
  // User
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  
  // Permissions
  hasPermission: (permission: Permission) => boolean;
  
  // Notifications
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  
  // Real-time
  isConnected: boolean;
  
  // Actions
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
  
  // UI State
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  valChatOpen: boolean;
  setValChatOpen: (open: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  // State
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [valChatOpen, setValChatOpen] = useState(false);

  // Carregar usuário
  const loadUser = useCallback(async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      // Buscar perfil completo
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', authUser.id)
        .single();

      const { data: employee } = await supabase
        .from('employees')
        .select('*')
        .eq('user_id', authUser.id)
        .single();

      const area = employee?.area_of_expertise || 
                   employee?.department || 
                   profile?.role || 
                   'employee';

      setUser({
        id: authUser.id,
        email: authUser.email || '',
        fullName: profile?.full_name || employee?.full_name || 'Usuário',
        avatar: employee?.avatar || profile?.avatar_url,
        role: normalizeRole(profile?.user_type || profile?.role || area),
        area: area,
        department: employee?.department
      });

    } catch (error) {
      console.error('Erro ao carregar usuário:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Carregar notificações
  const loadNotifications = useCallback(async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (data) {
        setNotifications(data.map(n => ({
          id: n.id,
          type: n.type,
          title: n.title,
          message: n.message,
          read: Boolean(n.is_read),
          createdAt: new Date(n.created_at),
          actionUrl: n.link,
          metadata: n.metadata
        })));
      }
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    }
  }, [user]);

  // Setup real-time subscriptions
  useEffect(() => {
    if (!user) return;

    // Subscribe to notifications
    const notificationChannel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newNotification: Notification = {
            id: payload.new.id,
            type: payload.new.type,
            title: payload.new.title,
            message: payload.new.message,
            read: Boolean(payload.new.is_read),
            createdAt: new Date(payload.new.created_at),
            actionUrl: payload.new.link,
            metadata: payload.new.metadata
          };
          setNotifications(prev => [newNotification, ...prev]);
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    // Subscribe to task updates (for Kanban real-time)
    const taskChannel = supabase
      .channel('tasks')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'kanban_tasks'
        },
        () => {
          // Emit event for Kanban to refresh
          window.dispatchEvent(new CustomEvent('kanban-update'));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(notificationChannel);
      supabase.removeChannel(taskChannel);
    };
  }, [user]);

  // Initial load
  useEffect(() => {
    loadUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        loadUser();
      } else {
        setUser(null);
        setNotifications([]);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadUser]);

  // Load notifications when user changes
  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user, loadNotifications]);

  // Actions
  const checkPermission = useCallback((permission: Permission): boolean => {
    if (!user) return false;
    return hasPermission(user.role, permission);
  }, [user]);

  const markAsRead = useCallback(async (id: string) => {
    if (!user) return;

    await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id);

    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }, [user]);

  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('is_read', false);

    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, [user]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setNotifications([]);
  }, []);

  const value: AppContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    hasPermission: checkPermission,
    notifications,
    unreadCount: notifications.filter(n => !n.read).length,
    markAsRead,
    markAllAsRead,
    isConnected,
    refreshUser: loadUser,
    logout,
    sidebarOpen,
    setSidebarOpen,
    valChatOpen,
    setValChatOpen
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

// Hook específico para permissões
export function usePermission(permission: Permission): boolean {
  const { hasPermission } = useApp();
  return hasPermission(permission);
}

// Hook para múltiplas permissões
export function usePermissions(permissions: Permission[]): boolean[] {
  const { hasPermission } = useApp();
  return permissions.map(p => hasPermission(p));
}





'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle, XCircle, AlertTriangle, Info, X, Loader2
} from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  updateToast: (id: string, toast: Partial<Toast>) => void;
  success: (title: string, message?: string) => string;
  error: (title: string, message?: string) => string;
  warning: (title: string, message?: string) => string;
  info: (title: string, message?: string) => string;
  loading: (title: string, message?: string) => string;
  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    }
  ) => Promise<T>;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

const TOAST_CONFIG: Record<ToastType, { icon: React.ReactNode; color: string; bg: string }> = {
  success: { 
    icon: <CheckCircle className="w-5 h-5" />, 
    color: '#10B981', 
    bg: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)' 
  },
  error: { 
    icon: <XCircle className="w-5 h-5" />, 
    color: '#EF4444', 
    bg: 'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)' 
  },
  warning: { 
    icon: <AlertTriangle className="w-5 h-5" />, 
    color: '#F59E0B', 
    bg: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)' 
  },
  info: { 
    icon: <Info className="w-5 h-5" />, 
    color: '#3B82F6', 
    bg: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)' 
  },
  loading: { 
    icon: <Loader2 className="w-5 h-5 animate-spin" />, 
    color: '#8B5CF6', 
    bg: 'linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)' 
  }
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(7);
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration ?? (toast.type === 'loading' ? Infinity : 5000)
    };

    setToasts(prev => [...prev, newToast]);

    if (newToast.duration !== Infinity) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, newToast.duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const updateToast = useCallback((id: string, updates: Partial<Toast>) => {
    setToasts(prev => prev.map(t => 
      t.id === id ? { ...t, ...updates } : t
    ));

    // Se mudou de loading para outro tipo, agendar remoção
    if (updates.type && updates.type !== 'loading') {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, updates.duration ?? 5000);
    }
  }, []);

  const success = useCallback((title: string, message?: string) => {
    return addToast({ type: 'success', title, message });
  }, [addToast]);

  const error = useCallback((title: string, message?: string) => {
    return addToast({ type: 'error', title, message });
  }, [addToast]);

  const warning = useCallback((title: string, message?: string) => {
    return addToast({ type: 'warning', title, message });
  }, [addToast]);

  const info = useCallback((title: string, message?: string) => {
    return addToast({ type: 'info', title, message });
  }, [addToast]);

  const loading = useCallback((title: string, message?: string) => {
    return addToast({ type: 'loading', title, message });
  }, [addToast]);

  const promise = useCallback(async <T,>(
    promiseToResolve: Promise<T>,
    messages: { loading: string; success: string; error: string }
  ): Promise<T> => {
    const id = addToast({ type: 'loading', title: messages.loading });

    try {
      const result = await promiseToResolve;
      updateToast(id, { type: 'success', title: messages.success });
      return result;
    } catch (err) {
      updateToast(id, { type: 'error', title: messages.error });
      throw err;
    }
  }, [addToast, updateToast]);

  return (
    <ToastContext.Provider value={{
      toasts,
      addToast,
      removeToast,
      updateToast,
      success,
      error,
      warning,
      info,
      loading,
      promise
    }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

function ToastContainer({ toasts, removeToast }: { toasts: Toast[]; removeToast: (id: string) => void }) {
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const config = TOAST_CONFIG[toast.type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      className="rounded-xl shadow-lg overflow-hidden"
      style={{ 
        background: config.bg,
        border: `1px solid ${config.color}30`
      }}
    >
      <div className="flex items-start gap-3 p-4">
        {/* Icon */}
        <div 
          className="flex-shrink-0 mt-0.5"
          style={{ color: config.color }}
        >
          {config.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p 
            className="font-medium text-sm"
            style={{ color: config.color }}
          >
            {toast.title}
          </p>
          {toast.message && (
            <p className="text-sm mt-0.5 text-gray-600">
              {toast.message}
            </p>
          )}
          {toast.action && (
            <button
              onClick={toast.action.onClick}
              className="text-sm font-medium mt-2 hover:underline"
              style={{ color: config.color }}
            >
              {toast.action.label}
            </button>
          )}
        </div>

        {/* Close button */}
        {toast.type !== 'loading' && (
          <button
            onClick={onClose}
            className="flex-shrink-0 p-1 rounded-lg hover:bg-black/5 transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>

      {/* Progress bar for non-loading toasts */}
      {toast.type !== 'loading' && toast.duration && toast.duration !== Infinity && (
        <motion.div
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: toast.duration / 1000, ease: 'linear' }}
          className="h-1"
          style={{ backgroundColor: config.color }}
        />
      )}
    </motion.div>
  );
}

export default ToastProvider;

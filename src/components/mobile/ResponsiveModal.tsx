'use client';

/**
 * Valle 360 - Responsive Modal
 * Modal que se torna fullscreen em dispositivos móveis
 */

import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/useIsMobile';

// =====================================================
// TIPOS
// =====================================================

export interface ResponsiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  footer?: React.ReactNode;
  headerActions?: React.ReactNode;
  className?: string;
}

// =====================================================
// CONSTANTES
// =====================================================

const SIZES = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-full mx-4'
};

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export function ResponsiveModal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  footer,
  headerActions,
  className
}: ResponsiveModalProps) {
  const isMobile = useIsMobile();

  // Fechar com ESC
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  // Mobile: Fullscreen slide-up
  if (isMobile) {
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={closeOnOverlayClick ? onClose : undefined}
            />

            {/* Modal Fullscreen */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={cn(
                "fixed inset-0 z-50 bg-white dark:bg-gray-900 flex flex-col",
                className
              )}
            >
              {/* Header Mobile */}
              <header className="flex items-center justify-between px-4 h-14 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
                <div className="flex items-center gap-3">
                  {showCloseButton && (
                    <button
                      onClick={onClose}
                      className="p-1 -ml-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <ChevronLeft className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                    </button>
                  )}
                  <div>
                    {title && (
                      <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                        {title}
                      </h2>
                    )}
                    {subtitle && (
                      <p className="text-xs text-gray-500">{subtitle}</p>
                    )}
                  </div>
                </div>
                {headerActions}
              </header>

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                {children}
              </div>

              {/* Footer Mobile */}
              {footer && (
                <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-800 p-4 safe-area-bottom bg-white dark:bg-gray-900">
                  {footer}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  // Desktop: Modal tradicional
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={closeOnOverlayClick ? onClose : undefined}
          >
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={cn(
                "w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]",
                SIZES[size],
                className
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              {(title || showCloseButton) && (
                <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                  <div>
                    {title && (
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {title}
                      </h2>
                    )}
                    {subtitle && (
                      <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {headerActions}
                    {showCloseButton && (
                      <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <X className="w-5 h-5 text-gray-500" />
                      </button>
                    )}
                  </div>
                </header>
              )}

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                {children}
              </div>

              {/* Footer */}
              {footer && (
                <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-800/50 rounded-b-2xl">
                  {footer}
                </div>
              )}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// =====================================================
// COMPONENTE DE CONFIRMAÇÃO
// =====================================================

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'primary' | 'danger';
  loading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  confirmVariant = 'primary',
  loading = false
}: ConfirmModalProps) {
  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              "px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50",
              confirmVariant === 'danger'
                ? "bg-red-500 hover:bg-red-600"
                : "bg-[#1672d6] hover:bg-[#1260b5]"
            )}
          >
            {loading ? 'Aguarde...' : confirmText}
          </button>
        </div>
      }
    >
      <div className="p-6">
        <p className="text-gray-600 dark:text-gray-400">{message}</p>
      </div>
    </ResponsiveModal>
  );
}

export default ResponsiveModal;


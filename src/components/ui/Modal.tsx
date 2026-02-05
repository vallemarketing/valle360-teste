'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, CheckCircle, Info, HelpCircle } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  footer?: React.ReactNode;
}

const SIZE_CLASSES = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-4xl'
};

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnBackdrop = true,
  closeOnEscape = true,
  footer
}: ModalProps) {
  // Handle escape key
  useEffect(() => {
    if (!closeOnEscape) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, closeOnEscape]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeOnBackdrop ? onClose : undefined}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full ${SIZE_CLASSES[size]} max-h-[90vh] overflow-auto rounded-2xl shadow-2xl z-50`}
            style={{ backgroundColor: 'var(--bg-primary)' }}
          >
            {/* Header */}
            {(title || showCloseButton) && (
              <div 
                className="flex items-start justify-between p-6 border-b"
                style={{ borderColor: 'var(--border-light)' }}
              >
                <div>
                  {title && (
                    <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                      {description}
                    </p>
                  )}
                </div>
                {showCloseButton && (
                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg transition-colors -mr-2 -mt-2"
                    style={{ backgroundColor: 'var(--bg-secondary)' }}
                  >
                    <X className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
                  </button>
                )}
              </div>
            )}

            {/* Content */}
            <div className="p-6">
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div 
                className="flex items-center justify-end gap-3 p-6 border-t"
                style={{ borderColor: 'var(--border-light)' }}
              >
                {footer}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Confirm Modal
interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info' | 'success';
  loading?: boolean;
}

const VARIANT_CONFIG = {
  danger: { icon: <AlertTriangle className="w-6 h-6" />, color: '#EF4444', bg: '#FEF2F2' },
  warning: { icon: <AlertTriangle className="w-6 h-6" />, color: '#F59E0B', bg: '#FFFBEB' },
  info: { icon: <Info className="w-6 h-6" />, color: '#3B82F6', bg: '#EFF6FF' },
  success: { icon: <CheckCircle className="w-6 h-6" />, color: '#10B981', bg: '#ECFDF5' }
};

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirmar ação',
  message = 'Tem certeza que deseja continuar?',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  loading = false
}: ConfirmModalProps) {
  const config = VARIANT_CONFIG[variant];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" showCloseButton={false}>
      <div className="text-center">
        {/* Icon */}
        <div 
          className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center"
          style={{ backgroundColor: config.bg, color: config.color }}
        >
          {config.icon}
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
          {title}
        </h3>

        {/* Message */}
        <div className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
          {message}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl font-medium transition-colors"
            style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl font-medium text-white transition-colors disabled:opacity-50"
            style={{ backgroundColor: config.color }}
          >
            {loading ? 'Aguarde...' : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// Alert Modal
interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  buttonText?: string;
  variant?: 'info' | 'success' | 'warning' | 'error';
}

export function AlertModal({
  isOpen,
  onClose,
  title = 'Aviso',
  message,
  buttonText = 'Entendi',
  variant = 'info'
}: AlertModalProps) {
  const config = VARIANT_CONFIG[variant === 'error' ? 'danger' : variant];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" showCloseButton={false}>
      <div className="text-center">
        {/* Icon */}
        <div 
          className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center"
          style={{ backgroundColor: config.bg, color: config.color }}
        >
          {config.icon}
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
          {title}
        </h3>

        {/* Message */}
        {message && (
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
            {message}
          </p>
        )}

        {/* Button */}
        <button
          onClick={onClose}
          className="w-full px-4 py-2.5 rounded-xl font-medium text-white transition-colors"
          style={{ backgroundColor: config.color }}
        >
          {buttonText}
        </button>
      </div>
    </Modal>
  );
}

export default Modal;










'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, Check, X } from 'lucide-react';

type ButtonState = 'idle' | 'loading' | 'success' | 'error';

interface LoadingButtonProps {
  children: React.ReactNode;
  loading?: boolean;
  state?: ButtonState;
  loadingText?: string;
  successText?: string;
  errorText?: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  onClick?: () => void;
  style?: React.CSSProperties;
}

const VARIANTS = {
  primary: {
    base: 'bg-primary-500 text-white hover:bg-primary-600',
    disabled: 'bg-primary-300 cursor-not-allowed'
  },
  secondary: {
    base: 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700',
    disabled: 'bg-gray-100 text-gray-400 cursor-not-allowed'
  },
  danger: {
    base: 'bg-red-500 text-white hover:bg-red-600',
    disabled: 'bg-red-300 cursor-not-allowed'
  },
  success: {
    base: 'bg-green-500 text-white hover:bg-green-600',
    disabled: 'bg-green-300 cursor-not-allowed'
  },
  ghost: {
    base: 'bg-transparent text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800',
    disabled: 'text-gray-400 cursor-not-allowed'
  }
};

const SIZES = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base'
};

export function LoadingButton({
  children,
  loading = false,
  state = 'idle',
  loadingText,
  successText,
  errorText,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  icon,
  iconPosition = 'left',
  className = '',
  disabled,
  type = 'button',
  onClick,
  style
}: LoadingButtonProps) {
  const isLoading = loading || state === 'loading';
  const isDisabled = disabled || isLoading;
  const currentState = loading ? 'loading' : state;

  const variantStyles = VARIANTS[variant];
  const sizeStyles = SIZES[size];

  const getContent = () => {
    switch (currentState) {
      case 'loading':
        return (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {loadingText && <span>{loadingText}</span>}
          </>
        );
      case 'success':
        return (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            >
              <Check className="w-4 h-4" />
            </motion.div>
            {successText && <span>{successText}</span>}
          </>
        );
      case 'error':
        return (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            >
              <X className="w-4 h-4" />
            </motion.div>
            {errorText && <span>{errorText}</span>}
          </>
        );
      default:
        return (
          <>
            {icon && iconPosition === 'left' && icon}
            {children}
            {icon && iconPosition === 'right' && icon}
          </>
        );
    }
  };

  const getBackgroundColor = () => {
    switch (currentState) {
      case 'success':
        return '#10B981';
      case 'error':
        return '#EF4444';
      default:
        return undefined;
    }
  };

  return (
    <motion.button
      type={type}
      onClick={onClick}
      whileHover={!isDisabled ? { scale: 1.02 } : undefined}
      whileTap={!isDisabled ? { scale: 0.98 } : undefined}
      className={`
        inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-colors
        ${isDisabled ? variantStyles.disabled : variantStyles.base}
        ${sizeStyles}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      style={{
        backgroundColor: getBackgroundColor(),
        ...style
      }}
      disabled={isDisabled}
    >
      {getContent()}
    </motion.button>
  );
}

// Botão com confirmação
interface ConfirmButtonProps extends Omit<LoadingButtonProps, 'onClick'> {
  confirmText?: string;
  confirmDelay?: number;
  onConfirm?: () => void;
  onClick?: () => void;
}

export function ConfirmButton({
  children,
  confirmText = 'Confirmar?',
  confirmDelay = 3000,
  onConfirm,
  onClick,
  variant = 'danger',
  ...props
}: ConfirmButtonProps) {
  const [isConfirming, setIsConfirming] = React.useState(false);
  const [countdown, setCountdown] = React.useState(0);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    if (isConfirming) {
      setCountdown(Math.ceil(confirmDelay / 1000));
      
      const interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            setIsConfirming(false);
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      timerRef.current = interval;
      return () => clearInterval(interval);
    }
  }, [isConfirming, confirmDelay]);

  const handleClick = () => {
    if (isConfirming) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      setIsConfirming(false);
      onConfirm?.();
      onClick?.();
    } else {
      setIsConfirming(true);
    }
  };

  return (
    <LoadingButton
      variant={isConfirming ? 'danger' : variant}
      onClick={handleClick}
      {...props}
    >
      {isConfirming ? `${confirmText} (${countdown}s)` : children}
    </LoadingButton>
  );
}

export default LoadingButton;

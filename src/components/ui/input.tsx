'use client';

import React, { useState, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Search, X, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  success?: string;
  hint?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'filled' | 'outlined';
  loading?: boolean;
  clearable?: boolean;
  onClear?: () => void;
}

const SIZE_CLASSES = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-4 py-3 text-base'
};

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  success,
  hint,
  icon,
  iconPosition = 'left',
  size = 'md',
  variant = 'default',
  loading = false,
  clearable = false,
  onClear,
  className = '',
  type = 'text',
  disabled,
  value,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;
  const hasValue = value !== undefined && value !== '';

  const baseClasses = `
    w-full rounded-xl border transition-all duration-200
    ${SIZE_CLASSES[size]}
    ${icon && iconPosition === 'left' ? 'pl-10' : ''}
    ${icon && iconPosition === 'right' ? 'pr-10' : ''}
    ${isPassword || clearable || loading ? 'pr-10' : ''}
    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
  `;

  const variantClasses = {
    default: `
      bg-white dark:bg-gray-900
      border-gray-200 dark:border-gray-700
      focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20
    `,
    filled: `
      bg-gray-100 dark:bg-gray-800
      border-transparent
      focus:bg-white dark:focus:bg-gray-900
      focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20
    `,
    outlined: `
      bg-transparent
      border-gray-300 dark:border-gray-600
      focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20
    `
  };

  const stateClasses = error 
    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
    : success 
      ? 'border-green-500 focus:border-green-500 focus:ring-green-500/20'
      : '';

  return (
    <div className={`space-y-1 ${className}`}>
      {/* Label */}
      {label && (
        <label 
          className="block text-sm font-medium mb-1"
          style={{ color: 'var(--text-secondary)' }}
        >
          {label}
        </label>
      )}

      {/* Input Container */}
      <div className="relative">
        {/* Left Icon */}
        {icon && iconPosition === 'left' && (
          <div 
            className="absolute left-3 top-1/2 transform -translate-y-1/2"
            style={{ color: isFocused ? 'var(--primary-500)' : 'var(--text-tertiary)' }}
          >
            {icon}
          </div>
        )}

        {/* Input */}
        <input
          ref={ref}
          type={inputType}
          value={value}
          disabled={disabled || loading}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          className={`${baseClasses} ${variantClasses[variant]} ${stateClasses}`}
          style={{ 
            color: 'var(--text-primary)',
            backgroundColor: variant === 'filled' ? 'var(--bg-secondary)' : 'var(--bg-primary)'
          }}
          {...props}
        />

        {/* Right Icons */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          {/* Loading */}
          {loading && (
            <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--text-tertiary)' }} />
          )}

          {/* Clear button */}
          {clearable && hasValue && !loading && (
            <button
              type="button"
              onClick={onClear}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
            </button>
          )}

          {/* Password toggle */}
          {isPassword && !loading && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
              ) : (
                <Eye className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
              )}
            </button>
          )}

          {/* Right Icon */}
          {icon && iconPosition === 'right' && !isPassword && !clearable && !loading && (
            <div style={{ color: isFocused ? 'var(--primary-500)' : 'var(--text-tertiary)' }}>
              {icon}
            </div>
          )}

          {/* Status icons */}
          {error && !loading && (
            <AlertCircle className="w-4 h-4" style={{ color: 'var(--error-500)' }} />
          )}
          {success && !error && !loading && (
            <CheckCircle className="w-4 h-4" style={{ color: 'var(--success-500)' }} />
          )}
        </div>
      </div>

      {/* Messages */}
      <AnimatePresence mode="wait">
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="text-xs"
            style={{ color: 'var(--error-500)' }}
          >
            {error}
          </motion.p>
        )}
        {success && !error && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="text-xs"
            style={{ color: 'var(--success-500)' }}
          >
            {success}
          </motion.p>
        )}
        {hint && !error && !success && (
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            {hint}
          </p>
        )}
      </AnimatePresence>
    </div>
  );
});

Input.displayName = 'Input';

// Search Input
interface SearchInputProps extends Omit<InputProps, 'icon' | 'iconPosition' | 'type'> {
  onSearch?: (value: string) => void;
}

export function SearchInput({ onSearch, ...props }: SearchInputProps) {
  const [value, setValue] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    props.onChange?.(e);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearch?.(value);
    }
  };

  const handleClear = () => {
    setValue('');
    props.onClear?.();
  };

  return (
    <Input
      {...props}
      type="search"
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      icon={<Search className="w-4 h-4" />}
      iconPosition="left"
      clearable={!!value}
      onClear={handleClear}
      placeholder={props.placeholder || 'Buscar...'}
    />
  );
}

// Textarea
interface TextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  label?: string;
  error?: string;
  hint?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({
  label,
  error,
  hint,
  size = 'md',
  className = '',
  disabled,
  ...props
}, ref) => {
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-sm',
    lg: 'px-4 py-4 text-base'
  };

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label 
          className="block text-sm font-medium mb-1"
          style={{ color: 'var(--text-secondary)' }}
        >
          {label}
        </label>
      )}

      <textarea
        ref={ref}
        disabled={disabled}
        className={`
          w-full rounded-xl border transition-all duration-200 resize-none
          ${sizeClasses[size]}
          ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200 dark:border-gray-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        style={{ 
          color: 'var(--text-primary)',
          backgroundColor: 'var(--bg-primary)'
        }}
        {...props}
      />

      {error && (
        <p className="text-xs" style={{ color: 'var(--error-500)' }}>
          {error}
        </p>
      )}
      {hint && !error && (
        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
          {hint}
        </p>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';

export default Input;

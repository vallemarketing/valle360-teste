'use client';

import { motion } from 'framer-motion';
import { CheckCircle, Circle } from 'lucide-react';

interface OnboardingStepProps {
  step: number;
  title: string;
  description: string;
  isActive: boolean;
  isCompleted: boolean;
  children?: React.ReactNode;
}

export function OnboardingStep({
  step,
  title,
  description,
  isActive,
  isCompleted,
  children,
}: OnboardingStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: step * 0.1 }}
      className={`
        relative p-6 rounded-2xl border-2 transition-all
        ${isActive 
          ? 'border-[#1672d6] bg-[#1672d6]/5' 
          : isCompleted 
            ? 'border-green-500 bg-green-50 dark:bg-green-900/10' 
            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
        }
      `}
    >
      {/* Step indicator */}
      <div className="flex items-center gap-4 mb-4">
        <div
          className={`
            w-10 h-10 rounded-full flex items-center justify-center font-bold
            ${isCompleted 
              ? 'bg-green-500 text-white' 
              : isActive 
                ? 'bg-[#1672d6] text-white' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
            }
          `}
        >
          {isCompleted ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <span>{step}</span>
          )}
        </div>
        <div>
          <h3 className="font-semibold text-lg text-[#001533] dark:text-white">
            {title}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {description}
          </p>
        </div>
      </div>

      {/* Content */}
      {isActive && children && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
        >
          {children}
        </motion.div>
      )}
    </motion.div>
  );
}

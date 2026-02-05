'use client';

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ReplyToMessageProps {
  replyingTo: {
    id: string;
    body: string;
    sender_name?: string;
  } | null;
  onCancel: () => void;
}

export function ReplyToMessage({ replyingTo, onCancel }: ReplyToMessageProps) {
  if (!replyingTo) return null;

  return (
    <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 border-l-4 border-primary flex items-start justify-between gap-2">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-blue-600 dark:text-amber-400 mb-1">
          Respondendo a {replyingTo.sender_name || 'mensagem'}
        </p>
        <p className="text-sm text-gray-700 dark:text-gray-300 truncate">
          {replyingTo.body}
        </p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onCancel}
        className="h-6 w-6 p-0 flex-shrink-0"
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
}

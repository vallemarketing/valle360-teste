'use client';

import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Picker = dynamic(
  () => import('emoji-picker-react'),
  { ssr: false }
);

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  buttonClassName?: string;
}

export function EmojiPicker({ onEmojiSelect, buttonClassName }: EmojiPickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowPicker(false);
      }
    }

    if (showPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showPicker]);

  const handleEmojiClick = (emojiData: any) => {
    onEmojiSelect(emojiData.emoji);
    setShowPicker(false);
  };

  return (
    <div className="relative" ref={pickerRef}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setShowPicker(!showPicker)}
        className={buttonClassName}
        title="Adicionar emoji"
      >
        <Smile className="w-5 h-5" />
      </Button>

      {showPicker && (
        <div className="absolute bottom-12 right-0 z-50 shadow-xl">
          <Picker
            onEmojiClick={handleEmojiClick}
            searchPlaceholder="Buscar emoji..."
            previewConfig={{
              showPreview: false,
            }}
            width={320}
            height={400}
          />
        </div>
      )}
    </div>
  );
}

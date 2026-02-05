'use client';

/**
 * Valle 360 - Audio Recorder Component
 * Gravação de áudio diretamente no chat
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Square, Send, X, Loader2, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface AudioRecorderProps {
  onAudioReady: (audioBlob: Blob, audioUrl: string, duration: number) => void;
  onCancel: () => void;
  disabled?: boolean;
  className?: string;
}

export function AudioRecorder({
  onAudioReady,
  onCancel,
  disabled = false,
  className
}: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const MAX_RECORDING_TIME = 300; // 5 minutos

  useEffect(() => {
    return () => {
      // Cleanup
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
      };

      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      setRecordingTime(0);

      // Timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= MAX_RECORDING_TIME) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (error) {
      console.error('Erro ao acessar microfone:', error);
      toast.error('Não foi possível acessar o microfone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      setIsRecording(false);
      setIsPaused(false);
    }
  };

  const cancelRecording = () => {
    stopRecording();
    setAudioBlob(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setRecordingTime(0);
    onCancel();
  };

  const sendAudio = () => {
    if (audioBlob && audioUrl) {
      onAudioReady(audioBlob, audioUrl, recordingTime);
      setAudioBlob(null);
      setAudioUrl(null);
      setRecordingTime(0);
    }
  };

  const togglePlayback = () => {
    if (!audioRef.current || !audioUrl) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Se temos áudio gravado, mostrar preview
  if (audioBlob && audioUrl) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "flex items-center gap-3 p-3 bg-gray-100 dark:bg-gray-800 rounded-xl",
          className
        )}
      >
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />

        <Button
          variant="ghost"
          size="icon"
          onClick={togglePlayback}
          className="h-10 w-10 rounded-full bg-primary/10 text-primary hover:bg-primary/20"
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        </Button>

        <div className="flex-1">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary/30"
              initial={{ width: '0%' }}
              animate={{ width: isPlaying ? '100%' : '0%' }}
              transition={{ duration: recordingTime, ease: 'linear' }}
            />
          </div>
        </div>

        <span className="text-sm font-medium text-gray-600 dark:text-gray-300 min-w-[45px]">
          {formatTime(recordingTime)}
        </span>

        <Button
          variant="ghost"
          size="icon"
          onClick={cancelRecording}
          className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600"
        >
          <X className="w-4 h-4" />
        </Button>

        <Button
          size="icon"
          onClick={sendAudio}
          className="h-10 w-10 rounded-full bg-primary hover:bg-primary/90"
        >
          <Send className="w-5 h-5" />
        </Button>
      </motion.div>
    );
  }

  // Se está gravando
  if (isRecording) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn(
          "flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800",
          className
        )}
      >
        <div className="relative">
          <motion.div
            className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <Mic className="w-5 h-5 text-white" />
          </motion.div>
          <motion.div
            className="absolute inset-0 rounded-full bg-red-500"
            initial={{ opacity: 0.5, scale: 1 }}
            animate={{ opacity: 0, scale: 1.5 }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        </div>

        <div className="flex-1">
          <p className="text-sm font-medium text-red-700 dark:text-red-300">
            Gravando áudio...
          </p>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1 bg-red-500 rounded-full"
                  animate={{ height: [8, 16, 8] }}
                  transition={{
                    duration: 0.5,
                    repeat: Infinity,
                    delay: i * 0.1
                  }}
                />
              ))}
            </div>
            <span className="text-xs text-red-600 dark:text-red-400">
              {formatTime(recordingTime)} / {formatTime(MAX_RECORDING_TIME)}
            </span>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={cancelRecording}
          className="h-8 w-8 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50"
        >
          <X className="w-4 h-4" />
        </Button>

        <Button
          size="icon"
          onClick={stopRecording}
          className="h-10 w-10 rounded-full bg-red-500 hover:bg-red-600"
        >
          <Square className="w-4 h-4 fill-current" />
        </Button>
      </motion.div>
    );
  }

  // Botão inicial para começar gravação
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={startRecording}
      disabled={disabled}
      className={cn(
        "h-10 w-10 rounded-full hover:bg-primary/10 text-gray-500 hover:text-primary",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      title="Gravar áudio"
    >
      <Mic className="w-5 h-5" />
    </Button>
  );
}

// Componente de botão simples para iniciar gravação
export function AudioRecordButton({
  onStartRecording,
  disabled = false,
  className
}: {
  onStartRecording: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onStartRecording}
      disabled={disabled}
      className={cn(
        "h-10 w-10 rounded-full hover:bg-primary/10 text-gray-500 hover:text-primary transition-colors",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      title="Gravar áudio"
    >
      <Mic className="w-5 h-5" />
    </Button>
  );
}

export default AudioRecorder;

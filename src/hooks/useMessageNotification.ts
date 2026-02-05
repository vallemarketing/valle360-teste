import { useEffect, useRef } from 'react';

export function useMessageNotification() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const clientAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio('/notification.mp3');
    audioRef.current.volume = 0.5;

    clientAudioRef.current = new Audio('/notification.mp3');
    clientAudioRef.current.volume = 0.8;
  }, []);

  const playNotificationSound = (isClient: boolean = false) => {
    const audio = isClient ? clientAudioRef.current : audioRef.current;
    if (audio) {
      audio.currentTime = 0;
      if (isClient) {
        audio.playbackRate = 1.1;
      }
      audio.play().catch(error => {
        console.log('Não foi possível reproduzir o som:', error);
      });
    }
  };

  return { playNotificationSound };
}

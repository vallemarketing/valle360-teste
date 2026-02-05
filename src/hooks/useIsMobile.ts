/**
 * Valle 360 - Hooks de Responsividade
 * Detecta dispositivo e breakpoints para adaptar UI
 */

import { useState, useEffect } from 'react';

// Breakpoints do Tailwind
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

/**
 * Hook para detectar se está em dispositivo mobile
 */
export function useIsMobile(breakpoint: number = BREAKPOINTS.md): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check initial
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    checkIsMobile();

    // Listen for resize
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, [breakpoint]);

  return isMobile;
}

/**
 * Hook para detectar o breakpoint atual
 */
export function useBreakpoint(): Breakpoint | 'xs' {
  const [breakpoint, setBreakpoint] = useState<Breakpoint | 'xs'>('xs');

  useEffect(() => {
    const checkBreakpoint = () => {
      const width = window.innerWidth;
      
      if (width >= BREAKPOINTS['2xl']) {
        setBreakpoint('2xl');
      } else if (width >= BREAKPOINTS.xl) {
        setBreakpoint('xl');
      } else if (width >= BREAKPOINTS.lg) {
        setBreakpoint('lg');
      } else if (width >= BREAKPOINTS.md) {
        setBreakpoint('md');
      } else if (width >= BREAKPOINTS.sm) {
        setBreakpoint('sm');
      } else {
        setBreakpoint('xs');
      }
    };

    checkBreakpoint();
    window.addEventListener('resize', checkBreakpoint);
    return () => window.removeEventListener('resize', checkBreakpoint);
  }, []);

  return breakpoint;
}

/**
 * Hook para verificar se está acima de um breakpoint
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    
    const updateMatch = () => setMatches(media.matches);
    updateMatch();

    media.addEventListener('change', updateMatch);
    return () => media.removeEventListener('change', updateMatch);
  }, [query]);

  return matches;
}

/**
 * Hook para detectar orientação do dispositivo
 */
export function useOrientation(): 'portrait' | 'landscape' {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  useEffect(() => {
    const checkOrientation = () => {
      setOrientation(
        window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
      );
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    
    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  return orientation;
}

/**
 * Hook para detectar se é touch device
 */
export function useIsTouchDevice(): boolean {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    setIsTouch(
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0
    );
  }, []);

  return isTouch;
}

/**
 * Hook combinado para informações de dispositivo
 */
export function useDeviceInfo() {
  const isMobile = useIsMobile();
  const isTablet = useIsMobile(BREAKPOINTS.lg) && !useIsMobile(BREAKPOINTS.md);
  const breakpoint = useBreakpoint();
  const orientation = useOrientation();
  const isTouch = useIsTouchDevice();

  return {
    isMobile,
    isTablet,
    isDesktop: !isMobile && !isTablet,
    breakpoint,
    orientation,
    isTouch,
    isSmallScreen: breakpoint === 'xs' || breakpoint === 'sm',
    isMediumScreen: breakpoint === 'md',
    isLargeScreen: breakpoint === 'lg' || breakpoint === 'xl' || breakpoint === '2xl'
  };
}


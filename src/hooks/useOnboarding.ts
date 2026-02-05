'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface UseOnboardingReturn {
  showOnboarding: boolean;
  isLoading: boolean;
  startOnboarding: () => void;
  completeOnboarding: () => Promise<void>;
  skipOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
}

export function useOnboarding(): UseOnboardingReturn {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClientComponentClient();

  // Check if onboarding should be shown
  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsLoading(false);
          return;
        }

        // Check feature flag first
        const { data: featureFlag } = await supabase
          .from('feature_flags')
          .select('is_enabled')
          .eq('flag_name', 'onboarding_enabled')
          .single();

        if (!featureFlag?.is_enabled) {
          setShowOnboarding(false);
          setIsLoading(false);
          return;
        }

        // Check if user has completed onboarding
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('onboarding_completed')
          .eq('user_id', user.id)
          .single();

        setShowOnboarding(!profile?.onboarding_completed);
      } catch (error) {
        console.error('Error checking onboarding:', error);
        setShowOnboarding(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkOnboarding();
  }, [supabase]);

  const startOnboarding = useCallback(() => {
    setShowOnboarding(true);
  }, []);

  const completeOnboarding = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('user_profiles')
        .update({ 
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      setShowOnboarding(false);
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  }, [supabase]);

  const skipOnboarding = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('user_profiles')
        .update({ 
          onboarding_completed: true,
          onboarding_skipped: true
        })
        .eq('user_id', user.id);

      setShowOnboarding(false);
    } catch (error) {
      console.error('Error skipping onboarding:', error);
    }
  }, [supabase]);

  const resetOnboarding = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('user_profiles')
        .update({ 
          onboarding_completed: false,
          onboarding_skipped: false,
          onboarding_completed_at: null
        })
        .eq('user_id', user.id);

      setShowOnboarding(true);
    } catch (error) {
      console.error('Error resetting onboarding:', error);
    }
  }, [supabase]);

  return {
    showOnboarding,
    isLoading,
    startOnboarding,
    completeOnboarding,
    skipOnboarding,
    resetOnboarding,
  };
}

'use client';

/**
 * Valle 360 - Feature Gate Component
 * Controla acesso a funcionalidades baseado em permissões do cliente
 */

import { ReactNode } from 'react';
import { useFeature, useMultipleFeatures } from '@/hooks/useFeatures';
import { motion } from 'framer-motion';
import { Lock, Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface FeatureGateProps {
  /** Código da feature a ser verificada */
  feature: string;
  /** Conteúdo a ser exibido se tiver acesso */
  children: ReactNode;
  /** Componente alternativo se não tiver acesso */
  fallback?: ReactNode;
  /** Se true, não mostra nada quando não tem acesso (ao invés do fallback padrão) */
  hideWhenDisabled?: boolean;
  /** Se true, mostra loading enquanto verifica */
  showLoading?: boolean;
}

interface MultiFeatureGateProps {
  /** Códigos das features (precisa ter acesso a todas) */
  features: string[];
  /** Conteúdo a ser exibido se tiver acesso a todas */
  children: ReactNode;
  /** Componente alternativo se não tiver acesso */
  fallback?: ReactNode;
  /** Se true, precisa de apenas UMA das features (OR ao invés de AND) */
  requireAny?: boolean;
  /** Se true, não mostra nada quando não tem acesso */
  hideWhenDisabled?: boolean;
}

/**
 * Componente padrão exibido quando feature não está disponível
 */
function DefaultFallback({ featureName }: { featureName?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center p-8 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-700"
    >
      <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mb-4">
        <Lock className="w-8 h-8 text-gray-400 dark:text-gray-500" />
      </div>
      
      <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
        Funcionalidade não disponível
      </h3>
      
      <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm mb-4">
        {featureName 
          ? `A funcionalidade "${featureName}" não está incluída no seu plano atual.`
          : 'Esta funcionalidade não está incluída no seu plano atual.'
        }
      </p>
      
      <Link
        href="/cliente/servicos"
        className="inline-flex items-center gap-2 px-4 py-2 bg-[#1672d6] text-white rounded-lg text-sm font-medium hover:bg-[#1260b5] transition-colors"
      >
        <Sparkles className="w-4 h-4" />
        Ver planos disponíveis
        <ArrowRight className="w-4 h-4" />
      </Link>
    </motion.div>
  );
}

/**
 * Loading skeleton enquanto verifica permissão
 */
function LoadingSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl" />
    </div>
  );
}

/**
 * FeatureGate - Controla acesso a uma feature específica
 * 
 * @example
 * ```tsx
 * <FeatureGate feature="reputation">
 *   <ReputacaoPage />
 * </FeatureGate>
 * ```
 */
export function FeatureGate({
  feature,
  children,
  fallback,
  hideWhenDisabled = false,
  showLoading = false
}: FeatureGateProps) {
  const { hasAccess, loading } = useFeature(feature);

  if (loading && showLoading) {
    return <LoadingSkeleton />;
  }

  if (loading) {
    // Enquanto carrega, não mostra nada para evitar flash
    return null;
  }

  if (!hasAccess) {
    if (hideWhenDisabled) {
      return null;
    }
    return <>{fallback || <DefaultFallback />}</>;
  }

  return <>{children}</>;
}

/**
 * MultiFeatureGate - Controla acesso a múltiplas features
 * 
 * @example
 * ```tsx
 * // Precisa de TODAS as features
 * <MultiFeatureGate features={['insights', 'reputation']}>
 *   <AdvancedDashboard />
 * </MultiFeatureGate>
 * 
 * // Precisa de QUALQUER UMA das features
 * <MultiFeatureGate features={['insights', 'reputation']} requireAny>
 *   <BasicDashboard />
 * </MultiFeatureGate>
 * ```
 */
export function MultiFeatureGate({
  features,
  children,
  fallback,
  requireAny = false,
  hideWhenDisabled = false
}: MultiFeatureGateProps) {
  const { results, loading } = useMultipleFeatures(features);

  if (loading) {
    return null;
  }

  const hasAccess = requireAny
    ? features.some(f => results[f])
    : features.every(f => results[f]);

  if (!hasAccess) {
    if (hideWhenDisabled) {
      return null;
    }
    return <>{fallback || <DefaultFallback />}</>;
  }

  return <>{children}</>;
}

/**
 * UpgradePrompt - Componente para sugerir upgrade
 */
export function UpgradePrompt({
  title = 'Desbloqueie mais recursos',
  description = 'Atualize seu plano para ter acesso a funcionalidades avançadas.',
  ctaText = 'Ver opções',
  ctaHref = '/cliente/servicos'
}: {
  title?: string;
  description?: string;
  ctaText?: string;
  ctaHref?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#001533] to-[#1672d6] p-6 text-white"
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold">{title}</h3>
        </div>
        
        <p className="text-white/80 text-sm mb-4">{description}</p>
        
        <Link
          href={ctaHref}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white text-[#001533] rounded-lg text-sm font-semibold hover:bg-white/90 transition-colors"
        >
          {ctaText}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </motion.div>
  );
}

/**
 * FeatureBadge - Badge para indicar feature premium
 */
export function FeatureBadge({
  feature,
  label = 'Premium'
}: {
  feature: string;
  label?: string;
}) {
  const { hasAccess } = useFeature(feature);

  if (hasAccess) {
    return null;
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-yellow-400 to-amber-500 text-white text-xs font-bold rounded-full">
      <Lock className="w-3 h-3" />
      {label}
    </span>
  );
}

export default FeatureGate;


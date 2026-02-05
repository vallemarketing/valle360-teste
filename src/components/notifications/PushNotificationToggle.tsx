'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BellOff, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { cn } from '@/lib/utils';

interface PushNotificationToggleProps {
  variant?: 'full' | 'compact' | 'switch';
  className?: string;
}

export function PushNotificationToggle({ 
  variant = 'compact',
  className 
}: PushNotificationToggleProps) {
  const {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    error,
    subscribe,
    unsubscribe,
  } = usePushNotifications();

  const [showSuccess, setShowSuccess] = useState(false);

  const handleToggle = async () => {
    if (isSubscribed) {
      await unsubscribe();
    } else {
      const success = await subscribe();
      if (success) {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      }
    }
  };

  // Not supported
  if (!isSupported) {
    if (variant === 'switch') {
      return (
        <div className={cn('flex items-center gap-2 opacity-50', className)}>
          <BellOff className="w-4 h-4" />
          <span className="text-sm">Não suportado</span>
        </div>
      );
    }
    return null;
  }

  // Permission denied
  if (permission === 'denied') {
    if (variant === 'switch') {
      return (
        <div className={cn('flex items-center gap-2 text-primary', className)}>
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">Bloqueado</span>
        </div>
      );
    }
    
    return (
      <Card className={cn('border-primary/30 bg-primary/5', className)}>
        <CardContent className="pt-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-primary flex-shrink-0" />
            <div>
              <p className="font-medium text-sm">Notificações Bloqueadas</p>
              <p className="text-xs text-muted-foreground">
                Você bloqueou as notificações. Para ativar, acesse as configurações do navegador.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Switch variant
  if (variant === 'switch') {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        <Switch
          checked={isSubscribed}
          onCheckedChange={handleToggle}
          disabled={isLoading}
        />
        <div className="flex items-center gap-2">
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isSubscribed ? (
            <Bell className="w-4 h-4 text-[#1672d6]" />
          ) : (
            <BellOff className="w-4 h-4 text-muted-foreground" />
          )}
          <span className="text-sm">
            {isSubscribed ? 'Notificações ativas' : 'Notificações desativadas'}
          </span>
        </div>
      </div>
    );
  }

  // Compact variant
  if (variant === 'compact') {
    return (
      <div className={cn('relative', className)}>
        <Button
          variant={isSubscribed ? 'outline' : 'default'}
          size="sm"
          onClick={handleToggle}
          disabled={isLoading}
          className={cn(
            isSubscribed && 'border-[#1672d6]/30 text-[#1672d6]'
          )}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : isSubscribed ? (
            <Bell className="w-4 h-4 mr-2" />
          ) : (
            <BellOff className="w-4 h-4 mr-2" />
          )}
          {isSubscribed ? 'Notificações ativas' : 'Ativar notificações'}
        </Button>
        
        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute top-full mt-2 left-0 right-0 flex items-center gap-2 text-emerald-600 text-sm"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Ativado com sucesso!</span>
            </motion.div>
          )}
        </AnimatePresence>
        
        {error && (
          <p className="text-xs text-red-500 mt-1">{error}</p>
        )}
      </div>
    );
  }

  // Full variant
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#1672d6]" />
            <CardTitle className="text-lg">Notificações Push</CardTitle>
          </div>
          {isSubscribed && (
            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
              Ativo
            </Badge>
          )}
        </div>
        <CardDescription>
          Receba notificações em tempo real sobre tarefas, aprovações e atualizações importantes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div>
              <p className="font-medium text-sm">
                {isSubscribed ? 'Notificações ativas' : 'Notificações desativadas'}
              </p>
              <p className="text-xs text-muted-foreground">
                {isSubscribed 
                  ? 'Você receberá notificações push neste navegador'
                  : 'Ative para receber atualizações importantes'}
              </p>
            </div>
            <Switch
              checked={isSubscribed}
              onCheckedChange={handleToggle}
              disabled={isLoading}
            />
          </div>

          {isSubscribed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-2"
            >
              <p className="text-sm font-medium text-muted-foreground">
                Você será notificado sobre:
              </p>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#1672d6]" />
                  Novas tarefas atribuídas
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#1672d6]" />
                  Solicitações de aprovação
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#1672d6]" />
                  Status de conteúdos
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#1672d6]" />
                  Lembretes de reuniões
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#1672d6]" />
                  Alertas de SLA
                </li>
              </ul>
            </motion.div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <AnimatePresence>
            {showSuccess && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 text-emerald-600 text-sm"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Notificações ativadas com sucesso!</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}

export default PushNotificationToggle;

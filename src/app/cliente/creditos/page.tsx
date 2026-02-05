'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Plus, 
  TrendingDown, 
  TrendingUp,
  AlertCircle, 
  CreditCard, 
  Wallet, 
  X, 
  CheckCircle,
  QrCode,
  FileText,
  DollarSign,
  Loader2
} from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';

// ============================================
// PÁGINA DE CRÉDITOS - VALLE AI
// Com modal de adicionar crédito igual ao de pagar
// ============================================

interface Transaction {
  id: string;
  type: 'purchase' | 'usage' | 'bonus' | 'refund';
  amount: number;
  description: string;
  created_at: string;
}

interface CreditsData {
  balance: number;
  stats: {
    monthly_usage: number;
    last_month_usage: number;
    usage_change_percent: number;
    estimated_duration_months: number;
    low_balance: boolean;
  };
  transactions: Transaction[];
  credit_options: Array<{ value: number; bonus: number }>;
}

export default function CreditosPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<CreditsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card' | 'boleto' | null>(null);
  const [step, setStep] = useState<'amount' | 'payment' | 'success'>('amount');
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/client/credits', { cache: 'no-store' });
        const json = await res.json();
        
        if (!res.ok || !json.success) {
          throw new Error(json.error || 'Erro ao carregar créditos');
        }
        
        setData(json);
      } catch (e: any) {
        setError(e.message);
        console.error('Error fetching credits:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const balance = data?.balance || 0;
  const lowBalance = data?.stats?.low_balance || balance < 5000;
  const monthlyUsage = data?.stats?.monthly_usage || 0;
  const usageChange = data?.stats?.usage_change_percent || 0;
  const estimatedDuration = data?.stats?.estimated_duration_months || 0;
  const transactions = data?.transactions || [];
  const CREDIT_OPTIONS = data?.credit_options || [
    { value: 5000, bonus: 0 },
    { value: 10000, bonus: 500 },
    { value: 20000, bonus: 1500 },
    { value: 50000, bonus: 5000 },
  ];

  const resetModal = () => {
    setSelectedAmount(null);
    setCustomAmount('');
    setPaymentMethod(null);
    setStep('amount');
    setShowAddModal(false);
    setPurchasing(false);
  };

  const handleProceed = async () => {
    if (step === 'amount' && (selectedAmount || customAmount)) {
      setStep('payment');
    } else if (step === 'payment' && paymentMethod) {
      try {
        setPurchasing(true);
        const res = await fetch('/api/client/credits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: finalAmount,
            payment_method: paymentMethod,
          }),
        });
        const json = await res.json();
        
        if (!res.ok || !json.success) {
          throw new Error(json.error || 'Erro ao processar pagamento');
        }
        
        setStep('success');
        setTimeout(resetModal, 3000);
      } catch (e: any) {
        alert(e.message);
      } finally {
        setPurchasing(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#1672d6]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-600">Erro: {error}</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Tentar novamente
        </Button>
      </div>
    );
  }

  const finalAmount = selectedAmount || Number(customAmount) || 0;
  const bonus = CREDIT_OPTIONS.find(o => o.value === finalAmount)?.bonus || 0;

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-[#001533] dark:text-white mb-2">Créditos</h1>
        <p className="text-[#001533]/60 dark:text-white/60">Gerencie seu saldo e adicione créditos</p>
      </motion.div>

      {lowBalance && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 rounded-xl bg-primary/10 border border-primary/30"
        >
          <AlertCircle className="w-5 h-5 text-primary flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-amber-700 dark:text-amber-300">Saldo Baixo</p>
            <p className="text-sm text-primary/70 dark:text-amber-300/70">
              Seu saldo está abaixo de R$ 5.000. Considere adicionar créditos.
            </p>
          </div>
          <Button 
            className="bg-primary hover:bg-primary text-white"
            onClick={() => setShowAddModal(true)}
          >
            Adicionar Agora
          </Button>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid gap-6 md:grid-cols-3"
      >
        <Card className="border-[#001533]/10 dark:border-white/10 hover:shadow-xl transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-[#001533]/60 dark:text-white/60 flex items-center gap-2">
              <Wallet className="size-4" />
              Saldo Disponível
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-[#1672d6]">{formatCurrency(balance)}</div>
            <Button 
              className="w-full mt-4 bg-[#1672d6] hover:bg-[#1260b5]"
              onClick={() => setShowAddModal(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Créditos
            </Button>
          </CardContent>
        </Card>

        <Card className="border-[#001533]/10 dark:border-white/10 hover:shadow-xl transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-[#001533]/60 dark:text-white/60 flex items-center gap-2">
              <DollarSign className="size-4" />
              Gasto no Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#001533] dark:text-white">{formatCurrency(monthlyUsage)}</div>
            <p className={cn(
              "text-xs mt-2 flex items-center gap-1",
              usageChange < 0 ? "text-emerald-600" : usageChange > 0 ? "text-red-500" : "text-gray-500"
            )}>
              {usageChange < 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
              {usageChange > 0 ? '+' : ''}{usageChange}% vs. mês anterior
            </p>
          </CardContent>
        </Card>

        <Card className="border-[#001533]/10 dark:border-white/10 hover:shadow-xl transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-[#001533]/60 dark:text-white/60">Previsão de Duração</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#001533] dark:text-white">{estimatedDuration} meses</div>
            <p className="text-xs text-[#001533]/60 dark:text-white/60 mt-2">Com base no consumo atual</p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-[#001533]/10 dark:border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="size-5 text-[#1672d6]" />
              Histórico de Transações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {transactions.length === 0 ? (
                <p className="text-center text-[#001533]/60 dark:text-white/60 py-8">
                  Nenhuma transação registrada ainda.
                </p>
              ) : (
                transactions.map((transaction, index) => {
                  const isPositive = transaction.type === 'purchase' || transaction.type === 'bonus' || transaction.type === 'refund';
                  const typeLabel = {
                    purchase: 'Compra',
                    usage: 'Uso',
                    bonus: 'Bônus',
                    refund: 'Reembolso',
                  }[transaction.type] || 'Transação';
                  
                  return (
                    <motion.div
                      key={transaction.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className="flex items-center justify-between p-4 rounded-xl bg-[#001533]/5 dark:bg-white/5 hover:bg-[#001533]/10 dark:hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "p-2 rounded-lg",
                          isPositive 
                            ? "bg-emerald-500/10 text-emerald-600" 
                            : "bg-red-500/10 text-red-600"
                        )}>
                          {isPositive ? (
                            <Plus className="size-4" />
                          ) : (
                            <TrendingDown className="size-4" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-[#001533] dark:text-white">{transaction.description}</p>
                          <p className="text-sm text-[#001533]/60 dark:text-white/60">
                            {new Date(transaction.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className={cn(
                          "text-lg font-bold",
                          isPositive ? "text-emerald-500" : "text-red-500"
                        )}>
                          {isPositive && transaction.amount > 0 ? '+' : ''}
                          {formatCurrency(transaction.amount)}
                        </p>
                        <Badge 
                          variant="outline"
                          className={cn(
                            isPositive 
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" 
                              : "bg-red-500/10 text-red-600 border-red-500/30"
                          )}
                        >
                          {typeLabel}
                        </Badge>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Modal de Adicionar Créditos */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={resetModal}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#0a0f1a] shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="relative bg-gradient-to-r from-[#001533] to-[#1672d6] p-6 text-white">
                <button
                  onClick={resetModal}
                  className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/20 transition-colors"
                >
                  <X className="size-5" />
                </button>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Plus className="size-5" />
                  Adicionar Créditos
                </h2>
                <p className="text-white/80 mt-1">Escolha o valor e a forma de pagamento</p>
              </div>

              {/* Content */}
              <div className="p-6">
                <AnimatePresence mode="wait">
                  {step === 'amount' && (
                    <motion.div
                      key="amount"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      <p className="text-sm text-[#001533]/60 dark:text-white/60">
                        Selecione um valor ou digite um personalizado:
                      </p>
                      
                      <div className="grid grid-cols-2 gap-3">
                        {CREDIT_OPTIONS.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => {
                              setSelectedAmount(option.value);
                              setCustomAmount('');
                            }}
                            className={cn(
                              "p-4 rounded-xl border-2 text-left transition-all",
                              selectedAmount === option.value
                                ? "border-[#1672d6] bg-[#1672d6]/10"
                                : "border-[#001533]/10 hover:border-[#1672d6]/50"
                            )}
                          >
                            <p className="font-bold text-lg text-[#001533] dark:text-white">
                              {formatCurrency(option.value)}
                            </p>
                            {option.bonus > 0 && (
                              <Badge className="mt-1 bg-emerald-500 text-white">
                                +{formatCurrency(option.bonus)} bônus
                              </Badge>
                            )}
                          </button>
                        ))}
                      </div>

                      <div className="pt-2">
                        <label className="text-sm text-[#001533]/60 dark:text-white/60 mb-2 block">
                          Ou digite um valor personalizado:
                        </label>
                        <Input
                          type="number"
                          placeholder="Ex: 15000"
                          value={customAmount}
                          onChange={(e) => {
                            setCustomAmount(e.target.value);
                            setSelectedAmount(null);
                          }}
                          className="text-lg"
                        />
                      </div>

                      <Button
                        onClick={handleProceed}
                        disabled={!selectedAmount && !customAmount}
                        className="w-full bg-[#1672d6] hover:bg-[#1260b5] mt-4"
                      >
                        Continuar
                      </Button>
                    </motion.div>
                  )}

                  {step === 'payment' && (
                    <motion.div
                      key="payment"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      <div className="p-4 rounded-xl bg-[#1672d6]/10 border border-[#1672d6]/30">
                        <p className="text-sm text-[#001533]/60 dark:text-white/60">Valor selecionado:</p>
                        <p className="text-2xl font-bold text-[#1672d6]">
                          {formatCurrency(finalAmount)}
                          {bonus > 0 && (
                            <span className="text-sm text-emerald-600 ml-2">
                              +{formatCurrency(bonus)} bônus
                            </span>
                          )}
                        </p>
                      </div>

                      <p className="text-sm text-[#001533]/60 dark:text-white/60">
                        Escolha a forma de pagamento:
                      </p>

                      <div className="space-y-2">
                        {[
                          { id: 'pix', name: 'Pix', desc: 'Aprovação instantânea', icon: QrCode },
                          { id: 'card', name: 'Cartão de Crédito', desc: 'Pagamento à vista', icon: CreditCard },
                          { id: 'boleto', name: 'Boleto Bancário', desc: '1-3 dias úteis', icon: FileText },
                        ].map((method) => {
                          const Icon = method.icon;
                          return (
                            <button
                              key={method.id}
                              onClick={() => setPaymentMethod(method.id as any)}
                              className={cn(
                                "w-full p-4 rounded-xl border-2 flex items-center gap-4 transition-all",
                                paymentMethod === method.id
                                  ? "border-[#1672d6] bg-[#1672d6]/10"
                                  : "border-[#001533]/10 hover:border-[#1672d6]/50"
                              )}
                            >
                              <div className="p-2 rounded-lg bg-[#001533]/10 dark:bg-white/10">
                                <Icon className="size-5 text-[#1672d6]" />
                              </div>
                              <div className="text-left">
                                <p className="font-semibold text-[#001533] dark:text-white">
                                  {method.name}
                                </p>
                                <p className="text-sm text-[#001533]/60 dark:text-white/60">
                                  {method.desc}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          onClick={() => setStep('amount')}
                          className="flex-1"
                        >
                          Voltar
                        </Button>
                        <Button
                          onClick={handleProceed}
                          disabled={!paymentMethod || purchasing}
                          className="flex-1 bg-[#1672d6] hover:bg-[#1260b5]"
                        >
                          {purchasing ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                          Confirmar Pagamento
                        </Button>
                      </div>
                    </motion.div>
                  )}

                  {step === 'success' && (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-8"
                    >
                      <div className="w-16 h-16 rounded-full bg-emerald-500 mx-auto mb-4 flex items-center justify-center">
                        <CheckCircle className="size-8 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-[#001533] dark:text-white mb-2">
                        Pagamento Processado!
                      </h3>
                      <p className="text-[#001533]/60 dark:text-white/60">
                        {paymentMethod === 'pix' && 'Escaneie o QR Code enviado para completar.'}
                        {paymentMethod === 'card' && 'Seus créditos foram adicionados.'}
                        {paymentMethod === 'boleto' && 'O boleto foi enviado para seu email.'}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

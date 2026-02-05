'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, CreditCard, Calendar, DollarSign, AlertCircle, CheckCircle, Loader2, RefreshCw } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { PaymentCheckoutModal } from '@/components/payment/PaymentCheckoutModal';
import { cn } from '@/lib/utils';

interface Invoice {
  id: string;
  number?: string;
  amount: number;
  status: 'pending' | 'overdue' | 'paid' | 'cancelled';
  due_date: string;
  paid_at?: string;
  description?: string;
  reference_month?: string;
  days_overdue?: number;
}

interface Summary {
  total: number;
  pending: number;
  overdue: number;
  paid: number;
  totalPending: number;
  totalPaid: number;
}

export default function ClienteFinanceiroPage() {
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  const fetchInvoices = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (selectedYear) params.set('year', selectedYear);
      
      const res = await fetch(`/api/client/invoices?${params}`);
      if (!res.ok) throw new Error('Falha ao carregar faturas');
      
      const data = await res.json();
      setInvoices(data.invoices || []);
      setSummary(data.summary || null);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [selectedYear]);

  const pendingInvoices = invoices.filter(inv => inv.status === 'pending' || inv.status === 'overdue');
  const nextDue = pendingInvoices.length > 0 
    ? pendingInvoices.sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())[0]
    : null;

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { className: string; label: string }> = {
      pending: { className: 'bg-primary/10 text-primary border-primary/30', label: 'Pendente' },
      overdue: { className: 'bg-red-500/10 text-red-600 border-red-500/30', label: 'Em Atraso' },
      paid: { className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30', label: 'Pago' },
      cancelled: { className: 'bg-gray-500/10 text-gray-600 border-gray-500/30', label: 'Cancelado' },
    };
    const style = styles[status] || styles.pending;
    return <Badge variant="outline" className={style.className}>{style.label}</Badge>;
  };

  const formatInvoiceNumber = (invoice: Invoice) => {
    if (invoice.number) return invoice.number;
    const date = new Date(invoice.due_date);
    return `INV-${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#1672d6]" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-[#001533] dark:text-white mb-2">Financeiro</h1>
          <p className="text-[#001533]/60 dark:text-white/60">Gerencie suas faturas e pagamentos</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-3 py-2 rounded-lg border border-[#001533]/20 bg-white dark:bg-[#001533] text-sm"
          >
            {[2024, 2025, 2026].map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          <Button variant="outline" size="sm" onClick={fetchInvoices}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>

      {/* Error State */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30"
        >
          <AlertCircle className="size-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchInvoices}>Tentar novamente</Button>
        </motion.div>
      )}

      {/* Alerta de Fatura Pendente */}
      {pendingInvoices.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={cn(
            "flex items-center gap-3 p-4 rounded-xl border",
            pendingInvoices.some(i => i.status === 'overdue')
              ? "bg-red-500/10 border-red-500/30"
              : "bg-primary/10 border-primary/30"
          )}
        >
          <AlertCircle className={cn(
            "size-5 flex-shrink-0",
            pendingInvoices.some(i => i.status === 'overdue') ? "text-red-500" : "text-primary"
          )} />
          <p className={cn(
            "text-sm",
            pendingInvoices.some(i => i.status === 'overdue') 
              ? "text-red-700 dark:text-red-300" 
              : "text-amber-700 dark:text-amber-300"
          )}>
            Você tem <strong>{pendingInvoices.length} fatura(s) pendente(s)</strong>
            {pendingInvoices.some(i => i.status === 'overdue') && (
              <span className="text-red-600 font-bold"> ({pendingInvoices.filter(i => i.status === 'overdue').length} em atraso)</span>
            )}
            {nextDue && (
              <span>. Próximo vencimento em {new Date(nextDue.due_date).toLocaleDateString('pt-BR')}.</span>
            )}
          </p>
        </motion.div>
      )}

      {/* Cards de Resumo */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid gap-6 md:grid-cols-3"
      >
        <Card className="hover:shadow-xl transition-shadow border-[#001533]/10 dark:border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-[#001533]/60 dark:text-white/60 flex items-center gap-2">
              <DollarSign className="size-4" />
              Total Pendente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{formatCurrency(summary?.totalPending || 0)}</div>
            <p className="text-sm text-[#001533]/60 dark:text-white/60 mt-1">{summary?.pending || 0} fatura(s)</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xl transition-shadow border-[#001533]/10 dark:border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-[#001533]/60 dark:text-white/60 flex items-center gap-2">
              <CheckCircle className="size-4" />
              Total Pago ({selectedYear})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">{formatCurrency(summary?.totalPaid || 0)}</div>
            <p className="text-sm text-[#001533]/60 dark:text-white/60 mt-1">{summary?.paid || 0} fatura(s)</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xl transition-shadow border-[#001533]/10 dark:border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-[#001533]/60 dark:text-white/60 flex items-center gap-2">
              <Calendar className="size-4" />
              Próximo Vencimento
            </CardTitle>
          </CardHeader>
          <CardContent>
            {nextDue ? (
              <>
                <div className="text-3xl font-bold text-[#001533] dark:text-white">
                  {new Date(nextDue.due_date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
                </div>
                <p className="text-sm text-[#001533]/60 dark:text-white/60 mt-1">{formatCurrency(nextDue.amount)}</p>
              </>
            ) : (
              <>
                <div className="text-3xl font-bold text-emerald-600">✓</div>
                <p className="text-sm text-emerald-600 mt-1">Nenhuma fatura pendente</p>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Histórico de Faturas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="border-0 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-[#1672d6] to-[#1672d6]/80 text-white">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="size-5" />
              Histórico de Faturas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {invoices.length === 0 ? (
              <div className="p-8 text-center">
                <CreditCard className="w-12 h-12 mx-auto text-[#001533]/20 mb-4" />
                <p className="text-[#001533]/60 dark:text-white/60">Nenhuma fatura encontrada</p>
              </div>
            ) : (
              <div className="divide-y divide-[#1672d6]/10">
                {invoices.map((invoice, index) => (
                  <motion.div
                    key={invoice.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.05 }}
                    className={cn(
                      "flex items-center justify-between p-4",
                      "bg-[#1672d6]/5 hover:bg-[#1672d6]/10 transition-colors"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "p-2 rounded-lg",
                        invoice.status === 'paid' 
                          ? "bg-emerald-500/10 text-emerald-600"
                          : invoice.status === 'overdue'
                          ? "bg-red-500/10 text-red-600"
                          : "bg-primary/10 text-primary"
                      )}>
                        {invoice.status === 'paid' ? (
                          <CheckCircle className="size-5" />
                        ) : (
                          <AlertCircle className="size-5" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-[#001533] dark:text-white">
                          {formatInvoiceNumber(invoice)}
                        </p>
                        <p className="text-sm text-[#001533]/60 dark:text-white/60">
                          Vencimento: {new Date(invoice.due_date).toLocaleDateString('pt-BR')}
                          {invoice.paid_at && (
                            <span className="ml-2 text-emerald-600">
                              • Pago em: {new Date(invoice.paid_at).toLocaleDateString('pt-BR')}
                            </span>
                          )}
                          {invoice.status === 'overdue' && invoice.days_overdue && (
                            <span className="ml-2 text-red-600">
                              • {invoice.days_overdue} dias em atraso
                            </span>
                          )}
                        </p>
                        {invoice.description && (
                          <p className="text-xs text-[#001533]/40 dark:text-white/40 mt-1">
                            {invoice.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-lg font-bold text-[#001533] dark:text-white">
                          {formatCurrency(invoice.amount)}
                        </p>
                        {getStatusBadge(invoice.status)}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="border-[#1672d6]/30 text-[#1672d6] hover:bg-[#1672d6]/10">
                          <Download className="w-4 h-4 mr-1" />
                          PDF
                        </Button>
                        {(invoice.status === 'pending' || invoice.status === 'overdue') && (
                          <Button
                            size="sm"
                            className="bg-[#1672d6] hover:bg-[#1260b5] text-white"
                            onClick={() => setSelectedInvoice(invoice)}
                          >
                            <CreditCard className="w-4 h-4 mr-1" />
                            Pagar
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Formas de Pagamento */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="p-4 rounded-xl bg-[#001533]/5 dark:bg-white/5 border border-[#001533]/10 dark:border-white/10"
      >
        <h3 className="font-semibold text-[#001533] dark:text-white mb-2">Formas de Pagamento Aceitas</h3>
        <p className="text-sm text-[#001533]/60 dark:text-white/60">
          Cartão de Crédito (pagamento à vista) • Pix • Boleto Bancário
        </p>
      </motion.div>

      {selectedInvoice && (
        <PaymentCheckoutModal
          invoice={{
            id: parseInt(selectedInvoice.id) || 1,
            number: formatInvoiceNumber(selectedInvoice),
            amount: selectedInvoice.amount,
            status: selectedInvoice.status,
            dueDate: selectedInvoice.due_date,
            paidDate: selectedInvoice.paid_at || null,
          }}
          onClose={() => setSelectedInvoice(null)}
        />
      )}
    </div>
  );
}

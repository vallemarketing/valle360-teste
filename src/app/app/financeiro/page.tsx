'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Clock,
  Calendar,
  Download,
  Upload,
  Filter,
  Plus,
  Receipt,
  Wallet,
  PieChart,
  BarChart3,
  FileText,
  Send,
} from 'lucide-react';

interface Invoice {
  id: string;
  client: string;
  service: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue' | 'cancelled';
  issueDate: string;
  dueDate: string;
  paymentDate?: string;
  paymentMethod?: 'pix' | 'credit_card' | 'boleto' | 'transfer';
  invoiceNumber: string;
}

interface Expense {
  id: string;
  description: string;
  category: 'salario' | 'fornecedor' | 'infraestrutura' | 'marketing' | 'outros';
  amount: number;
  date: string;
  status: 'paid' | 'pending';
  paymentMethod?: string;
}

interface FinancialMetrics {
  monthlyRevenue: number;
  receivable: number;
  overdue: number;
  expenses: number;
  netProfit: number;
  profitMargin: number;
  averageTicket: number;
  pendingInvoices: number;
}

export default function FinanceiroPage() {
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [selectedTab, setSelectedTab] = useState<'invoices' | 'expenses' | 'reports'>('invoices');

  const invoices: Invoice[] = [
    {
      id: '1',
      client: 'Cliente A - Restaurante',
      service: 'Gestão de Marketing Digital',
      amount: 5000,
      status: 'paid',
      issueDate: '01/11/2025',
      dueDate: '10/11/2025',
      paymentDate: '08/11/2025',
      paymentMethod: 'pix',
      invoiceNumber: 'NF-2025-001',
    },
    {
      id: '2',
      client: 'Cliente B - Loja Online',
      service: 'Social Media + Tráfego',
      amount: 3500,
      status: 'pending',
      issueDate: '05/11/2025',
      dueDate: '15/11/2025',
      invoiceNumber: 'NF-2025-002',
    },
    {
      id: '3',
      client: 'Cliente C - Consultoria',
      service: 'Website Institucional',
      amount: 7200,
      status: 'paid',
      issueDate: '01/11/2025',
      dueDate: '10/11/2025',
      paymentDate: '09/11/2025',
      paymentMethod: 'transfer',
      invoiceNumber: 'NF-2025-003',
    },
    {
      id: '4',
      client: 'Cliente D - Academia',
      service: 'Identidade Visual',
      amount: 4100,
      status: 'overdue',
      issueDate: '15/10/2025',
      dueDate: '25/10/2025',
      invoiceNumber: 'NF-2025-004',
    },
    {
      id: '5',
      client: 'Cliente B - Loja Online',
      service: 'Manutenção Website',
      amount: 2000,
      status: 'pending',
      issueDate: '03/11/2025',
      dueDate: '13/11/2025',
      invoiceNumber: 'NF-2025-005',
    },
  ];

  const expenses: Expense[] = [
    {
      id: '1',
      description: 'Salários - Equipe',
      category: 'salario',
      amount: 18000,
      date: '05/11/2025',
      status: 'paid',
      paymentMethod: 'Transferência',
    },
    {
      id: '2',
      description: 'Meta Ads - Cliente A',
      category: 'marketing',
      amount: 2500,
      date: '01/11/2025',
      status: 'paid',
      paymentMethod: 'Cartão Corporativo',
    },
    {
      id: '3',
      description: 'AWS - Hospedagem',
      category: 'infraestrutura',
      amount: 450,
      date: '10/11/2025',
      status: 'pending',
    },
    {
      id: '4',
      description: 'Adobe Creative Cloud',
      category: 'fornecedor',
      amount: 280,
      date: '15/11/2025',
      status: 'pending',
    },
  ];

  const metrics: FinancialMetrics = {
    monthlyRevenue: 19800,
    receivable: 9600,
    overdue: 4100,
    expenses: 21230,
    netProfit: -1430,
    profitMargin: -7.2,
    averageTicket: 4400,
    pendingInvoices: 3,
  };

  const filteredInvoices = selectedFilter === 'all'
    ? invoices
    : invoices.filter(i => i.status === selectedFilter);

  const getStatusBadge = (status: string) => {
    const variants = {
      paid: { label: 'Pago', color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200', icon: <CheckCircle className="w-3 h-3" /> },
      pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200', icon: <Clock className="w-3 h-3" /> },
      overdue: { label: 'Atrasado', color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200', icon: <AlertCircle className="w-3 h-3" /> },
      cancelled: { label: 'Cancelado', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300', icon: <AlertCircle className="w-3 h-3" /> },
    };
    const variant = variants[status as keyof typeof variants];
    return (
      <Badge className={`${variant.color} flex items-center gap-1`}>
        {variant.icon}
        {variant.label}
      </Badge>
    );
  };

  const getPaymentMethodBadge = (method: string) => {
    const variants = {
      pix: { label: 'PIX', color: 'bg-blue-100 text-blue-700' },
      credit_card: { label: 'Cartão', color: 'bg-purple-100 text-purple-700' },
      boleto: { label: 'Boleto', color: 'bg-amber-100 text-amber-700' },
      transfer: { label: 'Transferência', color: 'bg-teal-100 text-teal-700' },
    };
    const variant = variants[method as keyof typeof variants];
    return <Badge className={variant.color}>{variant.label}</Badge>;
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'salario':
        return <Wallet className="w-4 h-4" />;
      case 'fornecedor':
        return <Receipt className="w-4 h-4" />;
      case 'infraestrutura':
        return <Upload className="w-4 h-4" />;
      case 'marketing':
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard - Financeiro</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Gestão de faturamento, cobranças e despesas
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button className="bg-primary hover:bg-[#1260b5]">
            <Plus className="w-4 h-4 mr-2" />
            Nova Fatura
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 dark:text-green-300 mb-1">Faturamento do Mês</p>
                <p className="text-3xl font-bold text-green-600">
                  R$ {metrics.monthlyRevenue.toLocaleString()}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">Novembro 2025</p>
              </div>
              <DollarSign className="w-10 h-10 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-1">A Receber</p>
                <p className="text-3xl font-bold text-blue-600">
                  R$ {metrics.receivable.toLocaleString()}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">{metrics.pendingInvoices} faturas</p>
              </div>
              <Clock className="w-10 h-10 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-700 dark:text-red-300 mb-1">Em Atraso</p>
                <p className="text-3xl font-bold text-red-600">
                  R$ {metrics.overdue.toLocaleString()}
                </p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">Requer ação</p>
              </div>
              <AlertCircle className="w-10 h-10 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className={`${
          metrics.netProfit >= 0
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200'
            : 'bg-red-50 dark:bg-red-900/20 border-red-200'
        } hover:shadow-lg transition-shadow`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${
                  metrics.netProfit >= 0 ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
                } mb-1`}>
                  Lucro Líquido
                </p>
                <p className={`text-3xl font-bold ${
                  metrics.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  R$ {Math.abs(metrics.netProfit).toLocaleString()}
                </p>
                <p className={`text-xs ${
                  metrics.netProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                } mt-1`}>
                  Margem: {metrics.profitMargin}%
                </p>
              </div>
              {metrics.netProfit >= 0 ? (
                <TrendingUp className="w-10 h-10 text-green-500" />
              ) : (
                <TrendingDown className="w-10 h-10 text-red-500" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Despesas do Mês</span>
              <TrendingDown className="w-5 h-5 text-red-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              R$ {metrics.expenses.toLocaleString()}
            </p>
            <p className="text-xs text-red-600 mt-1">-{((metrics.expenses / metrics.monthlyRevenue) * 100).toFixed(0)}% da receita</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Ticket Médio</span>
              <BarChart3 className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              R$ {metrics.averageTicket.toLocaleString()}
            </p>
            <p className="text-xs text-blue-600 mt-1">Por cliente</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Taxa de Inadimplência</span>
              <PieChart className="w-5 h-5 text-primary" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {((metrics.overdue / metrics.monthlyRevenue) * 100).toFixed(1)}%
            </p>
            <p className="text-xs text-primary mt-1">Do faturamento</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <Button
          variant={selectedTab === 'invoices' ? 'default' : 'ghost'}
          onClick={() => setSelectedTab('invoices')}
          className={selectedTab === 'invoices' ? 'bg-primary hover:bg-[#1260b5]' : ''}
        >
          <Receipt className="w-4 h-4 mr-2" />
          Faturas ({invoices.length})
        </Button>
        <Button
          variant={selectedTab === 'expenses' ? 'default' : 'ghost'}
          onClick={() => setSelectedTab('expenses')}
          className={selectedTab === 'expenses' ? 'bg-primary hover:bg-[#1260b5]' : ''}
        >
          <CreditCard className="w-4 h-4 mr-2" />
          Despesas ({expenses.length})
        </Button>
        <Button
          variant={selectedTab === 'reports' ? 'default' : 'ghost'}
          onClick={() => setSelectedTab('reports')}
          className={selectedTab === 'reports' ? 'bg-primary hover:bg-[#1260b5]' : ''}
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          Relatórios
        </Button>
      </div>

      {selectedTab === 'invoices' && (
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle>Faturas Emitidas</CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Gestão de cobranças e recebimentos
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant={selectedFilter === 'all' ? 'default' : 'outline'}
                  onClick={() => setSelectedFilter('all')}
                  className={selectedFilter === 'all' ? 'bg-primary' : ''}
                >
                  Todas
                </Button>
                <Button
                  size="sm"
                  variant={selectedFilter === 'pending' ? 'default' : 'outline'}
                  onClick={() => setSelectedFilter('pending')}
                  className={selectedFilter === 'pending' ? 'bg-primary' : ''}
                >
                  Pendentes
                </Button>
                <Button
                  size="sm"
                  variant={selectedFilter === 'overdue' ? 'default' : 'outline'}
                  onClick={() => setSelectedFilter('overdue')}
                  className={selectedFilter === 'overdue' ? 'bg-primary' : ''}
                >
                  Atrasadas
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredInvoices.map((invoice) => (
                <Card
                  key={invoice.id}
                  className={`hover:shadow-md transition-shadow ${
                    invoice.status === 'overdue' ? 'border-2 border-red-300 bg-red-50 dark:bg-red-900/20' : ''
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#1672d6] to-[#001533] flex items-center justify-center text-white">
                          <Receipt className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900 dark:text-white">{invoice.client}</h3>
                            <Badge variant="outline" className="text-xs">{invoice.invoiceNumber}</Badge>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{invoice.service}</p>
                          <div className="flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-400 mb-2">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>Emissão: {invoice.issueDate}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>Vencimento: {invoice.dueDate}</span>
                            </div>
                            {invoice.paymentDate && (
                              <div className="flex items-center gap-1">
                                <CheckCircle className="w-3 h-3 text-green-600" />
                                <span>Pago em: {invoice.paymentDate}</span>
                              </div>
                            )}
                          </div>
                          {invoice.paymentMethod && (
                            <div className="flex items-center gap-2">
                              {getPaymentMethodBadge(invoice.paymentMethod)}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <p className="text-2xl font-bold text-green-600">
                          R$ {invoice.amount.toLocaleString()}
                        </p>
                        {getStatusBadge(invoice.status)}
                      </div>
                    </div>
                    {invoice.status !== 'paid' && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1">
                          <Send className="w-3 h-3 mr-2" />
                          Enviar Cobrança
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1">
                          <Download className="w-3 h-3 mr-2" />
                          Baixar PDF
                        </Button>
                        {invoice.status === 'pending' && (
                          <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700">
                            <CheckCircle className="w-3 h-3 mr-2" />
                            Confirmar Pagamento
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedTab === 'expenses' && (
        <Card className="border-2 border-red-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-red-900 dark:text-red-200">Despesas e Pagamentos</CardTitle>
                <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                  Controle de gastos mensais
                </p>
              </div>
              <Button size="sm" className="bg-red-600 hover:bg-red-700">
                <Plus className="w-4 h-4 mr-2" />
                Nova Despesa
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {expenses.map((expense) => (
                <Card key={expense.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          expense.category === 'salario'
                            ? 'bg-gradient-to-br from-purple-400 to-purple-600'
                            : expense.category === 'marketing'
                            ? 'bg-gradient-to-br from-blue-400 to-blue-600'
                            : 'bg-gradient-to-br from-gray-400 to-gray-600'
                        }`}>
                          <div className="text-white">
                            {getCategoryIcon(expense.category)}
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{expense.description}</h3>
                          <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 mb-2">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>{expense.date}</span>
                            </div>
                            <Badge variant="outline" className="text-xs capitalize">
                              {expense.category}
                            </Badge>
                            {expense.paymentMethod && (
                              <span>{expense.paymentMethod}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <p className="text-2xl font-bold text-red-600">
                          -R$ {expense.amount.toLocaleString()}
                        </p>
                        {getStatusBadge(expense.status)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedTab === 'reports' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Distribuição de Receitas</CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Por tipo de serviço - Novembro
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { service: 'Marketing Digital', value: 8500, percentage: 43 },
                  { service: 'Desenvolvimento Web', value: 7200, percentage: 36 },
                  { service: 'Design Gráfico', value: 4100, percentage: 21 },
                ].map((item, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.service}</span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        R$ {item.value.toLocaleString()} ({item.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Distribuição de Despesas</CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Por categoria - Novembro
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { category: 'Salários', value: 18000, percentage: 85 },
                  { category: 'Marketing', value: 2500, percentage: 12 },
                  { category: 'Infraestrutura', value: 730, percentage: 3 },
                ].map((item, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.category}</span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        R$ {item.value.toLocaleString()} ({item.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-red-600 h-2 rounded-full"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

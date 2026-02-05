'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Send, 
  Eye, 
  Edit, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  X,
  Building,
  User,
  Calendar,
  DollarSign,
  Upload,
  FileSignature,
  Scale,
  Sparkles,
  MoreVertical
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Contract {
  id: string;
  clientName: string;
  clientCompany: string;
  type: 'service' | 'project' | 'retainer';
  status: 'draft' | 'pending_legal' | 'pending_signature' | 'signed' | 'expired';
  value: number;
  startDate: string;
  endDate: string;
  createdAt: string;
  services: string[];
}

export default function ContratosPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showNewContractModal, setShowNewContractModal] = useState(false);
  const [showContractPreview, setShowContractPreview] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);

  const [contracts] = useState<Contract[]>([
    {
      id: '1',
      clientName: 'João Silva',
      clientCompany: 'Tech Solutions Ltda',
      type: 'service',
      status: 'signed',
      value: 8500,
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      createdAt: '2023-12-15',
      services: ['Gestão de Redes Sociais', 'Tráfego Pago']
    },
    {
      id: '2',
      clientName: 'Maria Santos',
      clientCompany: 'Valle Boutique',
      type: 'service',
      status: 'pending_signature',
      value: 5200,
      startDate: '2024-02-01',
      endDate: '2025-01-31',
      createdAt: '2024-01-20',
      services: ['Design Gráfico', 'Criação de Conteúdo']
    },
    {
      id: '3',
      clientName: 'Pedro Costa',
      clientCompany: 'Inova Marketing',
      type: 'retainer',
      status: 'pending_legal',
      value: 12000,
      startDate: '2024-03-01',
      endDate: '2025-02-28',
      createdAt: '2024-02-10',
      services: ['Consultoria Estratégica', 'Gestão Completa']
    },
    {
      id: '4',
      clientName: 'Ana Oliveira',
      clientCompany: 'Digital Plus',
      type: 'project',
      status: 'draft',
      value: 15000,
      startDate: '2024-04-01',
      endDate: '2024-06-30',
      createdAt: '2024-03-01',
      services: ['Desenvolvimento Web', 'SEO']
    }
  ]);

  const stats = {
    total: contracts.length,
    signed: contracts.filter(c => c.status === 'signed').length,
    pending: contracts.filter(c => ['pending_legal', 'pending_signature'].includes(c.status)).length,
    totalValue: contracts.filter(c => c.status === 'signed').reduce((acc, c) => acc + c.value, 0)
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { className: string; label: string; icon: React.ReactNode }> = {
      draft: { className: 'bg-gray-500/10 text-gray-600 border-gray-500/30', label: 'Rascunho', icon: <Edit className="w-3 h-3" /> },
      pending_legal: { className: 'bg-purple-500/10 text-purple-600 border-purple-500/30', label: 'Aguardando Jurídico', icon: <Scale className="w-3 h-3" /> },
      pending_signature: { className: 'bg-amber-500/10 text-amber-600 border-amber-500/30', label: 'Aguardando Assinatura', icon: <Clock className="w-3 h-3" /> },
      signed: { className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30', label: 'Assinado', icon: <CheckCircle className="w-3 h-3" /> },
      expired: { className: 'bg-red-500/10 text-red-600 border-red-500/30', label: 'Expirado', icon: <AlertTriangle className="w-3 h-3" /> }
    };
    const style = styles[status];
    return (
      <Badge className={cn("border flex items-center gap-1", style.className)}>
        {style.icon}
        {style.label}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const types: Record<string, string> = {
      service: 'Prestação de Serviço',
      project: 'Projeto',
      retainer: 'Retainer'
    };
    return <Badge variant="outline">{types[type]}</Badge>;
  };

  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = 
      contract.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.clientCompany.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || contract.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleGenerateContract = (contract: Contract) => {
    setSelectedContract(contract);
    setShowContractPreview(true);
  };

  const handleSendToLegal = async (contractId: string) => {
    // Integração jurídica ainda não está conectada nesta tela.
    toast.message('Envio para Jurídico ainda não está integrado. Use o Kanban/Mensagens para acompanhar.');
    void contractId;
  };

  const handleSendForSignature = async () => {
    toast.message('Assinatura eletrônica ainda não está integrada. Use Mensagens para enviar o contrato ao cliente.');
  };

  const handleDownloadPDF = async () => {
    try {
      if (!selectedContract) {
        toast.error('Selecione um contrato para exportar.');
        return;
      }
      const blob = new Blob([JSON.stringify(selectedContract, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contrato-${String(selectedContract.id || 'export')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Contrato exportado (JSON).');
    } catch {
      toast.error('Falha ao exportar contrato.');
    }
  };

  const handleNewContract = () => {
    setShowNewContractModal(true);
  };

  const handleCloseNewContractModal = () => {
    setShowNewContractModal(false);
  };

  const handleExportCSV = async () => {
    try {
      const headers = ['id', 'cliente', 'empresa', 'status', 'tipo', 'valor', 'inicio', 'fim'];
      const escape = (v: any) => `"${String(v ?? '').replace(/\"/g, '""')}"`;
      const rows = filteredContracts.map((c) =>
        [
          escape(c.id),
          escape(c.clientName),
          escape(c.clientCompany),
          escape(c.status),
          escape(c.type),
          escape(c.value),
          escape(c.startDate),
          escape(c.endDate),
        ].join(',')
      );
      const csv = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contratos-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('CSV exportado com sucesso!');
    } catch (e: any) {
      toast.error(e?.message || 'Falha ao exportar CSV');
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0f1a] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#001533] dark:text-white mb-2">
                Gestão de Contratos
              </h1>
              <p className="text-[#001533]/60 dark:text-white/60">
                Geração automática e acompanhamento de contratos
              </p>
            </div>
            <Button 
              onClick={handleNewContract}
              className="bg-[#1672d6] hover:bg-[#1260b5]"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Contrato
            </Button>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total de Contratos', value: stats.total, icon: FileText, color: 'text-[#1672d6]' },
            { label: 'Contratos Ativos', value: stats.signed, icon: CheckCircle, color: 'text-emerald-500' },
            { label: 'Pendentes', value: stats.pending, icon: Clock, color: 'text-amber-500' },
            { label: 'Valor Total Mensal', value: `R$ ${stats.totalValue.toLocaleString('pt-BR')}`, icon: DollarSign, color: 'text-purple-500' }
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className="border-[#001533]/10 dark:border-white/10">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className={cn("p-3 rounded-xl bg-[#001533]/5 dark:bg-white/5", stat.color)}>
                      <stat.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm text-[#001533]/60 dark:text-white/60">{stat.label}</p>
                      <p className="text-2xl font-bold text-[#001533] dark:text-white">{stat.value}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <Card className="border-[#001533]/10 dark:border-white/10 mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#001533]/40" />
                <Input
                  placeholder="Buscar por cliente ou empresa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-[#001533]/20"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 rounded-lg border border-[#001533]/20 bg-white dark:bg-[#001533] focus:outline-none focus:ring-2 focus:ring-[#1672d6]"
              >
                <option value="all">Todos os Status</option>
                <option value="draft">Rascunho</option>
                <option value="pending_legal">Aguardando Jurídico</option>
                <option value="pending_signature">Aguardando Assinatura</option>
                <option value="signed">Assinados</option>
                <option value="expired">Expirados</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Contracts List */}
        <div className="space-y-4">
          {filteredContracts.map((contract, idx) => (
            <motion.div
              key={contract.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className="border-[#001533]/10 dark:border-white/10 hover:border-[#1672d6]/30 transition-all">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="p-3 rounded-xl bg-[#1672d6]/10">
                        <FileText className="w-6 h-6 text-[#1672d6]" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-bold text-[#001533] dark:text-white">
                            {contract.clientCompany}
                          </h3>
                          {getStatusBadge(contract.status)}
                          {getTypeBadge(contract.type)}
                        </div>
                        <p className="text-sm text-[#001533]/60 dark:text-white/60 mb-3">
                          {contract.clientName} • {contract.services.join(', ')}
                        </p>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-[#001533]/40 dark:text-white/40">Valor Mensal</p>
                            <p className="font-semibold text-[#1672d6]">
                              R$ {contract.value.toLocaleString('pt-BR')}
                            </p>
                          </div>
                          <div>
                            <p className="text-[#001533]/40 dark:text-white/40">Início</p>
                            <p className="font-medium">{new Date(contract.startDate).toLocaleDateString('pt-BR')}</p>
                          </div>
                          <div>
                            <p className="text-[#001533]/40 dark:text-white/40">Término</p>
                            <p className="font-medium">{new Date(contract.endDate).toLocaleDateString('pt-BR')}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleGenerateContract(contract)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Visualizar
                      </Button>
                      
                      {contract.status === 'draft' && (
                        <Button
                          size="sm"
                          onClick={() => handleSendToLegal(contract.id)}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          <Scale className="w-4 h-4 mr-1" />
                          Enviar ao Jurídico
                        </Button>
                      )}
                      
                      {contract.status === 'pending_signature' && (
                        <Button
                          size="sm"
                          className="bg-[#1672d6] hover:bg-[#1260b5]"
                        >
                          <Send className="w-4 h-4 mr-1" />
                          Enviar para Assinatura
                        </Button>
                      )}

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Download className="w-4 h-4 mr-2" />
                            Baixar PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <FileSignature className="w-4 h-4 mr-2" />
                            Renovar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {filteredContracts.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 mx-auto text-[#001533]/20 mb-4" />
            <p className="text-[#001533]/60 dark:text-white/60">Nenhum contrato encontrado</p>
          </div>
        )}
      </div>

      {/* Modal de Preview do Contrato */}
      <AnimatePresence>
        {showContractPreview && selectedContract && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => setShowContractPreview(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-[#0a0f1a] rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              {/* Header do Contrato */}
              <div className="p-6 border-b border-[#001533]/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <img 
                      src="/images/valle360-logo.png" 
                      alt="Valle 360" 
                      className="h-10"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <div>
                      <h2 className="text-xl font-bold">Contrato de Prestação de Serviços</h2>
                      <p className="text-sm text-[#001533]/60">Valle 360 Marketing Digital</p>
                    </div>
                  </div>
                  <button onClick={() => setShowContractPreview(false)}>
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Conteúdo do Contrato */}
              <div className="p-6 space-y-6">
                {/* Partes */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="p-4 rounded-xl bg-[#001533]/5">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Building className="w-4 h-4 text-[#1672d6]" />
                      CONTRATANTE
                    </h3>
                    <p className="font-bold">{selectedContract.clientCompany}</p>
                    <p className="text-sm text-[#001533]/60">{selectedContract.clientName}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-[#1672d6]/5">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Building className="w-4 h-4 text-[#1672d6]" />
                      CONTRATADA
                    </h3>
                    <p className="font-bold">Valle 360 Ltda</p>
                    <p className="text-sm text-[#001533]/60">CNPJ: 00.000.000/0001-00</p>
                  </div>
                </div>

                {/* Objeto */}
                <div>
                  <h3 className="font-semibold mb-2">CLÁUSULA 1ª - DO OBJETO</h3>
                  <p className="text-sm text-[#001533]/80 dark:text-white/80">
                    O presente contrato tem por objeto a prestação dos seguintes serviços de marketing digital:
                  </p>
                  <ul className="list-disc list-inside mt-2 text-sm">
                    {selectedContract.services.map((service, idx) => (
                      <li key={idx}>{service}</li>
                    ))}
                  </ul>
                </div>

                {/* Valor */}
                <div>
                  <h3 className="font-semibold mb-2">CLÁUSULA 2ª - DO VALOR</h3>
                  <p className="text-sm text-[#001533]/80 dark:text-white/80">
                    Pelos serviços prestados, a CONTRATANTE pagará à CONTRATADA o valor mensal de{' '}
                    <strong className="text-[#1672d6]">
                      R$ {selectedContract.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </strong>
                    , com vencimento todo dia 10 de cada mês.
                  </p>
                </div>

                {/* Vigência */}
                <div>
                  <h3 className="font-semibold mb-2">CLÁUSULA 3ª - DA VIGÊNCIA</h3>
                  <p className="text-sm text-[#001533]/80 dark:text-white/80">
                    Este contrato terá vigência de{' '}
                    <strong>{new Date(selectedContract.startDate).toLocaleDateString('pt-BR')}</strong> a{' '}
                    <strong>{new Date(selectedContract.endDate).toLocaleDateString('pt-BR')}</strong>,
                    podendo ser renovado automaticamente por igual período.
                  </p>
                </div>

                {/* Assinaturas */}
                <div className="grid grid-cols-2 gap-6 pt-6 border-t">
                  <div className="text-center">
                    <div className="h-20 border-b border-dashed border-[#001533]/30 mb-2"></div>
                    <p className="font-medium">{selectedContract.clientName}</p>
                    <p className="text-xs text-[#001533]/50">CONTRATANTE</p>
                  </div>
                  <div className="text-center">
                    <div className="h-20 border-b border-dashed border-[#001533]/30 mb-2"></div>
                    <p className="font-medium">Guilherme Valle</p>
                    <p className="text-xs text-[#001533]/50">CONTRATADA</p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-[#001533]/10 flex justify-between">
                <Button variant="outline" onClick={handleDownloadPDF}>
                  <Download className="w-4 h-4 mr-2" />
                  Baixar PDF
                </Button>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="text-purple-600 border-purple-600/30 hover:bg-purple-50"
                    onClick={() => handleSendToLegal(selectedContract.id)}
                  >
                    <Scale className="w-4 h-4 mr-2" />
                    Enviar ao Jurídico
                  </Button>
                  <Button 
                    className="bg-[#1672d6] hover:bg-[#1260b5]"
                    onClick={handleSendForSignature}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Enviar para Assinatura
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Novo Contrato */}
      <AnimatePresence>
        {showNewContractModal && (
          <NewContractModal 
            onClose={handleCloseNewContractModal}
            onSuccess={(contractData) => {
              toast.success('Contrato criado com sucesso!');
              handleCloseNewContractModal();
              // Reload page or update state
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ===== NEW CONTRACT MODAL COMPONENT =====

interface NewContractModalProps {
  onClose: () => void;
  onSuccess: (contract: any) => void;
}

function NewContractModal({ onClose, onSuccess }: NewContractModalProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [useOCR, setUseOCR] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    clientName: '',
    clientCompany: '',
    clientEmail: '',
    clientCNPJ: '',
    clientAddress: '',
    type: 'service' as 'service' | 'project' | 'retainer',
    template: 'standard',
    services: [] as string[],
    value: '',
    durationMonths: '12',
    startDate: new Date().toISOString().split('T')[0],
    paymentDay: '10',
    renewalType: 'manual' as 'auto' | 'manual' | 'none',
  });

  const availableServices = [
    'Gestão de Redes Sociais',
    'Tráfego Pago (Meta Ads)',
    'Tráfego Pago (Google Ads)',
    'Design Gráfico',
    'Criação de Conteúdo',
    'Consultoria Estratégica',
    'Desenvolvimento Web',
    'SEO',
    'Email Marketing',
    'Branding',
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleService = (service: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service]
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadedFile(file);
    
    if (useOCR) {
      setLoading(true);
      try {
        const formDataUpload = new FormData();
        formDataUpload.append('file', file);
        
        const res = await fetch('/api/admin/ocr/extract', {
          method: 'POST',
          body: formDataUpload,
        });
        
        if (res.ok) {
          const data = await res.json();
          setExtractedData(data);
          
          // Auto-fill form with extracted data
          if (data.clientName) setFormData(prev => ({ ...prev, clientName: data.clientName }));
          if (data.clientCompany) setFormData(prev => ({ ...prev, clientCompany: data.clientCompany }));
          if (data.clientCNPJ) setFormData(prev => ({ ...prev, clientCNPJ: data.clientCNPJ }));
          if (data.clientAddress) setFormData(prev => ({ ...prev, clientAddress: data.clientAddress }));
          if (data.clientEmail) setFormData(prev => ({ ...prev, clientEmail: data.clientEmail }));
          
          toast.success('Dados extraídos com sucesso!');
        }
      } catch (error) {
        toast.error('Falha ao extrair dados do documento');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const endDate = new Date(formData.startDate);
      endDate.setMonth(endDate.getMonth() + parseInt(formData.durationMonths));
      
      const contractData = {
        client_name: formData.clientName,
        client_email: formData.clientEmail,
        client_company: formData.clientCompany,
        client_cnpj: formData.clientCNPJ,
        client_address: formData.clientAddress,
        type: formData.type,
        template_used: formData.template,
        services: formData.services.map(s => ({ name: s, description: '', monthly_value: parseFloat(formData.value) / formData.services.length, deliverables: [] })),
        total_value: parseFloat(formData.value) * parseInt(formData.durationMonths),
        payment_terms: `Mensal, vencimento dia ${formData.paymentDay}`,
        duration_months: parseInt(formData.durationMonths),
        start_date: formData.startDate,
        end_date: endDate.toISOString(),
        renewal_type: formData.renewalType,
        status: 'draft',
      };

      const res = await fetch('/api/admin/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contractData),
      });

      if (res.ok) {
        const contract = await res.json();
        onSuccess(contract);
      } else {
        const error = await res.json();
        toast.error(error.message || 'Falha ao criar contrato');
      }
    } catch (error) {
      toast.error('Erro ao criar contrato');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-[#0a0f1a] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
      >
        {/* Header */}
        <div className="p-6 border-b border-[#001533]/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#1672d6]/10">
              <FileText className="w-5 h-5 text-[#1672d6]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#001533] dark:text-white">Novo Contrato</h2>
              <p className="text-sm text-[#001533]/60">Passo {step} de 3</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[#001533]/5 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-[#001533]/10">
          <div 
            className="h-full bg-[#1672d6] transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 1: Dados do Cliente */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-[#001533] dark:text-white mb-4 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Dados do Cliente
                </h3>

                {/* OCR Option */}
                <div className="mb-6 p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      <span className="font-medium text-purple-700 dark:text-purple-300">Extrair dados com IA</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={useOCR}
                        onChange={(e) => setUseOCR(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                  
                  {useOCR && (
                    <div>
                      <p className="text-sm text-purple-600 dark:text-purple-400 mb-3">
                        Faça upload de RG, CNPJ, ou Contrato Social para extrair automaticamente os dados.
                      </p>
                      <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-purple-300 rounded-xl cursor-pointer hover:border-purple-500 transition-colors">
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                        <Upload className="w-5 h-5 text-purple-500" />
                        <span className="text-sm text-purple-600">
                          {uploadedFile ? uploadedFile.name : 'Clique para fazer upload'}
                        </span>
                      </label>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Nome Completo *</label>
                    <Input
                      name="clientName"
                      value={formData.clientName}
                      onChange={handleInputChange}
                      placeholder="João da Silva"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Email *</label>
                    <Input
                      name="clientEmail"
                      type="email"
                      value={formData.clientEmail}
                      onChange={handleInputChange}
                      placeholder="joao@empresa.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Empresa *</label>
                    <Input
                      name="clientCompany"
                      value={formData.clientCompany}
                      onChange={handleInputChange}
                      placeholder="Empresa Ltda"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">CNPJ</label>
                    <Input
                      name="clientCNPJ"
                      value={formData.clientCNPJ}
                      onChange={handleInputChange}
                      placeholder="00.000.000/0001-00"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-2">Endereço</label>
                    <Input
                      name="clientAddress"
                      value={formData.clientAddress}
                      onChange={handleInputChange}
                      placeholder="Rua, número, bairro - Cidade/UF"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Serviços */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-[#001533] dark:text-white mb-4 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Serviços e Condições
                </h3>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Tipo de Contrato *</label>
                      <select
                        name="type"
                        value={formData.type}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 rounded-lg border border-[#001533]/20 bg-white dark:bg-[#001533] focus:outline-none focus:ring-2 focus:ring-[#1672d6]"
                      >
                        <option value="service">Prestação de Serviço</option>
                        <option value="project">Projeto</option>
                        <option value="retainer">Retainer</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Template</label>
                      <select
                        name="template"
                        value={formData.template}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 rounded-lg border border-[#001533]/20 bg-white dark:bg-[#001533] focus:outline-none focus:ring-2 focus:ring-[#1672d6]"
                      >
                        <option value="standard">Padrão</option>
                        <option value="premium">Premium</option>
                        <option value="enterprise">Enterprise</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-3">Serviços Contratados *</label>
                    <div className="grid grid-cols-2 gap-2">
                      {availableServices.map((service) => (
                        <button
                          key={service}
                          type="button"
                          onClick={() => toggleService(service)}
                          className={cn(
                            "p-3 text-sm text-left rounded-lg border transition-all",
                            formData.services.includes(service)
                              ? "border-[#1672d6] bg-[#1672d6]/10 text-[#1672d6]"
                              : "border-[#001533]/20 hover:border-[#1672d6]/50"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            {formData.services.includes(service) && <CheckCircle className="w-4 h-4" />}
                            {service}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Valores e Prazos */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-[#001533] dark:text-white mb-4 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Valores e Prazos
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Valor Mensal (R$) *</label>
                    <Input
                      name="value"
                      type="number"
                      value={formData.value}
                      onChange={handleInputChange}
                      placeholder="5000"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Duração (meses) *</label>
                    <select
                      name="durationMonths"
                      value={formData.durationMonths}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 rounded-lg border border-[#001533]/20 bg-white dark:bg-[#001533] focus:outline-none focus:ring-2 focus:ring-[#1672d6]"
                    >
                      <option value="3">3 meses</option>
                      <option value="6">6 meses</option>
                      <option value="12">12 meses</option>
                      <option value="24">24 meses</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Data de Início *</label>
                    <Input
                      name="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Dia de Vencimento</label>
                    <select
                      name="paymentDay"
                      value={formData.paymentDay}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 rounded-lg border border-[#001533]/20 bg-white dark:bg-[#001533] focus:outline-none focus:ring-2 focus:ring-[#1672d6]"
                    >
                      {[5, 10, 15, 20, 25].map(day => (
                        <option key={day} value={day}>Dia {day}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-2">Renovação</label>
                    <select
                      name="renewalType"
                      value={formData.renewalType}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 rounded-lg border border-[#001533]/20 bg-white dark:bg-[#001533] focus:outline-none focus:ring-2 focus:ring-[#1672d6]"
                    >
                      <option value="manual">Manual (requer aprovação)</option>
                      <option value="auto">Automática</option>
                      <option value="none">Sem renovação</option>
                    </select>
                  </div>
                </div>

                {/* Summary */}
                <div className="mt-6 p-4 rounded-xl bg-[#1672d6]/5 border border-[#1672d6]/20">
                  <h4 className="font-medium text-[#1672d6] mb-3">Resumo do Contrato</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-[#001533]/60">Cliente:</span>
                      <span className="ml-2 font-medium">{formData.clientCompany || '-'}</span>
                    </div>
                    <div>
                      <span className="text-[#001533]/60">Tipo:</span>
                      <span className="ml-2 font-medium">{formData.type}</span>
                    </div>
                    <div>
                      <span className="text-[#001533]/60">Serviços:</span>
                      <span className="ml-2 font-medium">{formData.services.length} selecionados</span>
                    </div>
                    <div>
                      <span className="text-[#001533]/60">Duração:</span>
                      <span className="ml-2 font-medium">{formData.durationMonths} meses</span>
                    </div>
                    <div>
                      <span className="text-[#001533]/60">Valor Mensal:</span>
                      <span className="ml-2 font-medium text-[#1672d6]">
                        R$ {parseFloat(formData.value || '0').toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#001533]/60">Valor Total:</span>
                      <span className="ml-2 font-medium text-[#1672d6]">
                        R$ {(parseFloat(formData.value || '0') * parseInt(formData.durationMonths)).toLocaleString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#001533]/10 flex justify-between">
          <Button
            variant="outline"
            onClick={() => step > 1 ? setStep(step - 1) : onClose()}
          >
            {step > 1 ? 'Voltar' : 'Cancelar'}
          </Button>
          
          {step < 3 ? (
            <Button
              onClick={() => setStep(step + 1)}
              className="bg-[#1672d6] hover:bg-[#1260b5]"
              disabled={
                (step === 1 && (!formData.clientName || !formData.clientEmail || !formData.clientCompany)) ||
                (step === 2 && formData.services.length === 0)
              }
            >
              Próximo
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              className="bg-[#1672d6] hover:bg-[#1260b5]"
              disabled={loading || !formData.value}
            >
              {loading ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Criar Contrato
                </>
              )}
            </Button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

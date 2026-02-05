'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { Upload, FileText, Shield, Search, Download, Trash2, Check } from 'lucide-react';
import { toast } from 'sonner';

interface Client {
  id: string;
  full_name: string;
  email: string;
}

interface Document {
  id: string;
  client_id: string;
  type: 'contract' | 'rules';
  file_url: string;
  version: number;
  is_current: boolean;
  created_at: string;
}

export default function AdminDocumentosPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [documentType, setDocumentType] = useState<'contract' | 'rules'>('contract');
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [contractData, setContractData] = useState({
    contract_number: '',
    plan_name: '',
    monthly_value: '',
    start_date: '',
    renewal_date: '',
    services: [] as string[],
  });

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    if (selectedClient) {
      loadDocuments(selectedClient);
    }
  }, [selectedClient]);

  const loadClients = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, full_name, email')
        .eq('user_type', 'client')
        .order('full_name');

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  const loadDocuments = async (clientId: string) => {
    try {
      const { data: contracts, error: contractsError } = await supabase
        .from('client_contracts')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      const { data: rules, error: rulesError } = await supabase
        .from('client_rules_documents')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (contractsError) throw contractsError;
      if (rulesError) throw rulesError;

      const allDocs: Document[] = [
        ...(contracts || []).map(c => ({ ...c, type: 'contract' as const })),
        ...(rules || []).map(r => ({ ...r, type: 'rules' as const })),
      ];

      setDocuments(allDocs);
    } catch (error) {
      console.error('Error loading documents:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedClient) return;

    if (file.type !== 'application/pdf') {
      toast.error('Apenas arquivos PDF são permitidos');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('O arquivo deve ter no máximo 10MB');
      return;
    }

    setUploading(true);

    try {
      const bucket = documentType === 'contract' ? 'contracts' : 'client-rules';
      const filePath = `${selectedClient}/${Date.now()}_${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      const { data: { user } } = await supabase.auth.getUser();

      if (documentType === 'contract') {
        const { error: insertError } = await supabase
          .from('client_contracts')
          .insert({
            client_id: selectedClient,
            contract_number: contractData.contract_number,
            plan_name: contractData.plan_name,
            monthly_value: parseFloat(contractData.monthly_value),
            start_date: contractData.start_date,
            renewal_date: contractData.renewal_date,
            contract_file_url: publicUrl,
            services_included: contractData.services,
            uploaded_by: user?.id,
            is_current: true,
            version: 1,
          });

        if (insertError) throw insertError;
      } else {
        const { error: insertError } = await supabase
          .from('client_rules_documents')
          .insert({
            client_id: selectedClient,
            rules_file_url: publicUrl,
            uploaded_by: user?.id,
            is_current: true,
            version: 1,
          });

        if (insertError) throw insertError;
      }

      toast.success('Documento enviado com sucesso!');
      loadDocuments(selectedClient);
      setContractData({
        contract_number: '',
        plan_name: '',
        monthly_value: '',
        start_date: '',
        renewal_date: '',
        services: [],
      });
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Erro ao enviar documento');
    } finally {
      setUploading(false);
    }
  };

  const filteredClients = clients.filter(c =>
    c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleService = (service: string) => {
    if (contractData.services.includes(service)) {
      setContractData({
        ...contractData,
        services: contractData.services.filter(s => s !== service),
      });
    } else {
      setContractData({
        ...contractData,
        services: [...contractData.services, service],
      });
    }
  };

  const availableServices = [
    'Gestão completa de Redes Sociais',
    'Criação de conteúdo ilimitado',
    'Tráfego pago (Google + Meta)',
    'Análise de dados e relatórios',
    'Suporte prioritário 24/7',
    'Consultoria estratégica mensal',
    'Desenvolvimento de site',
    'SEO e otimização',
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-valle-navy-900">Gerenciar Documentos</h1>
        <p className="text-valle-silver-600 mt-2">Upload e gerenciamento de contratos e regras dos clientes</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5 text-valle-blue-600" />
              Selecionar Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Buscar cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-4"
            />

            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filteredClients.map((client) => (
                <button
                  key={client.id}
                  onClick={() => setSelectedClient(client.id)}
                  className={`w-full p-3 rounded-lg text-left transition-all ${
                    selectedClient === client.id
                      ? 'bg-valle-blue-600 text-white'
                      : 'bg-valle-silver-100 hover:bg-valle-silver-200 text-valle-navy-800'
                  }`}
                >
                  <p className="font-medium">{client.full_name}</p>
                  <p className="text-sm opacity-80">{client.email}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-valle-blue-600" />
              Upload de Documento
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedClient ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-valle-silver-400 mx-auto mb-4" />
                <p className="text-valle-silver-600">Selecione um cliente para fazer upload de documentos</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex gap-4">
                  <button
                    onClick={() => setDocumentType('contract')}
                    className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                      documentType === 'contract'
                        ? 'border-valle-blue-600 bg-valle-blue-50'
                        : 'border-valle-silver-200 hover:border-valle-blue-300'
                    }`}
                  >
                    <FileText className={`w-8 h-8 mx-auto mb-2 ${documentType === 'contract' ? 'text-valle-blue-600' : 'text-valle-silver-500'}`} />
                    <p className="font-semibold text-center">Contrato</p>
                  </button>

                  <button
                    onClick={() => setDocumentType('rules')}
                    className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                      documentType === 'rules'
                        ? 'border-valle-blue-600 bg-valle-blue-50'
                        : 'border-valle-silver-200 hover:border-valle-blue-300'
                    }`}
                  >
                    <Shield className={`w-8 h-8 mx-auto mb-2 ${documentType === 'rules' ? 'text-valle-blue-600' : 'text-valle-silver-500'}`} />
                    <p className="font-semibold text-center">Regras</p>
                  </button>
                </div>

                {documentType === 'contract' && (
                  <div className="space-y-4 p-4 bg-valle-silver-50 rounded-lg">
                    <h4 className="font-semibold text-valle-navy-900">Informações do Contrato</h4>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-valle-navy-700 mb-2 block">Número do Contrato</label>
                        <Input
                          value={contractData.contract_number}
                          onChange={(e) => setContractData({ ...contractData, contract_number: e.target.value })}
                          placeholder="CONT-2025-001"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium text-valle-navy-700 mb-2 block">Nome do Plano</label>
                        <Input
                          value={contractData.plan_name}
                          onChange={(e) => setContractData({ ...contractData, plan_name: e.target.value })}
                          placeholder="Plano Enterprise"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium text-valle-navy-700 mb-2 block">Valor Mensal (R$)</label>
                        <Input
                          type="number"
                          value={contractData.monthly_value}
                          onChange={(e) => setContractData({ ...contractData, monthly_value: e.target.value })}
                          placeholder="5999.00"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium text-valle-navy-700 mb-2 block">Data de Início</label>
                        <Input
                          type="date"
                          value={contractData.start_date}
                          onChange={(e) => setContractData({ ...contractData, start_date: e.target.value })}
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium text-valle-navy-700 mb-2 block">Data de Renovação</label>
                        <Input
                          type="date"
                          value={contractData.renewal_date}
                          onChange={(e) => setContractData({ ...contractData, renewal_date: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-valle-navy-700 mb-2 block">Serviços Inclusos</label>
                      <div className="grid grid-cols-2 gap-2">
                        {availableServices.map((service) => (
                          <button
                            key={service}
                            onClick={() => toggleService(service)}
                            className={`p-2 rounded-lg border-2 text-sm text-left transition-all ${
                              contractData.services.includes(service)
                                ? 'border-green-600 bg-green-50'
                                : 'border-valle-silver-200 hover:border-valle-silver-300'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {contractData.services.includes(service) && <Check className="w-4 h-4 text-green-600" />}
                              <span>{service}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="border-2 border-dashed border-valle-silver-300 rounded-lg p-8 text-center">
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    id="file-upload"
                    className="hidden"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="w-16 h-16 text-valle-blue-600 mx-auto mb-4" />
                    <p className="text-lg font-semibold text-valle-navy-900 mb-2">
                      {uploading ? 'Enviando...' : 'Clique para fazer upload'}
                    </p>
                    <p className="text-sm text-valle-silver-600">
                      Apenas arquivos PDF (máximo 10MB)
                    </p>
                  </label>
                </div>

                {documents.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-valle-navy-900 mb-3">Documentos Enviados</h4>
                    <div className="space-y-2">
                      {documents
                        .filter(d => d.type === documentType)
                        .map((doc) => (
                          <div
                            key={doc.id}
                            className="flex items-center justify-between p-3 bg-valle-silver-100 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <FileText className="w-5 h-5 text-valle-blue-600" />
                              <div>
                                <p className="font-medium text-valle-navy-900">
                                  {doc.type === 'contract' ? 'Contrato' : 'Regras'} v{doc.version}
                                </p>
                                <p className="text-xs text-valle-silver-600">
                                  {new Date(doc.created_at).toLocaleString('pt-BR')}
                                </p>
                              </div>
                              {doc.is_current && (
                                <Badge className="bg-green-600 text-white">Atual</Badge>
                              )}
                            </div>
                            <Button variant="outline" size="sm" onClick={() => window.open(doc.file_url, '_blank')}>
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

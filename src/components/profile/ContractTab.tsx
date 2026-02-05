'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { FileText, Download, AlertCircle } from 'lucide-react';
import type { ClientContractDetailed } from '@/types';

interface ContractTabProps {
  userId: string;
}

export default function ContractTab({ userId }: ContractTabProps) {
  const [contract, setContract] = useState<ClientContractDetailed | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContract();
  }, [userId]);

  const loadContract = async () => {
    try {
      const { data, error } = await supabase
        .from('client_contracts')
        .select('*')
        .eq('client_id', userId)
        .eq('is_current', true)
        .maybeSingle();

      if (error) throw error;
      setContract(data);
    } catch (error) {
      console.error('Error loading contract:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (contract?.contract_file_url) {
      window.open(contract.contract_file_url, '_blank');
    }
  };

  if (loading) {
    return <div className="text-center py-12">Carregando contrato...</div>;
  }

  if (!contract) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <AlertCircle className="w-16 h-16 text-valle-silver-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-valle-navy-900 mb-2">Nenhum Contrato Disponível</h3>
          <p className="text-valle-silver-600">
            Seu contrato ainda não foi anexado. Entre em contato com a equipe Valle.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-valle-blue-600" />
            Contrato Atual
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-valle-blue-50 border-2 border-valle-blue-200 rounded-xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-2xl font-bold text-valle-navy-900">{contract.plan_name}</h3>
                <p className="text-valle-silver-600">Contrato #{contract.contract_number}</p>
              </div>
              <Badge className={contract.status === 'active' ? 'bg-green-600' : 'bg-yellow-600'}>
                {contract.status === 'active' ? 'Ativo' : contract.status}
              </Badge>
            </div>

            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm text-valle-silver-600 mb-1">Data de Início</p>
                <p className="text-lg font-semibold text-valle-navy-800">
                  {new Date(contract.start_date).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm text-valle-silver-600 mb-1">Renovação</p>
                <p className="text-lg font-semibold text-valle-navy-800">
                  {new Date(contract.renewal_date).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm text-valle-silver-600 mb-1">Valor Mensal</p>
                <p className="text-lg font-semibold text-valle-blue-600">
                  R$ {contract.monthly_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            {contract.services_included && contract.services_included.length > 0 && (
              <div>
                <h4 className="font-semibold text-valle-navy-800 mb-3">Serviços Inclusos:</h4>
                <ul className="space-y-2">
                  {contract.services_included.map((service, i) => (
                    <li key={i} className="flex items-center gap-2 text-valle-navy-700">
                      <div className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs">✓</span>
                      </div>
                      {service}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {contract.contract_file_url && (
            <div className="space-y-4">
              <div className="border-2 border-valle-silver-200 rounded-xl overflow-hidden">
                <div className="bg-valle-silver-50 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-6 h-6 text-valle-blue-600" />
                    <div>
                      <p className="font-semibold text-valle-navy-800">Documento do Contrato</p>
                      <p className="text-sm text-valle-silver-600">Versão {contract.version}</p>
                    </div>
                  </div>
                  <Button onClick={handleDownload} variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Baixar PDF
                  </Button>
                </div>
                <div className="bg-white p-6">
                  <iframe
                    src={contract.contract_file_url}
                    className="w-full h-[600px] border-0"
                    title="Contrato PDF"
                  />
                </div>
              </div>
            </div>
          )}

          <Button variant="outline" className="w-full">
            Solicitar Alteração de Contrato
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

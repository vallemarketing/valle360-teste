'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { Shield, Download, AlertCircle, Check } from 'lucide-react';
import type { ClientRulesDocument } from '@/types';

interface RulesTabProps {
  userId: string;
}

export default function RulesTab({ userId }: RulesTabProps) {
  const [rulesDoc, setRulesDoc] = useState<ClientRulesDocument | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRulesDocument();
  }, [userId]);

  const loadRulesDocument = async () => {
    try {
      const { data, error } = await supabase
        .from('client_rules_documents')
        .select('*')
        .eq('client_id', userId)
        .eq('is_current', true)
        .maybeSingle();

      if (error) throw error;
      setRulesDoc(data);
    } catch (error) {
      console.error('Error loading rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (rulesDoc?.rules_file_url) {
      window.open(rulesDoc.rules_file_url, '_blank');
    }
  };

  const handleAccept = async () => {
    if (!rulesDoc) return;

    try {
      const { error } = await supabase
        .from('client_rules_documents')
        .update({ accepted_at: new Date().toISOString() })
        .eq('id', rulesDoc.id);

      if (error) throw error;
      setRulesDoc({ ...rulesDoc, accepted_at: new Date().toISOString() });
      alert('Regras aceitas com sucesso!');
    } catch (error) {
      console.error('Error accepting rules:', error);
      alert('Erro ao aceitar regras');
    }
  };

  if (loading) {
    return <div className="text-center py-12">Carregando regras...</div>;
  }

  if (!rulesDoc) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <AlertCircle className="w-16 h-16 text-valle-silver-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-valle-navy-900 mb-2">Nenhum Documento Disponível</h3>
          <p className="text-valle-silver-600">
            As regras e políticas ainda não foram anexadas. Entre em contato com a equipe Valle.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-valle-blue-600" />
          Regras e Políticas do Cliente
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between p-4 bg-valle-blue-50 border-2 border-valle-blue-200 rounded-xl">
          <div>
            <p className="font-semibold text-valle-navy-800">Versão do Documento: {rulesDoc.version}</p>
            <p className="text-sm text-valle-silver-600">
              Última atualização: {new Date(rulesDoc.updated_at).toLocaleDateString('pt-BR')}
            </p>
          </div>
          {rulesDoc.accepted_at ? (
            <Badge className="bg-green-600">
              <Check className="w-3 h-3 mr-1" />
              Aceito em {new Date(rulesDoc.accepted_at).toLocaleDateString('pt-BR')}
            </Badge>
          ) : (
            <Badge className="bg-yellow-600">Aguardando Aceite</Badge>
          )}
        </div>

        <div className="border-2 border-valle-silver-200 rounded-xl overflow-hidden">
          <div className="bg-valle-silver-50 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-valle-blue-600" />
              <div>
                <p className="font-semibold text-valle-navy-800">Documento de Regras</p>
                <p className="text-sm text-valle-silver-600">PDF</p>
              </div>
            </div>
            <Button onClick={handleDownload} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Baixar PDF
            </Button>
          </div>
          <div className="bg-white p-6">
            <iframe
              src={rulesDoc.rules_file_url}
              className="w-full h-[600px] border-0"
              title="Regras PDF"
            />
          </div>
        </div>

        {!rulesDoc.accepted_at && (
          <Button onClick={handleAccept} className="w-full">
            <Check className="w-4 h-4 mr-2" />
            Marcar como Lido e Aceito
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

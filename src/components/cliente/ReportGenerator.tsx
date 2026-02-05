'use client';

import { useState } from 'react';
import { FileText, Download, Loader2, Calendar, Check, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface ReportGeneratorProps {
  onReportGenerated?: (report: any) => void;
}

const REPORT_SECTIONS = [
  { id: 'overview', label: 'Visão Geral', description: 'Resumo de aprovações e atividades' },
  { id: 'social', label: 'Redes Sociais', description: 'Métricas de contas conectadas' },
  { id: 'engagement', label: 'Engajamento', description: 'Curtidas, comentários e alcance' },
  { id: 'competitors', label: 'Concorrentes', description: 'Atividades dos concorrentes monitorados' },
  { id: 'recommendations', label: 'Recomendações IA', description: 'Sugestões personalizadas' },
];

export function ReportGenerator({ onReportGenerated }: ReportGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportType, setReportType] = useState('monthly');
  const [selectedSections, setSelectedSections] = useState<string[]>(
    REPORT_SECTIONS.map(s => s.id)
  );
  const [showOptions, setShowOptions] = useState(false);
  const [lastReport, setLastReport] = useState<any>(null);

  const toggleSection = (sectionId: string) => {
    setSelectedSections(prev => 
      prev.includes(sectionId)
        ? prev.filter(s => s !== sectionId)
        : [...prev, sectionId]
    );
  };

  const handleGenerate = async () => {
    if (selectedSections.length === 0) {
      toast.error('Selecione pelo menos uma seção para o relatório');
      return;
    }

    setIsGenerating(true);
    
    try {
      const response = await fetch('/api/client/report/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          report_type: reportType,
          include_sections: selectedSections
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setLastReport(result.report);
        toast.success('Relatório gerado com sucesso!');
        onReportGenerated?.(result.report);
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast.error('Erro ao gerar relatório: ' + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const formatPeriod = (type: string) => {
    switch (type) {
      case 'weekly': return 'Últimos 7 dias';
      case 'monthly': return 'Últimos 30 dias';
      case 'quarterly': return 'Últimos 3 meses';
      default: return type;
    }
  };

  return (
    <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-gray-900">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          Gerar Relatório
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Seletor de período */}
        <div className="space-y-2">
          <Label>Período do Relatório</Label>
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Semanal (7 dias)</SelectItem>
              <SelectItem value="monthly">Mensal (30 dias)</SelectItem>
              <SelectItem value="quarterly">Trimestral (3 meses)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Opções avançadas */}
        <div>
          <button
            onClick={() => setShowOptions(!showOptions)}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${showOptions ? 'rotate-180' : ''}`} />
            {showOptions ? 'Ocultar opções' : 'Personalizar seções'}
          </button>
          
          {showOptions && (
            <div className="mt-3 space-y-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              {REPORT_SECTIONS.map((section) => (
                <label
                  key={section.id}
                  className="flex items-start gap-3 cursor-pointer p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Checkbox
                    checked={selectedSections.includes(section.id)}
                    onCheckedChange={() => toggleSection(section.id)}
                    className="mt-0.5"
                  />
                  <div>
                    <p className="font-medium text-sm">{section.label}</p>
                    <p className="text-xs text-gray-500">{section.description}</p>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Botão de gerar */}
        <Button 
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full bg-primary hover:bg-[#1260b5]"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Gerando Relatório...
            </>
          ) : (
            <>
              <FileText className="w-4 h-4 mr-2" />
              Gerar Relatório {formatPeriod(reportType)}
            </>
          )}
        </Button>

        {/* Último relatório gerado */}
        {lastReport && (
          <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 mb-2">
              <Check className="w-4 h-4 text-green-600" />
              <span className="font-medium text-green-800 dark:text-green-200">
                Relatório gerado!
              </span>
            </div>
            <p className="text-xs text-green-700 dark:text-green-300 mb-2">
              {new Date(lastReport.generated_at).toLocaleString('pt-BR')}
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="flex-1">
                <Download className="w-3 h-3 mr-1" />
                Baixar PDF
              </Button>
              <Button size="sm" variant="outline" className="flex-1">
                Visualizar
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  Copy,
  Eye,
  X,
  Save,
  Loader2,
  CheckCircle,
  Code,
  FileCode,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ContractTemplate {
  id: string;
  name: string;
  type: 'standard' | 'premium' | 'enterprise' | 'custom';
  description?: string;
  content: string;
  variables: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const DEFAULT_VARIABLES = [
  '{{CLIENTE_NOME}}',
  '{{CLIENTE_EMPRESA}}',
  '{{CLIENTE_CNPJ}}',
  '{{CLIENTE_ENDERECO}}',
  '{{VALOR_MENSAL}}',
  '{{VALOR_EXTENSO}}',
  '{{DURACAO_MESES}}',
  '{{DATA_INICIO}}',
  '{{DATA_FIM}}',
  '{{DIA_VENCIMENTO}}',
  '{{SERVICOS}}',
  '{{MULTA_RESCISAO}}',
  '{{DIAS_NOTIFICACAO}}',
];

export default function ContractTemplatesPage() {
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ContractTemplate | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/contract-templates');
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
      // Use mock data for demo
      setTemplates([
        {
          id: '1',
          name: 'Contrato Padrão',
          type: 'standard',
          description: 'Template padrão para prestação de serviços de marketing digital',
          content: generateDefaultContent(),
          variables: DEFAULT_VARIABLES,
          is_active: true,
          created_at: '2024-01-01',
          updated_at: '2024-12-01',
        },
        {
          id: '2',
          name: 'Contrato Premium',
          type: 'premium',
          description: 'Template com cláusulas adicionais para clientes premium',
          content: generateDefaultContent(),
          variables: DEFAULT_VARIABLES,
          is_active: true,
          created_at: '2024-02-01',
          updated_at: '2024-11-15',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editingTemplate) return;
    
    setSaving(true);
    try {
      const res = await fetch('/api/admin/contract-templates', {
        method: editingTemplate.id.startsWith('new') ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingTemplate),
      });

      if (res.ok) {
        toast.success('Template salvo com sucesso!');
        setShowEditor(false);
        setEditingTemplate(null);
        fetchTemplates();
      } else {
        toast.error('Falha ao salvar template');
      }
    } catch (error) {
      toast.error('Erro ao salvar template');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este template?')) return;
    
    try {
      await fetch(`/api/admin/contract-templates/${id}`, { method: 'DELETE' });
      setTemplates(templates.filter(t => t.id !== id));
      toast.success('Template excluído');
    } catch (error) {
      toast.error('Falha ao excluir template');
    }
  };

  const handleDuplicate = (template: ContractTemplate) => {
    setEditingTemplate({
      ...template,
      id: `new-${Date.now()}`,
      name: `${template.name} (Cópia)`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    setShowEditor(true);
  };

  const createNewTemplate = () => {
    setEditingTemplate({
      id: `new-${Date.now()}`,
      name: 'Novo Template',
      type: 'custom',
      description: '',
      content: generateDefaultContent(),
      variables: DEFAULT_VARIABLES,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    setShowEditor(true);
  };

  const getTypeBadge = (type: string) => {
    const styles: Record<string, string> = {
      standard: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
      premium: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
      enterprise: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
      custom: 'bg-gray-500/10 text-gray-600 border-gray-500/30',
    };
    return <Badge variant="outline" className={styles[type]}>{type}</Badge>;
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#1672d6]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0f1a] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-[#001533] dark:text-white mb-2">
              Templates de Contrato
            </h1>
            <p className="text-[#001533]/60 dark:text-white/60">
              Gerencie os modelos de contrato com placeholders dinâmicos
            </p>
          </div>
          <Button onClick={createNewTemplate} className="bg-[#1672d6] hover:bg-[#1260b5]">
            <Plus className="w-4 h-4 mr-2" />
            Novo Template
          </Button>
        </motion.div>

        {/* Variables Reference */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800"
        >
          <div className="flex items-center gap-2 mb-3">
            <Code className="w-4 h-4 text-purple-600" />
            <span className="font-medium text-purple-700 dark:text-purple-300">
              Variáveis Disponíveis
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {DEFAULT_VARIABLES.map((v) => (
              <code
                key={v}
                className="px-2 py-1 text-xs rounded bg-purple-100 dark:bg-purple-800 text-purple-600 dark:text-purple-200 cursor-pointer hover:bg-purple-200"
                onClick={() => {
                  navigator.clipboard.writeText(v);
                  toast.success('Copiado!');
                }}
              >
                {v}
              </code>
            ))}
          </div>
        </motion.div>

        {/* Templates Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template, idx) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + idx * 0.1 }}
            >
              <Card className="border-[#001533]/10 dark:border-white/10 hover:border-[#1672d6]/30 transition-all">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="w-5 h-5 text-[#1672d6]" />
                        {template.name}
                      </CardTitle>
                      <p className="text-sm text-[#001533]/60 dark:text-white/60 mt-1">
                        {template.description || 'Sem descrição'}
                      </p>
                    </div>
                    {getTypeBadge(template.type)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-[#001533]/50 dark:text-white/50 mb-4">
                    <span>{template.variables.length} variáveis</span>
                    <span>Atualizado: {new Date(template.updated_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setEditingTemplate(template);
                        setShowEditor(true);
                      }}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDuplicate(template)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-600/30 hover:bg-red-50"
                      onClick={() => handleDelete(template.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {templates.length === 0 && (
          <div className="text-center py-12">
            <FileCode className="w-12 h-12 mx-auto text-[#001533]/20 mb-4" />
            <p className="text-[#001533]/60 dark:text-white/60">Nenhum template encontrado</p>
            <Button onClick={createNewTemplate} className="mt-4">
              Criar primeiro template
            </Button>
          </div>
        )}
      </div>

      {/* Template Editor Modal */}
      <AnimatePresence>
        {showEditor && editingTemplate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => setShowEditor(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-[#0a0f1a] rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl"
            >
              {/* Header */}
              <div className="p-6 border-b border-[#001533]/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-6 h-6 text-[#1672d6]" />
                  <div>
                    <input
                      type="text"
                      value={editingTemplate.name}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                      className="text-xl font-bold bg-transparent border-none outline-none"
                      placeholder="Nome do template"
                    />
                    <input
                      type="text"
                      value={editingTemplate.description || ''}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, description: e.target.value })}
                      className="text-sm text-[#001533]/60 bg-transparent border-none outline-none w-full"
                      placeholder="Descrição"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={editingTemplate.type}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, type: e.target.value as any })}
                    className="px-3 py-1 rounded-lg border border-[#001533]/20 text-sm"
                  >
                    <option value="standard">Padrão</option>
                    <option value="premium">Premium</option>
                    <option value="enterprise">Enterprise</option>
                    <option value="custom">Custom</option>
                  </select>
                  <button onClick={() => setShowEditor(false)} className="p-2 hover:bg-[#001533]/5 rounded-lg">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content Editor */}
              <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 180px)' }}>
                <div className="mb-4 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  <span className="text-sm text-[#001533]/60">
                    Use as variáveis acima para criar campos dinâmicos. Elas serão substituídas pelos dados do cliente.
                  </span>
                </div>
                <textarea
                  value={editingTemplate.content}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, content: e.target.value })}
                  className="w-full h-[500px] p-4 font-mono text-sm border border-[#001533]/20 rounded-xl focus:ring-2 focus:ring-[#1672d6] focus:border-transparent"
                  placeholder="Conteúdo do contrato em HTML..."
                />
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-[#001533]/10 flex justify-between">
                <Button variant="outline" onClick={() => setShowEditor(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-[#1672d6] hover:bg-[#1260b5]"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Salvar Template
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function generateDefaultContent(): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Contrato de Prestação de Serviços</title>
</head>
<body>
  <h1>CONTRATO DE PRESTAÇÃO DE SERVIÇOS</h1>
  
  <h2>PARTES</h2>
  <p><strong>CONTRATANTE:</strong> {{CLIENTE_EMPRESA}}, inscrita no CNPJ {{CLIENTE_CNPJ}}, com sede em {{CLIENTE_ENDERECO}}, representada por {{CLIENTE_NOME}}.</p>
  <p><strong>CONTRATADA:</strong> Valle Group Marketing Digital LTDA...</p>
  
  <h2>CLÁUSULA 1ª - DO OBJETO</h2>
  <p>O presente contrato tem por objeto a prestação dos seguintes serviços:</p>
  <p>{{SERVICOS}}</p>
  
  <h2>CLÁUSULA 2ª - DO VALOR</h2>
  <p>O valor mensal é de R$ {{VALOR_MENSAL}} ({{VALOR_EXTENSO}}), com vencimento todo dia {{DIA_VENCIMENTO}}.</p>
  
  <h2>CLÁUSULA 3ª - DO PRAZO</h2>
  <p>Vigência de {{DURACAO_MESES}} meses, de {{DATA_INICIO}} a {{DATA_FIM}}.</p>
  
  <h2>CLÁUSULA 4ª - DA RESCISÃO</h2>
  <p>Multa de {{MULTA_RESCISAO}}% mediante aviso prévio de {{DIAS_NOTIFICACAO}} dias.</p>
  
  <div class="signatures">
    <div>___________________<br>CONTRATANTE</div>
    <div>___________________<br>CONTRATADA</div>
  </div>
</body>
</html>`;
}

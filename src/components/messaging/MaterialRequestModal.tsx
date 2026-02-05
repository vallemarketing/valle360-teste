'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  X,
  FileText,
  CheckCircle,
  Monitor,
  Presentation,
  Smartphone,
  Video,
  AlertCircle,
} from 'lucide-react';

interface MaterialType {
  id: string;
  label: string;
  icon: any;
  color: string;
}

interface MaterialRequestModalProps {
  onClose: () => void;
}

export function MaterialRequestModal({ onClose }: MaterialRequestModalProps) {
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const materialTypes: MaterialType[] = [
    {
      id: 'arte_web',
      label: 'Arte Web',
      icon: Monitor,
      color: 'from-blue-500 to-blue-700',
    },
    {
      id: 'presentation',
      label: 'Presentation',
      icon: Presentation,
      color: 'from-green-500 to-green-700',
    },
    {
      id: 'arte_stories',
      label: 'Arte para Stories',
      icon: Smartphone,
      color: 'from-pink-500 to-purple-600',
    },
    {
      id: 'gravacao_video',
      label: 'Gravação de Vídeo',
      icon: Video,
      color: 'from-red-500 to-red-700',
    },
  ];

  const toggleType = (typeId: string) => {
    setSelectedTypes((prev) =>
      prev.includes(typeId)
        ? prev.filter((id) => id !== typeId)
        : [...prev, typeId]
    );
  };

  const handleSubmit = () => {
    if (selectedTypes.length === 0 || description.length < 20) {
      return;
    }

    // TODO: Salvar no Supabase
    console.log({
      types: selectedTypes,
      description,
    });
    setSubmitted(true);
  };

  const isValid = selectedTypes.length > 0 && description.length >= 20;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="border-b border-valle-silver-200">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl text-valle-navy-900 flex items-center gap-2">
              <FileText className="w-6 h-6 text-valle-blue-600" />
              Solicitar Material
            </CardTitle>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-valle-silver-100 transition-colors"
            >
              <X className="w-5 h-5 text-valle-silver-600" />
            </button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {!submitted ? (
            <div className="space-y-6">
              {/* Material Types Selection */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-valle-navy-900 mb-2">
                    Tipo de Material
                  </h3>
                  <p className="text-sm text-valle-silver-600 mb-4">
                    Selecione um ou mais tipos de material que você precisa
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {materialTypes.map((type) => {
                    const Icon = type.icon;
                    const isSelected = selectedTypes.includes(type.id);

                    return (
                      <button
                        key={type.id}
                        onClick={() => toggleType(type.id)}
                        className={`p-6 rounded-xl border-2 transition-all hover:shadow-lg ${
                          isSelected
                            ? 'border-valle-blue-600 bg-valle-blue-50'
                            : 'border-valle-silver-200 hover:border-valle-blue-400'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-16 h-16 rounded-xl bg-gradient-to-br ${type.color} flex items-center justify-center flex-shrink-0 shadow-lg`}
                          >
                            <Icon className="w-8 h-8 text-white" />
                          </div>
                          <div className="flex-1 text-left">
                            <p className="font-semibold text-valle-navy-900 mb-1">
                              {type.label}
                            </p>
                            {isSelected && (
                              <div className="flex items-center gap-1 text-xs text-green-600">
                                <CheckCircle className="w-3 h-3" />
                                Selecionado
                              </div>
                            )}
                          </div>
                          <div
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                              isSelected
                                ? 'bg-valle-blue-600 border-valle-blue-600'
                                : 'border-valle-silver-300'
                            }`}
                          >
                            {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected Types Preview */}
              {selectedTypes.length > 0 && (
                <Card className="border-2 border-valle-blue-200 bg-gradient-to-r from-valle-blue-50 to-white">
                  <CardContent className="p-4">
                    <p className="text-sm font-medium text-valle-navy-700 mb-2">
                      Materiais Selecionados:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedTypes.map((typeId) => {
                        const type = materialTypes.find((t) => t.id === typeId);
                        return (
                          <Badge key={typeId} className="bg-valle-blue-600 text-white">
                            {type?.label}
                          </Badge>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Description */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-lg font-semibold text-valle-navy-900">
                    Descrição da Solicitação
                  </label>
                  <span
                    className={`text-sm ${
                      description.length >= 20 ? 'text-green-600' : 'text-valle-silver-500'
                    }`}
                  >
                    {description.length}/20 caracteres mínimos
                  </span>
                </div>
                <p className="text-sm text-valle-silver-600 mb-3">
                  Descreva detalhadamente o que você precisa
                </p>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Exemplo: Preciso de artes para stories promovendo nosso novo produto. As imagens devem seguir nossa identidade visual e incluir o logo atualizado. Gostaria de receber 3 opções diferentes..."
                  className={`w-full h-40 p-4 rounded-lg border-2 focus:ring-2 focus:ring-valle-blue-200 resize-none ${
                    description.length >= 20
                      ? 'border-green-500 focus:border-green-500'
                      : 'border-valle-silver-300 focus:border-valle-blue-500'
                  }`}
                />
              </div>

              {/* Validation Alerts */}
              {(selectedTypes.length === 0 || description.length < 20) && (
                <Card className="border-2 border-amber-200 bg-amber-50">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-amber-800">
                          Complete os campos obrigatórios:
                        </p>
                        <ul className="text-sm text-amber-700 list-disc list-inside space-y-1">
                          {selectedTypes.length === 0 && (
                            <li>Selecione pelo menos um tipo de material</li>
                          )}
                          {description.length < 20 && (
                            <li>
                              A descrição deve ter no mínimo 20 caracteres (faltam{' '}
                              {20 - description.length})
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={onClose} className="flex-1">
                  Cancelar
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!isValid}
                  className="flex-1 bg-valle-blue-600 hover:bg-valle-blue-700 disabled:bg-valle-silver-300"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Enviar Solicitação
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>

              <h3 className="text-2xl font-bold text-valle-navy-900 mb-2">
                Solicitação Enviada!
              </h3>
              <p className="text-valle-silver-600 mb-6">
                Sua solicitação foi recebida e será processada em breve
              </p>

              <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-white max-w-md mx-auto mb-6">
                <CardContent className="p-6 space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-valle-navy-700 mb-2">
                      Materiais Solicitados:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedTypes.map((typeId) => {
                        const type = materialTypes.find((t) => t.id === typeId);
                        return (
                          <Badge key={typeId} className="bg-green-600 text-white">
                            {type?.label}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>

                  <div className="text-left">
                    <p className="text-sm font-semibold text-valle-navy-700 mb-1">
                      Descrição:
                    </p>
                    <p className="text-sm text-valle-silver-700 bg-white p-3 rounded-lg border border-valle-silver-200">
                      {description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-valle-silver-200">
                    <p className="text-sm text-valle-silver-600">
                      <strong>Prazo estimado:</strong> 3-5 dias úteis
                    </p>
                    <p className="text-sm text-valle-silver-600 mt-1">
                      <strong>Número do protocolo:</strong> #{Math.random().toString(36).substr(2, 9).toUpperCase()}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <p className="text-sm text-valle-silver-600 mb-6">
                Você receberá uma notificação quando o material estiver pronto
              </p>

              <Button
                onClick={onClose}
                className="bg-valle-blue-600 hover:bg-valle-blue-700"
              >
                Fechar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

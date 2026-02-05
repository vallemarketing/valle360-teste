'use client';

import { useState } from 'react';
import { Building2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface StepSegmentProps {
  data: {
    segment: string;
    industry: string;
  };
  onChange: (data: any) => void;
}

const SEGMENTS = [
  { id: 'ecommerce', label: 'E-commerce', icon: '🛒' },
  { id: 'services', label: 'Serviços', icon: '💼' },
  { id: 'food', label: 'Alimentação', icon: '🍕' },
  { id: 'beauty', label: 'Beleza & Estética', icon: '💅' },
  { id: 'health', label: 'Saúde & Bem-estar', icon: '💪' },
  { id: 'education', label: 'Educação', icon: '📚' },
  { id: 'tech', label: 'Tecnologia', icon: '💻' },
  { id: 'fashion', label: 'Moda', icon: '👗' },
  { id: 'real-estate', label: 'Imobiliário', icon: '🏠' },
  { id: 'automotive', label: 'Automotivo', icon: '🚗' },
  { id: 'entertainment', label: 'Entretenimento', icon: '🎬' },
  { id: 'other', label: 'Outro', icon: '📦' },
];

export function StepSegment({ data, onChange }: StepSegmentProps) {
  const [segment, setSegment] = useState(data.segment || '');
  const [industry, setIndustry] = useState(data.industry || '');
  const [searchTerm, setSearchTerm] = useState('');

  const handleSegmentSelect = (segmentId: string) => {
    setSegment(segmentId);
    onChange({ segment: segmentId, industry });
  };

  const handleIndustryChange = (value: string) => {
    setIndustry(value);
    onChange({ segment, industry: value });
  };

  const filteredSegments = SEGMENTS.filter(s => 
    s.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-[#1672d6] to-[#001533] rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Building2 className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Conte sobre seu negócio
        </h2>
        <p className="text-gray-600">
          Isso nos ajuda a buscar referências e concorrentes relevantes
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Buscar segmento..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Segments Grid */}
      <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
        {filteredSegments.map((seg) => (
          <button
            key={seg.id}
            onClick={() => handleSegmentSelect(seg.id)}
            className={`p-3 rounded-lg border-2 transition-all text-center ${
              segment === seg.id
                ? 'border-[#1672d6] bg-blue-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <span className="text-2xl block mb-1">{seg.icon}</span>
            <span className="text-xs font-medium text-gray-700">{seg.label}</span>
          </button>
        ))}
      </div>

      {/* Industry Input */}
      <div className="space-y-2">
        <Label htmlFor="industry">Descreva seu nicho específico (opcional)</Label>
        <Input
          id="industry"
          placeholder="Ex: Loja de roupas femininas plus size"
          value={industry}
          onChange={(e) => handleIndustryChange(e.target.value)}
        />
        <p className="text-xs text-gray-500">
          Quanto mais específico, melhores serão as sugestões da nossa IA
        </p>
      </div>
    </div>
  );
}

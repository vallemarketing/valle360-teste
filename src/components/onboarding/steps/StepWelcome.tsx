'use client';

import { useState } from 'react';
import { Sparkles, TrendingUp, Users, DollarSign, Eye, Heart, Check } from 'lucide-react';

interface StepWelcomeProps {
  data: {
    objectives: string[];
  };
  onChange: (data: any) => void;
}

const OBJECTIVES = [
  { id: 'growth', label: 'Crescer seguidores', icon: TrendingUp, color: 'text-green-600 bg-green-100' },
  { id: 'engagement', label: 'Aumentar engajamento', icon: Heart, color: 'text-pink-600 bg-pink-100' },
  { id: 'sales', label: 'Gerar mais vendas', icon: DollarSign, color: 'text-emerald-600 bg-emerald-100' },
  { id: 'leads', label: 'Captar leads', icon: Users, color: 'text-blue-600 bg-blue-100' },
  { id: 'branding', label: 'Fortalecer marca', icon: Sparkles, color: 'text-purple-600 bg-purple-100' },
  { id: 'visibility', label: 'Aumentar visibilidade', icon: Eye, color: 'text-amber-600 bg-amber-100' },
];

export function StepWelcome({ data, onChange }: StepWelcomeProps) {
  const [selectedObjectives, setSelectedObjectives] = useState<string[]>(data.objectives || []);

  const toggleObjective = (id: string) => {
    const updated = selectedObjectives.includes(id)
      ? selectedObjectives.filter(o => o !== id)
      : [...selectedObjectives, id];
    
    setSelectedObjectives(updated);
    onChange({ objectives: updated });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-[#1672d6] to-[#001533] rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Bem-vindo ao Valle 360! 🎉
        </h2>
        <p className="text-gray-600">
          Vamos personalizar sua experiência. Primeiro, quais são seus principais objetivos?
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {OBJECTIVES.map((objective) => {
          const isSelected = selectedObjectives.includes(objective.id);
          const Icon = objective.icon;
          
          return (
            <button
              key={objective.id}
              onClick={() => toggleObjective(objective.id)}
              className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                isSelected
                  ? 'border-[#1672d6] bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <div className="w-5 h-5 bg-[#1672d6] rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                </div>
              )}
              <div className={`w-10 h-10 rounded-lg ${objective.color} flex items-center justify-center mb-2`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="font-medium text-gray-900">{objective.label}</span>
            </button>
          );
        })}
      </div>

      <p className="text-sm text-gray-500 text-center mt-4">
        Selecione quantos quiser. Você pode alterar depois.
      </p>
    </div>
  );
}

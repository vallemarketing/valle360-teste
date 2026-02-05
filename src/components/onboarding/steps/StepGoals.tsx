'use client';

import { useState } from 'react';
import { TrendingUp, Target, Plus, X, Calendar, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface StepGoalsProps {
  data: {
    objectives: string[];
    goals: any[];
  };
  onChange: (data: any) => void;
}

const GOAL_TYPES = [
  { id: 'followers', label: 'Seguidores', icon: '👥', unit: 'number' },
  { id: 'engagement', label: 'Taxa de Engajamento', icon: '❤️', unit: 'percentage' },
  { id: 'reach', label: 'Alcance Mensal', icon: '📊', unit: 'number' },
  { id: 'sales', label: 'Vendas via Instagram', icon: '💰', unit: 'currency' },
  { id: 'leads', label: 'Leads Gerados', icon: '📧', unit: 'number' },
  { id: 'posts', label: 'Posts por Semana', icon: '📝', unit: 'number' },
];

const SUGGESTED_GOALS = [
  { type: 'followers', title: 'Crescer 30% em seguidores', target_value: 30, unit: 'percentage', deadline: '3 meses' },
  { type: 'engagement', title: 'Alcançar 5% de engajamento', target_value: 5, unit: 'percentage', deadline: '2 meses' },
  { type: 'reach', title: 'Dobrar alcance mensal', target_value: 100, unit: 'percentage', deadline: '6 meses' },
];

export function StepGoals({ data, onChange }: StepGoalsProps) {
  const [goals, setGoals] = useState<any[]>(data.goals || []);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newGoal, setNewGoal] = useState({
    type: '',
    title: '',
    target_value: '',
    current_value: '',
    deadline: ''
  });

  const addSuggestedGoal = (suggested: any) => {
    const goal = {
      id: Date.now().toString(),
      type: suggested.type,
      title: suggested.title,
      target_value: suggested.target_value,
      current_value: 0,
      unit: suggested.unit,
      deadline: getDeadlineDate(suggested.deadline)
    };
    
    const updated = [...goals, goal];
    setGoals(updated);
    onChange({ goals: updated });
  };

  const getDeadlineDate = (period: string) => {
    const date = new Date();
    if (period.includes('mês') || period.includes('meses')) {
      const months = parseInt(period);
      date.setMonth(date.getMonth() + months);
    }
    return date.toISOString().split('T')[0];
  };

  const addCustomGoal = () => {
    if (!newGoal.type || !newGoal.title || !newGoal.target_value) return;
    
    const goalType = GOAL_TYPES.find(t => t.id === newGoal.type);
    const goal = {
      id: Date.now().toString(),
      type: newGoal.type,
      title: newGoal.title,
      target_value: parseFloat(newGoal.target_value),
      current_value: parseFloat(newGoal.current_value) || 0,
      unit: goalType?.unit || 'number',
      deadline: newGoal.deadline
    };
    
    const updated = [...goals, goal];
    setGoals(updated);
    onChange({ goals: updated });
    setNewGoal({ type: '', title: '', target_value: '', current_value: '', deadline: '' });
    setShowAddGoal(false);
  };

  const removeGoal = (id: string) => {
    const updated = goals.filter(g => g.id !== id);
    setGoals(updated);
    onChange({ goals: updated });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-[#1672d6] to-[#001533] rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Target className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Defina suas metas
        </h2>
        <p className="text-gray-600">
          Metas claras nos ajudam a medir seu sucesso e gerar relatórios melhores
        </p>
      </div>

      {/* Suggested Goals */}
      {goals.length === 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Sugestões baseadas nos seus objetivos:</p>
          {SUGGESTED_GOALS.map((suggested, index) => (
            <button
              key={index}
              onClick={() => addSuggestedGoal(suggested)}
              className="w-full flex items-center justify-between p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                  <TrendingUp className="w-5 h-5 text-[#1672d6]" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{suggested.title}</p>
                  <p className="text-xs text-gray-500">Prazo: {suggested.deadline}</p>
                </div>
              </div>
              <Plus className="w-5 h-5 text-[#1672d6]" />
            </button>
          ))}
        </div>
      )}

      {/* Current Goals */}
      {goals.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Suas metas:</p>
          {goals.map((goal) => (
            <div 
              key={goal.id}
              className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{goal.title}</p>
                  <p className="text-xs text-gray-500">
                    Meta: {goal.target_value}{goal.unit === 'percentage' ? '%' : ''}
                    {goal.deadline && ` • Até ${new Date(goal.deadline).toLocaleDateString('pt-BR')}`}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => removeGoal(goal.id)}
                className="text-gray-400 hover:text-red-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Custom Goal Form */}
      {showAddGoal ? (
        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-medium text-gray-900">Nova meta personalizada</p>
            <button onClick={() => setShowAddGoal(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tipo</Label>
              <Select value={newGoal.type} onValueChange={(v) => setNewGoal({ ...newGoal, type: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {GOAL_TYPES.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.icon} {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Valor Alvo</Label>
              <Input
                type="number"
                placeholder="Ex: 10000"
                value={newGoal.target_value}
                onChange={(e) => setNewGoal({ ...newGoal, target_value: e.target.value })}
              />
            </div>
          </div>
          
          <div>
            <Label>Título da Meta</Label>
            <Input
              placeholder="Ex: Alcançar 10K seguidores"
              value={newGoal.title}
              onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Valor Atual (opcional)</Label>
              <Input
                type="number"
                placeholder="Ex: 5000"
                value={newGoal.current_value}
                onChange={(e) => setNewGoal({ ...newGoal, current_value: e.target.value })}
              />
            </div>
            <div>
              <Label>Prazo</Label>
              <Input
                type="date"
                value={newGoal.deadline}
                onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
              />
            </div>
          </div>
          
          <Button onClick={addCustomGoal} className="w-full bg-[#1672d6]">
            Adicionar Meta
          </Button>
        </div>
      ) : (
        <Button 
          variant="outline" 
          onClick={() => setShowAddGoal(true)}
          className="w-full border-dashed"
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar meta personalizada
        </Button>
      )}

      <p className="text-xs text-gray-500 text-center">
        {goals.length === 0 
          ? 'Você pode pular e definir metas depois' 
          : 'Você pode editar suas metas a qualquer momento em Configurações'}
      </p>
    </div>
  );
}

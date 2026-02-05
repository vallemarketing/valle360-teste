'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Filter, User, Tag, AlertCircle, Calendar } from 'lucide-react';

interface UserProfile {
  id: string;
  full_name: string;
}

export interface KanbanFiltersState {
  assignees: string[];
  tags: string[];
  priorities: string[];
  dueDateFilter: 'all' | 'overdue' | 'today' | 'this_week' | 'this_month' | 'no_date';
}

interface KanbanFiltersProps {
  onFiltersChange: (filters: KanbanFiltersState) => void;
  availableTags: string[];
}

export function KanbanFilters({ onFiltersChange, availableTags }: KanbanFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filters, setFilters] = useState<KanbanFiltersState>({
    assignees: [],
    tags: [],
    priorities: [],
    dueDateFilter: 'all',
  });

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    onFiltersChange(filters);
  }, [filters]);

  const loadUsers = async () => {
    try {
      // Alguns ambientes usam `user_profiles.id = auth.uid()`, outros guardam em `user_id`.
      // Para manter os filtros compatíveis com `kanban_tasks.assigned_to` (auth id), normalizamos para `authId`.
      let rows: any[] = [];
      const attemptWithUserId = await supabase
        .from('user_profiles')
        .select('id, user_id, full_name')
        .eq('is_active', true)
        .order('full_name');

      if (!attemptWithUserId.error) {
        rows = attemptWithUserId.data || [];
      } else {
        const attemptWithId = await supabase
          .from('user_profiles')
          .select('id, full_name')
          .eq('is_active', true)
          .order('full_name');
        if (attemptWithId.error) throw attemptWithId.error;
        rows = attemptWithId.data || [];
      }

      const normalized: UserProfile[] = (rows || [])
        .map((u: any) => {
          const authId = u?.user_id ? String(u.user_id) : u?.id ? String(u.id) : null;
          if (!authId) return null;
          return { id: authId, full_name: String(u?.full_name || 'Usuário') };
        })
        .filter(Boolean) as UserProfile[];

      setUsers(normalized);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    }
  };

  const toggleAssignee = (userId: string) => {
    setFilters((prev) => ({
      ...prev,
      assignees: prev.assignees.includes(userId)
        ? prev.assignees.filter((id) => id !== userId)
        : [...prev.assignees, userId],
    }));
  };

  const toggleTag = (tag: string) => {
    setFilters((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  const togglePriority = (priority: string) => {
    setFilters((prev) => ({
      ...prev,
      priorities: prev.priorities.includes(priority)
        ? prev.priorities.filter((p) => p !== priority)
        : [...prev.priorities, priority],
    }));
  };

  const setDueDateFilter = (filter: KanbanFiltersState['dueDateFilter']) => {
    setFilters((prev) => ({ ...prev, dueDateFilter: filter }));
  };

  const clearAllFilters = () => {
    setFilters({
      assignees: [],
      tags: [],
      priorities: [],
      dueDateFilter: 'all',
    });
  };

  const hasActiveFilters = () => {
    return (
      filters.assignees.length > 0 ||
      filters.tags.length > 0 ||
      filters.priorities.length > 0 ||
      filters.dueDateFilter !== 'all'
    );
  };

  const getActiveFiltersCount = () => {
    return (
      filters.assignees.length +
      filters.tags.length +
      filters.priorities.length +
      (filters.dueDateFilter !== 'all' ? 1 : 0)
    );
  };

  const priorities = [
    { value: 'urgent', label: 'Urgente', color: 'bg-red-600' },
    { value: 'high', label: 'Alta', color: 'bg-red-100 text-red-700' },
    { value: 'medium', label: 'Média', color: 'bg-yellow-100 text-yellow-700' },
    { value: 'low', label: 'Baixa', color: 'bg-gray-100 text-gray-700' },
  ];

  const dueDateOptions = [
    { value: 'all', label: 'Todas' },
    { value: 'overdue', label: 'Vencidas' },
    { value: 'today', label: 'Hoje' },
    { value: 'this_week', label: 'Esta semana' },
    { value: 'this_month', label: 'Este mês' },
    { value: 'no_date', label: 'Sem data' },
  ];

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          onClick={() => setIsOpen(!isOpen)}
          className={`${hasActiveFilters() ? 'border-primary text-primary' : ''}`}
        >
          <Filter className="w-4 h-4 mr-2" />
          Filtros
          {hasActiveFilters() && (
            <Badge className="ml-2 bg-primary text-white">{getActiveFiltersCount()}</Badge>
          )}
        </Button>

        {hasActiveFilters() && (
          <Button variant="ghost" size="sm" onClick={clearAllFilters}>
            <X className="w-4 h-4 mr-1" />
            Limpar filtros
          </Button>
        )}
      </div>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full mt-2 left-0 z-50 w-96 bg-white dark:bg-gray-800 border rounded-lg shadow-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white">Filtros</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <User className="w-4 h-4" />
                  Responsáveis
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {users.map((user) => (
                    <label
                      key={user.id}
                      className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={filters.assignees.includes(user.id)}
                        onChange={() => toggleAssignee(user.id)}
                        className="rounded text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-gray-900 dark:text-white">{user.full_name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Tag className="w-4 h-4" />
                  Tags
                </label>
                {availableTags.length === 0 ? (
                  <p className="text-sm text-gray-500">Nenhuma tag disponível</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {availableTags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1 rounded-full text-sm transition-colors ${
                          filters.tags.includes(tag)
                            ? 'bg-primary text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <AlertCircle className="w-4 h-4" />
                  Prioridade
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {priorities.map((priority) => (
                    <button
                      key={priority.value}
                      onClick={() => togglePriority(priority.value)}
                      className={`p-2 rounded-lg border text-sm font-medium transition-colors ${
                        filters.priorities.includes(priority.value)
                          ? 'border-primary bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <Badge className={priority.color}>{priority.label}</Badge>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Calendar className="w-4 h-4" />
                  Data de Vencimento
                </label>
                <div className="space-y-1">
                  {dueDateOptions.map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="dueDate"
                        checked={filters.dueDateFilter === option.value}
                        onChange={() => setDueDateFilter(option.value as KanbanFiltersState['dueDateFilter'])}
                        className="text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-gray-900 dark:text-white">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t flex gap-2">
              <Button
                variant="outline"
                onClick={clearAllFilters}
                className="flex-1"
              >
                Limpar
              </Button>
              <Button
                onClick={() => setIsOpen(false)}
                className="flex-1 bg-primary hover:bg-[#1260b5]"
              >
                Aplicar
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

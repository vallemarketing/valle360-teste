'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { User, X, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface EmployeeUser {
  user_id: string;
  full_name: string;
  email: string;
  department?: string | null;
  area_of_expertise?: string | null;
  areas?: string[] | null;
  is_active?: boolean | null;
}

interface UserSelectorProps {
  selectedUserId?: string;
  onSelect: (userId: string | undefined) => void;
  label?: string;
  placeholder?: string;
}

export function UserSelector({ selectedUserId, onSelect, label = 'Responsável', placeholder = 'Selecione um responsável' }: UserSelectorProps) {
  const [users, setUsers] = useState<EmployeeUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<EmployeeUser[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<EmployeeUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (selectedUserId && users.length > 0) {
      const user = users.find(u => u.user_id === selectedUserId);
      setSelectedUser(user || null);
    }
  }, [selectedUserId, users]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = users.filter(user =>
        user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.department || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.area_of_expertise || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.areas || []).some(a => a.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchTerm, users]);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('employees')
        .select('user_id, full_name, email, department, area_of_expertise, areas, is_active')
        .eq('is_active', true)
        .order('full_name');

      if (error) throw error;
      setUsers(data || []);
      setFilteredUsers(data || []);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (user: EmployeeUser) => {
    setSelectedUser(user);
    onSelect(user.user_id);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = () => {
    setSelectedUser(null);
    onSelect(undefined);
  };

  const getRoleLabel = (u: EmployeeUser) => {
    const parts = [u.department, u.area_of_expertise].filter(Boolean) as string[];
    const label = parts.join(' • ').trim();
    return label || 'Colaborador';
  };

  const getRoleColor = () => 'bg-gray-600';

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="relative">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
        {label}
      </label>

      {selectedUser ? (
        <div className="flex items-center gap-2 p-2 border rounded-md bg-gray-50 dark:bg-gray-800">
          <div className={`w-8 h-8 rounded-full ${getRoleColor()} flex items-center justify-center text-xs text-white font-medium`}>
            {getInitials(selectedUser.full_name)}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedUser.full_name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{getRoleLabel(selectedUser)}</p>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center gap-2 p-2 border rounded-md bg-white dark:bg-gray-800 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <User className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-500 dark:text-gray-400">{placeholder}</span>
        </button>
      )}

      {isOpen && (
        <div className="absolute z-50 mt-2 w-full bg-white dark:bg-gray-800 border rounded-lg shadow-lg max-h-80 overflow-hidden">
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar por nome, email ou cargo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                autoFocus
              />
            </div>
          </div>

          <div className="overflow-y-auto max-h-64">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-gray-500">Carregando...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">Nenhum usuário encontrado</div>
            ) : (
              filteredUsers.map((user) => (
                <button
                  key={user.user_id}
                  type="button"
                  onClick={() => handleSelect(user)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className={`w-10 h-10 rounded-full ${getRoleColor()} flex items-center justify-center text-sm text-white font-medium flex-shrink-0`}>
                    {getInitials(user.full_name)}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{user.full_name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{getRoleLabel(user)}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

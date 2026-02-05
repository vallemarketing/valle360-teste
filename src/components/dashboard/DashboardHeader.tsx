'use client';

import { useState } from 'react';
import { DashboardRole } from '@/types/dashboard';
import { ROLES_CONFIG, savePreferredRole } from '@/config/roles';
import { Button } from '@/components/ui/button';
import {
  Select,
 SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Bell, Search } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

interface DashboardHeaderProps {
  currentRole: DashboardRole;
  availableRoles: DashboardRole[];
  userName?: string;
  userAvatar?: string;
}

export function DashboardHeader({
  currentRole,
  availableRoles,
  userName,
  userAvatar,
}: DashboardHeaderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchOpen, setSearchOpen] = useState(false);

  const handleRoleChange = (newRole: string) => {
    const role = newRole as DashboardRole;
    savePreferredRole(role);

    // Atualizar URL com nova role
    const params = new URLSearchParams(searchParams);
    params.set('role', role);
    router.push(`/dashboard?${params.toString()}`);
  };

  const currentRoleConfig = ROLES_CONFIG[currentRole];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white dark:bg-gray-900 shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo e Role Selector */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1672d6] to-[#001533] flex items-center justify-center">
              <span className="text-white font-bold text-sm">V</span>
            </div>
            <span className="font-bold text-lg hidden sm:inline">Valle 360</span>
          </div>

          <div className="h-8 w-px bg-gray-200 dark:bg-gray-700" />

          <Select value={currentRole} onValueChange={handleRoleChange}>
            <SelectTrigger className="w-[180px] sm:w-[220px]" aria-label="Selecionar departamento">
              <SelectValue>
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: currentRoleConfig.color }}
                    aria-hidden="true"
                  />
                  <span className="truncate">{currentRoleConfig.label}</span>
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {availableRoles.map((role) => {
                const config = ROLES_CONFIG[role];
                return (
                  <SelectItem key={role} value={role}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: config.color }}
                        aria-hidden="true"
                      />
                      <span>{config.label}</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Search, Notificações e Perfil */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSearchOpen(!searchOpen)}
            aria-label="Buscar"
          >
            <Search className="w-5 h-5" />
          </Button>

          <Button variant="ghost" size="icon" aria-label="Notificações">
            <Bell className="w-5 h-5" />
          </Button>

          {userAvatar ? (
            <div className="w-8 h-8 rounded-full overflow-hidden">
              <img src={userAvatar} alt={userName || 'Usuário'} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                {userName?.charAt(0) || 'U'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Search Bar (expandido) */}
      {searchOpen && (
        <div className="border-t bg-gray-50 dark:bg-gray-800 p-4">
          <input
            type="search"
            placeholder="Buscar..."
            className="w-full px-4 py-2 rounded-md border bg-white dark:bg-gray-900"
            autoFocus
          />
        </div>
      )}
    </header>
  );
}

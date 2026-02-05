'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Search } from 'lucide-react';
import { ApprovalFlow } from '@/components/approvals/ApprovalFlow';

export default function AprovacoesPage() {
  const [viewMode, setViewMode] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/collaborator/approvals', { cache: 'no-store' });
        const json = await res.json().catch(() => null);
        if (!res.ok || !json?.success) throw new Error(json?.error || 'Falha ao carregar aprovações');
        setItems(Array.isArray(json?.items) ? json.items : []);
      } catch (e: any) {
        console.error('Falha ao carregar aprovações (colaborador):', e);
        setItems([]);
        setError(String(e?.message || 'Falha ao carregar aprovações'));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredItems = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it: any) => {
      const hay = `${it?.title || ''} ${it?.clientName || ''} ${it?.description || ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [items, searchTerm]);

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div 
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: 'var(--success-100)' }}
            >
              <CheckCircle className="w-7 h-7" style={{ color: 'var(--success-500)' }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                Aprovações
              </h1>
              <p style={{ color: 'var(--text-secondary)' }}>
                Gerencie aprovações de conteúdo
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar aprovação..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-64 px-4 py-2 pl-10 rounded-xl border"
              style={{
                backgroundColor: 'var(--bg-primary)',
                borderColor: 'var(--border-light)',
                color: 'var(--text-primary)'
              }}
            />
            <Search 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
              style={{ color: 'var(--text-tertiary)' }}
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {[
            { id: 'pending', label: 'Pendentes', color: 'var(--warning-500)' },
            { id: 'all', label: 'Todas', color: 'var(--primary-500)' },
            { id: 'approved', label: 'Aprovadas', color: 'var(--success-500)' },
            { id: 'rejected', label: 'Rejeitadas', color: 'var(--error-500)' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setViewMode(tab.id as any)}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap"
              style={{
                backgroundColor: viewMode === tab.id ? tab.color : 'var(--bg-primary)',
                color: viewMode === tab.id ? 'white' : 'var(--text-secondary)',
                border: `1px solid ${viewMode === tab.id ? tab.color : 'var(--border-light)'}`
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Approval Flow */}
        {error && (
          <div className="p-4 rounded-xl border" style={{ borderColor: 'var(--error-300)', backgroundColor: 'var(--bg-primary)' }}>
            <p style={{ color: 'var(--error-700)' }}>{error}</p>
          </div>
        )}

        <ApprovalFlow
          viewMode={viewMode}
          items={filteredItems}
          readOnly={true}
          isClientView={false}
        />
      </div>
    </div>
  );
}










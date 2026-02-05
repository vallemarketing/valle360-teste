'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, X, Calendar, User, Filter, Download } from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';

interface SearchResult {
  id: string;
  body: string;
  from_user_id: string;
  created_at: string;
  sender_name: string;
  rank: number;
}

interface MessageSearchProps {
  conversationId: string;
  conversationType: 'group' | 'direct';
  onResultClick: (messageId: string) => void;
  participants?: Array<{ id: string; full_name: string }>;
}

export function MessageSearch({
  conversationId,
  conversationType,
  onResultClick,
  participants = [],
}: MessageSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedSender, setSelectedSender] = useState('');

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const functionName =
        conversationType === 'group' ? 'search_group_messages' : 'search_direct_messages';

      const params: any = {
        p_search_query: searchQuery,
      };

      if (conversationType === 'group') {
        params.p_group_id = conversationId;
      } else {
        params.p_conversation_id = conversationId;
      }

      if (dateFrom) params.p_date_from = new Date(dateFrom).toISOString();
      if (dateTo) params.p_date_to = new Date(dateTo).toISOString();
      if (selectedSender) params.p_sender_id = selectedSender;

      const { data, error } = await supabase.rpc(functionName, params);

      if (error) throw error;

      setResults(data || []);

      await supabase.from('message_search_history').insert({
        user_id: (await supabase.auth.getUser()).data.user?.id,
        search_query: searchQuery,
        search_filters: {
          dateFrom,
          dateTo,
          selectedSender,
        },
        results_count: data?.length || 0,
      });
    } catch (error) {
      console.error('Erro ao buscar:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleExport = async () => {
    if (results.length === 0) return;

    const csv = [
      ['Data', 'Remetente', 'Mensagem'],
      ...results.map((r) => [
        new Date(r.created_at).toLocaleString('pt-BR'),
        r.sender_name,
        r.body.replace(/"/g, '""'),
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `mensagens_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const highlightText = (text: string, query: string) => {
    if (!query) return text;

    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="bg-yellow-200 dark:bg-yellow-800">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        title="Buscar mensagens"
      >
        <Search className="w-5 h-5" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Buscar Mensagens
              </h2>
              <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="p-4 border-b space-y-3">
              <div className="flex gap-2">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Digite sua busca..."
                  className="flex-1"
                />
                <Button onClick={handleSearch} disabled={isSearching || !searchQuery.trim()}>
                  <Search className="w-5 h-5" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  title="Filtros"
                >
                  <Filter className="w-5 h-5" />
                </Button>
              </div>

              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      <Calendar className="w-3 h-3 inline mr-1" />
                      Data Inicial
                    </label>
                    <Input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      <Calendar className="w-3 h-3 inline mr-1" />
                      Data Final
                    </label>
                    <Input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  {participants.length > 0 && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        <User className="w-3 h-3 inline mr-1" />
                        Remetente
                      </label>
                      <select
                        value={selectedSender}
                        onChange={(e) => setSelectedSender(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900"
                      >
                        <option value="">Todos</option>
                        {participants.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.full_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {isSearching ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : results.length === 0 ? (
                <div className="text-center py-8">
                  <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">
                    {searchQuery ? 'Nenhum resultado encontrado' : 'Digite algo para buscar'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {results.length} resultado(s) encontrado(s)
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExport}
                      title="Exportar resultados"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Exportar
                    </Button>
                  </div>

                  {results.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => {
                        onResultClick(result.id);
                        setIsOpen(false);
                      }}
                      className="w-full text-left p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {result.sender_name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(result.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                        {highlightText(result.body, searchQuery)}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </Dialog>
    </>
  );
}

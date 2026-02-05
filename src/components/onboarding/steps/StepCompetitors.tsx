'use client';

import { useState } from 'react';
import { Users, Search, Plus, X, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface StepCompetitorsProps {
  data: {
    segment: string;
    industry: string;
    competitors: any[];
  };
  onChange: (data: any) => void;
}

export function StepCompetitors({ data, onChange }: StepCompetitorsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedCompetitors, setSelectedCompetitors] = useState<any[]>(data.competitors || []);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    setIsSearching(true);
    
    // Simulação de busca
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Resultados mockados
    setSearchResults([
      { id: '1', username: searchTerm.replace('@', ''), name: searchTerm, followers_count: 15000 },
    ]);
    
    setIsSearching(false);
  };

  const handleAISuggestions = async () => {
    setIsSuggesting(true);
    
    // Simulação de IA buscando concorrentes
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Resultados mockados baseados no segmento
    const mockSuggestions = [
      { id: 'ai1', username: 'concorrente1', name: 'Concorrente Exemplo 1', followers_count: 25000, category: data.segment },
      { id: 'ai2', username: 'concorrente2', name: 'Concorrente Exemplo 2', followers_count: 18000, category: data.segment },
      { id: 'ai3', username: 'concorrente3', name: 'Concorrente Exemplo 3', followers_count: 32000, category: data.segment },
    ];
    
    setSearchResults(mockSuggestions);
    setIsSuggesting(false);
  };

  const addCompetitor = (competitor: any) => {
    if (selectedCompetitors.find(c => c.id === competitor.id)) return;
    if (selectedCompetitors.length >= 5) return;
    
    const updated = [...selectedCompetitors, competitor];
    setSelectedCompetitors(updated);
    onChange({ competitors: updated });
    setSearchResults(searchResults.filter(r => r.id !== competitor.id));
  };

  const removeCompetitor = (id: string) => {
    const updated = selectedCompetitors.filter(c => c.id !== id);
    setSelectedCompetitors(updated);
    onChange({ competitors: updated });
  };

  const formatFollowers = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-[#1672d6] to-[#001533] rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Users className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Monitore seus concorrentes
        </h2>
        <p className="text-gray-600">
          Selecione até 5 concorrentes para acompanhar suas estratégias
        </p>
      </div>

      {/* AI Suggestions Button */}
      <Button
        onClick={handleAISuggestions}
        disabled={isSuggesting}
        variant="outline"
        className="w-full border-2 border-dashed border-[#1672d6]/50 text-[#1672d6] hover:bg-blue-50"
      >
        {isSuggesting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Val está buscando concorrentes...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 mr-2" />
            Deixar a Val sugerir concorrentes
          </>
        )}
      </Button>

      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar @usuario..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-10"
          />
        </div>
        <Button onClick={handleSearch} disabled={isSearching}>
          {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buscar'}
        </Button>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Resultados:</p>
          {searchResults.map((result) => (
            <div 
              key={result.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#1672d6] to-[#001533] rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {result.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-gray-900">@{result.username}</p>
                  <p className="text-xs text-gray-500">{formatFollowers(result.followers_count)} seguidores</p>
                </div>
              </div>
              <Button 
                size="sm" 
                onClick={() => addCompetitor(result)}
                disabled={selectedCompetitors.length >= 5}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Selected Competitors */}
      {selectedCompetitors.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">
              Selecionados ({selectedCompetitors.length}/5):
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedCompetitors.map((competitor) => (
              <Badge 
                key={competitor.id} 
                variant="secondary"
                className="pl-3 pr-1 py-1.5 flex items-center gap-2"
              >
                @{competitor.username}
                <button 
                  onClick={() => removeCompetitor(competitor.id)}
                  className="hover:bg-gray-300 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-gray-500 text-center">
        Você pode adicionar ou remover concorrentes depois em Configurações
      </p>
    </div>
  );
}

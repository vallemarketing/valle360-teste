'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Building2, 
  Users, 
  TrendingUp, 
  DollarSign,
  MapPin,
  Phone,
  Mail,
  Plus,
  Search,
  MoreVertical,
  Eye,
  Edit,
  FileText,
  ArrowUpRight,
  Loader2,
  CheckCircle,
  AlertCircle,
  Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface Franchisee {
  id: string;
  name: string;
  owner_name: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  status: 'active' | 'pending' | 'inactive' | 'suspended';
  clients_count: number;
  monthly_revenue: number;
  contract_end: string;
  created_at: string;
}

interface FranchiseStats {
  total_franchisees: number;
  active_franchisees: number;
  total_clients: number;
  total_revenue: number;
  growth_percent: number;
}

export default function FranqueadosPage() {
  const [loading, setLoading] = useState(true);
  const [franchisees, setFranchisees] = useState<Franchisee[]>([]);
  const [stats, setStats] = useState<FranchiseStats>({
    total_franchisees: 0,
    active_franchisees: 0,
    total_clients: 0,
    total_revenue: 0,
    growth_percent: 0,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('todos');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/admin/franchisees', { cache: 'no-store' });
        const json = await res.json();
        
        if (json.success) {
          setFranchisees(json.franchisees || []);
          setStats(json.stats || stats);
        }
      } catch (e) {
        console.error('Error fetching franchisees:', e);
        // Use mock data for demo
        setFranchisees([
          {
            id: '1',
            name: 'Valle 360 São Paulo',
            owner_name: 'Carlos Silva',
            email: 'carlos@valle360sp.com',
            phone: '(11) 99999-0001',
            city: 'São Paulo',
            state: 'SP',
            status: 'active',
            clients_count: 45,
            monthly_revenue: 125000,
            contract_end: '2027-12-31',
            created_at: '2023-06-15',
          },
          {
            id: '2',
            name: 'Valle 360 Rio de Janeiro',
            owner_name: 'Ana Paula Mendes',
            email: 'ana@valle360rj.com',
            phone: '(21) 99999-0002',
            city: 'Rio de Janeiro',
            state: 'RJ',
            status: 'active',
            clients_count: 32,
            monthly_revenue: 89000,
            contract_end: '2026-08-15',
            created_at: '2024-01-10',
          },
          {
            id: '3',
            name: 'Valle 360 Belo Horizonte',
            owner_name: 'Roberto Costa',
            email: 'roberto@valle360bh.com',
            phone: '(31) 99999-0003',
            city: 'Belo Horizonte',
            state: 'MG',
            status: 'pending',
            clients_count: 0,
            monthly_revenue: 0,
            contract_end: '2028-03-01',
            created_at: '2025-12-01',
          },
        ]);
        setStats({
          total_franchisees: 3,
          active_franchisees: 2,
          total_clients: 77,
          total_revenue: 214000,
          growth_percent: 15,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredFranchisees = franchisees.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         f.owner_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         f.city.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === 'todos') return matchesSearch;
    return matchesSearch && f.status === activeTab;
  });

  const getStatusBadge = (status: Franchisee['status']) => {
    const config = {
      active: { label: 'Ativo', className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' },
      pending: { label: 'Pendente', className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30' },
      inactive: { label: 'Inativo', className: 'bg-gray-500/10 text-gray-600 border-gray-500/30' },
      suspended: { label: 'Suspenso', className: 'bg-red-500/10 text-red-600 border-red-500/30' },
    };
    const c = config[status];
    return <Badge variant="outline" className={c.className}>{c.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#1672d6]" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#001533] dark:text-white">Franqueados</h1>
          <p className="text-[#001533]/60 dark:text-white/60">Gerencie sua rede de franquias Valle 360</p>
        </div>
        <Button className="bg-[#1672d6] hover:bg-[#1260b5]">
          <Plus className="w-4 h-4 mr-2" />
          Novo Franqueado
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-[#001533]/10 dark:border-white/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#1672d6]/10">
                <Building2 className="w-5 h-5 text-[#1672d6]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#001533] dark:text-white">{stats.total_franchisees}</p>
                <p className="text-sm text-[#001533]/60 dark:text-white/60">Total Franqueados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#001533]/10 dark:border-white/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#001533] dark:text-white">{stats.active_franchisees}</p>
                <p className="text-sm text-[#001533]/60 dark:text-white/60">Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#001533]/10 dark:border-white/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#001533] dark:text-white">{stats.total_clients}</p>
                <p className="text-sm text-[#001533]/60 dark:text-white/60">Clientes na Rede</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#001533]/10 dark:border-white/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#001533] dark:text-white">
                  R$ {(stats.total_revenue / 1000).toFixed(0)}k
                </p>
                <p className="text-sm text-[#001533]/60 dark:text-white/60">Receita Mensal</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
          <TabsList className="bg-[#001533]/5 dark:bg-white/5">
            <TabsTrigger value="todos">Todos</TabsTrigger>
            <TabsTrigger value="active">Ativos</TabsTrigger>
            <TabsTrigger value="pending">Pendentes</TabsTrigger>
            <TabsTrigger value="inactive">Inativos</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#001533]/40 dark:text-white/40" />
          <Input
            placeholder="Buscar franqueado..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Franchisees List */}
      <div className="space-y-4">
        {filteredFranchisees.length === 0 ? (
          <Card className="border-[#001533]/10 dark:border-white/10">
            <CardContent className="py-12 text-center">
              <Building2 className="w-12 h-12 mx-auto mb-4 text-[#001533]/20 dark:text-white/20" />
              <p className="text-[#001533]/60 dark:text-white/60">
                Nenhum franqueado encontrado
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredFranchisees.map((franchisee, index) => (
            <motion.div
              key={franchisee.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="border-[#001533]/10 dark:border-white/10 hover:shadow-lg transition-all">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1672d6] to-[#001533] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                        {franchisee.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-[#001533] dark:text-white truncate">
                            {franchisee.name}
                          </h3>
                          {getStatusBadge(franchisee.status)}
                        </div>
                        <p className="text-sm text-[#001533]/60 dark:text-white/60 mt-1">
                          Proprietário: {franchisee.owner_name}
                        </p>
                        <div className="flex flex-wrap gap-3 mt-2 text-sm text-[#001533]/50 dark:text-white/50">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {franchisee.city}, {franchisee.state}
                          </span>
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {franchisee.email}
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {franchisee.phone}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 lg:gap-8">
                      <div className="text-center">
                        <p className="text-xl font-bold text-[#001533] dark:text-white">
                          {franchisee.clients_count}
                        </p>
                        <p className="text-xs text-[#001533]/60 dark:text-white/60">Clientes</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-bold text-[#001533] dark:text-white">
                          R$ {(franchisee.monthly_revenue / 1000).toFixed(0)}k
                        </p>
                        <p className="text-xs text-[#001533]/60 dark:text-white/60">Mensal</p>
                      </div>
                      <div className="text-center hidden sm:block">
                        <p className="text-sm font-medium text-[#001533] dark:text-white">
                          {new Date(franchisee.contract_end).toLocaleDateString('pt-BR')}
                        </p>
                        <p className="text-xs text-[#001533]/60 dark:text-white/60">Fim Contrato</p>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="w-4 h-4 mr-2" />
                            Ver Detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <FileText className="w-4 h-4 mr-2" />
                            Ver Contrato
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <ArrowUpRight className="w-4 h-4 mr-2" />
                            Acessar Painel
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

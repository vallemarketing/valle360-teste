// Exportar todas as views dos departamentos

export { SocialMediaView } from './SocialMediaView';
export { SalesView } from './SalesView';
export { HeadMarketingView } from './HeadMarketingView';

// Views simplificadas (placeholders funcionais)
import { KPICard } from '@/components/dashboard/KPICard';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Video,
  Palette,
  Globe,
  DollarSign,
  Users,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export function VideomakerView() {
  const stages = [
    { name: 'Pré-Produção', count: 5, color: '#6B7280' },
    { name: 'Gravação', count: 3, color: '#F59E0B' },
    { name: 'Edição', count: 7, color: '#3B82F6' },
    { name: 'Revisão', count: 4, color: '#8B5CF6' },
    { name: 'Entregue', count: 12, color: '#10B981' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <KPICard label="Projetos Ativos" value={19} icon={<Video className="w-5 h-5" />} color="#FF0000" />
        <KPICard label="Gravações Agendadas" value={8} icon={<Clock className="w-5 h-5" />} color="#F59E0B" />
        <KPICard label="Em Edição" value={7} icon={<Video className="w-5 h-5" />} color="#3B82F6" />
        <KPICard label="Entregues no Mês" value={12} icon={<CheckCircle2 className="w-5 h-5" />} color="#10B981" />
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Pipeline de Produção</h2>
        <Button><Plus className="w-4 h-4 mr-2" />Novo Projeto</Button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => (
          <div key={stage.name} className="w-72 flex-shrink-0">
            <div className="p-4 rounded-lg mb-4" style={{ backgroundColor: `${stage.color}20` }}>
              <h3 className="font-semibold" style={{ color: stage.color }}>{stage.name}</h3>
              <span className="text-2xl font-bold">{stage.count}</span>
            </div>
            <div className="space-y-2">
              {Array.from({ length: stage.count }).map((_, i) => (
                <Card key={i} className="p-3">
                  <p className="font-medium text-sm">Vídeo Cliente {i + 1}</p>
                  <p className="text-xs text-gray-500">Prazo: {2 + i} dias</p>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DesignView() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <KPICard label="Briefings Ativos" value={23} icon={<Palette className="w-5 h-5" />} color="#7B68EE" />
        <KPICard label="Em Produção" value={15} icon={<Clock className="w-5 h-5" />} color="#F59E0B" />
        <KPICard label="Em Aprovação" value={8} icon={<AlertCircle className="w-5 h-5" />} color="#3B82F6" />
        <KPICard label="Assets no Banco" value={342} icon={<CheckCircle2 className="w-5 h-5" />} color="#10B981" />
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Briefings e Produções</h2>
        <Button><Plus className="w-4 h-4 mr-2" />Novo Briefing</Button>
      </div>

      <Card className="p-6">
        <h3 className="font-semibold mb-4">Briefings Recentes</h3>
        <div className="space-y-2">
          {['Banner Instagram', 'Logo Novo Cliente', 'Posts Feed', 'Stories Campanha', 'Arte Apresentação'].map((item, i) => (
            <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">{item}</p>
                <p className="text-sm text-gray-500">Cliente XYZ</p>
              </div>
              <Badge className={i < 2 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}>
                {i < 2 ? 'Em Produção' : 'Aprovado'}
              </Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export function WebDesignView() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <KPICard label="Sites Ativos" value={12} icon={<Globe className="w-5 h-5" />} color="#4169E1" />
        <KPICard label="Tickets Abertos" value={18} icon={<AlertCircle className="w-5 h-5" />} color="#F59E0B" />
        <KPICard label="Performance Média" value={92} icon={<CheckCircle2 className="w-5 h-5" />} color="#10B981" />
        <KPICard label="Deploys no Mês" value={34} icon={<CheckCircle2 className="w-5 h-5" />} color="#8B5CF6" />
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Projetos e Manutenções</h2>
        <Button><Plus className="w-4 h-4 mr-2" />Novo Ticket</Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Projetos Ativos</h3>
          {['Site Institucional', 'E-commerce', 'Landing Page', 'Blog'].map((item, i) => (
            <div key={i} className="flex items-center justify-between p-3 border-b">
              <span>{item}</span>
              <Badge className="bg-blue-100 text-blue-800">Em Desenvolvimento</Badge>
            </div>
          ))}
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-4">Tickets Prioritários</h3>
          {['Bug no carrinho', 'Atualizar imagens', 'Otimizar velocidade', 'Ajuste responsivo'].map((item, i) => (
            <div key={i} className="flex items-center justify-between p-3 border-b">
              <span>{item}</span>
              <Badge className={i === 0 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}>
                {i === 0 ? 'Crítico' : 'Alta'}
              </Badge>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

export function FinanceView() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <KPICard label="Recebido no Mês" value={125000} format="currency" icon={<DollarSign className="w-5 h-5" />} color="#10B981" />
        <KPICard label="A Receber" value={85000} format="currency" icon={<Clock className="w-5 h-5" />} color="#F59E0B" />
        <KPICard label="Faturas Abertas" value={12} icon={<AlertCircle className="w-5 h-5" />} color="#3B82F6" />
        <KPICard label="Em Atraso" value={3} icon={<AlertCircle className="w-5 h-5" />} color="#EF4444" />
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestão Financeira</h2>
        <Button><Plus className="w-4 h-4 mr-2" />Nova Fatura</Button>
      </div>

      <Card className="p-6">
        <h3 className="font-semibold mb-4">Faturas Recentes</h3>
        <table className="w-full">
          <thead><tr className="border-b"><th className="text-left p-2">Cliente</th><th className="text-left p-2">Valor</th><th className="text-left p-2">Vencimento</th><th className="text-left p-2">Status</th></tr></thead>
          <tbody>
            {[
              { client: 'Empresa A', value: 15000, due: '05/11', status: 'paid' },
              { client: 'Empresa B', value: 8500, due: '10/11', status: 'open' },
              { client: 'Empresa C', value: 12000, due: '15/11', status: 'open' },
              { client: 'Empresa D', value: 6000, due: '01/11', status: 'overdue' },
            ].map((inv, i) => (
              <tr key={i} className="border-b">
                <td className="p-2">{inv.client}</td>
                <td className="p-2">R$ {inv.value.toLocaleString()}</td>
                <td className="p-2">{inv.due}</td>
                <td className="p-2">
                  <Badge className={
                    inv.status === 'paid' ? 'bg-green-100 text-green-800' :
                    inv.status === 'overdue' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                  }>
                    {inv.status === 'paid' ? 'Pago' : inv.status === 'overdue' ? 'Atrasado' : 'Aberto'}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

export function HRView() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <KPICard label="Colaboradores" value={45} icon={<Users className="w-5 h-5" />} color="#8B5CF6" />
        <KPICard label="Solicitações Pendentes" value={8} icon={<Clock className="w-5 h-5" />} color="#F59E0B" />
        <KPICard label="Performance Média" value={87} format="percentage" icon={<CheckCircle2 className="w-5 h-5" />} color="#10B981" />
        <KPICard label="Aprovadas no Mês" value={23} icon={<CheckCircle2 className="w-5 h-5" />} color="#3B82F6" />
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestão de Pessoas</h2>
        <Button><Plus className="w-4 h-4 mr-2" />Nova Solicitação</Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Solicitações Pendentes</h3>
          {['Home Office - João Silva', 'Folga - Maria Santos', 'Reembolso - Pedro Costa'].map((item, i) => (
            <div key={i} className="flex items-center justify-between p-3 border-b">
              <span>{item}</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">Aprovar</Button>
                <Button size="sm" variant="outline">Rejeitar</Button>
              </div>
            </div>
          ))}
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-4">Ranking de Performance</h3>
          {['Ana Silva - 95', 'Carlos Santos - 92', 'Maria Lima - 90', 'João Costa - 88'].map((item, i) => (
            <div key={i} className="flex items-center gap-3 p-3 border-b">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${i === 0 ? 'bg-yellow-500' : 'bg-gray-400'}`}>
                {i + 1}
              </div>
              <span className="flex-1">{item}</span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

export function AdminView() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Painel Administrativo</h2>
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-6">
          <h3 className="font-semibold mb-2">Usuários</h3>
          <p className="text-3xl font-bold">145</p>
        </Card>
        <Card className="p-6">
          <h3 className="font-semibold mb-2">Organizações</h3>
          <p className="text-3xl font-bold">8</p>
        </Card>
        <Card className="p-6">
          <h3 className="font-semibold mb-2">Sistema</h3>
          <Badge className="bg-green-100 text-green-800">Operacional</Badge>
        </Card>
      </div>
    </div>
  );
}

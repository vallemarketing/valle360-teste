'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  Users,
  Target,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  BarChart3,
  Calendar,
  Zap,
  Eye,
  ThumbsUp,
  Play,
  Image as ImageIcon,
  Globe,
  ShoppingCart,
} from 'lucide-react';

type UserRole =
  | 'super_admin'
  | 'gestor_trafego'
  | 'social_media'
  | 'videomaker'
  | 'designer_grafico'
  | 'web_designer'
  | 'head_marketing'
  | 'financeiro'
  | 'rh'
  | 'comercial';

export default function AppDashboard() {
  const [userRole] = useState<UserRole>('gestor_trafego');
  const [selectedClient, setSelectedClient] = useState('Cliente A');

  const clients = ['Cliente A', 'Cliente B', 'Cliente C', 'Cliente D'];

  const renderGestorTrafegoContent = () => (
    <>
      <div className="mb-6">
        <select
          value={selectedClient}
          onChange={(e) => setSelectedClient(e.target.value)}
          className="px-4 py-2 rounded-lg border-2 border-valle-silver-300 bg-white hover:border-valle-blue-500 focus:border-valle-blue-600 focus:ring-2 focus:ring-valle-blue-200 transition-all"
        >
          {clients.map((client) => (
            <option key={client} value={client}>
              {client}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card className="bg-gradient-to-br from-valle-blue-50 to-white border-valle-blue-200 hover:shadow-lg transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-valle-navy-700">ROAS</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-valle-blue-600">4.2x</div>
            <p className="text-xs text-valle-silver-600">+12% vs mês anterior</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-white border-green-200 hover:shadow-lg transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-valle-navy-700">Conversões</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">187</div>
            <p className="text-xs text-valle-silver-600">+23 esta semana</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-valle-silver-50 to-white border-valle-silver-300 hover:shadow-lg transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-valle-navy-700">Gasto Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-valle-silver-700">R$ 12.5k</div>
            <p className="text-xs text-valle-silver-600">R$ 1.2k restante</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-valle-blue-50 to-white border-valle-blue-200 hover:shadow-lg transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-valle-navy-700">CPC Médio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-valle-blue-700">R$ 2.34</div>
            <p className="text-xs text-valle-silver-600">-8% vs semana passada</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6 border-2 border-valle-blue-300 bg-valle-blue-50">
        <CardContent className="flex items-center gap-3 p-4">
          <AlertCircle className="w-5 h-5 text-valle-blue-600" />
          <div className="flex-1">
            <p className="font-medium text-valle-navy-800">Atenção: Créditos Baixos</p>
            <p className="text-sm text-valle-navy-600">
              Restam apenas R$ 1.200 em créditos. Solicite recarga ao cliente.
            </p>
          </div>
          <Button className="bg-gradient-to-r from-valle-blue-600 to-valle-blue-700 hover:from-valle-blue-700 hover:to-valle-blue-800 text-white">
            Notificar Cliente
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-valle-silver-200">
          <CardHeader>
            <CardTitle className="text-valle-navy-800">Campanhas Ativas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { name: 'Instagram Ads - Novembro', budget: 'R$ 5.000', spent: 'R$ 3.200', status: 'active' },
              { name: 'Google Ads - Search', budget: 'R$ 4.000', spent: 'R$ 4.000', status: 'completed' },
              { name: 'Facebook Ads - Engajamento', budget: 'R$ 3.500', spent: 'R$ 2.100', status: 'active' },
            ].map((campaign, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-valle-silver-50 rounded-lg border border-valle-silver-200">
                <div className="flex-1">
                  <p className="font-medium text-sm text-valle-navy-700">{campaign.name}</p>
                  <p className="text-xs text-valle-silver-600">
                    {campaign.spent} de {campaign.budget}
                  </p>
                </div>
                <Badge className={campaign.status === 'active' ? 'bg-valle-blue-600 text-white' : 'bg-green-600 text-white'}>
                  {campaign.status === 'active' ? 'Ativa' : 'Concluída'}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-valle-silver-200">
          <CardHeader>
            <CardTitle className="text-valle-navy-800">Performance vs Meta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-valle-navy-700">ROAS</span>
                <span className="text-sm text-green-600">105% da meta</span>
              </div>
              <div className="w-full bg-valle-silver-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: '105%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-valle-navy-700">Conversões</span>
                <span className="text-sm text-green-600">93% da meta</span>
              </div>
              <div className="w-full bg-valle-silver-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: '93%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-valle-navy-700">CPC</span>
                <span className="text-sm text-valle-silver-600">112% da meta</span>
              </div>
              <div className="w-full bg-valle-silver-200 rounded-full h-2">
                <div className="bg-valle-silver-600 h-2 rounded-full" style={{ width: '112%' }}></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );

  const renderDefaultContent = () => (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card className="border-valle-silver-200 hover:shadow-lg transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-valle-navy-700">Tarefas Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-valle-navy-800">12</div>
            <p className="text-xs text-valle-silver-600">3 atrasadas</p>
          </CardContent>
        </Card>

        <Card className="border-valle-silver-200 hover:shadow-lg transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-valle-navy-700">Aprovações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-valle-navy-800">5</div>
            <p className="text-xs text-valle-silver-600">Aguardando revisão</p>
          </CardContent>
        </Card>

        <Card className="border-valle-silver-200 hover:shadow-lg transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-valle-navy-700">Eventos Hoje</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-valle-navy-800">3</div>
            <p className="text-xs text-valle-silver-600">Próxima em 2h</p>
          </CardContent>
        </Card>

        <Card className="border-valle-silver-200 hover:shadow-lg transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-valle-navy-700">Mensagens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-valle-navy-800">8</div>
            <p className="text-xs text-valle-silver-600">Não lidas</p>
          </CardContent>
        </Card>
      </div>
    </>
  );

  const renderContent = () => {
    switch (userRole) {
      case 'gestor_trafego':
        return renderGestorTrafegoContent();
      default:
        return renderDefaultContent();
    }
  };

  const getRoleTitle = () => {
    const titles: Record<UserRole, string> = {
      gestor_trafego: 'Gestão de Tráfego Pago',
      social_media: 'Gestão de Redes Sociais',
      videomaker: 'Produção de Vídeos',
      designer_grafico: 'Design Gráfico',
      web_designer: 'Desenvolvimento Web',
      comercial: 'Comercial e Vendas',
      financeiro: 'Gestão Financeira',
      rh: 'Recursos Humanos',
      head_marketing: 'Head de Marketing',
      super_admin: 'Visão Geral',
    };
    return titles[userRole] || 'Visão Geral';
  };

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-bold text-valle-navy-900">Dashboard</h1>
        <p className="text-valle-silver-600 mt-2">{getRoleTitle()}</p>
      </div>

      {renderContent()}
    </div>
  );
}

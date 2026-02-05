'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Home, Calendar, DollarSign, Upload, X, FileText, CheckCircle, XCircle, Clock } from 'lucide-react';

interface Request {
  id: number;
  type: 'home_office' | 'day_off' | 'reimbursement';
  user: string;
  userRole: string;
  description: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
  amount?: string;
  attachment?: string;
  reason?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
}

type FilterType = 'all' | 'pending' | 'approved' | 'rejected';
type RequestType = 'all' | 'home_office' | 'day_off' | 'reimbursement';

export default function SolicitacoesPage() {
  const [filterStatus, setFilterStatus] = useState<FilterType>('all');
  const [filterType, setFilterType] = useState<RequestType>('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);

  const requests: Request[] = [
    {
      id: 1,
      type: 'home_office',
      user: 'Ana Lima',
      userRole: 'Gestor de Tráfego',
      description: 'Trabalho remoto para acompanhar campanha',
      date: '15/11/2025',
      status: 'pending',
      reason: 'Necessário acompanhar métricas de perto durante o dia todo',
    },
    {
      id: 2,
      type: 'reimbursement',
      user: 'Carlos Souza',
      userRole: 'Comercial',
      description: 'Almoço com cliente prospectado',
      date: '10/11/2025',
      status: 'pending',
      amount: 'R$ 250,00',
      attachment: 'nota_fiscal.pdf',
      reason: 'Reunião de fechamento com cliente potencial',
    },
    {
      id: 3,
      type: 'day_off',
      user: 'Julia Alves',
      userRole: 'Designer',
      description: 'Folga compensatória',
      date: '20-22/11/2025',
      status: 'approved',
      approvedBy: 'RH',
      approvedAt: '08/11/2025 14:30',
    },
    {
      id: 4,
      type: 'home_office',
      user: 'Pedro Costa',
      userRole: 'Videomaker',
      description: 'Edição de vídeo em casa',
      date: '12/11/2025',
      status: 'approved',
      approvedBy: 'Super Admin',
      approvedAt: '11/11/2025 09:15',
      reason: 'Equipamento de edição mais potente em casa',
    },
    {
      id: 5,
      type: 'reimbursement',
      user: 'Maria Santos',
      userRole: 'Social Media',
      description: 'Táxi para evento de cliente',
      date: '05/11/2025',
      status: 'rejected',
      amount: 'R$ 85,00',
      rejectionReason: 'Transporte não pré-aprovado. Usar Uber corporativo.',
    },
    {
      id: 6,
      type: 'day_off',
      user: 'Roberto Lima',
      userRole: 'Web Designer',
      description: 'Viagem pessoal',
      date: '18-19/11/2025',
      status: 'pending',
      reason: 'Compromisso familiar',
    },
  ];

  const filteredRequests = requests.filter((req) => {
    const matchesStatus = filterStatus === 'all' || req.status === filterStatus;
    const matchesType = filterType === 'all' || req.type === filterType;
    return matchesStatus && matchesType;
  });

  const getIcon = (type: Request['type']) => {
    const icons = {
      home_office: <Home className="w-5 h-5 text-blue-600" />,
      day_off: <Calendar className="w-5 h-5 text-purple-600" />,
      reimbursement: <DollarSign className="w-5 h-5 text-green-600" />,
    };
    return icons[type];
  };

  const getTypeLabel = (type: Request['type']) => {
    const labels = {
      home_office: 'Home Office',
      day_off: 'Folga',
      reimbursement: 'Reembolso',
    };
    return labels[type];
  };

  const getStatusBadge = (status: Request['status']) => {
    const variants = {
      pending: { color: 'bg-amber-100 text-amber-700', icon: <Clock className="w-3 h-3" />, label: 'Pendente' },
      approved: { color: 'bg-green-100 text-green-700', icon: <CheckCircle className="w-3 h-3" />, label: 'Aprovado' },
      rejected: { color: 'bg-red-100 text-red-700', icon: <XCircle className="w-3 h-3" />, label: 'Recusado' },
    };
    const variant = variants[status];
    return (
      <Badge className={`${variant.color} flex items-center gap-1`}>
        {variant.icon}
        {variant.label}
      </Badge>
    );
  };

  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === 'pending').length,
    approved: requests.filter((r) => r.status === 'approved').length,
    rejected: requests.filter((r) => r.status === 'rejected').length,
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Solicitações</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Gerencie home office, folgas e reembolsos
          </p>
        </div>
        <Button className="bg-primary hover:bg-[#1260b5]">
          <Plus className="w-4 h-4 mr-2" />
          Nova Solicitação
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              </div>
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilterStatus('pending')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pendentes</p>
                <p className="text-2xl font-bold text-primary">{stats.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-amber-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilterStatus('approved')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Aprovados</p>
                <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilterStatus('rejected')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Recusados</p>
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle>Todas as Solicitações</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={filterStatus === 'all' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('all')}
                className={filterStatus === 'all' ? 'bg-primary hover:bg-[#1260b5]' : ''}
              >
                Todos
              </Button>
              <Button
                size="sm"
                variant={filterStatus === 'pending' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('pending')}
                className={filterStatus === 'pending' ? 'bg-primary hover:bg-[#1260b5]' : ''}
              >
                Pendentes
              </Button>
              <Button
                size="sm"
                variant={filterStatus === 'approved' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('approved')}
                className={filterStatus === 'approved' ? 'bg-primary hover:bg-[#1260b5]' : ''}
              >
                Aprovados
              </Button>
              <Button
                size="sm"
                variant={filterStatus === 'rejected' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('rejected')}
                className={filterStatus === 'rejected' ? 'bg-primary hover:bg-[#1260b5]' : ''}
              >
                Recusados
              </Button>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button
              size="sm"
              variant={filterType === 'all' ? 'default' : 'outline'}
              onClick={() => setFilterType('all')}
              className={filterType === 'all' ? 'bg-primary hover:bg-[#1260b5]' : ''}
            >
              Todos Tipos
            </Button>
            <Button
              size="sm"
              variant={filterType === 'home_office' ? 'default' : 'outline'}
              onClick={() => setFilterType('home_office')}
              className={filterType === 'home_office' ? 'bg-primary hover:bg-[#1260b5]' : ''}
            >
              <Home className="w-3 h-3 mr-1" />
              Home Office
            </Button>
            <Button
              size="sm"
              variant={filterType === 'day_off' ? 'default' : 'outline'}
              onClick={() => setFilterType('day_off')}
              className={filterType === 'day_off' ? 'bg-primary hover:bg-[#1260b5]' : ''}
            >
              <Calendar className="w-3 h-3 mr-1" />
              Folga
            </Button>
            <Button
              size="sm"
              variant={filterType === 'reimbursement' ? 'default' : 'outline'}
              onClick={() => setFilterType('reimbursement')}
              className={filterType === 'reimbursement' ? 'bg-primary hover:bg-[#1260b5]' : ''}
            >
              <DollarSign className="w-3 h-3 mr-1" />
              Reembolso
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredRequests.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-lg font-medium">Nenhuma solicitação encontrada</p>
                <p className="text-sm mt-1">Tente ajustar os filtros</p>
              </div>
            ) : (
              filteredRequests.map((request) => (
                <Card key={request.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                          {getIcon(request.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-gray-900 dark:text-white">
                              {getTypeLabel(request.type)}
                            </h3>
                            <Badge variant="outline" className="text-xs">
                              {request.type === 'reimbursement' && request.amount}
                              {request.type !== 'reimbursement' && request.date}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                            {request.description}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
                            <span className="font-medium">{request.user}</span>
                            <span>•</span>
                            <span>{request.userRole}</span>
                            {request.type === 'reimbursement' && (
                              <>
                                <span>•</span>
                                <span>{request.date}</span>
                              </>
                            )}
                          </div>
                          {request.reason && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 italic">
                              Motivo: {request.reason}
                            </p>
                          )}
                          {request.attachment && (
                            <div className="flex items-center gap-2 mt-2">
                              <FileText className="w-3 h-3 text-gray-400" />
                              <span className="text-xs text-blue-600 hover:underline cursor-pointer">
                                {request.attachment}
                              </span>
                            </div>
                          )}
                          {request.approvedBy && (
                            <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                              Aprovado por {request.approvedBy} em {request.approvedAt}
                            </p>
                          )}
                          {request.rejectionReason && (
                            <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                              Motivo da recusa: {request.rejectionReason}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {getStatusBadge(request.status)}
                        {request.status === 'pending' && (
                          <div className="flex gap-2 mt-2">
                            <Button size="sm" className="bg-green-600 hover:bg-green-700">
                              Aprovar
                            </Button>
                            <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                              Recusar
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { MessageSquare, Check, X, Clock, Calendar } from 'lucide-react';

interface MeetingRequest {
  id: string;
  title: string;
  description?: string;
  meeting_type: string;
  proposed_dates: string[];
  status: string;
  created_at: string;
}

export default function ReunioesPage() {
  const [requests, setRequests] = useState<MeetingRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('meeting_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setRequests(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const { error } = await supabase
        .from('meeting_requests')
        .update({ status: 'accepted' })
        .eq('id', id);

      if (!error) {
        await supabase.rpc('log_audit_event', {
          p_action_type: 'APPROVE',
          p_table_name: 'meeting_requests',
          p_record_id: id,
        });
        fetchRequests();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleReject = async (id: string) => {
    try {
      const { error } = await supabase
        .from('meeting_requests')
        .update({ status: 'rejected' })
        .eq('id', id);

      if (!error) {
        await supabase.rpc('log_audit_event', {
          p_action_type: 'REJECT',
          p_table_name: 'meeting_requests',
          p_record_id: id,
        });
        fetchRequests();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const approvedRequests = requests.filter(r => r.status === 'accepted');

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-bold text-valle-navy-900">Solicitações de Reunião</h1>
        <p className="text-valle-silver-600 mt-2">Gerencie pedidos de reunião da equipe</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <Clock className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-3xl font-bold text-valle-navy-900">{pendingRequests.length}</p>
            <p className="text-sm text-valle-silver-600">Pendentes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <Check className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-3xl font-bold text-valle-navy-900">{approvedRequests.length}</p>
            <p className="text-sm text-valle-silver-600">Aprovadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <X className="w-8 h-8 text-red-600 mx-auto mb-2" />
            <p className="text-3xl font-bold text-valle-navy-900">
              {requests.filter(r => r.status === 'rejected').length}
            </p>
            <p className="text-sm text-valle-silver-600">Rejeitadas</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Solicitações Pendentes</CardTitle>
        </CardHeader>
        <CardContent>
          {pendingRequests.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-valle-silver-400 mx-auto mb-3" />
              <p className="text-valle-silver-600">Nenhuma solicitação pendente</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingRequests.map((request) => (
                <div key={request.id} className="p-4 bg-valle-silver-50 rounded-lg border-l-4 border-primary">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-valle-navy-900 mb-1">{request.title}</h3>
                      {request.description && (
                        <p className="text-sm text-valle-silver-600 mb-2">{request.description}</p>
                      )}
                      <div className="flex items-center gap-2 text-sm text-valle-silver-600">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {request.proposed_dates.length} data(s) propostas
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        onClick={() => handleApprove(request.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReject(request.id)}
                        className="border-red-500 text-red-600 hover:bg-red-50"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

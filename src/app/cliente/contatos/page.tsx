'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Plus, Search, Filter, Instagram, Mail, Phone, 
  Tag, MoreVertical, RefreshCw, Loader2, ChevronLeft, ChevronRight,
  Edit2, Trash2, MessageCircle, ExternalLink, X, Check
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { toast } from 'sonner';

interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  instagram_handle?: string;
  profile_picture_url?: string;
  tags: string[];
  category: string;
  status: string;
  source: string;
  notes?: string;
  last_interaction_at?: string;
  total_interactions: number;
  created_at: string;
}

interface Tag {
  id: string;
  name: string;
  color: string;
}

export default function ClienteContatosPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showNewModal, setShowNewModal] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [showSyncModal, setShowSyncModal] = useState(false);

  useEffect(() => {
    loadContacts();
  }, [search, categoryFilter, page]);

  const loadContacts = async () => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      });
      if (search) params.set('search', search);
      if (categoryFilter) params.set('category', categoryFilter);

      const response = await fetch(`/api/client/contacts?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setContacts(data.contacts);
        setTags(data.tags);
        setStats(data.stats);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Erro ao carregar contatos:', error);
      toast.error('Erro ao carregar contatos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncInstagram = async (syncType: string) => {
    setIsSyncing(true);
    try {
      const response = await fetch('/api/client/contacts/sync-instagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ syncType })
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(data.message);
        loadContacts();
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      console.error('Erro ao sincronizar:', error);
      toast.error('Erro ao sincronizar Instagram');
    } finally {
      setIsSyncing(false);
      setShowSyncModal(false);
    }
  };

  const handleDeleteContact = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este contato?')) return;

    try {
      const response = await fetch(`/api/client/contacts?id=${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Contato excluído');
        loadContacts();
      } else {
        toast.error('Erro ao excluir contato');
      }
    } catch (error) {
      console.error('Erro ao excluir:', error);
      toast.error('Erro ao excluir contato');
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      lead: 'bg-blue-100 text-blue-800',
      customer: 'bg-green-100 text-green-800',
      vip: 'bg-purple-100 text-purple-800',
      partner: 'bg-amber-100 text-amber-800',
      outros: 'bg-gray-100 text-gray-800'
    };
    return colors[category] || colors.outros;
  };

  const getSourceLabel = (source: string) => {
    const labels: Record<string, string> = {
      manual: 'Manual',
      instagram_dm: 'Instagram DM',
      instagram_comment: 'Comentário',
      instagram_mention: 'Menção',
      form: 'Formulário'
    };
    return labels[source] || source;
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Meus Contatos
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Gerencie seus leads e clientes
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowSyncModal(true)}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Instagram className="w-4 h-4 mr-2" />
            )}
            Sincronizar Instagram
          </Button>
          <Button 
            className="bg-primary hover:bg-[#1260b5]"
            onClick={() => setShowNewModal(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Contato
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total', value: Object.values(stats).reduce((a, b) => a + b, 0), color: 'bg-gray-100' },
          { label: 'Leads', value: stats.lead || 0, color: 'bg-blue-100' },
          { label: 'Clientes', value: stats.customer || 0, color: 'bg-green-100' },
          { label: 'VIP', value: stats.vip || 0, color: 'bg-purple-100' },
          { label: 'Parceiros', value: stats.partner || 0, color: 'bg-amber-100' }
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className={stat.color}>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm opacity-70">{stat.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nome, email ou Instagram..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas</SelectItem>
                <SelectItem value="lead">Leads</SelectItem>
                <SelectItem value="customer">Clientes</SelectItem>
                <SelectItem value="vip">VIP</SelectItem>
                <SelectItem value="partner">Parceiros</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Contacts List */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : contacts.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum contato encontrado</p>
              <p className="text-sm text-gray-400">
                Adicione contatos manualmente ou sincronize do Instagram
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {contacts.map((contact, index) => (
                <motion.div
                  key={contact.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.02 }}
                  className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                      {contact.profile_picture_url ? (
                        <img 
                          src={contact.profile_picture_url} 
                          alt="" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary-light to-primary flex items-center justify-center text-white font-bold">
                          {contact.name?.charAt(0).toUpperCase() || '?'}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium truncate">{contact.name}</h3>
                        <Badge className={getCategoryColor(contact.category)}>
                          {contact.category}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        {contact.instagram_handle && (
                          <span className="flex items-center gap-1">
                            <Instagram className="w-3 h-3" />
                            @{contact.instagram_handle}
                          </span>
                        )}
                        {contact.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {contact.email}
                          </span>
                        )}
                        {contact.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {contact.phone}
                          </span>
                        )}
                      </div>
                      {contact.tags.length > 0 && (
                        <div className="flex items-center gap-1 mt-2">
                          {contact.tags.slice(0, 3).map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {contact.tags.length > 3 && (
                            <span className="text-xs text-gray-400">
                              +{contact.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Source & Actions */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 hidden md:block">
                        {getSourceLabel(contact.source)}
                      </span>
                      
                      <div className="flex gap-1">
                        {contact.instagram_handle && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(`https://instagram.com/${contact.instagram_handle}`, '_blank')}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingContact(contact)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-600"
                          onClick={() => handleDeleteContact(contact.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 p-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-gray-500">
                Página {page} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sync Modal */}
      <AnimatePresence>
        {showSyncModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowSyncModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold mb-4">Sincronizar do Instagram</h3>
              <p className="text-gray-500 mb-6">
                Escolha o tipo de contatos que deseja importar:
              </p>
              
              <div className="space-y-3">
                {[
                  { type: 'dms', label: 'Mensagens Diretas', desc: 'Pessoas que enviaram DMs' },
                  { type: 'comments', label: 'Comentários', desc: 'Pessoas que comentaram seus posts' },
                  { type: 'mentions', label: 'Menções', desc: 'Pessoas que te mencionaram' }
                ].map(option => (
                  <button
                    key={option.type}
                    onClick={() => handleSyncInstagram(option.type)}
                    disabled={isSyncing}
                    className="w-full p-4 text-left rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    <p className="font-medium">{option.label}</p>
                    <p className="text-sm text-gray-500">{option.desc}</p>
                  </button>
                ))}
              </div>

              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => setShowSyncModal(false)}
              >
                Cancelar
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New/Edit Contact Modal */}
      <AnimatePresence>
        {(showNewModal || editingContact) && (
          <ContactModal
            contact={editingContact}
            onClose={() => {
              setShowNewModal(false);
              setEditingContact(null);
            }}
            onSave={() => {
              setShowNewModal(false);
              setEditingContact(null);
              loadContacts();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Contact Modal Component
function ContactModal({ 
  contact, 
  onClose, 
  onSave 
}: { 
  contact: Contact | null; 
  onClose: () => void; 
  onSave: () => void;
}) {
  const [formData, setFormData] = useState({
    name: contact?.name || '',
    email: contact?.email || '',
    phone: contact?.phone || '',
    instagram_handle: contact?.instagram_handle || '',
    category: contact?.category || 'lead',
    notes: contact?.notes || '',
    tags: contact?.tags || []
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    setIsSaving(true);
    try {
      const url = '/api/client/contacts';
      const method = contact ? 'PATCH' : 'POST';
      const body = contact 
        ? { id: contact.id, ...formData }
        : formData;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(contact ? 'Contato atualizado!' : 'Contato criado!');
        onSave();
      } else {
        toast.error(data.error || 'Erro ao salvar contato');
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar contato');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold">
            {contact ? 'Editar Contato' : 'Novo Contato'}
          </h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="space-y-4">
          <div>
            <Label>Nome *</Label>
            <Input
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nome do contato"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@exemplo.com"
              />
            </div>
            <div>
              <Label>Telefone</Label>
              <Input
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(11) 99999-9999"
              />
            </div>
          </div>

          <div>
            <Label>Instagram</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">@</span>
              <Input
                value={formData.instagram_handle}
                onChange={e => setFormData({ ...formData, instagram_handle: e.target.value })}
                placeholder="usuario"
                className="pl-8"
              />
            </div>
          </div>

          <div>
            <Label>Categoria</Label>
            <Select 
              value={formData.category} 
              onValueChange={v => setFormData({ ...formData, category: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lead">Lead</SelectItem>
                <SelectItem value="customer">Cliente</SelectItem>
                <SelectItem value="vip">VIP</SelectItem>
                <SelectItem value="partner">Parceiro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Notas</Label>
            <textarea
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Observações sobre o contato..."
              className="w-full p-3 border rounded-lg resize-none focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:border-gray-600"
              rows={3}
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            className="flex-1 bg-primary hover:bg-[#1260b5]" 
            onClick={handleSubmit}
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Check className="w-4 h-4 mr-2" />
            )}
            {contact ? 'Atualizar' : 'Criar'}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
